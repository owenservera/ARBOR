# File: hq/lib/wiki-program.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/wiki-program.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 21579 B |
| Lines | 610 |
| Hash | faf230a3de98 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WIKI_PROGRAM_SCHEMA | const | 24 | yes | export const WIKI_PROGRAM_SCHEMA = &#39;hq.wiki-program/1&#39;; |
| PROGRAM_CONFIG_KEYS | const | 29 | yes | export const PROGRAM_CONFIG_KEYS = Object.freeze([ &#39;id&#39;, &#39;version&#39;, &#39;project&#39;, &#39;source&#39;, &#39;filters&#39;, &#39;layout&#39;, &#39;selection&#39;, &#39;expectedRevision&#39;, ]); |
| PROGRAM_FILTER_KEYS | const | 33 | yes | export const PROGRAM_FILTER_KEYS = Object.freeze([ &#39;kind&#39;, &#39;status&#39;, &#39;authority&#39;, &#39;type&#39;, &#39;capability&#39;, &#39;query&#39;, ]); |
| PROGRAM_LAYOUT_KEYS | const | 37 | yes | export const PROGRAM_LAYOUT_KEYS = Object.freeze([ &#39;columns&#39;, &#39;groupBy&#39;, &#39;order&#39;, &#39;depth&#39;, &#39;budget&#39;, &#39;retrieval&#39;, &#39;density&#39;, ]); |
| PROGRAM_SELECTION_KEYS | const | 41 | yes | export const PROGRAM_SELECTION_KEYS = Object.freeze([ &#39;mode&#39;, &#39;limit&#39;, &#39;confidence&#39;, &#39;strategy&#39;, ]); |
| PROGRAM_SOURCE_VALUES | const | 46 | yes | export const PROGRAM_SOURCE_VALUES = Object.freeze([ &#39;index&#39;, &#39;docs&#39;, &#39;decisions&#39;, &#39;canon&#39;, &#39;wiki&#39;, &#39;notes&#39;, &#39;sessions&#39;, ]); |
| FORBIDDEN_KEYS | const | 52 | no | const FORBIDDEN_KEYS = new Set([ &#39;command&#39;, &#39;exec&#39;, &#39;shell&#39;, &#39;script&#39;, &#39;run&#39;, &#39;spawn&#39;, &#39;send&#39;, &#39;publish&#39;, &#39;message&#39;, &#39;provider&#39;, &#39;write&#39;, &#39;patch&#39;, &#39;edit&#39;, &#39;delete&#39;, &#39;sudo&#39;, &#39;escalate&#39;, &#39;grant&#39;, &#39;role… |
| FORBIDDEN_WORDS | const | 59 | no | const FORBIDDEN_WORDS = Object.freeze([ &#39;shell&#39;, &#39;exec&#39;, &#39;eval&#39;, &#39;spawn&#39;, &#39;process&#39;, &#39;sudo&#39;, &#39;escalate&#39;, &#39;privilege&#39;, &#39;send&#39;, &#39;publish&#39;, ]); |
| FORBIDDEN_LITERALS | const | 63 | no | const FORBIDDEN_LITERALS = Object.freeze([&#39;http://&#39;, &#39;https://&#39;, &#39;file://&#39;, &#39;~&#39;, &#39;${&#39;]); |
| CONFIG_SPEC | const | 66 | no | const CONFIG_SPEC = Object.freeze({ id: &#39;id&#39;, version: &#39;positive_int&#39;, project: &#39;text&#39;, source: &#39;source&#39;, |
| FILTER_SPEC | const | 77 | no | const FILTER_SPEC = Object.freeze({ kind: &#39;text_list&#39;, status: &#39;text_list&#39;, authority: &#39;text_list&#39;, type: &#39;text_list&#39;, |
| LAYOUT_SPEC | const | 86 | no | const LAYOUT_SPEC = Object.freeze({ columns: &#39;text_list&#39;, groupBy: &#39;text&#39;, order: &#39;text_list&#39;, depth: &#39;non_negative_int&#39;, |
| SELECTION_SPEC | const | 96 | no | const SELECTION_SPEC = Object.freeze({ mode: &#39;text&#39;, limit: &#39;positive_int&#39;, confidence: &#39;confidence&#39;, strategy: &#39;text&#39;, |
| SECTIONS | const | 103 | no | const SECTIONS = Object.freeze([ [&#39;filters&#39;, FILTER_SPEC], [&#39;layout&#39;, LAYOUT_SPEC], [&#39;selection&#39;, SELECTION_SPEC], ]); |
| ID_RE | const | 109 | no | const ID_RE = /^[a-z0-9][a-z0-9._-]*$/; |
| cmp | function | 111 | no | const cmp = (a, b) =&gt; (a &lt; b ? -1 : a &gt; b ? 1 : 0); |
| isPlainObject | function | 116 | no | function isPlainObject(value) { |
| isText | function | 120 | no | function isText(value) { |
| isPositiveInt | function | 124 | no | function isPositiveInt(value) { |
| isNonNegativeInt | function | 128 | no | function isNonNegativeInt(value) { |
| isTextList | function | 132 | no | function isTextList(value) { |
| isConfidence | function | 137 | no | function isConfidence(value) { |
| clampLimit | function | 142 | no | function clampLimit(value, fallback) { |
| n | const | 143 | no | const n = Number(value); |
| typeError | function | 151 | no | function typeError(errors, path, expected, value) { |
| checkValue | function | 159 | no | function checkValue(errors, path, kind, value) { |
| scanStrings | function | 203 | no | function scanStrings(value, path, errors) { |
| lowered | const | 205 | no | const lowered = value.toLowerCase(); |
| forbidden | const | 206 | no | const forbidden = FORBIDDEN_LITERALS.some((literal) =&gt; lowered.includes(literal)) |
| trimmed | const | 215 | no | const trimmed = value.trim(); |
| traversal | const | 216 | no | const traversal = trimmed.includes(&#39;..&#39;) |
| sortedErrors | function | 240 | no | function sortedErrors(errors) { |
| seen | const | 241 | no | const seen = new Set(); |
| unique | const | 242 | no | const unique = []; |
| id | const | 244 | no | const id = `${error.path}\\0${error.code}\\0${error.message}`; |
| validateProgramConfig | function | 256 | yes | export function validateProgramConfig(config) { |
| errors | const | 267 | no | const errors = []; |
| kind | const | 281 | no | const kind = CONFIG_SPEC[key]; |
| value | const | 288 | no | const value = config[section]; |
| sorted | const | 315 | no | const sorted = sortedErrors(errors); |
| canonicalProgramConfig | function | 323 | yes | export function canonicalProgramConfig(config) { |
| configText | function | 327 | no | function configText(config) { |
| SOURCE_PROJECTIONS | const | 334 | no | const SOURCE_PROJECTIONS = Object.freeze({ index: [&#39;files&#39;, &#39;symbols&#39;], docs: [&#39;documents&#39;], decisions: [&#39;decisions&#39;], canon: [&#39;canon&#39;], |
| LAYOUT_PROJECTIONS | const | 344 | no | const LAYOUT_PROJECTIONS = Object.freeze({ columns: &#39;columns&#39;, groupBy: &#39;groups&#39;, order: &#39;ordering&#39;, depth: &#39;graph&#39;, |
| SELECTION_PROJECTIONS | const | 354 | no | const SELECTION_PROJECTIONS = Object.freeze({ mode: &#39;selection&#39;, limit: &#39;limit&#39;, confidence: &#39;confidence&#39;, strategy: &#39;strategy&#39;, |
| buildSteps | function | 361 | no | function buildSteps() { |
| planFor | function | 373 | no | function planFor() { |
| steps | const | 374 | no | const steps = buildSteps(); |
| ordered | const | 375 | no | const ordered = orderActionPlan(steps); |
| status | const | 376 | no | const status = ordered?.status === &#39;invalid&#39; ? &#39;invalid&#39; : (ordered?.status \|\| &#39;invalid&#39;); |
| plan | const | 377 | no | const plan = { |
| affectedFor | function | 389 | no | function affectedFor(config) { |
| source | const | 390 | no | const source = typeof config.source === &#39;string&#39; ? config.source : null; |
| touched | const | 391 | no | const touched = new Set(); |
| layout | const | 393 | no | const layout = isPlainObject(config.layout) ? config.layout : {}; |
| selection | const | 399 | no | const selection = isPlainObject(config.selection) ? config.selection : {}; |
| project | const | 405 | no | const project = typeof config.project === &#39;string&#39; ? config.project.trim() : &#39;&#39;; |
| readActive | function | 416 | no | function readActive(db, id) { |
| row | const | 419 | no | const row = db.prepare( &quot;SELECT * FROM wiki_program_version WHERE id = ? AND status = &#39;active&#39; ORDER BY version DESC LIMIT 1&quot;, ).get(String(id)); |
| maxValue | function | 428 | no | function maxValue(db, id, column) { |
| row | const | 429 | no | const row = db.prepare( `SELECT MAX(${column}) AS value FROM wiki_program_version WHERE id = ?`, ).get(String(id)); |
| maxActiveRevision | function | 435 | no | function maxActiveRevision(db, id) { |
| row | const | 436 | no | const row = db.prepare( &quot;SELECT MAX(revision) AS value FROM wiki_program_version WHERE id = ? AND status = &#39;active&#39;&quot;, ).get(String(id)); |
| versionRow | function | 442 | no | function versionRow(row) { |
| diffAgainst | function | 460 | no | function diffAgainst(config, active) { |
| next | const | 461 | no | const next = isPlainObject(config) ? config : {}; |
| priorRow | const | 462 | no | const priorRow = active ? safeJsonParse(active.config, null) : null; |
| prior | const | 463 | no | const prior = isPlainObject(priorRow) ? priorRow : {}; |
| nextKeys | const | 464 | no | const nextKeys = Object.keys(next).filter((key) =&gt; key !== &#39;version&#39;).sort(cmp); |
| priorKeys | const | 465 | no | const priorKeys = Object.keys(prior).filter((key) =&gt; key !== &#39;version&#39;).sort(cmp); |
| changed | const | 466 | no | const changed = nextKeys.filter((key) =&gt; ( priorKeys.includes(key) &amp;&amp; canonicalProgramConfig(next[key]) !== canonicalProgramConfig(prior[key]) )); |
| added | const | 470 | no | const added = nextKeys.filter((key) =&gt; !priorKeys.includes(key)); |
| removed | const | 471 | no | const removed = priorKeys.filter((key) =&gt; !nextKeys.includes(key)); |
| previewProgram | function | 487 | yes | export function previewProgram(db, config) { |
| validation | const | 488 | no | const validation = validateProgramConfig(config); |
| safe | const | 489 | no | const safe = isPlainObject(config) ? config : {}; |
| canonicalText | const | 490 | no | const canonicalText = configText(config); |
| plan | const | 491 | no | const plan = planFor(); |
| id | const | 492 | no | const id = typeof safe.id === &#39;string&#39; ? safe.id : null; |
| active | const | 493 | no | const active = readActive(db, id); |
| digest | const | 494 | no | const digest = sha256(`${canonicalText}\\0${canonicalProgramConfig(plan)}`); |
| activateProgram | function | 516 | yes | export function activateProgram(db, config, options = {}) { |
| opts | const | 517 | no | const opts = isPlainObject(options) ? options : {}; |
| validation | const | 519 | no | const validation = validateProgramConfig(config); |
| id | const | 522 | no | const id = config.id; |
| stored | const | 523 | no | const stored = canonicalProgramConfig(config); |
| digest | const | 524 | no | const digest = sha256(stored); |
| receipt | const | 525 | no | const receipt = opts.receipt == null ? null : canonical(opts.receipt); |
| version | const | 529 | no | const version = maxValue(db, id, &#39;version&#39;) + 1; |
| revision | const | 530 | no | const revision = maxActiveRevision(db, id) + 1; |
| rollbackProgram | function | 548 | yes | export function rollbackProgram(db, options = {}) { |
| opts | const | 549 | no | const opts = isPlainObject(options) ? options : {}; |
| id | const | 551 | no | const id = typeof opts.id === &#39;string&#39; ? opts.id : &#39;&#39;; |
| toVersion | const | 552 | no | const toVersion = Number.isSafeInteger(opts.toVersion) &amp;&amp; opts.toVersion &gt;= 1 ? opts.toVersion : null; |
| receipt | const | 555 | no | const receipt = opts.receipt == null ? null : canonical(opts.receipt); |
| target | const | 559 | no | const target = db.prepare(&#39;SELECT * FROM wiki_program_version WHERE id = ? AND version = ?&#39;) |
| version | const | 562 | no | const version = maxValue(db, id, &#39;version&#39;) + 1; |
| revision | const | 563 | no | const revision = maxActiveRevision(db, id) + 1; |
| stored | const | 564 | no | const stored = String(target.config ?? &#39;&#39;); |
| listProgramVersions | function | 589 | yes | export function listProgramVersions(db, options = {}) { |
| opts | const | 590 | no | const opts = isPlainObject(options) ? options : {}; |
| limit | const | 591 | no | const limit = clampLimit(opts.limit, 100); |
| id | const | 593 | no | const id = typeof opts.id === &#39;string&#39; &amp;&amp; opts.id ? opts.id : null; |
| rows | const | 595 | no | const rows = id |
| getActiveProgram | function | 607 | yes | export function getActiveProgram(db, id) { |
| row | const | 608 | no | const row = readActive(db, typeof id === &#39;string&#39; ? id : null); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./util.mjs | import | 20 | [hq/lib/util.mjs](./util.mjs.md) |
| ./schema.mjs | import | 21 | [hq/lib/schema.mjs](./schema.mjs.md) |
| ./semantic-optimizers.mjs | import | 22 | [hq/lib/semantic-optimizers.mjs](./semantic-optimizers.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/wiki-program.mjs |
| [hq/lib/comment-wiki-bridge.mjs](./comment-wiki-bridge.mjs.md) | ./wiki-program.mjs |
| [hq/test/comment-program-integration.test.mjs](../test/comment-program-integration.test.mjs.md) | ../lib/wiki-program.mjs |
| [hq/test/comment-wiki-bridge.test.mjs](../test/comment-wiki-bridge.test.mjs.md) | ../lib/wiki-program.mjs |
| [hq/test/wiki-program.test.mjs](../test/wiki-program.test.mjs.md) | ../lib/wiki-program.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Bounded, owner-confirmed wiki program writer: data-only view |
| 4 | owner | hq | — | hq |
| 5 | task | — | — | wiki-program-v1 |
| 6 | invariant | — | — | The program config is data only. No value in it is ever used as |
| 9 | invariant | — | — | previewProgram is pure: it never writes and never mutates the db. |
| 10 | invariant | — | — | Every write needs explicit owner confirmation and is versioned, |
| 12 | invariant | — | — | The read-only wiki console lane is untouched here; this module |
| 15 | see | — | docs/research/semantic-language-kernel/ARCHITECTURE.md | docs/research/semantic-language-kernel/ARCHITECTURE.md |
| 16 | see | — | docs/research/semantic-language-kernel/CONTRACT-AND-ROADMAP.md | docs/research/semantic-language-kernel/CONTRACT-AND-ROADMAP.md |
| 17 | see | — | hq/lib/semantic-optimizers.mjs | hq/lib/semantic-optimizers.mjs |
| 18 | see | — | hq/lib/canon.mjs | hq/lib/canon.mjs |

## Excerpt

```javascript
/**
 * @hq:context Bounded, owner-confirmed wiki program writer: data-only view
 *   configuration with validate/preview/diff, versioning and rollback.
 * @hq:owner hq
 * @hq:task wiki-program-v1
 * @hq:invariant The program config is data only. No value in it is ever used as
 *   a filesystem path, a command or a URL; `source` is a closed enum. This
 *   module performs no filesystem write and no network call.
 * @hq:invariant previewProgram is pure: it never writes and never mutates the db.
 * @hq:invariant Every write needs explicit owner confirmation and is versioned,
 *   reversible and history preserving. A superseded row is never deleted.
 * @hq:invariant The read-only wiki console lane is untouched here; this module
 *   is the only program-configuration writer and it refuses shell, provider
 *   messages, source modification and privilege escalation by construction.
 * @hq:see docs/research/semantic-language-kernel/ARCHITECTURE.md
 * @hq:see docs/research/semantic-language-kernel/CONTRACT-AND-ROADMAP.md
 * @hq:see hq/lib/semantic-optimizers.mjs
 * @hq:see hq/lib/canon.mjs
 */
import { canonical, nowISO, safeJsonParse, sha256 } from './util.mjs';
import { transaction } from './schema.mjs';
import { orderActionPlan } from './semantic-optimizers.mjs';

export const WIKI_PROGRAM_SCHEMA = 'hq.wiki-program/1';

// ---------------------------------------------------------------------------
// allowlists (contract exports, renderable by a CLI)

export const PROGRAM_CONFIG_KEYS = Object.freeze([
  'id', 'version', 'project', 'source', 'filters', 'layout', 'selection', 'expectedRevision',
]);

export const PROGRAM_FILTER_KEYS = Object.freeze([
  'kind', 'status', 'authority', 'type', 'capability', 'query',
]);

export const PROGRAM_LAYOUT_KEYS = Object.freeze([
  'columns', 'groupBy', 'order', 'depth', 'budget', 'retrieval', 'density',
]);

export const PROGRAM_SELECTION_KEYS = Object.freeze([
  'mode', 'limit', 'confidence', 'strategy',
]);

// `source` is an enum of HQ projections, never a path.
export const PROGRAM_SOURCE_VALUES = Object.freeze([
  'index', 'docs', 'decisions', 'canon', 'wiki', 'notes', 'sessions',
]);

// A key that would turn a view configuration into an effect surface. Refused
// even where the key is not otherwise allowlisted.
const FORBIDDEN_KEYS = new Set([
  'command', 'exec', 'shell', 'script', 'run', 'spawn', 'send', 'publish',
  'message', 'provider', 'write', 'patch', 'edit', 'delete', 'sudo',
  'escalate', 'grant', 'role', 'token', 'secret', 'env',
]);

// Capability words and shapes refused inside any string value.
const FORBIDDEN_WORDS = Object.freeze([
  'shell', 'exec', 'eval', 'spawn', 'process', 'sudo', 'escalate', 'privilege',
  'send', 'publish',
]);
const FORBIDDEN_LITERALS = Object.freeze(['http://', 'https://', 'file://', '~', '${']);

// Per-key value contracts. `nested` marks the three programmable sections.
const CONFIG_SPEC = Object.freeze({
  id: 'id',
  version: 'positive_int',
  project: 'text',
  source: 'source',
  filters: 'nested',
  layout: 'nested',
  selection: 'nested',
  expectedRevision: 'non_negative_int',
});

const FILTER_SPEC = Object.freeze({
  kind: 'text_list',
  status: 'text_list',
  authority: 'text_list',
```

_First 80 of 611 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
