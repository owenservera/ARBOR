# File: packages/tierflow/tests/visual-runtime/help.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/help.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 6451 B |
| Lines | 111 |
| Hash | 2686badeb076 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| descriptor | function | 4 | no | const descriptor = (overrides: Partial&lt;CapabilityDescriptor&gt; = {}): CapabilityDescriptor =&gt; ({ actionId: &#39;ui.open-panel&#39;, title: &#39;Open a panel&#39;, explanation: &#39;Opens an authorized information panel.&#39;,… |
| kb | const | 12 | no | const kb: AuthorizedKbHelp = { |
| help | const | 18 | no | const help = projectCapabilityHelp(descriptor(), kb); |
| fields | const | 30 | no | const fields = [&#39;supportedByBuild&#39;, &#39;availableNow&#39;, &#39;permittedForActor&#39;, &#39;verifiedByEvidence&#39;] as const; |
| d | const | 32 | no | const d = descriptor({ readiness: { ...descriptor().readiness, [key]: status } }); |
| help | const | 33 | no | const help = projectCapabilityHelp(d, kb); |
| v | const | 39 | no | const v = projectCapabilityHelp(descriptor({ authority: &#39;host&#39;, risk: &#39;R3&#39; })); |
| view | const | 45 | no | const view = projectCapabilityHelp(descriptor(), { ...kb, visibility }); |
| forbidden | const | 52 | no | const forbidden = descriptor({ actionId: &#39;private.very-secret&#39;, title: &#39;Confidential feature&#39;, disclosure: &#39;restricted&#39;, readiness: { ...descriptor().readiness, permittedForActor: &#39;no&#39; } }); |
| v | const | 54 | no | const v = projectCapabilityHelp(forbidden, kb); |
| matches | const | 59 | no | const matches = searchCapabilityHelp(&#39;Confidential feature&#39;, [descriptor(), forbidden]); |
| v | const | 63 | no | const v = projectCapabilityHelp(descriptor({ disclosure: &#39;restricted&#39;, readiness: { ...descriptor().readiness, permittedForActor: &#39;unknown&#39; } })); |
| ds | const | 67 | no | const ds = Array.from({ length: 210 }, (_, i) =&gt; descriptor({ actionId: `ui.panel-${i}`, title: `Panel ${i}` })); |
| all | const | 68 | no | const all = searchCapabilityHelp(&#39;panel&#39;, ds); |
| v | const | 76 | no | const v = projectCapabilityHelp(descriptor({ textCommand })); |
| v | const | 83 | no | const v = projectCapabilityHelp(descriptor({ actionId: bad })); |
| v | const | 89 | no | const v = searchCapabilityHelp(&#39;open panel&#39;, [descriptor()], { &#39;ui.open-panel&#39;: kb }); |
| v | const | 103 | no | const v = projectCapabilityHelp(bad as CapabilityDescriptor); |
| view | const | 109 | no | const view = projectCapabilityHelp(descriptor(), { ...kb, evidenceRefs: undefined } as unknown as AuthorizedKbHelp); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/experience/help.ts | import | 3 | [packages/tierflow/src/visual-runtime/experience/help.ts](../../src/visual-runtime/experience/help.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { projectCapabilityHelp, searchCapabilityHelp, type CapabilityDescriptor, type AuthorizedKbHelp } from '../../src/visual-runtime/experience/help.ts';
const descriptor = (overrides: Partial<CapabilityDescriptor> = {}): CapabilityDescriptor => ({
  actionId: 'ui.open-panel', title: 'Open a panel', explanation: 'Opens an authorized information panel.',
  authority: 'ui', sourceVersion: '1', sourceDigest: 'sha256:abc', observedAt: '2026-11-06T16:00:00Z',
  surface: 'both', risk: 'R0', disclosure: 'public',
  readiness: { supportedByBuild: 'yes', availableNow: 'yes', permittedForActor: 'yes', verifiedByEvidence: 'yes' },
  prerequisites: ['The UI is loaded'], requiredScopes: ['ui.read'],
  textCommand: 'open panel', errorCodes: ['UNAVAILABLE'], ...overrides,
});
const kb: AuthorizedKbHelp = {
  stableId: 'kb:100', projectionRevision: 'kb:1', sourceAuthority: 'hq', sourceVersion: '2',
  evidenceRefs: ['e:1'], asOf: '2026-11-06T16:00:00Z', visibility: 'authorized',
  summary: 'Authorized overview',
};
test('approved KB plus real descriptor gives provenance and safe inert text equivalence', () => {
  const help = projectCapabilityHelp(descriptor(), kb);
  assert.equal(help.schema, 'CapabilityHelpProjection/1');
  assert.equal(help.visible, true);
  assert.equal(help.canRequestPreview, true);
  assert.equal(help.runnable, false);
  assert.equal(help.textCommand, 'open panel');
  assert.equal(help.provenance?.kbStableId, 'kb:100');
  assert.deepEqual(help.provenance?.evidenceRefs, ['e:1']);
  assert.equal(help.discovery.maxDeliberateInteractions, 3);
  assert.equal(help.discovery.textQuerySupported, true);
});
test('permission not proved disables action preview across all four dimensions', () => {
  const fields = ['supportedByBuild', 'availableNow', 'permittedForActor', 'verifiedByEvidence'] as const;
  for (const key of fields) for (const status of ['no', 'unknown'] as const) {
    const d = descriptor({ readiness: { ...descriptor().readiness, [key]: status } });
    const help = projectCapabilityHelp(d, kb);
    assert.equal(help.canRequestPreview, false);
    assert.ok(help.whyUnavailable);
  }
});
test('Host R3 forbidden even with ready and permitted metadata', () => {
  const v = projectCapabilityHelp(descriptor({ authority: 'host', risk: 'R3' }));
  assert.equal(v.canRequestPreview, false);
  assert.match(v.whyUnavailable ?? '', /refused/);
});
test('redacted/revoked/deleted/unknown KB never exposes identifiers or evidence', () => {
  for (const visibility of ['redacted', 'revoked', 'deleted', 'unknown'] as const) {
    const view = projectCapabilityHelp(descriptor(), { ...kb, visibility });
    assert.equal(view.provenance?.kbStableId, undefined);
    assert.deepEqual(view.provenance?.evidenceRefs, []);
    assert.equal(JSON.stringify(view).includes('kb:100'), false);
  }
});
test('restricted unpublished capability has generic refusal without title, ID, scopes, KB or count', () => {
  const forbidden = descriptor({ actionId: 'private.very-secret', title: 'Confidential feature', disclosure: 'restricted',
    readiness: { ...descriptor().readiness, permittedForActor: 'no' } });
  const v = projectCapabilityHelp(forbidden, kb);
  assert.equal(v.visible, false);
  assert.equal(JSON.stringify(v).includes('Confidential feature'), false);
  assert.equal(JSON.stringify(v).includes('private.very-secret'), false);
  assert.equal(JSON.stringify(v).includes('kb:100'), false);
  const matches = searchCapabilityHelp('Confidential feature', [descriptor(), forbidden]);
  assert.equal(matches.items.length, 0);
});
test('unknown permission on restricted capability remains hidden', () => {
  const v = projectCapabilityHelp(descriptor({ disclosure: 'restricted', readiness: { ...descriptor().readiness, permittedForActor: 'unknown' } }));
  assert.equal(v.visible, false);
});
test('query search filters before matching terms and respects upper bounds', () => {
  const ds = Array.from({ length: 210 }, (_, i) => descriptor({ actionId: `ui.panel-${i}`, title: `Panel ${i}` }));
  const all = searchCapabilityHelp('panel', ds);
  assert.equal(all.items.length, 20);
  assert.equal(searchCapabilityHelp('x'.repeat(201), ds).status, 'unavailable');
  assert.equal(searchCapabilityHelp('nothing matches', ds).items.length, 0);
});
test('safe examples reject shell, provider URLs, credentials and executor fallback', () => {
  for (const textCommand of ['!run rm -rf /', 'grant permission', 'send bearer token', 'https://ai.example/',
    'exec command', 'open panel\nINJECT', 'open password']) {
    const v = projectCapabilityHelp(descriptor({ textCommand }));
    assert.equal(v.textCommand, undefined);
    assert.equal(v.canRequestPreview, false);
  }
});
```

_First 80 of 112 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
