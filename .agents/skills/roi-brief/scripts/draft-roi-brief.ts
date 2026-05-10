#!/usr/bin/env -S npx tsx
/**
 * .agents/skills/roi-brief/scripts/draft-roi-brief.ts
 *
 * Drafts a quarterly ROI brief for an AI-testing workflow that conforms to
 * documents/roi/calculator.md (Section A). Reads a JSON inputs file, validates
 * every required field, computes gross/total/net savings using the right
 * formula shape (TIME-SAVING / DEFECT-PREVENTION / COST-REDUCTION), and emits a
 * sign-off-ready Markdown brief.
 *
 * Exit codes:
 *   0   brief emitted; quality-control verdict ≠ "degraded"; no red stop-checks
 *   1   brief emitted BUT quality-control verdict = "degraded"
 *       (CI should treat this as a failure; investigate before reporting)
 *   2   invocation error (missing field, invalid JSON, formula shape mismatch,
 *       baseline file not found, vanity metric in scope, etc.)
 *
 * Usage:
 *   ./draft-roi-brief.ts <inputs.json>
 *   ./draft-roi-brief.ts <inputs.json> --out reports/roi-brief-X.md
 *   ./draft-roi-brief.ts <inputs.json> --out reports/roi-brief-X.md --trend
 *   ./draft-roi-brief.ts <inputs.json> --verbose
 *   ./draft-roi-brief.ts --help
 */

import { existsSync, readFileSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { argv, cwd, exit, stdout } from 'node:process';

// ── pretty ───────────────────────────────────────────────────────────────────
const RED = '\x1b[31m';
const GRN = '\x1b[32m';
const YEL = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// ── types ────────────────────────────────────────────────────────────────────
type FormulaShape = 'TIME-SAVING' | 'DEFECT-PREVENTION' | 'COST-REDUCTION';
type QualityVerdict = 'improved' | 'stable' | 'degraded';
type Recommendation = 'maintain' | 'advance' | 'pause' | 'rollback';

interface MetricRow {
  name: string;
  before: number;
  after: number;
  sample: string;
  source: string;
}

interface GrossInputs {
  input_label: string;
  input_before: number;
  input_after: number;
  multiplier_label: string;
  multiplier_value: number;
  unit_cost_label: string;
  unit_cost_value: number;
}

interface Costs {
  tool_licenses_usd: number;
  governance_hours: number;
  training_hours: number;
  incident_recovery_usd: number;
  eval_infra_usd: number;
  hourly_rate: number;
}

interface QualityControl {
  metric_name: string;
  before: number;
  after: number;
  verdict: QualityVerdict;
}

interface StopCheck {
  no_recent_incidents: boolean;
  eval_pass_rate_above_gate: boolean;
  engineers_reading_prs: boolean;
  cost_per_release_stable: boolean;
  governance_owner_stable: boolean;
}

interface Inputs {
  workflow_name: string;
  formula_shape: FormulaShape;
  adoption_stage: 1 | 2 | 3 | 4;
  owner: string;
  reviewers: string[];
  baseline_ref: string;
  period_start: string;
  period_end: string;
  tool_versions: string;
  scope_description: string;
  metrics_before_after: MetricRow[];
  gross_inputs: GrossInputs;
  costs: Costs;
  quality_control: QualityControl;
  stop_check: StopCheck;
  recommendation: Recommendation;
}

interface Computed {
  gross_savings_usd: number;
  gross_savings_hours: number;
  total_costs_usd: number;
  net_savings_usd: number;
  net_savings_hours: number;
  reduction_pct: number;
  cost_breakdown: { label: string; usd: number }[];
}

// ── args ─────────────────────────────────────────────────────────────────────
interface Args {
  input?: string;
  out?: string;
  trend: boolean;
  verbose: boolean;
  help: boolean;
}

function parseArgs(): Args {
  const a: Args = { trend: false, verbose: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const v = argv[i];
    if (!v) continue;
    if (v === '--help' || v === '-h') a.help = true;
    else if (v === '--verbose') a.verbose = true;
    else if (v === '--trend') a.trend = true;
    else if (v === '--out') {
      const next = argv[++i];
      if (next === undefined) {
        console.error(`${RED}--out requires a path argument${RESET}`);
        exit(2);
      }
      a.out = next;
    }
    else if (v.startsWith('--')) {
      console.error(`${RED}unknown flag:${RESET} ${v}`);
      exit(2);
    } else if (!a.input) {
      a.input = v;
    } else {
      console.error(`${RED}unexpected positional arg:${RESET} ${v}`);
      exit(2);
    }
  }
  return a;
}

function printHelp(): void {
  console.log(`${BOLD}draft-roi-brief.ts${RESET} — emit a sign-off-ready ROI brief

${BOLD}Usage${RESET}
  draft-roi-brief.ts <inputs.json>
  draft-roi-brief.ts <inputs.json> --out reports/roi-brief-X.md
  draft-roi-brief.ts <inputs.json> --out reports/roi-brief-X.md --trend
  draft-roi-brief.ts <inputs.json> --verbose

${BOLD}Flags${RESET}
  --out <path>   write the brief to a file (default: stdout)
  --trend        also append a row to reports/roi-trend.json
  --verbose      print every computation step to stderr
  --help, -h     show this help

${BOLD}Exit codes${RESET}
  0   brief emitted; quality-control verdict ≠ "degraded"
  1   brief emitted but quality-control verdict = "degraded"
  2   invocation error

${BOLD}Inputs schema${RESET}
  See .agents/skills/roi-brief/resources/inputs-example.json`);
}

// ── validation ───────────────────────────────────────────────────────────────
const FORMULA_SHAPES: FormulaShape[] = ['TIME-SAVING', 'DEFECT-PREVENTION', 'COST-REDUCTION'];
const VANITY_PATTERNS: { pattern: RegExp; suggestion: string }[] = [
  { pattern: /lines? of code/i, suggestion: 'replace with hours saved or features delivered' },
  { pattern: /%\s*ai-?suggested/i, suggestion: 'replace with quality-control metric (defect rate, approval rate)' },
  { pattern: /feels? faster/i, suggestion: 'replace with measured time delta + sample size' },
  { pattern: /\d+\s*x\s*(more\s*)?productive/i, suggestion: 'replace with hours-saved figure with sample size' },
];

function fail(msg: string, code: 1 | 2 = 2): never {
  console.error(`${RED}${BOLD}roi-brief:${RESET} ${msg}`);
  exit(code);
}

function requireField(obj: Record<string, unknown>, field: string, hint?: string): void {
  if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
    fail(`missing required field: ${field}${hint ? ` — ${hint}` : ''}`);
  }
}

