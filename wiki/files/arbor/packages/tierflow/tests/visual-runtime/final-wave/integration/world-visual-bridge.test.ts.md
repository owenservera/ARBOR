# File: packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/final-wave/integration/world-visual-bridge.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 6125 B |
| Lines | 97 |
| Hash | 731a6a87115e |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| vec | const | 8 | no | const vec = { x: 0, y: 0, z: 0 }; |
| transform | const | 9 | no | const transform = { position: vec, rotation: vec, scale: { x: 1, y: 1, z: 1 } }; |
| text | const | 10 | no | const text: UiObject = { id: &#39;caption&#39;, kind: &#39;static&#39;, shape: &#39;text&#39;, layer: &#39;content&#39;, title: &#39;Welcome&#39;, transform }; |
| box | const | 11 | no | const box: UiObject = { id: &#39;panel&#39;, kind: &#39;static&#39;, shape: &#39;box&#39;, layer: &#39;structure&#39;, title: &#39;Panel&#39;, transform, props: { color: &#39;blue&#39; } }; |
| principal | const | 12 | no | const principal = { ownerRef: &#39;ownerA&#39;, workspaceRef: &#39;workspaceA&#39;, worldId: &#39;homeA&#39;, active: true }; |
| revision | function | 13 | no | function revision(objects: readonly UiObject[] = [text, box], relationships: UiDocument[&#39;relationships&#39;] = [], dataFlows: UiDocument[&#39;dataFlows&#39;] = []): UiRevision { |
| document | const | 14 | no | const document = parseUiDocument({ schemaVersion: 1, world: { id: &#39;homeA&#39;, kind: &#39;home&#39;, title: &#39;My World&#39;, accent: &#39;#123456&#39;, origin: vec, unitsPerMeter: 1, }, objects, relationships, dataFlows }); |
| p | const | 21 | no | const p = projectWorldRevision(revision([]), principal); |
| a | const | 29 | no | const a = projectWorldRevision(revision(), principal); |
| b | const | 30 | no | const b = projectWorldRevision(revision(), principal); |
| rels | const | 41 | no | const rels: UiDocument[&#39;relationships&#39;] = [ |
| p | const | 47 | no | const p = projectWorldRevision(revision([text, box], rels), principal); |
| flows | const | 54 | no | const flows: UiDocument[&#39;dataFlows&#39;] = [{ id:&#39;f1&#39;, path:&#39;/status&#39;, targetObject:&#39;caption&#39;, targetProp:&#39;value&#39;, direction:&#39;outbound&#39; }]; |
| p | const | 55 | no | const p = projectWorldRevision(revision([text], [], flows), principal); |
| sphere | const | 62 | no | const sphere = { ...text, shape: &#39;sphere&#39; as const }; |
| bad | const | 63 | no | const bad = projectWorldRevision(revision([sphere]), principal); |
| hostile | const | 66 | no | const hostile = projectWorldRevision(revision([{ ...text, title: &#39;javascript:alert(1)&#39; }]), principal); |
| src | const | 71 | no | const src = revision(); const before = canonicalJson(src.document); |
| p | const | 72 | no | const p = projectWorldRevision(src, principal); |
| edit | const | 77 | no | const edit = { kind: &#39;move&#39; as const, objectId: &#39;panel&#39;, transform }; |
| src | const | 83 | no | const src = revision(); const p = projectWorldRevision(src, principal); |
| base | const | 85 | no | const base = { projection:p.value,principal,currentRevision:src.revision,currentContentHash:src.contentHash,expectedVisualDigest:p.value.visualDigest }; |
| planned | const | 86 | no | const planned = planWorldVisualEdit({ ...base, edit: {kind:&#39;move&#39;,objectId:&#39;panel&#39;,transform} }); |
| refused | const | 94 | no | const refused = planWorldVisualEdit({ ...base, edit: {kind:&#39;title&#39;,objectId:&#39;panel&#39;,transform} as never }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 1 | external |
| ../../../../src/ui/hash.ts | import | 2 | [packages/tierflow/src/ui/hash.ts](../../../../src/ui/hash.ts.md) |
| ../../../../src/ui/world.ts | import | 3 | [packages/tierflow/src/ui/world.ts](../../../../src/ui/world.ts.md) |
| ../../../../src/visual-runtime/document/validate.ts | import | 4 | [packages/tierflow/src/visual-runtime/document/validate.ts](../../../../src/visual-runtime/document/validate.ts.md) |
| ../../../../src/visual-runtime/final-wave/integration/world-visual-bridge.ts | import | 5 | [packages/tierflow/src/visual-runtime/final-wave/integration/world-visual-bridge.ts](../../../../src/visual-runtime/final-wave/integration/world-visual-bridge.ts.md) |
| ../../../../src/ui/types.ts | import | 6 | [packages/tierflow/src/ui/types.ts](../../../../src/ui/types.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import { test, expect } from 'bun:test';
import { contentHash, canonicalJson } from '../../../../src/ui/hash.ts';
import { parseUiDocument } from '../../../../src/ui/world.ts';
import { validateUiDocument } from '../../../../src/visual-runtime/document/validate.ts';
import { projectWorldRevision, planWorldVisualEdit } from '../../../../src/visual-runtime/final-wave/integration/world-visual-bridge.ts';
import type { UiDocument, UiRevision, UiObject } from '../../../../src/ui/types.ts';

const vec = { x: 0, y: 0, z: 0 };
const transform = { position: vec, rotation: vec, scale: { x: 1, y: 1, z: 1 } };
const text: UiObject = { id: 'caption', kind: 'static', shape: 'text', layer: 'content', title: 'Welcome', transform };
const box: UiObject = { id: 'panel', kind: 'static', shape: 'box', layer: 'structure', title: 'Panel', transform, props: { color: 'blue' } };
const principal = { ownerRef: 'ownerA', workspaceRef: 'workspaceA', worldId: 'homeA', active: true };
function revision(objects: readonly UiObject[] = [text, box], relationships: UiDocument['relationships'] = [], dataFlows: UiDocument['dataFlows'] = []): UiRevision {
  const document = parseUiDocument({ schemaVersion: 1, world: {
    id: 'homeA', kind: 'home', title: 'My World', accent: '#123456',
    origin: vec, unitsPerMeter: 1,
  }, objects, relationships, dataFlows });
  return { revision: 2, document, contentHash: contentHash(document), actorId: 'ownerA', createdAt: 1 };
}
test('real validators accept empty World and canonical accessible root', () => {
  const p = projectWorldRevision(revision([]), principal);
  expect(p.ok).toBe(true);
  if (!p.ok) return;
  expect(validateUiDocument(p.value.document).ok).toBe(true);
  expect(p.value.document.nodes).toHaveLength(1);
  expect(p.value.document.bindings).toEqual([]);
});
test('stable scoped identity, repeated digest and inert text/card types', () => {
  const a = projectWorldRevision(revision(), principal);
  const b = projectWorldRevision(revision(), principal);
  expect(a.ok && b.ok).toBe(true);
  if (!a.ok || !b.ok) return;
  expect(a.value.visualDigest).toBe(b.value.visualDigest);
  expect(a.value.document.documentId).toBe('world_homeA');
  expect(a.value.document.revision).toBe(2);
  expect(a.value.document.nodes.map(n => n.type)).toEqual(['stack','text','card']);
  expect(a.value.document.nodes.every(n => !n.actionRefs?.length && !n.bindingRefs?.length)).toBe(true);
  expect(a.value.effectInvoked).toBe(false);
});
test('preserves links, mirrors, drives and contains in pinned original; no fake KB binding', () => {
  const rels: UiDocument['relationships'] = [
    { id: 'r1', kind: 'contains', from: 'panel', to: 'caption' },
    { id: 'r2', kind: 'links', from: 'caption', to: 'panel' },
    { id: 'r3', kind: 'drives', from: 'panel', to: 'caption' },
    { id: 'r4', kind: 'mirrors', from: 'caption', to: 'panel' },
  ];
  const p = projectWorldRevision(revision([text, box], rels), principal);
  expect(p.ok).toBe(true);
  if (!p.ok) return;
  expect(canonicalJson(p.value.source.document.relationships)).toBe(canonicalJson(rels));
  expect(p.value.document.bindings).toEqual([]);
});
test('safe outbound dataFlow retained but never executed or projected as KB', () => {
  const flows: UiDocument['dataFlows'] = [{ id:'f1', path:'/status', targetObject:'caption', targetProp:'value', direction:'outbound' }];
  const p = projectWorldRevision(revision([text], [], flows), principal);
  expect(p.ok).toBe(true);
  if (!p.ok) return;
  expect(p.value.source.document.dataFlows).toEqual(flows);
  expect(p.value.document.bindings).toHaveLength(0);
});
test('rejects dynamic and unsupported geometry, unsafe text without partial projection', () => {
  const sphere = { ...text, shape: 'sphere' as const };
  const bad = projectWorldRevision(revision([sphere]), principal);
  expect(bad.ok).toBe(false);
  if (!bad.ok) expect(bad.code).toBe('UNSUPPORTED_OBJECT');
  const hostile = projectWorldRevision(revision([{ ...text, title: 'javascript:alert(1)' }]), principal);
  expect(hostile.ok).toBe(false);
  if (!hostile.ok) expect(hostile.code).toBe('UNSAFE_VISUAL');
});
test('rejects stale, revoked and foreign scope, leaves source content untouched', () => {
  const src = revision(); const before = canonicalJson(src.document);
  const p = projectWorldRevision(src, principal);
  expect(p.ok).toBe(true);
  expect(projectWorldRevision(src, { ...principal, active: false }).ok).toBe(false);
  expect(projectWorldRevision(src, { ...principal, worldId: 'foreign' }).ok).toBe(false);
  if (!p.ok) return;
  const edit = { kind: 'move' as const, objectId: 'panel', transform };
  expect(planWorldVisualEdit({projection:p.value,principal,currentRevision:3,currentContentHash:src.contentHash,expectedVisualDigest:p.value.visualDigest,edit}).ok).toBe(false);
  expect(planWorldVisualEdit({projection:p.value,principal:{...principal,active:false},currentRevision:2,currentContentHash:src.contentHash,expectedVisualDigest:p.value.visualDigest,edit}).ok).toBe(false);
  expect(canonicalJson(src.document)).toBe(before);
```

_First 80 of 98 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
