// Host-side migration seam for the existing Studio Craft R003 projection.
// @hq:consumes vivim.application-intelligence-native@1
// No browser, account, task or model ownership. No new route or service.
// Comparison keeps the incumbent output authoritative until genuine parity
// and a coordinated Studio-owner cutover are accepted.
import {isDeepStrictEqual} from 'node:util';
import {runNativeProductPureSync} from './native-product-pure-sync.mjs';
import {projectCraftIntelligence} from '../../../studio/src/studio/craft-intel-routes.mjs';

export function inspectCraftNativeProjection({atlas,reconciliation=null},
  {nativeProject=runNativeProductPureSync}={}) {
  // Validate with the existing Studio projector before any local native call.
  // Its errors are authoritative, and raw data never goes into the receipt.
  const projection=projectCraftIntelligence(atlas,reconciliation);
  let result=null;
  try {
    result=nativeProject('application-intelligence-projection',{atlas,reconciliation});
  } catch {
    return report(projection,'native-failed');
  }
  if(result===null)return report(projection,'native-unavailable-or-refused');
  const valid=result?.schema==='vivim.application-intelligence-native/1' &&
    result.executionAuthorized===false &&
    result.projection?.authority?.executionAuthorized===false &&
    result.projection?.authority?.activationPermitted===false &&
    result.projection?.authority?.sendPermission===false;
  if(!valid || !isDeepStrictEqual(result.projection,projection))
    return report(projection,'native-diverged');
  return report(projection,'native-matched');
}

function report(projection,status){
  return {schema:'vivim.craft-native-shadow/1',status,projection,
    source:{selected:'studio-incumbent',nativeCompared:status==='native-matched'||status==='native-diverged'},
    authority:{executionAuthorized:false,activationPermitted:false,sendPermission:false}};
}
