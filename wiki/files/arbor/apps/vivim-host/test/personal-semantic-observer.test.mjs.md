# File: apps/vivim-host/test/personal-semantic-observer.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/personal-semantic-observer.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2940 B |
| Lines | 60 |
| Hash | 8e2933015b9b |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| catalog | const | 4 | no | const catalog={version:6,actions:[ |
| sequence | variable | 9 | no | let sequence=0; |
| event | function | 10 | no | const event=(changes={})=&gt;({eventId:&#39;host-feedback-&#39;+String(++sequence).padStart(6,&#39;0&#39;), kind:&#39;owner-confirmed-meaning&#39;,source:&#39;trusted-host-feedback&#39;, phrase:&#39;quick check&#39;,actionId:&#39;vivim.status.sho… |
| r | const | 14 | no | const r=observePersonalLanguage({events:[event(),event(),event()],catalog}); |
| r | const | 22 | no | const r=observePersonalLanguage({events:[ event({kind:&#39;receipt-applied&#39;}),event({source:&#39;model-assertion&#39;}), event(),event()],catalog}); |
| r | const | 29 | no | const r=observePersonalLanguage({events:[ event(),event(),event(),event({actionId:&#39;ui.theme.set_preset&#39;,args:{preset:&#39;dusk&#39;}}) ],catalog}); |
| r | const | 37 | no | const r=observePersonalLanguage({events:[ event(),event(),event(), event({scope:{workspaceId:&#39;project-b&#39;},actionId:&#39;ui.theme.set_preset&#39;,args:{preset:&#39;dusk&#39;}}), event({scope:{workspaceId:&#39;project-b&#39;}… |
| r | const | 47 | no | const r=observePersonalLanguage({events:[ event({actionId:&#39;shell.exec&#39;}),event({actionId:&#39;shell.exec&#39;}),event({actionId:&#39;shell.exec&#39;}), event({actionId:&#39;ui.theme.set_preset&#39;,args:{preset:&#39;invalid&#39;}})… |
| once | const | 56 | no | const once=event({eventId:&#39;host-feedback-same-event&#39;}); |
| r | const | 57 | no | const r=observePersonalLanguage({events:[once,once,once],catalog}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../control/personal-semantic-observer.mjs | import | 3 | [apps/vivim-host/control/personal-semantic-observer.mjs](../control/personal-semantic-observer.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { observePersonalLanguage } from '../control/personal-semantic-observer.mjs';
const catalog={version:6,actions:[
 {id:'vivim.status.show',language:{verbs:['status']},args:{}},
 {id:'ui.theme.set_preset',language:{verbs:['theme']},
  args:{preset:{type:'enum',values:['dusk','dawn']}}},
]};
let sequence=0;
const event=(changes={})=>({eventId:'host-feedback-'+String(++sequence).padStart(6,'0'),
 kind:'owner-confirmed-meaning',source:'trusted-host-feedback',
 phrase:'quick check',actionId:'vivim.status.show',args:{},scope:{workspaceId:'project-a'},...changes});
test('repeated explicit confirmations propose, never activate',()=>{
 const r=observePersonalLanguage({events:[event(),event(),event()],catalog});
 assert.equal(r.candidates.length,1);
 assert.equal(r.candidates[0].rule.state,'proposed');
 assert.equal(r.candidates[0].rule.source,'system-observed');
 assert.equal(r.candidates[0].executionAuthorized,false);
 assert.equal(r.activationPermitted,false);
});
test('execution receipts or model claims are not interpreted as semantic confirmation',()=>{
 const r=observePersonalLanguage({events:[
  event({kind:'receipt-applied'}),event({source:'model-assertion'}),
  event(),event()],catalog});
 assert.equal(r.candidates.length,0);
 assert.equal(r.skipped,2);
});
test('contradictory meanings produce conflict, not an inferred winner',()=>{
 const r=observePersonalLanguage({events:[
  event(),event(),event(),event({actionId:'ui.theme.set_preset',args:{preset:'dusk'}})
 ],catalog});
 assert.equal(r.candidates.length,0);
 assert.equal(r.conflicts.length,1);
 assert.equal(r.conflicts[0].distinctMeanings,2);
});
test('separate contexts learn independent meanings with no cross-scope bleed',()=>{
 const r=observePersonalLanguage({events:[
  event(),event(),event(),
  event({scope:{workspaceId:'project-b'},actionId:'ui.theme.set_preset',args:{preset:'dusk'}}),
  event({scope:{workspaceId:'project-b'},actionId:'ui.theme.set_preset',args:{preset:'dusk'}}),
  event({scope:{workspaceId:'project-b'},actionId:'ui.theme.set_preset',args:{preset:'dusk'}})
 ],catalog});
 assert.equal(r.candidates.length,2);
 assert.equal(r.conflicts.length,0);
});
test('unregistered action or invalid argument never becomes a candidate',()=>{
 const r=observePersonalLanguage({events:[
  event({actionId:'shell.exec'}),event({actionId:'shell.exec'}),event({actionId:'shell.exec'}),
  event({actionId:'ui.theme.set_preset',args:{preset:'invalid'}})
 ],catalog});
 assert.equal(r.candidates.length,0);
 assert.equal(r.skipped,4);
});

test('replayed event ID does not inflate semantic confirmation counts',()=>{
 const once=event({eventId:'host-feedback-same-event'});
 const r=observePersonalLanguage({events:[once,once,once],catalog});
 assert.equal(r.candidates.length,0);
 assert.equal(r.skipped,2);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
