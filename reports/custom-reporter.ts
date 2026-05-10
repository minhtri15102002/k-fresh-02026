import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
} from '@playwright/test/reporter';

import { dispatchNotifications, type RunReport } from './notifiers';
import type { CliContext, RunSummary } from './notifiers/types';

function detectTargetType(project: string, target: string): 'API' | 'UI' {
  const projectValue = project.toLowerCase();
  const targetValue = target.toLowerCase();
  if (projectValue.includes('api') || targetValue.includes('tests/api/')) {
    return 'API';
  }
  return 'UI';
}

function formatTargetLabel(_project: string, target: string, grep: string): string {
  return target || grep || 'tests';
}

function inferProjectLabel(target: string, grep: string): string {
  const resolvedTarget = (target || grep || '').toLowerCase();
  if (resolvedTarget.includes('tests/api/')) {
    return 'API - Full Suite';
  }
  if (resolvedTarget.includes('tests/ui/')) {
    return 'UI Projects (auto-selected by Playwright)';
  }
  return 'Auto-selected by Playwright';
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function parseOption(args: string[], name: string): string {
  const index = args.indexOf(name);
  if (index === -1) return '';
  return args[index + 1] ?? '';
}

function parseTarget(args: string[]): string {
  const testIndex = args.indexOf('test');
  if (testIndex === -1) return '';

  for (let index = testIndex + 1; index < args.length; index += 1) {
    const current = args[index];
    if (!current?.startsWith('-')) {
      return current ?? '';
    }
    if (['--project', '--grep', '--workers', '--retries', '--config'].includes(current)) {
      index += 1;
    }
  }
  return '';
}

function buildCliContext(config: FullConfig): CliContext {
  const args = process.argv.slice(2);
  const env = process.env;

  const explicitProject =
    env['PLAYWRIGHT_NOTIFY_PROJECT'] ||
    env['PLAYWRIGHT_GCHAT_PROJECT'] ||
    parseOption(args, '--project');
  const resolvedTarget =
    env['PLAYWRIGHT_NOTIFY_TARGET'] ||
    env['PLAYWRIGHT_GCHAT_TARGET'] ||
    parseTarget(args) ||
    config.rootDir ||
    'tests';
  const resolvedGrep =
    env['PLAYWRIGHT_NOTIFY_GREP'] ||
    env['PLAYWRIGHT_GCHAT_GREP'] ||
    parseOption(args, '--grep');

  return {
    envName: env['PLAYWRIGHT_NOTIFY_ENV'] || env['PLAYWRIGHT_GCHAT_ENV'] || env['ENV'] || 'uat',
    project: explicitProject || inferProjectLabel(resolvedTarget, resolvedGrep),
    target: resolvedTarget,
    grep: resolvedGrep,
    workers:
      env['PLAYWRIGHT_NOTIFY_WORKERS'] ||
      env['PLAYWRIGHT_GCHAT_WORKERS'] ||
      parseOption(args, '--workers') ||
      String(config.workers),
    retries:
      env['PLAYWRIGHT_NOTIFY_RETRIES'] ||
      env['PLAYWRIGHT_GCHAT_RETRIES'] ||
      parseOption(args, '--retries') ||
      String(config.projects[0]?.retries ?? 0),
  };
}

function formatTitlePath(test: TestCase): string {
  return test
    .titlePath()
    .filter((part) => part && !part.endsWith('.spec.ts'))
    .join(' > ');
}

function buildSummary(suite: Suite): RunSummary {
  const summary: RunSummary = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0,
    failedTests: [],
  };

  for (const test of suite.allTests()) {
    summary.total += 1;
    switch (test.outcome()) {
      case 'expected':
        summary.passed += 1;
        break;
      case 'skipped':
        summary.skipped += 1;
        break;
      case 'flaky':
        summary.flaky += 1;
        if (summary.failedTests.length < 4) {
          summary.failedTests.push(formatTitlePath(test));
        }
        break;
      case 'unexpected':
        summary.failed += 1;
        if (summary.failedTests.length < 4) {
          summary.failedTests.push(formatTitlePath(test));
        }
        break;
      default:
        break;
    }
  }

  return summary;
}

