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
});
test('A05 contradictory evidence survives reconciliation', () => {
  const out = reconcileClaims([{ subject: 'status', value: 'on' }, { subject: 'status', value: 'off' }]);
  assert.equal(out[0].contradicted, true);
  assert.equal(out[0].alternatives.length, 2);
});
test('A05 restricted claims excluded from projection', () => {
  assert.deepEqual(reconcileClaims([{ subject: 's', value: 'secret', sensitivity: 'restricted' }]), []);
});

test('A06 reverse impact traversal handles cycles and deterministically sorts', () => {
  const graph = [{ from: 'ui', to: 'api' }, { from: 'api', to: 'db' }, { from: 'db', to: 'api' }];
  const out = traceImpact(graph, ['db']);
  assert.deepEqual(out.nodes, [{ id: 'db', depth: 0 }, { id: 'api', depth: 1 }, { id: 'ui', depth: 2 }]);
});
test('A06 impact bounded by maxNodes', () => {
  const out = traceImpact([{ from: 'b', to: 'a' }, { from: 'c', to: 'b' }], ['a'], { maxNodes: 2 });
  assert.equal(out.nodes.length, 2);
  assert.equal(out.truncated, true);
});

test('A07 topological sort chooses lexicographic ready actions', () => {
  assert.deepEqual(orderActionPlan([{ id: 'b', dependsOn: ['a'] }, { id: 'c' }, { id: 'a' }]).order, ['a', 'b', 'c']);
});
test('A07 rejects cycles, missing dependencies and duplicate IDs', () => {
  assert.equal(orderActionPlan([{ id: 'a', dependsOn: ['b'] }, { id: 'b', dependsOn: ['a'] }]).status, 'blocked');
  assert.deepEqual(orderActionPlan([{ id: 'a', dependsOn: ['missing'] }]).missing, ['missing']);
  assert.equal(orderActionPlan([{ id: 'a' }, { id: 'a' }]).status, 'invalid');
});

test('A08 allocation honors repository, capability and capacity', () => {
  const out = allocateTasks([{ id: 'a', repository: 'hq', requires: ['test'] }, { id: 'b', repository: 'hq', requires: ['test'] }],
    [{ id: 'agent', repositories: ['hq'], capabilities: ['test'], capacity: 1 }]);
  assert.equal(out.assignments.length, 1);
  assert.equal(out.unassigned[0].reason, 'no_eligible_agent');
  assert.equal(out.assignments[0].status, 'proposal_only');
});
test('A08 claimed tasks and unresolved dependencies cannot be assigned', () => {
  const tasks = [{ id: 'a', repository: 'hq' }, { id: 'b', repository: 'hq', dependsOn: ['x'] }];
  const agents = [{ id: 'agent', repositories: ['hq'], capabilities: [], capacity: 5 }];
  const out = allocateTasks(tasks, agents, { claimed: ['a'] });
  assert.deepEqual(out.unassigned.map((v) => v.reason), ['claimed', 'dependencies']);
});
test('A08 agent selection and task priority are deterministic', () => {
  const agents = [{ id: 'z', repositories: ['*'], capabilities: [], capacity: 1 }, { id: 'a', repositories: ['*'], capabilities: [], capacity: 1 }];
  const tasks = [{ id: 'low', priority: 0, repository: 'hq' }, { id: 'high', priority: 5, repository: 'hq' }];
  const out = allocateTasks(tasks, agents);
  assert.deepEqual(out.assignments, [
    { taskId: 'high', agentId: 'a', status: 'proposal_only' },
    { taskId: 'low', agentId: 'z', status: 'proposal_only' },
  ]);
});

