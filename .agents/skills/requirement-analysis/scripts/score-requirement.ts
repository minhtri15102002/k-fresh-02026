#!/usr/bin/env -S npx tsx
/**
 * .agents/skills/requirement-analysis/scripts/score-requirement.ts
 *
 * Heuristic requirement scorer. Reads a Markdown requirement file, runs:
 *   - INVEST/SMART weak-signal checks
 *   - Ambiguity / weasel-word scan
 *   - Completeness checklist (presence of expected sections)
 * Emits a JSON scorecard to stdout AND appends a row to
 * reports/requirement-scorecards/index.json.
 *
 * This script is a heuristic first pass — a green verdict here does NOT
 * replace human review. The skill's full procedure (in SKILL.md) is the
 * authoritative analysis; this script automates the cheap checks.
 *
 * Exit codes:
 *   0  READY-FOR-DESIGN  — no fatal smells; humans should still confirm
 *   1  NEEDS-REFINEMENT  — fixable problems; re-run after refinement
 *   2  REJECT or invocation error
 *
 * Usage:
 *   ./score-requirement.ts <path/to/requirement.md>
 *   ./score-requirement.ts <path/to/requirement.md> --out reports/scorecards/REQ-X.json
 *   ./score-requirement.ts <path/to/requirement.md> --no-append
 *   ./score-requirement.ts --help
 */

