# File: scripts/feedback-loop/compiler.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/feedback-loop/compiler.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14667 B |
| Lines | 258 |
| Hash | 5cdbfc6f2389 |
| Test | no |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCHEMA | const | 5 | yes | export const SCHEMA = &#39;arbor.feedback-work-order-suggestion/1&#39;; |
| MAX_INPUT_BYTES | const | 6 | yes | export const MAX_INPUT_BYTES = 256 * 1024; |
| MAX_RECORDS | const | 7 | yes | export const MAX_RECORDS = 2000; |
| MAX_TEXT | const | 8 | yes | export const MAX_TEXT = 240; |
| SHA | const | 9 | no | const SHA = /^[0-9a-f]{40}$/; |
| IDENTIFIER | const | 10 | no | const IDENTIFIER = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/; |
| CONTROL | const | 11 | no | const CONTROL = /[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]/; |
| INJECTION | const | 13 | no | const INJECTION = /(?:ignore\\s+(?:all\\s+)?(?:previous\|prior)\\s+instructions\|(?:system\|developer)\\s+(?:prompt\|instruction)\|(?:override\|bypass)\\s+(?:policy\|approval\|scope\|gate)\|(?:write\|edit\|delete\|mod… |
| FAILURE_CHECKS | const | 14 | no | const FAILURE_CHECKS = Object.freeze({ &#39;wiki-page-renders&#39;: Object.freeze({ evidenceItem: &#39;WIKI-BASELINE&#39;, sourcePath: &#39;scripts/batch-evidence/WIKI-BASELINE.mjs&#39;, roadmapItem: &#39;A00&#39;, |
| reject | function | 34 | no | function reject(code, msg) { const err = new Error(msg); err.code = code; throw err; } |
| sized | function | 35 | no | function sized(value, limit = MAX_INPUT_BYTES) { |
| boundedString | function | 38 | no | function boundedString(x, field, max = MAX_TEXT, allowEmpty = false) { |
| identity | function | 45 | no | function identity(x, field) { |
| sourceRef | function | 49 | no | function sourceRef(x, field) { |
| sortedObject | function | 56 | no | function sortedObject(x) { |
| stableDigest | function | 61 | yes | export function stableDigest(x) { |
| assertPinned | function | 65 | no | function assertPinned(pins) { |
| revision | const | 70 | no | const revision = identity(pins.revision, &#39;roadmap revision&#39;); |
| currentRevision | const | 71 | no | const currentRevision = identity(pins.currentRevision, &#39;current roadmap revision&#39;); |
| roadmapRecord | function | 75 | no | function roadmapRecord(roadmap, itemId) { |
| matches | const | 80 | no | const matches = roadmap.layers.L2.filter(x =&gt; x.id === itemId); |
| queueMatches | const | 81 | no | const queueMatches = roadmap.buildQueue.filter(x =&gt; x.itemId === itemId); |
| ownedBy | function | 90 | no | function ownedBy(item, rule) { |
| normalizeReceipt | function | 96 | no | function normalizeReceipt(wrapper) { |
| path | const | 99 | no | const path = sourceRef(wrapper.path, &#39;receipt path&#39;); |
| data | const | 104 | no | const data = wrapper.data; |
| item | const | 108 | no | const item = identity(data.item, &#39;receipt item&#39;); |
| normalizeJournal | function | 120 | no | function normalizeJournal(wrapper) { |
| path | const | 124 | no | const path = sourceRef(wrapper.path, &#39;journal path&#39;); |
| review | const | 129 | no | const review = []; |
| e | const | 131 | no | const e = wrapper.entries[i]; |
| round | const | 137 | no | const round = String(e.round ?? &#39;&#39;); |
| decision | const | 141 | no | const decision = v.decision ?? v.verdict; |
| itemId | const | 148 | no | const itemId = identity(v.itemId ?? v.id, &#39;verdict item&#39;); |
| unique | const | 156 | no | const unique = new Map(review.map(x =&gt; [x.evidenceId, x])); |
| compileFeedback | function | 160 | yes | export function compileFeedback({ roadmap, pins, receipts = [], journals = [], condition = null }) { |
| sourcePin | const | 161 | no | const sourcePin = assertPinned(pins); |
| findings | const | 165 | no | const findings = new Map(); |
| review | const | 166 | no | const review = []; |
| r | const | 168 | no | const r = normalizeReceipt(wrapper); |
| rule | const | 170 | no | const rule = FAILURE_CHECKS[c.name]; |
| item | const | 176 | no | const item = roadmapRecord(roadmap, rule.roadmapItem); |
| key | const | 182 | no | const key = rule.sourcePath + &#39;#&#39; + c.name; |
| provenance | const | 184 | no | const provenance = { ...r.ref, check: c.name, detailDigest: stableDigest(c.detail) }; |
| refKey | const | 185 | no | const refKey = [provenance.path, provenance.receiptDigest, provenance.evidenceId, provenance.check].join(&#39;:&#39;); |
| sortedFindings | const | 190 | no | const sortedFindings = [...findings.entries()].sort((a,b) =&gt; a[0].localeCompare(b[0])); |
| selected | const | 191 | no | const selected = sortedFindings[0] \|\| null; |
| candidate | variable | 192 | no | let candidate = null; |
| evidenceRefs | const | 195 | no | const evidenceRefs = [...refs.values()].sort((a,b)=&gt;JSON.stringify(a).localeCompare(JSON.stringify(b))); |
| identityDigest | const | 196 | no | const identityDigest = stableDigest({ canonicalCondition, sourcePin }); |
| reviewDedup | const | 226 | no | const reviewDedup = new Map(review.map(x =&gt; [stableDigest(x), x])); |
| result | const | 227 | no | const result = { |
| summary | function | 244 | yes | export function summary(result) { |
| c | const | 245 | no | const c = result.candidate; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 3 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [scripts/feedback-loop/a03-verify.test.mjs](./a03-verify.test.mjs.md) | ./compiler.mjs |
| [scripts/feedback-loop/compile.mjs](./compile.mjs.md) | ./compiler.mjs |
| [scripts/feedback-loop/compiler.test.mjs](./compiler.test.mjs.md) | ./compiler.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// ARBOR A03 preparatory source-only feedback compiler.
// This module has no filesystem, network, subprocess or Host effects.
import { createHash } from 'node:crypto';

export const SCHEMA = 'arbor.feedback-work-order-suggestion/1';
export const MAX_INPUT_BYTES = 256 * 1024;
export const MAX_RECORDS = 2000;
export const MAX_TEXT = 240;
const SHA = /^[0-9a-f]{40}$/;
const IDENTIFIER = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
// Free-text from viewers/verifiers is untrusted and NEVER becomes an instruction.
const INJECTION = /(?:ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions|(?:system|developer)\s+(?:prompt|instruction)|(?:override|bypass)\s+(?:policy|approval|scope|gate)|(?:write|edit|delete|modify|update)\s+(?:the\s+)?(?:roadmap|\.github|main\b|scripts\/|docs\/|source\s+file|git\s+ref)|(?:sudo\s+|rm\s+-rf\b|curl\s+|wget\s+|chmod\s+|git\s+push\b)|\/api\/mutate\b)/i;
const FAILURE_CHECKS = Object.freeze({
  'wiki-page-renders': Object.freeze({
    evidenceItem: 'WIKI-BASELINE',
    sourcePath: 'scripts/batch-evidence/WIKI-BASELINE.mjs',
    roadmapItem: 'A00',
    acceptanceIndex: 0,
    reproduction: 'ARBOR_WIKI_EVIDENCE_ISOLATED=1 ARBOR_WIKI_EVIDENCE_BASE_URL=http://127.0.0.1:43187 bun scripts/batch-evidence/WIKI-BASELINE.mjs --live',
    condition: 'Wiki proof must separate API/source assertions from an executed browser DOM check; no static-HTML false green.'
  }),
  'wiki-edit-journal-record': Object.freeze({
    evidenceItem: 'WIKI-BASELINE',
    sourcePath: 'scripts/batch-evidence/WIKI-BASELINE.mjs',
    roadmapItem: 'A00',
    acceptanceIndex: 1,
    reproduction: 'ARBOR_WIKI_EVIDENCE_ISOLATED=1 ARBOR_WIKI_EVIDENCE_BASE_URL=http://127.0.0.1:43187 bun scripts/batch-evidence/WIKI-BASELINE.mjs --live',
    condition: 'Journal proof must parse /api/journal response as JSON array and compare the typed nested edit, not assume JSONL or a verbatim echo.'
  })
});

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function reject(code, msg) { const err = new Error(msg); err.code = code; throw err; }
function sized(value, limit = MAX_INPUT_BYTES) {
  if (Buffer.byteLength(JSON.stringify(value)) > limit) reject('OVERSIZED_INPUT', 'Input exceeds permitted size');
}
function boundedString(x, field, max = MAX_TEXT, allowEmpty = false) {
  if (typeof x !== 'string' || x.length > max || (!allowEmpty && !x.trim()) || CONTROL.test(x)) {
    reject('MALFORMED_INPUT', 'Invalid ' + field);
  }
  if (INJECTION.test(x)) reject('INSTRUCTION_INJECTION', 'Instruction-like content rejected in ' + field);
  return x.trim();
}
function identity(x, field) {
  if (typeof x !== 'string' || !IDENTIFIER.test(x)) reject('MALFORMED_INPUT', 'Invalid ' + field);
  return x;
}
function sourceRef(x, field) {
  if (typeof x !== 'string' || x.length > 200 || x.startsWith('/') || x.includes('\\') ||
      x.split('/').some(p => !p || p === '.' || p === '..') || CONTROL.test(x)) {
    reject('UNTRUSTED_PATH', 'Invalid ' + field);
  }
  return x;
}
function sortedObject(x) {
  if (Array.isArray(x)) return x.map(sortedObject);
  if (!record(x)) return x;
  return Object.fromEntries(Object.keys(x).sort().map(k => [k, sortedObject(x[k])]));
}
export function stableDigest(x) {
  return createHash('sha256').update(JSON.stringify(sortedObject(x))).digest('hex');
}

function assertPinned(pins) {
  if (!record(pins) || typeof pins.sourceSha !== 'string' || !SHA.test(pins.sourceSha) ||
      !SHA.test(pins.currentSha || '') || pins.sourceSha !== pins.currentSha) {
    reject('STALE_OR_MISSING_SHA', 'Exact pinned source SHA and current checkout SHA must match');
  }
  const revision = identity(pins.revision, 'roadmap revision');
  const currentRevision = identity(pins.currentRevision, 'current roadmap revision');
  if (revision !== currentRevision) reject('STALE_REVISION', 'Roadmap revision changed since evidence pin');
  return { repository: 'owenservera/ARBOR', sourceSha: pins.sourceSha, roadmapRevision: revision };
}
function roadmapRecord(roadmap, itemId) {
  if (!record(roadmap) || roadmap.schema !== 'arbor.product-roadmap/1' ||
      !Array.isArray(roadmap.layers?.L2) || !Array.isArray(roadmap.buildQueue)) {
    reject('MALFORMED_ROADMAP', 'Canonical roadmap projection required');
  }
  const matches = roadmap.layers.L2.filter(x => x.id === itemId);
```

_First 80 of 259 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
