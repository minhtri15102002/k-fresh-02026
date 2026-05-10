#!/usr/bin/env -S npx tsx
/**
 * .agents/skills/quality-org-charter/scripts/draft-charter.ts
 *
 * Drafts a Quality Org Charter from a JSON inputs file. Validates that all
 * 10 sections are populated, the principle / anti-principle counts are 3-5,
 * the decision-rights table has ≥ 6 rows, and the quality bar has ≥ 3
 * measurable thresholds — then emits a deterministic Markdown charter that
 * matches templates/manager/quality-org-charter-template.md.
 *
 * Exit codes:
 *   0   charter emitted; all validations passed
 *   2   invocation error (missing field, count out of range, placeholder text, etc.)
 *
 * Usage:
 *   ./draft-charter.ts <inputs.json>
 *   ./draft-charter.ts <inputs.json> --out reports/charter.md
 *   ./draft-charter.ts <inputs.json> --verbose
 *   ./draft-charter.ts --help
 */

import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { argv, cwd, exit, stdout } from 'node:process';

// ── pretty ───────────────────────────────────────────────────────────────────
const RED = '\x1b[31m';
const GRN = '\x1b[32m';
const YEL = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// ── types ────────────────────────────────────────────────────────────────────
interface DecisionRight {
  decision: string;
  decides: string;
  consults: string[];
  informs: string[];
}

interface QualityBarRow {
  threshold: string;
  source: string;
}

interface OperatingModel {
  ones_on_ones: string;
  standup: string;
  retro: string;
  planning: string;
  on_call: string;
  skip_levels: string;
}

interface IncidentResponse {
  war_room_roles: string;
  post_mortem_sla: string;
  change_framework: string;
  customer_comms_threshold: string;
}

interface Hiring {
  loop_stages: number;
  bar_raiser: boolean;
  growth_plan_cadence_months: number;
  perf_mgmt_principle: string;
}

interface Communication {
  threaded_doc_threshold: string;
  exec_brief_format: string;
  no_forms: string[];
}

interface ManagerOperating {
  office_hours: string;
  skip_level_cadence: string;
  self_retro_cadence: string;
}

interface Inputs {
  team_name: string;
  author: string;
  author_role: string;
  version: string;
  next_review_date: string;
  reviewers: string[];
  mission: string;
  principles: string[];
  anti_principles: string[];
  operating_model: OperatingModel;
  decision_rights: DecisionRight[];
  quality_bar: QualityBarRow[];
  incident_response: IncidentResponse;
  hiring: Hiring;
  communication: Communication;
  manager_operating: ManagerOperating;
}

// ── args ─────────────────────────────────────────────────────────────────────
interface Args {
  input?: string;
  out?: string;
  verbose: boolean;
  help: boolean;
}

function parseArgs(): Args {
  const a: Args = { verbose: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const v = argv[i];
    if (!v) continue;
    if (v === '--help' || v === '-h') a.help = true;
    else if (v === '--verbose') a.verbose = true;
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
  console.log(`${BOLD}draft-charter.ts${RESET} — emit a Quality Org Charter

${BOLD}Usage${RESET}
  draft-charter.ts <inputs.json>
  draft-charter.ts <inputs.json> --out reports/charter.md
  draft-charter.ts <inputs.json> --verbose

${BOLD}Flags${RESET}
  --out <path>   write the charter to a file (default: stdout)
  --verbose      print every validation step to stderr
  --help, -h     show this help

${BOLD}Exit codes${RESET}
  0   charter emitted; validations passed
  2   invocation error (missing field, invalid JSON, count out of range, ...)

${BOLD}Inputs schema${RESET}
  See .agents/skills/quality-org-charter/resources/inputs-example.json`);
}

// ── validation ───────────────────────────────────────────────────────────────
const PLACEHOLDER_RE = /<(?:\.{3}|placeholder|your\s|team-name|name|YYYY-)/i;
const VAGUE_PRINCIPLE_RE = /\b(be more|try to|always|never|strive|do (?:our )?best|when possible)\b/i;

function fail(msg: string): never {
  console.error(`${RED}${BOLD}quality-org-charter:${RESET} ${msg}`);
  exit(2);
}

function warn(msg: string): void {
  console.error(`${YEL}WARN${RESET} ${msg}`);
}

function requireField(obj: Record<string, unknown>, field: string): void {
  if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
    fail(`missing required field: ${field}`);
  }
}