function requireNonEmptyString(v: unknown, field: string): string {
  if (typeof v !== 'string' || v.trim() === '') {
    fail(`field "${field}" must be a non-empty string`);
  }
  return v;
}

function requireFiniteNumber(v: unknown, field: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    fail(`field "${field}" must be a finite number (got: ${JSON.stringify(v)})`);
  }
  return v;
}

function requireNonNegative(v: unknown, field: string): number {
  const n = requireFiniteNumber(v, field);
  if (n < 0) fail(`field "${field}" must be ≥ 0 (got: ${n})`);
  return n;
}

function validateInputs(raw: unknown): Inputs {
  if (typeof raw !== 'object' || raw === null) fail('inputs JSON must be an object');
  const r = raw as Record<string, unknown>;

  // Top-level required scalars
  for (const f of [
    'workflow_name', 'formula_shape', 'adoption_stage', 'owner',
    'reviewers', 'baseline_ref', 'period_start', 'period_end',
    'tool_versions', 'scope_description', 'metrics_before_after',
    'gross_inputs', 'costs', 'quality_control', 'stop_check', 'recommendation',
  ]) {
    requireField(r, f);
  }

  const workflow_name = requireNonEmptyString(r['workflow_name'], 'workflow_name');
  const formula_shape = requireNonEmptyString(r['formula_shape'], 'formula_shape') as FormulaShape;
  if (!FORMULA_SHAPES.includes(formula_shape)) {
    fail(`formula_shape must be one of ${FORMULA_SHAPES.join(' | ')} (got: ${formula_shape})`);
  }

  const adoption_stage = requireFiniteNumber(r['adoption_stage'], 'adoption_stage');
  if (![1, 2, 3, 4].includes(adoption_stage)) {
    fail(`adoption_stage must be 1, 2, 3, or 4 (got: ${adoption_stage})`);
  }

  const owner = requireNonEmptyString(r['owner'], 'owner');

  const reviewersRaw = r['reviewers'];
  if (!Array.isArray(reviewersRaw) || reviewersRaw.length === 0) {
    fail('reviewers must be a non-empty array (≥ 1 reviewer required)');
  }
  const reviewers = reviewersRaw.map((x, i) => requireNonEmptyString(x, `reviewers[${i}]`));

  const baseline_ref = requireNonEmptyString(r['baseline_ref'], 'baseline_ref');
  // Resolve baseline relative to cwd; if the path doesn't exist, fail fast.
  // This enforces the Module-38-line-62 rule: "you can't show ROI without a baseline."
  const baselineAbs = isAbsolute(baseline_ref) ? baseline_ref : join(cwd(), baseline_ref);
  if (!existsSync(baselineAbs)) {
    fail(
      `baseline file not found: ${baseline_ref}\n` +
      `  Fill documents/roi/baseline-template.md FIRST and commit it before drafting a brief.\n` +
      `  Without a frozen baseline, every later number is unverifiable (Module 38 line 62).`,
    );
  }

  const period_start = requireNonEmptyString(r['period_start'], 'period_start');
  const period_end = requireNonEmptyString(r['period_end'], 'period_end');
  const tool_versions = requireNonEmptyString(r['tool_versions'], 'tool_versions');
  const scope_description = requireNonEmptyString(r['scope_description'], 'scope_description');

  // Vanity-metric scan (warn-but-continue or fail? — we warn and continue;
  // Section C of calculator.md treats it as a rejection reason during human review.)
  for (const { pattern, suggestion } of VANITY_PATTERNS) {
    if (pattern.test(scope_description)) {
      console.error(
        `${YEL}WARN${RESET} vanity-metric phrase detected in scope_description ` +
        `(matched ${pattern.source}). Suggestion: ${suggestion}`,
      );
    }
  }

  const metricsRaw = r['metrics_before_after'];
  if (!Array.isArray(metricsRaw) || metricsRaw.length === 0) {
    fail('metrics_before_after must be a non-empty array (3–5 rows recommended)');
  }
  const metrics_before_after = metricsRaw.map((row, i) => {
    if (typeof row !== 'object' || row === null) fail(`metrics_before_after[${i}] must be an object`);
    const m = row as Record<string, unknown>;
    return {
      name: requireNonEmptyString(m['name'], `metrics_before_after[${i}].name`),
      before: requireFiniteNumber(m['before'], `metrics_before_after[${i}].before`),
      after: requireFiniteNumber(m['after'], `metrics_before_after[${i}].after`),
      sample: requireNonEmptyString(m['sample'], `metrics_before_after[${i}].sample`),
      source: requireNonEmptyString(m['source'], `metrics_before_after[${i}].source`),
    };
  });

  const gi = r['gross_inputs'] as Record<string, unknown>;
  if (typeof gi !== 'object' || gi === null) fail('gross_inputs must be an object');
  const gross_inputs: GrossInputs = {
    input_label: requireNonEmptyString(gi['input_label'], 'gross_inputs.input_label'),
    input_before: requireFiniteNumber(gi['input_before'], 'gross_inputs.input_before'),
    input_after: requireFiniteNumber(gi['input_after'], 'gross_inputs.input_after'),
    multiplier_label: requireNonEmptyString(gi['multiplier_label'], 'gross_inputs.multiplier_label'),
    multiplier_value: requireNonNegative(gi['multiplier_value'], 'gross_inputs.multiplier_value'),
    unit_cost_label: requireNonEmptyString(gi['unit_cost_label'], 'gross_inputs.unit_cost_label'),
    unit_cost_value: requireNonNegative(gi['unit_cost_value'], 'gross_inputs.unit_cost_value'),
  };

  // costs — require ALL FIVE explicitly (use 0 if N/A)
  const cRaw = r['costs'] as Record<string, unknown>;
  if (typeof cRaw !== 'object' || cRaw === null) fail('costs must be an object');
  for (const f of [
    'tool_licenses_usd', 'governance_hours', 'training_hours',
    'incident_recovery_usd', 'eval_infra_usd', 'hourly_rate',
  ]) {
    if (!(f in cRaw) || cRaw[f] === undefined || cRaw[f] === null) {
      fail(
        `costs.${f} missing — show all 5 cost categories explicitly (use 0 for N/A).\n` +
        `  Module 38 line 84 example subtracts every category, even when 0.`,
      );
    }
  }
  const costs: Costs = {
    tool_licenses_usd: requireNonNegative(cRaw['tool_licenses_usd'], 'costs.tool_licenses_usd'),
    governance_hours: requireNonNegative(cRaw['governance_hours'], 'costs.governance_hours'),
    training_hours: requireNonNegative(cRaw['training_hours'], 'costs.training_hours'),
    incident_recovery_usd: requireNonNegative(cRaw['incident_recovery_usd'], 'costs.incident_recovery_usd'),
    eval_infra_usd: requireNonNegative(cRaw['eval_infra_usd'], 'costs.eval_infra_usd'),
    hourly_rate: requireNonNegative(cRaw['hourly_rate'], 'costs.hourly_rate'),
  };
  if (costs.hourly_rate === 0) {
    fail('costs.hourly_rate must be > 0 (used for governance/training $ conversion AND net engineer-hours figure)');
  }

  const qc = r['quality_control'] as Record<string, unknown>;
  if (typeof qc !== 'object' || qc === null) {
    fail(
      'quality_control missing — this row is mandatory.\n' +
      '  A net-savings number without a quality-control number is propaganda (Module 38 line 91).',
    );
  }
  const verdict = requireNonEmptyString(qc['verdict'], 'quality_control.verdict') as QualityVerdict;
  if (!['improved', 'stable', 'degraded'].includes(verdict)) {
    fail(`quality_control.verdict must be improved | stable | degraded (got: ${verdict})`);
  }
  const quality_control: QualityControl = {
    metric_name: requireNonEmptyString(qc['metric_name'], 'quality_control.metric_name'),
    before: requireFiniteNumber(qc['before'], 'quality_control.before'),
    after: requireFiniteNumber(qc['after'], 'quality_control.after'),
    verdict,
  };

  const sc = r['stop_check'] as Record<string, unknown>;
  if (typeof sc !== 'object' || sc === null) fail('stop_check must be an object');
  const stopFields = [
    'no_recent_incidents', 'eval_pass_rate_above_gate', 'engineers_reading_prs',
    'cost_per_release_stable', 'governance_owner_stable',
  ] as const;
  for (const f of stopFields) {
    if (typeof sc[f] !== 'boolean') fail(`stop_check.${f} must be true | false`);
  }
  const stop_check: StopCheck = {
    no_recent_incidents: sc['no_recent_incidents'] as boolean,
    eval_pass_rate_above_gate: sc['eval_pass_rate_above_gate'] as boolean,
    engineers_reading_prs: sc['engineers_reading_prs'] as boolean,
    cost_per_release_stable: sc['cost_per_release_stable'] as boolean,
    governance_owner_stable: sc['governance_owner_stable'] as boolean,
  };

  const recommendation = requireNonEmptyString(r['recommendation'], 'recommendation') as Recommendation;
  if (!['maintain', 'advance', 'pause', 'rollback'].includes(recommendation)) {
    fail(`recommendation must be maintain | advance | pause | rollback (got: ${recommendation})`);
  }
  // Cross-check: cannot advance with any red stop-check
  if (recommendation === 'advance') {
    const reds = stopFields.filter(f => stop_check[f] === false);
    if (reds.length > 0) {
      fail(
        `recommendation = "advance" but ${reds.length} red stop-check(s): ${reds.join(', ')}.\n` +
        `  Module 38 line 119: pause AI adoption when any stop-check is red.`,
      );
    }
  }

  return {
    workflow_name, formula_shape, adoption_stage: adoption_stage as 1 | 2 | 3 | 4, owner,
    reviewers, baseline_ref, period_start, period_end, tool_versions,
    scope_description, metrics_before_after, gross_inputs, costs,
    quality_control, stop_check, recommendation,
  };
}

