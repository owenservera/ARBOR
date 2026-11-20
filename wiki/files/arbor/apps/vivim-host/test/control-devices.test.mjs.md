# File: apps/vivim-host/test/control-devices.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/control-devices.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5307 B |
| Lines | 102 |
| Hash | a5ea5ef365ba |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| GRANT | const | 10 | no | const GRANT=&#39;a&#39;.repeat(32); |
| PC | const | 11 | no | const PC={channel:&#39;desktop-owner-token&#39;,actor:&#39;owner&#39;}; |
| fixture | function | 12 | no | function fixture(t) { |
| dataRoot | const | 13 | no | const dataRoot=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-typed-devices-&#39;)); |
| grantDir | const | 15 | no | const grantDir=path.join(dataRoot,&#39;device-grants&#39;); |
| file | const | 17 | no | const file=path.join(grantDir,&#39;grants.json&#39;); |
| runtime | const | 23 | no | const runtime=createBootstrapRuntime({dataRoot,file:&#39;:memory:&#39;}); |
| devices | const | 26 | no | const devices=createEnrollment({dataRoot,origin:null,user:null}); |
| control | const | 27 | no | const control=createControlDispatcher({dataRoot,runtime,devices}); |
| result | const | 32 | no | const result=control.plan({actionId:&#39;devices.summary&#39;,args:{}},{source:&#39;mobile&#39;}); |
| plan | const | 42 | no | const plan=control.plan({actionId:&#39;devices.revoke&#39;,args:{grant_id:GRANT}}, {source:&#39;mobile&#39;,actor:&#39;paired-device&#39;}); |
| plan | const | 51 | no | const plan=control.plan({actionId:&#39;devices.revoke&#39;,args:{grant_id:GRANT}}, {source:&#39;desktop&#39;,actor:&#39;owner&#39;}); |
| receipt | const | 59 | no | const receipt=control.execute({planId:plan.planId,planDigest:plan.planDigest, approval:PC}); |
| duplicate | const | 64 | no | const duplicate=control.execute({planId:plan.planId,planDigest:plan.planDigest,approval:PC}); |
| grants | const | 71 | no | const grants=JSON.parse(readFileSync(file,&#39;utf8&#39;)); |
| invalid | const | 74 | no | const invalid=control.plan({actionId:&#39;devices.approve&#39;, args:{grant_id:GRANT,scopes:&#39;relay:read,unrequested:admin&#39;}}, {source:&#39;desktop&#39;,actor:&#39;owner&#39;}); |
| rejected | const | 78 | no | const rejected=control.execute({planId:invalid.planId,planDigest:invalid.planDigest, approval:PC}); |
| remote | const | 83 | no | const remote=control.plan({actionId:&#39;devices.approve&#39;, args:{grant_id:GRANT,scopes:&#39;relay:read&#39;}},{source:&#39;mobile&#39;,actor:&#39;phone&#39;}); |
| local | const | 86 | no | const local=control.plan({actionId:&#39;devices.approve&#39;, args:{grant_id:GRANT,scopes:&#39;relay:read&#39;}},{source:&#39;desktop&#39;,actor:&#39;owner&#39;}); |
| applied | const | 91 | no | const applied=control.execute({planId:local.planId,planDigest:local.planDigest, approval:PC}); |
| repeat | const | 99 | no | const repeat=control.execute({planId:local.planId,planDigest:local.planDigest, approval:PC}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../bootstrap/runtime.mjs | import | 6 | [apps/vivim-host/bootstrap/runtime.mjs](../bootstrap/runtime.mjs.md) |
| ../control/dispatcher.mjs | import | 7 | [apps/vivim-host/control/dispatcher.mjs](../control/dispatcher.mjs.md) |
| ../apk/enrollment.mjs | import | 8 | [apps/vivim-host/apk/enrollment.mjs](../apk/enrollment.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createBootstrapRuntime} from '../bootstrap/runtime.mjs';
import {createControlDispatcher} from '../control/dispatcher.mjs';
import {createEnrollment} from '../apk/enrollment.mjs';

const GRANT='a'.repeat(32);
const PC={channel:'desktop-owner-token',actor:'owner'};
function fixture(t) {
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-typed-devices-'));
  t.after(()=>rmSync(dataRoot,{recursive:true,force:true}));
  const grantDir=path.join(dataRoot,'device-grants');
  mkdirSync(grantDir,{recursive:true});
  const file=path.join(grantDir,'grants.json');
  writeFileSync(file,JSON.stringify([{
    schema:'vivim.device-grant/1',grantId:GRANT,deviceId:'b'.repeat(32),
    status:'active',scopes:['relay:read','relay:write'],approvedBy:'owner',
    approvedAt:'2026-11-01T12:00:00.000Z'
  }]));
  const runtime=createBootstrapRuntime({dataRoot,file:':memory:'});
  t.after(()=>runtime.close());
  runtime.grantBootstrap({scope:'full-bootstrap'});
  const devices=createEnrollment({dataRoot,origin:null,user:null});
  const control=createControlDispatcher({dataRoot,runtime,devices});
  return {dataRoot,file,runtime,devices,control};
}
test('paired device summary is a bounded source-backed R0 read with no grant identifiers',t=>{
  const {control}=fixture(t);
  const result=control.plan({actionId:'devices.summary',args:{}},{source:'mobile'});
  assert.equal(result.outcome,'done');
  assert.equal(result.effect,'read');
  assert.equal(result.result.active,1);
  assert.equal(result.result.total,1);
  assert.ok(!JSON.stringify(result.result).includes(GRANT));
  assert.equal(control.recent().length,0);
});
test('phone cannot plan PC-only R2 revocation or create a pending mutation',t=>{
  const {control,devices}=fixture(t);
  const plan=control.plan({actionId:'devices.revoke',args:{grant_id:GRANT}},
    {source:'mobile',actor:'paired-device'});
  assert.equal(plan.outcome,'unavailable');
  assert.match(plan.precondition,/PC owner/);
  assert.equal(control.recent().length,0);
  assert.equal(devices.grantStatus({grantId:GRANT}).status,'active');
});
test('desktop typed revocation requires approval and durable receipt; replay cannot revoke again',t=>{
  const {control,devices}=fixture(t);
  const plan=control.plan({actionId:'devices.revoke',args:{grant_id:GRANT}},
    {source:'desktop',actor:'owner'});
  assert.equal(plan.outcome,'approval_required');
  assert.equal(plan.risk,'R2');
  assert.equal(devices.grantStatus({grantId:GRANT}).status,'active');
  assert.throws(()=>control.execute({planId:plan.planId,planDigest:plan.planDigest,
    approval:{channel:'direct-phone',actor:'paired-device'}}),/CONTROL_DESKTOP_APPROVAL_REQUIRED/);
  assert.equal(devices.grantStatus({grantId:GRANT}).status,'active');
  const receipt=control.execute({planId:plan.planId,planDigest:plan.planDigest,
    approval:PC});
  assert.equal(receipt.status,'applied');
  assert.equal(receipt.result.grantId,GRANT);
  assert.equal(devices.grantStatus({grantId:GRANT}).status,'revoked');
  const duplicate=control.execute({planId:plan.planId,planDigest:plan.planDigest,approval:PC});
  assert.equal(duplicate.replayed,true);
  assert.equal(duplicate.status,'applied');
});

test('desktop typed phone approval permits only owner-selected requested permissions',t=>{
  const {control,devices,file}=fixture(t);
  const grants=JSON.parse(readFileSync(file,'utf8'));
  grants[0].status='pending';
  writeFileSync(file,JSON.stringify(grants));
  const invalid=control.plan({actionId:'devices.approve',
    args:{grant_id:GRANT,scopes:'relay:read,unrequested:admin'}},
    {source:'desktop',actor:'owner'});
  assert.equal(invalid.outcome,'approval_required');
  const rejected=control.execute({planId:invalid.planId,planDigest:invalid.planDigest,
    approval:PC});
  assert.equal(rejected.status,'failed');
```

_First 80 of 103 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
