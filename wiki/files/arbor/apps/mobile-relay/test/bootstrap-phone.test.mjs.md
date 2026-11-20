# File: apps/mobile-relay/test/bootstrap-phone.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/bootstrap-phone.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2894 B |
| Lines | 58 |
| Hash | a52f99b29e25 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| projection | function | 6 | no | const projection=(worldId=&#39;world-a&#39;)=&gt;({ schema:PROJECTION_SCHEMA,worldId,observedAt:new Date().toISOString(), phase:&#39;shaping&#39;,themeStatus:&#39;active&#39;,revision:0,source:&#39;owner-choice&#39;, cssVariables:{&#39;--… |
| storage | function | 15 | no | const storage=()=&gt;{ |
| map | const | 16 | no | const map=new Map(); |
| p | const | 22 | no | const p=projection(); |
| st | const | 29 | no | const st=storage(); |
| entries | const | 37 | no | const entries=Object.fromEntries(cssEntries(projection())); |
| st | const | 51 | no | const st=storage(), first=projection(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../bootstrap-phone.mjs | import | 3 | [apps/mobile-relay/bootstrap-phone.mjs](../bootstrap-phone.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {readProjection,cacheProjection,readCachedProjection,cssEntries,undoCommand,
  PROJECTION_SCHEMA, PROJECTION_CACHE_KEY} from '../bootstrap-phone.mjs';

const projection=(worldId='world-a')=>({
  schema:PROJECTION_SCHEMA,worldId,observedAt:new Date().toISOString(),
  phase:'shaping',themeStatus:'active',revision:0,source:'owner-choice',
  cssVariables:{'--bg':'#10191c','--ac':'#7fc6bc',
    '--vivim-background-image':'linear-gradient(145deg, #10191c, #183b3c)',
    '--unexpected-token':'x', '--tx':'red;position:absolute',
    '--s1':'url(https://unsafe.invalid/a)'},
  undo:{available:true},progress:{passes:[]}
});
const storage=()=>{
  const map=new Map();
  return {getItem:key=>map.get(key)??null,setItem:(key,val)=>map.set(key,val),
    removeItem:key=>map.delete(key)};
};

test('status reads only the expected Host bootstrap projection',()=>{
  const p=projection();
  assert.equal(readProjection({snapshot:{bootstrap:p}}).worldId,'world-a');
  assert.equal(readProjection({snapshot:{personalAgent:{bootstrap:p}}}).schema,PROJECTION_SCHEMA);
  assert.equal(readProjection({snapshot:{bootstrap:{...p,schema:'unknown'}}}),null);
  assert.equal(readProjection(null),null);
});
test('World-scoped cache stays bounded and supports explicit reset on re-pair',()=>{
  const st=storage();
  assert.equal(cacheProjection(st,projection()),true);
  assert.equal(readCachedProjection(st).worldId,'world-a');
  assert.ok(st.getItem(PROJECTION_CACHE_KEY));
  st.removeItem(PROJECTION_CACHE_KEY);
  assert.equal(readCachedProjection(st),null);
});
test('only explicitly supported safe CSS variables survive projection',()=>{
  const entries=Object.fromEntries(cssEntries(projection()));
  assert.equal(entries['--bg'],'#10191c');
  assert.equal(entries['--ac'],'#7fc6bc');
  assert.equal(entries['--unexpected-token'],undefined);
  assert.equal(entries['--s1'],undefined);
  assert.equal(entries['--tx'],undefined);
});
test('Undo uses separate bootstrap consumer and exact action token',()=>{
  assert.deepEqual(undoCommand(),{
    text:'undo-theme',kind:'command',consumer:'bootstrap',mode:'bootstrap',action:'undo-theme'
  });
});

test('phone projection cache rejects older revisions and same-revision rollback',()=>{
  const st=storage(), first=projection();
  first.revision=3;first.observedAt=new Date(Date.now()-10000).toISOString();
  assert.equal(cacheProjection(st,first),true);
  assert.equal(cacheProjection(st,{...first,revision:2,observedAt:new Date().toISOString()}),false);
  assert.equal(cacheProjection(st,{...first,observedAt:new Date(Date.now()-20000).toISOString()}),false);
  assert.equal(cacheProjection(st,{...first,observedAt:new Date(Date.now()+300000).toISOString()}),false);
  assert.equal(readCachedProjection(st).revision,3);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
