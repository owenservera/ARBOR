# File: apps/vivim-host/test/hvi-capability.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/hvi-capability.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5558 B |
| Lines | 95 |
| Hash | 676460c72703 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sources | function | 8 | no | const sources=()=&gt;[&#39;v1&#39;,&#39;v2&#39;,&#39;v3&#39;].map(ref=&gt;({repo:&#39;synthetic/w2-host&#39;,ref})); |
| req | function | 9 | no | const req=(o={})=&gt;({schema:HVI_HOST_REQUEST_SCHEMA,sources:sources(),targetIndex:2,...o}); |
| port | function | 10 | no | const port=(o={})=&gt;createHviHostReadPort({actorId:&#39;owner&#39;,sessionId:&#39;local&#39;, approvedRepositories:[&#39;synthetic/w2-host&#39;],verifySession:()=&gt;true, verifyGrant:()=&gt;true,enabled:true,...o}); |
| catalog | const | 14 | no | const catalog=loadControlCatalog(); |
| hits | const | 15 | no | const hits=catalog.actions.filter(a=&gt;a.id===HVI_HOST_ACTION_ID); |
| planner | const | 17 | no | const planner=createControlPlanner({catalog}); |
| fixture | const | 23 | no | const fixture=syntheticSource(); |
| fixture | const | 30 | no | const fixture=syntheticSource();let grants=0,sessions=0; |
| result | const | 31 | no | const result=await port({verifyGrant:()=&gt;{grants++;return true;}, verifySession:()=&gt;{sessions++;return true;}}).invoke(req(),{adapter:fixture.adapter}); |
| fixture | const | 45 | no | const fixture=syntheticSource(); |
| fixture | const | 53 | no | const fixture=syntheticSource();let n=0; |
| fixture | const | 59 | no | const fixture=syntheticSource();let n=0; |
| adapter | const | 64 | no | const adapter=syntheticSource().adapter; |
| token | const | 80 | no | const token=&#39;synthetic-owner-token-&#39;.padEnd(48,&#39;x&#39;); |
| request | const | 81 | no | const request={headers:{host:&#39;127.0.0.1:43187&#39;,origin:&#39;http://127.0.0.1:43187&#39;, |
| current | variable | 83 | no | let current=token,sourceAllowed=false; |
| gate | const | 84 | no | const gate=createHviLocalOwnerGate({request,ownerTokenFor:()=&gt;current, verifyDevelopmentSourceGrant:()=&gt;sourceAllowed}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| ../control/hvi-capability.mjs | import | 4 | [apps/vivim-host/control/hvi-capability.mjs](../control/hvi-capability.mjs.md) |
| ../control/intent-planner.mjs | import | 6 | [apps/vivim-host/control/intent-planner.mjs](../control/intent-planner.mjs.md) |
| ../../../hq/version-intelligence/sources/fixtures.mjs | import | 7 | [hq/version-intelligence/sources/fixtures.mjs](../../../hq/version-intelligence/sources/fixtures.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Synthetic-only HVI read tests. No real corpus access.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHviHostReadPort,HVI_HOST_ACTION_ID,HVI_HOST_REQUEST_SCHEMA,
  HVI_HOST_REPORT_SCHEMA,createHviLocalOwnerGate} from '../control/hvi-capability.mjs';
import {loadControlCatalog,createControlPlanner} from '../control/intent-planner.mjs';
import {syntheticSource,SYNTHETIC_SHAS} from '../../../hq/version-intelligence/sources/fixtures.mjs';
const sources=()=>['v1','v2','v3'].map(ref=>({repo:'synthetic/w2-host',ref}));
const req=(o={})=>({schema:HVI_HOST_REQUEST_SCHEMA,sources:sources(),targetIndex:2,...o});
const port=(o={})=>createHviHostReadPort({actorId:'owner',sessionId:'local',
  approvedRepositories:['synthetic/w2-host'],verifySession:()=>true,
  verifyGrant:()=>true,enabled:true,...o});
test('single native descriptor is wired; Host request authority is still mandatory',()=>{
  const catalog=loadControlCatalog();
  const hits=catalog.actions.filter(a=>a.id===HVI_HOST_ACTION_ID);
  assert.equal(hits.length,1);assert.equal(hits[0].readiness,'source_wired');
  const planner=createControlPlanner({catalog});
  assert.equal(planner.describe().actions.find(a=>a.actionId===HVI_HOST_ACTION_ID).executable,true);
  assert.equal(planner.planTyped({actionId:HVI_HOST_ACTION_ID,
    args:{selection:'synthetic commits v1 v2 v3'}}).outcome,'ready');
});
test('disabled and missing authority refuse',async()=>{
  const fixture=syntheticSource();
  await assert.rejects(port({enabled:false}).invoke(req(),{adapter:fixture.adapter}),
    {code:'HOST_FEATURE_DISABLED'});
  assert.throws(()=>createHviHostReadPort({actorId:'owner',sessionId:'local'}),
    {code:'AUTHORITY_REQUIRED'});
});
test('three immutable same-repo SHAs; many live checks; safe projection',async()=>{
  const fixture=syntheticSource();let grants=0,sessions=0;
  const result=await port({verifyGrant:()=>{grants++;return true;},
    verifySession:()=>{sessions++;return true;}}).invoke(req(),{adapter:fixture.adapter});
  assert.equal(result.report.schema,HVI_HOST_REPORT_SCHEMA);
  assert.equal(result.report.sourcePins.length,3);
  assert.equal(result.report.sourcePins[2].resolvedCommitSha,SYNTHETIC_SHAS.v3);
  assert.ok(grants>=15);assert.equal(sessions,grants);
  assert.equal(fixture.calls.blobs.length,0);
  assert.equal(result.remoteAccepted,false);
  assert.equal(result.runtimeAccepted,false);
  assert.ok(!JSON.stringify(result).includes('MUST_NOT_READ_SECRET'));
  assert.ok(!JSON.stringify(result).includes('.env.production'));
  assert.ok(!JSON.stringify(result).includes('"sessionId":"local"'));
});
test('no live grant or approved repository: no source read',async()=>{
  const fixture=syntheticSource();
  await assert.rejects(port({verifyGrant:()=>false}).invoke(req(),{adapter:fixture.adapter}),
    {code:'SOURCE_UNAUTHORIZED'});
  await assert.rejects(port({approvedRepositories:[]}).invoke(req(),{adapter:fixture.adapter}),
    {code:'SOURCE_UNAUTHORIZED'});
  assert.equal(fixture.calls.refs.length,0);
});
test('revocation during source page denies without report',async()=>{
  const fixture=syntheticSource();let n=0;
  await assert.rejects(port({verifyGrant:()=>++n<4}).invoke(req(),{adapter:fixture.adapter}),
    {code:'SOURCE_UNAUTHORIZED'});
  assert.ok(n>=4);
});
test('revocation at final projection denies',async()=>{
  const fixture=syntheticSource();let n=0;
  await assert.rejects(port({verifyGrant:()=>++n<=15}).invoke(req(),{adapter:fixture.adapter}),
    {code:'SOURCE_UNAUTHORIZED'});
});
test('incomplete pin list, secret subpath, moved SHA, unknown repository fail',async()=>{
  const adapter=syntheticSource().adapter;
  // Each case replaces `sources` with fewer than 3 entries, so `targetIndex` must be
  // given explicitly; otherwise the targetIndex range check fires first and masks
  // the failure reason under test.
  await assert.rejects(port().invoke(req({sources:[sources()[0]],targetIndex:0}),{adapter}),
    {code:'INVALID_REQUEST'});
  await assert.rejects(port().invoke(req({sources:[{repo:'synthetic/w2-host',ref:'v1',subPath:'.env.production'},sources()[1]],targetIndex:1}),{adapter}),
    {code:'SCOPE_ESCAPE'});
  await assert.rejects(port().invoke(req({sources:[{repo:'other/unapproved',ref:'v1'},sources()[1]],targetIndex:1}),{adapter}),
    {code:'SOURCE_UNAUTHORIZED'});
  await assert.rejects(port().invoke(req({sources:[{repo:'synthetic/w2-host',ref:'v1',sha:SYNTHETIC_SHAS.v2},sources()[1]],targetIndex:1}),{adapter}),
    {code:'PIN_MOVED'});
});


test('existing Host owner token rechecked, source permission independent',async()=>{
  const token='synthetic-owner-token-'.padEnd(48,'x');
```

_First 80 of 96 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
