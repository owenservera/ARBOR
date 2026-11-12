import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapCanonicalComponents, CANONICAL_COMPONENT_MAP_VERSION } from '../../src/visual-runtime/components/wave3-canonical-map.ts';
import { validateUiDocument } from '../../src/visual-runtime/document/validate.ts';
import { inspectComponent } from '../../src/visual-runtime/components/catalog.ts';

const ACTIONS = [{ id: 'fixture.preview', version: 1 }] as const;
function fixture(): Record<string, any> {
  return {
    schema: 'vivim.ui-document/1', documentId: 'document:founder', revision: 3,
    scope: { ownerRef: 'owner:fixture', workspaceRef: 'world:founder' }, rootId: 'root:main',
    nodes: [
      { id: 'root:main', type: 'stack', props: { direction: 'vertical', gap: 'md' }, children: ['grid:cards', 'action:preview'],
        a11y: { role: 'main', name: 'Founder Workspace' },
        layout: { phone: { maxWidth: 360 }, desktop: { maxWidth: 1280 } } },
      { id: 'grid:cards', type: 'grid', props: { columns: 4, gap: 'sm' }, children: ['card:today', 'text:evidence'],
        a11y: { role: 'group', name: 'Evidence overview' } },
      { id: 'card:today', type: 'card', props: { title: 'Today', description: 'Three updates pending review' }, children: [],
        a11y: { role: 'region', name: 'Today summary' }, bindingRefs: ['binding:today'] },
      { id: 'text:evidence', type: 'text', props: { value: 'Cited evidence', variant: 'body' }, children: [],
        a11y: { role: 'text', name: 'Cited evidence' } },
      { id: 'action:preview', type: 'button', props: { label: 'Preview changes' }, children: [],
        a11y: { role: 'button', name: 'Preview changes', focusOrder: 1 },
        actionRefs: [{ id: 'fixture.preview', version: 1 }] },
    ],
    bindings: [{ id: 'binding:today', version: 2, nodeId: 'card:today', field: 'summary',
      knowledgeRef: 'kb:sensitive-internal', provenanceRef: 'provenance:sensitive-internal',
      readScope: 'owner', availability: 'stale' }],
    views: [{ id: 'phone:2d', version: 1, kind: '2d', viewport: 'phone' }, { id: 'desktop:2d', version: 1, kind: '2d', viewport: 'desktop' }],
  };
}
function checked(source: unknown) { return mapCanonicalComponents(source, { knownActions: ACTIONS }); }
function unavailable(source: unknown, code: string) {
  const r = checked(source);
  assert.equal(r.ok, false, JSON.stringify(r));
  if (!r.ok) { assert.equal(r.code, code); assert.equal(r.unavailable, true); }
}

test('A -> B resolves measured description UNSAFE_PROP without expanding old catalog', () => {
  const original = fixture();
  assert.equal(validateUiDocument(original, { knownActions: ACTIONS }).ok, true);
  // Demonstrate that the legacy catalog really refuses the old A props verbatim.
  const direct = inspectComponent({ id: 'card', type: 'card', props: original.nodes[2].props });
  assert.equal(direct.ok, false);
  if (!direct.ok) assert.equal(direct.code, 'UNSAFE_PROP');
  const mapped = checked(original);
  assert.equal(mapped.ok, true, JSON.stringify(mapped));
  if (!mapped.ok) return;
  assert.equal(mapped.value.schema, CANONICAL_COMPONENT_MAP_VERSION);
  assert.equal(mapped.value.components.length, 6); // A's five + inert description paragraph
  assert.equal(mapped.value.components.find(n => n.id === 's_0')?.props.text, 'Three updates pending review');
  assert.equal(mapped.value.authority, 'inert-display-only');
  assert.ok(mapped.value.components.every(c => c.a11y.role.length > 0));
});

test('full-length valid Lane A description maps without artificial B accessible-name truncation', () => {
  const f = fixture(); f.nodes[2].props.description = 'X'.repeat(240);
  const r = checked(f); assert.equal(r.ok, true, JSON.stringify(r));
  if (r.ok) assert.equal(r.value.components.find(c => c.id === 's_0')?.props.text, f.nodes[2].props.description);
});

