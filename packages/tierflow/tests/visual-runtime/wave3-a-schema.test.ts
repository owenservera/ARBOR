import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UI_DOCUMENT_SCHEMA } from '../../src/visual-runtime/document/schema.ts';
import { validateUiDocument } from '../../src/visual-runtime/document/validate.ts';
import { inspectComponent } from '../../src/visual-runtime/components/catalog.ts';
import { renderUiDocument } from '../../src/visual-runtime/render/dom.ts';
import { projectWave3ActionSemantics, resolveWave3Reference, restoreWave3NodeReferences,
  WAVE3_ACTION_SEMANTICS_SCHEMA, type Wave3SemanticsOptions } from '../../src/visual-runtime/document/wave3-action-semantics.ts';

const action = { id: 'fixture.preview', version: 2 } as const;
const pin = { id: 'bind.note', version: 3, nodeId: 'panel', knowledgeRef: 'kb.note', provenanceRef: 'source.opaque' } as const;
const opts = { expectedRevision: 4, knownActions: [action], knownBindings: [pin] } as const;
function fixture(): Record<string, any> {
  return {
    schema: UI_DOCUMENT_SCHEMA, documentId: 'doc.founder', scope: { ownerRef: 'owner:a', workspaceRef: 'world:a' },
    revision: 4, rootId: 'root', nodes: [
      { id: 'root', type: 'stack', props: { direction: 'vertical', gap: 'md' }, children: ['panel','button:preview'],
        a11y: { role: 'main', name: 'Founder Workspace' } },
      { id: 'panel', type: 'card', props: { title: 'Today', description: 'Source-backed note' }, children: [],
        a11y: { role: 'region', name: 'Today' }, bindingRefs: ['bind.note'] },
      { id: 'button:preview', type: 'button', props: { label: 'Preview' }, children: [],
        a11y: { role: 'button', name: 'Preview', focusOrder: 1 }, actionRefs: [{ ...action }] },
    ],
    bindings: [{ ...pin, field: 'title', readScope: 'owner', availability: 'present' }],
    views: [{ id: 'phone', kind: '2d', version: 1, viewport: 'phone' },
      { id: 'desktop', kind: '2d', version: 1, viewport: 'desktop' }],
  };
}
function success(value = fixture(), options: Wave3SemanticsOptions = opts) {
  const result = projectWave3ActionSemantics(value, options);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw Error('expected success');
  return result.value;
}
function refused(patch: (d: Record<string, any>) => void, code: string, options: Wave3SemanticsOptions = opts, validationCode?: string) {
  const value = fixture(); patch(value);
  const result = projectWave3ActionSemantics(value, options);
  assert.equal(result.ok, false, JSON.stringify(result));
  if (result.ok) throw Error('expected refusal');
  assert.equal(result.readOnly, true);
  assert.equal(result.code, code);
  if (validationCode !== undefined) assert.equal(result.validationCode, validationCode);
}

