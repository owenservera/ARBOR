# File: packages/tierflow/tests/visual-runtime/wave3-f-knowledge.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/wave3-f-knowledge.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 16147 B |
| Lines | 303 |
| Hash | a789da2cf7dc |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 9 | no | const NOW = Date.parse(&#39;2026-11-06T17:00:00.000Z&#39;); |
| ID | const | 10 | no | const ID = { alpha: &#39;kn_8f3a0c71&#39;, beta: &#39;kn_3c6f10ba&#39;, foreign: &#39;kn_8d2936aa&#39;, otherWorld: &#39;kn_7121ddac&#39;, |
| rows | function | 20 | no | const rows = (): CanonicalKnowledgeRecord[] =&gt; [ |
| trusted | function | 30 | no | const trusted = (overrides: Partial&lt;TrustedKnowledgeContext&gt; = {}): TrustedKnowledgeContext =&gt; ({ ownerRef: &#39;owner_a&#39;, sessionRef: &#39;session_1&#39;, deviceRef: &#39;desktop_1&#39;, personalWorldRef: &#39;world_a&#39;, su… |
| request | function | 35 | no | const request = (overrides: Partial&lt;KnowledgeQuery&gt; = {}): KnowledgeQuery =&gt; ({ schema: &#39;vivim.knowledge-query/1&#39;, requestId: &#39;request_1&#39;, personalWorldRef: &#39;world_a&#39;, surface: &#39;pc&#39;, purpose: &#39;task&#39;,… |
| setup | function | 39 | no | function setup(input = rows()) { |
| ctx | variable | 40 | no | let ctx: TrustedKnowledgeContext \| null = trusted(); |
| broker | const | 41 | no | const broker = { readContext: () =&gt; ctx }; |
| client | const | 42 | no | const client = createFixtureKnowledgeClient(input, broker, { now: () =&gt; NOW }); |
| feed | const | 43 | no | const feed = createScopedKnowledgeFeed(client, broker, { now: () =&gt; NOW }); |
| noPrivateData | function | 46 | no | function noPrivateData(value: unknown): void { |
| raw | const | 47 | no | const raw = JSON.stringify(value); |
| result | const | 55 | no | const result = await feed.poll(request()); |
| revision | variable | 70 | no | let revision = 3; |
| readOnlyVersionedClient | const | 71 | no | const readOnlyVersionedClient: KnowledgeClient = { |
| page | const | 73 | no | const page = await client.query(q); |
| feed | const | 80 | no | const feed = createScopedKnowledgeFeed(readOnlyVersionedClient, broker, { now: () =&gt; NOW }); |
| updated | const | 84 | no | const updated = await feed.poll(request()); |
| full | const | 88 | no | const full = await feed.resnapshot(request()); |
| result | const | 97 | no | const result = await feed.poll(request({ query: term })); |
| result | const | 110 | no | const result = await feed.poll(request()); |
| count | const | 123 | no | const count = client.fixtureMetrics().discoveryScans; |
| q | const | 138 | no | const q = request({ surface: &#39;android&#39;, query: &#39;Secret material&#39; }); |
| response | const | 139 | no | const response = await feed.poll(q); |
| output | const | 149 | no | const output = await feed.poll(request({ query: &#39;Forbidden source&#39; })); |
| result | const | 158 | no | const result = await feed.poll(request({ query: &#39;Old project evidence&#39; })); |
| output | const | 169 | no | const output = await feed.poll(request()); |
| pending | const | 184 | no | const pending = await feed.poll(request()); |
| next | const | 187 | no | const next = await feed.resnapshot(request()); |
| first | const | 223 | no | const first = await feed.poll(request({ limit: 1 })); |
| second | const | 225 | no | const second = await feed.poll(request({ limit: 1, cursor: first.nextCursor })); |
| replay | const | 227 | no | const replay = await feed.poll(request({ limit: 1, cursor: first.nextCursor })); |
| base | const | 234 | no | const base = await client.query(request()); |
| variations | const | 235 | no | const variations = [ |
| feed | const | 245 | no | const feed = createScopedKnowledgeFeed({ query: async () =&gt; result }, broker, { now: () =&gt; NOW }); |
| output | const | 246 | no | const output = await feed.poll(request()); |
| output | const | 257 | no | const output = await feed.poll(request({ entityRef: ID.alpha, query: undefined })); |
| card | const | 259 | no | const card = output.cards[0]!; |
| release | variable | 268 | no | let release!: () =&gt; void; |
| gate | const | 269 | no | const gate = new Promise&lt;void&gt;(resolve =&gt; { release = resolve; }); |
| feed | const | 270 | no | const feed = createScopedKnowledgeFeed({ query: async q =&gt; { await gate; return client.query(q); } }, broker, { now: () =&gt; NOW }); |
| pending | const | 271 | no | const pending = feed.poll(request()); |
| output | const | 274 | no | const output = await pending; |
| release | variable | 283 | no | let release!: () =&gt; void; |
| slow | const | 284 | no | const slow = new Promise&lt;void&gt;(r =&gt; { release = r; }); |
| call | variable | 285 | no | let call = 0; |
| feed | const | 286 | no | const feed = createScopedKnowledgeFeed({ query: async q =&gt; { if (++call === 1) await slow; return client.query(q); } }, broker, { now: () =&gt; NOW }); |
| old | const | 287 | no | const old = feed.poll(request()); |
| newest | const | 288 | no | const newest = await feed.poll(request()); |
| next | const | 299 | no | const next = await feed.poll(request()); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/knowledge/client.ts | import | 3 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](../../src/visual-runtime/knowledge/client.ts.md) |
| ../../src/visual-runtime/knowledge/wave3-feed-projection.ts | import | 7 | [packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts](../../src/visual-runtime/knowledge/wave3-feed-projection.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createFixtureKnowledgeClient, type CanonicalKnowledgeRecord, type KnowledgeClient,
  type KnowledgeQuery, type TrustedKnowledgeContext,
} from '../../src/visual-runtime/knowledge/client.ts';
import { createScopedKnowledgeFeed } from '../../src/visual-runtime/knowledge/wave3-feed-projection.ts';

const NOW = Date.parse('2026-11-06T17:00:00.000Z');
const ID = { alpha: 'kn_8f3a0c71', beta: 'kn_3c6f10ba', foreign: 'kn_8d2936aa', otherWorld: 'kn_7121ddac',
  restricted: 'kn_001277c0', redacted: 'kn_877efac4', stale: 'kn_9ae15b18', secret: 'kn_4ddad7b0' } as const;
const record = (stableId: string, title: string, opts: Partial<CanonicalKnowledgeRecord> = {}): CanonicalKnowledgeRecord => ({
  stableId, ownerRef: 'owner_a', personalWorldRef: 'world_a', projectRef: 'project_one', kind: 'project_note',
  label: title, summary: `Observed fixture note for ${title}`, path: 'src/README.md',
  availability: 'present', claimStatus: 'observed', sensitivity: 'S0',
  source: { authority: 'fixture.hq', nativeId: stableId, nativeVersion: 'rev-3', digest: `sha256:synthetic-${stableId}` },
  evidenceRefs: [`fixture-evidence:${stableId}`], provenance: ['synthetic.corpus/1'],
  asOf: '2026-11-06T12:00:00.000Z', ...opts,
});
const rows = (): CanonicalKnowledgeRecord[] => [
  record(ID.alpha, 'Shared project path'),
  record(ID.beta, 'Shared project path', { projectRef: 'project_two' }),
  record(ID.foreign, 'Foreign-only marker 9347', { ownerRef: 'owner_b' }),
  record(ID.otherWorld, 'Other-world-only marker 4871', { personalWorldRef: 'world_b' }),
  record(ID.restricted, 'Device-only project', { allowedDeviceRefs: ['desktop_1'] }),
  record(ID.redacted, 'Forbidden source existence', { availability: 'redacted' }),
  record(ID.stale, 'Old project evidence', { availability: 'stale' }),
  record(ID.secret, 'Secret material', { sensitivity: 'S3' }),
];
const trusted = (overrides: Partial<TrustedKnowledgeContext> = {}): TrustedKnowledgeContext => ({
  ownerRef: 'owner_a', sessionRef: 'session_1', deviceRef: 'desktop_1', personalWorldRef: 'world_a',
  surface: 'pc', allowedPurposes: ['task', 'explain', 'help'], allowPhoneS1: false, policyRevision: 'policy_1',
  sessionExpiresAt: NOW + 1_000_000, grantExpiresAt: NOW + 1_000_000, revoked: false, offline: false, ...overrides,
});
const request = (overrides: Partial<KnowledgeQuery> = {}): KnowledgeQuery => ({
  schema: 'vivim.knowledge-query/1', requestId: 'request_1', personalWorldRef: 'world_a',
  surface: 'pc', purpose: 'task', query: 'Shared project path', limit: 50, ...overrides,
});
function setup(input = rows()) {
  let ctx: TrustedKnowledgeContext | null = trusted();
  const broker = { readContext: () => ctx };
  const client = createFixtureKnowledgeClient(input, broker, { now: () => NOW });
  const feed = createScopedKnowledgeFeed(client, broker, { now: () => NOW });
  return { feed, client, broker, setContext: (next: TrustedKnowledgeContext | null) => { ctx = next; } };
}
function noPrivateData(value: unknown): void {
  const raw = JSON.stringify(value);
  for (const term of ['Foreign-only', 'Other-world-only', 'Forbidden source', ID.foreign, ID.otherWorld, ID.redacted, 'fixture-evidence:']) {
    assert.ok(!raw.includes(term), `denial/empty response leaked ${term}`);
  }
}

test('positive: scoped Founder Workspace cards retain exact IDs, source versions, evidence and no authority handles', async () => {
  const { feed } = setup();
  const result = await feed.poll(request());
  assert.equal(result.state, 'ready');
  assert.equal(result.reason, 'NONE');
  assert.deepEqual(result.cards.map(c => c.stableId).sort(), [ID.alpha, ID.beta].sort());
  assert.deepEqual(result.cards.map(c => c.projectRef).sort(), ['project_one', 'project_two']);
  assert.ok(result.cards.every(c => c.source.nativeVersion === 'rev-3' && c.source.authority === 'fixture.hq'));
  assert.ok(result.cards.every(c => c.source.digest && c.evidenceRefs.length === 1 && c.provenance[0] === 'synthetic.corpus/1' && c.asOf));
  assert.ok(result.cards.every(c => c.interactive === false && c.sensitivity === 'enforced-upstream-not-disclosed'));
  assert.ok(result.cards.every(c => !('execute' in c) && !('permission' in c) && !('actionRefs' in c)));
  assert.equal(result.changes.length, 2);
  assert.deepEqual((await feed.poll(request())).changes, []);
});

test('positive: source-backed changed notice produces a bounded update, then explicit resnapshot', async () => {
  const { client, broker } = setup();
  let revision = 3;
  const readOnlyVersionedClient: KnowledgeClient = {
    query: async q => {
      const page = await client.query(q);
      return { ...page, items: page.items.map(item => item.stableId === ID.alpha ? {
        ...item, label: revision === 3 ? item.label : 'Project milestone observed',
        source: { ...item.source, nativeVersion: `rev-${revision}` },
      } : item) };
    },
  };
  const feed = createScopedKnowledgeFeed(readOnlyVersionedClient, broker, { now: () => NOW });
```

_First 80 of 304 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
