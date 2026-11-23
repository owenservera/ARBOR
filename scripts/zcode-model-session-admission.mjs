// Z03: read-only admission of existing ZCode model/session receipts.
// Never invokes a provider, changes the registry, selects a fallback, or executes a workflow.
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const sha = s => typeof s === 'string' && /^[a-f0-9]{40}$/.test(s);
const id = s => typeof s === 'string' && s.length >= 2 && s.length <= 160 && /^[a-zA-Z0-9._:/-]+$/.test(s);
const amount = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;

export function assessModelSession(receipt, approval, {sourceSha, nowMs, maxAgeMs=600000}={}) {
  const problems=[];
  const fail=(name, condition)=>{if(!condition)problems.push(name);};
  const r=receipt && typeof receipt==='object' && !Array.isArray(receipt) ? receipt : {};
  const a=approval && typeof approval==='object' && !Array.isArray(approval) ? approval : {};
  fail('SOURCE_NOT_PINNED',sha(sourceSha) && r.sourceSha===sourceSha);
  fail('ROUTE_NOT_EXACT',id(r.providerId)&&id(r.modelId)&&r.providerId===a.providerId&&r.modelId===a.modelId);
  fail('OWNER_APPROVAL_MISSING',a.approved===true&&Number.isFinite(Date.parse(a.expiresAtUtc))&&Date.parse(a.expiresAtUtc)>nowMs);
  fail('NO_VERIFIED_RESPONSE',r.identityVerified===true&&r.lastHttpStatus===200&&id(r.requestId));
  fail('RATE_LIMIT_OR_QUOTA',r.observed429===false&&Number.isSafeInteger(r.quotaRemaining)&&r.quotaRemaining>0);
  fail('NOT_LIVE_WITH_EVENTS',id(r.runId)&&/^dwfrun-[a-f0-9-]{36}$/.test(r.runId)&&r.ownerProcessAlive===true&&
    Number.isSafeInteger(r.eventBefore)&&Number.isSafeInteger(r.eventAfter)&&r.eventAfter>r.eventBefore&&r.outputObserved===true);
  const success=Date.parse(r.lastSuccessUtc);
  fail('STALE_SESSION',Number.isFinite(nowMs)&&Number.isFinite(maxAgeMs)&&maxAgeMs>0&&
    Number.isFinite(success)&&success<=nowMs&&nowMs-success<=maxAgeMs);
  const mode=a.billingMode;
  const costValid=amount(r.observedCostUsd)&&amount(a.maxApprovedUsd)&&r.observedCostUsd<=a.maxApprovedUsd&&
    ((mode==='verified-free'&&a.maxApprovedUsd===0&&r.observedCostUsd===0&&r.zeroCostVerified===true)||
     (mode==='included-plan'&&a.includedPlanAuthorized===true&&r.observedCostUsd===0)||
     (mode==='approved-paid'&&a.explicitPaidAuthorization===true));
  fail('COST_NOT_ADMITTED',costValid);
  return {schema:'vivim.zcode-model-admission/1',sourceSha:sha(sourceSha)?sourceSha:null,
    providerId:id(r.providerId)?r.providerId:null,modelId:id(r.modelId)?r.modelId:null,
    runId:id(r.runId)?r.runId:null,admitted:problems.length===0,problems,
    effect:'NONE',fallbackSelected:false};
}

export function auditModelFleet(candidates, approvals, options) {
  if(!Array.isArray(candidates)||!Array.isArray(approvals))throw new Error('INVALID_MODEL_AUDIT');
  const keys=new Set();
  const rows=candidates.map(receipt=>{
    const key=String(receipt?.providerId)+'/'+String(receipt?.modelId);
    if(keys.has(key))throw new Error('DUPLICATE_ROUTE_RECEIPT');
    keys.add(key);
    const approval=approvals.find(a=>a.providerId===receipt?.providerId&&a.modelId===receipt?.modelId);
    return assessModelSession(receipt,approval,options);
  });
  return {schema:'vivim.zcode-model-fleet-audit/1',total:rows.length,
    admitted:rows.filter(r=>r.admitted).length,denied:rows.filter(r=>!r.admitted).length,
    routes:rows,automaticFallbackAuthorized:false,
    note:'Read-only evidence audit; no model admission is equivalent to model execution or cost authorization.'};
}

// Explicit local CLI admission boundary for the existing manual ZCode pilot.
// Never logs receipt contents, raw prompts, credentials, model output or keys.
export function inspectReceiptFile(file, sourceSha, nowMs=Date.now()) {
  if (!sha(sourceSha) || typeof file !== 'string' || !path.isAbsolute(file))
    throw new Error('RECEIPT_PATH_OR_SHA_INVALID');
  const data=readFileSync(file);
  if (data.length>128*1024) throw new Error('RECEIPT_TOO_LARGE');
  const payload=JSON.parse(data.toString('utf8'));
  return assessModelSession(payload?.receipt,payload?.approval,{sourceSha,nowMs});
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try {
    if(process.argv.length!==5 || process.argv[2]!=='--verify') throw new Error('USAGE');
    const result=inspectReceiptFile(process.argv[3],process.argv[4]);
    console.log(JSON.stringify({admitted:result.admitted,problems:result.problems,sourceSha:result.sourceSha}));
    if(!result.admitted)process.exitCode=3;
  }catch(error){
    console.error('MODEL_ADMISSION_REFUSED: '+String(error?.message||'INVALID').slice(0,80));
    process.exitCode=2;
  }
}