// ─── Per-suite breakdown + dashboard JSON persistence ──────────────────────
//
// `buildSummary` already gives us totals, but the dashboard's "passed by suite"
// table needs counts grouped by spec file. We derive a friendly suite name from
// the spec path (e.g. `tests/ui/test-cart.spec.ts` → "Cart (UI)") so new spec
// files appear automatically without touching the dashboard HTML.

type SpecType = 'UI' | 'API' | 'Hybrid';

interface PerSuiteRow {
  name: string;
  type: SpecType;
  total: number;
  passed: number;
}

function classifySpec(filePath: string): { name: string; type: SpecType } {
  const segments = filePath.replaceAll('\\', '/').split('/');
  const fileName = segments.at(-1) ?? '';
  const folder = segments.includes('api') ? 'api' : 'ui';
  const stem = fileName.replace(/^test-/, '').replace(/\.spec\.ts$/, '');

  let type: SpecType = folder === 'api' ? 'API' : 'UI';
  let display = stem
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  // Heuristic: a spec under `tests/api/` whose name combines `ui` and `api` is a hybrid.
  const lower = stem.toLowerCase();
  if (folder === 'api' && lower.includes('ui') && lower.includes('api')) {
    type = 'Hybrid';
    display = `${display} Hybrid`;
  } else if (folder === 'api') {
    display = `${display} API`;
  } else {
    display = `${display} (UI)`;
  }

  return { name: display, type };
}

function buildPerSuite(suite: Suite): PerSuiteRow[] {
  const rows = new Map<string, PerSuiteRow>();
  for (const test of suite.allTests()) {
    const file = test.location.file;
    if (!file) continue;
    const { name, type } = classifySpec(file);
    const row = rows.get(file) ?? { name, type, total: 0, passed: 0 };
    row.total += 1;
    if (test.outcome() === 'expected') row.passed += 1;
    rows.set(file, row);
  }
  return [...rows.values()].sort((a, b) => b.total - a.total);
}

// ─── Tag-driven aggregations ─────────────────────────────────────────────────
//
// Tags carried by each `test(..., { tag: [...] }, ...)` declaration are the
// single source of truth for priority/severity/feature buckets in the
// dashboard. Convention lives in `prompts/core/test-tags.md`:
//   priority: @P1 | @P2 | @P3
//   severity: @critical | @major | @minor | @trivial
//   type:     @ui | @api | @hybrid (else inferred from spec path)
//   feature:  @auth | @cart | @checkout | @profile | @product | @compare | @wishlist | @home

const PRIORITY_TAG = /^@P([1-3])$/;
const SEVERITY_TAG = /^@(critical|major|minor|trivial)$/;
const TYPE_TAG = /^@(ui|api|hybrid)$/;
const FEATURE_TAGS = new Set([
  '@auth', '@cart', '@checkout', '@profile',
  '@product', '@compare', '@wishlist', '@home',
]);

interface BucketCount { label: string; count: number }

function inferTypeFromPath(file: string): SpecType {
  const norm = file.replaceAll('\\', '/').toLowerCase();
  if (norm.includes('/tests/api/') && norm.includes('ui-api')) return 'Hybrid';
  if (norm.includes('/tests/api/')) return 'API';
  return 'UI';
}

interface TagAggregations {
  priority: BucketCount[];   // [{label:'P1', count:N}, ...] in P1→P3 order
  severity: BucketCount[];   // critical → trivial
  byType: BucketCount[];   // UI / API / Hybrid
  byTag: BucketCount[];   // smoke / regression / Untagged
  byFeature: BucketCount[];  // sorted desc by count
  untaggedTests: string[];   // titles missing priority OR severity (max 10)
}

