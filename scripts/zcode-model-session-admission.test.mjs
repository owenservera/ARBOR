import test from 'node:test';
import assert from 'node:assert/strict';
import {assessModelSession,auditModelFleet} from './zcode-model-session-admission.mjs';
const SHA='a'.repeat(40),NOW=Date.parse('2026-11-23T22:45:00Z');
const receipt=()=>({sourceSha:SHA,providerId:'plan-provider',modelId:'model-exact',identityVerified:true,
 lastHttpStatus:200,requestId:'req-0001',observed429:false,quotaRemaining:5,
 runId:'dwfrun-12345678-1234-1234-1234-123456789abc',ownerProcessAlive:true,
 eventBefore:9,eventAfter:11,outputObserved:true,lastSuccessUtc:'2026-11-23T22:44:00Z',
 observedCostUsd:0,zeroCostVerified:true});
const approval=()=>({providerId:'plan-provider',modelId:'model-exact',approved:true,
 expiresAtUtc:'2026-11-23T23:00:00Z',billingMode:'verified-free',maxApprovedUsd:0});
const check=(r=receipt(),a=approval(),opts={sourceSha:SHA,nowMs:NOW})=>assessModelSession(r,a,opts);
test('fresh verifiable zero-cost session admits without any model call',()=>{
 const result=check();assert.equal(result.admitted,true);assert.deepEqual(result.problems,[]);
 assert.equal(result.effect,'NONE');assert.equal(result.fallbackSelected,false);
});
test('configured model is not a live model session',()=>{
 const r=receipt();r.ownerProcessAlive=false;r.eventAfter=r.eventBefore;
 assert.ok(check(r).problems.includes('NOT_LIVE_WITH_EVENTS'));
});
test('quota exhausted or 429 blocks admission',()=>{
 const r=receipt();r.observed429=true;r.quotaRemaining=0;
 assert.ok(check(r).problems.includes('RATE_LIMIT_OR_QUOTA'));
});
test('stale run and stale approval both fail closed',()=>{
 const r=receipt();r.lastSuccessUtc='2026-11-22T00:00:00Z';
 const a=approval();a.expiresAtUtc='2026-11-23T21:00:00Z';
 const x=check(r,a);assert.ok(x.problems.includes('STALE_SESSION'));
 assert.ok(x.problems.includes('OWNER_APPROVAL_MISSING'));
});
test('unverified free label cannot imply zero cost',()=>{
 const r=receipt();r.zeroCostVerified=false;
 assert.ok(check(r).problems.includes('COST_NOT_ADMITTED'));
});
test('paid route without explicit approval is denied regardless of success',()=>{
 const a=approval();a.billingMode='approved-paid';a.maxApprovedUsd=1;a.explicitPaidAuthorization=false;
 assert.ok(check(receipt(),a).problems.includes('COST_NOT_ADMITTED'));
});
test('different provider or model cannot borrow approval',()=>{
 const r=receipt();r.modelId='another-model';
 assert.ok(check(r).problems.includes('ROUTE_NOT_EXACT'));
});
test('source mismatch and future-dated model success are refused',()=>{
 const r=receipt();r.lastSuccessUtc='2026-11-24T00:00:00Z';
 const x=check(r,approval(),{sourceSha:'b'.repeat(40),nowMs:NOW});
 assert.ok(x.problems.includes('SOURCE_NOT_PINNED'));
 assert.ok(x.problems.includes('STALE_SESSION'));
});
test('fleet only audits exact receipts; never selects an automatic fallback',()=>{
 const r=receipt(), r2={...receipt(),providerId:'second',modelId:'model2',observed429:true};
 const audit=auditModelFleet([r,r2],[approval()],{sourceSha:SHA,nowMs:NOW});
 assert.equal(audit.admitted,1);assert.equal(audit.denied,1);
 assert.equal(audit.automaticFallbackAuthorized,false);
 assert.ok(audit.routes[1].problems.includes('RATE_LIMIT_OR_QUOTA'));
 assert.throws(()=>auditModelFleet([r,r],[approval()],{sourceSha:SHA,nowMs:NOW}),/DUPLICATE_ROUTE_RECEIPT/);
});
