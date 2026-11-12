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
});
test('supported reverse move creates inert CAS candidate; unsupported fields refuse', () => {
  const src = revision(); const p = projectWorldRevision(src, principal);
  expect(p.ok).toBe(true); if (!p.ok) return;
  const base = { projection:p.value,principal,currentRevision:src.revision,currentContentHash:src.contentHash,expectedVisualDigest:p.value.visualDigest };
  const planned = planWorldVisualEdit({ ...base, edit: {kind:'move',objectId:'panel',transform} });
  expect(planned.ok).toBe(true);
  if (planned.ok) {
    expect(planned.value.operation.op).toBe('object.move');
    expect(planned.value.expectedRevision).toBe(src.revision);
    expect(planned.value.requiresOwnerReview).toBe(true);
    expect(planned.value.effectsPerformed).toBe(false);
  }
  const refused = planWorldVisualEdit({ ...base, edit: {kind:'title',objectId:'panel',transform} as never });
  expect(refused.ok).toBe(false);
  expect(src.document.objects).toHaveLength(2);
});
