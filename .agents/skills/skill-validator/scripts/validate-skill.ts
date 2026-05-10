#!/usr/bin/env -S npx tsx
/**
 * .agents/skills/skill-validator/scripts/validate-skill.ts
 *
 * Validates Agent Skills under .agents/skills/<name>/SKILL.md against the
 * write-agent-skill specification AND against this repo's actual file tree.
 *
 * Layers:
 *   1. Frontmatter   — name, description present; name matches folder; description heuristics.
 *   2. Path refs     — every backtick path / markdown link points at an existing file.
 *   3. Sibling links — every `.agents/skills/<name>` ref resolves to a real SKILL.md.
 *   4. Examples (opt-in via --check-examples) — ts code blocks containing test()
 *      are extracted and piped through validate-tags.ts.
 *
 * Exit codes:
 *   0  all clean
 *   1  ≥ 1 error (or any warning under --strict)
 *   2  invocation error
 *
 * Usage:
 *   ./validate-skill.ts                       # all skills, errors only
 *   ./validate-skill.ts --skill pom-architect # one skill
 *   ./validate-skill.ts --verbose             # list every check
 *   ./validate-skill.ts --strict              # warnings count as errors
 *   ./validate-skill.ts --check-examples      # extract ts blocks; run validate-tags
 *   ./validate-skill.ts --help
 */

import type { Dirent } from 'node:fs';
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { cwd, exit, argv } from 'node:process';

// ── constants ────────────────────────────────────────────────────────────────
const RECOGNISED_PREFIXES = [
  'prompts/', 'tests/', 'pages/', 'locators/', 'utilities/', 'models/',
  'data/', 'reports/', 'scripts/', 'templates/', 'documents/',
  'knowledge-base/', 'training/', 'wiki/', '.github/', '.agents/',
  '.husky/', '.claude/', 'translations/',
] as const;

const PATH_EXTS = ['.md', '.ts', '.tsx', '.js', '.json', '.yml', '.yaml',
  '.html', '.htm', '.sh', '.css', '.txt', '.svg', '.png', '.jpg', '.pdf'];

// Third-person singular verbs accepted as legitimate description starters.
// Curated list — extend when a SKILL legitimately uses a new verb.
const VERB_STARTS = new Set([
  // existing
  'Drafts', 'Adds', 'Builds', 'Validates', 'Generates', 'Designs', 'Authors',
  'Reviews', 'Audits', 'Triages', 'Diagnoses', 'Maps', 'Wraps', 'Detects',
  'Routes', 'Files', 'Composes', 'Picks', 'Applies', 'Integrates', 'Wires',
  'Surfaces', 'Captures', 'Identifies', 'Refactors', 'Lists', 'Walks',
  'Configures', 'Fetches', 'Posts', 'Helps', 'Turns',
  // expanded (alphabetical)
  'Acts', 'Aggregates', 'Analyses', 'Analyzes', 'Assesses', 'Automates',
  'Clarifies', 'Compares', 'Computes', 'Containerizes', 'Coordinates',
  'Creates', 'Curates', 'Defines', 'Documents', 'Enforces', 'Equips',
  'Establishes', 'Estimates', 'Evaluates', 'Examines', 'Executes', 'Explores',
  'Exports', 'Extracts', 'Heals', 'Imports', 'Implements', 'Inspects',
  'Installs', 'Investigates', 'Manages', 'Masters', 'Measures', 'Migrates',
  'Mines', 'Mocks', 'Models', 'Monitors', 'Optimizes', 'Optimises',
  'Orchestrates', 'Packages', 'Parses', 'Patches', 'Performs', 'Plans',
  'Predicts', 'Prepares', 'Processes', 'Produces', 'Profiles', 'Protects',
  'Provides', 'Publishes', 'Reads', 'Records', 'Renders', 'Reports', 'Resolves', 'Drives',
  'Runs', 'Saves', 'Scans', 'Schedules', 'Scores', 'Seeds', 'Sends', 'Serves',
  'Sets', 'Shapes', 'Simulates', 'Sizes', 'Sorts', 'Splits', 'Stages',
  'Streams', 'Structures', 'Summarizes', 'Summarises', 'Supports',
  'Synchronizes', 'Tests', 'Tracks', 'Trains', 'Transforms', 'Triggers',
  'Uploads', 'Verifies', 'Visualizes', 'Watches', 'Writes',
]);

const RED = '\x1b[31m', GRN = '\x1b[32m', YEL = '\x1b[33m';
const DIM = '\x1b[2m', BOLD = '\x1b[1m', RESET = '\x1b[0m';