test('A09 coalesces observations to the newest revision', () => {
  const e = { kind: 'file.observed', project: 'hq', subject: 'a', coalescible: true };
  const out = coalesceObservations([{ ...e, revision: 1 }, { ...e, revision: 3 }, { ...e, revision: 2 }]);
  assert.equal(out.collapsed, 2);
  assert.deepEqual(out.events.map((v) => v.revision), [3]);
});
test('A09 approvals and receipts are barriers and never compacted', () => {
  const e = { kind: 'file.observed', project: 'hq', subject: 'a', coalescible: true };
  const receipt = { kind: 'receipt', id: 'r', requiresAck: true };
  const out = coalesceObservations([{ ...e, revision: 1 }, receipt, { ...e, revision: 2 }]);
  assert.deepEqual(out.events, [{ ...e, revision: 1 }, receipt, { ...e, revision: 2 }]);
  assert.equal(out.collapsed, 0);
});
test('A09 oversized input blocks instead of dropping critical events', () => {
  const out = coalesceObservations([{ kind: 'receipt' }, { kind: 'receipt' }], { maxEvents: 1 });
  assert.equal(out.status, 'blocked');
  assert.equal(out.reason, 'input_limit');
});

test('A10 drift detects changes, missing sources and version mismatches', () => {
  const out = detectDrift([{ id: 'x', expectedDigest: 'a', actualDigest: 'b', expectedVersion: '1', actualVersion: '2' },
    { id: 'y', exists: false, expectedDigest: 'a', actualDigest: 'a' }]);
  assert.deepEqual(out[0].reasons, ['content_changed', 'version_changed']);
  assert.deepEqual(out[1].reasons, ['missing_source']);
});
test('A10 exact source contract identity is current', () => {
  assert.deepEqual(detectDrift([{ id: 'x', expectedDigest: 'abc', actualDigest: 'abc', expectedVersion: '1', actualVersion: '1' }]),
    [{ id: 'x', status: 'current', reasons: [] }]);
});

test('A06 zero maxNodes never emits nodes', () => {
  assert.deepEqual(traceImpact([], ['a'], { maxNodes: 0 }), { nodes: [], truncated: true });
});
test('A08 malformed dependencies cannot crash allocation', () => {
  const out = allocateTasks([{ id: 'x', repository: 'hq', dependsOn: 'unexpected' }],
    [{ id: 'agent', repositories: ['hq'], capabilities: [] }]);
  assert.equal(out.assignments.length, 1);
});
test('A09 non-opt-in observations are never coalesced', () => {
  const e = { kind: 'file.observed', project: 'hq', subject: 'a' };
  const out = coalesceObservations([{ ...e, revision: 1 }, { ...e, revision: 2 }]);
  assert.equal(out.collapsed, 0);
  assert.equal(out.events.length, 2);
});

test('A04 selection is invariant when candidate ids collide', () => {
  const a = [
    { id: 'a', tokens: 8, relevance: 1, topics: [] },
    { id: 'a', tokens: 4, relevance: 0.5, topics: [] },
  ];
  const forward = packContext(a, { budget: 100, maxItems: 5 });
  const reverse = packContext([...a].reverse(), { budget: 100, maxItems: 5 });
  assert.deepEqual(forward, reverse);
});

test('redaction refuses every secret path the HQ rule refuses', () => {
  for (const path of ['.env', '.env.local', '.envrc', 'config.env', 'app.keystore',
    'session.json', 'storage-state.json', 'release-profile.json', 'cookies', 'Login Data']) {
    assert.deepEqual(rankEvidence([{ id: 'x', path, relevance: 1 }]), [], `${path} leaked into ranking`);
    assert.deepEqual(packContext([{ id: 'x', path, tokens: 1, relevance: 1 }]).selected, [], `${path} leaked into packing`);
  }
  assert.deepEqual(rankEvidence([{ id: 'x', path: 'src/app.mjs', relevance: 1 }]).length, 1);
});

test('malformed index rows and null inputs never throw', () => {
  assert.equal(resolveAlias({ rows: [null, {}, { targets: ['a'] }] }, 'x', { prefix: true }).status, 'not_found');
  assert.equal(resolveAlias(null, 'x', { prefix: true }).status, 'not_found');
  assert.deepEqual(buildAliasIndex(null).rows, []);
  assert.deepEqual(rankEvidence(null), []);
  assert.deepEqual(packContext(null).selected, []);
  assert.deepEqual(reconcileClaims(null), []);
  assert.deepEqual(traceImpact(null, null).nodes, []);
  assert.deepEqual(orderActionPlan(null), orderActionPlan([]));
  assert.deepEqual(allocateTasks(null, null).assignments, []);
  assert.equal(coalesceObservations(null).status, 'ok');
  assert.deepEqual(detectDrift(null), []);
});