test('320/360/1280 have deterministic, overflow-free stack/grid plans and reduced motion', () => {
  const x = checked(fixture()); const y = checked(fixture());
  assert.deepEqual(x, y); assert.equal(x.ok, true);
  if (!x.ok) return;
  assert.deepEqual(x.value.viewports.map(v => v.viewportPx), [320, 360, 1280]);
  const grid = x.value.sourceRefs.find(n => n.sourceId === 'grid:cards' && !n.synthesized)!;
  assert.deepEqual(x.value.viewports.map(v => v.nodes.find(n => n.id === grid.id)!.resolved.columns), [1, 2, 2]);
  for (const viewport of x.value.viewports) for (const {resolved} of viewport.nodes) {
    assert.ok(resolved.widthPx <= viewport.viewportPx);
    assert.ok(resolved.itemWidthPx >= 44);
    assert.equal(resolved.motion, 'none');
  }
});

test('semantic provenance and exact action versions survive through inert crosswalk only', () => {
  const r = checked(fixture()); assert.equal(r.ok, true);
  if (!r.ok) return;
  const root = r.value.sourceRefs.find(x => x.sourceId === 'root:main')!;
  assert.equal(root.canonicalA11y.role, 'main');
  assert.equal(r.value.components.find(x => x.id === root.id)!.a11y.role, 'region');
  assert.deepEqual(r.value.actionRefs, [{ ref: 'a_0', sourceNodeId: 'action:preview', id: 'fixture.preview', version: 1, executable: false }]);
  assert.deepEqual(r.value.focusOrder, [r.value.sourceRefs.find(x => x.sourceId === 'action:preview')!.id]);
  assert.equal(r.value.bindingRefs[0]?.availability, 'stale');
  assert.equal(JSON.stringify(r.value).includes('kb:sensitive-internal'), false);
  assert.equal(JSON.stringify(r.value).includes('provenance:sensitive-internal'), false);
  assert.equal(JSON.stringify(r.value).includes('onClick'), false);
  assert.equal(JSON.stringify(r.value).includes('execute'), false);
  assert.ok(Object.isFrozen(r.value)); assert.ok(Object.isFrozen(r.value.components));
});

test('permuting the input node array cannot alter canonical identities or tab order', () => {
  const a = fixture(), b = fixture(); b.nodes.reverse();
  const left = checked(a), right = checked(b);
  assert.equal(left.ok, true); assert.equal(right.ok, true);
  if (!left.ok || !right.ok) return;
  assert.deepEqual(new Map(left.value.sourceRefs.map(r => [r.sourceId, r.id])), new Map(right.value.sourceRefs.map(r => [r.sourceId, r.id])));
  assert.deepEqual(left.value.focusOrder, right.value.focusOrder);
});

test('rich source types use typed inert text fallback, not executable custom components', () => {
  for (const [kind, props] of [
    ['profile-card', {title:'Profile', description:'Owner confirmed'}],
    ['project-card', {title:'Project', description:'Review pending'}],
    ['collection', {title:'Sources', items:[{label:'One', detail:'Verified'}]}],
    ['timeline', {title:'History', items:[{label:'Monday',detail:'Complete'}]}],
    ['chart', {title:'Progress', items:[{label:'Coverage',value:42}]}],
  ] as const) {
    const f = fixture(); f.nodes[2].type = kind; f.nodes[2].props = props;
    const r = checked(f); assert.equal(r.ok, true, `${kind}: ${JSON.stringify(r)}`);
    if (r.ok) {
      const c = r.value.sourceRefs.find(n => n.sourceId === 'card:today' && !n.synthesized)!;
      assert.equal(r.value.components.find(n => n.id === c.id)?.type, 'card');
      assert.ok(r.value.sourceRefs.some(n => n.sourceId === 'card:today' && n.synthesized));
    }
  }
});

test('unregistered component and version mismatch or missing action fail at Lane A boundary', () => {
  const unknown = fixture(); unknown.nodes[2].type = 'iframe'; unavailable(unknown, 'INVALID_CANONICAL_DOCUMENT');
  const changed = fixture(); changed.nodes[4].actionRefs[0].version = 2; unavailable(changed, 'INVALID_CANONICAL_DOCUMENT');
  const unversioned = fixture(); delete unversioned.nodes[4].actionRefs[0].version; unavailable(unversioned, 'INVALID_CANONICAL_DOCUMENT');
  const missing = fixture(); missing.nodes[4].actionRefs = []; unavailable(missing, 'INVALID_CANONICAL_DOCUMENT');
  const other = fixture(); other.nodes[4].actionRefs = [{ id: 'unknown', version: 1 }]; unavailable(other, 'INVALID_CANONICAL_DOCUMENT');
});