function requireNonEmptyString(v: unknown, field: string): string {
  if (typeof v !== 'string' || v.trim() === '') {
    fail(`field "${field}" must be a non-empty string`);
  }
  if (PLACEHOLDER_RE.test(v)) {
    fail(`field "${field}" contains placeholder text — fill it in (saw: ${JSON.stringify(v).slice(0, 80)}...)`);
  }
  return v;
}

function requireNonNegativeInt(v: unknown, field: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || !Number.isInteger(v) || v < 0) {
    fail(`field "${field}" must be a non-negative integer (got: ${JSON.stringify(v)})`);
  }
  return v;
}

function requireBoolean(v: unknown, field: string): boolean {
  if (typeof v !== 'boolean') fail(`field "${field}" must be true | false`);
  return v;
}

function requireArrayOfStrings(v: unknown, field: string, min: number, max: number): string[] {
  if (!Array.isArray(v)) fail(`field "${field}" must be an array`);
  if (v.length < min || v.length > max) {
    fail(`field "${field}" must have ${min}-${max} entries (got: ${v.length})`);
  }
  return v.map((x, i) => requireNonEmptyString(x, `${field}[${i}]`));
}

function validateInputs(raw: unknown, verbose: boolean): Inputs {
  if (typeof raw !== 'object' || raw === null) fail('inputs JSON must be an object');
  const r = raw as Record<string, unknown>;

  // Top-level
  for (const f of [
    'team_name', 'author', 'author_role', 'version', 'next_review_date', 'reviewers',
    'mission', 'principles', 'anti_principles',
    'operating_model', 'decision_rights', 'quality_bar',
    'incident_response', 'hiring', 'communication', 'manager_operating',
  ]) requireField(r, f);

  const team_name = requireNonEmptyString(r['team_name'], 'team_name');
  const author = requireNonEmptyString(r['author'], 'author');
  const author_role = requireNonEmptyString(r['author_role'], 'author_role');
  const version = requireNonEmptyString(r['version'], 'version');
  const next_review_date = requireNonEmptyString(r['next_review_date'], 'next_review_date');

  // Reviewers — ≥ 1
  const reviewersRaw = r['reviewers'];
  if (!Array.isArray(reviewersRaw) || reviewersRaw.length === 0) {
    fail('reviewers must be a non-empty array (≥ 1 reviewer required per Track P graduation criterion)');
  }
  const reviewers = reviewersRaw.map((x, i) => requireNonEmptyString(x, `reviewers[${i}]`));

  // Mission — single sentence (warn-only on length)
  const mission = requireNonEmptyString(r['mission'], 'mission');
  const missionWordCount = mission.trim().split(/\s+/).length;
  if (missionWordCount > 25) {
    warn(`mission is ${missionWordCount} words — should be one sentence (≤ 25 words). Consider tightening.`);
  }

  // Principles — 3-5
  const principles = requireArrayOfStrings(r['principles'], 'principles', 3, 5);
  for (let i = 0; i < principles.length; i++) {
    const p = principles[i];
    if (p !== undefined && VAGUE_PRINCIPLE_RE.test(p)) {
      warn(`principles[${i}] contains weasel words (e.g. "be more", "always", "strive") — consider rephrasing as observable behaviour`);
    }
  }

  // Anti-principles — 3-5 (same constraint)
  const anti_principles = requireArrayOfStrings(r['anti_principles'], 'anti_principles', 3, 5);

  // Operating model
  const om = r['operating_model'] as Record<string, unknown>;
  if (typeof om !== 'object' || om === null) fail('operating_model must be an object');
  const operating_model: OperatingModel = {
    ones_on_ones:  requireNonEmptyString(om['ones_on_ones'],  'operating_model.ones_on_ones'),
    standup:       requireNonEmptyString(om['standup'],       'operating_model.standup'),
    retro:         requireNonEmptyString(om['retro'],         'operating_model.retro'),
    planning:      requireNonEmptyString(om['planning'],      'operating_model.planning'),
    on_call:       requireNonEmptyString(om['on_call'],       'operating_model.on_call'),
    skip_levels:   requireNonEmptyString(om['skip_levels'],   'operating_model.skip_levels'),
  };

  // Decision rights — ≥ 6
  const decisionRightsRaw = r['decision_rights'];
  if (!Array.isArray(decisionRightsRaw) || decisionRightsRaw.length < 6) {
    fail(`decision_rights must have ≥ 6 entries (got: ${Array.isArray(decisionRightsRaw) ? decisionRightsRaw.length : 'not an array'})\n  M5 §5: list the decisions you actually face quarterly.`);
  }
  const decision_rights: DecisionRight[] = decisionRightsRaw.map((row, i) => {
    if (typeof row !== 'object' || row === null) fail(`decision_rights[${i}] must be an object`);
    const d = row as Record<string, unknown>;
    return {
      decision: requireNonEmptyString(d['decision'], `decision_rights[${i}].decision`),
      decides:  requireNonEmptyString(d['decides'],  `decision_rights[${i}].decides`),
      consults: Array.isArray(d['consults']) ? d['consults'].map((x, j) => requireNonEmptyString(x, `decision_rights[${i}].consults[${j}]`)) : (() => fail(`decision_rights[${i}].consults must be an array (use [] if none)`))(),
      informs:  Array.isArray(d['informs'])  ? d['informs'].map((x, j) => requireNonEmptyString(x, `decision_rights[${i}].informs[${j}]`))   : (() => fail(`decision_rights[${i}].informs must be an array (use [] if none)`))(),
    };
  });

  // Quality bar — ≥ 3
  const qualityBarRaw = r['quality_bar'];
  if (!Array.isArray(qualityBarRaw) || qualityBarRaw.length < 3) {
    fail(`quality_bar must have ≥ 3 entries (got: ${Array.isArray(qualityBarRaw) ? qualityBarRaw.length : 'not an array'})\n  M4 §SLOs lists 5 candidates; pick at least 3.`);
  }
  const quality_bar: QualityBarRow[] = qualityBarRaw.map((row, i) => {
    if (typeof row !== 'object' || row === null) fail(`quality_bar[${i}] must be an object`);
    const q = row as Record<string, unknown>;
    return {
      threshold: requireNonEmptyString(q['threshold'], `quality_bar[${i}].threshold`),
      source:    requireNonEmptyString(q['source'],    `quality_bar[${i}].source`),
    };
  });

  // Incident response
  const ir = r['incident_response'] as Record<string, unknown>;
  if (typeof ir !== 'object' || ir === null) fail('incident_response must be an object');
  const incident_response: IncidentResponse = {
    war_room_roles:           requireNonEmptyString(ir['war_room_roles'],           'incident_response.war_room_roles'),
    post_mortem_sla:          requireNonEmptyString(ir['post_mortem_sla'],          'incident_response.post_mortem_sla'),
    change_framework:         requireNonEmptyString(ir['change_framework'],         'incident_response.change_framework'),
    customer_comms_threshold: requireNonEmptyString(ir['customer_comms_threshold'], 'incident_response.customer_comms_threshold'),
  };

  // Hiring
  const h = r['hiring'] as Record<string, unknown>;
  if (typeof h !== 'object' || h === null) fail('hiring must be an object');
  const hiring: Hiring = {
    loop_stages:                 requireNonNegativeInt(h['loop_stages'], 'hiring.loop_stages'),
    bar_raiser:                  requireBoolean(h['bar_raiser'],         'hiring.bar_raiser'),
    growth_plan_cadence_months:  requireNonNegativeInt(h['growth_plan_cadence_months'], 'hiring.growth_plan_cadence_months'),
    perf_mgmt_principle:         requireNonEmptyString(h['perf_mgmt_principle'],        'hiring.perf_mgmt_principle'),
  };
  if (hiring.loop_stages < 3) {
    warn(`hiring.loop_stages = ${hiring.loop_stages}; M2 recommends 4 stages + bar raiser`);
  }

  // Communication
  const c = r['communication'] as Record<string, unknown>;
  if (typeof c !== 'object' || c === null) fail('communication must be an object');
  const noFormsRaw = c['no_forms'];
  const communication: Communication = {
    threaded_doc_threshold: requireNonEmptyString(c['threaded_doc_threshold'], 'communication.threaded_doc_threshold'),
    exec_brief_format:      requireNonEmptyString(c['exec_brief_format'],      'communication.exec_brief_format'),
    no_forms:               Array.isArray(noFormsRaw) && noFormsRaw.length > 0
                              ? noFormsRaw.map((x, i) => requireNonEmptyString(x, `communication.no_forms[${i}]`))
                              : (() => fail('communication.no_forms must be a non-empty array (M3 names 3 forms)'))(),
  };

  // Manager operating
  const mo = r['manager_operating'] as Record<string, unknown>;
  if (typeof mo !== 'object' || mo === null) fail('manager_operating must be an object');
  const manager_operating: ManagerOperating = {
    office_hours:        requireNonEmptyString(mo['office_hours'],        'manager_operating.office_hours'),
    skip_level_cadence:  requireNonEmptyString(mo['skip_level_cadence'],  'manager_operating.skip_level_cadence'),
    self_retro_cadence:  requireNonEmptyString(mo['self_retro_cadence'],  'manager_operating.self_retro_cadence'),
  };

  if (verbose) {
    console.error(`${DIM}─── validation summary ───${RESET}`);
    console.error(`${DIM}team             :${RESET} ${team_name}`);
    console.error(`${DIM}principles       :${RESET} ${principles.length} (3-5 required)`);
    console.error(`${DIM}anti_principles  :${RESET} ${anti_principles.length} (3-5 required)`);
    console.error(`${DIM}decision_rights  :${RESET} ${decision_rights.length} rows (≥ 6 required)`);
    console.error(`${DIM}quality_bar      :${RESET} ${quality_bar.length} rows (≥ 3 required)`);
    console.error(`${DIM}reviewers        :${RESET} ${reviewers.length}`);
    console.error('');
  }

  return {
    team_name, author, author_role, version, next_review_date, reviewers,
    mission, principles, anti_principles,
    operating_model, decision_rights, quality_bar,
    incident_response, hiring, communication, manager_operating,
  };
}

