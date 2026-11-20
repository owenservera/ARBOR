# File: packages/tierflow/scripts/generate-host-tokens.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/scripts/generate-host-tokens.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5429 B |
| Lines | 128 |
| Hash | 4864a00e8d9c |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEFAULT_HARNESS_ROOT | const | 25 | no | const DEFAULT_HARNESS_ROOT = fileURLToPath(new URL(&#39;../../../&#39;, import.meta.url)); |
| HARNESS_ROOT | const | 26 | yes | export const HARNESS_ROOT = DEFAULT_HARNESS_ROOT; |
| DEFAULT_OUT | const | 29 | yes | export const DEFAULT_OUT = join(HARNESS_ROOT, &#39;apps/vivim-host/public/vivim-tokens.css&#39;); |
| tokenLines | function | 32 | no | function tokenLines(table, indent = &#39; &#39;) { |
| fontFaceLine | function | 39 | no | function fontFaceLine(face) { |
| typeClassLine | function | 44 | no | function typeClassLine(cls) { |
| parts | const | 45 | no | const parts = [ |
| contentStamp | function | 56 | no | function contentStamp() { |
| canonical | const | 57 | no | const canonical = JSON.stringify({ FONT_FACES, TOKENS_SCHEMA, THEMES, TYPE_SCALE, BASE_TOKENS }); |
| renderTokensCss | function | 62 | yes | export function renderTokensCss() { |
| lines | const | 63 | no | const lines = []; |
| main | function | 98 | no | function main(argv) { |
| out | variable | 99 | no | let out = DEFAULT_OUT; |
| arg | const | 101 | no | const arg = argv[i]; |
| css | const | 117 | no | const css = renderTokensCss(); |
| target | const | 118 | no | const target = resolve(out); |
| count | const | 121 | no | const count = css.match(/--[a-zA-Z0-9-]+\\s*:/g)?.length ?? 0; |
| isMain | const | 125 | no | const isMain = |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 17 | external |
| node:fs | import | 18 | external |
| node:path | import | 19 | external |
| node:url | import | 20 | external |
| ../src/theme.ts | import | 22 | [packages/tierflow/src/theme.ts](../src/theme.ts.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Generates the harness host tokens CSS from the vivim-ui canonical theme (src/theme.ts) — vivim-ui is the token authority, the harness file is a build artifact. |
| 3 | owner | one-app-m5 | — | one-app-m5 |
| 4 | task | — | — | M5 vivim-ui token authority (one-app fan-out 2026-11-09) |
| 5 | see | — | test/generate-host-tokens.test.mjs | test/generate-host-tokens.test.mjs (parity oracle: never drop a property the host uses) |

## Excerpt

```javascript
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

/** ARBOR contains the Host and TierFlow sources; never require a donor checkout. */
const DEFAULT_HARNESS_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
export const HARNESS_ROOT = DEFAULT_HARNESS_ROOT;

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
```

_First 80 of 129 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
