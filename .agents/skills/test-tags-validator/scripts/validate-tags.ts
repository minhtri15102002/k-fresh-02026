#!/usr/bin/env -S npx tsx
/**
 * .agents/skills/test-tags-validator/scripts/validate-tags.ts
 *
 * Static linter that scans tests/ for Playwright `test(...)` blocks and
 * verifies each one carries the required tag taxonomy per
 * prompts/core/test-tags.md.
 *
 * Required:  exactly one priority (@P1..@P4) and one severity (@critical|major|minor|trivial)
 * Warning:   missing type (@smoke|@regression|@ui|@api|@hybrid|@security|@visual|@a11y|@perf)
 * Warning:   missing feature (@auth|@cart|@checkout|@profile|@product|@compare|@wishlist|@home)
 *
 * Exit codes:
 *   0  all compliant
 *   1  at least one error (or any warning when --strict)
 *   2  script invocation error
 *
 * Usage:
 *   ./validate-tags.ts                      # scan tests/, errors only
 *   ./validate-tags.ts --verbose            # list every test
 *   ./validate-tags.ts --path tests/ui      # scope
 *   ./validate-tags.ts --strict             # warnings count as errors
 *   ./validate-tags.ts --help
 */

import { readFileSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { cwd, exit, argv } from 'node:process';

// ── catalogue (KEEP IN SYNC with prompts/core/test-tags.md) ───────────────────
const PRIORITIES = ['@P1', '@P2', '@P3', '@P4'] as const;
const SEVERITIES = ['@critical', '@major', '@minor', '@trivial'] as const;
const TYPES      = ['@smoke', '@regression', '@ui', '@api', '@hybrid', '@security', '@visual', '@a11y', '@perf'] as const;
const FEATURES   = ['@auth', '@cart', '@checkout', '@profile', '@product', '@compare', '@wishlist', '@home'] as const;

// ── pretty ───────────────────────────────────────────────────────────────────
const RED   = '\x1b[31m';
const GRN   = '\x1b[32m';
const YEL   = '\x1b[33m';
const DIM   = '\x1b[2m';
const BOLD  = '\x1b[1m';
const RESET = '\x1b[0m';

// ── args ─────────────────────────────────────────────────────────────────────
type Args = { verbose: boolean; strict: boolean; path: string; help: boolean };
function parseArgs(): Args {
  const a: Args = { verbose: false, strict: false, path: 'tests', help: false };
  for (let i = 2; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--verbose') a.verbose = true;
    else if (v === '--strict') a.strict = true;
    else if (v === '--help' || v === '-h') a.help = true;
    else if (v === '--path') a.path = argv[++i] ?? a.path;
    else if (v?.startsWith('--')) { console.error(`unknown flag: ${v}`); exit(2); }
  }
  return a;
}
function printHelp(): void {
  console.log(`validate-tags.ts — verify Playwright tests carry the required tag taxonomy

Usage:
  validate-tags.ts [--path <dir|file>] [--verbose] [--strict] [--help]

Required tags per test:
  priority   one of: ${PRIORITIES.join(' ')}
  severity   one of: ${SEVERITIES.join(' ')}

Recommended (warning only):
  type       one of: ${TYPES.join(' ')}
  feature    one of: ${FEATURES.join(' ')}

Exit codes:
  0  all compliant
  1  at least one error (or any warning with --strict)
  2  invocation error
`);
}

// ── walk ─────────────────────────────────────────────────────────────────────
async function walk(p: string, out: string[] = []): Promise<string[]> {
  let s;
  try { s = statSync(p); } catch { console.error(`path not found: ${p}`); exit(2); }
  if (s.isFile()) { if (p.endsWith('.spec.ts')) out.push(p); return out; }
  for (const e of await readdir(p, { withFileTypes: true })) {
    const child = join(p, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') await walk(child, out); }
    else if (e.isFile() && e.name.endsWith('.spec.ts')) out.push(child);
  }
  return out;
}

// ── parse ────────────────────────────────────────────────────────────────────
type TestCase = { file: string; line: number; title: string; tags: string[] };

// Match: test('title', { tag: ['@…', '@…'] }, async …)
// Also:  test.skip / test.only / test.fixme — same shape.
const TEST_REGEX =
  /\btest(?:\.(?:skip|only|fixme|fail))?\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\{\s*tag:\s*\[([^\]]*)\]/gms;

function extractTests(file: string): TestCase[] {
  const src = readFileSync(file, 'utf8');
  const lineStarts: number[] = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') lineStarts.push(i + 1);
  const lineFor = (offset: number): number => {
    let lo = 0, hi = lineStarts.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (lineStarts[m]! <= offset) lo = m; else hi = m - 1; }
    return lo + 1;
  };

  const out: TestCase[] = [];
  let m: RegExpExecArray | null;
  TEST_REGEX.lastIndex = 0;
  while ((m = TEST_REGEX.exec(src)) !== null) {
    const title = m[1] ?? '';
    const tagsRaw = m[2] ?? '';
    const tags = [...tagsRaw.matchAll(/['"`](@[^'"`]+)['"`]/g)].map(x => x[1]!);
    out.push({ file, line: lineFor(m.index), title, tags });
  }
  return out;
}

// ── classify ─────────────────────────────────────────────────────────────────
type Verdict = { errors: string[]; warnings: string[] };
function classify(tags: string[]): Verdict {
  const errors: string[] = [];
  const warnings: string[] = [];

  const priorities = tags.filter(t => PRIORITIES.includes(t as (typeof PRIORITIES)[number]));
  const severities = tags.filter(t => SEVERITIES.includes(t as (typeof SEVERITIES)[number]));
  const types      = tags.filter(t => TYPES.includes(t as (typeof TYPES)[number]));
  const features   = tags.filter(t => FEATURES.includes(t as (typeof FEATURES)[number]));

  if (priorities.length === 0) errors.push(`missing priority (${PRIORITIES.join('|')})`);
  if (priorities.length > 1) errors.push(`multiple priorities: ${priorities.join(', ')}`);

  if (severities.length === 0) errors.push(`missing severity (${SEVERITIES.join('|')})`);
  if (severities.length > 1) errors.push(`multiple severities: ${severities.join(', ')}`);

  if (types.length === 0) warnings.push(`missing type tag (${TYPES.join('|')})`);
  if (features.length === 0) warnings.push(`missing feature tag (${FEATURES.join('|')})`);

  // unknown tags (anything not in any catalogue)
  const known = new Set([...PRIORITIES, ...SEVERITIES, ...TYPES, ...FEATURES] as readonly string[]);
  const unknown = tags.filter(t => !known.has(t));
  if (unknown.length > 0) warnings.push(`unknown tags (not in catalogue): ${unknown.join(', ')}`);

  return { errors, warnings };
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const args = parseArgs();
  if (args.help) { printHelp(); exit(0); }

  const root = cwd();
  const files = await walk(args.path);
  if (files.length === 0) { console.error(`no .spec.ts files under ${args.path}`); exit(2); }

  let totalTests = 0, errFiles = 0, errCount = 0, warnCount = 0;

  for (const file of files.sort()) {
    const tests = extractTests(file);
    if (tests.length === 0) continue;
    totalTests += tests.length;

    const fileErrs: string[] = [];
    const fileWarns: string[] = [];

    for (const t of tests) {
      const v = classify(t.tags);
      const head = `${relative(root, t.file)}:${t.line}\n    test(${JSON.stringify(t.title.slice(0, 80))}…\n    has: [${t.tags.map(x => `'${x}'`).join(', ')}]`;

      for (const e of v.errors)   fileErrs.push(`${RED}✗${RESET} ${head}\n    ${RED}error:${RESET} ${e}`);
      for (const w of v.warnings) fileWarns.push(`${YEL}▸${RESET} ${head}\n    ${YEL}warning:${RESET} ${w}`);

      errCount  += v.errors.length;
      warnCount += v.warnings.length;
    }

    if (fileErrs.length > 0) errFiles++;
    if (args.verbose && fileErrs.length === 0 && fileWarns.length === 0) {
      console.log(`${GRN}✓${RESET} ${relative(root, file)} — ${tests.length} tests, all compliant`);
    }
    for (const m of fileErrs) console.log(m + '\n');
    for (const m of fileWarns) console.log(m + '\n');
  }

  console.log();
  console.log(`${BOLD}Summary${RESET}`);
  console.log(`  files scanned:  ${files.length}`);
  console.log(`  tests scanned:  ${totalTests}`);
  console.log(`  ${errCount > 0 ? RED : DIM}errors:         ${errCount}${RESET}`);
  console.log(`  ${warnCount > 0 ? YEL : DIM}warnings:       ${warnCount}${RESET}`);
  console.log(`  files w/ errs:  ${errFiles}`);

  const fail = errCount > 0 || (args.strict && warnCount > 0);
  exit(fail ? 1 : 0);
}

main().catch(e => { console.error(e); exit(2); });