// ── types ────────────────────────────────────────────────────────────────────
type Args = { skill?: string; verbose: boolean; strict: boolean; checkExamples: boolean; help: boolean };
type Frontmatter = { name?: string; description?: string; optionalRefs?: string[]; raw: string };
type Reference = { kind: 'backtick' | 'mdlink' | 'sibling'; raw: string; line: number };
type SkillReport = { folder: string; errors: string[]; warnings: string[]; refCount: number };

type ValidationContext = {
  root: string;
  skillsDir: string;
  args: Args;
  validatorPath: string;
  tmpDir: string | null;
};

// ── arg parsing ──────────────────────────────────────────────────────────────
function parseArgs(): Args {
  const a: Args = { verbose: false, strict: false, checkExamples: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const v = argv[i] ?? '';
    if (v === '--verbose') a.verbose = true;
    else if (v === '--strict') a.strict = true;
    else if (v === '--check-examples') a.checkExamples = true;
    else if (v === '--help' || v === '-h') a.help = true;
    else if (v === '--skill') {
      i++;
      const next = argv[i];
      if (next === undefined) { console.error('--skill requires a value'); exit(2); }
      a.skill = next;
    }
    else { console.error(`unknown flag: ${v}`); exit(2); }
  }
  return a;
}

function printHelp(): void {
  console.log(`validate-skill.ts — audit .agents/skills/*/SKILL.md

Usage:
  validate-skill.ts [--skill <name>] [--verbose] [--strict] [--check-examples] [--help]

Checks:
  Layer 1  frontmatter compliance (name, description, name===folder)
  Layer 2  every backtick path / md link resolves to a real file
  Layer 3  sibling skill cross-refs point at existing SKILL.md
  Layer 4  (opt-in) ts test() blocks pass test-tags-validator

Exit codes:
  0  clean
  1  ≥ 1 error (or any warning with --strict)
  2  invocation error
`);
}

// ── frontmatter parsing ──────────────────────────────────────────────────────
function extractYamlBlock(src: string): string | null {
  if (!src.startsWith('---\n')) return null;
  const end = src.indexOf('\n---\n', 4);
  return end === -1 ? null : src.slice(4, end);
}

function stripWrappingQuotes(s: string): string {
  const dq = s.startsWith('"') && s.endsWith('"');
  const sq = s.startsWith("'") && s.endsWith("'");
  return (dq || sq) ? s.slice(1, -1) : s;
}

