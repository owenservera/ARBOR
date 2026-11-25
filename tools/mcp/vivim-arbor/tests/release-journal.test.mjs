import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,readFileSync} from 'node:fs';
import os from 'node:os';import path from 'node:path';
import {openReleaseJournal} from '../server/release-journal.mjs';
const A='a'.repeat(64),B='b'.repeat(64),id='c'.repeat(32);
const plan={schema:'vivim.workstation-live-upgrade-plan/1',activeSource:'a'.repeat(40),candidateSource:'b'.repeat(40),activeTree:A,candidateTree:B,mode:'host-handover',promotionPerformed:false,automaticEffectReplay:false,preserveOldRelease:true,preserveTunnelSupervisor:true,ownerApprovalRequired:true,drainInFlightCalls:true,drainNativeJobs:true,grantActivationRequired:false,clientMetadataRefreshRequired:false};
const prefix=['candidate-verified','approval-observed','rollback-ready','maintenance-observed','mcp-drained','host-quiescent','promotion-claimed'];
function fixture(t){const root=mkdtempSync(path.join(os.tmpdir(),'vivim-release-journal-'));t.after(()=>rmSync(root,{recursive:true,force:true}));return {root,j:openReleaseJournal(root,id)};}
const advance=(j,k)=>j.observe({expectedHead:j.status().headDigest,kind:k,evidenceDigest:A});
test('reopen preserves exclusive plan and unresolved claim; no replay',t=>{
 const {root,j}=fixture(t);j.initialize(plan);
 for(const k of prefix)advance(j,k);
 const reopened=openReleaseJournal(root,id);assert.equal(reopened.status().progress.state,'awaiting-effect-observation');
 assert.throws(()=>advance(reopened,'promotion-claimed'));
 advance(reopened,'promotion-uncertain');assert.equal(reopened.status().progress.state,'reconciliation-required');
 assert.throws(()=>advance(reopened,'promotion-observed'));
});
test('stale writer, foreign plan, skipped event and changed evidence are refused',t=>{
 const {root,j}=fixture(t);const start=j.initialize(plan);assert.throws(()=>j.initialize({...plan,candidateSource:'d'.repeat(40)}));
 assert.throws(()=>advance(j,'promotion-claimed'));advance(j,'candidate-verified');
 assert.throws(()=>j.observe({expectedHead:start.headDigest,kind:'approval-observed',evidenceDigest:A}),/STALE/);
 const file=path.join(root,id,'001.event.json'),rec=JSON.parse(readFileSync(file));rec.event.evidenceDigest=B;writeFileSync(file,JSON.stringify(rec));assert.throws(()=>j.status());
});
test('observed rollback reaches durable terminal state',t=>{
 const {root,j}=fixture(t);j.initialize(plan);
 for(const k of [...prefix,'promotion-observed','candidate-failed','rollback-approval-observed','rollback-claimed','rollback-observed','previous-health-observed','rolled-back'])advance(j,k);
 assert.equal(openReleaseJournal(root,id).status().progress.state,'rolled-back');
 assert.throws(()=>advance(j,'promotion-claimed'));
});