function bump(m: Map<string, number>, key: string): void {
  m.set(key, (m.get(key) ?? 0) + 1);
}

function firstMatch(tags: readonly string[], re: RegExp): RegExpExecArray | null {
  for (const tag of tags) {
    const result = re.exec(tag);
    if (result) return result;
  }
  return null;
}

function classifyType(tags: readonly string[], file: string): SpecType {
  const explicit = firstMatch(tags, TYPE_TAG);
  if (!explicit) return inferTypeFromPath(file);
  const value = explicit[1];
  if (value === 'hybrid') return 'Hybrid';
  return value === 'api' ? 'API' : 'UI';
}

function aggregateTest(
  test: TestCase,
  acc: {
    priority: Map<string, number>;
    severity: Map<string, number>;
    byType: Map<string, number>;
    byTag: Map<string, number>;
    byFeature: Map<string, number>;
    untaggedTests: string[];
  },
): void {
  const tags = test.tags ?? [];

  const pri = firstMatch(tags, PRIORITY_TAG);
  if (pri) bump(acc.priority, `P${pri[1]}`);

  const sev = firstMatch(tags, SEVERITY_TAG);
  if (sev) bump(acc.severity, sev[1] ?? '');

  if ((!pri || !sev) && acc.untaggedTests.length < 10) {
    acc.untaggedTests.push(formatTitlePath(test));
  }

  bump(acc.byType, classifyType(tags, test.location.file ?? ''));

  const hasSmoke = tags.includes('@smoke');
  const hasReg = tags.includes('@regression');
  if (hasSmoke) bump(acc.byTag, '@smoke');
  if (hasReg) bump(acc.byTag, '@regression');
  if (!hasSmoke && !hasReg) bump(acc.byTag, 'Untagged');

  for (const tag of tags) {
    if (FEATURE_TAGS.has(tag)) bump(acc.byFeature, tag.slice(1));
  }
}

function buildTagAggregations(suite: Suite): TagAggregations {
  const acc = {
    priority: new Map<string, number>([['P1', 0], ['P2', 0], ['P3', 0]]),
    severity: new Map<string, number>([
      ['critical', 0], ['major', 0], ['minor', 0], ['trivial', 0],
    ]),
    byType: new Map<string, number>([['UI', 0], ['API', 0], ['Hybrid', 0]]),
    byTag: new Map<string, number>([['@smoke', 0], ['@regression', 0], ['Untagged', 0]]),
    byFeature: new Map<string, number>(),
    untaggedTests: [] as string[],
  };

  for (const test of suite.allTests()) aggregateTest(test, acc);

  const toArr = (m: Map<string, number>): BucketCount[] =>
    [...m.entries()].map(([label, count]) => ({ label, count }));

  return {
    priority: toArr(acc.priority),
    severity: toArr(acc.severity),
    byType: toArr(acc.byType),
    byTag: toArr(acc.byTag),
    byFeature: toArr(acc.byFeature).sort((a, b) => b.count - a.count),
    untaggedTests: acc.untaggedTests,
  };
}

function nowDisplay(date: Date): string {
  // YYYY-MM-DD HH:mm in the local timezone, with a tz hint from Intl.
  const pad = (n: number): string => String(n).padStart(2, '0');
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
  const tzAbbr = tz.split('/').at(-1) ?? tz;
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())} ${tzAbbr}`
  );
}

function resolveBuildLabel(): string {
  const env = process.env;
  const fromCi =
    env['GITHUB_RUN_NUMBER'] ||
    env['BUILD_NUMBER'] ||
    env['CI_PIPELINE_ID'] ||
    env['CIRCLE_BUILD_NUM'];
  if (fromCi) return `#${fromCi}`;
  return `local-${Date.now().toString(36).slice(-5)}`;
}