test('hidden executable, arbitrary DOM handlers, HTML and URL injection always fail closed', () => {
  for (const [key, value] of [['hidden', true], ['innerHTML', '<svg onload=alert(1)>'], ['onclick', 'send()'], ['href', 'javascript:alert(1)']]) {
    const f = fixture(); f.nodes[4].props[key as string] = value;
    unavailable(f, 'INVALID_CANONICAL_DOCUMENT');
  }
  for (const text of ['<img src=x onerror=alert(1)>', 'javascript:evil()', 'https://evil.invalid']) {
    const f = fixture(); f.nodes[2].props.description = text; unavailable(f, 'INVALID_CANONICAL_DOCUMENT');
  }
  const invisible = fixture(); invisible.nodes[4].a11y.name = ' '; unavailable(invisible, 'INVALID_CANONICAL_DOCUMENT');
});

test('missing or weakened accessible focus/name, too-small touch target, and live announcement cannot be upgraded', () => {
  const unnamed = fixture(); delete unnamed.nodes[4].a11y.name; unavailable(unnamed, 'INVALID_CANONICAL_DOCUMENT');
  const hidden = fixture(); delete hidden.nodes[4].a11y.focusOrder; unavailable(hidden, 'INVALID_CANONICAL_DOCUMENT');
  const target = fixture(); target.nodes[4].a11y.touchTargetPx = 20; unavailable(target, 'INVALID_CANONICAL_DOCUMENT');
  const live = fixture(); live.nodes[3].a11y.live = 'polite'; unavailable(live, 'INVALID_A11Y');
});

test('non-representable horizontal stack and min width refuse, never silently clamp', () => {
  const horizontal = fixture(); horizontal.nodes[0].props.direction = 'horizontal'; unavailable(horizontal, 'INVALID_LAYOUT');
  const wide = fixture(); wide.nodes[1].layout = { minWidth: 500 }; unavailable(wide, 'INVALID_LAYOUT');
  const zeroWidth = fixture(); zeroWidth.nodes[1].layout = { maxWidth: 0 }; unavailable(zeroWidth, 'INVALID_LAYOUT');
});

test('A numeric focus order conflicting with DOM traversal refuses rather than silently reordering', () => {
  const f = fixture(); f.nodes[0].children.unshift('button:prior');
  f.nodes.push({ id: 'button:prior', type: 'button', props: {label:'Second review'}, children:[],
    a11y:{role:'button',name:'Second review',focusOrder:2}, actionRefs:[{id:'fixture.preview',version:1}] });
  unavailable(f, 'FOCUS_ORDER_CONFLICT');
});

test('multiple A actionRefs (accepted by A) refuse B single-reference assumption', () => {
  const f = fixture(); f.nodes[4].actionRefs.push({ id: 'fixture.secondary', version: 1 });
  const r = mapCanonicalComponents(f, { knownActions: [...ACTIONS, { id: 'fixture.secondary', version: 1 }] });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.code, 'ACTION_ARITY');
});

test('unrepresentable fanout/size refuses without truncation', () => {
  const f = fixture(); f.nodes[2].type = 'collection';
  f.nodes[2].props = {title:'Large set', items:Array.from({length:16}, (_,i)=>({label:`Item ${i}`}))};
  // Under cap this is supported, but simultaneous 4 collections can exceed B's 64-node cap.
  for(let i=0;i<3;i++) {
    const id = `more:${i}`;
    f.nodes[1].children.push(id);
    f.nodes.push({id,type:'collection',props:{title:'Large set',items:Array.from({length:16},(_,j)=>({label:`Item ${j}`}))},children:[],a11y:{role:'region',name:'Large set'}});
  }
  unavailable(f, 'COMPONENT_LIMIT');
});

test('no hostile accessor, non-JSON function, prototype pollution or caller mutation allowed', () => {
  let invoked = 0;
  const getter = fixture(); Object.defineProperty(getter.nodes[2].props, 'title', { enumerable:true, get() {invoked++; throw Error('must not execute');} });
  unavailable(getter, 'INVALID_CANONICAL_DOCUMENT'); assert.equal(invoked, 0);
  const func = fixture(); func.nodes[4].props.onClick = () => invoked++;
  unavailable(func, 'INVALID_CANONICAL_DOCUMENT'); assert.equal(invoked, 0);
  const pollution = fixture(); Object.defineProperty(pollution.nodes[2].props, '__proto__', {enumerable:true,value:{isAdmin:true}});
  unavailable(pollution, 'INVALID_CANONICAL_DOCUMENT');
  const original = fixture(), snapshot = JSON.stringify(original); checked(original);
  assert.equal(JSON.stringify(original), snapshot);
});
