// Trust-preserving join of an existing relay command and a Studio-owned send-once turn.
// Read-only: no claim, submit, reply, journal mutation or provider action.
// A match requires the exact bridge-generated request key, unchanged payload digest,
// and checksum-validated, conversation-owned thread journal evidence.
import {createHash} from 'node:crypto';
import {existsSync,lstatSync,readdirSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {createBridgeStore} from './bridge-commands.mjs';
import {parseRelayChatIntent} from './relay-chat-intent.mjs';
import {validConversationSnapshot} from '../capture/conversation-service.mjs';
import {readThreadTurnJournalEvidence} from '../capture/thread-turn-journal.mjs';

export const RELAY_JOURNAL_LINK_SCHEMA='vivim.relay-studio-journal-correlation/1';
const FILE=/^([a-zA-Z0-9][a-zA-Z0-9_-]{0,127})\.conversation\.json$/;
const COMMAND=/^cmd-[a-f0-9]{16}$/;
const hash=text=>createHash('sha256').update(text,'utf8').digest('hex');
const safeFile=file=>{
  const stat=lstatSync(file);
  return stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=4*1024*1024;
};
export function readRelayJournalCorrelations({dataRoot,limit=50}={}) {
  if(typeof dataRoot!=='string'||!path.isAbsolute(dataRoot)||
      !Number.isInteger(limit)||limit<1||limit>100)
    throw new TypeError('Invalid relay journal correlation scope');
  const store=createBridgeStore({root:dataRoot});
  const commands=store.list({limit:200}).items.filter(r=>
    COMMAND.test(r.id??'')&&r.origin==='relay'&&r.mode==='relay-chat'&&
    r.consumer==='harness'&&typeof r.text==='string'&&
    r.studioRequestKey==='relay-'+r.id);
  const root=path.join(dataRoot,'conversations');
  const base={schema:RELAY_JOURNAL_LINK_SCHEMA,
    source:'bridge-and-studio-thread-journal',readOnly:true,
    state:'no-studio-snapshots',checkedCommands:commands.length,correlations:[],
    unmatched:commands.length,unavailableSnapshots:0};
  if(!existsSync(root))return base;
  const stat=lstatSync(root);
  if(!stat.isDirectory()||stat.isSymbolicLink())return {...base,state:'unavailable'};
  const candidates=readdirSync(root).filter(n=>FILE.test(n))
    .map(name=>{try{return {name,mtime:lstatSync(path.join(root,name)).mtimeMs};}
      catch{return {name,mtime:-1};}})
    .sort((a,b)=>b.mtime-a.mtime).slice(0,200).map(x=>x.name);
  const indexed=new Map();
  let unavailable=0;
  for(const name of candidates) {
    const id=FILE.exec(name)[1],file=path.join(root,name);
    try {
      if(!safeFile(file))throw new Error('UNSAFE_SNAPSHOT');
      const snapshot=JSON.parse(readFileSync(file,'utf8'));
      if(!validConversationSnapshot(snapshot,id)||!snapshot.binding?.thread)continue;
      for(const attempt of snapshot.attempts??[]) {
        if(typeof attempt.key==='string'&&attempt.key.startsWith('relay-cmd-')) {
          const matches=indexed.get(attempt.key)??[];
          matches.push({snapshot,attempt});
          indexed.set(attempt.key,matches);
        }
      }
    } catch {unavailable++; }
  }
  const correlations=[];
  for(const command of commands) {
    if(correlations.length>=limit)break;
    // The bridge must really have been claimed by its harness consumer; a
    // manually completed but never claimed job is not a Studio execution.
    let history;
    try{history=store.history(command.id);}catch{continue;}
    if(!history.some(r=>r.status==='claimed'&&r.consumer==='harness'&&r.origin==='relay'))continue;
    const candidates=indexed.get(command.studioRequestKey)??[];
    // Ambiguous duplicates must not be resolved by file-order preference.
    if(candidates.length!==1)continue;
    const {snapshot,attempt}=candidates[0];
    // Mirror the *actual* Studio worker's prompt bytes, including a validated
    // @provider prefix. A prefix is routing syntax, not part of the sent prompt.
    // Reject any provider/target conflict rather than guessing.
    let intent;
    try{intent=parseRelayChatIntent(command);}catch{continue;}
    if(intent.provider!==snapshot.site||intent.model||intent.effort)continue;
    if(attempt.payloadDigest!==hash(intent.prompt))continue;
    let journal;
    try{journal=readThreadTurnJournalEvidence({
      dataDir:path.join(root,'thread-turns'),namespace:'local-owner',
      origin:snapshot.binding.origin,thread:snapshot.binding.thread,
      conversationId:snapshot.id
    });}catch{continue;}
    if(journal.state!=='verified')continue;
    const turns=journal.turns.filter(t=>t.id===attempt.id&&
      t.key===attempt.key&&t.payloadDigest===attempt.payloadDigest);
    if(turns.length!==1)continue;
    const turn=turns[0];
    // A verified journal reply is not automatically the reply shown on a
    // phone. Studio mode publishes "[provider] <reply>"; compare exact bytes
    // against the independent journal content digest before granting a render
    // receipt. Truncated, modified, failed and missing responses fail closed.
    const replyPrefix='['+intent.provider+'] ';
    const replyDisplayMatchesJournal=command.status==='done' &&
      turn.replyObserved && turn.readiness==='ready' &&
      typeof command.result==='string' &&
      command.result.startsWith(replyPrefix) &&
      /^[a-f0-9]{64}$/.test(turn.replyContentDigest??'') &&
      hash(command.result.slice(replyPrefix.length))===turn.replyContentDigest;
    correlations.push({
      commandId:command.id,relayConversationId:command.conversationId,
      studioConversationId:snapshot.id,turnId:turn.id,
      requestKey:attempt.key,provider:snapshot.site??null,
      threadRef:snapshot.binding.thread.ref,sourceRevision:turn.revision,
      stages:{dispatchAuthorized:turn.dispatchAuthorized,
        sendObserved:turn.deliveryObserved,replyObserved:turn.replyObserved,
        replyReady:turn.readiness==='ready',completion:turn.completion,
        uncertain:turn.uncertainty,
        replyDisplayMatchesJournal},
      proofDigest:hash(JSON.stringify({commandId:command.id,key:attempt.key,
        payloadDigest:attempt.payloadDigest,studioConversationId:snapshot.id,
        turnId:turn.id,revision:turn.revision,delivery:turn.deliveryObserved,
        reply:turn.replyObserved,readiness:turn.readiness})),
      phoneDeliveryAcknowledged:false
    });
  }
  return {...base,state:'source-backed',correlations,
    unmatched:commands.length-correlations.length,unavailableSnapshots:unavailable};
}