// ── computation ──────────────────────────────────────────────────────────────
function compute(inputs: Inputs, verbose: boolean): Computed {
  const { gross_inputs: gi, costs } = inputs;
  const delta = gi.input_before - gi.input_after;
  const gross_savings_usd = delta * gi.multiplier_value * gi.unit_cost_value;
  // For TIME-SAVING gross_h is meaningful; for the others we still report
  // an "engineer-hours equivalent" using the hourly_rate so the brief is
  // comparable across formula shapes.
  const gross_savings_hours = inputs.formula_shape === 'TIME-SAVING'
    ? delta * gi.multiplier_value
    : gross_savings_usd / costs.hourly_rate;

  const cost_breakdown = [
    { label: 'Tool licences', usd: costs.tool_licenses_usd },
    { label: `Governance (${costs.governance_hours} h × $${costs.hourly_rate}/h)`, usd: costs.governance_hours * costs.hourly_rate },
    { label: `Training (${costs.training_hours} h × $${costs.hourly_rate}/h)`, usd: costs.training_hours * costs.hourly_rate },
    { label: 'Incident recovery', usd: costs.incident_recovery_usd },
    { label: 'Eval infrastructure', usd: costs.eval_infra_usd },
  ];
  const total_costs_usd = cost_breakdown.reduce((s, x) => s + x.usd, 0);

  const net_savings_usd = gross_savings_usd - total_costs_usd;
  const net_savings_hours = net_savings_usd / costs.hourly_rate;

  const reduction_pct = gi.input_before === 0
    ? 0
    : Math.round((delta / gi.input_before) * 1000) / 10; // 1 decimal

  if (verbose) {
    console.error(`${DIM}─── computation ───${RESET}`);
    console.error(`${DIM}delta             :${RESET} ${gi.input_before} − ${gi.input_after} = ${delta}`);
    console.error(`${DIM}gross_savings_usd :${RESET} ${delta} × ${gi.multiplier_value} × ${gi.unit_cost_value} = $${fmt$(gross_savings_usd)}`);
    console.error(`${DIM}gross_savings_h   :${RESET} ${fmtH(gross_savings_hours)}`);
    for (const cb of cost_breakdown) {
      console.error(`${DIM}cost ${cb.label.padEnd(48)}:${RESET} $${fmt$(cb.usd)}`);
    }
    console.error(`${DIM}total_costs_usd   :${RESET} $${fmt$(total_costs_usd)}`);
    console.error(`${DIM}net_savings_usd   :${RESET} $${fmt$(net_savings_usd)}`);
    console.error(`${DIM}net_savings_h     :${RESET} ${fmtH(net_savings_hours)}`);
    console.error(`${DIM}reduction_pct     :${RESET} ${reduction_pct}%`);
    console.error('');
  }

  return {
    gross_savings_usd,
    gross_savings_hours,
    total_costs_usd,
    net_savings_usd,
    net_savings_hours,
    reduction_pct,
    cost_breakdown,
  };
}

