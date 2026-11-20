# File: apps/vivim-host/test/command-context-grounding.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/command-context-grounding.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2790 B |
| Lines | 46 |
| Hash | 60d2f0eae056 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| bundle | function | 4 | no | const bundle=()=&gt;({schema:COMMAND_CONTEXT_SCHEMA,revision:&#39;world:17&#39;,digest:&#39;a&#39;.repeat(64), entries:[ {id:&#39;artifact:42&#39;,type:&#39;artifact&#39;,value:&#39;artifact:42&#39;,revision:&#39;rev:18&#39;, sourceDigest:&#39;b&#39;.repeat(… |
| request | function | 11 | no | const request=(kind=&#39;focused&#39;,extra={})=&gt;({arg:&#39;artifact_id&#39;,kind,expectedType:&#39;artifact&#39;,...extra}); |
| r | const | 13 | no | const r=groundCommandReferences({bundle:bundle(),requests:[request()]}); |
| r | const | 20 | no | const r=groundCommandReferences({bundle:bundle(), requests:[request(&#39;explicit&#39;,{refId:&#39;artifact:43&#39;})]}); |
| b | const | 27 | no | const b=bundle(); b.selectors.latestApproved=[&#39;artifact:42&#39;,&#39;artifact:43&#39;]; |
| b | const | 34 | no | const b=bundle(); delete b.selectors.focused; |
| b | const | 38 | no | const b=bundle();b.entries.push({...b.entries[0]}); |
| b | const | 44 | no | const b=bundle();b.entries[0].authority=&#39;model-assertion&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../control/command-context-grounding.mjs | import | 3 | [apps/vivim-host/control/command-context-grounding.mjs](../control/command-context-grounding.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { COMMAND_CONTEXT_SCHEMA, groundCommandReferences } from '../control/command-context-grounding.mjs';
const bundle=()=>({schema:COMMAND_CONTEXT_SCHEMA,revision:'world:17',digest:'a'.repeat(64),
 entries:[
  {id:'artifact:42',type:'artifact',value:'artifact:42',revision:'rev:18',
   sourceDigest:'b'.repeat(64),status:'current',authority:'host-source'},
  {id:'artifact:43',type:'artifact',value:'artifact:43',revision:'rev:13',
   sourceDigest:'c'.repeat(64),status:'stale',authority:'host-source'},
 ],selectors:{focused:'artifact:42',latestApproved:['artifact:42']}});
const request=(kind='focused',extra={})=>({arg:'artifact_id',kind,expectedType:'artifact',...extra});
test('current focused reference resolves to source-pinned, inert value',()=>{
  const r=groundCommandReferences({bundle:bundle(),requests:[request()]});
  assert.equal(r.outcome,'resolved');
  assert.deepEqual(r.args,{artifact_id:'artifact:42'});
  assert.equal(r.pins.references[0].revision,'rev:18');
  assert.equal(r.executionAuthorized,false);
});
test('explicit references are exact, no fuzzy fallback',()=>{
  const r=groundCommandReferences({bundle:bundle(),
    requests:[request('explicit',{refId:'artifact:43'})]});
  assert.equal(r.reason,'STALE_REFERENCE');
  assert.equal(groundCommandReferences({bundle:bundle(),
    requests:[request('explicit',{refId:'artifact:unknown'})]}).reason,'UNKNOWN_REFERENCE');
});
test('latest approved requires one source-attested choice',()=>{
  const b=bundle(); b.selectors.latestApproved=['artifact:42','artifact:43'];
  assert.equal(groundCommandReferences({bundle:b,requests:[request('latestApproved')]}).reason,
    'AMBIGUOUS_REFERENCE');
});
test('wrong type and absent focus refuse safely',()=>{
  assert.equal(groundCommandReferences({bundle:bundle(),
    requests:[request('focused',{expectedType:'person'})]}).reason,'WRONG_REFERENCE_TYPE');
  const b=bundle(); delete b.selectors.focused;
  assert.equal(groundCommandReferences({bundle:b,requests:[request()]}).reason,'AMBIGUOUS_REFERENCE');
});
test('duplicate IDs or argument bindings invalidate the whole proposal',()=>{
  const b=bundle();b.entries.push({...b.entries[0]});
  assert.equal(groundCommandReferences({bundle:b,requests:[request()]}).reason,'INVALID_CONTEXT_ENTRY');
  assert.equal(groundCommandReferences({bundle:bundle(),
    requests:[request(),request('latestApproved')]}).reason,'INVALID_REFERENCE_REQUEST');
});
test('unsourced or unknown provenance cannot be used as command reference',()=>{
  const b=bundle();b.entries[0].authority='model-assertion';
  assert.equal(groundCommandReferences({bundle:b,requests:[request()]}).reason,'INVALID_CONTEXT_ENTRY');
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