interface RunSummaryArtifact {
  build: string;
  ranAt: string;
  ranAtDisplay: string;
  env: string;
  envDisplay: string;
  baseUrl: string;
  status: FullResult['status'];
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  passRate: number;
  failRate: number;
  durationMs: number;
  durationMin: number;
  failedTests: string[];
  perSuite: PerSuiteRow[];
  priority: BucketCount[];
  severity: BucketCount[];
  byType: BucketCount[];
  byTag: BucketCount[];
  byFeature: BucketCount[];
  untaggedTests: string[];
}

interface TrendEntry {
  build: string;
  ranAt: string;
  env: string;
  passRate: number;
  failRate: number;
}

function resolveEnv(): { env: string; envDisplay: string; baseUrl: string } {
  const env = (process.env['ENV'] ?? 'local').toLowerCase();
  const envDisplay = env.toUpperCase();
  const baseUrl =
    process.env['BASE_URL'] ??
    process.env['PLAYWRIGHT_BASE_URL'] ??
    '';
  return { env, envDisplay, baseUrl };
}

const TREND_WINDOW = 10;

function persistRunArtifacts(
  result: FullResult,
  suite: Suite,
  summary: RunSummary,
): void {
  const reportsDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const ran = new Date();
  const denom = Math.max(summary.total - summary.skipped, 1);
  const passRate = Number(((summary.passed / denom) * 100).toFixed(1));
  const failRate = Number((((summary.failed + summary.flaky) / denom) * 100).toFixed(1));

  const tagBuckets = buildTagAggregations(suite);
  const envInfo = resolveEnv();
  const artifact: RunSummaryArtifact = {
    build: resolveBuildLabel(),
    ranAt: ran.toISOString(),
    ranAtDisplay: nowDisplay(ran),
    env: envInfo.env,
    envDisplay: envInfo.envDisplay,
    baseUrl: envInfo.baseUrl,
    status: result.status,
    total: summary.total,
    passed: summary.passed,
    failed: summary.failed,
    skipped: summary.skipped,
    flaky: summary.flaky,
    passRate,
    failRate,
    durationMs: result.duration,
    durationMin: Number((result.duration / 60_000).toFixed(1)),
    failedTests: summary.failedTests,
    perSuite: buildPerSuite(suite),
    priority: tagBuckets.priority,
    severity: tagBuckets.severity,
    byType: tagBuckets.byType,
    byTag: tagBuckets.byTag,
    byFeature: tagBuckets.byFeature,
    untaggedTests: tagBuckets.untaggedTests,
  };

  const summaryPath = path.join(reportsDir, 'run-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(artifact, null, 2));

  // Append to a rolling trend file (keep last TREND_WINDOW entries).
  const trendPath = path.join(reportsDir, 'run-trend.json');
  let trend: TrendEntry[] = [];
  if (fs.existsSync(trendPath)) {
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(trendPath, 'utf8'));
      if (Array.isArray(parsed)) trend = parsed as TrendEntry[];
    } catch {
      trend = [];
    }
  }
  trend.push({
    build: artifact.build,
    ranAt: artifact.ranAt,
    env: artifact.env,
    passRate,
    failRate,
  });
  // Keep last N entries for the *current* environment plus a small cross-env
  // tail so trend lines stay environment-coherent in the dashboard.
  trend = trend.filter((t) => t.env === artifact.env || !t.env).slice(-TREND_WINDOW);
  fs.writeFileSync(trendPath, JSON.stringify(trend, null, 2));

  console.log(
    `Dashboard data: wrote ${summaryPath} (${artifact.envDisplay} · ${artifact.build} · ${passRate}% pass).`,
  );
}

function formatPassRate(summary: RunSummary): string {
  if (summary.total === 0) return '0.00%';
  return `${((summary.passed / summary.total) * 100).toFixed(2)}%`;
}

const platform = os.platform();

