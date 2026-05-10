/**
 * Fetches `bug`-labeled issues from GitHub and writes `reports/defects.json`,
 * which the QA Metrics Dashboard consumes via `__DEFECTS_URL__`.
 *
 * Token resolution order (first non-empty wins):
 *   1. GITHUB_TOKEN env var       (CI: github.token; local: .env)
 *   2. GH_TOKEN env var           (alternative name used by gh CLI)
 *   3. `gh auth token` shell-out  (uses the developer's local gh login)
 *
 * Repo resolution order:
 *   1. DEFECTS_REPO env var ("owner/name") — explicit override
 *   2. GITHUB_REPOSITORY env var — set automatically inside GitHub Actions
 *   3. `git remote get-url origin` — parsed for owner/name
 *
 * If we can't resolve a token OR a repo, we exit 0 with a friendly warning
 * and DO NOT touch `reports/defects.json` — the dashboard then falls back
 * to its static demo numbers.
 *
 * Convention: see prompts/core/defect-labels.md
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Convention ──────────────────────────────────────────────────────────────
const KIND_LABEL = 'bug';
const SEVERITY_LABELS = ['severity:critical', 'severity:major', 'severity:minor', 'severity:trivial'] as const;
const MODULE_LABELS   = [
  'module:auth', 'module:cart', 'module:checkout', 'module:profile',
  'module:product', 'module:compare', 'module:wishlist', 'module:home',
] as const;
const PRIORITY_LABELS  = ['priority:p1', 'priority:p2', 'priority:p3', 'priority:p4'] as const;
const ROOT_CAUSE_LABELS = [
  'root-cause:requirements', 'root-cause:logic', 'root-cause:test-gap',
  'root-cause:env', 'root-cause:data', 'root-cause:integration', 'root-cause:other',
] as const;
const PHASE_LABELS = [
  'phase:unit', 'phase:integration', 'phase:e2e',
  'phase:manual', 'phase:exploratory', 'phase:customer',
] as const;
const FOUND_IN_LABELS = ['found-in:dev', 'found-in:qa', 'found-in:uat', 'found-in:staging', 'found-in:prod'] as const;
const IN_PROGRESS_LABEL = 'status:in-progress';
const REOPENED_LABEL    = 'status:reopened';

type Severity = 'critical' | 'major' | 'minor' | 'trivial' | 'unknown';
type ModuleName = 'auth' | 'cart' | 'checkout' | 'profile' | 'product' | 'compare' | 'wishlist' | 'home' | 'unknown';
type Priority = 'p1' | 'p2' | 'p3' | 'p4' | 'unknown';
type RootCause = 'requirements' | 'logic' | 'test-gap' | 'env' | 'data' | 'integration' | 'other' | 'unknown';
type Phase = 'unit' | 'integration' | 'e2e' | 'manual' | 'exploratory' | 'customer' | 'unknown';
type FoundIn = 'dev' | 'qa' | 'uat' | 'staging' | 'prod' | 'unknown';

interface GhIssue {
  number: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed';
  state_reason: 'completed' | 'not_planned' | 'reopened' | null;
  labels: { name: string }[];
  assignee: { login: string } | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  pull_request?: unknown;
}

type StatusLabel = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

interface IssueRow {
  number: number;
  title: string;
  url: string;
  status: StatusLabel;
  severity: Severity;
  modules: ModuleName[];
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  ageDays: number;
}

interface AgingBuckets {
  '0_7': number;
  '8_15': number;
  '16_30': number;
  '30_plus': number;
}

interface TrendPoint {
  period: string;          // YYYY-MM
  opened: number;
  closed: number;
  leakagePct: number;      // % of `opened` carrying `found-in:prod`
}

interface DefectKpis {
  total: number;
  totalDeltaPct: number | null;
  open: number;
  openDelta: number | null;
  leakageRatePct: number;
  leakageDeltaPct: number | null;
  avgAgeOpenDays: number;
  avgAgeDeltaDays: number | null;
  reopenRatePct: number;
  reopenDeltaPct: number | null;
}

interface DefectsArtifact {
  fetchedAt: string;
  repo: string;
  totals: { open: number; inProgress: number; resolved: number; closed: number };
  severity: { label: Severity; count: number }[];
  byModule: { label: ModuleName; open: number; closed: number }[];
  byPriority: { label: Priority; count: number }[];
  byRootCause: { label: RootCause; count: number }[];
  byPhase: { label: Phase; count: number }[];
  byEnvFound: { label: FoundIn; count: number }[];
  aging: AgingBuckets;
  trend: TrendPoint[];
  kpis: DefectKpis;
  unlabelled: { noSeverity: number; noModule: number; noPriority: number; noRootCause: number };
  sourceCount: number;
  issues: IssueRow[];
}

const STATUS_DISPLAY: Record<keyof DefectsArtifact['totals'], StatusLabel> = {
  open:       'Open',
  inProgress: 'In Progress',
  resolved:   'Resolved',
  closed:     'Closed',
};

// ─── Resolution helpers ──────────────────────────────────────────────────────
function resolveToken(): string | null {
  const fromEnv = process.env['GITHUB_TOKEN'] || process.env['GH_TOKEN'];
  if (fromEnv) return fromEnv;
  try {
    const out = execSync('gh auth token', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim();
    return out || null;
  } catch {
    return null;
  }
}

function resolveRepo(): string | null {
  if (process.env['DEFECTS_REPO']) return process.env['DEFECTS_REPO'];
  if (process.env['GITHUB_REPOSITORY']) return process.env['GITHUB_REPOSITORY'];
  try {
    const url = execSync('git remote get-url origin', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim();
    // Handles https://[user[:token]@]github.com/owner/name(.git)? and git@github.com:owner/name(.git)?
    const match = /github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/i.exec(url);
    return match ? `${match[1]}/${match[2]}` : null;
  } catch {
    return null;
  }
}

// ─── GitHub fetch (paginated REST search) ────────────────────────────────────
async function fetchAllBugIssues(repo: string, token: string): Promise<GhIssue[]> {
  const all: GhIssue[] = [];
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'ai-qa-training-defects-fetch',
  };
  // We hit /repos/{owner}/{repo}/issues?state=all&labels=bug — pulls open + closed.
  // Pagination: 100/page. Excluded PRs (issues endpoint includes them by default).
  for (let page = 1; page <= 10; page += 1) {
    const url = `https://api.github.com/repos/${repo}/issues?state=all&labels=${encodeURIComponent(KIND_LABEL)}&per_page=100&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`GitHub API ${res.status} ${res.statusText} for ${url}`);
    }
    const batch = (await res.json()) as GhIssue[];
    for (const issue of batch) {
      if (!issue.pull_request) all.push(issue);
    }
    if (batch.length < 100) break;
  }
  return all;
}

// ─── Label pickers ───────────────────────────────────────────────────────────
function pickSeverity(labels: readonly string[]): Severity {
  for (const tier of SEVERITY_LABELS) {
    if (labels.includes(tier)) return tier.split(':')[1] as Severity;
  }
  return 'unknown';
}

function pickModules(labels: readonly string[]): ModuleName[] {
  const found = MODULE_LABELS
    .filter((m) => labels.includes(m))
    .map((m) => m.split(':')[1] as ModuleName);
  return found.length ? found : ['unknown'];
}

function pickPriority(labels: readonly string[]): Priority {
  for (const tier of PRIORITY_LABELS) {
    if (labels.includes(tier)) return tier.split(':')[1] as Priority;
  }
  return 'unknown';
}

function pickRootCause(labels: readonly string[]): RootCause {
  for (const tier of ROOT_CAUSE_LABELS) {
    if (labels.includes(tier)) return tier.split(':')[1] as RootCause;
  }
  return 'unknown';
}

function pickPhase(labels: readonly string[]): Phase {
  for (const tier of PHASE_LABELS) {
    if (labels.includes(tier)) return tier.split(':')[1] as Phase;
  }
  return 'unknown';
}

function pickFoundIn(labels: readonly string[]): FoundIn {
  for (const tier of FOUND_IN_LABELS) {
    if (labels.includes(tier)) return tier.split(':')[1] as FoundIn;
  }
  return 'unknown';
}

// ─── Aggregation ─────────────────────────────────────────────────────────────
interface Aggregator {
  totals: { open: number; inProgress: number; resolved: number; closed: number };
  sev: Map<Severity, number>;
  byMod: Map<ModuleName, { open: number; closed: number }>;
  byPri: Map<Priority, number>;
  byRc: Map<RootCause, number>;
  byPh: Map<Phase, number>;
  byEnv: Map<FoundIn, number>;
  noSeverity: number;
  noModule: number;
  noPriority: number;
  noRootCause: number;
  reopened: number;
}

function statusBucket(issue: GhIssue, labels: string[]): keyof Aggregator['totals'] {
  if (issue.state === 'open') {
    return labels.includes(IN_PROGRESS_LABEL) ? 'inProgress' : 'open';
  }
  return issue.state_reason === 'not_planned' ? 'closed' : 'resolved';
}

function bumpSeverity(acc: Aggregator, labels: string[]): void {
  const severity = pickSeverity(labels);
  acc.sev.set(severity, (acc.sev.get(severity) ?? 0) + 1);
  if (severity === 'unknown') acc.noSeverity += 1;
}

function bumpModules(acc: Aggregator, issue: GhIssue, labels: string[]): void {
  const modules = pickModules(labels);
  if (modules.length === 1 && modules[0] === 'unknown') acc.noModule += 1;
  for (const mod of modules) {
    const row = acc.byMod.get(mod) ?? { open: 0, closed: 0 };
    if (issue.state === 'open') row.open  += 1;
    else                        row.closed += 1;
    acc.byMod.set(mod, row);
  }
}

function bumpSimple<T extends string>(map: Map<T, number>, key: T): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function aggregate(issues: GhIssue[]): Omit<DefectsArtifact, 'fetchedAt' | 'repo' | 'kpis' | 'aging' | 'trend'> {
  const acc: Aggregator = {
    totals: { open: 0, inProgress: 0, resolved: 0, closed: 0 },
    sev: new Map<Severity, number>([
      ['critical', 0], ['major', 0], ['minor', 0], ['trivial', 0], ['unknown', 0],
    ]),
    byMod: new Map<ModuleName, { open: number; closed: number }>(),
    byPri: new Map<Priority, number>([['p1', 0], ['p2', 0], ['p3', 0], ['p4', 0], ['unknown', 0]]),
    byRc:  new Map<RootCause, number>(),
    byPh:  new Map<Phase, number>(),
    byEnv: new Map<FoundIn, number>(),
    noSeverity: 0, noModule: 0, noPriority: 0, noRootCause: 0, reopened: 0,
  };

  for (const issue of issues) {
    const labels = issue.labels.map((l) => l.name);
    acc.totals[statusBucket(issue, labels)] += 1;
    bumpSeverity(acc, labels);
    bumpModules(acc, issue, labels);

    const pri = pickPriority(labels);
    bumpSimple(acc.byPri, pri);
    if (pri === 'unknown') acc.noPriority += 1;

    const rc = pickRootCause(labels);
    bumpSimple(acc.byRc, rc);
    if (rc === 'unknown') acc.noRootCause += 1;

    bumpSimple(acc.byPh, pickPhase(labels));
    bumpSimple(acc.byEnv, pickFoundIn(labels));

    if (labels.includes(REOPENED_LABEL) || issue.state_reason === 'reopened') {
      acc.reopened += 1;
    }
  }

  return {
    totals: acc.totals,
    severity: [...acc.sev.entries()].map(([label, count]) => ({ label, count })),
    byModule: [...acc.byMod.entries()]
      .map(([label, { open, closed }]) => ({ label, open, closed }))
      .sort((a, b) => (b.open + b.closed) - (a.open + a.closed)),
    byPriority:  toBuckets(acc.byPri,  ['p1', 'p2', 'p3', 'p4', 'unknown']),
    byRootCause: toBuckets(acc.byRc,   ['requirements', 'logic', 'test-gap', 'env', 'data', 'integration', 'other', 'unknown']),
    byPhase:     toBuckets(acc.byPh,   ['unit', 'integration', 'e2e', 'manual', 'exploratory', 'customer', 'unknown']),
    byEnvFound:  toBuckets(acc.byEnv,  ['dev', 'qa', 'uat', 'staging', 'prod', 'unknown']),
    unlabelled: {
      noSeverity:  acc.noSeverity,
      noModule:    acc.noModule,
      noPriority:  acc.noPriority,
      noRootCause: acc.noRootCause,
    },
    sourceCount: issues.length,
    issues: buildIssueRows(issues),
  };
}

function toBuckets<T extends string>(map: Map<T, number>, order: T[]): { label: T; count: number }[] {
  return order
    .map((label) => ({ label, count: map.get(label) ?? 0 }))
    .filter((b, i) => b.count > 0 || i < order.length - 1); // drop trailing 'unknown' if zero
}

// ─── Aging, trend & KPIs ─────────────────────────────────────────────────────
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function ageInDays(fromIso: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(fromIso).getTime()) / MS_PER_DAY));
}

function computeAging(issues: GhIssue[], now: Date): AgingBuckets {
  const buckets: AgingBuckets = { '0_7': 0, '8_15': 0, '16_30': 0, '30_plus': 0 };
  for (const issue of issues) {
    if (issue.state !== 'open') continue;
    const age = ageInDays(issue.created_at, now);
    if (age <= 7)        buckets['0_7']     += 1;
    else if (age <= 15)  buckets['8_15']    += 1;
    else if (age <= 30)  buckets['16_30']   += 1;
    else                 buckets['30_plus'] += 1;
  }
  return buckets;
}

function ymKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function lastNMonthKeys(n: number, now: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let i = 0; i < n; i += 1) {
    keys.unshift(ymKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }
  return keys;
}

function computeTrend(issues: GhIssue[], now: Date, months = 6): TrendPoint[] {
  const periods = lastNMonthKeys(months, now);
  const opened = new Map<string, number>(periods.map((p) => [p, 0]));
  const closed = new Map<string, number>(periods.map((p) => [p, 0]));
  const leaked = new Map<string, number>(periods.map((p) => [p, 0]));

  const bump = (m: Map<string, number>, k: string): void => {
    if (m.has(k)) m.set(k, (m.get(k) ?? 0) + 1);
  };

  for (const issue of issues) {
    const labels = issue.labels.map((l) => l.name);
    const isLeak = labels.includes('found-in:prod');

    const openKey = ymKey(new Date(issue.created_at));
    bump(opened, openKey);
    if (isLeak) bump(leaked, openKey);

    if (issue.closed_at) bump(closed, ymKey(new Date(issue.closed_at)));
  }

  return periods.map((p) => {
    const o = opened.get(p) ?? 0;
    const l = leaked.get(p) ?? 0;
    return {
      period: p,
      opened: o,
      closed: closed.get(p) ?? 0,
      leakagePct: o === 0 ? 0 : round1((l / o) * 100),
    };
  });
}

function computeKpis(
  issues: GhIssue[],
  agg: Pick<DefectsArtifact, 'totals' | 'sourceCount'>,
  prev: DefectsArtifact | null,
  now: Date,
): DefectKpis {
  const openIssues = issues.filter((i) => i.state === 'open');
  const ages = openIssues.map((i) => ageInDays(i.created_at, now));
  const avgAgeOpenDays = ages.length ? round1(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

  const leaks = issues.filter((i) => i.labels.some((l) => l.name === 'found-in:prod')).length;
  const leakageRatePct = agg.sourceCount === 0 ? 0 : round1((leaks / agg.sourceCount) * 100);

  const reopened = issues.filter((i) => {
    const names = i.labels.map((l) => l.name);
    return names.includes(REOPENED_LABEL) || i.state_reason === 'reopened';
  }).length;
  const closedish = agg.totals.resolved + agg.totals.closed + reopened;
  const reopenRatePct = closedish === 0 ? 0 : round1((reopened / closedish) * 100);

  const total = agg.sourceCount;
  const open  = agg.totals.open + agg.totals.inProgress;

  return {
    total,
    totalDeltaPct:    deltaPct(total, prev?.kpis?.total ?? null),
    open,
    openDelta:        deltaAbs(open, prev?.kpis?.open ?? null),
    leakageRatePct,
    leakageDeltaPct:  deltaAbs(leakageRatePct, prev?.kpis?.leakageRatePct ?? null),
    avgAgeOpenDays,
    avgAgeDeltaDays:  deltaAbs(avgAgeOpenDays, prev?.kpis?.avgAgeOpenDays ?? null),
    reopenRatePct,
    reopenDeltaPct:   deltaAbs(reopenRatePct, prev?.kpis?.reopenRatePct ?? null),
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const deltaAbs = (cur: number, prev: number | null): number | null =>
  prev === null || prev === undefined ? null : round1(cur - prev);
const deltaPct = (cur: number, prev: number | null): number | null => {
  if (prev === null || prev === undefined || prev === 0) return null;
  return round1(((cur - prev) / prev) * 100);
};

// ─── Per-issue rows for the dashboard's "Issues" table ───────────────────────
// Sort: open first, then in-progress, then resolved, then closed.
// Within a bucket, most-recently-updated first so the freshest noise is on top.
const STATUS_RANK: Record<StatusLabel, number> = {
  'Open':        0,
  'In Progress': 1,
  'Resolved':    2,
  'Closed':      3,
};

function toIssueRow(issue: GhIssue): IssueRow {
  const labels = issue.labels.map((l) => l.name);
  const now = new Date();
  return {
    number:    issue.number,
    title:     issue.title,
    url:       issue.html_url,
    status:    STATUS_DISPLAY[statusBucket(issue, labels)],
    severity:  pickSeverity(labels),
    modules:   pickModules(labels),
    assignee:  issue.assignee?.login ?? null,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt:  issue.closed_at,
    ageDays:   ageInDays(issue.created_at, now),
  };
}

function buildIssueRows(issues: GhIssue[]): IssueRow[] {
  return issues
    .map(toIssueRow)
    .sort((a, b) => {
      const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (rank !== 0) return rank;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
}

// ─── Previous-fetch lookup (for delta computation) ───────────────────────────
function loadPrevious(outPath: string): DefectsArtifact | null {
  if (!existsSync(outPath)) return null;
  try {
    return JSON.parse(readFileSync(outPath, 'utf8')) as DefectsArtifact;
  } catch {
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const token = resolveToken();
  const repo  = resolveRepo();

  if (!token) {
    console.warn('▸ fetch:defects skipped — no GITHUB_TOKEN / GH_TOKEN / `gh auth token` available.');
    console.warn('  Dashboard will fall back to static demo data. See prompts/core/defect-labels.md.');
    return;
  }
  if (!repo) {
    console.warn('▸ fetch:defects skipped — could not resolve repo (set DEFECTS_REPO=owner/name).');
    return;
  }

  console.log(`▸ fetch:defects: GET issues from ${repo} (label=${KIND_LABEL})`);
  let issues: GhIssue[];
  try {
    issues = await fetchAllBugIssues(repo, token);
  } catch (err) {
    console.warn(`▸ fetch:defects skipped — ${(err as Error).message}`);
    return;
  }
  console.log(`▸ fetch:defects: ${issues.length} bug issue(s) returned`);

  const repoRoot   = resolve(__dirname, '..');
  const reportsDir = resolve(repoRoot, 'reports');
  const outPath    = resolve(reportsDir, 'defects.json');
  const previous   = loadPrevious(outPath);

  const now   = new Date();
  const stats = aggregate(issues);
  const aging = computeAging(issues, now);
  const trend = computeTrend(issues, now, 6);
  const kpis  = computeKpis(issues, { totals: stats.totals, sourceCount: stats.sourceCount }, previous, now);

  const artifact: DefectsArtifact = {
    fetchedAt: now.toISOString(),
    repo,
    ...stats,
    aging,
    trend,
    kpis,
  };

  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outPath, JSON.stringify(artifact, null, 2));
  console.log(`✓ Wrote ${outPath}`);
  console.log(`  total=${kpis.total}  open=${kpis.open}  leakage=${kpis.leakageRatePct}%  avgAge=${kpis.avgAgeOpenDays}d  reopen=${kpis.reopenRatePct}%`);
}

main().catch((err: unknown) => {
  console.error('fetch:defects failed unexpectedly —', err);
  // Don't fail the build; we treat defect data as advisory.
  process.exit(0);
});
