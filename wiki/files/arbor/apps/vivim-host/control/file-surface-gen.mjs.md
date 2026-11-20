# File: apps/vivim-host/control/file-surface-gen.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/file-surface-gen.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9141 B |
| Lines | 206 |
| Hash | 244673b46743 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| GENERATOR_VERSION | const | 70 | no | const GENERATOR_VERSION = &#39;file-surface-gen/1 stage-a&#39;; |
| OUTPUT_SCHEMA | const | 71 | no | const OUTPUT_SCHEMA = &#39;vivim.file-surface/1&#39;; |
| ID_TOKEN | const | 72 | no | const ID_TOKEN = /^[a-z0-9][a-z0-9._-]{0,79}$/; |
| SEED_FILES | const | 77 | no | const SEED_FILES = [ |
| here | const | 83 | no | const here = dirname(fileURLToPath(import.meta.url)); |
| repoRoot | const | 84 | no | const repoRoot = join(here, &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| outputPath | const | 85 | no | const outputPath = join(repoRoot, &#39;apps&#39;, &#39;vivim-host&#39;, &#39;data&#39;, &#39;demo-baseline&#39;, &#39;file-surface.v1.json&#39;); |
| die | function | 87 | no | function die(message) { |
| BLOCK_DELIMS | const | 93 | no | const BLOCK_DELIMS = [ |
| blockComments | function | 101 | no | function blockComments(text) { |
| out | const | 102 | no | const out = []; |
| at | variable | 104 | no | let at = 0; |
| start | const | 106 | no | const start = text.indexOf(opener, at); |
| line | const | 110 | no | const line = text.slice(0, start).split(&#39;\\n&#39;).length; |
| parseHeader | function | 120 | no | function parseHeader(relPath, text) { |
| header | const | 121 | no | const header = blockComments(text).find(c =&gt; c.body.trimStart().startsWith(&#39;@vlang:surface&#39;)); |
| allLines | const | 124 | no | const allLines = header.body.split(&#39;\\n&#39;); |
| lines | const | 125 | no | const lines = allLines.slice(allLines.findIndex(l =&gt; l.trim().length &gt; 0)); // skip blank lines after opener delimiter |
| first | const | 126 | no | const first = lines[0].trim(); |
| openerPrefix | const | 127 | no | const openerPrefix = &#39;@vlang:surface&#39;; |
| openerPath | const | 131 | no | const openerPath = first.slice(openerPrefix.length).trim(); |
| desc | const | 136 | no | const desc = []; |
| commentIds | const | 137 | no | const commentIds = []; |
| actionIds | const | 138 | no | const actionIds = []; |
| seen | const | 139 | no | const seen = { commentIds: new Set(), actionIds: new Set() }; |
| lineNo | const | 142 | no | const lineNo = header.line + i + 1; |
| line | const | 143 | no | const line = raw.trim(); |
| m | const | 146 | no | const m = line.match(/^@vlang:([a-z-]+):?\\s*([\\s\\S]*)$/); |
| value | const | 149 | no | const value = valueRaw.trim(); |
| bucket | const | 155 | no | const bucket = name === &#39;id&#39; ? commentIds : actionIds; |
| seenIds | const | 156 | no | const seenIds = seen[name === &#39;id&#39; ? &#39;commentIds&#39; : &#39;actionIds&#39;]; |
| buildRecord | function | 175 | no | function buildRecord(relPath) { |
| abs | const | 176 | no | const abs = join(repoRoot, ...relPath.replace(/^apps\\/vivim-host\\/public\\/demo\\//, &#39;demo/host-legacy/&#39;).split(&#39;/&#39;)); |
| bytes | variable | 177 | no | let bytes; |
| parsed | const | 183 | no | const parsed = parseHeader(relPath, bytes.toString(&#39;utf8&#39;)); |
| main | function | 194 | no | function main() { |
| files | const | 195 | no | const files = SEED_FILES.map(buildRecord); |
| doc | const | 196 | no | const doc = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 65 | external |
| node:fs | import | 66 | external |
| node:path | import | 67 | external |
| node:url | import | 68 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// file-surface-gen.mjs — deterministic generator for the vlang file-surface corpus
// (ledger P2 Stage A). Parses ONLY structured header comments in the seeded
// files and emits apps/vivim-host/data/demo-baseline/file-surface.v1.json.
//
// STAGE A GRAMMAR — vlang structured header comments
// ===================================================
//
// Scope: the generator parses ONLY structured header comments of the seeded
// files (SEED_FILES below). Nothing else in a file is parsed; the file's raw
// bytes feed the sourceDigest only.
//
// Block comments recognized (Stage A):
//   JS/MJS:  /* ... */
//   HTML:    <!-- ... -->
//
// The header is the FIRST block comment in the file whose body, after
// stripping delimiters and trimming, starts with the exact token
// `@vlang:surface`. Exactly one header per file; a seeded file without one is
// an error (fail-closed).
//
// Header body, line by line (leading whitespace stripped):
//
//   @vlang:surface <path>            Opener line (required, first). <path>
//                                    must equal the seeded repo-relative path
//                                    (forward slashes) — mismatch is an error.
//   @vlang:surface-desc[: <text>]    One free-text line describing the
//                                    reprogrammable surface (what NL-driven
//                                    change this file accepts). Lines
//                                    accumulate in file order and are joined
//                                    with "\n" into the record's `surface`
//                                    field. An empty desc line is allowed.
//   @vlang:id[: <ids>]               One or more anchored comment ids,
//                                    whitespace-separated. Ids accumulate
//                                    across lines; duplicates keep the first
//                                    occurrence; output order = first
//                                    occurrence order; emitted as the
//                                    record's `commentIds` field.
//   @vlang:action[: <ids>]           Linked NLCL action ids from
//                                    apps/vivim-host/control/action-catalog.v1.json,
//                                    same accumulation rules as @vlang:id;
//                                    emitted as the record's `actionIds`
//                                    field. A bare `@vlang:action:` with no
//                                    tokens declares the empty set explicitly.
//                                    Stage A does NOT validate ids against the
//                                    catalog — declared ids are data; catalog
//                                    validation is a later stage.
//   # <text>                         Comment line — ignored.
//   anything else                    Ignored.
//
// Token grammar (ids and action ids):
//   ^[a-z0-9][a-z0-9._-]{0,79}$   lowercase start; then lowercase, digits,
//   dot, underscore, hyphen; max 80 chars. A token that fails this grammar is
//   an ERROR with the offending line number (typo detection). An optional
//   single ":" directly after a directive name is consumed as a separator
//   (cosmetic).
//
// Determinism contract:
//   - SEED_FILES is an explicit ordered list — no directory scans, no globbing.
//   - No timestamps, no environment values anywhere in the output.
//   - Object keys are emitted in a fixed literal order; JSON is 2-space
//     indented with a trailing newline.
//   - sourceDigest = lowercase hex sha256 of the file's raw bytes.
//   Reruns over unchanged inputs are byte-identical.

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GENERATOR_VERSION = 'file-surface-gen/1 stage-a';
const OUTPUT_SCHEMA = 'vivim.file-surface/1';
const ID_TOKEN = /^[a-z0-9][a-z0-9._-]{0,79}$/;

// Seeded corpus (ledger P2 Stage A): the demo surface files. Ordered — this
// order is the record order in the output. The two new walkthrough pages are
// not appended until they exist; extend this list when they land.
const SEED_FILES = [
  'apps/vivim-host/public/demo/controller.js',
  'apps/vivim-host/public/demo/demo.html',
  'apps/vivim-host/public/demo/poll-round.mjs'
```

_First 80 of 207 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
