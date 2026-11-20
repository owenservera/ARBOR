# File: packages/tierflow/tests/visual-runtime/document-compat.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/document-compat.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 6383 B |
| Lines | 86 |
| Hash | d74c9bd858f8 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| opts | const | 5 | no | const opts={ownerRef:&#39;owner:fixture&#39;,workspaceRef:&#39;workspace:fixture&#39;,sourceRef:&#39;source:immutable&#39;}; |
| harness | function | 6 | no | function harness() { |
| LegacyHqObject | type | 16 | no | type LegacyHqObject={id:string;kind:string;title:string;parentId:string\|null; |
| hq | function | 18 | no | function hq():{schema:string;surfaceId:string;revision:number; |
| spatial | function | 24 | no | function spatial(){return {schemaVersion:1,world:{id:&#39;world-one&#39;,kind:&#39;home&#39;,title:&#39;Infinite 3D&#39;,unitsPerMeter:1,origin:{x:0,y:0,z:0}}, |
| r | const | 29 | no | const r=importLegacyUiDocument(harness(),opts);assert.equal(r.status,&#39;preview&#39;); |
| button | const | 33 | no | const button=r.document.nodes.find(n=&gt;n.id===&#39;btn&#39;);assert.equal(button?.type,&#39;text&#39;); |
| raw | const | 39 | no | const raw=harness();raw.tree.children[0]!.visibility=&#39;pc-private&#39;; |
| r | const | 40 | no | const r=importLegacyUiDocument(raw,opts); |
| h | const | 45 | no | const h=harness();h.catalogVersion=2;assert.equal(importLegacyUiDocument(h,opts).status,&#39;unavailable&#39;); |
| n | const | 46 | no | const n=harness();n.tree.children[0]!.type=&#39;provider-script&#39;;assert.equal(importLegacyUiDocument(n,opts).status,&#39;unavailable&#39;); |
| p | const | 47 | no | const p={schema:&#39;vivim.ui-proposal/1&#39;,surfaceId:&#39;my-space&#39;,baseRevision:8,operations:[]}; |
| r | const | 51 | no | const r=importLegacyUiDocument(hq(),opts);assert.equal(r.status,&#39;preview&#39;); |
| h | const | 60 | no | const h=hq();h.objects[&#39;note-1&#39;].hidden=true;assert.equal(importLegacyUiDocument(h,opts).status,&#39;unavailable&#39;); |
| q | const | 61 | no | const q=hq();q.objects[&#39;note-1&#39;].kind=&#39;embed&#39;;assert.equal(importLegacyUiDocument(q,opts).status,&#39;unavailable&#39;); |
| c | const | 62 | no | const c=hq();c.objects[&#39;frame-1&#39;].parentId=&#39;note-1&#39;;assert.equal(importLegacyUiDocument(c,opts).status,&#39;unavailable&#39;); |
| r | const | 65 | no | const r=importLegacyUiDocument(spatial(),opts);assert.equal(r.status,&#39;preview&#39;); |
| v | const | 67 | no | const v=r.document.views.find(v=&gt;v.kind===&#39;spatial&#39;);assert.equal(v?.kind,&#39;spatial&#39;); |
| h | const | 77 | no | const h=harness();h.tree.children[0]!.props.title=&#39;&lt;script&gt;alert(1)&lt;/script&gt;&#39;;assert.equal(importLegacyUiDocument(h,opts).status,&#39;unavailable&#39;); |
| cycle | const | 78 | no | const cycle:any=harness();cycle.tree.children.push(cycle.tree); |
| h | const | 82 | no | const h=harness();const r=importLegacyUiDocument(h,opts); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/document/import-legacy.ts | import | 3 | [packages/tierflow/src/visual-runtime/document/import-legacy.ts](../../src/visual-runtime/document/import-legacy.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 87 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
