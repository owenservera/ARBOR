# File: hq/lib/util.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/util.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4246 B |
| Lines | 144 |
| Hash | f6a93a7b6ca7 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| nowISO | function | 5 | yes | export const nowISO = () =&gt; new Date().toISOString(); |
| sha256 | function | 7 | yes | export function sha256(value) { |
| sha256File | function | 11 | yes | export function sha256File(path) { |
| canonical | function | 16 | yes | export function canonical(value) { |
| out | const | 19 | no | const out = {}; |
| canonicalJson | function | 26 | yes | export function canonicalJson(value) { |
| digestOf | function | 30 | yes | export function digestOf(value) { |
| tokenize | function | 36 | yes | export function tokenize(text) { |
| raw | const | 37 | no | const raw = String(text ?? &#39;&#39;).toLowerCase().match(/[\\p{L}\\p{N}_$.-]{2,}/gu) ?? []; |
| estimateTokens | function | 42 | yes | export function estimateTokens(text) { |
| s | const | 43 | no | const s = String(text ?? &#39;&#39;); |
| clamp | function | 48 | yes | export function clamp(n, lo, hi) { |
| toPosix | function | 52 | yes | export function toPosix(p) { |
| globToRegExp | function | 57 | yes | export function globToRegExp(glob) { |
| g | variable | 58 | no | let g = toPosix(glob); |
| re | variable | 59 | no | let re = &#39;&#39;; |
| c | const | 61 | no | const c = g[i]; |
| parts | const | 73 | no | const parts = g.slice(i + 1, end).split(&#39;,&#39;); |
| matchesAny | function | 90 | yes | export function matchesAny(path, globs) { |
| p | const | 92 | no | const p = toPosix(path); |
| formatBytes | function | 99 | yes | export function formatBytes(n) { |
| formatNumber | function | 107 | yes | export function formatNumber(n) { |
| truncate | function | 111 | yes | export function truncate(s, n) { |
| str | const | 112 | no | const str = String(s ?? &#39;&#39;); |
| uniqueBy | function | 116 | yes | export function uniqueBy(arr, fn) { |
| seen | const | 117 | no | const seen = new Set(); |
| out | const | 118 | no | const out = []; |
| key | const | 120 | no | const key = fn(item); |
| groupBy | function | 128 | yes | export function groupBy(arr, fn) { |
| out | const | 129 | no | const out = {}; |
| key | const | 131 | no | const key = fn(item); |
| safeJsonParse | function | 138 | yes | export function safeJsonParse(text, fallback = null) { |
| uniqueSorted | function | 142 | yes | export function uniqueSorted(values) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |
| node:fs | import | 3 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-080-consolidation-sequence.mjs](../aii/fixtures/HQ-080-consolidation-sequence.mjs.md) | ../../lib/util.mjs |
| [hq/aii/fixtures/HQ-096-challenge-conclusions.mjs](../aii/fixtures/HQ-096-challenge-conclusions.mjs.md) | ../../lib/util.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/util.mjs |
| [hq/lib/aii/plan.mjs](./aii/plan.mjs.md) | ../util.mjs |
| [hq/lib/aii/receipts-policy.mjs](./aii/receipts-policy.mjs.md) | ../util.mjs |
| [hq/lib/aii/state.mjs](./aii/state.mjs.md) | ../util.mjs |
| [hq/lib/aii/views.mjs](./aii/views.mjs.md) | ../util.mjs |
| [hq/lib/approvals.mjs](./approvals.mjs.md) | ./util.mjs |
| [hq/lib/arbor-service.mjs](./arbor-service.mjs.md) | ./util.mjs |
| [hq/lib/ask.mjs](./ask.mjs.md) | ./util.mjs |
| [hq/lib/automation.mjs](./automation.mjs.md) | ./util.mjs |
| [hq/lib/canon.mjs](./canon.mjs.md) | ./util.mjs |
| [hq/lib/capabilities.mjs](./capabilities.mjs.md) | ./util.mjs |
| [hq/lib/channel-broker.mjs](./channel-broker.mjs.md) | ./util.mjs |
| [hq/lib/channel-seats.mjs](./channel-seats.mjs.md) | ./util.mjs |
| [hq/lib/components.mjs](./components.mjs.md) | ./util.mjs |
| [hq/lib/context.mjs](./context.mjs.md) | ./util.mjs |
| [hq/lib/filetypes.mjs](./filetypes.mjs.md) | ./util.mjs |
| [hq/lib/graph.mjs](./graph.mjs.md) | ./util.mjs |
| [hq/lib/indexer.mjs](./indexer.mjs.md) | ./util.mjs |
| [hq/lib/kb-bind.mjs](./kb-bind.mjs.md) | ./util.mjs |
| [hq/lib/kb-intake.mjs](./kb-intake.mjs.md) | ./util.mjs |
| [hq/lib/kb.mjs](./kb.mjs.md) | ./util.mjs |
| [hq/lib/kernel/store.mjs](./kernel/store.mjs.md) | ../util.mjs |
| [hq/lib/lake.mjs](./lake.mjs.md) | ./util.mjs |
| [hq/lib/lang.mjs](./lang.mjs.md) | ./util.mjs |
| [hq/lib/machine-probe.mjs](./machine-probe.mjs.md) | ./util.mjs |
| [hq/lib/memory.mjs](./memory.mjs.md) | ./util.mjs |
| [hq/lib/protocol.mjs](./protocol.mjs.md) | ./util.mjs |
| [hq/lib/realtime.mjs](./realtime.mjs.md) | ./util.mjs |
| [hq/lib/receipts.mjs](./receipts.mjs.md) | ./util.mjs |
| [hq/lib/refresh.mjs](./refresh.mjs.md) | ./util.mjs |
| [hq/lib/registry.mjs](./registry.mjs.md) | ./util.mjs |
| [hq/lib/revocations.mjs](./revocations.mjs.md) | ./util.mjs |
| [hq/lib/search.mjs](./search.mjs.md) | ./util.mjs |
| [hq/lib/seat-heartbeat.mjs](./seat-heartbeat.mjs.md) | ./util.mjs |
| [hq/lib/semantic-registry.mjs](./semantic-registry.mjs.md) | ./util.mjs |
| [hq/lib/sessions.mjs](./sessions.mjs.md) | ./util.mjs |
| [hq/lib/skills.mjs](./skills.mjs.md) | ./util.mjs |
| [hq/lib/task-lifecycle.mjs](./task-lifecycle.mjs.md) | ./util.mjs |
| [hq/lib/taxonomy.mjs](./taxonomy.mjs.md) | ./util.mjs |
| [hq/lib/telemetry.mjs](./telemetry.mjs.md) | ./util.mjs |
| [hq/lib/vivim.mjs](./vivim.mjs.md) | ./util.mjs |
| [hq/lib/walk.mjs](./walk.mjs.md) | ./util.mjs |
| [hq/lib/wiki-program.mjs](./wiki-program.mjs.md) | ./util.mjs |
| [hq/lib/wiki.mjs](./wiki.mjs.md) | ./util.mjs |
| [hq/test/context-ranking.test.mjs](../test/context-ranking.test.mjs.md) | ../lib/util.mjs |
| [hq/test/context.test.mjs](../test/context.test.mjs.md) | ../lib/util.mjs |
| [hq/test/foundation.test.mjs](../test/foundation.test.mjs.md) | ../lib/util.mjs |
| [hq/test/indexer.test.mjs](../test/indexer.test.mjs.md) | ../lib/util.mjs |
| [hq/test/semantic-packet.test.mjs](../test/semantic-packet.test.mjs.md) | ../lib/util.mjs |
| [hq/test/semantic-registry.test.mjs](../test/semantic-registry.test.mjs.md) | ../lib/util.mjs |
| [hq/test/semantic-source-context.test.mjs](../test/semantic-source-context.test.mjs.md) | ../lib/util.mjs |
| [hq/test/util.test.mjs](../test/util.test.mjs.md) | ../lib/util.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/util.mjs — deterministic primitives shared by every HQ module.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const nowISO = () => new Date().toISOString();

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

// canonical — recursively sort object keys so digests are stable across runs.
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = canonical(value[k]);
    return out;
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonical(value), null, 2) + '\n';
}

export function digestOf(value) {
  return sha256(canonicalJson(value));
}

// tokenize — lowercase word/number/identifier tokens, 2+ chars, deduped, sorted.
// Deterministic: the sorted order is part of the contract used by scoring.
export function tokenize(text) {
  const raw = String(text ?? '').toLowerCase().match(/[\p{L}\p{N}_$.-]{2,}/gu) ?? [];
  return [...new Set(raw)].sort();
}

// estimateTokens — deliberately conservative, tokenizer-free estimate.
export function estimateTokens(text) {
  const s = String(text ?? '');
  if (!s) return 0;
  return Math.max(1, Math.ceil(Buffer.byteLength(s, 'utf8') / 3));
}

export function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

export function toPosix(p) {
  return String(p ?? '').replace(/\\/g, '/');
}

// globToRegExp — supports **, *, ?, and {a,b} alternation.
export function globToRegExp(glob) {
  let g = toPosix(glob);
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') {
        i++;
        if (g[i + 1] === '/') { i++; re += '(?:.*/)?'; }
        else re += '.*';
      } else re += '[^/]*';
    } else if (c === '?') {
      re += '[^/]';
    } else if (c === '{') {
      const end = g.indexOf('}', i);
      if (end === -1) { re += '\\{'; continue; }
      const parts = g.slice(i + 1, end).split(',');
      re += '(?:' + parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')';
      i = end;
    } else if (c === '[') {
      const end = g.indexOf(']', i);
      if (end === -1) { re += '\\['; continue; }
      re += g.slice(i, end + 1);
      i = end;
```

_First 80 of 145 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
