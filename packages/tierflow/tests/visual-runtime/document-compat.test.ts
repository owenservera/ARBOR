import test from 'node:test';
import assert from 'node:assert/strict';
import { importLegacyUiDocument } from '../../src/visual-runtime/document/import-legacy.ts';

const opts={ownerRef:'owner:fixture',workspaceRef:'workspace:fixture',sourceRef:'source:immutable'};
function harness() {
  return {schema:'vivim.ui-surface/1',surfaceId:'my-space',revision:8,catalogVersion:1,
    theme:{appearance:'dark'},tree:{id:'root',type:'stack',props:{direction:'vertical'},visibility:'phone',children:[
      {id:'today',type:'card',props:{title:'Today',sourceRef:'source:old'},visibility:'phone',children:[]},
      {id:'btn',type:'button',props:{label:'Send',intent:'preview-only'},visibility:'phone',children:[]},
    ]}};
}
// I2-C step 2: explicit legacy HQ object type so the deliberate invalid mutations
// below (hidden flag, unsupported kind, re-parented node) type-check without `any`
// and without weakening the importer. Type-only: the emitted fixture is unchanged.
type LegacyHqObject={id:string;kind:string;title:string;parentId:string|null;
  rect:{x:number;y:number;w:number;h:number};z?:number;props?:{safe:string};hidden?:boolean};
function hq():{schema:string;surfaceId:string;revision:number;
  objects:{'frame-1':LegacyHqObject;'note-1':LegacyHqObject};
  edges:{edge1:{from:string;to:string}}}{return {schema:'vivim.surface/1',surfaceId:'workspace-ui',revision:2,
  objects:{'frame-1':{id:'frame-1',kind:'frame',title:'My stack',parentId:null,rect:{x:1,y:2,w:10,h:20},z:4},
    'note-1':{id:'note-1',kind:'note',title:'Important note',parentId:'frame-1',rect:{x:5,y:2,w:100,h:80},props:{safe:'anything'}}},
  edges:{edge1:{from:'frame-1',to:'note-1'}}};}
function spatial(){return {schemaVersion:1,world:{id:'world-one',kind:'home',title:'Infinite 3D',unitsPerMeter:1,origin:{x:0,y:0,z:0}},
  objects:[{id:'sphere-one',shape:'sphere',transform:{position:{x:100,y:20,z:7}},title:'Sphere'}],relationships:[{id:'edge-1',from:'sphere-one',to:'other',kind:'drives'}],
  dataFlows:[{id:'flow-one',direction:'outbound',targetObject:'sphere-one',targetProp:'title',path:'/outside'}]};}

test('Harness 2D tree imports inert 2D with stable IDs and unbound button disabled',()=>{
  const r=importLegacyUiDocument(harness(),opts);assert.equal(r.status,'preview');
  if(r.status!=='preview')return;
  assert.equal(r.document.documentId,'doc:my-space');assert.equal(r.document.revision,8);
  assert.equal(r.document.nodes.find(n=>n.id==='today')?.type,'card');
  const button=r.document.nodes.find(n=>n.id==='btn');assert.equal(button?.type,'text');
  assert.ok(r.losses.some(l=>l.code==='ACTION_UNBOUND'));assert.ok(r.losses.some(l=>l.code==='SOURCE_REF_UNBOUND'));
  assert.deepEqual(r.document.bindings,[]);assert.ok(Object.isFrozen(r.provenance.original));
  assert.equal(r.provenance.authorizedForRendering,false);assert.equal(r.readOnly,true);
});
test('Harness private branch refuses entire import without leaking any document or evidence',()=>{
  const raw=harness();raw.tree.children[0]!.visibility='pc-private';
  const r=importLegacyUiDocument(raw,opts);
  assert.equal(r.status,'unavailable');assert.equal(r.document,null);assert.equal(r.provenance,null);
  assert.ok(r.losses.some(l=>l.code==='PRIVATE_CONTENT_REFUSED'));
});
test('Unknown Harness catalog/node and proposal fail closed, cannot synthesize an authority',()=>{
  const h=harness();h.catalogVersion=2;assert.equal(importLegacyUiDocument(h,opts).status,'unavailable');
  const n=harness();n.tree.children[0]!.type='provider-script';assert.equal(importLegacyUiDocument(n,opts).status,'unavailable');
  const p={schema:'vivim.ui-proposal/1',surfaceId:'my-space',baseRevision:8,operations:[]};
  assert.equal(importLegacyUiDocument(p,opts).status,'unavailable');
});
test('HQ semantic tree maps explicit parent IDs, drops geometry/untrusted props and edges',()=>{
  const r=importLegacyUiDocument(hq(),opts);assert.equal(r.status,'preview');
  if(r.status!=='preview')return;
  assert.equal(r.document.nodes.find(n=>n.id==='frame-1')?.children[0],'note-1');
  assert.ok(r.losses.some(l=>l.code==='LEGACY_LAYOUT_LOST'));
  assert.ok(r.losses.some(l=>l.code==='LEGACY_PROPS_LOST'));
  assert.ok(r.losses.some(l=>l.code==='LEGACY_RELATION_LOST'));
  assert.ok(!JSON.stringify(r.document).includes('"rect"'));
});
test('HQ hidden private/unknown object and cycles refuse; no geometry-derived IDs',()=>{
  const h=hq();h.objects['note-1'].hidden=true;assert.equal(importLegacyUiDocument(h,opts).status,'unavailable');
  const q=hq();q.objects['note-1'].kind='embed';assert.equal(importLegacyUiDocument(q,opts).status,'unavailable');
  const c=hq();c.objects['frame-1'].parentId='note-1';assert.equal(importLegacyUiDocument(c,opts).status,'unavailable');
});
test('Spatial source is preserved as separate frozen evidence, with accessible 2D fallback and no outbound flow',()=>{
  const r=importLegacyUiDocument(spatial(),opts);assert.equal(r.status,'preview');
  if(r.status!=='preview')return;
  const v=r.document.views.find(v=>v.kind==='spatial');assert.equal(v?.kind,'spatial');
  if(v?.kind==='spatial')assert.equal(v.fallbackViewId,'view.desktop');
  assert.ok(r.losses.some(l=>l.code==='SPATIAL_UNSUPPORTED'));
  assert.ok(r.losses.some(l=>l.code==='OUTBOUND_FLOW_REFUSED'));
  assert.ok(!JSON.stringify(r.document).includes('"direction":"outbound"'));
  assert.ok(Object.isFrozen(r.provenance.original));
  assert.ok(Object.isFrozen((r.provenance.original as any).objects));
});
test('Unsupported source version, hostile executable source and cyclic source fail read only',()=>{
  assert.equal(importLegacyUiDocument({schema:'vivim.surface/2'},opts).status,'unavailable');
  const h=harness();h.tree.children[0]!.props.title='<script>alert(1)</script>';assert.equal(importLegacyUiDocument(h,opts).status,'unavailable');
  const cycle:any=harness();cycle.tree.children.push(cycle.tree);
  assert.equal(importLegacyUiDocument(cycle,opts).status,'unavailable');
});
test('Importer never mutates input, and changing legacy source does not alter snapshot',()=>{
  const h=harness();const r=importLegacyUiDocument(h,opts);
  assert.equal(r.status,'preview');if(r.status!=='preview')return;
  h.tree.children[0]!.props.title='Changed later';
  assert.equal((r.provenance.original as any).tree.children[0].props.title,'Today');
});
