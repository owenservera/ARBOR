# File: hq/test/semantic-optimizers.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/semantic-optimizers.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11981 B |
| Lines | 210 |
| Hash | f6be9a29b1ac |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| index | const | 19 | no | const index = buildAliasIndex([{ alias: &#39; ＰRIVACY &#39;, target: &#39;config@1&#39; }, { alias: &#39;privacy&#39;, target: &#39;config@1&#39; }]); |
| a | const | 23 | no | const a = [{ alias: &#39;x&#39;, target: &#39;b&#39; }, { alias: &#39;x&#39;, target: &#39;a&#39; }]; |
| index | const | 28 | no | const index = buildAliasIndex([{ alias: &#39;send&#39;, target: &#39;message@1&#39; }, { alias: &#39;send&#39;, target: &#39;mail@1&#39; }]); |
| index | const | 34 | no | const index = buildAliasIndex([{ alias: &#39;view&#39;, target: &#39;view@1&#39; }, { alias: &#39;view settings&#39;, target: &#39;view.settings@1&#39; }]); |
| index | const | 40 | no | const index = buildAliasIndex([{ alias: &#39;x&#39;, target: &#39;a&#39; }, { alias: &#39;x&#39;, target: &#39;b&#39; }]); |
| result | const | 41 | no | const result = resolveAlias(index, &#39;x&#39;, { limit: 1 }); |
| out | const | 51 | no | const out = rankEvidence([{ id: &#39;safe&#39;, relevance: 20, quality: -3, freshness: 1 }, { id: &#39;hidden&#39;, secret: true, relevance: 1 }, { id: &#39;env&#39;, path: &#39;C:\\\\app\\\\.env&#39;, relevance: 1 }], { limit: 1 }); |
| result | const | 57 | no | const result = rankEvidence([{ id: &#39;x&#39;, relevance: 1, authority: &#39;project_observed&#39; }])[0]; |
| out | const | 62 | no | const out = packContext([{ id: &#39;a&#39;, tokens: 5, relevance: 1, topics: [&#39;privacy&#39;] }, { id: &#39;b&#39;, tokens: 8, relevance: 1, topics: [&#39;mobile&#39;] }], { budget: 10 }); |
| a | const | 72 | no | const a = [{ id: &#39;b&#39;, tokens: 4, relevance: 1 }, { id: &#39;a&#39;, tokens: 4, relevance: 1 }]; |
| out | const | 77 | no | const out = reconcileClaims([{ subject: &#39;s&#39;, value: { a: 1, b: 2 }, id: &#39;a&#39;, source: &#39;one&#39; }, { subject: &#39;s&#39;, value: { b: 2, a: 1 }, id: &#39;b&#39;, source: &#39;two&#39; }]); |
| out | const | 83 | no | const out = reconcileClaims([{ subject: &#39;status&#39;, value: &#39;on&#39; }, { subject: &#39;status&#39;, value: &#39;off&#39; }]); |
| graph | const | 92 | no | const graph = [{ from: &#39;ui&#39;, to: &#39;api&#39; }, { from: &#39;api&#39;, to: &#39;db&#39; }, { from: &#39;db&#39;, to: &#39;api&#39; }]; |
| out | const | 93 | no | const out = traceImpact(graph, [&#39;db&#39;]); |
| out | const | 97 | no | const out = traceImpact([{ from: &#39;b&#39;, to: &#39;a&#39; }, { from: &#39;c&#39;, to: &#39;b&#39; }], [&#39;a&#39;], { maxNodes: 2 }); |
| out | const | 112 | no | const out = allocateTasks([{ id: &#39;a&#39;, repository: &#39;hq&#39;, requires: [&#39;test&#39;] }, { id: &#39;b&#39;, repository: &#39;hq&#39;, requires: [&#39;test&#39;] }], [{ id: &#39;agent&#39;, repositories: [&#39;hq&#39;], capabilities: [&#39;test&#39;], capacit… |
| tasks | const | 119 | no | const tasks = [{ id: &#39;a&#39;, repository: &#39;hq&#39; }, { id: &#39;b&#39;, repository: &#39;hq&#39;, dependsOn: [&#39;x&#39;] }]; |
| agents | const | 120 | no | const agents = [{ id: &#39;agent&#39;, repositories: [&#39;hq&#39;], capabilities: [], capacity: 5 }]; |
| out | const | 121 | no | const out = allocateTasks(tasks, agents, { claimed: [&#39;a&#39;] }); |
| agents | const | 125 | no | const agents = [{ id: &#39;z&#39;, repositories: [&#39;*&#39;], capabilities: [], capacity: 1 }, { id: &#39;a&#39;, repositories: [&#39;*&#39;], capabilities: [], capacity: 1 }]; |
| tasks | const | 126 | no | const tasks = [{ id: &#39;low&#39;, priority: 0, repository: &#39;hq&#39; }, { id: &#39;high&#39;, priority: 5, repository: &#39;hq&#39; }]; |
| out | const | 127 | no | const out = allocateTasks(tasks, agents); |
| e | const | 135 | no | const e = { kind: &#39;file.observed&#39;, project: &#39;hq&#39;, subject: &#39;a&#39;, coalescible: true }; |
| out | const | 136 | no | const out = coalesceObservations([{ ...e, revision: 1 }, { ...e, revision: 3 }, { ...e, revision: 2 }]); |
| e | const | 141 | no | const e = { kind: &#39;file.observed&#39;, project: &#39;hq&#39;, subject: &#39;a&#39;, coalescible: true }; |
| receipt | const | 142 | no | const receipt = { kind: &#39;receipt&#39;, id: &#39;r&#39;, requiresAck: true }; |
| out | const | 143 | no | const out = coalesceObservations([{ ...e, revision: 1 }, receipt, { ...e, revision: 2 }]); |
| out | const | 148 | no | const out = coalesceObservations([{ kind: &#39;receipt&#39; }, { kind: &#39;receipt&#39; }], { maxEvents: 1 }); |
| out | const | 154 | no | const out = detectDrift([{ id: &#39;x&#39;, expectedDigest: &#39;a&#39;, actualDigest: &#39;b&#39;, expectedVersion: &#39;1&#39;, actualVersion: &#39;2&#39; }, { id: &#39;y&#39;, exists: false, expectedDigest: &#39;a&#39;, actualDigest: &#39;a&#39; }]); |
| out | const | 168 | no | const out = allocateTasks([{ id: &#39;x&#39;, repository: &#39;hq&#39;, dependsOn: &#39;unexpected&#39; }], [{ id: &#39;agent&#39;, repositories: [&#39;hq&#39;], capabilities: [] }]); |
| e | const | 173 | no | const e = { kind: &#39;file.observed&#39;, project: &#39;hq&#39;, subject: &#39;a&#39; }; |
| out | const | 174 | no | const out = coalesceObservations([{ ...e, revision: 1 }, { ...e, revision: 2 }]); |
| a | const | 180 | no | const a = [ |
| forward | const | 184 | no | const forward = packContext(a, { budget: 100, maxItems: 5 }); |
| reverse | const | 185 | no | const reverse = packContext([...a].reverse(), { budget: 100, maxItems: 5 }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 8 | external |
| node:assert/strict | import | 9 | external |
| ../lib/semantic-optimizers.mjs | import | 10 | [hq/lib/semantic-optimizers.mjs](../lib/semantic-optimizers.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Conformance tests for the ten pure semantic optimizer functions. |
| 3 | owner | hq | — | hq |
| 4 | task | — | — | semantic-kernel-optimizers-v1 |
| 5 | invariant | — | — | No real workspaces, browser drivers, DB writes, or user data. |
| 6 | see | — | hq/lib/semantic-optimizers.mjs | hq/lib/semantic-optimizers.mjs |

## Excerpt

```javascript
/**
 * @hq:context Conformance tests for the ten pure semantic optimizer functions.
 * @hq:owner hq
 * @hq:task semantic-kernel-optimizers-v1
 * @hq:invariant No real workspaces, browser drivers, DB writes, or user data.
 * @hq:see hq/lib/semantic-optimizers.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SEMANTIC_OPTIMIZERS_SCHEMA, buildAliasIndex, resolveAlias, rankEvidence,
  packContext, reconcileClaims, traceImpact, orderActionPlan, allocateTasks,
  coalesceObservations, detectDrift,
} from '../lib/semantic-optimizers.mjs';

test('schema is explicitly versioned', () => assert.equal(SEMANTIC_OPTIMIZERS_SCHEMA, 'hq.semantic-optimizers/1'));

test('A01 alias indexing canonicalizes Unicode, whitespace and case', () => {
  const index = buildAliasIndex([{ alias: '  ＰRIVACY  ', target: 'config@1' }, { alias: 'privacy', target: 'config@1' }]);
  assert.deepEqual(index.rows, [{ alias: 'privacy', targets: ['config@1'] }]);
});
test('A01 index is input-order invariant and preserves colliding targets', () => {
  const a = [{ alias: 'x', target: 'b' }, { alias: 'x', target: 'a' }];
  assert.deepEqual(buildAliasIndex(a), buildAliasIndex(a.reverse()));
  assert.deepEqual(buildAliasIndex(a).rows[0].targets, ['a', 'b']);
});
test('A02 ambiguity cannot resolve itself or confer approval', () => {
  const index = buildAliasIndex([{ alias: 'send', target: 'message@1' }, { alias: 'send', target: 'mail@1' }]);
  assert.equal(resolveAlias(index, 'send').status, 'ambiguous');
  assert.deepEqual(resolveAlias(index, 'send').targets, ['mail@1', 'message@1']);
  assert.equal(resolveAlias(index, 'unseen').status, 'not_found');
});
test('A02 exact match outranks prefix suggestions; prefix without exact is explicit', () => {
  const index = buildAliasIndex([{ alias: 'view', target: 'view@1' }, { alias: 'view settings', target: 'view.settings@1' }]);
  assert.deepEqual(resolveAlias(index, 'view', { prefix: true }).targets, ['view@1']);
  assert.deepEqual(resolveAlias(index, 'view s', { prefix: true }).targets, ['view.settings@1']);
  assert.equal(resolveAlias(index, '', { prefix: true }).status, 'invalid');
});
test('A02 output cap never changes ambiguity status', () => {
  const index = buildAliasIndex([{ alias: 'x', target: 'a' }, { alias: 'x', target: 'b' }]);
  const result = resolveAlias(index, 'x', { limit: 1 });
  assert.equal(result.status, 'ambiguous');
  assert.equal(result.truncated, true);
  assert.equal(result.targets.length, 1);
});

test('A03 evidence ranking is deterministic with ID ties', () => {
  assert.deepEqual(rankEvidence([{ id: 'b', relevance: 1 }, { id: 'a', relevance: 1 }]).map((v) => v.id), ['a', 'b']);
});
test('A03 excludes secret evidence and bounds score/limit', () => {
  const out = rankEvidence([{ id: 'safe', relevance: 20, quality: -3, freshness: 1 }, { id: 'hidden', secret: true, relevance: 1 }, { id: 'env', path: 'C:\\app\\.env', relevance: 1 }], { limit: 1 });
  assert.deepEqual(out.map((v) => v.id), ['safe']);
  assert.equal(out[0].score, 700);
  assert.equal(out[0].authority, 'unverified');
});
test('A03 preserves source authority label, never mints one', () => {
  const result = rankEvidence([{ id: 'x', relevance: 1, authority: 'project_observed' }])[0];
  assert.equal(result.authority, 'project_observed');
});

test('A04 context packing respects token budget and coverage', () => {
  const out = packContext([{ id: 'a', tokens: 5, relevance: 1, topics: ['privacy'] }, { id: 'b', tokens: 8, relevance: 1, topics: ['mobile'] }], { budget: 10 });
  assert.equal(out.selected.length, 1);
  assert.equal(out.tokens, 5);
  assert.deepEqual(out.topics, ['privacy']);
});
test('A04 refuses unsafe or malformed candidates and handles zero budget', () => {
  assert.deepEqual(packContext([{ id: 'secret', secret: true, tokens: 1, relevance: 1 }, { id: 'zero', tokens: 0, relevance: 1 }], { budget: 10 }).selected, []);
  assert.equal(packContext([{ id: 'x', tokens: 1, relevance: 1 }], { budget: 0 }).tokens, 0);
});
test('A04 selection is stable under candidate reordering', () => {
  const a = [{ id: 'b', tokens: 4, relevance: 1 }, { id: 'a', tokens: 4, relevance: 1 }];
  assert.deepEqual(packContext(a), packContext([...a].reverse()));
});

test('A05 claim reconciliation merges identical structured values', () => {
  const out = reconcileClaims([{ subject: 's', value: { a: 1, b: 2 }, id: 'a', source: 'one' },
    { subject: 's', value: { b: 2, a: 1 }, id: 'b', source: 'two' }]);
  assert.equal(out[0].contradicted, false);
  assert.deepEqual(out[0].alternatives[0].claimIds, ['a', 'b']);
```

_First 80 of 211 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
