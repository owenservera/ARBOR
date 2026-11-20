# File: apps/mobile-relay/test/bootstrap-f02.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/bootstrap-f02.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2449 B |
| Lines | 43 |
| Hash | 3be2a14fdb65 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| example | function | 5 | no | const example=()=&gt;({schema:F02_SCHEMA,pass:&#39;F02&#39;,provisional:false, visual:{background:&#39;#10191c&#39;,secondary:&#39;#183b3c&#39;,accent:&#39;#7fc6bc&#39;, appearance:&#39;dark&#39;,texture:&#39;aurora&#39;,mood:&#39;focused&#39;,fontFamily:&#39;hu… |
| out | const | 14 | no | const out=compileF02RenderPlan(JSON.stringify(example()),{worldId:&#39;world-example&#39;,requestId:&#39;request-1&#39;,revision:1}); |
| value | const | 27 | no | const value=example();value.visual={...value.visual,...change}; |
| data | const | 38 | no | const data=example();data.preferences[0].confidence=2; |
| good | const | 40 | no | const good=example();good.visual.motion=&#39;slow&#39;; |
| compiled | const | 41 | no | const compiled=compileF02RenderPlan(good,{worldId:&#39;world-1&#39;,requestId:&#39;req-1&#39;,reducedMotion:true}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../bootstrap-f02.mjs | import | 3 | [apps/mobile-relay/bootstrap-f02.mjs](../bootstrap-f02.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { F02_SCHEMA, F02_FONT_STACKS, parseF02Response, compileF02RenderPlan } from '../bootstrap-f02.mjs';

const example=()=>({schema:F02_SCHEMA,pass:'F02',provisional:false,
 visual:{background:'#10191c',secondary:'#183b3c',accent:'#7fc6bc',
 appearance:'dark',texture:'aurora',mood:'focused',fontFamily:'humanist',
 fontSizePx:15,headingSizePx:28,radiusPx:14,spacingScale:1.05,
 density:'comfortable',motion:'still'},
 preferences:[{trait:'Dark technical interfaces',basis:'explicit',confidence:.9,scope:'work'}],
 dislikes:[],unknowns:['Favorite typeface']});

test('F02 compiles specific colors, font, size and geometry',()=>{
 const out=compileF02RenderPlan(JSON.stringify(example()),{worldId:'world-example',requestId:'request-1',revision:1});
 assert.equal(out.cssVariables['--bg'],'#10191c');
 assert.equal(out.cssVariables['--ac'],'#7fc6bc');
 assert.equal(out.cssVariables['--vivim-font-family'],F02_FONT_STACKS.humanist);
 assert.equal(out.cssVariables['--vivim-base-font-size'],'15px');
 assert.equal(out.cssVariables['--vivim-heading-font-size'],'28px');
 assert.equal(out.cssVariables['--vivim-corner-radius'],'14px');
 assert.equal(out.theme.source.ref,'request-1');
 assert.equal(out.status,'suggested');
});
test('F02 rejects invalid fields and unbounded values',()=>{
 for(const change of [{fontFamily:'not-a-font'},{fontSizePx:60},{radiusPx:40},
   {spacingScale:3},{background:'red'},{texture:'unsupported'}]){
  const value=example();value.visual={...value.visual,...change};
  assert.throws(()=>parseF02Response(value),TypeError);
 }
 assert.throws(()=>parseF02Response({...example(),unexpected:true}));
});
test('model cannot grant itself approval or forge world scope',()=>{
 assert.throws(()=>parseF02Response({...example(),approval:'yes'}));
 assert.throws(()=>compileF02RenderPlan(example(),{worldId:'../other',requestId:'request-1'}));
 assert.throws(()=>compileF02RenderPlan(example(),{worldId:'world-ok',requestId:'bad request'}));
});
test('preference qualification and motion preferences are bounded',()=>{
 const data=example();data.preferences[0].confidence=2;
 assert.throws(()=>parseF02Response(data));
 const good=example();good.visual.motion='slow';
 const compiled=compileF02RenderPlan(good,{worldId:'world-1',requestId:'req-1',reducedMotion:true});
 assert.equal(compiled.motion,'still');
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
