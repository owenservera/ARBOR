import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL('./zcode-model-session-admission.mjs',import.meta.url));
const SHA='c'.repeat(40),now=new Date();
function fixture(t,override={}){
 const dir=mkdtempSync(path.join(os.tmpdir(),'zcode-model-gate-'));
 t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const data={receipt:{sourceSha:SHA,providerId:'plan-provider',modelId:'model-exact',identityVerified:true,
 lastHttpStatus:200,requestId:'req-100',observed429:false,quotaRemaining:3,
 runId:'dwfrun-12345678-1234-1234-1234-123456789abc',ownerProcessAlive:true,
 eventBefore:10,eventAfter:12,outputObserved:true,lastSuccessUtc:now.toISOString(),
 observedCostUsd:0,zeroCostVerified:true},approval:{providerId:'plan-provider',modelId:'model-exact',approved:true,
 expiresAtUtc:new Date(now.valueOf()+300000).toISOString(),billingMode:'verified-free',maxApprovedUsd:0}};
 Object.assign(data.receipt,override.receipt||{});
 Object.assign(data.approval,override.approval||{});
 const file=path.join(dir,'receipt.json');writeFileSync(file,JSON.stringify(data));return file;
}
function run(file,sha=SHA){return spawnSync(process.execPath,[script,'--verify',file,sha],{encoding:'utf8'});}
test('CLI admits an explicitly pinned, fresh and zero-cost synthetic receipt',t=>{
 const x=run(fixture(t));assert.equal(x.status,0);assert.equal(JSON.parse(x.stdout).admitted,true);
});
test('CLI refuses no-model approval and never auto-falls back',t=>{
 const x=run(fixture(t,{approval:{approved:false}}));assert.equal(x.status,3);
 assert.ok(JSON.parse(x.stdout).problems.includes('OWNER_APPROVAL_MISSING'));
});
test('CLI refuses wrong source SHA or missing receipt',t=>{
 const file=fixture(t);assert.equal(run(file,'d'.repeat(40)).status,3);
 assert.equal(run(path.join(path.dirname(file),'missing.json')).status,2);
});
test('CLI rejects malformed JSON and emits no raw contents',t=>{
 const file=fixture(t);writeFileSync(file,'{secret:token, not-json');const x=run(file);
 assert.equal(x.status,2);assert.ok(!x.stderr.includes('secret:token'));
});
