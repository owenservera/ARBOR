# File: packages/tierflow/tests/visual-runtime/final-wave/lane-d/knowledge-presentation.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/final-wave/lane-d/knowledge-presentation.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 15025 B |
| Lines | 260 |
| Hash | 57fa52dd4fde |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 9 | no | const NOW = Date.parse(&#39;2026-11-07T00:00:00.000Z&#39;); |
| SECRET | const | 10 | no | const SECRET = &#39;PRIVATE_ONLY_MARKER_739&#39;; |
| fact | function | 11 | no | const fact = (patch: Partial&lt;ScopedFeedCard&gt; = {}): ScopedFeedCard =&gt; ({ stableId: &#39;kn_allowed&#39;, projectRef: &#39;project_a&#39;, kind: &#39;project_note&#39;, title: &#39;Public project&#39;, summary: &#39;Source-backed, autho… |
| page | const | 20 | no | const page = (cards: readonly ScopedFeedCard[] = [fact()], patch: Partial&lt;ScopedFeedResult&gt; = {}): ScopedFeedResult =&gt; ({ state: &#39;ready&#39;, reason: &#39;NONE&#39;, cards, changes: [], removedStableIds: [], pro… |
| context | function | 24 | no | const context = (surface: &#39;pc&#39; \| &#39;android&#39;, patch: Partial&lt;TrustedKnowledgeContext&gt; = {}): TrustedKnowledgeContext =&gt; ({ ownerRef: &#39;owner_a&#39;, personalWorldRef: &#39;world_a&#39;, sessionRef: &#39;session_a&#39;, dev… |
| request | function | 31 | no | const request = (surface: &#39;pc&#39; \| &#39;android&#39;, patch: Partial&lt;KnowledgeQuery&gt; = {}): KnowledgeQuery =&gt; ({ schema: &#39;vivim.knowledge-query/1&#39;, requestId: &#39;req_1&#39;, personalWorldRef: &#39;world_a&#39;, surface, pur… |
| capability | function | 35 | no | const capability = (patch: Partial&lt;CapabilityDescriptor&gt; = {}): CapabilityDescriptor =&gt; ({ actionId: &#39;ui.publish&#39;, title: &#39;Publish UI&#39;, explanation: &#39;Publish requires a reviewed owner grant.&#39;, author… |
| fixture | function | 43 | no | function fixture(surface: &#39;pc&#39; \| &#39;android&#39;, initial = page()) { |
| bound | variable | 44 | no | let bound: TrustedKnowledgeContext \| null = context(surface); |
| current | variable | 45 | no | let current = initial; |
| polls | variable | 46 | no | let polls = 0; |
| clears | variable | 47 | no | let clears = 0; |
| capabilityReads | variable | 48 | no | let capabilityReads = 0; |
| notices | const | 49 | no | const notices: SourceFeedNotice[] = []; |
| feed | const | 50 | no | const feed: ScopedKnowledgeFeed = { |
| broker | const | 55 | no | const broker = { readContext: () =&gt; bound }; |
| port | const | 56 | no | const port = createKnowledgePresentation(feed, broker, { surface, now: () =&gt; NOW, capabilityReader: { read: async id =&gt; { capabilityReads++; return id === &#39;ui.publish&#39; ? capability() : null; }, }, }); |
| opaque | function | 65 | no | function opaque(v: unknown): void { |
| s | const | 66 | no | const s = JSON.stringify(v); |
| blank | function | 74 | no | function blank(v: Awaited&lt;ReturnType&lt;ReturnType&lt;typeof fixture&gt;[&#39;port&#39;][&#39;read&#39;]&gt;&gt;): void { |
| pc | const | 81 | no | const pc = await fixture(&#39;pc&#39;).port.read(request(&#39;pc&#39;)); |
| phone | const | 82 | no | const phone = await fixture(&#39;android&#39;).port.read(request(&#39;android&#39;)); |
| f | const | 94 | no | const f = fixture(&#39;pc&#39;); |
| next | const | 97 | no | const next = await f.port.read(request(&#39;pc&#39;)); |
| f | const | 103 | no | const f = fixture(&#39;android&#39;, page([fact({ stableId: &#39;kn_secret&#39;, title: SECRET })])); |
| r | const | 105 | no | const r = await f.port.read(request(&#39;android&#39;, { query: SECRET })); |
| f | const | 109 | no | const f = fixture(&#39;android&#39;); |
| f | const | 114 | no | const f = fixture(&#39;android&#39;); |
| f | const | 120 | no | const f = fixture(&#39;android&#39;); |
| f | const | 128 | no | const f = fixture(&#39;pc&#39;); f.setContext(next); |
| f | const | 134 | no | const f = fixture(&#39;pc&#39;); |
| r | const | 138 | no | const r = await f.port.read(request(&#39;pc&#39;)); |
| f | const | 145 | no | const f = fixture(&#39;pc&#39;, page([fact({ asOf: new Date(NOW - 9 * 86400000).toISOString(), availability: &#39;stale&#39; })], { state: &#39;partial&#39; })); |
| r | const | 146 | no | const r = await f.port.read(request(&#39;pc&#39;)); |
| f | const | 152 | no | const f = fixture(&#39;android&#39;, page([fact({ sensitivity: &#39;S3&#39; as never })])); |
| r | const | 153 | no | const r = await f.port.read(request(&#39;android&#39;)); |
| f | const | 159 | no | const f = fixture(&#39;pc&#39;, page([fact(patch)])); |
| f | const | 164 | no | const f = fixture(&#39;pc&#39;, page([{ ...fact(), execute: () =&gt; &#39;bad&#39;, bearer: SECRET } as ScopedFeedCard])); |
| r | const | 165 | no | const r = await f.port.read(request(&#39;pc&#39;)); |
| f | const | 171 | no | const f = fixture(&#39;android&#39;); |
| f | const | 177 | no | const f = fixture(&#39;android&#39;); |
| r | const | 181 | no | const r = await f.port.read(request(&#39;android&#39;)); |
| f | const | 186 | no | const f = fixture(&#39;pc&#39;); |
| r | const | 187 | no | const r = await f.port.read(request(&#39;pc&#39;, { purpose: &#39;explain&#39; }), { actionId: &#39;ui.publish&#39;, kbStableId: &#39;kn_allowed&#39; }); |
| f | const | 195 | no | const f = fixture(&#39;android&#39;); |
| r | const | 196 | no | const r = await f.port.read(request(&#39;android&#39;, { purpose: &#39;help&#39; }), { actionId: &#39;ui.publish&#39;, kbStableId: &#39;kn_private&#39; }); |
| f | const | 202 | no | const f = fixture(&#39;pc&#39;); |
| port | const | 203 | no | const port = createKnowledgePresentation(f.feed, f.broker, { surface: &#39;pc&#39;, now: () =&gt; NOW, capabilityReader: { read: async () =&gt; capability({ disclosure: &#39;restricted&#39; }) } }); |
| r | const | 205 | no | const r = await port.read(request(&#39;pc&#39;, { purpose: &#39;help&#39; }), { actionId: &#39;ui.publish&#39; }); |
| f | const | 209 | no | const f = fixture(&#39;pc&#39;); |
| r | const | 210 | no | const r = await f.port.read(request(&#39;pc&#39;, { purpose: &#39;help&#39; }), { actionId: &#39;other&#39; }); |
| f | const | 215 | no | const f = fixture(&#39;pc&#39;); |
| p | const | 216 | no | const p = createKnowledgePresentation(f.feed, f.broker, { surface: &#39;pc&#39;, now: () =&gt; NOW }); |
| r | const | 217 | no | const r = await p.read(request(&#39;pc&#39;, { purpose: &#39;help&#39; }), { actionId: &#39;ui.publish&#39; }); |
| release | variable | 221 | no | let release!: (v: CapabilityDescriptor) =&gt; void; |
| pending | const | 222 | no | const pending = new Promise&lt;CapabilityDescriptor&gt;(r =&gt; { release = r; }); |
| f | const | 223 | no | const f = fixture(&#39;android&#39;); |
| p | const | 224 | no | const p = createKnowledgePresentation(f.feed, f.broker, { surface: &#39;android&#39;, now: () =&gt; NOW, capabilityReader: { read: async () =&gt; pending } }); |
| future | const | 226 | no | const future = p.read(request(&#39;android&#39;, { purpose: &#39;help&#39; }), { actionId: &#39;ui.publish&#39; }); |
| r | const | 230 | no | const r = await future; |
| release | variable | 234 | no | let release!: (r: ScopedFeedResult) =&gt; void; |
| pending | const | 235 | no | const pending = new Promise&lt;ScopedFeedResult&gt;(r =&gt; { release = r; }); |
| f | const | 236 | no | const f = fixture(&#39;pc&#39;); |
| feed | const | 237 | no | const feed: ScopedKnowledgeFeed = { poll: async () =&gt; pending, resnapshot: async () =&gt; pending, |
| p | const | 239 | no | const p = createKnowledgePresentation(feed, f.broker, { surface: &#39;pc&#39;, now: () =&gt; NOW }); |
| outcome | const | 240 | no | const outcome = p.read(request(&#39;pc&#39;)); |
| f | const | 245 | no | const f = fixture(&#39;pc&#39;); |
| p | const | 246 | no | const p = createKnowledgePresentation(f.feed, f.broker, { surface: &#39;pc&#39;, now: () =&gt; NOW, capabilityReader: { read: async () =&gt; { throw new Error(&#39;source unavailable&#39;); } } }); |
| r | const | 248 | no | const r = await p.read(request(&#39;pc&#39;, { purpose: &#39;explain&#39; }), { actionId: &#39;ui.publish&#39; }); |
| f | const | 252 | no | const f = fixture(&#39;pc&#39;, page([fact()], { removedStableIds: [&#39;kn_removed&#39;], nextCursor: &#39;cursor_1&#39; })); |
| r | const | 253 | no | const r = await f.port.read(request(&#39;pc&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../../../src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts | import | 3 | [packages/tierflow/src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts](../../../../src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts.md) |
| ../../../../src/visual-runtime/knowledge/client.ts | import | 4 | [packages/tierflow/src/visual-runtime/knowledge/client.ts](../../../../src/visual-runtime/knowledge/client.ts.md) |
| ../../../../src/visual-runtime/knowledge/wave3-feed-projection.ts | import | 5 | [packages/tierflow/src/visual-runtime/knowledge/wave3-feed-projection.ts](../../../../src/visual-runtime/knowledge/wave3-feed-projection.ts.md) |
| ../../../../src/visual-runtime/experience/help.ts | import | 6 | [packages/tierflow/src/visual-runtime/experience/help.ts](../../../../src/visual-runtime/experience/help.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { KNOWLEDGE_PRESENTATION_SCHEMA, createKnowledgePresentation } from '../../../../src/visual-runtime/final-wave/lane-d/knowledge-presentation.ts';
import type { KnowledgeQuery, TrustedKnowledgeContext } from '../../../../src/visual-runtime/knowledge/client.ts';
import type { ScopedFeedCard, ScopedFeedResult, ScopedKnowledgeFeed, SourceFeedNotice } from '../../../../src/visual-runtime/knowledge/wave3-feed-projection.ts';
import type { CapabilityDescriptor } from '../../../../src/visual-runtime/experience/help.ts';

/** Fixture facts are synthetic. No live HQ, Host, device or user-data claims. */
const NOW = Date.parse('2026-11-07T00:00:00.000Z');
const SECRET = 'PRIVATE_ONLY_MARKER_739';
const fact = (patch: Partial<ScopedFeedCard> = {}): ScopedFeedCard => ({
  stableId: 'kn_allowed', projectRef: 'project_a', kind: 'project_note', title: 'Public project',
  summary: 'Source-backed, authorized summary', statusLabel: 'Observed (not an authorization)',
  provenanceLabel: 'synthetic.corpus/1', sourceVersion: 'revision_3', asOf: new Date(NOW - 1000).toISOString(),
  availability: 'present', claimStatus: 'observed', sensitivity: 'enforced-upstream-not-disclosed',
  source: { authority: 'hq_fixture', nativeId: 'native_1', nativeVersion: 'revision_3', digest: 'sha256:fixture-1' },
  evidenceRefs: ['fixture_evidence_1'], provenance: ['synthetic.corpus/1'], interactive: false,
  ...patch,
});
const page = (cards: readonly ScopedFeedCard[] = [fact()], patch: Partial<ScopedFeedResult> = {}): ScopedFeedResult => ({
  state: 'ready', reason: 'NONE', cards, changes: [], removedStableIds: [],
  projectionRevision: 'projection_1', asOf: new Date(NOW).toISOString(), ...patch,
});
const context = (surface: 'pc' | 'android', patch: Partial<TrustedKnowledgeContext> = {}): TrustedKnowledgeContext => ({
  ownerRef: 'owner_a', personalWorldRef: 'world_a', sessionRef: 'session_a',
  deviceRef: surface === 'pc' ? 'pc_a' : 'android_a', surface,
  allowedPurposes: ['task', 'help', 'explain'], policyRevision: 'policy_1',
  sessionExpiresAt: NOW + 90000, grantExpiresAt: NOW + 60000,
  revoked: false, offline: false, allowPhoneS1: false, ...patch,
});
const request = (surface: 'pc' | 'android', patch: Partial<KnowledgeQuery> = {}): KnowledgeQuery => ({
  schema: 'vivim.knowledge-query/1', requestId: 'req_1', personalWorldRef: 'world_a',
  surface, purpose: 'task', query: 'project', limit: 10, ...patch,
});
const capability = (patch: Partial<CapabilityDescriptor> = {}): CapabilityDescriptor => ({
  actionId: 'ui.publish', title: 'Publish UI', explanation: 'Publish requires a reviewed owner grant.',
  authority: 'host', sourceVersion: 'catalog_5', sourceDigest: 'catalog_digest_5',
  observedAt: new Date(NOW).toISOString(), surface: 'both', risk: 'R1', disclosure: 'public',
  readiness: { supportedByBuild: 'yes', availableNow: 'yes', permittedForActor: 'no', verifiedByEvidence: 'no' },
  prerequisites: ['Review preview'], requiredScopes: ['ui.publish'], errorCodes: ['OWNER_APPROVAL_REQUIRED'],
  textCommand: 'preview panel', ...patch,
});
function fixture(surface: 'pc' | 'android', initial = page()) {
  let bound: TrustedKnowledgeContext | null = context(surface);
  let current = initial;
  let polls = 0;
  let clears = 0;
  let capabilityReads = 0;
  const notices: SourceFeedNotice[] = [];
  const feed: ScopedKnowledgeFeed = {
    poll: async () => { polls++; return current; },
    resnapshot: async () => { polls++; return current; },
    notice: hint => { notices.push(hint); }, clear: () => { clears++; },
  };
  const broker = { readContext: () => bound };
  const port = createKnowledgePresentation(feed, broker, {
    surface, now: () => NOW, capabilityReader: {
      read: async id => { capabilityReads++; return id === 'ui.publish' ? capability() : null; },
    },
  });
  return { port, broker, feed, setContext: (x: TrustedKnowledgeContext | null) => { bound = x; },
    setPage: (x: ScopedFeedResult) => { current = x; },
    metrics: () => ({ polls, clears, capabilityReads, notices }) };
}
function opaque(v: unknown): void {
  const s = JSON.stringify(v);
  assert.ok(!s.includes(SECRET));
  assert.ok(!s.includes('owner_a'));
  assert.ok(!s.includes('session_a'));
  assert.ok(!s.includes('PRIVATE'));
  assert.ok(!s.includes('totalCount'));
  assert.ok(!s.includes('removedStableIds'));
}
function blank(v: Awaited<ReturnType<ReturnType<typeof fixture>['port']['read']>>): void {
  assert.deepEqual(v.cards, []); assert.equal(v.help, null); assert.equal(v.source, null);
  assert.equal(v.replace, true); assert.equal(v.retainOffline, false);
  assert.ok(!('nextCursor' in v)); opaque(v);
}

test('D01 canonical PC/Android read parity: exact stable and source native identity', async () => {
```

_First 80 of 261 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