let osName = '';
if (platform === 'darwin') {
  osName = 'macOS';
} else if (platform === 'win32') {
  osName = 'Windows';
} else if (platform === 'linux') {
  osName = 'Linux';
}
else {
  osName = 'Unknown';
}

const machineName = os.hostname();

function buildMessage(result: FullResult, context: CliContext, summary: RunSummary): string {
  const statusIcon = result.status === 'passed' ? '✅' : '❌';
  const label = result.status === 'passed' ? 'Passed' : 'Failed';
  const suiteType = detectTargetType(context.project, context.target || context.grep || 'tests');
  const targetLabel = formatTargetLabel(context.project, context.target, context.grep);
  const envLabel = context.envName.toUpperCase();
  const runOrigin = process.env['CI'] ? 'CI' : 'Local';

  const lines = [
    `${statusIcon} ${runOrigin} CI ${label}`,
    `Suite Type: *${suiteType}*`,
    `💻 Machine: ${osName}`,
    `🖥️ Machine Name: ${machineName}`,
    `🌍 *Environment:* ${envLabel}`,
    `🧩 Project: ${context.project}`,
    `🎯 *Target:* ${targetLabel}`,
    '',
    '⚙️ Execution',
    `• Workers: ${context.workers}`,
    `• Retries: ${context.retries}`,
    `• Duration: ${formatDuration(result.duration)}`,
    '',
    '📊 Test Summary',
    `• Total: ${summary.total}`,
    `• ✅ Passed: ${summary.passed}`,
    `• ❌ Failed: ${summary.failed}`,
    `• ⏭️ Skipped: ${summary.skipped}`,
    `• ⚠️ Flaky: ${summary.flaky}`,
    `*Pass Rate:* *${formatPassRate(summary)}*`,
  ];

  if (summary.failedTests.length > 0) {
    lines.push('', '🔥 First Failed Tests');
    summary.failedTests.forEach((failedTest, index) => {
      lines.push(`${index + 1}. ${failedTest}`);
    });
  }

  return lines.join('\n');
}

export default class CustomReporter implements Reporter {
  private config?: FullConfig;
  private suite?: Suite;

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.suite = suite;
  }

  async onEnd(result: FullResult): Promise<void> {
    if (!this.config || !this.suite) {
      console.log('Notifications skipped: run context unavailable.');
      return;
    }

    const context = buildCliContext(this.config);
    const summary = buildSummary(this.suite);

    // Skip notifications for runs that didn't actually execute any tests:
    //   - `--list` / `--dry-run` enumerate but don't run the tests
    //   - empty filter or no tests in suite (`summary.total === 0`)
    //   - everything was skipped (no real results to report)
    // Without this guard a dry-run pings Slack/Google Chat/Email with a 0/0 report.
    const isListing = process.argv.includes('--list') || process.argv.includes('--dry-run');
    const allSkipped =
      summary.total > 0 &&
      summary.passed === 0 &&
      summary.failed === 0 &&
      summary.flaky === 0;
    if (summary.total === 0 || isListing || allSkipped) {
      console.log('Notifications skipped: no tests executed.');
      return;
    }

    // Persist dashboard inputs *before* notifications. If a webhook fails we
    // still want the JSON artifacts on disk for `npm run export:dashboard`.
    try {
      persistRunArtifacts(result, this.suite, summary);
    } catch (err) {
      console.warn('Dashboard data: failed to persist run-summary.json —', err);
    }

    const message = buildMessage(result, context, summary);

    const report: RunReport = {
      status: result.status,
      durationMs: result.duration,
      summary,
      context,
      message,
      config: this.config,
      suite: this.suite,
    };

    const logs = await dispatchNotifications(report);
    for (const line of logs) {
      console.log(line);
    }
  }
}

export function ensureReporterArtifacts(): void {
  const reportDir = path.resolve(process.cwd(), 'playwright-report');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
}

ensureReporterArtifacts();