// ── render the Markdown charter ──────────────────────────────────────────────
function fmtConsultsOrInforms(arr: string[]): string {
  return arr.length === 0 ? '—' : arr.join(', ');
}

/** Compute the relative link from the (eventual) output file to a repo-root-relative target. */
function relLink(outDirAbs: string, repoRelTarget: string): string {
  // outDirAbs is absolute path to the directory the charter file will live in.
  // We want a path FROM that dir TO <repoRoot>/<repoRelTarget>.
  // We assume the script runs from the repo root (true for `npm run`), so cwd() === repo root.
  const targetAbs = resolve(cwd(), repoRelTarget);
  return relative(outDirAbs, targetAbs) || '.';
}

function render(i: Inputs, outDirAbs: string): string {
  const sourceUrl = relLink(outDirAbs, 'training/track-p-people-and-management/p05-people-first-incident-and-change-leadership.md');

  return `# ${i.team_name} — Quality Org Charter — v${i.version}

> **Track P graduation artifact** · authored by ${i.author} (${i.author_role})
> Generated by \`.agents/skills/quality-org-charter\` from validated inputs.
> Living document. Versioned. Reviewed annually with the team.
> Next review: **${i.next_review_date}**

---

## 1. Mission

${i.mission}

## 2. Operating principles

${i.principles.map((p, n) => `${n + 1}. ${p}`).join('\n')}

## 3. Anti-principles (what we will NOT do)

> Most useful when you're tired. They cut decisions you'd otherwise litigate badly at 6pm.

${i.anti_principles.map((p, n) => `${n + 1}. ${p}`).join('\n')}

## 4. Team operating model

| Practice | Cadence / Notes |
|---|---|
| 1:1s | ${i.operating_model.ones_on_ones} |
| Standup | ${i.operating_model.standup} |
| Retro | ${i.operating_model.retro} |
| Quarterly planning | ${i.operating_model.planning} |
| On-call | ${i.operating_model.on_call} |
| Skip-level 1:1s | ${i.operating_model.skip_levels} |

## 5. Decision rights

| Decision | Who decides | Who must be consulted | Who is informed |
|---|---|---|---|
${i.decision_rights.map(d => `| ${d.decision} | ${d.decides} | ${fmtConsultsOrInforms(d.consults)} | ${fmtConsultsOrInforms(d.informs)} |`).join('\n')}

## 6. Quality bar (the floor)

> Threshold at which we stop the line.

${i.quality_bar.map((q, n) => `${n + 1}. **${q.threshold}** · *Source:* ${q.source}`).join('\n')}

## 7. Incident & change response

- **War-room roles:** ${i.incident_response.war_room_roles}
- **Post-mortem SLA:** ${i.incident_response.post_mortem_sla}
- **Change-management framework:** ${i.incident_response.change_framework}
- **Customer comms threshold:** ${i.incident_response.customer_comms_threshold}

## 8. How we hire and grow

- **Interview loop:** ${i.hiring.loop_stages} stages${i.hiring.bar_raiser ? ' + bar raiser' : ' (no bar raiser — consider adding one)'}
- **Growth plans:** every ${i.hiring.growth_plan_cadence_months} months, every IC
- **Performance management:** ${i.hiring.perf_mgmt_principle}

## 9. How we communicate

- **Threaded docs:** ${i.communication.threaded_doc_threshold}
- **Executive briefs:** ${i.communication.exec_brief_format}
- **Three forms of "no":** ${i.communication.no_forms.join(' · ')}

## 10. How I (the manager) operate

- **Office hours:** ${i.manager_operating.office_hours}
- **Skip-level cadence:** ${i.manager_operating.skip_level_cadence}
- **Self-retro cadence:** ${i.manager_operating.self_retro_cadence}

---

## Sign-off

| Role | Name | Date |
|---|---|---|
| Author (${i.author_role}) | ${i.author} | |
${i.reviewers.map(r => `| Reviewer | ${r} | |`).join('\n')}

— Version: ${i.version} · Next review: ${i.next_review_date}

---

> Source: [Track P · Module 5](${sourceUrl}) §"The Quality Org Charter"
> Re-emit: \`npx tsx .agents/skills/quality-org-charter/scripts/draft-charter.ts <inputs.json>\`
`;
}