test('A/B/D retain versioned opaque action and binding identities; no execute authority', () => {
  const v = success();
  assert.equal(v.schema, WAVE3_ACTION_SEMANTICS_SCHEMA);
  assert.equal(v.readOnly, true); assert.equal(v.executable, false);
  assert.equal(v.references.length, 2);
  const act = v.references.find(r => r.kind === 'action')!;
  const binding = v.references.find(r => r.kind === 'binding')!;
  assert.equal(act.id, 'fixture.preview'); assert.equal(act.version, 2);
  assert.equal(binding.id, 'bind.note'); assert.equal(binding.version, 3);
  if (binding.kind === 'binding') {
    assert.equal(binding.provenanceRef, 'source.opaque');
    assert.equal(binding.knowledgeRef, 'kb.note');
    assert.equal(binding.readScope, 'owner');
  }
  assert.ok(/^a_[a-f0-9]{32}$/.test(act.alias));
  assert.ok(/^b_[a-f0-9]{32}$/.test(binding.alias));
  assert.notEqual(act.alias, act.id);
  assert.equal(Object.isFrozen(v), true);
  assert.equal(Object.isFrozen(v.references), true);
  assert.equal(Object.isFrozen(v.rendererDocument.nodes[2]), true);
  assert.equal(v.documentDigest.startsWith('sha256:'), true);
  assert.equal(v.fieldMap.every(x => x.reversible), true);
  assert.deepEqual(JSON.parse(JSON.stringify(restoreWave3NodeReferences(v, 'button:preview', 4))),
    { ok: true, actionRefs: [action], bindingRefs: [] });
  assert.deepEqual(restoreWave3NodeReferences(v, 'panel', 4),
    { ok: true, actionRefs: [], bindingRefs: ['bind.note'] });
  assert.deepEqual(resolveWave3Reference(v, act.alias, 4), { ok: true, reference: act });
  assert.deepEqual(resolveWave3Reference(v, binding.alias, 4), { ok: true, reference: binding });
  const nativeB = inspectComponent({ id: v.componentRefs[2]!.id, type: 'button', props: { label: 'Preview' },
    children: [], actionRefs: v.componentRefs[2]!.actionRefs });
  assert.equal(nativeB.ok, true, JSON.stringify(nativeB));
  assert.notEqual(v.componentRefs[2]!.canonicalNodeId, v.componentRefs[2]!.id);
  assert.deepEqual(v.componentRefs[0]!.children, [v.componentRefs[1]!.id,v.componentRefs[2]!.id]);
  assert.ok(validateUiDocument(v.canonical, { knownActions: opts.knownActions }).ok);
  assert.equal(v.canonical.nodes[1]?.type, 'card');
  assert.equal(v.canonical.nodes[1]?.props.description, 'Source-backed note');
  // The A card is NOT falsely claimed as B-native; B prop conversion belongs to Lane B.
  assert.equal(inspectComponent(v.canonical.nodes[1]).ok, false);
  for (const width of [320,360,1280]) {
    const render = renderUiDocument(v.rendererDocument, { viewportPx: width });
    assert.equal(render.status, 'ok', JSON.stringify(render.issues));
    assert.ok(render.focusOrder.includes('button:preview'));
    assert.equal(JSON.stringify(render).includes('fixture.preview'), false);
    assert.equal(JSON.stringify(render).includes('source.opaque'), false);
    assert.equal(JSON.stringify(render).includes('kb.note'), false);
    assert.equal(JSON.stringify(render).includes('onClick'), false);
    assert.equal(JSON.stringify(render).includes('execute'), false);
  }
  assert.deepEqual(v.rendererDocument.bindings, []);
  assert.equal(JSON.stringify(v.rendererDocument).includes('source.opaque'), false);
  assert.equal(JSON.stringify(v.rendererDocument).includes('kb.note'), false);
  assert.equal(renderUiDocument(v.canonical, { viewportPx: 360 }).status, 'unavailable');
});

test('aliases stable on reorder, but pinned to exact document revision and reference versions', () => {
  const first = success();
  const reordered = fixture(); [reordered.nodes[1], reordered.nodes[2]] = [reordered.nodes[2], reordered.nodes[1]];
  const second = success(reordered);
  assert.deepEqual(first.references, [...second.references].reverse());
  assert.equal(first.componentRefs.find(r => r.canonicalNodeId === 'panel')?.id,
    second.componentRefs.find(r => r.canonicalNodeId === 'panel')?.id);
  const updated = fixture(); updated.revision = 5;
  const later = success(updated, { ...opts, expectedRevision: 5 });
  assert.notEqual(first.references[0]?.alias, later.references[0]?.alias);
  assert.deepEqual(resolveWave3Reference(later, first.references[0]!.alias, 5),
    { ok: false, code: 'UNKNOWN_REFERENCE' });
  assert.deepEqual(resolveWave3Reference(first, first.references[0]!.alias, 5),
    { ok: false, code: 'STALE_DOCUMENT' });
  assert.deepEqual(restoreWave3NodeReferences(first, 'panel', 5),
    { ok: false, code: 'STALE_DOCUMENT' });
  assert.deepEqual(restoreWave3NodeReferences(first, 'unknown', 4),
    { ok: false, code: 'UNKNOWN_REFERENCE' });
});

