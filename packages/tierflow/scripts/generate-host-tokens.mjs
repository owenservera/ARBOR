/**
 * @hq:context Generates the harness host tokens CSS from the vivim-ui canonical theme (src/theme.ts) — vivim-ui is the token authority, the harness file is a build artifact.
 * @hq:owner one-app-m5
 * @hq:task M5 vivim-ui token authority (one-app fan-out 2026-11-09)
 * @hq:see test/generate-host-tokens.test.mjs (parity oracle: never drop a property the host uses)
 *
 * Usage (bun or node — the script and theme.ts are runtime-neutral):
 *   bun scripts/generate-host-tokens.mjs [--out <path>]
 *   node scripts/generate-host-tokens.mjs [--out <path>]
 *
 * Output is deterministic: token properties are sorted alphabetically inside
 * each block, and `Generated-at` is a CONTENT stamp (sha256 of the canonical
 * token set), so regenerating unchanged theme content produces identical
 * bytes. Runtime-neutral by design: no Bun APIs are used, because the parity
 * test must also run under `node --test`.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { BASE_TOKENS, FONT_FACES, THEMES, TOKENS_SCHEMA, TYPE_SCALE } from '../src/theme.ts';

/** Resolve the Harness checkout, including non-sibling linked worktrees. */
const DEFAULT_HARNESS_ROOT = fileURLToPath(new URL('../../vivim-web-harness/', import.meta.url));
export const HARNESS_ROOT = process.env.VIVIM_HARNESS_ROOT
  ? resolve(process.env.VIVIM_HARNESS_ROOT)
  : DEFAULT_HARNESS_ROOT;

/** Default destination: the harness host public tokens file. */
export const DEFAULT_OUT = join(HARNESS_ROOT, 'apps/vivim-host/public/vivim-tokens.css');

/** Sorted, `--name: value;` lines for one token table. */
function tokenLines(table, indent = '  ') {
  return Object.keys(table)
    .sort()
    .map((name) => `${indent}${name}: ${table[name]};`);
}

/** Single-line @font-face rule (host format). */
function fontFaceLine(face) {
  return `@font-face { font-family: "${face.family}"; src: url("/fonts/${face.file}") format("woff2"); font-weight: ${face.weight}; font-style: normal; font-display: swap; }`;
}

/** Single-line type class rule (host format). */
function typeClassLine(cls) {
  const parts = [
    `font-family: ${cls.fontFamily}`,
    `font-size: ${cls.fontSize}`,
    `line-height: ${cls.lineHeight}`,
    `font-weight: ${cls.fontWeight}`,
  ];
  if (cls.letterSpacing !== undefined) parts.push(`letter-spacing: ${cls.letterSpacing}`);
  return `.${cls.className} { ${parts.join('; ')}; }`;
}

/** Content stamp: identical token content always yields the same stamp (keeps bytes idempotent). */
function contentStamp() {
  const canonical = JSON.stringify({ FONT_FACES, TOKENS_SCHEMA, THEMES, TYPE_SCALE, BASE_TOKENS });
  return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}

/** Render the complete host tokens CSS. Pure — no filesystem access. */
export function renderTokensCss() {
  const lines = [];
  lines.push('/* VIVIM host tokens — GENERATED FILE, DO NOT EDIT BY HAND.');
  lines.push('   Source of truth: vivim-ui/src/theme.ts (canonical token authority).');
  lines.push(`   Schema: ${TOKENS_SCHEMA}`);
  lines.push(`   Generated-at: ${contentStamp()} (content stamp — regeneration of unchanged theme content is byte-identical).`);
  lines.push('   Regenerate: `bun run tokens:generate` in vivim-ui, or scripts/generate-host-tokens.mjs --out <path>. */');
  lines.push('');

  lines.push(`:root, [data-theme="bone"] {`);
  lines.push(...tokenLines(THEMES.bone));
  lines.push('}');
  lines.push(`[data-theme="graphite"] {`);
  lines.push(...tokenLines(THEMES.graphite));
  lines.push('}');
  lines.push(':root {');
  lines.push(...tokenLines(BASE_TOKENS));
  lines.push('}');

  lines.push('');
  for (const face of FONT_FACES) lines.push(fontFaceLine(face));
  lines.push('');
  for (const cls of TYPE_SCALE) lines.push(typeClassLine(cls));

  lines.push('');
  lines.push('/* Follow the system dark setting unless a theme is chosen explicitly. */');
  lines.push('@media (prefers-color-scheme: dark) {');
  lines.push('  :root:not([data-theme]) {');
  lines.push(...tokenLines(THEMES.graphite, '    '));
  lines.push('    color-scheme: dark;');
  lines.push('  }');
  lines.push('}');

  return `${lines.join('\n')}\n`;
}

function main(argv) {
  let out = DEFAULT_OUT;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--out') {
      out = argv[++i];
      if (!out) {
        console.error('generate-host-tokens: --out requires a path');
        process.exitCode = 2;
        return;
      }
    } else if (arg.startsWith('--out=')) {
      out = arg.slice('--out='.length);
    } else {
      console.error(`generate-host-tokens: unknown argument ${arg}`);
      process.exitCode = 2;
      return;
    }
  }
  const css = renderTokensCss();
  const target = resolve(out);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, css, 'utf8');
  const count = css.match(/--[a-zA-Z0-9-]+\s*:/g)?.length ?? 0;
  console.log(`generate-host-tokens: wrote ${target} (${count} custom-property declarations, schema ${TOKENS_SCHEMA}, stamp ${contentStamp()})`);
}

const isMain =
  import.meta.main === true ||
  (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href);
if (isMain) main(process.argv.slice(2));