// ── formatting helpers ───────────────────────────────────────────────────────
function fmt$(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtH(n: number): string {
  return `${n.toFixed(1)} h`;
}
function fmt$k(n: number): string {
  return `$${(n / 1000).toFixed(1)}k`;
}
function checkbox(v: boolean): string { return v ? '✅' : '❌'; }

// ── render the Markdown brief ────────────────────────────────────────────────
function render(inputs: Inputs, c: Computed): string {
  const i = inputs;
  const qcEmoji = { improved: '✅ improved', stable: '✅ stable', degraded: '❌ degraded — STOP' }[i.quality_control.verdict];

  const reviewerList = i.reviewers.map(r => `${r}`).join(', ');
  const formulaLine = (() => {
    switch (i.formula_shape) {
      case 'TIME-SAVING':
        return `(${i.gross_inputs.input_before} − ${i.gross_inputs.input_after}) ${i.gross_inputs.input_label.includes('h') ? 'h' : ''} × ${i.gross_inputs.multiplier_value} ${i.gross_inputs.multiplier_label} × $${i.gross_inputs.unit_cost_value}/${i.gross_inputs.unit_cost_label.replace(/^\$\//, '')}`;
      case 'DEFECT-PREVENTION':
        return `(${i.gross_inputs.input_before} − ${i.gross_inputs.input_after}) events × ${i.gross_inputs.multiplier_value} × $${fmt$(i.gross_inputs.unit_cost_value)}/event`;
      case 'COST-REDUCTION':
        return `(${i.gross_inputs.input_before} − ${i.gross_inputs.input_after}) units × ${i.gross_inputs.multiplier_value} × $${i.gross_inputs.unit_cost_value}/unit`;
    }
  })();

  const sentence =
    `*"${i.workflow_name} cut ${i.gross_inputs.input_label} from ${i.gross_inputs.input_before} → ${i.gross_inputs.input_after} ` +
    `(${c.reduction_pct}% reduction). Across ${i.gross_inputs.multiplier_value} ${i.gross_inputs.multiplier_label} ` +
    `last quarter that saved ~${fmtH(c.gross_savings_hours)} = ~${fmt$k(c.gross_savings_usd)}. Net of ` +
    `${fmt$k(c.total_costs_usd)} in tool/governance/training/incident/eval overhead, ` +
    `**net savings ~${fmt$k(c.net_savings_usd)}/quarter** with ${i.quality_control.metric_name} ` +
    `${i.quality_control.verdict} (${i.quality_control.before} → ${i.quality_control.after})."*`;

  const stopCheckRows: [string, boolean][] = [
    ['No AI-attributable incident in last 30 days with unfixed root cause', i.stop_check.no_recent_incidents],
    ['Eval-set pass rate ≥ gate for the period', i.stop_check.eval_pass_rate_above_gate],
    ['Engineers reading AI-assisted PRs (sample 10 — count comments)', i.stop_check.engineers_reading_prs],
    ['Cost per release growing slower than features delivered', i.stop_check.cost_per_release_stable],
    ['Governance owner stable for ≥ 1 quarter', i.stop_check.governance_owner_stable],
  ];

  return `# ROI Brief — ${i.workflow_name} — ${i.period_start} → ${i.period_end}

> Generated by \`.agents/skills/roi-brief\` from inputs validated against
> [\`documents/roi/calculator.md\`](../documents/roi/calculator.md) Section A.

## 0. Status

| Field | Value |
|---|---|
| Workflow | ${i.workflow_name} |
| Adoption-ladder stage | Stage ${i.adoption_stage} |
| Formula shape | ${i.formula_shape} |
| Owner | ${i.owner} |
| Reviewers | ${reviewerList} |
| Baseline reference | \`${i.baseline_ref}\` |
| Period covered | ${i.period_start} → ${i.period_end} |
| Tool versions | ${i.tool_versions} |
| Date generated | ${new Date().toISOString().slice(0, 10)} |

## 1. Workflow scope

${i.scope_description}

## 2. Before/after metrics

| Metric | Before | After | Sample size | Source |
|---|---|---|---|---|
${i.metrics_before_after.map(m => `| ${m.name} | ${m.before} | ${m.after} | ${m.sample} | ${m.source} |`).join('\n')}

## 3. Gross savings — formula and math

**Formula shape used:** \`${i.formula_shape}\`

\`\`\`
GROSS_SAVINGS = ${formulaLine}
              = $${fmt$(c.gross_savings_usd)} / quarter
              = ${fmtH(c.gross_savings_hours)} engineer-hours equivalent
\`\`\`

| Input | Value | Source |
|---|---|---|
| ${i.gross_inputs.input_label} (before / after) | ${i.gross_inputs.input_before} / ${i.gross_inputs.input_after} | from §2 |
| ${i.gross_inputs.multiplier_label} | ${i.gross_inputs.multiplier_value} | baseline anchor |
| ${i.gross_inputs.unit_cost_label} | $${i.gross_inputs.unit_cost_value} | baseline anchor |

## 4. All-in costs (all five categories)

| Cost category | $ |
|---|---|
${c.cost_breakdown.map(cb => `| ${cb.label} | $${fmt$(cb.usd)} |`).join('\n')}
| **TOTAL_COSTS** | **$${fmt$(c.total_costs_usd)}** |

## 5. Quality-control number (mandatory)

| Quality metric | Before (baseline) | After (this period) | Verdict |
|---|---|---|---|
| ${i.quality_control.metric_name} | ${i.quality_control.before} | ${i.quality_control.after} | ${qcEmoji} |

${i.quality_control.verdict === 'degraded'
  ? '> ⚠️ **Verdict = degraded.** Net dollars do not matter; you traded speed for defects. Investigate before reporting this brief externally.'
  : ''}

## 6. Net ROI

\`\`\`
NET_SAVINGS = GROSS_SAVINGS − TOTAL_COSTS
            = $${fmt$(c.gross_savings_usd)} − $${fmt$(c.total_costs_usd)}
            = $${fmt$(c.net_savings_usd)} per quarter
\`\`\`

Engineer-hours equivalent: **${fmtH(c.net_savings_hours)} / quarter**.

## 7. Net ROI sentence (dashboard row)

> ${sentence}

## 8. Stop-adopting check (Module 38 line 119)

| Check | Status |
|---|---|
${stopCheckRows.map(([label, ok]) => `| ${label} | ${checkbox(ok)} |`).join('\n')}

${stopCheckRows.some(([, ok]) => !ok)
  ? '> ⚠️ At least one red — recommend pause; do not advance adoption-ladder stage this quarter.'
  : '> All green — safe to consider stage advance per §9.'}

## 9. Recommendation

- ${i.recommendation === 'maintain' ? '☑' : '☐'} Maintain current adoption-ladder stage
- ${i.recommendation === 'advance' ? '☑' : '☐'} Advance to next stage (cite Module 38 gate criteria)
- ${i.recommendation === 'pause' ? '☑' : '☐'} **Pause** — see §8
- ${i.recommendation === 'rollback' ? '☑' : '☐'} Roll back

## 10. Sign-off

| Role | Name | Date |
|---|---|---|
| Workflow owner | ${i.owner} | |
${i.reviewers.map(r => `| Reviewer | ${r} | |`).join('\n')}
| Finance partner | | |
| AI Quality Leader | | |

---

> Re-derive the math: \`npx tsx .agents/skills/roi-brief/scripts/draft-roi-brief.ts <inputs.json> --verbose\`
`;
}

// ── trend file (append-only) ─────────────────────────────────────────────────
function appendTrend(inputs: Inputs, c: Computed, briefPath: string | undefined): void {
  const dir = 'reports';
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const file = join(dir, 'roi-trend.json');
  const row = {
    ts: new Date().toISOString(),
    workflow: inputs.workflow_name,
    formula_shape: inputs.formula_shape,
    adoption_stage: inputs.adoption_stage,
    period_start: inputs.period_start,
    period_end: inputs.period_end,
    gross_usd: Math.round(c.gross_savings_usd),
    total_costs_usd: Math.round(c.total_costs_usd),
    net_usd: Math.round(c.net_savings_usd),
    quality_verdict: inputs.quality_control.verdict,
    recommendation: inputs.recommendation,
    brief_path: briefPath ?? '(stdout)',
  };
  if (existsSync(file)) {
    appendFileSync(file, '\n' + JSON.stringify(row));
  } else {
    writeFileSync(file, JSON.stringify(row));
  }
}

// ── main ─────────────────────────────────────────────────────────────────────
function main(): void {
  const args = parseArgs();
  if (args.help || !args.input) {
    printHelp();
    exit(args.help ? 0 : 2);
  }

  // Load + validate
  const inputPath = isAbsolute(args.input) ? args.input : resolve(cwd(), args.input);
  if (!existsSync(inputPath)) fail(`inputs file not found: ${args.input}`);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(inputPath, 'utf8'));
  } catch (e) {
    fail(`inputs JSON parse error: ${(e as Error).message}`);
  }
  const inputs = validateInputs(raw);
  const computed = compute(inputs, args.verbose);

  // Render
  const md = render(inputs, computed);

  if (args.out) {
    const outPath = isAbsolute(args.out) ? args.out : resolve(cwd(), args.out);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, md);
    console.error(`${GRN}wrote${RESET} ${args.out} (${md.length} bytes)`);
  } else {
    stdout.write(md);
  }

  if (args.trend) {
    appendTrend(inputs, computed, args.out);
    console.error(`${GRN}appended${RESET} reports/roi-trend.json`);
  }

  // Exit with the quality-control signal
  if (inputs.quality_control.verdict === 'degraded') {
    console.error(`${YEL}WARN${RESET} quality_control.verdict = "degraded" — exit 1 so CI flags this`);
    exit(1);
  }

  exit(0);
}

main();
