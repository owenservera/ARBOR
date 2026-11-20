# File: packages/tierflow/tests/visual-runtime/wave4-a-desktop-adapter.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/wave4-a-desktop-adapter.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 9757 B |
| Lines | 179 |
| Hash | 76416b86e43e |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| action | const | 9 | no | const action = { id: &#39;fixture.preview&#39;, version: 2 } as const; |
| pin | const | 10 | no | const pin = { id: &#39;bind.note&#39;, version: 3, nodeId: &#39;panel&#39;, knowledgeRef: &#39;kb.note&#39;, provenanceRef: &#39;source.opaque&#39; } as const; |
| documentFixture | function | 11 | no | function documentFixture(): Record&lt;string, any&gt; { |
| request | function | 27 | no | function request(overrides: Partial&lt;DesktopAdapterRequest&gt; = {}): DesktopAdapterRequest { |
| ready | function | 37 | no | function ready(value = request()) { |
| r | const | 38 | no | const r = projectWave4DesktopAdapter(value); |
| refusal | const | 40 | no | const refusal = r.ok ? null : r; |
| refusal | function | 45 | no | function refusal(code: string, value: DesktopAdapterRequest) { |
| r | const | 46 | no | const r = projectWave4DesktopAdapter(value); |
| d | const | 62 | no | const d = renderWave3Semantics(documentFixture(), { viewportPx: 1280, knownActions: [action] }); |
| v | const | 64 | no | const v = ready(); |
| serializedView | const | 83 | no | const serializedView = JSON.stringify(v); |
| widths | const | 90 | no | const widths = [320, 360, 1280]; |
| views | const | 91 | no | const views = widths.map(width =&gt; { const r = resizeWave4DesktopAdapter(request(), width); assert.equal(r.ok, true, JSON.stringify(r)); if (!r.ok) throw Error(&#39;Projection unavailable&#39;); return r.view; |
| r | const | 92 | no | const r = resizeWave4DesktopAdapter(request(), width); |
| v | const | 105 | no | const v = request(); |
| r | const | 106 | no | const r = refusal(&#39;HOST_DETACHED&#39;, { ...v, host: { ...v.host, state: &#39;detached&#39; } }); |
| v | const | 112 | no | const v = request(); |
| v | const | 124 | no | const v = request(); |
| denied | const | 125 | no | const denied = refusal(&#39;HOST_DENIED&#39;, { ...v, host: { ...v.host, decision: &#39;denied&#39; } }); |
| doc | const | 132 | no | const doc = documentFixture(); |
| doc | const | 141 | no | const doc = documentFixture(); |
| withHandler | const | 145 | no | const withHandler = documentFixture(); |
| v | const | 151 | no | const v = request(); |
| readyView | const | 153 | no | const readyView = ready(v); |
| view | const | 159 | no | const view = ready({ ...request(), lastDisplayedRevision: 4 }); |
| fresh | const | 162 | no | const fresh = ready({ ...request(), lastDisplayedRevision: null }); |
| doc | const | 167 | no | const doc = documentFixture(); |
| spoofed | const | 170 | no | const spoofed = documentFixture(); |
| host | const | 176 | no | const host = { ...request().host } as Record&lt;string, unknown&gt;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/document/schema.ts | import | 3 | [packages/tierflow/src/visual-runtime/document/schema.ts](../../src/visual-runtime/document/schema.ts.md) |
| ../../src/visual-runtime/document/validate.ts | import | 4 | [packages/tierflow/src/visual-runtime/document/validate.ts](../../src/visual-runtime/document/validate.ts.md) |
| ../../src/visual-runtime/render/wave3-semantics.ts | import | 5 | [packages/tierflow/src/visual-runtime/render/wave3-semantics.ts](../../src/visual-runtime/render/wave3-semantics.ts.md) |
| ../../src/visual-runtime/device/wave4-desktop-adapter.ts | import | 6 | [packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts](../../src/visual-runtime/device/wave4-desktop-adapter.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UI_DOCUMENT_SCHEMA } from '../../src/visual-runtime/document/schema.ts';
import { validateUiDocument } from '../../src/visual-runtime/document/validate.ts';
import { renderWave3Semantics } from '../../src/visual-runtime/render/wave3-semantics.ts';
import { projectWave4DesktopAdapter, resizeWave4DesktopAdapter,
  WAVE4_DESKTOP_ADAPTER_SCHEMA, type DesktopAdapterRequest } from '../../src/visual-runtime/device/wave4-desktop-adapter.ts';

const action = { id: 'fixture.preview', version: 2 } as const;
const pin = { id: 'bind.note', version: 3, nodeId: 'panel', knowledgeRef: 'kb.note', provenanceRef: 'source.opaque' } as const;
function documentFixture(): Record<string, any> {
  return {
    schema: UI_DOCUMENT_SCHEMA, documentId: 'doc.founder', scope: { ownerRef: 'owner:a', workspaceRef: 'world:a' },
    revision: 4, rootId: 'root', nodes: [
      { id: 'root', type: 'stack', props: { direction: 'vertical', gap: 'md' }, children: ['panel', 'button:preview'],
        a11y: { role: 'main', name: 'Founder Workspace' } },
      { id: 'panel', type: 'card', props: { title: 'Today', description: 'Source-backed note' }, children: [],
        a11y: { role: 'region', name: 'Today' }, bindingRefs: ['bind.note'] },
      { id: 'button:preview', type: 'button', props: { label: 'Preview' }, children: [],
        a11y: { role: 'button', name: 'Preview', focusOrder: 1 }, actionRefs: [{ ...action }] },
    ],
    bindings: [{ ...pin, field: 'title', readScope: 'owner', availability: 'present' }],
    views: [{ id: 'desktop', kind: '2d', version: 1, viewport: 'desktop' },
      { id: 'phone', kind: '2d', version: 1, viewport: 'phone' }],
  };
}
function request(overrides: Partial<DesktopAdapterRequest> = {}): DesktopAdapterRequest {
  return {
    document: documentFixture(),
    semantics: { expectedRevision: 4, knownActions: [action], knownBindings: [pin] },
    host: { state: 'connected', ownerRef: 'owner:a', worldRef: 'world:a',
      decision: 'read-only', publisher: 'harness', anotherPublisherPresent: false },
    viewportPx: 1280, lastDisplayedRevision: 3,
    ...overrides,
  };
}
function ready(value = request()) {
  const r = projectWave4DesktopAdapter(value);
  // Capture the refusal before the assertion narrows `r` to its ok-branch.
  const refusal = r.ok ? null : r;
  assert.equal(r.ok, true, JSON.stringify(r));
  if (!r.ok) throw new Error(`Expected projection: ${refusal?.code}`);
  return r.view;
}
function refusal(code: string, value: DesktopAdapterRequest) {
  const r = projectWave4DesktopAdapter(value);
  assert.equal(r.ok, false, JSON.stringify(r));
  if (r.ok) throw new Error('Expected safe refusal');
  assert.equal(r.code, code);
  assert.equal(r.readOnly, true);
  assert.equal(r.effectsInvoked, false);
  assert.deepEqual(r.safePlan.focusOrder, []);
  assert.equal(r.safePlan.status, 'unavailable');
  assert.equal(r.focusReturnId, 'main');
  assert.equal(r.retry, 'manual-status-check-or-resnapshot');
  assert.equal(JSON.stringify(r).includes('source.opaque'), false);
  return r;
}

test('A01 — real Wave3 A/D validates and projects an inert Founder Workspace into the existing Tauri Host shell', () => {
  assert.equal(validateUiDocument(documentFixture(), { knownActions: [action] }).ok, true);
  const d = renderWave3Semantics(documentFixture(), { viewportPx: 1280, knownActions: [action] });
  assert.equal(d.status, 'ok');
  const v = ready();
  assert.equal(v.schema, WAVE4_DESKTOP_ADAPTER_SCHEMA);
  assert.deepEqual(v.native, { window: 'main', existingMountId: 'world-view', webview: 'existing-vivim-host',
    existingPublisher: 'harness', publish: false, newStore: false, effects: false });
  assert.equal(v.plan.root.tag, 'main');
  assert.equal(Object.isFrozen(v.plan.root), true);
  assert.equal(v.plan.documentId, 'doc.founder');
  assert.equal(v.identity.revision, 4);
  assert.equal(v.identity.ownerRef, 'owner:a');
  assert.equal(v.identity.worldRef, 'world:a');
  assert.match(v.identity.documentDigest, /^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(v.focus.order, ['button:preview']);
  assert.equal(v.focus.escape, 'return-to-existing-shell');
  assert.equal(v.focus.trapped, false);
  assert.equal(v.provenance.bindingCount, 1);
  assert.equal(v.provenance.authorizedByRenderer, false);
  assert.equal(v.references.length, 2);
```

_First 80 of 180 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
