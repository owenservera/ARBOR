// Evidence adapter: the Studio bridge ledger is canonical. No provider send or reply proof.
import {createHash} from 'node:crypto';
import path from 'node:path';
import {createBridgeStore} from '../../../studio/src/studio/bridge-commands.mjs';

const COMMAND=/^cmd-[0-9a-f]{16}$/;
const CONVERSATION=/^c-[a-f0-9]{16}$/;
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const proofOf=record=>({
  source:record.status==='queued'?'relay':'bridge', sourceRef:record.id, sourceRevision:record.rev,
  evidenceDigest:sha({id:record.id,rev:record.rev,status:record.status,
    origin:record.origin,mode:record.mode,consumer:record.consumer,
    conversationId:record.conversationId??null,target:record.target??null})
});
export function createBridgeEvidence({dataRoot}={}) {
  if(typeof dataRoot!=='string'||!path.isAbsolute(dataRoot))throw new TypeError('Absolute dataRoot required');
  const store=createBridgeStore({root:dataRoot});
  function observe(commandId,kind=null,revision=null) {
    if(!COMMAND.test(commandId??''))return null;
    let record;
    try {
      const wantedStatus=['conversation.created','message.intent','transport.queued'].includes(kind)
        ? 'queued' : kind==='bridge.claimed' ? 'claimed' : null;
      if(wantedStatus || revision!==null) {
        const records=store.history(commandId);
        record=records.find(r=>r.status===wantedStatus &&
          (revision===null||r.rev===revision));
      } else record=store.get(commandId);
    } catch {return null;}
    if(!record||!['queued','claimed'].includes(record.status) ||
       record.origin!=='relay'||record.mode!=='relay-chat'||
       !CONVERSATION.test(record.conversationId??''))return null;
    const current=record.status==='queued'?'transport.queued':'bridge.claimed';
    if(kind!==null && kind!==current && !(['conversation.created','message.intent'].includes(kind) && record.status==='queued'))return null;
    const eventKind=kind??current;
    const base={kind:eventKind,conversationId:record.conversationId,...proofOf(record)};
    if(eventKind==='conversation.created')return {...base,
      ...(record.target?.provider?{provider:record.target.provider}:{}),
      ...(record.target?.model?{model:record.target.model}:{})};
    return {...base,commandId:record.id,
      ...(eventKind==='message.intent'?{messageId:'msg-'+record.id.slice(4),
        ...(record.target?.provider?{provider:record.target.provider}:{}),
        ...(record.target?.model?{model:record.target.model}:{})}:{})};
  }
  async function verify(observation) {
    if(!observation||!['relay','bridge'].includes(observation.source)||
       !COMMAND.test(observation.sourceRef??''))return {verified:false};
    const current=observe(observation.sourceRef,observation.kind,observation.sourceRevision);
    if(!current)return {verified:false};
    for(const key of ['kind','conversationId','messageId','commandId','provider','model',
      'source','sourceRef','sourceRevision','evidenceDigest']) {
      // Queue/claim records carry no messageId; the projection binds it to commandId.
      if(key==='messageId'&&current.messageId===undefined&&current.commandId!==undefined)continue;
      if(current[key]!==observation[key])return {verified:false};
    }
    return {verified:true,source:current.source,sourceRef:current.sourceRef,
      sourceRevision:current.sourceRevision,evidenceDigest:current.evidenceDigest};
  }
  async function verifyObservation(observation,verifyOtherSource) {
    if(observation?.source==='bridge'||observation?.source==='relay')return verify(observation);
    if(typeof verifyOtherSource!=='function')return {verified:false};
    return verifyOtherSource(observation);
  }
  // Bounded discoverability for crash recovery. The authoritative bridge records
  // may have been accepted while the independent metadata read model was unavailable.
  const recentRelayChats=()=>store.list({limit:200}).items
    .filter(r=>r.origin==='relay' && r.mode==='relay-chat' &&
      CONVERSATION.test(r.conversationId??''))
    .map(r=>({commandId:r.id,conversationId:r.conversationId}));
  // Metadata-only claim enumeration from the same source ledger; never leak text or result.
  const currentClaims=()=>{
    const latest=store.list({limit:200}).items.filter(r=>
      r.origin==='relay' && r.mode==='relay-chat' && CONVERSATION.test(r.conversationId??''));
    const histories=store.histories(latest.map(r=>r.id));
    return latest.flatMap(r=>{
      const claimed=(histories.get(r.id)||[]).find(x=>
        x.status==='claimed' && x.origin==='relay' && x.mode==='relay-chat' &&
        x.conversationId===r.conversationId);
      return claimed?[{commandId:r.id,conversationId:r.conversationId,
        revision:claimed.rev}]:[];
    });
  };
  return {observe,verify,verifyObservation,currentClaims,recentRelayChats};
}
