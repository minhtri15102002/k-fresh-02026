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
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Convention ──────────────────────────────────────────────────────────────
const KIND_LABEL = 'bug';
const SEVERITY_LABELS = ['severity:critical', 'severity:major', 'severity:minor', 'severity:trivial'] as const;
const MODULE_LABELS   = [
  'module:auth', 'module:cart', 'module:checkout', 'module:profile',
  'module:product', 'module:compare', 'module:wishlist', 'module:home',
] as const;
const IN_PROGRESS_LABEL = 'status:in-progress';

type Severity = 'critical' | 'major' | 'minor' | 'trivial' | 'unknown';
type ModuleName = 'auth' | 'cart' | 'checkout' | 'profile' | 'product' | 'compare' | 'wishlist' | 'home' | 'unknown';

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
}

interface DefectsArtifact {
  fetchedAt: string;
  repo: string;
  totals: { open: number; inProgress: number; resolved: number; closed: number };
  severity: { label: Severity; count: number }[];
  byModule: { label: ModuleName; open: number; closed: number }[];
  unlabelled: { noSeverity: number; noModule: number };
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

// ─── Aggregation ─────────────────────────────────────────────────────────────
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

interface Aggregator {
  totals: { open: number; inProgress: number; resolved: number; closed: number };
  sev: Map<Severity, number>;
  byMod: Map<ModuleName, { open: number; closed: number }>;
  noSeverity: number;
  noModule: number;
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

function aggregate(issues: GhIssue[]): Omit<DefectsArtifact, 'fetchedAt' | 'repo'> {
  const acc: Aggregator = {
    totals: { open: 0, inProgress: 0, resolved: 0, closed: 0 },
    sev: new Map<Severity, number>([
      ['critical', 0], ['major', 0], ['minor', 0], ['trivial', 0], ['unknown', 0],
    ]),
    byMod: new Map<ModuleName, { open: number; closed: number }>(),
    noSeverity: 0,
    noModule: 0,
  };

  for (const issue of issues) {
    const labels = issue.labels.map((l) => l.name);
    acc.totals[statusBucket(issue, labels)] += 1;
    bumpSeverity(acc, labels);
    bumpModules(acc, issue, labels);
  }

  return {
    totals: acc.totals,
    severity: [...acc.sev.entries()].map(([label, count]) => ({ label, count })),
    byModule: [...acc.byMod.entries()]
      .map(([label, { open, closed }]) => ({ label, open, closed }))
      .sort((a, b) => (b.open + b.closed) - (a.open + a.closed)),
    unlabelled: { noSeverity: acc.noSeverity, noModule: acc.noModule },
    sourceCount: issues.length,
    issues: buildIssueRows(issues),
  };
}

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

  const stats = aggregate(issues);
  const artifact: DefectsArtifact = {
    fetchedAt: new Date().toISOString(),
    repo,
    ...stats,
  };

  const repoRoot   = resolve(__dirname, '..');
  const reportsDir = resolve(repoRoot, 'reports');
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });

  const outPath = resolve(reportsDir, 'defects.json');
  writeFileSync(outPath, JSON.stringify(artifact, null, 2));
  console.log(`✓ Wrote ${outPath}`);
}

main().catch((err: unknown) => {
  console.error('fetch:defects failed unexpectedly —', err);
  // Don't fail the build; we treat defect data as advisory.
  process.exit(0);
});