test('reject stale document, stale action version, binding version or spoofed provenance', () => {
  refused(d => { d.revision = 3; }, 'STALE_DOCUMENT');
  refused(d => { d.nodes[2].actionRefs[0].version = 1; }, 'INVALID_DOCUMENT', opts, 'UNBOUND_ACTION');
  refused(d => { delete d.nodes[2].actionRefs[0].version; }, 'INVALID_DOCUMENT', opts, 'UNBOUND_ACTION');
  refused(d => { d.nodes[2].actionRefs[0].version = -1; }, 'INVALID_DOCUMENT', opts, 'UNBOUND_ACTION');
  refused(d => { d.bindings[0].version = 2; }, 'STALE_BINDING');
  refused(d => { d.bindings[0].provenanceRef = 'source.forged'; }, 'UNBOUND_BINDING');
  refused(d => { d.bindings[0].knowledgeRef = 'kb.other'; }, 'UNBOUND_BINDING');
  refused(d => { d.bindings[0].availability = 'stale'; }, 'BINDING_UNAVAILABLE');
  refused(d => { d.bindings[0].availability = 'revoked'; }, 'BINDING_UNAVAILABLE');
  refused(d => { d.bindings[0].availability = 'redacted'; }, 'BINDING_UNAVAILABLE');
  refused(d => { d.bindings[0].availability = 'deleted'; }, 'BINDING_UNAVAILABLE');
});

test('reject malformed trees, forged actions, injected text and unknown components by A', () => {
  refused(d => { d.nodes[1].id = 'root'; }, 'INVALID_DOCUMENT', opts, 'DUPLICATE_ID');
  refused(d => { d.nodes[0].children[0] = 'missing'; }, 'INVALID_DOCUMENT', opts, 'MISSING_REFERENCE');
  refused(d => { d.nodes[0].children = ['root']; }, 'INVALID_DOCUMENT', opts, 'CYCLE');
  refused(d => { d.nodes[1].type = 'iframe'; }, 'INVALID_DOCUMENT', opts, 'UNKNOWN_COMPONENT');
  refused(d => { d.nodes[1].props.description = '<svg/onload=alert(1)>'; }, 'INVALID_DOCUMENT', opts, 'UNSAFE_VALUE');
  refused(d => { d.nodes[1].props.description = 'javascript:alert(1)'; }, 'INVALID_DOCUMENT', opts, 'UNSAFE_VALUE');
  refused(d => { d.nodes[1].props.onclick = 'steal()'; }, 'INVALID_DOCUMENT', opts, 'UNSAFE_VALUE');
  refused(d => { d.nodes[2].actionRefs[0].id = 'unknown'; }, 'INVALID_DOCUMENT', opts, 'UNBOUND_ACTION');
  refused(d => { d.nodes[2].actionRefs = []; }, 'INVALID_DOCUMENT', opts, 'UNBOUND_ACTION');
  refused(d => { d.nodes[0].actionRefs = [{ ...action }]; }, 'INVALID_DOCUMENT', opts, 'UNBOUND_ACTION');
  refused(d => { d.bindings[0].readScope = 'admin'; }, 'INVALID_DOCUMENT', opts, 'INVALID_DOCUMENT');
  refused(d => { d.bindings[0].nodeId = 'root'; }, 'INVALID_DOCUMENT', opts, 'MISSING_REFERENCE');
});

test('reject B-incompatible cardinality, missing pins and unsupported options without widening authority', () => {
  const d = fixture(); d.nodes[2].actionRefs.push({ id: 'fixture.extra', version: 1 });
  const r = projectWave3ActionSemantics(d, { ...opts, knownActions: [...opts.knownActions, { id:'fixture.extra', version:1 }] });
  assert.equal(r.ok, false); if (!r.ok) assert.equal(r.code, 'INCOMPATIBLE_CARDINALITY');
  refused(() => {}, 'STALE_BINDING', { ...opts, knownBindings: [] });
  refused(() => {}, 'INVALID_OPTIONS', { ...opts, knownActions: undefined as any });
  refused(() => {}, 'INVALID_OPTIONS', { ...opts, knownBindings: undefined as any });
  refused(() => {}, 'INVALID_OPTIONS', { ...opts, expectedRevision: -1 });
  const input = fixture(); const copy = JSON.stringify(input);
  success(input); assert.equal(JSON.stringify(input), copy);
  assert.deepEqual(resolveWave3Reference(success(), 'a_unknown', 4), { ok: false, code: 'UNKNOWN_REFERENCE' });
});

test('hostile cycles and getters fail without evaluating the accessor', () => {
  const doc = fixture(); doc.nodes[1].props.loop = doc.nodes[1];
  refused(d => { d.nodes[1].props.loop = d.nodes[1]; }, 'INVALID_DOCUMENT', opts, 'CYCLE');
  let count = 0;
  const hostile = fixture();
  Object.defineProperty(hostile.nodes[1].props, 'description', { enumerable: true, get() { count++; throw Error('called'); }});
  const r = projectWave3ActionSemantics(hostile, opts);
  assert.equal(r.ok, false); assert.equal(count, 0);
});
