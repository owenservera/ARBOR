import test from 'node:test';
import assert from 'node:assert/strict';
import { assessModelSession, auditModelFleet } from './zcode-model-session-admission.mjs';

const SHA='b'.repeat(40);
const NOW=Date.parse('2026-11-24T00:00:00Z');
const baseReceipt=(providerId,modelId)=>({
  sourceSha:SHA,providerId,modelId,identityVerified:true,lastHttpStatus:200,
  requestId:'req-123',observed429:false,quotaRemaining:10,
  runId:'dwfrun-12345678-1234-1234-1234-123456789abc',
  ownerProcessAlive:true,eventBefore:100,eventAfter:101,outputObserved:true,
  lastSuccessUtc:'2026-11-23T23:59:00Z',observedCostUsd:0,zeroCostVerified:true
});
const approval=(providerId,modelId)=>({
  providerId,modelId,approved:true,expiresAtUtc:'2026-11-24T01:00:00Z',
  billingMode:'verified-free',maxApprovedUsd:0
});
const options={sourceSha:SHA,nowMs:NOW};

test('distinct provider/model tuples containing slashes cannot collide',()=>{
  const rows=[
    baseReceipt('alpha/beta','model'),
    baseReceipt('alpha','beta/model')
  ];
  const approvals=[
    approval('alpha/beta','model'),
    approval('alpha','beta/model')
  ];
  const audit=auditModelFleet(rows,approvals,options);
  assert.equal(audit.total,2);
  assert.equal(audit.admitted,2);
  assert.equal(audit.denied,0);
  assert.equal(audit.automaticFallbackAuthorized,false);
  assert.deepEqual(audit.routes.map(x=>[x.providerId,x.modelId]),[
    ['alpha/beta','model'],['alpha','beta/model']
  ]);
});

test('repeated exact tuple is refused even if receipt objects differ',()=>{
  const first=baseReceipt('alpha/beta','model');
  assert.throws(
    ()=>auditModelFleet([first,{...first,requestId:'req-456'}],[approval('alpha/beta','model')],options),
    /DUPLICATE_ROUTE_RECEIPT/
  );
});

test('ambiguous duplicate approvals fail closed regardless of order',()=>{
  const p=approval('alpha','model');
  const r=baseReceipt('alpha','model');
  assert.throws(()=>auditModelFleet([r],[p,{...p,approved:false}],options),
    /DUPLICATE_ROUTE_APPROVAL/);
  assert.throws(()=>auditModelFleet([r],[{...p,approved:false},p],options),
    /DUPLICATE_ROUTE_APPROVAL/);
});

test('malformed receipt is separately denied without spurious duplicate route',()=>{
  const audit=auditModelFleet([null,{},baseReceipt('alpha','model')],[approval('alpha','model')],options);
  assert.equal(audit.total,3);
  assert.equal(audit.admitted,1);
  assert.equal(audit.denied,2);
  assert.ok(audit.routes[0].problems.includes('ROUTE_NOT_EXACT'));
  assert.ok(audit.routes[1].problems.includes('ROUTE_NOT_EXACT'));
});

test('unapproved route cannot borrow slash-colliding approval',()=>{
  const audit=auditModelFleet(
    [baseReceipt('alpha/beta','model')],
    [approval('alpha','beta/model')],
    options);
  assert.equal(audit.admitted,0);
  assert.ok(audit.routes[0].problems.includes('ROUTE_NOT_EXACT'));
  assert.ok(audit.routes[0].problems.includes('OWNER_APPROVAL_MISSING'));
});

test('unbounded model fleet arrays are refused before scanning',()=>{
  const tooMany=Array.from({length:4097},()=>null);
  assert.throws(()=>auditModelFleet(tooMany,[],options),/INVALID_MODEL_AUDIT/);
  assert.throws(()=>auditModelFleet([] ,tooMany,options),/INVALID_MODEL_AUDIT/);
  assert.deepEqual(auditModelFleet([],[],options).routes,[]);
});

test('direct assessment still denies stale or non-live model sessions',()=>{
  const r=baseReceipt('alpha','model');r.ownerProcessAlive=false;
  r.lastSuccessUtc='2026-11-23T22:00:00Z';
  const decision=assessModelSession(r,approval('alpha','model'),options);
  assert.equal(decision.admitted,false);
  assert.ok(decision.problems.includes('NOT_LIVE_WITH_EVENTS'));
  assert.ok(decision.problems.includes('STALE_SESSION'));
  assert.equal(decision.effect,'NONE');
});
