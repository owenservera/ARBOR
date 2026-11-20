# File: hq/lib/aii/state.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/aii/state.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9420 B |
| Lines | 223 |
| Hash | 2224d0d3da5b |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AII_JOURNAL_SCHEMA | const | 28 | yes | export const AII_JOURNAL_SCHEMA = &#39;hq.aii-run-journal/1&#39;; |
| AII_LEGACY_STATE_SCHEMA | const | 29 | yes | export const AII_LEGACY_STATE_SCHEMA = &#39;hq.aii-last-run/1&#39;; |
| JOURNAL_STATUSES | const | 31 | yes | export const JOURNAL_STATUSES = [ |
| EWMA_ALPHA | const | 43 | no | const EWMA_ALPHA = 0.35; |
| journalPath | function | 45 | yes | export function journalPath(root) { |
| legacyStatePath | function | 49 | yes | export function legacyStatePath(root) { |
| emptyJournal | function | 53 | yes | export function emptyJournal() { |
| loadJournal | function | 69 | yes | export function loadJournal(rootOrPath) { |
| path | const | 70 | no | const path = rootOrPath.endsWith(&#39;.json&#39;) ? rootOrPath : journalPath(rootOrPath); |
| parsed | const | 72 | no | const parsed = safeJsonParse(readFileSync(path, &#39;utf8&#39;), null); |
| errors | const | 76 | no | const errors = []; |
| readLegacyInvalidations | function | 95 | yes | export function readLegacyInvalidations(root) { |
| path | const | 96 | no | const path = legacyStatePath(root); |
| parsed | const | 98 | no | const parsed = safeJsonParse(readFileSync(path, &#39;utf8&#39;), null); |
| ids | const | 102 | no | const ids = {}; |
| id | const | 104 | no | const id = String(raw ?? &#39;&#39;).trim(); |
| migrateLegacyState | function | 116 | yes | export function migrateLegacyState(journal, { root, at = nowISO() } = {}) { |
| legacy | const | 117 | no | const legacy = readLegacyInvalidations(root); |
| next | const | 118 | no | const next = { ...journal, legacyFailures: { ...(journal.legacyFailures ?? {}) } }; |
| recordAttempt | function | 127 | yes | export function recordAttempt(journal, result, { at = nowISO() } = {}) { |
| relPath | const | 128 | no | const relPath = String(result?.relPath ?? &#39;&#39;).replaceAll(&#39;\\\\&#39;, &#39;/&#39;); |
| status | const | 130 | no | const status = JOURNAL_STATUSES.includes(result.status) ? result.status : &#39;fail&#39;; |
| entries | const | 131 | no | const entries = { ...(journal.entries ?? {}) }; |
| durations | const | 142 | no | const durations = { ...(journal.durations ?? {}) }; |
| previous | const | 143 | no | const previous = durations[relPath] ?? null; |
| measured | const | 144 | no | const measured = Number(result.durationMs); |
| ewmaMs | const | 146 | no | const ewmaMs = previous &amp;&amp; Number.isFinite(Number(previous.ewmaMs)) |
| legacyFailures | const | 155 | no | const legacyFailures = { ...(journal.legacyFailures ?? {}) }; |
| recordRun | function | 162 | yes | export function recordRun(journal, results, { at = nowISO(), mode = &#39;full&#39;, jobs = 1, elapsedMs = null } = {}) { |
| next | variable | 163 | no | let next = journal; |
| passed | const | 165 | no | const passed = results.filter((r) =&gt; r.status === &#39;pass&#39;).length; |
| saveJournal | function | 182 | yes | export function saveJournal(rootOrPath, journal) { |
| path | const | 183 | no | const path = rootOrPath.endsWith(&#39;.json&#39;) ? rootOrPath : journalPath(rootOrPath); |
| ordered | const | 184 | no | const ordered = { |
| tmp | const | 192 | no | const tmp = join(dirname(path), `.run-journal.${process.pid}.tmp`); |
| journalDigest | function | 199 | yes | export function journalDigest(journal) { |
| failedAtCurrentBytes | function | 205 | yes | export function failedAtCurrentBytes(journal, plan) { |
| out | const | 206 | no | const out = []; |
| entry | const | 208 | no | const entry = journal?.entries?.[fixture.relPath]; |
| plainObject | function | 217 | no | function plainObject(value) { |
| sortKeys | function | 221 | no | function sortKeys(value) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 24 | external |
| node:path | import | 25 | external |
| ../util.mjs | import | 26 | [hq/lib/util.mjs](../util.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/aii/state.mjs — durable run journal for the AII verifier.
//
// Why this exists: the previous runner persisted a bare `invalidated: [ids]`
// list in hq/aii/last-run.json. That list was task-keyed, so a failure in a
// superseded duplicate fixture invalidated the canonical one indefinitely, and
// it could not say which fixture bytes failed, when, or why. It also had to be
// mutated on every run, which made `--summary` depend on a write.
//
// The journal is per-fixture-file evidence, not per-scenario state:
//
//   entries[relPath] = { id, sha, status, at, durationMs, problem, findings }
//
// A journal entry describes one attempt against ONE set of fixture bytes. It
// only affects coverage when its `sha` still equals the file on disk
// (see receipts-policy.applyJournalPolicy). That is what lets a fresh failure
// demote an old pass without letting an old failure poison a rewritten fixture.
//
// `durations[relPath].ewmaMs` feeds the cost estimate in plan.mjs so the ETA
// learns from real runs instead of relying on the static command table.
//
// The legacy file hq/aii/last-run.json is READ ONCE for migration and never
// written, rewritten, or deleted by this module.

import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { canonicalJson, nowISO, safeJsonParse, sha256 } from '../util.mjs';

export const AII_JOURNAL_SCHEMA = 'hq.aii-run-journal/1';
export const AII_LEGACY_STATE_SCHEMA = 'hq.aii-last-run/1';

export const JOURNAL_STATUSES = [
  'pass',        // expectations matched
  'fail',        // ran, but at least one expectation was unmatched
  'timeout',     // exceeded the per-fixture wall clock
  'load',        // module import threw
  'id-mismatch', // fixture id disagrees with its filename
  'invalid',     // defineFixture rejected the contract
  'mutating-probe', // a probe tried a write-shaped command and was refused
  'budget-exhausted', // never started: run budget spent
  'skipped',     // never started: quarantined or filtered out
];

const EWMA_ALPHA = 0.35;

export function journalPath(root) {
  return join(root, 'hq', 'aii', 'run-journal.json');
}

export function legacyStatePath(root) {
  return join(root, 'hq', 'aii', 'last-run.json');
}

export function emptyJournal() {
  return {
    schema: AII_JOURNAL_SCHEMA,
    updatedAt: null,
    entries: {},
    durations: {},
    legacyFailures: {},
    lastRun: null,
  };
}

/**
 * loadJournal — tolerant read. A corrupt journal degrades to an empty one and
 * records the reason under `errors`; it never throws, because a damaged state
 * file must not be able to block verification of the fixtures themselves.
 */
export function loadJournal(rootOrPath) {
  const path = rootOrPath.endsWith('.json') ? rootOrPath : journalPath(rootOrPath);
  if (!existsSync(path)) return { ...emptyJournal(), source: path, exists: false, errors: [] };
  const parsed = safeJsonParse(readFileSync(path, 'utf8'), null);
  if (!parsed || typeof parsed !== 'object') {
    return { ...emptyJournal(), source: path, exists: true, errors: [`unparseable journal at ${path}`] };
  }
  const errors = [];
  if (parsed.schema && parsed.schema !== AII_JOURNAL_SCHEMA) errors.push(`journal schema ${parsed.schema} is not ${AII_JOURNAL_SCHEMA}`);
  return {
    schema: AII_JOURNAL_SCHEMA,
    updatedAt: parsed.updatedAt ?? null,
```

_First 80 of 224 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
