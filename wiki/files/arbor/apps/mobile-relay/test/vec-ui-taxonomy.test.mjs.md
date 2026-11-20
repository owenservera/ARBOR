# File: apps/mobile-relay/test/vec-ui-taxonomy.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/vec-ui-taxonomy.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8615 B |
| Lines | 136 |
| Hash | 900d461fa163 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| machine | const | 15 | no | const machine=JSON.parse(readFileSync(new URL(&#39;../../../.integration/proposal5/vec-pwa/machine/ui-taxonomy.v1.json&#39;, import.meta.url),&#39;utf8&#39;)); |
| source | function | 16 | no | const source=(path)=&gt;readFileSync(new URL(&#39;../../../&#39;+path,import.meta.url),&#39;utf8&#39;); |
| extractArray | function | 17 | no | function extractArray(path,name) { |
| src | const | 18 | no | const src=source(path); |
| re | const | 19 | no | const re=new RegExp(&#39;export const &#39;+name+&#39; = \\\\[([\\\\s\\\\S]*?)\\\\] as const;&#39;); |
| m | const | 20 | no | const m=re.exec(src); |
| nativeTypesFor | function | 24 | no | const nativeTypesFor=schema=&gt;[...new Set(UI_SOURCE_BINDINGS.filter(x=&gt;x[0]===schema).map(x=&gt;x[1]))].sort(); |
| projection | const | 26 | no | const projection=exportUiTaxonomy(); |
| all | const | 37 | no | const all=listUiComponents(); |
| slider | const | 53 | no | const slider=getUiComponent(&#39;vivim.ui.input.numeric.slider@1&#39;); |
| heading | const | 74 | no | const heading=resolveUiSourceIdentity({schema:&#39;vivim.ui-surface/1&#39;,nativeType:&#39;text&#39;,props:{variant:&#39;heading&#39;}}); |
| body | const | 75 | no | const body=resolveUiSourceIdentity({schema:&#39;vivim.ui-surface/1&#39;,nativeType:&#39;text&#39;,props:{variant:&#39;body&#39;}}); |
| visual | const | 82 | no | const visual=extractArray(&#39;packages/tierflow/src/visual-runtime/document/schema.ts&#39;,&#39;UI_DOCUMENT_NODE_TYPES&#39;); |
| inspector | const | 83 | no | const inspector=extractArray(&#39;packages/tierflow/src/visual-runtime/components/catalog.ts&#39;,&#39;COMPONENT_TYPES&#39;); |
| shapes | const | 84 | no | const shapes=extractArray(&#39;packages/tierflow/src/ui/types.ts&#39;,&#39;UI_SHAPE_KINDS&#39;); |
| out | const | 91 | no | const out=resolveBuildRequest({request:&#39;Add a card called Research&#39;,surface:createSurface()}); |
| unknown | const | 95 | no | const unknown=resolveUiSourceIdentity({schema:&#39;vivim.ui-document/1&#39;,nativeType:&#39;iframe&#39;}); |
| valid | const | 99 | no | const valid={schema:UI_EXTENSION_SCHEMA,domain:&#39;input&#39;,family:&#39;numeric&#39;,kind:&#39;analog-meter&#39;, |
| out | const | 101 | no | const out=inspectUiExtensionProposal(valid); |
| weird | const | 111 | no | const weird=Object.defineProperty({...valid},&#39;label&#39;,{get(){throw new Error(&#39;never call&#39;);}}); |
| host | const | 115 | no | const host=source(&#39;apps/vivim-host/direct-phone.mjs&#39;); |
| sw | const | 116 | no | const sw=source(&#39;apps/mobile-relay/sw.js&#39;); |
| passport | const | 125 | no | const passport=JSON.parse(readFileSync(new URL(&#39;../../../.integration/proposal5/vec-pwa/machine/ui-component-passports.v1.json&#39;,import.meta.url),&#39;utf8&#39;)); |
| components | const | 126 | no | const components=listUiComponents(); |
| x | const | 130 | no | const x=components[i],p=passport.descriptors[i]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| ../vec/ui-taxonomy/catalog.mjs | import | 4 | [apps/mobile-relay/vec/ui-taxonomy/catalog.mjs](../vec/ui-taxonomy/catalog.mjs.md) |
| ../vec/ui-taxonomy/registry.mjs | import | 7 | [apps/mobile-relay/vec/ui-taxonomy/registry.mjs](../vec/ui-taxonomy/registry.mjs.md) |
| ../generative-ui/catalog.mjs | import | 12 | [apps/mobile-relay/generative-ui/catalog.mjs](../generative-ui/catalog.mjs.md) |
| ../build-composer.mjs | import | 13 | [apps/mobile-relay/build-composer.mjs](../build-composer.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
  assert.deepEqual([machine.counts.domains,machine.counts.families,machine.counts.kinds,machine.counts.mappings],
    [UI_TAXONOMY_COUNTS.domains,UI_TAXONOMY_COUNTS.families,UI_TAXONOMY_COUNTS.components,UI_TAXONOMY_COUNTS.sourceBindings]);
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
```

_First 80 of 137 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
