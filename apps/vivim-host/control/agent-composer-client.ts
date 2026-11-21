/**
 * Desktop-owner agent bridge over the EXISTING Host Control plan/execute API.
 * Rust decides the inert edit; Host alone authorizes, claims and receipts it.
 * The explicit approval callback is a real human/owner decision, not an
 * agent-provided bool pretending to be permission. No CLI or provider API.
 */
import {createHash} from 'node:crypto';

export type ComposerRunStatus = 'verified'|'refused'|'paused'|'stale'|'uncertain';
export type ComposerGoal = Readonly<{
  regionId:'phone.composer';
  operation:'replace'|'append';
  text:string;
  correlationId:string;
}>;
export type ComposerOwnerResponse = Readonly<{
  status:ComposerRunStatus; correlationId:string; reason:string;
  sourceRevision?:number; hostPlanId?:string;
}>;
export type OwnerFetch = (pathname:string,init:RequestInit)=>Promise<Response>;
export type ExplicitApproval = (plan:Record<string,unknown>)=>Promise<boolean>;
export type OwnerComposerClient = Readonly<{
  ownerFetch:OwnerFetch;
  approve:ExplicitApproval;
  active:()=>boolean;
}>;

const ACTION='pwa.composer.draft.set';
const MAX_BYTES=1000;
const identifier=(s:unknown):s is string=>
  typeof s==='string'&&/^[a-zA-Z0-9._:-]{1,128}$/.test(s);
const digest=(s:string)=>createHash('sha256').update(s,'utf8').digest('hex');
const failed=(status:ComposerRunStatus,id:string,reason:string):ComposerOwnerResponse=>
  ({status,correlationId:id,reason});
async function json(client:OwnerComposerClient,path:string,body?:unknown):Promise<any>{
  const response=await client.ownerFetch(path,{
    ...(body===undefined?{method:'GET'}:{
      method:'POST',headers:{'content-type':'application/json','x-vivim-control':'1'},
      body:JSON.stringify(body)
    }),
    cache:'no-store',credentials:'same-origin'
  });
  if(!response.ok)throw Error('HOST_HTTP_'+response.status);
  return response.json();
}
/**
 * Exactly one optimistic attempt. Transport failure after Control execution
 * may mean the draft was applied; it is NEVER retried automatically.
 */
export async function runOwnerComposerDraft(
  client:OwnerComposerClient,goal:ComposerGoal
):Promise<ComposerOwnerResponse>{
  const id=goal?.correlationId??'';
  if(!identifier(id)||goal?.regionId!=='phone.composer'||
     !['append','replace'].includes(goal.operation)||typeof goal.text!=='string'||
     Buffer.byteLength(goal.text,'utf8')>MAX_BYTES||goal.text.includes('\0'))
    return failed('refused',id,'INVALID_GOAL');
  if(!client?.active())return failed('paused',id,'PAUSED');
  let stage:'read'|'stage'|'plan'|'approval'|'execute'|'verify'='read';
  let planId:string|undefined;
  try{
    const snapshot=await json(client,'/api/host/live-system');
    const region=snapshot?.regions?.find((r:any)=>r.id===goal.regionId);
    if(snapshot?.schema!=='vivim.host-live-system/1'||snapshot.state!=='source-backed'||
       !region||region.kind!=='input'||region.freshness!=='current'||
       region.sourceId!=='host.first-contact-composer'||
       typeof region.data?.draft!=='string'||typeof region.data?.sessionId!=='string'||
       !region.writable?.some((f:any)=>f.pointer==='/draft'&&f.actionId===ACTION))
      return failed('stale',id,'COMPOSER_SOURCE_NOT_CURRENT');
    const intended=goal.operation==='append'?region.data.draft+goal.text:goal.text;
    if(Buffer.byteLength(intended,'utf8')>MAX_BYTES||intended===region.data.draft)
      return failed('refused',id,'NO_CHANGE_OR_TOO_LARGE');
    if(!client.active())return failed('paused',id,'PAUSED');
    stage='stage';
    const proposal=await json(client,'/api/host/live-system/composer/stage',{
      sessionId:region.data.sessionId,intent:{
        epoch:snapshot.epoch,regionId:goal.regionId,pointer:'/draft',
        expectedSequence:snapshot.revision,
        expectedViewRevision:region.viewRevision,
        expectedSourceRevision:region.sourceRevision,
        correlationId:id,operation:goal.operation,text:goal.text
      }
    });
    if(proposal?.schema!=='vivim.composer-stage/1'||proposal.state!=='staged'||
       !/^[a-f0-9]{32}$/.test(proposal.stageId??'')||
       proposal.regionId!==goal.regionId||proposal.correlationId!==id||
       proposal.digest!==digest(intended)||proposal.effectPerformed!==false||
       proposal.executionAuthorized!==false)
      return failed('refused',id,'RUST_STAGE_INVALID');
    if(!client.active())return failed('paused',id,'PAUSED');
    stage='plan';
    const plan=await json(client,'/api/host/control/plan',{
      actionId:ACTION,args:{stage_id:proposal.stageId}
    });
    if(plan?.outcome!=='approval_required'||plan.actionId!==ACTION||
       !identifier(plan.planId)||!/^[0-9a-f]{64}$/.test(plan.planDigest??'')||
       plan.risk!=='R1')
      return failed('refused',id,'CONTROL_PLAN_UNAVAILABLE');
    planId=plan.planId;
    stage='approval';
    if(!client.active())return failed('paused',id,'PAUSED');
    // The caller's UI displays exact plan/risk/digest. No implicit approval.
    if(await client.approve(plan)!==true)return failed('paused',id,'OWNER_DECLINED');
    if(!client.active())return failed('paused',id,'PAUSED');
    stage='execute';
    const receipt=await json(client,'/api/host/control/execute',{
      planId:plan.planId,planDigest:plan.planDigest
    });
    if(receipt?.schema!=='vivim.control-receipt/1'||receipt.actionId!==ACTION||
       receipt.planId!==plan.planId||receipt.planDigest!==plan.planDigest)
      return failed('uncertain',id,'HOST_RECEIPT_INVALID');
    if(receipt.status!=='applied'||receipt.result?.status!=='verified'||
       receipt.result?.correlationId!==id||receipt.result?.regionId!==goal.regionId||
       receipt.result?.digest!==digest(intended)||
       receipt.result?.draftSent!==false||receipt.result?.providerEffect!==false)
      return failed('uncertain',id,'HOST_RECEIPT_NOT_VERIFIED');
    if(!client.active())return failed('paused',id,'PAUSED');
    stage='verify';
    const after=await json(client,'/api/host/live-system');
    const updated=after?.regions?.find((r:any)=>r.id===goal.regionId);
    if(after?.epoch!==snapshot.epoch||after.revision<=snapshot.revision||
       !updated||updated.freshness!=='current'||
       updated.sourceId!==region.sourceId||
       updated.sourceRevision!==receipt.result.sourceRevision||
       updated.viewRevision<=region.viewRevision||
       updated.data?.draft!==intended||
       updated.data?.sessionId!==region.data.sessionId)
      return failed('uncertain',id,'SOURCE_AFTER_RECEIPT_CONFLICT');
    return {status:'verified',correlationId:id,reason:'SOURCE_AND_HOST_RECEIPT_MATCH',
      sourceRevision:updated.sourceRevision,hostPlanId:planId};
  }catch{
    return failed(stage==='read'||stage==='stage'||stage==='plan'?'stale':'uncertain',
      id,'HOST_'+stage.toUpperCase()+'_UNAVAILABLE');
  }
}
