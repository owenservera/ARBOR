// Evidence adapter: the Studio bridge ledger is canonical. No provider send or reply proof.
import {createHash} from 'node:crypto';
import path from 'node:path';
import {createBridgeStore} from '../../../studio/src/studio/bridge-commands.mjs';

export const CONVERSATION_KNOWLEDGE_SCHEMA='vivim.conversation-knowledge/1';
const MAX_KNOWLEDGE_ROWS=500;
const COMMAND=/^cmd-[0-9a-f]{16}$/;
const CONVERSATION=/^c-[a-f0-9]{16}$/;
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
// Native ingestion consumes durable nodes keyed by stable source identity. Rows
// carry the same field names as the Host's existing native knowledge rows
// (chat/rust-context.mjs buildNativeKnowledge): id, kind, semanticId, sourceRef,
// digest, revision, sourceRevision, order, title, summary. Provenance is the
// (source, ledger, sourceRef, sourceRevision, digest) tuple; authority stays
// host-read-only. `order` is the ledger commit time when the source exposes one
// and null otherwise - it is never synthesized, so replays stay byte-identical.
const clean=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/gu,' ').trim().slice(0,100);
export function knowledgeRow({stage,source,ledger,sourceRef,sourceRevision,digest,order,semanticId,title,summary}){
  return {id:'vivim-context-c-'+sha([ledger,source,stage,sourceRef]),kind:'conversation-evidence',
    stage,ledger,source,sourceRef,sourceRevision,digest,revision:sourceRevision,order,
    semanticId,title:clean(title),summary:clean(summary),authority:'host-read-only'};
}
export function knowledgeEnvelope({revision,items,tombstones,omitted=0,extra={}}={}){
  const byId=new Map(),gone=new Map();
  for(const row of items)if(row&&!byId.has(row.id))byId.set(row.id,row);
  for(const t of tombstones??[]){const key=t.sourceRef+'\u0000'+t.stage;if(!gone.has(key))gone.set(key,{sourceRef:t.sourceRef,stage:t.stage,reason:clean(t.reason)});}
  const rows=[...byId.values()].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  const goneRows=[...gone.values()].sort((a,b)=>a.sourceRef<b.sourceRef?-1:a.sourceRef>b.sourceRef?1:
    a.stage<b.stage?-1:a.stage>b.stage?1:0);
  return {schema:CONVERSATION_KNOWLEDGE_SCHEMA,authority:'host-read-only',
    revision:Number.isSafeInteger(revision)&&revision>=0?revision:0,
    items:rows.slice(0,MAX_KNOWLEDGE_ROWS),tombstones:goneRows,
    omitted:omitted+Math.max(0,rows.length-MAX_KNOWLEDGE_ROWS),...extra};
}
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
  // Incremental native-knowledge projection over the *current* bridge state.
  // Derived on every call from the canonical ledger: a record that has left the
  // queue/claim state contributes no row, so revoked evidence is absent at once
  // and only its stable identity is reported as a scoped tombstone. Historical
  // attestation is unchanged (verify() still proves the old revision).
  function nativeKnowledge({limit=200}={}) {
    let records;
    try {
      records=store.list({limit}).items;
    } catch {
      return knowledgeEnvelope({revision:0,items:[],tombstones:[],omitted:0,
        extra:{state:'unavailable'}});
    }
    const items=[],tombstones=[];let omitted=0;
    for(const record of records) {
      if(record.origin!=='relay'||record.mode!=='relay-chat'||
         !CONVERSATION.test(record.conversationId??''))continue;
      const order=Date.parse(record.createdAt);
      if(!Number.isFinite(order)){omitted++;continue;}
      const current=observe(record.id);
      const queued=current?.kind==='transport.queued'?current:observe(record.id,'transport.queued');
      const claimed=current?.kind==='bridge.claimed'?current:observe(record.id,'bridge.claimed');
      // One current node per command. A stage the ledger has moved past is
      // retracted by identity (never by content) so native ingestion deletes
      // exactly that node and nothing else; history stays attested by verify().
      if(!current){
        if(queued)tombstones.push({sourceRef:record.id,stage:'transport.queued',reason:'left-queue-or-claim-state'});
        if(claimed)tombstones.push({sourceRef:record.id,stage:'bridge.claimed',reason:'left-queue-or-claim-state'});
        continue;
      }
      const stage=current.kind;
      items.push(knowledgeRow({stage,source:current.source,ledger:'studio-bridge',
        sourceRef:current.sourceRef,sourceRevision:current.sourceRevision,
        digest:current.evidenceDigest,order,
        semanticId:'vivim:conversation:'+record.conversationId+':msg-'+record.id.slice(4),
        title:stage==='bridge.claimed'?'Relay claim · '+record.id:'Relay queue · '+record.id,
        summary:'Source-verified relay-chat '+(stage==='bridge.claimed'?'claim':'queue')+
          ' evidence, revision '+record.rev}));
      const other=stage==='bridge.claimed'?'transport.queued':'bridge.claimed';
      const superseded=other==='transport.queued'?queued:claimed;
      if(superseded)tombstones.push({sourceRef:record.id,stage:other,
        reason:'superseded-by-'+stage});
    }
    return knowledgeEnvelope({revision:records.length,items,tombstones,omitted});
  }
  return {observe,verify,verifyObservation,currentClaims,recentRelayChats,nativeKnowledge};
}
