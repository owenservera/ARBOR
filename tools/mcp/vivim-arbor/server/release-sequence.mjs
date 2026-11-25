// Pure release sequencing over trusted, independently verified Host evidence.
// No event is an authorization token. No process, file, grant or effect is mutated.
// Durable claim/receipt storage and effect execution remain the incumbent Host's responsibility.
export function releaseNext(plan,events){
 const deny=()=>{throw Error('WORKSTATION_RELEASE_SEQUENCE_INVALID')};
 const hex=(s,n)=>typeof s==='string'&&s.length===n&&/^[a-f0-9]+$/.test(s);
 const modes=['no-runtime-restart','mcp-child-reload','host-handover'];
 if(plan?.schema!=='vivim.workstation-live-upgrade-plan/1'||!modes.includes(plan.mode)||
    !hex(plan.activeSource,40)||!hex(plan.candidateSource,40)||!hex(plan.activeTree,64)||!hex(plan.candidateTree,64)||
    plan.promotionPerformed!==false||plan.automaticEffectReplay!==false||plan.preserveOldRelease!==true||plan.preserveTunnelSupervisor!==true||
    !Array.isArray(events)||events.length>40)deny();
 const effect=plan.mode!=='no-runtime-restart';
 if(plan.ownerApprovalRequired!==effect||plan.drainInFlightCalls!==effect||
    plan.drainNativeJobs!==(plan.mode==='host-handover')||
    typeof plan.grantActivationRequired!=='boolean'||typeof plan.clientMetadataRefreshRequired!=='boolean'||
    (plan.grantActivationRequired&&plan.mode!=='host-handover')||
    (!effect&&plan.clientMetadataRefreshRequired))deny();
 const forward=[
  'candidate-verified',
  ...(effect?['approval-observed','rollback-ready','maintenance-observed','mcp-drained']:[]),
  ...(plan.mode==='host-handover'?['host-quiescent']:[]),
  ...(effect?['promotion-claimed','promotion-observed']:['no-restart-recorded']),
  'candidate-health-observed',
  ...(plan.clientMetadataRefreshRequired?['client-contract-observed']:[]),
  'committed'
 ];
 const rollback=['rollback-approval-observed','rollback-claimed','rollback-observed','previous-health-observed','rolled-back'];
 let phase='forward',position=0,last=null,seenClaim=false;
 for(let i=0;i<events.length;i++){
  const e=events[i];
  if(!e||typeof e!=='object'||Array.isArray(e)||typeof e.kind!=='string'||Object.keys(e).length!==5||Object.keys(e).some(k=>!['sequence','kind','activeTree','candidateTree','evidenceDigest'].includes(k))||
    e.sequence!==i+1||e.activeTree!==plan.activeTree||e.candidateTree!==plan.candidateTree||!hex(e.evidenceDigest,64))deny();
  if(phase==='forward'&&e.kind==='candidate-failed'){
   if(!seenClaim||!['promotion-observed','candidate-health-observed','client-contract-observed'].includes(last))deny();
   phase='rollback';position=0;last=e.kind;continue;
  }
  // An unresolved claim is an observation/reconciliation requirement, never
  // permission to repeat the external effect. Only the Host can attest it.
  if(e.kind==='promotion-uncertain'||e.kind==='rollback-uncertain'){
   if((e.kind==='promotion-uncertain'&&phase==='forward'&&last==='promotion-claimed')||
      (e.kind==='rollback-uncertain'&&phase==='rollback'&&last==='rollback-claimed')){
    if(i!==events.length-1)deny();return {state:'reconciliation-required',next:null,automaticEffectReplay:false};
   }
   deny();
  }
  const steps=phase==='forward'?forward:rollback;
  if(position>=steps.length||e.kind!==steps[position])deny();
  if(e.kind==='promotion-claimed')seenClaim=true;
  position++;last=e.kind;
 }
 const steps=phase==='forward'?forward:rollback;
 const next=steps[position]??null;
 return {state:next===null?(phase==='forward'?'committed':'rolled-back'):
    last==='promotion-claimed'||last==='rollback-claimed'?'awaiting-effect-observation':phase==='forward'?'preparing':'recovering',
  next,automaticEffectReplay:false};
}
