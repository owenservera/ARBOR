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
  assert.equal(rejected.error.code,'CONTROL_DEVICE_SCOPE_INVALID');
  assert.equal(devices.grantStatus({grantId:GRANT}).status,'pending');
  const remote=control.plan({actionId:'devices.approve',
    args:{grant_id:GRANT,scopes:'relay:read'}},{source:'mobile',actor:'phone'});
  assert.equal(remote.outcome,'unavailable');
  const local=control.plan({actionId:'devices.approve',
    args:{grant_id:GRANT,scopes:'relay:read'}},{source:'desktop',actor:'owner'});
  assert.equal(local.outcome,'approval_required');
  assert.equal(local.risk,'R2');
  assert.equal(devices.grantStatus({grantId:GRANT}).status,'pending');
  const applied=control.execute({planId:local.planId,planDigest:local.planDigest,
    approval:PC});
  assert.equal(applied.status,'applied');
  assert.deepEqual(applied.result.scopes,['relay:read']);
  assert.deepEqual(applied.undo,{actionId:'devices.revoke',
    args:{grant_id:GRANT}});
  assert.equal(devices.grantStatus({grantId:GRANT}).status,'active');
  assert.deepEqual(devices.listGrants()[0].scopes,['relay:read']);
  const repeat=control.execute({planId:local.planId,planDigest:local.planDigest,
    approval:PC});
  assert.equal(repeat.replayed,true);
});
