// A native consumer of the existing committed PWA visual contract.
// No draft surface is represented as a committed revision. No effects or grants.
import {committedHostSurface} from '../../mobile-relay/generative-ui/host-revision-guard.mjs';
import {planTierflowSurface} from '../../mobile-relay/generative-ui/renderer.mjs';
const SCHEMA='vivim.native-ui-view/1';
export function projectNativeUi(bootstrap, viewportPx=1000){
  const unavailable=code=>({schema:SCHEMA,state:'unavailable',authority:'none',code});
  if(!Number.isSafeInteger(viewportPx)||viewportPx<240||viewportPx>3840)
    return unavailable('INVALID_VIEWPORT');
  if(bootstrap?.schema!=='vivim.bootstrap-phone/1'||bootstrap.state!=='ready')
    return unavailable('BOOTSTRAP_UNAVAILABLE');
  if(bootstrap.uiRevision===null)return {schema:SCHEMA,state:'absent',authority:'none'};
  const surface=committedHostSurface(bootstrap.uiRevision);
  if(!surface)return unavailable('INVALID_HOST_REVISION');
  try{
    const {source,plan,identities}=planTierflowSurface(surface,{audience:'phone',approvedRefs:[],viewportPx});
    return {schema:SCHEMA,state:'source-backed',authority:'none',source,plan,
      identities:Object.fromEntries(identities)};
  }catch{return unavailable('TIERFLOW_RENDER_UNAVAILABLE');}
}
