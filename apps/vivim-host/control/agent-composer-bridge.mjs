// Host-local, bounded one-shot composer delivery. Not a new authority, token,
// source database or provider path. The existing Control plan claims effects.
import {randomBytes,createHash} from 'node:crypto';
import {runNativeProductPure} from './native-product-pure.mjs';

const ACTION='pwa.composer.draft.set';
const fail=(code,status=409)=>Object.assign(Error(code),{code,status});
const sid=s=>typeof s==='string'&&/^[a-f0-9]{32}$/.test(s);
const cid=s=>typeof s==='string'&&/^[a-zA-Z0-9._:-]{1,128}$/.test(s);
const digest=s=>createHash('sha256').update(s).digest('hex');
const MAX_BYTES=1000, FRESH_MS=25_000, STAGE_MS=60_000, ACK_MS=12_000;
const bytes=s=>Buffer.byteLength(s,'utf8');
export function createHostComposerBridge({readSnapshot,compute=runNativeProductPure,
    clock=()=>Date.now()}={}){
  if(typeof readSnapshot!=='function'||typeof compute!=='function')
    throw fail('COMPOSER_BRIDGE_UNBOUND',503);
  const sessions=new Map(), stages=new Map();
  let selected=null,sourceRevision=0,paused=false,inflight=null;
  function active(){
    const entry=selected&&sessions.get(selected);
    return entry&&clock()-entry.seenAt<FRESH_MS?entry:null;
  }
  function observe(body){
    if(!body||Object.keys(body).some(k=>!['sessionId','revision','text','mode','visible','composing','correlationId'].includes(k))||
       !sid(body.sessionId)||!Number.isSafeInteger(body.revision)||body.revision<1||
       typeof body.text!=='string'||bytes(body.text)>MAX_BYTES||body.text.includes('\0')||
       body.mode!=='vivim'||typeof body.visible!=='boolean'||typeof body.composing!=='boolean'||
       (body.correlationId!==undefined&&!cid(body.correlationId)))
      throw fail('COMPOSER_OBSERVATION_INVALID',400);
    const previous=sessions.get(body.sessionId);
    if(previous&&(body.revision<previous.revision||
      (body.revision===previous.revision&&
       (body.text!==previous.text||body.mode!==previous.mode||
        body.visible!==previous.visible||body.composing!==previous.composing))))
      throw fail('COMPOSER_SOURCE_REVISION_CONFLICT');
    if(previous&&body.revision>previous.revision+1)
      throw fail('COMPOSER_SOURCE_GAP');
    const changed=!previous||previous.revision!==body.revision||selected!==body.sessionId;
    if(changed)sourceRevision++;
    selected=body.sessionId;
    sessions.set(body.sessionId,{...body,seenAt:clock(),sourceRevision});
    // Bounded in-memory source cache; never retain full drafts in a diagnostic log.
    for(const [key,value] of sessions)if(clock()-value.seenAt>FRESH_MS*3) sessions.delete(key);
    if(sessions.size>8){for(const key of sessions.keys()){if(key!==selected){sessions.delete(key);break;}}}
    return {schema:'vivim.composer-observation-receipt/1',state:'observed',
      sourceRevision,localRevision:body.revision,authority:'source-only',
      executionAuthorized:false,effectPerformed:false};
  }
  function observation(){
    const item=active();
    if(!item)return [];
    return [{
      id:'phone.composer',kind:'input',sourceId:'host.first-contact-composer',
      sourceRevision:item.sourceRevision,observedAtMs:item.seenAt,
      freshness:'current',exposure:'owner',
      data:{draft:item.text,sessionId:item.sessionId,target:item.mode,
        visible:item.visible,composing:item.composing,localRevision:item.revision},
      writable:item.visible&&!item.composing&&!paused?[{
        pointer:'/draft',primitive:'text',actionId:ACTION}]:[]
    }];
  }
  async function stage(body){
    if(paused)throw fail('COMPOSER_PAUSED',423);
    if(!body||Object.keys(body).some(k=>!['sessionId','intent'].includes(k))||
       !sid(body.sessionId)||!body.intent||typeof body.intent!=='object')
      throw fail('COMPOSER_STAGE_INVALID',400);
    const entry=active();
    if(!entry||entry.sessionId!==body.sessionId||!entry.visible||entry.composing)
      throw fail('COMPOSER_SOURCE_UNAVAILABLE');
    const snapshot=await readSnapshot();
    const region=snapshot?.regions?.find(r=>r.id==='phone.composer');
    if(!region||region.sourceRevision!==entry.sourceRevision||region.data?.sessionId!==entry.sessionId||
       region.freshness!=='current'||!region.writable?.some(x=>x.pointer==='/draft'&&x.actionId===ACTION))
      throw fail('COMPOSER_SOURCE_STALE');
    const intent=body.intent;
    if(intent.regionId!=='phone.composer'||intent.pointer!=='/draft'||
       intent.epoch!==snapshot.epoch||intent.expectedSequence!==snapshot.revision||
       intent.expectedViewRevision!==region.viewRevision||
       intent.expectedSourceRevision!==region.sourceRevision||
       !cid(intent.correlationId)||!['replace','append'].includes(intent.operation)||
       typeof intent.text!=='string'||bytes(intent.text)>MAX_BYTES)
      throw fail('COMPOSER_STAGE_STALE');
    const wire=await compute('agent-composer',{schema:'vivim.agent-composer-request/1',
      state:{schema:'vivim.live-system-state/1',epoch:snapshot.epoch,
        sequence:snapshot.revision,regions:snapshot.regions},
      actor:{actorId:'desktop-owner',allowedRegions:['phone.composer']},intent});
    const output=wire?.result;
    if(wire?.state!=='computed'||wire?.authority!=='none'||
       wire?.executionAuthorized!==false||wire?.effectPerformed!==false||
       output?.schema!=='vivim.agent-composer-computation/1'||
       output?.authority!=='none'||output?.executionAuthorized!==false||
       output?.effectPerformed!==false)
      throw fail('COMPOSER_NATIVE_UNAVAILABLE',503);
    if(output.state!=='computed')throw fail('COMPOSER_NATIVE_REFUSED');
    const proposal=output.result;
    if(proposal?.schema!=='vivim.agent-composer-proposal/1'||
       proposal.actorId!=='desktop-owner'||proposal.effectPerformed!==false||
       proposal.executionAuthorized!==false||
       proposal.candidate?.actionId!==ACTION||
       proposal.candidate?.sourceId!==region.sourceId||
       proposal.candidate?.oldValue!==entry.text||
       typeof proposal.candidate?.newValue!=='string'||bytes(proposal.candidate.newValue)>MAX_BYTES||
       proposal.candidate.expectedSourceRevision!==entry.sourceRevision||
       proposal.candidate.correlationId!==intent.correlationId)
      throw fail('COMPOSER_NATIVE_INVALID',503);
    const stageId=randomBytes(16).toString('hex');
    stages.set(stageId,{stageId,sessionId:entry.sessionId,clientRevision:entry.revision,
      sourceRevision:entry.sourceRevision,epoch:snapshot.epoch,sequence:snapshot.revision,
      viewRevision:region.viewRevision,proposal,createdAt:clock(),claimed:false});
    for(const [key,value] of stages)if(clock()-value.createdAt>STAGE_MS*2||stages.size>32)stages.delete(key);
    return {schema:'vivim.composer-stage/1',state:'staged',stageId,
      correlationId:intent.correlationId,regionId:'phone.composer',
      sourceRevision:entry.sourceRevision,expiresAt:clock()+STAGE_MS,
      digest:digest(proposal.candidate.newValue),executionAuthorized:false,effectPerformed:false};
  }
  async function execute(stageId){
    const entry=stages.get(stageId),phone=active();
    if(!sid(stageId)||!entry||entry.claimed||paused||inflight||
       clock()-entry.createdAt>=STAGE_MS||!phone||
       phone.sessionId!==entry.sessionId||phone.revision!==entry.clientRevision||
       phone.sourceRevision!==entry.sourceRevision||phone.text!==entry.proposal.candidate.oldValue)
      throw fail('COMPOSER_STAGE_STALE');
    entry.claimed=true; // No second execution, even if the outcome is uncertain.
    const current=await readSnapshot();
    const region=current?.regions?.find(r=>r.id==='phone.composer');
    if(current?.epoch!==entry.epoch||current.revision!==entry.sequence||
       region?.viewRevision!==entry.viewRevision||region?.sourceRevision!==entry.sourceRevision)
      throw fail('COMPOSER_STAGE_STALE');
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{
        if(inflight?.stageId===stageId){inflight=null;reject(fail('COMPOSER_OUTCOME_UNCERTAIN',503));}
      },ACK_MS);
      timer.unref?.();
      inflight={...entry,delivered:false,timer,resolve,reject};
    });
  }
  function delivery(sessionId){
    if(!sid(sessionId))throw fail('COMPOSER_SESSION_INVALID',400);
    const job=inflight;
    if(paused||!job||job.sessionId!==sessionId||job.delivered)
      return {schema:'vivim.composer-delivery-state/1',state:'none'};
    const phone=active();
    if(!phone||phone.sessionId!==sessionId||phone.revision!==job.clientRevision){
      clearTimeout(job.timer);inflight=null;job.reject(fail('COMPOSER_HUMAN_CONFLICT'));
      return {schema:'vivim.composer-delivery-state/1',state:'none'};
    }
    job.delivered=true; // Loss after this boundary is UNCERTAIN, never a replay.
    return {schema:'vivim.agent-composer-delivery/1',
      epoch:job.epoch,actorId:'desktop-owner',candidate:job.proposal.candidate,
      sessionId:job.sessionId,localRevision:job.clientRevision};
  }
  async function acknowledge(body){
    const job=inflight;
    if(!job||!job.delivered||!body||body.sessionId!==job.sessionId||
       body.correlationId!==job.proposal.candidate.correlationId||
       body.stage!=='applied-local')throw fail('COMPOSER_ACK_UNKNOWN');
    const phone=active();
    if(!phone||phone.sessionId!==job.sessionId||
       phone.revision<=job.clientRevision||
       phone.sourceRevision<=job.sourceRevision||
       phone.text!==job.proposal.candidate.newValue||
       phone.correlationId!==body.correlationId||
       phone.composing||!phone.visible)
      throw fail('COMPOSER_ACK_SOURCE_MISMATCH');
    // Phone-local input ACK is not sufficient. Verify a NEW authoritative
    // Rust LiveSystemState region before the existing Control journal can
    // record the effect result; a raced human edit fails rather than passing.
    const observed=await readSnapshot();
    const region=observed?.regions?.find(r=>r.id==='phone.composer');
    if(!region||observed.epoch!==job.epoch||
       region.sourceRevision!==phone.sourceRevision||
       region.viewRevision<=job.viewRevision||
       region.data?.sessionId!==job.sessionId||
       region.data?.draft!==phone.text||
       region.data?.localRevision!==phone.revision||
       region.freshness!=='current')
      throw fail('COMPOSER_RENDER_SOURCE_UNVERIFIED');
    clearTimeout(job.timer);inflight=null;
    const result={schema:'vivim.composer-render-proof/1',status:'verified',
      correlationId:body.correlationId,sessionId:body.sessionId,
      regionId:'phone.composer',sourceRevision:phone.sourceRevision,
      viewRevision:region.viewRevision,sequence:observed.revision,
      localRevision:phone.revision,digest:digest(phone.text),
      draftSent:false,providerEffect:false};
    job.resolve(result);return {schema:'vivim.composer-ack/1',state:'verified',
      correlationId:body.correlationId,sourceRevision:phone.sourceRevision};
  }
  function setPaused(next){
    paused=next===true;
    // A paused operator must not leave an undelivered edit authorized.
    if(paused&&inflight){const job=inflight;inflight=null;
      clearTimeout(job.timer);job.reject(fail(job.delivered?'COMPOSER_OUTCOME_UNCERTAIN':'COMPOSER_PAUSED',job.delivered?503:423));}
    stages.clear();
    return {schema:'vivim.composer-control/1',paused,executionAuthorized:false,effectPerformed:false};
  }
  function status(){
    const phone=active();
    return {schema:'vivim.composer-control/1',paused,connected:!!phone,
      sessionId:phone?.sessionId??null,sourceRevision:phone?.sourceRevision??null,
      localRevision:phone?.revision??null,inflight:inflight?{
        correlationId:inflight.proposal.candidate.correlationId,
        stage:inflight.delivered?'delivered-uncertain':'awaiting-poll'}:null};
  }
  return Object.freeze({observe,observation,stage,execute,delivery,acknowledge,setPaused,status});
}
