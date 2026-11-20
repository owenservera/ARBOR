// @hq:capability vivim.native-ui-projection@1
// @hq:emits vivim.native-ui-view@1
// @hq:consumes vivim.ui-render-plan@1
// @hq:consumes vivim.ui-surface@1
// A native consumer of the existing committed PWA visual contract.
// No draft surface is represented as a committed revision. No effects or grants.
import {committedHostSurface} from '../../mobile-relay/generative-ui/host-revision-guard.mjs';
import {planTierflowSurface} from '../../mobile-relay/generative-ui/renderer.mjs';
import {workspaceBindingData} from '../../mobile-relay/generative-ui/workspace-live-data.mjs';
const SCHEMA='vivim.native-ui-view/1';
export function projectNativeUi(bootstrap, viewportPx=1000, liveSources={}){
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
    const requested=new Set();
    function visit(node){if(node.liveBinding)requested.add(node.liveBinding);for(const child of node.children??[])visit(child);}
    visit(source.tree);
    const projections=workspaceBindingData(liveSources);
    const liveBindings=Object.fromEntries([...requested].map(key=>[key,projections[key]??{state:'unavailable',items:[]}]));
    return {schema:SCHEMA,state:'source-backed',authority:'none',source,plan,
      identities:Object.fromEntries(identities),liveBindings};
  }catch{return unavailable('TIERFLOW_RENDER_UNAVAILABLE');}
}
