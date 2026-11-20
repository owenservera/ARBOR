# File: apps/mobile-relay/test/design-composer.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/design-composer.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8161 B |
| Lines | 134 |
| Hash | 8454db6402f4 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| tree | function | 6 | no | const tree=(extra=[])=&gt;({id:&#39;root&#39;,type:&#39;stack&#39;,props:{direction:&#39;vertical&#39;,gap:&#39;md&#39;},children:[ {id:&#39;projects&#39;,type:&#39;card&#39;,props:{title:&#39;Projects&#39;,description:&#39;Selected work stays local&#39;},children:[… |
| surface | function | 10 | no | const surface=(over={})=&gt;({schema:&#39;vivim.ui-surface/1&#39;,surfaceId:&#39;my-space&#39;,revision:12,catalogVersion:1, theme:DEFAULT_THEME,tree:tree(),...over}); |
| base | function | 12 | no | const base=(over={})=&gt;({surface:surface(),selectedComponentIds:[&#39;projects&#39;],baseRevision:12, userRequest:&#39;Make my project area more visual&#39;,constraints:[&#39;Preserve Talk&#39;],sessionId:&#39;design-local-1&#39;,ta… |
| s | const | 16 | no | const s=surface(); |
| ctx | const | 17 | no | const ctx=composeDesignContext(base({surface:s})); |
| ctx | const | 37 | no | const ctx=composeDesignContext(base({selectedComponentIds:[&#39;projects&#39;,&#39;talk&#39;],surfaceId:&#39;my-space&#39;})); |
| wire | const | 43 | no | const wire=JSON.stringify(ctx); |
| ok | const | 66 | no | const ok=composeDesignContext(base({allowedComponents:[&#39;card&#39;,&#39;text&#39;]})); |
| refs | const | 71 | no | const refs=[{id:&#39;clm-private&#39;,sensitive:true}]; |
| s | const | 72 | no | const s=surface({tree:tree([{id:&#39;sourced&#39;,type:&#39;card&#39;,props:{title:&#39;Health&#39;,description:&#39;Secret detail&#39;,sourceRef:&#39;clm-private&#39;},children:[]}])}); |
| ctx | const | 73 | no | const ctx=composeDesignContext(base({surface:s,approvedRefs:refs,selectedComponentIds:[&#39;sourced&#39;]})); |
| wire | const | 75 | no | const wire=JSON.stringify(ctx); |
| withheld | const | 80 | no | const withheld=composeDesignContext(base({surface:surface(),approvedRefs:[{id:&#39;clm-other&#39;,approved:false}]})); |
| unapproved | const | 83 | no | const unapproved=surface({tree:tree([{id:&#39;leak&#39;,type:&#39;card&#39;,props:{title:&#39;Leak&#39;,sourceRef:&#39;clm-secret&#39;},children:[]}])}); |
| ctx | const | 110 | no | const ctx=composeDesignContext(base({constraints:[&#39;Preserve Talk&#39;,&#39;Preserve Talk&#39;,&#39;No code execution&#39;]})); |
| s | const | 119 | no | const s=surface(); |
| before | const | 120 | no | const before=JSON.stringify(s); |
| ctx | const | 121 | no | const ctx=composeDesignContext(base({surface:s})); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../generative-ui/catalog.mjs | import | 3 | [apps/mobile-relay/generative-ui/catalog.mjs](../generative-ui/catalog.mjs.md) |
| ../generative-ui/design-composer.mjs | import | 4 | [apps/mobile-relay/generative-ui/design-composer.mjs](../generative-ui/design-composer.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_THEME,TYPES,CATALOG_VERSION} from '../generative-ui/catalog.mjs';
import {composeDesignContext,DESIGN_CONTEXT_SCHEMA} from '../generative-ui/design-composer.mjs';

const tree=(extra=[])=>({id:'root',type:'stack',props:{direction:'vertical',gap:'md'},children:[
  {id:'projects',type:'card',props:{title:'Projects',description:'Selected work stays local'},children:[]},
  {id:'talk',type:'text',props:{value:'Talk stays protected'},children:[]},
  ...extra]});
const surface=(over={})=>({schema:'vivim.ui-surface/1',surfaceId:'my-space',revision:12,catalogVersion:1,
  theme:DEFAULT_THEME,tree:tree(),...over});
const base=(over={})=>({surface:surface(),selectedComponentIds:['projects'],baseRevision:12,
  userRequest:'Make my project area more visual',constraints:['Preserve Talk'],sessionId:'design-local-1',taskId:'change-42',...over});

test('valid context composes every documented field',()=>{
  const s=surface();
  const ctx=composeDesignContext(base({surface:s}));
  assert.equal(ctx.schema,DESIGN_CONTEXT_SCHEMA);
  assert.equal(ctx.schema,'vivim.design-context/1');
  assert.equal(ctx.sessionId,'design-local-1');
  assert.equal(ctx.taskId,'change-42');
  assert.equal(ctx.surfaceId,'my-space');
  assert.equal(ctx.baseRevision,12);
  assert.equal(ctx.baseRevision,s.revision);
  assert.deepEqual(ctx.selectedComponentIds,['projects']);
  assert.equal(ctx.deviceClass,'phone');
  assert.equal(ctx.rendererCatalogVersion,CATALOG_VERSION);
  assert.deepEqual(ctx.allowedComponents,[...TYPES]);
  assert.deepEqual(ctx.constraints,['Preserve Talk']);
  assert.equal(ctx.userRequest,'Make my project area more visual');
  assert.deepEqual(Object.keys(ctx),['schema','sessionId','taskId','surfaceId','baseRevision',
    'selectedComponentIds','deviceClass','rendererCatalogVersion','allowedComponents',
    'constraints','userRequest','contextSummary']);
});

test('contextSummary is presentation scope with selected labels only',()=>{
  const ctx=composeDesignContext(base({selectedComponentIds:['projects','talk'],surfaceId:'my-space'}));
  assert.equal(ctx.contextSummary.scope,'presentation');
  assert.deepEqual(ctx.contextSummary.items.map(i=>[i.componentId,i.type,i.label]),
    [['projects','card','Projects'],['talk','text','Talk stays protected']]);
  assert.deepEqual(ctx.contextSummary.omitted,['private-memory']);
  // No description, no children tree, no theme escapes into the outbound prompt.
  const wire=JSON.stringify(ctx);
  assert.equal(wire.includes('Selected work stays local'),false);
  assert.equal(wire.includes('"tree"'),false);
  assert.equal(wire.includes('"theme"'),false);
});

test('stale baseRevision is rejected (compare-and-swap)',()=>{
  for(const stale of [11,13]){
    assert.throws(()=>composeDesignContext(base({baseRevision:stale})),/UI_REJECTED/);
    assert.throws(()=>composeDesignContext(base({baseRevision:stale})),e=>e.code==='UI_REJECTED');
  }
  assert.throws(()=>composeDesignContext(base({baseRevision:undefined})),/UI_REJECTED/);
});

test('selected component id must exist in the surface',()=>{
  assert.throws(()=>composeDesignContext(base({selectedComponentIds:['ghost']})),/UI_REJECTED/);
  assert.throws(()=>composeDesignContext(base({selectedComponentIds:['../root']})),/UI_REJECTED/);
  assert.throws(()=>composeDesignContext(base({selectedComponentIds:['root','ghost']})),/UI_REJECTED/);
});

test('disallowed component in allowedComponents is rejected',()=>{
  assert.throws(()=>composeDesignContext(base({allowedComponents:['card','html']})),/UI_REJECTED/);
  assert.throws(()=>composeDesignContext(base({allowedComponents:['script']})),/UI_REJECTED/);
  const ok=composeDesignContext(base({allowedComponents:['card','text']}));
  assert.deepEqual(ok.allowedComponents,['card','text']);
});

test('private memory and sensitive refs are omitted, never forwarded',()=>{
  const refs=[{id:'clm-private',sensitive:true}];
  const s=surface({tree:tree([{id:'sourced',type:'card',props:{title:'Health',description:'Secret detail',sourceRef:'clm-private'},children:[]}])});
  const ctx=composeDesignContext(base({surface:s,approvedRefs:refs,selectedComponentIds:['sourced']}));
  assert.deepEqual(ctx.contextSummary.omitted,['private-memory','ref:clm-private']);
  const wire=JSON.stringify(ctx);
  assert.equal(wire.includes('Secret detail'),false);
  assert.equal(wire.includes('clm-private'),true,'ref is named, its content never inlined');
  assert.equal(ctx.contextSummary.items.length,1);
  // An explicitly withheld ref is still named, never inlined.
  const withheld=composeDesignContext(base({surface:surface(),approvedRefs:[{id:'clm-other',approved:false}]}));
```

_First 80 of 135 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
