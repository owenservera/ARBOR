import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  UI_DOMAINS, UI_FAMILIES, UI_PROPERTIES, UI_TRAITS, UI_OVERRIDES, UI_SOURCE_BINDINGS
} from '../vec/ui-taxonomy/catalog.mjs';
import {
  UI_TAXONOMY_COUNTS, UI_IDENTITY_SCHEMA, UI_EXTENSION_SCHEMA,
  listUiDomains, listUiFamilies, listUiComponents, findUiComponent, getUiComponent,
  resolveUiSourceIdentity, inspectUiExtensionProposal, exportUiTaxonomy
} from '../vec/ui-taxonomy/registry.mjs';
import { TYPES as PWA_TYPES, createSurface } from '../generative-ui/catalog.mjs';
import { resolveBuildRequest } from '../build-composer.mjs';

const machine=JSON.parse(readFileSync(new URL('../../../.integration/proposal5/vec-pwa/machine/ui-taxonomy.v1.json', import.meta.url),'utf8'));
const source=(path)=>readFileSync(new URL('../../../'+path,import.meta.url),'utf8');
function extractArray(path,name) {
  const src=source(path);
  const re=new RegExp('export const '+name+' = \\[([\\s\\S]*?)\\] as const;');
  const m=re.exec(src);
  assert.ok(m,'missing declared source list '+name);
  return [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map(x=>x[1]);
}
const nativeTypesFor=schema=>[...new Set(UI_SOURCE_BINDINGS.filter(x=>x[0]===schema).map(x=>x[1]))].sort();
test('taxonomy canonical machine snapshot is exactly equal to runtime catalog, not a drifting duplicate',()=>{
  const projection=exportUiTaxonomy();
  assert.equal(machine.schema,projection.schema);
  for(const key of ['domains','families','properties','traits','overrides','sourceBindings'])
    assert.deepEqual(machine[key],projection[key],key);
  assert.deepEqual(machine.counts,UI_TAXONOMY_COUNTS);
});
test('complete typed taxonomy has distinct versioned IDs across all 9 domains and 34 families',()=>{
  assert.equal(listUiDomains().length,9);
  assert.equal(listUiFamilies().length,34);
  assert.equal(UI_TAXONOMY_COUNTS.components,417);
  const all=listUiComponents();
  assert.equal(all.length,417);
  assert.equal(new Set(all.map(x=>x.id)).size,417);
  for(const x of all) {
    assert.equal(x.schema,UI_IDENTITY_SCHEMA);
    assert.match(x.id,/^vivim\.ui\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*@1$/);
    assert.equal(x.runtimeAuthorized,false);
    assert.ok(Object.hasOwn(UI_DOMAINS,x.domain));
    assert.ok(x.contract.accessibility.role);
    assert.ok(Array.isArray(x.contract.events));
    assert.ok(Array.isArray(x.contract.states));
    for(const name of Object.keys(x.contract.properties))assert.ok(Object.hasOwn(UI_PROPERTIES,name));
    for(const impl of x.implementations)assert.ok(['source-closed','fixture-inspector-only','world-shape-only'].includes(impl.state));
  }
});
test('slider has declarative value-range behavior with keyboard and a11y contract but no PWA runtime claim',()=>{
  const slider=getUiComponent('vivim.ui.input.numeric.slider@1');
  assert.ok(slider);
  assert.equal(slider.contract.accessibility.role,'slider');
  assert.equal(slider.contract.accessibility.keyboard,'arrows');
  assert.equal(slider.contract.properties.min.type,'number');
  assert.equal(slider.contract.properties.step.type,'number');
  assert.ok(slider.contract.events.includes('commit'));
  assert.equal(slider.availability,'taxonomy-only');
  assert.equal(resolveUiSourceIdentity({schema:'vivim.ui-surface/1',nativeType:'slider'}).outcome,'not_mapped');
});
test('querying identity/families/traits is bounded and ambiguous kinds cannot silently resolve',()=>{
  assert.equal(findUiComponent('slider').outcome,'found');
  assert.equal(findUiComponent('missing').outcome,'not_found');
  assert.equal(getUiComponent('slider'),null);
  assert.ok(listUiComponents({trait:'interactive'}).length>20);
  assert.equal(listUiComponents({limit:501}).length,0);
  assert.deepEqual(listUiFamilies({domain:'nonexistent'}),[]);
  assert.equal(listUiComponents({domain:'input'}).every(x=>x.domain==='input'),true);
});
test('PWA source mapping matches EXACT current closed renderer TYPES, including heading variant',()=>{
  assert.deepEqual(nativeTypesFor('vivim.ui-surface/1'),[...PWA_TYPES].sort());
  const heading=resolveUiSourceIdentity({schema:'vivim.ui-surface/1',nativeType:'text',props:{variant:'heading'}});
  const body=resolveUiSourceIdentity({schema:'vivim.ui-surface/1',nativeType:'text',props:{variant:'body'}});
  assert.equal(heading.component.kind,'heading');
  assert.equal(body.component.kind,'text');
  assert.equal(heading.source.status,'source-closed');
  assert.equal(heading.runtimeAuthorized,false);
});
test('TierFlow document/inspector/World mapping matches current source declarations, no inferred executable parity',()=>{
  const visual=extractArray('packages/tierflow/src/visual-runtime/document/schema.ts','UI_DOCUMENT_NODE_TYPES');
  const inspector=extractArray('packages/tierflow/src/visual-runtime/components/catalog.ts','COMPONENT_TYPES');
  const shapes=extractArray('packages/tierflow/src/ui/types.ts','UI_SHAPE_KINDS');
  assert.deepEqual(nativeTypesFor('vivim.ui-document/1'),visual.sort());
  assert.deepEqual(nativeTypesFor('tierflow.component-inspector/1'),inspector.sort());
  assert.deepEqual(nativeTypesFor('tierflow.world-shape/1'),shapes.sort());
  assert.equal(resolveUiSourceIdentity({schema:'tierflow.world-shape/1',nativeType:'sphere'}).source.status,'world-shape-only');
});
test('taxonomy is actually used by the first VEC PWA reprogramming adapter',()=>{
  const out=resolveBuildRequest({request:'Add a card called Research',surface:createSurface()});
  assert.equal(out.outcome,'candidate');
  assert.equal(out.preview.persisted,false);
  assert.equal(out.authorization,'none');
  const unknown=resolveUiSourceIdentity({schema:'vivim.ui-document/1',nativeType:'iframe'});
  assert.equal(unknown.outcome,'not_mapped');
});
test('extensions are inert proposals, cannot register renderer types or runtime grants',()=>{
  const valid={schema:UI_EXTENSION_SCHEMA,domain:'input',family:'numeric',kind:'analog-meter',
    label:'Analog Meter',properties:['value','min','max'],traits:['interactive'],events:['change'],a11yRole:'slider'};
  const out=inspectUiExtensionProposal(valid);
  assert.equal(out.outcome,'candidate');
  assert.equal(out.installed,false);assert.equal(out.authorized,false);
  assert.equal(getUiComponent(out.descriptor.id),null);
  assert.equal(inspectUiExtensionProposal({...valid,kind:'slider'}).code,'IDENTITY_ALREADY_REGISTERED');
  assert.equal(inspectUiExtensionProposal({...valid,execute:'eval()'}).outcome,'refused');
  assert.equal(inspectUiExtensionProposal({...valid,label:'<script>'}).outcome,'refused');
  assert.equal(inspectUiExtensionProposal({...valid,properties:['eval']}).outcome,'refused');
  assert.equal(inspectUiExtensionProposal({...valid,traits:['grant-admin']}).outcome,'refused');
  assert.equal(inspectUiExtensionProposal({...valid,events:['onClick=eval']}).outcome,'refused');
  const weird=Object.defineProperty({...valid},'label',{get(){throw new Error('never call');}});
  assert.equal(inspectUiExtensionProposal(weird).code,'NOT_PLAIN_DATA');
});
test('new taxonomy modules are read-only static shell assets in Direct Host and SW, never API cache',()=>{
  const host=source('apps/vivim-host/direct-phone.mjs');
  const sw=source('apps/mobile-relay/sw.js');
  for(const file of ['vec/ui-taxonomy/catalog.mjs','vec/ui-taxonomy/registry.mjs']){
    assert.ok(host.includes("'"+file+"': ['"+file+"'"));
    assert.ok(sw.includes("'"+file+"'"));
  }
  assert.ok(sw.includes("if (url.pathname.indexOf('/api/') !== -1) return false"));
});