function parseListItem(line: string): string {
  return stripWrappingQuotes(
    line.replaceAll(/^\s+-\s+/g, '').replaceAll(/\s+#.*$/g, '').trim()
  );
}

function readListBlock(lines: string[], startIdx: number): { items: string[]; nextIdx: number } {
  const items: string[] = [];
  let i = startIdx;
  while (i + 1 < lines.length && /^\s+-\s/.test(lines.at(i + 1) ?? '')) {
    i++;
    items.push(parseListItem(lines.at(i) ?? ''));
  }
  return { items, nextIdx: i + 1 };
}

function readContinuedScalar(lines: string[], startIdx: number, initial: string): { value: string; nextIdx: number } {
  let value = initial;
  let i = startIdx;
  while (i + 1 < lines.length) {
    const next = lines.at(i + 1) ?? '';
    const isNewKey = /^[a-zA-Z0-9_-]+:/.test(next);
    const isListItem = /^\s+-\s/.test(next);
    const isBlank = next.trim() === '';
    if (isNewKey || isListItem || isBlank) break;
    i++;
    value += ' ' + next.trim();
  }
  return { value: stripWrappingQuotes(value), nextIdx: i + 1 };
}

function parseFrontmatter(src: string): Frontmatter | null {
  const block = extractYamlBlock(src);
  if (block === null) return null;

  const fm: Frontmatter = { raw: block };
  const lines = block.split('\n');
  let i = 0;
  while (i < lines.length) {
    const m = /^([a-zA-Z0-9_-]+):\s*(.*)$/.exec(lines.at(i) ?? '');
    if (!m) { i++; continue; }
    const key = m[1] ?? '';
    const inline = (m[2] ?? '').trim();

    if (inline === '' && /^\s+-\s/.test(lines.at(i + 1) ?? '')) {
      const { items, nextIdx } = readListBlock(lines, i);
      if (key === 'optionalRefs' || key === 'produces') fm.optionalRefs = items;
      i = nextIdx;
      continue;
    }

    const { value, nextIdx } = readContinuedScalar(lines, i, inline);
    if (key === 'name') fm.name = value;
    else if (key === 'description') fm.description = value;
    i = nextIdx;
  }
  return fm;
}

// ── reference extraction ─────────────────────────────────────────────────────
type FenceState = { inFence: boolean; marker: string };

function updateFenceState(line: string, state: FenceState): boolean {
  const m = /^(\s*)(```+|~~~+)/.exec(line);
  if (!m) return state.inFence;
  const marker = m[2] ?? '';
  if (state.inFence) {
    const closes = marker.startsWith((state.marker[0] ?? '')) && marker.length >= state.marker.length;
    if (closes) { state.inFence = false; state.marker = ''; }
  } else {
    state.inFence = true;
    state.marker = marker;
  }
  return true; // line itself is a fence marker, skip downstream extraction
}

function shouldSkipMdLinkTarget(target: string): boolean {
  if (/^https?:/i.test(target)) return true;
  if (target.startsWith('#')) return true;
  if (target.startsWith('mailto:')) return true;
  if (target.startsWith('@')) return true;
  if (/[<>]/.test(target)) return true;
  if (!/[/.]/.test(target)) return true;
  return target === 'relative-or-absolute-path' || target === 'path';
}

function extractMdLinks(line: string, lineNo: number): Reference[] {
  const out: Reference[] = [];
  for (const m of line.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    const target = m[2] ?? '';
    if (shouldSkipMdLinkTarget(target)) continue;
    out.push({ kind: 'mdlink', raw: target, line: lineNo });
  }
  return out;
}

function isPlaceholderToken(token: string): boolean {
  return /[<>{}]/.test(token)
    || token.includes('/...')
    || token.includes('…')
    || token.includes('*')
    || token.includes('$')
    || /\s/.test(token);
}

function isImportOrFlagToken(token: string): boolean {
  if (token.startsWith('@')) return true;
  return token.startsWith('-');
}

function isMimeShapedToken(token: string): boolean {
  if (!/^[a-z]+\/[a-z+-]+$/.test(token)) return false;
  return !RECOGNISED_PREFIXES.some(p => token.startsWith(p));
}

function looksLikeRepoPath(token: string): boolean {
  const prefixed = RECOGNISED_PREFIXES.some(p =>
    token.startsWith(p) || token.startsWith('./' + p) || token.includes('/' + p));
  if (prefixed) return true;
  if (PATH_EXTS.some(e => token.endsWith(e))) return true;
  return /\.agents\/skills\/[a-z0-9-]+$/.test(token)
    || /\.claude\/agents\/[a-z0-9-]+$/.test(token)
    || /^documents\/[a-z0-9-]+$/i.test(token);
}

function isExtractableBacktickPath(token: string): boolean {
  if (!token.includes('/')) return false;
  if (isPlaceholderToken(token)) return false;
  if (isImportOrFlagToken(token)) return false;
  if (isMimeShapedToken(token)) return false;
  return looksLikeRepoPath(token);
}

function extractBacktickRefs(line: string, lineNo: number): Reference[] {
  const out: Reference[] = [];
  for (const m of line.matchAll(/`([^`]+)`/g)) {
    const token = m[1] ?? '';
    if (isExtractableBacktickPath(token)) {
      out.push({ kind: 'backtick', raw: token, line: lineNo });
    }
  }
  return out;
}

function extractRefs(src: string): Reference[] {
  const refs: Reference[] = [];
  const fence: FenceState = { inFence: false, marker: '' };
  for (const [n, line] of src.split('\n').entries()) {
    const isFenceLine = updateFenceState(line, fence);
    if (isFenceLine || fence.inFence) continue;
    const lineNo = n + 1;
    refs.push(
      ...extractMdLinks(line, lineNo),
      ...extractBacktickRefs(line, lineNo),
    );
  }
  return refs;
}

// ── path resolution ──────────────────────────────────────────────────────────
function resolveRef(skillFile: string, ref: Reference, root: string): boolean {
  const skillDir = dirname(skillFile);
  let cleaned = ref.raw.replaceAll(/[#?].*$/g, '').trim();
  cleaned = cleaned.replaceAll(/^['"]|['"]$/g, '');
  const candidates = [
    resolve(skillDir, cleaned),
    resolve(root, cleaned.startsWith('/') ? cleaned.slice(1) : cleaned),
  ];
  return candidates.some(c => existsSync(c));
}

function isSiblingSkillRef(raw: string): string | null {
  const inner = /(?:^|\/)\.agents\/skills\/([a-z0-9][a-z0-9-]*)(?:\/SKILL\.md)?$/.exec(raw);
  if (inner) return inner[1] ?? null;
  const relative = /^\.\.\/([a-z0-9][a-z0-9-]*)\/SKILL\.md$/.exec(raw);
  return relative ? (relative[1] ?? null) : null;
}

function extractTsTestBlocks(src: string): { code: string; line: number }[] {
  const out: { code: string; line: number }[] = [];
  const re = /```ts\n([\s\S]*?)\n```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const code = m[1] ?? '';
    if (!/\btest\s*\(/.test(code)) continue;
    const line = src.slice(0, m.index).split('\n').length;
    out.push({ code, line });
  }
  return out;
}

function descriptionLooksThirdPerson(desc: string): boolean {
  const firstWord = desc.trim().split(/\s+/)[0] ?? '';
  return VERB_STARTS.has(firstWord);
}

// ── per-layer validators ─────────────────────────────────────────────────────
function validateFrontmatter(fm: Frontmatter | null, folder: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (fm === null) {
    errors.push('no YAML frontmatter at top of file');
    return { errors, warnings };
  }

  if (fm.name === undefined || fm.name === '') errors.push('frontmatter missing `name:`');
  else if (fm.name !== folder) errors.push(`frontmatter \`name: ${fm.name}\` does not match folder \`${folder}\``);

  if (fm.description === undefined || fm.description === '') {
    errors.push('frontmatter missing `description:`');
    return { errors, warnings };
  }

  const desc = fm.description;
  if (desc.length < 80) warnings.push(`description is very short (${desc.length} chars; ≥ 80 recommended)`);
  if (desc.length > 2000) warnings.push(`description is very long (${desc.length} chars; ≤ 2000 recommended)`);
  if (!descriptionLooksThirdPerson(desc)) warnings.push('description does not start with a third-person verb (e.g. "Drafts", "Validates")');
  if (!/\bUse when\b/i.test(desc) && !/\bUse this skill\b/i.test(desc)) {
    warnings.push('description does not include "Use when …" or "Use this skill …" trigger phrasing');
  }

  return { errors, warnings };
}

function validatePathRefs(refs: Reference[], skillFile: string, root: string, optional: Set<string>): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const ref of refs) {
    if (seen.has(ref.raw)) continue;
    seen.add(ref.raw);
    if (optional.has(ref.raw)) continue;
    if (!resolveRef(skillFile, ref, root)) {
      errors.push(`L${ref.line} ${ref.kind}: missing referenced file \`${ref.raw}\``);
    }
  }
  return errors;
}

function validateSiblings(refs: Reference[], skillsDir: string): string[] {
  const errors: string[] = [];
  for (const ref of refs) {
    const sibling = isSiblingSkillRef(ref.raw);
    if (sibling === null) continue;
    if (!existsSync(join(skillsDir, sibling, 'SKILL.md'))) {
      errors.push(`L${ref.line} sibling-skill: \`${sibling}\` does not exist (.agents/skills/${sibling}/SKILL.md not found)`);
    }
  }
  return errors;
}

function validateExamples(src: string, folder: string, ctx: ValidationContext): string[] {
  if (!ctx.args.checkExamples || ctx.tmpDir === null) return [];
  const blocks = extractTsTestBlocks(src);
  if (blocks.length === 0) return [];

  const tmpDir = ctx.tmpDir;
  const written: string[] = [];
  for (const [i, b] of blocks.entries()) {
    const out = join(tmpDir, `${folder}-${i}.spec.ts`);
    writeFileSync(out, b.code);
    written.push(out);
  }

  const warnings: string[] = [];
  const r = spawnSync(ctx.validatorPath, ['--path', tmpDir, '--strict'], { encoding: 'utf8' });
  if (r.status !== 0) {
    const stdout = (r.stdout ?? '') + (r.stderr ?? '');
    const folderRe = new RegExp(String.raw`${folder}-\d+\.spec\.ts`);
    if (folderRe.test(stdout)) {
      warnings.push(`code example fails validate-tags (run: validate-skill --check-examples --skill ${folder})`);
    }
  }
  for (const f of written) rmSync(f, { force: true });
  return warnings;
}

function validateSkill(folder: string, ctx: ValidationContext): SkillReport {
  const skillFile = join(ctx.skillsDir, folder, 'SKILL.md');
  const report: SkillReport = { folder, errors: [], warnings: [], refCount: 0 };

  if (!existsSync(skillFile)) {
    report.errors.push('missing SKILL.md');
    return report;
  }

  const src = readFileSync(skillFile, 'utf8');
  const fm = parseFrontmatter(src);
  const refs = extractRefs(src);
  report.refCount = refs.length;

  const layer1 = validateFrontmatter(fm, folder);
  const optional = new Set(fm?.optionalRefs ?? []);
  report.errors.push(
    ...layer1.errors,
    ...validatePathRefs(refs, skillFile, ctx.root, optional),
    ...validateSiblings(refs, ctx.skillsDir),
  );
  report.warnings.push(
    ...layer1.warnings,
    ...validateExamples(src, folder, ctx),
  );

  return report;
}

// ── reporting ────────────────────────────────────────────────────────────────
function printSkillReport(r: SkillReport, verbose: boolean): void {
  const head = `.agents/skills/${r.folder}/SKILL.md`;
  if (r.errors.length === 0 && r.warnings.length === 0) {
    if (verbose) {
      console.log(`${GRN}✓${RESET} ${head} — ${r.refCount} references, all resolve`);
    }
    return;
  }
  if (r.errors.length > 0) console.log(`${RED}✗${RESET} ${head}`);
  else console.log(`${YEL}▸${RESET} ${head}`);
  for (const e of r.errors) console.log(`    ${RED}error:${RESET}   ${e}`);
  for (const w of r.warnings) console.log(`    ${YEL}warning:${RESET} ${w}`);
  console.log();
}

function printSummary(scanned: number, totalErr: number, totalWarn: number, totalOk: number): void {
  console.log(`${BOLD}Summary${RESET}`);
  console.log(`  skills scanned:  ${scanned}`);
  console.log(`  ${totalErr > 0 ? RED : DIM}errors:          ${totalErr}${RESET}`);
  console.log(`  ${totalWarn > 0 ? YEL : DIM}warnings:        ${totalWarn}${RESET}`);
  console.log(`  ${GRN}clean:           ${totalOk}${RESET}`);
}

// ── orchestration ────────────────────────────────────────────────────────────
async function listSkillFolders(skillsDir: string): Promise<string[]> {
  const entries = await readdir(skillsDir, { withFileTypes: true });
  return entries
    .filter((d: Dirent) => d.isDirectory())
    .map((d: Dirent) => d.name)
    .sort((a, b) => a.localeCompare(b));
}

function buildContext(root: string, args: Args): ValidationContext {
  const skillsDir = resolve(root, '.agents/skills');
  const validatorPath = resolve(root, '.agents/skills/test-tags-validator/scripts/validate-tags.ts');
  let mutableArgs = args;
  if (args.checkExamples && !existsSync(validatorPath)) {
    console.error(`--check-examples requires ${validatorPath}; skipping`);
    mutableArgs = { ...args, checkExamples: false };
  }
  const tmpDir = mutableArgs.checkExamples ? mkdtempSync(join(tmpdir(), 'skill-examples-')) : null;
  return { root, skillsDir, args: mutableArgs, validatorPath, tmpDir };
}

async function main(): Promise<void> {
  const args = parseArgs();
  if (args.help) { printHelp(); exit(0); }

  const root = cwd();
  const skillsDir = resolve(root, '.agents/skills');
  if (!existsSync(skillsDir)) { console.error(`no .agents/skills/ at ${skillsDir}`); exit(2); }

  const allFolders = await listSkillFolders(skillsDir);
  if (args.skill !== undefined && !allFolders.includes(args.skill)) {
    console.error(`skill not found: ${args.skill}`);
    console.error(`available: ${allFolders.join(', ')}`);
    exit(2);
  }
  const targets = args.skill === undefined ? allFolders : [args.skill];

  const ctx = buildContext(root, args);

  let totalErr = 0, totalWarn = 0, totalOk = 0;
  for (const folder of targets) {
    const r = validateSkill(folder, ctx);
    printSkillReport(r, ctx.args.verbose);
    totalErr += r.errors.length;
    totalWarn += r.warnings.length;
    if (r.errors.length === 0 && r.warnings.length === 0) totalOk++;
  }

  if (ctx.tmpDir !== null) {
    try { rmSync(ctx.tmpDir, { recursive: true, force: true }); } catch { /* best effort */ }
  }

  printSummary(targets.length, totalErr, totalWarn, totalOk);
  const fail = totalErr > 0 || (ctx.args.strict && totalWarn > 0);
  exit(fail ? 1 : 0);
}

main().catch(e => { console.error(e); exit(2); });