// ── main ─────────────────────────────────────────────────────────────────────
function main(): void {
  const args = parseArgs();
  if (args.help || !args.input) {
    printHelp();
    exit(args.help ? 0 : 2);
  }

  const inputPath = isAbsolute(args.input) ? args.input : resolve(cwd(), args.input);
  if (!existsSync(inputPath)) fail(`inputs file not found: ${args.input}`);

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(inputPath, 'utf8'));
  } catch (e) {
    fail(`inputs JSON parse error: ${(e as Error).message}`);
  }

  const inputs = validateInputs(raw, args.verbose);

  // Compute the absolute output dir so the renderer can emit correct relative links.
  // For stdout-only invocations, default to `reports/` (the SKILL.md's recommended location).
  const outAbsPath = args.out
    ? (isAbsolute(args.out) ? args.out : resolve(cwd(), args.out))
    : resolve(cwd(), 'reports/quality-org-charter.md');
  const outDirAbs = dirname(outAbsPath);

  const md = render(inputs, outDirAbs);

  if (args.out) {
    mkdirSync(outDirAbs, { recursive: true });
    writeFileSync(outAbsPath, md);
    console.error(`${GRN}wrote${RESET} ${args.out} (${md.length} bytes)`);
  } else {
    stdout.write(md);
  }

  exit(0);
}

main();
