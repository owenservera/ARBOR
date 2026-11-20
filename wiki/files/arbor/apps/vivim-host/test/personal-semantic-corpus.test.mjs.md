# File: apps/vivim-host/test/personal-semantic-corpus.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/personal-semantic-corpus.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2074 B |
| Lines | 47 |
| Hash | 264389657be8 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| catalog | const | 4 | no | const catalog={version:6,actions:[ |
| baseline | const | 7 | no | const baseline={outcome:&#39;interpretation_required&#39;}; |
| rules | const | 8 | no | const rules=Array.from({length:120},(_,i)=&gt;({ schema:PERSONAL_RULE_SCHEMA,id:&#39;rule:synthetic-&#39;+i,revision:1, phrase:&#39;routine &#39;+String(i).padStart(3,&#39;0&#39;), actionId:&#39;vivim.status.show&#39;,args:{},scope:{}… |
| resolve | function | 14 | no | const resolve=text=&gt;resolvePersonalSemantics({text,baseline,catalog,rules,scope:{surface:&#39;desktop&#39;}}); |
| text | const | 17 | no | const text=&#39;routine &#39;+String(i).padStart(3,&#39;0&#39;); |
| a | const | 18 | no | const a=resolve(text),b=resolve(text); |
| text | const | 26 | no | const text=&#39;routine &#39;+String(i).padStart(3,&#39;0&#39;); |
| text | const | 35 | no | const text=&#39; ROUTINE &#39;+String(i).padStart(3,&#39;0&#39;)+&#39; &#39;; |
| text | const | 41 | no | const text=&#39;routine &#39;+String(i).padStart(3,&#39;0&#39;); |
| r | const | 42 | no | const r=resolvePersonalSemantics({text,baseline,catalog:{...catalog,version:7}, rules,scope:{surface:&#39;desktop&#39;}}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../control/personal-semantics.mjs | import | 3 | [apps/vivim-host/control/personal-semantics.mjs](../control/personal-semantics.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { PERSONAL_RULE_SCHEMA, resolvePersonalSemantics } from '../control/personal-semantics.mjs';
const catalog={version:6,actions:[
 {id:'vivim.status.show',language:{verbs:['status']},args:{}},
]};
const baseline={outcome:'interpretation_required'};
const rules=Array.from({length:120},(_,i)=>({
 schema:PERSONAL_RULE_SCHEMA,id:'rule:synthetic-'+i,revision:1,
 phrase:'routine '+String(i).padStart(3,'0'),
 actionId:'vivim.status.show',args:{},scope:{},
 state:'accepted',source:'explicit-owner',catalogVersion:6,
}));
const resolve=text=>resolvePersonalSemantics({text,baseline,catalog,rules,scope:{surface:'desktop'}});
test('120 independent phrases remain exactly routable and repeat deterministically',()=>{
 for(let i=0;i<120;i++) {
  const text='routine '+String(i).padStart(3,'0');
  const a=resolve(text),b=resolve(text);
  assert.equal(a.outcome,'candidate');
  assert.equal(a.candidate.actionId,'vivim.status.show');
  assert.deepEqual(a,b);
 }
});
test('word-order changes and appended operations never inherit a personal alias',()=>{
 for(let i=0;i<120;i++) {
  const text='routine '+String(i).padStart(3,'0');
  for(const variant of [text+' and delete all',text+';',text+' not',
    'delete '+text,'routine '+String((i+1)%120).padStart(3,'0')+' now']) {
    assert.equal(resolve(variant).outcome,'no_match');
  }
 }
});
test('case and repeated spaces normalize without editing the stored command',()=>{
 for(let i=0;i<120;i++) {
  const text=' ROUTINE  '+String(i).padStart(3,'0')+' ';
  assert.equal(resolve(text).candidate.actionId,'vivim.status.show');
 }
});
test('a changed catalog revision abstains on all matching personal rules',()=>{
 for(const i of [0,17,64,119]) {
  const text='routine '+String(i).padStart(3,'0');
  const r=resolvePersonalSemantics({text,baseline,catalog:{...catalog,version:7},
    rules,scope:{surface:'desktop'}});
  assert.equal(r.outcome,'refused');
  assert.equal(r.reason,'STALE_CATALOG_RULE');
 }
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
