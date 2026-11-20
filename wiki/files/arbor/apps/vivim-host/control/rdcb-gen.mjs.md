# File: apps/vivim-host/control/rdcb-gen.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/rdcb-gen.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16764 B |
| Lines | 389 |
| Hash | 1328a9dd92f9 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| GENERATOR_VERSION | const | 70 | no | const GENERATOR_VERSION = &#39;rdcb-gen/1 stage-b&#39;; |
| BUNDLE_SCHEMA | const | 71 | no | const BUNDLE_SCHEMA = &#39;vivim.rdcb/1&#39;; |
| INHERITS | const | 72 | no | const INHERITS = &#39;hq.context-bundle/1&#39;; |
| PROTOCOL | const | 73 | no | const PROTOCOL = &#39;hq.dcb-protocol/1&#39;; |
| TRIGGER | const | 74 | no | const TRIGGER = &#39;edit.pre&#39;; |
| AUDIENCE | const | 75 | no | const AUDIENCE = &#39;agent&#39;; |
| PROJECT | const | 76 | no | const PROJECT = &#39;arbor&#39;; |
| AUTHORITY | const | 77 | no | const AUTHORITY = &#39;project_observed&#39;; |
| BUDGET_MAX_TOKENS | const | 78 | no | const BUDGET_MAX_TOKENS = 5000; // protocol §1 edit.pre default |
| BUDGET_RESERVED | const | 79 | no | const BUDGET_RESERVED = 800; // protocol §2 reservedForOutput default |
| CAPACITY_SLACK | const | 80 | no | const CAPACITY_SLACK = 80; // protocol §5: capacity = budget - reserved - 80 |
| TOKENS_PER_BYTE | const | 81 | no | const TOKENS_PER_BYTE = 3; // protocol estimator &quot;utf8-bytes/3&quot; |
| PINNED_NOW | const | 84 | no | const PINNED_NOW = &#39;2026-11-14T00:00:00.000Z&#39;; |
| FILE_SURFACE_REL | const | 86 | no | const FILE_SURFACE_REL = &#39;apps/vivim-host/data/demo-baseline/file-surface.v1.json&#39;; |
| ACTION_CATALOG_REL | const | 87 | no | const ACTION_CATALOG_REL = &#39;apps/vivim-host/control/action-catalog.v1.json&#39;; |
| RDCB_DIR_REL | const | 88 | no | const RDCB_DIR_REL = &#39;apps/vivim-host/data/demo-baseline/rdcb&#39;; |
| WORK_ORDER_DIR_REL | const | 89 | no | const WORK_ORDER_DIR_REL = &#39;apps/vivim-host/data/demo-baseline/work-orders&#39;; |
| SEED_FILES | const | 93 | no | const SEED_FILES = [ |
| LANG_BY_EXT | const | 99 | no | const LANG_BY_EXT = { &#39;.js&#39;: &#39;javascript&#39;, &#39;.mjs&#39;: &#39;javascript&#39;, &#39;.html&#39;: &#39;html&#39; }; |
| here | const | 101 | no | const here = dirname(fileURLToPath(import.meta.url)); |
| repoRoot | const | 102 | no | const repoRoot = join(here, &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| die | function | 104 | no | function die(message) { |
| sha256Hex | function | 109 | no | function sha256Hex(data) { |
| estimateTokens | function | 113 | no | function estimateTokens(text) { |
| surfaceHeaderExcerpt | function | 121 | no | function surfaceHeaderExcerpt(relPath, text) { |
| delims | const | 122 | no | const delims = [ |
| found | const | 126 | no | const found = []; |
| at | variable | 128 | no | let at = 0; |
| start | const | 130 | no | const start = text.indexOf(opener, at); |
| body | const | 134 | no | const body = text.slice(start + opener.length, end); |
| startLine | const | 136 | no | const startLine = text.slice(0, start).split(&#39;\\n&#39;).length; |
| endLine | const | 137 | no | const endLine = startLine + text.slice(start, end + closer.length).split(&#39;\\n&#39;).length - 1; |
| readRepoFile | function | 154 | no | function readRepoFile(relPath) { |
| loadFileSurface | function | 165 | no | function loadFileSurface() { |
| bytes | const | 166 | no | const bytes = readRepoFile(FILE_SURFACE_REL); |
| doc | variable | 167 | no | let doc; |
| byPath | const | 176 | no | const byPath = new Map(); |
| loadActionCatalog | function | 186 | no | function loadActionCatalog() { |
| bytes | const | 187 | no | const bytes = readRepoFile(ACTION_CATALOG_REL); |
| doc | variable | 188 | no | let doc; |
| ids | const | 197 | no | const ids = new Set((doc.actions ?? []).map(a =&gt; a.id).filter(Boolean)); |
| composeBundle | function | 203 | no | function composeBundle({ relPath, bytes, now, registry, registryDoc, catalog, catalogDoc }) { |
| excerpt | const | 204 | no | const excerpt = surfaceHeaderExcerpt(relPath, bytes.toString(&#39;utf8&#39;)); |
| currentDigest | const | 210 | no | const currentDigest = sha256Hex(bytes); |
| stale | const | 211 | no | const stale = record.sourceDigest !== currentDigest; |
| ext | const | 220 | no | const ext = relPath.slice(relPath.lastIndexOf(&#39;.&#39;)); |
| lang | const | 221 | no | const lang = LANG_BY_EXT[ext]; |
| estimatedTokens | const | 224 | no | const estimatedTokens = estimateTokens(excerpt.text); |
| capacity | const | 225 | no | const capacity = BUDGET_MAX_TOKENS - BUDGET_RESERVED - CAPACITY_SLACK; |
| fileSurface | const | 230 | no | const fileSurface = { |
| source | const | 236 | no | const source = { |
| budget | const | 254 | no | const budget = { |
| bundle | const | 262 | no | const bundle = { |
| forDigest | const | 302 | no | const forDigest = { ...bundle, digest: undefined }; |
| parseNowArg | function | 308 | no | function parseNowArg(argv) { |
| flagIndex | const | 309 | no | const flagIndex = argv.indexOf(&#39;--now&#39;); |
| value | const | 311 | no | const value = argv[flagIndex + 1]; |
| main | function | 318 | no | function main() { |
| now | const | 319 | no | const now = parseNowArg(process.argv.slice(2)); |
| registry | const | 320 | no | const registry = loadFileSurface(); |
| catalog | const | 321 | no | const catalog = loadActionCatalog(); |
| outDir | const | 323 | no | const outDir = join(repoRoot, ...RDCB_DIR_REL.split(&#39;/&#39;)); |
| cacheDir | const | 324 | no | const cacheDir = cacheDirFor(outDir); |
| workOrderDir | const | 325 | no | const workOrderDir = join(repoRoot, ...WORK_ORDER_DIR_REL.split(&#39;/&#39;)); |
| written | variable | 329 | no | let written = 0; |
| reused | variable | 330 | no | let reused = 0; |
| bytes | const | 332 | no | const bytes = readRepoFile(relPath); |
| currentDigest | const | 333 | no | const currentDigest = sha256Hex(bytes); |
| hit | const | 334 | no | const hit = cacheHit(cacheDir, relPath, currentDigest); |
| bundle | variable | 336 | no | let bundle; |
| receipt | variable | 337 | no | let receipt; |
| base | const | 354 | no | const base = relPath.slice(relPath.lastIndexOf(&#39;/&#39;) + 1).replace(/\\.[^.]+$/, &#39;&#39;); |
| outPath | const | 355 | no | const outPath = join(outDir, base + &#39;.rdcb.v1.json&#39;); |
| receiptPath | const | 361 | no | const receiptPath = join(cacheDir, base + &#39;.receipt.json&#39;); |
| workOrder | const | 365 | no | const workOrder = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 64 | external |
| node:fs | import | 65 | external |
| node:path | import | 66 | external |
| node:url | import | 67 | external |
| ./rdcb-cache.mjs | import | 68 | [apps/vivim-host/control/rdcb-cache.mjs](./rdcb-cache.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// rdcb-gen.mjs — deterministic RDCB v1 bundle generator (ledger P3, Stage B).
// Emits Reprogramming Dynamic Context Bundles for the Stage A seeded corpus
// (the files carrying @vlang:surface headers) under
// apps/vivim-host/data/demo-baseline/rdcb/.
//
// FORMAT — inherits hq.context-bundle/1 (docs/DCB-PROTOCOL.md lives in
// repos_hq: C:/0-BlackBoxProject-0/repos_hq/docs/DCB-PROTOCOL.md; the ARBOR
// docs/ tree has no local copy — bundle shape follows that normative spec,
// §6 Output). Schema: vivim.rdcb/1, one bundle per seeded file. Inherited
// keys: schema, protocol, trigger, task, audience, project, generatedAt,
// status, budget, sources, omissions, symbols, decisions, canon, sessions,
// labels, authority, digest. ADDED reprogramming-specific keys ONLY:
//
//   bundle.inherits         "hq.context-bundle/1" — explicit inheritance mark.
//   bundle.reprogramming    { corpusScope, vlangExecution, fileSurfaceRegistry,
//                             nlclCatalog } — provenance of the composition:
//                             the file-surface registry ref + record count and
//                             the NLCL action-catalog ref + schema + version.
//   source.excerpt          { kind, lines, text } — the source excerpt the
//                             file-surface record anchors. v1 anchors ONE
//                             excerpt per file: the @vlang:surface header block
//                             verbatim (delimiters included). Per-comment-id
//                             body excerpts are NOT emitted in v1 — the
//                             commentIds have no on-disk body anchors yet
//                             (verified 2026-11-14: ids appear only in the
//                             header), and anchoring them would require vlang
//                             execution, which is out of scope ("format +
//                             generator only", no vlang EXECUTION in v1).
//   source.fileSurface      { ref, surface, commentIds } — the referenced
//                             vivim.file-surface/1 record (minus its digest
//                             fields, which the source carries as sha256).
//   source.nlclActionIds    the record's actionIds, VALIDATED against
//                             apps/vivim-host/control/action-catalog.v1.json
//                             (Stage A declared them without validation; the
//                             catalog check is the later stage it anticipated).
//                             Unknown id => fail-closed error.
//
// Inherited fields RDCB v1 does NOT populate (no honest source for them):
// docFamily / docRole / sourceClass / autoExposeReason (217/133 registry not
// consulted), symbols / decisions / canon / sessions stay empty arrays, and
// score stays at the protocol base score 1 (no scorer run). They are kept as
// keys only where the shape carries them, so a bundle is shape-complete.
//
// DETERMINISM CONTRACT (protocol §9 + file-surface-gen Stage A conventions):
//   - SEED_FILES is an explicit ordered list — no directory scans, no globbing.
//   - generatedAt is PINNED to the directive date by default so reruns over
//     unchanged inputs are byte-identical (protocol §2 "now — pinned timestamp
//     for determinism"). Pass --now <iso> to override; the pinned default is
//     still what the digest excludes (protocol §6: "digest excludes
//     generatedAt").
//   - No environment values, no Math.random, no locale-dependent formatting.
//   - budget: trigger "edit.pre" default maxTokens 5000, reserved 800
//     (protocol §1, §2); capacity = maxTokens - reserved - 80 (protocol §5).
//   - estimatedTokens = ceil(utf8 byte length / 3) (protocol estimator
//     "utf8-bytes/3").
//   - status is COMPUTED, not asserted: "fresh" when every seeded file's
//     current sha256 equals its file-surface record sourceDigest, else
//     "stale" (protocol §7) with the drifted paths recorded in omissions
//     alongside their reason.
//   - Object keys in fixed literal order; JSON 2-space indent, trailing
//     newline. Top-level digest = sha256 of the canonical JSON of the bundle
//     minus generatedAt and minus its own digest field.

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cacheDirFor, cacheHit, invalidateEntry, storeBundle, reuseReceipt } from './rdcb-cache.mjs';

const GENERATOR_VERSION = 'rdcb-gen/1 stage-b';
const BUNDLE_SCHEMA = 'vivim.rdcb/1';
const INHERITS = 'hq.context-bundle/1';
const PROTOCOL = 'hq.dcb-protocol/1';
const TRIGGER = 'edit.pre';
const AUDIENCE = 'agent';
const PROJECT = 'arbor';
const AUTHORITY = 'project_observed';
const BUDGET_MAX_TOKENS = 5000;   // protocol §1 edit.pre default
const BUDGET_RESERVED = 800;      // protocol §2 reservedForOutput default
const CAPACITY_SLACK = 80;        // protocol §5: capacity = budget - reserved - 80
```

_First 80 of 390 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
