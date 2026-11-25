// Host-side development intake; no effects, grants, browser or provider ownership.
import {execFileSync} from 'node:child_process';
import {isAbsolute} from 'node:path';
import {inspectCraftNativeProjection} from './craft-intelligence-native.mjs';

const LIMIT = 4 * 1024 * 1024;
const inert = x => x?.executionAuthorized === false && x?.activationPermitted === false && x?.sendPermission === false;
const fail = code => { throw Object.assign(new Error(code),{code}); };
function nativeRunner({binary,store}) {
  if (!isAbsolute(binary??'') || !isAbsolute(store??'')) fail('ABSORPTION_LOCAL_CONFIG_REQUIRED');
  return (operation, payload, extraArgs=[]) => {
    const input = Buffer.isBuffer(payload) ? payload : JSON.stringify(payload);
    if (Buffer.byteLength(input)>LIMIT) fail('ABSORPTION_SIZE_LIMIT');
    let result;
    try {
      result=JSON.parse(execFileSync(binary,[operation,store,...extraArgs],{input,encoding:'utf8',windowsHide:true,
        timeout:30000,maxBuffer:LIMIT,stdio:['pipe','pipe','pipe']}));
    } catch { fail('ABSORPTION_NATIVE_FAILED'); }
    return result;
  };
}
export function createAbsorptionIntake({binary,store,run=nativeRunner({binary,store}),project=inspectCraftNativeProjection}={}) {
  return Object.freeze({
    intake({scope,atlas,reconciliation=null}) {
      if(!scope || typeof scope.siteId!=='string'||typeof scope.origin!=='string'||
        scope.siteId!==atlas?.target?.siteId||scope.origin!==atlas?.target?.origin)fail('ABSORPTION_SCOPE_MISMATCH');
      const report=project({atlas,reconciliation});
      const projection=report?.projection;
      if(!inert(report?.authority)||!inert(projection?.authority)||
          projection.target?.siteId!==scope.siteId||projection.target?.origin!==scope.origin)fail('ABSORPTION_PROJECTION_REJECTED');
      const receipt=run('intake',{scope,projection});
      if(receipt?.schema!=='vivim.absorption-intake-receipt/1'||receipt.executionAuthorized!==false||
          !/^[a-f0-9]{64}$/.test(receipt.id??'')||typeof receipt.created!=='boolean'||
          receipt.scope?.siteId!==scope.siteId||receipt.scope?.origin!==scope.origin||
          receipt.evidenceCount!==projection.evidence.length)fail('ABSORPTION_RECEIPT_INVALID');
      return {...receipt,projectorStatus:report.status};
    },
    intakeUia({scope,bytes,legacyFacebook=false}) {
      if(!Buffer.isBuffer(bytes)||!scope||typeof scope.siteId!=='string'||typeof scope.origin!=='string')fail('ABSORPTION_UIA_INPUT_INVALID');
      if(legacyFacebook&&(scope.siteId!=='facebook'||scope.origin!=='https://www.facebook.com'))fail('ABSORPTION_SCOPE_MISMATCH');
      const receipt=run(legacyFacebook?'uia-facebook':'uia',bytes,legacyFacebook?[]:[scope.siteId,scope.origin]);
      if(receipt?.schema!=='vivim.absorption-intake-receipt/1'||receipt.executionAuthorized!==false||
         !/^[a-f0-9]{64}$/.test(receipt.id??'')||typeof receipt.created!=='boolean'||
         receipt.scope?.siteId!==scope.siteId||receipt.scope?.origin!==scope.origin||
         !Number.isSafeInteger(receipt.evidenceCount)||receipt.evidenceCount<0)fail('ABSORPTION_RECEIPT_INVALID');
      return receipt;
    },
    handoff(payload) {
      if(payload?.schema!=='vivim.absorption-semantic-handoff/1'||!payload.scope||!Array.isArray(payload.candidates))fail('ABSORPTION_HANDOFF_INVALID');
      const receipt=run('handoff',payload);
      if(receipt?.schema!=='vivim.absorption-intake-receipt/1'||receipt.executionAuthorized!==false||
         !/^[a-f0-9]{64}$/.test(receipt.id??'')||typeof receipt.created!=='boolean'||
         receipt.scope?.siteId!==payload.scope.siteId||receipt.scope?.origin!==payload.scope.origin||
         receipt.evidenceCount!==payload.candidates.length)fail('ABSORPTION_RECEIPT_INVALID');
      return receipt;
    },
    read(id) {
      if(!/^[a-f0-9]{64}$/.test(id??''))fail('ABSORPTION_ID_INVALID');
      const result=run('read',{id});
      if(!inert(result?.authority))fail('ABSORPTION_RECORD_INVALID');
      const valid=(result.schema==='vivim.absorption-observation/1'&&result.discovery?.sourceTrust==='unattested-external-report')||
        (result.schema==='vivim.absorption-uia-observation/1'&&result.source?.trust==='unattested-local-observation')||
        (result.schema==='vivim.absorption-semantic-candidates/1'&&result.status==='proposed-not-verified');
      if(!valid)fail('ABSORPTION_RECORD_INVALID');
      return result;
    }
  });
}
