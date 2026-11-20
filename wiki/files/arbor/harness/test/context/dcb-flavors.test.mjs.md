# File: harness/test/context/dcb-flavors.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/context/dcb-flavors.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3175 B |
| Lines | 58 |
| Hash | f191e53aa3ab |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| d | const | 15 | no | const d=detectDcbFlavors({requestText:&#39;Research the architecture and project implementation&#39;}); |
| p | const | 19 | no | const p=composeDcbFlavors({selected:d.selected.map(x=&gt;x.id)}); |
| d | const | 25 | no | const d=detectDcbFlavors({requestText:&#39;Research a project&#39;,explicit:[&#39;personal&#39;], activity:[&#39;professional&#39;],excluded:[&#39;research&#39;]}); |
| composed | const | 34 | no | const composed=composeDcbFlavors({selected:[]}); |
| base | const | 39 | no | const base=INITIAL_FLAVOR_POLICIES[0]; |
| base | const | 48 | no | const base=INITIAL_FLAVOR_POLICIES[0]; |
| legal | const | 49 | no | const legal={...base,id:&#39;legal-case&#39;,terms:[&#39;case&#39;,&#39;filing&#39;,&#39;precedent&#39;],maxAgeDays:45, |
| policies | const | 51 | no | const policies=[...INITIAL_FLAVOR_POLICIES,legal]; |
| d | const | 52 | no | const d=detectDcbFlavors({requestText:&#39;Review the precedent&#39;,policies}); |
| p | const | 54 | no | const p=composeDcbFlavors({selected:[&#39;legal-case&#39;,&#39;project&#39;],policies}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/context/dcb-flavors.mjs | import | 3 | [harness/src/context/dcb-flavors.mjs](../../src/context/dcb-flavors.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FLAVOR_POLICY_SCHEMA, detectDcbFlavors, composeDcbFlavors,
  INITIAL_FLAVOR_POLICIES,
} from '../../src/context/dcb-flavors.mjs';

test('initial policies are configurable flavor hints, not delivery profiles',()=>{
  assert.deepEqual(INITIAL_FLAVOR_POLICIES.map(x=>x.id),
    ['project','personal','professional','learning','research','life-planning']);
  assert.ok(INITIAL_FLAVOR_POLICIES.every(x=>x.schema===FLAVOR_POLICY_SCHEMA));
  assert.ok(!INITIAL_FLAVOR_POLICIES.some(x=>x.id==='handoff'));
});
test('mixed research/project context detected without automatic disclosure',()=>{
  const d=detectDcbFlavors({requestText:'Research the architecture and project implementation'});
  assert.deepEqual(d.selected.map(x=>x.id),['project','research']);
  assert.equal(d.authority,'selection_hint_only');
  assert.equal(d.isSendAuthorized,false);
  const p=composeDcbFlavors({selected:d.selected.map(x=>x.id)});
  assert.equal(p.sensitivityCeiling,'internal');
  assert.equal(p.maxAgeDays,90);
  assert.equal(p.isSendAuthorized,false);
});
test('explicit selection, exclusion and activity hints are independent of lexical inference',()=>{
  const d=detectDcbFlavors({requestText:'Research a project',explicit:['personal'],
    activity:['professional'],excluded:['research']});
  assert.deepEqual(d.selected.map(x=>x.id),['personal','professional','project']);
  assert.equal(d.selected.find(x=>x.id==='personal').reason,'explicit');
  assert.equal(d.selected.find(x=>x.id==='professional').reason,'activity');
  assert.ok(!d.selected.some(x=>x.id==='research'));
});
test('empty context detection does not silently infer personal content',()=>{
  assert.deepEqual(detectDcbFlavors({requestText:'hello'}).selected,[]);
  const composed=composeDcbFlavors({selected:[]});
  assert.equal(composed.sensitivityCeiling,null);
  assert.deepEqual(composed.relevance,{});
});
test('unknown/duplicate malformed policies fail closed',()=>{
  const base=INITIAL_FLAVOR_POLICIES[0];
  assert.throws(()=>detectDcbFlavors({explicit:['unknown']}),{code:'DCB_FLAVOR_UNKNOWN'});
  assert.throws(()=>composeDcbFlavors({selected:['unknown']}),{code:'DCB_FLAVOR_UNKNOWN'});
  assert.throws(()=>composeDcbFlavors({selected:['project'],policies:[base,base]}),
    {code:'DCB_FLAVOR_LIST'});
  assert.throws(()=>composeDcbFlavors({selected:['project'],policies:[{...base,weight:0}]}),
    {code:'DCB_FLAVOR_POLICY'});
});
test('custom legal-case flavor adds no new graph, grant or memory writer',()=>{
  const base=INITIAL_FLAVOR_POLICIES[0];
  const legal={...base,id:'legal-case',terms:['case','filing','precedent'],maxAgeDays:45,
    sensitivity:'sensitive',weight:2};
  const policies=[...INITIAL_FLAVOR_POLICIES,legal];
  const d=detectDcbFlavors({requestText:'Review the precedent',policies});
  assert.deepEqual(d.selected.map(x=>x.id),['legal-case']);
  const p=composeDcbFlavors({selected:['legal-case','project'],policies});
  assert.equal(p.sensitivityCeiling,'internal');
  assert.equal(p.maxAgeDays,45);
  assert.equal(p.isSendAuthorized,false);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