import { existsSync, readFileSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { argv, cwd, exit, stdout } from 'node:process';

// ── pretty ───────────────────────────────────────────────────────────────────
const RED = '\x1b[31m';
const GRN = '\x1b[32m';
const YEL = '\x1b[33m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// ── types ────────────────────────────────────────────────────────────────────
type Score = 'pass' | 'weak' | 'fail';
type Verdict = 'READY-FOR-DESIGN' | 'NEEDS-REFINEMENT' | 'REJECT';

interface AmbiguityHit {
  smellClass: string;
  evidence: string;
  line: number;
  suggestion: string;
}

interface CompletenessRow {
  element: string;
  covered: boolean;
}

interface Scorecard {
  ts: string;
  req_id: string;
  title: string;
  source: string;
  scorecard_path?: string;

  invest: Record<'independent' | 'negotiable' | 'valuable' | 'estimable' | 'small' | 'testable', Score>;
  smart: Record<'specific' | 'measurable' | 'achievable' | 'relevant' | 'time_bound', Score>;

  ambiguity: {
    total_smells: number;
    critical_position_smells: number;
    by_class: Record<string, number>;
  };

  completeness: {
    covered: number;
    missing: number;
    missing_items: string[];
  };

  ac_count: number;
  ready_to_draft_acs: boolean;

  verdict: Verdict;
  blockers: string[];
}

// ── args ─────────────────────────────────────────────────────────────────────
interface Args {
  input?: string;
  out?: string;
  noAppend: boolean;
  help: boolean;
}

function parseArgs(): Args {
  const a: Args = { noAppend: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const v = argv[i];
    if (!v) continue;
    if (v === '--help' || v === '-h') {
      a.help = true;
    } else if (v === '--no-append') {
      a.noAppend = true;
    } else if (v === '--out') {
      const next = argv[++i];
      if (next === undefined) {
        console.error(`${RED}--out requires a path argument${RESET}`);
        exit(2);
      }
      a.out = next;
    } else if (v.startsWith('--')) {
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
  console.log(`${BOLD}score-requirement.ts${RESET} — heuristic requirement scorer

${BOLD}Usage${RESET}
  score-requirement.ts <path/to/requirement.md>
  score-requirement.ts <path/to/requirement.md> --out reports/scorecards/REQ-X.json
  score-requirement.ts <path/to/requirement.md> --no-append

${BOLD}Flags${RESET}
  --out <path>     write the JSON scorecard to a file (default: stdout)
  --no-append      do NOT append a row to reports/requirement-scorecards/index.json
  --help, -h       show this help

${BOLD}Exit codes${RESET}
  0   READY-FOR-DESIGN   (humans should still confirm)
  1   NEEDS-REFINEMENT
  2   REJECT or invocation error

This is a heuristic first-pass. The authoritative analysis lives in
.agents/skills/requirement-analysis/SKILL.md.`);
}

// ── ambiguity scanner ────────────────────────────────────────────────────────
interface SmellRule {
  smellClass: string;
  pattern: RegExp;
  suggestion: string;
}

const SMELL_RULES: SmellRule[] = [
  {
    smellClass: 'vague_adjective',
    pattern: /\b(fast|quick|responsive|snappy|user-friendly|intuitive|easy[\s-]to[\s-]use|simple|clean|nice|professional|polished|robust|reliable|stable|resilient|scalable|high-performance|secure|safe|modern|state-of-the-art|seamless)\b/gi,
    suggestion: 'replace with an explicit, measurable budget or comparator',
  },
  {
    smellClass: 'modal_weakness',
    pattern: /\b(should|may|could|might|ideally|preferably|eventually|at some point)\b/gi,
    suggestion: 'replace with "must" for mandatory, or move to a separate nice-to-have backlog item',
  },
  {
    smellClass: 'unbounded_quantifier',
    pattern: /\b(etc\.?|and so on|including but not limited to)\b|\.\.\./gi,
    suggestion: 'enumerate the list fully or close it with an explicit upper bound',
  },
  {
    smellClass: 'implementation_leakage',
    pattern: /\b(redis|postgres|mysql|mongodb|rabbitmq|kafka|modal|dropdown|tab[s]?(?=\s+(component|control|widget)))\b/gi,
    suggestion: 'restate as user behaviour or non-functional constraint; let designers/architects pick the implementation',
  },
];

const CRITICAL_POSITION_RE = /^\s*(when|then|given|as a|user[s]?\s+can|the\s+system\s+(must|shall|should))/i;

function scanAmbiguity(lines: string[]): { hits: AmbiguityHit[]; criticalCount: number } {
  const hits: AmbiguityHit[] = [];
  let criticalCount = 0;

  for (const [idx, rawLine] of lines.entries()) {
    const line = rawLine ?? '';
    const isCritical = CRITICAL_POSITION_RE.test(line);

    for (const rule of SMELL_RULES) {
      const matches = line.match(rule.pattern);
      if (!matches) continue;
      for (const evidence of matches) {
        hits.push({
          smellClass: rule.smellClass,
          evidence,
          line: idx + 1,
          suggestion: rule.suggestion,
        });
        if (isCritical) criticalCount++;
      }
    }
  }
  return { hits, criticalCount };
}

// ── completeness check ───────────────────────────────────────────────────────
interface CompletenessProbe {
  element: string;
  re: RegExp;
}

const COMPLETENESS_PROBES: CompletenessProbe[] = [
  { element: 'actor_identified',    re: /\b(as a|customer|user|admin|guest|operator|agent|system|cron|service)\b/i },
  { element: 'trigger_stated',      re: /\b(when|on (click|submit|load|receipt|arrival)|triggered by|after|upon)\b/i },
  { element: 'pre_conditions',      re: /\b(given|prerequisite|pre-?condition|requires that|assuming)\b/i },
  { element: 'happy_path',          re: /\b(happy path|main flow|primary scenario|success(ful)? case)\b/i },
  { element: 'error_paths',         re: /\b(error|failure|invalid|reject|timeout|fall[\s-]?back|retry|exception)\b/i },
  { element: 'boundaries',          re: /\b(empty|max(imum)?|min(imum)?|zero|negative|unicode|rtl|boundary|limit)\b/i },
  { element: 'performance',         re: /\b(latency|throughput|p95|p99|response time|ms\b|seconds?\b|rps\b|qps\b|< ?\d+\s?(ms|s))\b/i },
  { element: 'security',            re: /\b(auth(entic|orization)|authz|csrf|xss|input validation|rbac|permission|owasp|pci|gdpr|audit log)\b/i },
  { element: 'accessibility',       re: /\b(wcag|aria|screen[\s-]?reader|keyboard[\s-]?nav|a11y|accessibility)\b/i },
  { element: 'i18n',                re: /\b(locale|i18n|l10n|translation|currency|time[\s-]?zone|rtl|date format)\b/i },
  { element: 'observability',       re: /\b(metric|log[s]?\b|trace|span|alert|dashboard|telemetry|emit (an? )?event)\b/i },
  { element: 'rollback_strategy',   re: /\b(rollback|feature flag|kill switch|toggle|revert)\b/i },
  { element: 'acceptance_criteria', re: /\b(acceptance criteria|^AC-?\d+|^GIVEN|^WHEN|^THEN)\b/im },
];

function checkCompleteness(text: string): CompletenessRow[] {
  return COMPLETENESS_PROBES.map(p => ({
    element: p.element,
    covered: p.re.test(text),
  }));
}

// ── INVEST/SMART weak-signal scoring ─────────────────────────────────────────
function scoreInvestSmart(
  text: string,
  ambiguity: AmbiguityHit[],
  completeness: CompletenessRow[],
): { invest: Scorecard['invest']; smart: Scorecard['smart'] } {
  const lower = text.toLowerCase();
  const has = (re: RegExp): boolean => re.test(text);
  const cov = (el: string): boolean =>
    completeness.find(c => c.element === el)?.covered ?? false;

  // INVEST
  const independent: Score =
    /\b(depends on|blocked by|after .* is done)\b/i.test(text) ? 'weak' : 'pass';

  const negotiable: Score = ambiguity.some(a => a.smellClass === 'implementation_leakage')
    ? 'weak'
    : 'pass';

  const valuable: Score = /\bas a [^,\n]+,? i (want|need|can)\b/i.test(text)
    ? 'pass'
    : /\b(value|benefit|so that)\b/i.test(text) ? 'weak' : 'fail';

  const estimable: Score = lower.length > 200 ? 'pass' : 'weak';

  const small: Score = /\b(epic|spans? multiple sprints|several stories)\b/i.test(text)
    ? 'fail'
    : 'pass';

  // Testable — HARD GATE: requires both an outcome word AND a measurable phrase
  const hasObservableOutcome = cov('happy_path') || /\b(then|results? in|emits|writes|displays|returns)\b/i.test(text);
  const hasAcceptanceShape   = cov('acceptance_criteria');
  const testable: Score = hasObservableOutcome && hasAcceptanceShape
    ? 'pass'
    : hasObservableOutcome
      ? 'weak'
      : 'fail';

  // SMART
  const specific: Score = ambiguity.length === 0 ? 'pass' : ambiguity.length < 3 ? 'weak' : 'fail';
  const measurable: Score = cov('performance') || /\b\d+\s?(%|ms|s|rps|qps|users?|items?)\b/i.test(text)
    ? 'pass'
    : 'weak';
  const achievable: Score = 'pass'; // heuristic can't judge feasibility — humans do
  const relevant: Score = /\b(okr|kpi|goal|objective|because|so that)\b/i.test(text) ? 'pass' : 'weak';
  const time_bound: Score = cov('performance') || has(/\bby\s+(end of|q[1-4]|\d{4})\b/i)
    ? 'pass'
    : 'weak';

  return {
    invest: { independent, negotiable, valuable, estimable, small, testable },
    smart: { specific, measurable, achievable, relevant, time_bound },
  };
}

// ── verdict ──────────────────────────────────────────────────────────────────
function decideVerdict(card: Omit<Scorecard, 'verdict' | 'blockers'>): { verdict: Verdict; blockers: string[] } {
  const blockers: string[] = [];

  if (card.invest.testable === 'fail') {
    blockers.push('Testable = fail — no observable, deterministic acceptance criteria. HARD GATE.');
    return { verdict: 'REJECT', blockers };
  }

  if (card.ambiguity.critical_position_smells >= 3) {
    blockers.push(`${card.ambiguity.critical_position_smells} ambiguity smells in critical positions (actor/trigger/outcome).`);
  }

  const failCount =
    Object.values(card.invest).filter(v => v === 'fail').length +
    Object.values(card.smart).filter(v => v === 'fail').length;
  if (failCount >= 2) {
    blockers.push(`${failCount} INVEST/SMART criteria failed.`);
  }

  if (card.completeness.missing >= 5) {
    blockers.push(`${card.completeness.missing} completeness elements missing: ${card.completeness.missing_items.join(', ')}.`);
  }

  if (!card.ready_to_draft_acs) {
    blockers.push('Acceptance criteria block could not be drafted from the current text.');
  }

  if (blockers.length === 0) {
    return { verdict: 'READY-FOR-DESIGN', blockers };
  }
  if (blockers.length >= 3 || card.ambiguity.critical_position_smells >= 5) {
    return { verdict: 'REJECT', blockers };
  }
  return { verdict: 'NEEDS-REFINEMENT', blockers };
}

// ── helpers ──────────────────────────────────────────────────────────────────
function extractTitle(text: string): string {
  const h1 = /^#\s+(.+)$/m.exec(text);
  return h1?.[1]?.trim() ?? '(untitled)';
}

function extractReqId(text: string, fallbackPath: string): string {
  // Look for REQ-XXX-NN, USR-NN, AC-NN style ID anywhere in the doc.
  const m = /\b([A-Z]{2,5}-[A-Z]{2,5}-\d+|[A-Z]{2,5}-\d+)\b/.exec(text);
  if (m?.[1]) return m[1];
  const base = fallbackPath.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'UNKNOWN';
  return base.toUpperCase();
}

function countByClass(hits: AmbiguityHit[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const h of hits) {
    out[h.smellClass] = (out[h.smellClass] ?? 0) + 1;
  }
  return out;
}

// ── main ─────────────────────────────────────────────────────────────────────
function main(): void {
  const args = parseArgs();
  if (args.help || !args.input) {
    printHelp();
    exit(args.help ? 0 : 2);
  }

  const inputPath = isAbsolute(args.input) ? args.input : resolve(cwd(), args.input);
  if (!existsSync(inputPath)) {
    console.error(`${RED}requirement file not found:${RESET} ${args.input}`);
    exit(2);
  }
  const text = readFileSync(inputPath, 'utf8');
  const lines = text.split('\n');

  const { hits, criticalCount } = scanAmbiguity(lines);
  const completeness = checkCompleteness(text);
  const { invest, smart } = scoreInvestSmart(text, hits, completeness);

  const acCount = (text.match(/^AC-?\d+/gim) ?? []).length;
  const readyToDraftAcs = acCount > 0 || (
    completeness.find(c => c.element === 'happy_path')?.covered === true
    && hits.length < 5
  );

  const missingItems = completeness.filter(c => !c.covered).map(c => c.element);

  const partial: Omit<Scorecard, 'verdict' | 'blockers'> = {
    ts: new Date().toISOString(),
    req_id: extractReqId(text, inputPath),
    title: extractTitle(text),
    source: args.input,
    invest,
    smart,
    ambiguity: {
      total_smells: hits.length,
      critical_position_smells: criticalCount,
      by_class: countByClass(hits),
    },
    completeness: {
      covered: completeness.length - missingItems.length,
      missing: missingItems.length,
      missing_items: missingItems,
    },
    ac_count: acCount,
    ready_to_draft_acs: readyToDraftAcs,
  };
  const { verdict, blockers } = decideVerdict(partial);
  const card: Scorecard = { ...partial, verdict, blockers };

  // Emit JSON
  const json = JSON.stringify(card, null, 2);
  if (args.out) {
    const outPath = isAbsolute(args.out) ? args.out : resolve(cwd(), args.out);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, json);
    card.scorecard_path = args.out;
    console.error(`${GRN}wrote${RESET} ${args.out}`);
  } else {
    stdout.write(json + '\n');
  }

  // Append to index.json (JSONL)
  if (!args.noAppend) {
    const indexDir = 'reports/requirement-scorecards';
    const indexPath = join(indexDir, 'index.json');
    mkdirSync(indexDir, { recursive: true });
    const row = JSON.stringify(card);
    if (existsSync(indexPath)) {
      appendFileSync(indexPath, '\n' + row);
    } else {
      writeFileSync(indexPath, row);
    }
    console.error(`${GRN}appended${RESET} ${indexPath}`);
  }

  // Friendly summary to stderr
  const verdictColour = verdict === 'READY-FOR-DESIGN' ? GRN : verdict === 'NEEDS-REFINEMENT' ? YEL : RED;
  console.error(`${BOLD}verdict:${RESET} ${verdictColour}${verdict}${RESET}  ` +
    `(smells=${hits.length}, missing=${missingItems.length}, ACs=${acCount})`);
  for (const b of blockers) console.error(`  ${YEL}•${RESET} ${b}`);

  if (verdict === 'READY-FOR-DESIGN') exit(0);
  if (verdict === 'NEEDS-REFINEMENT') exit(1);
  exit(2);
}

main();
