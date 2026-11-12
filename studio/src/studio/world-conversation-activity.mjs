// Pure Personal World projection of Studio's saved conversation snapshots.
// No browser access, replay, journal mutation, transcript bodies or delivery claims.
// Studio's own conversation service and thread journal remain source authorities.
import {readdirSync,lstatSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {validConversationSnapshot} from '../capture/conversation-service.mjs';
import {readThreadTurnJournalEvidence} from '../capture/thread-turn-journal.mjs';

export const STUDIO_CONVERSATION_ACTIVITY_SCHEMA='vivim.world-studio-conversation-activity/1';
const NAME=/^([a-zA-Z0-9][a-zA-Z0-9_-]{0,127})\.conversation\.json$/;
const MAX_BYTES=4*1024*1024;
export function readStudioConversationActivity({dataRoot,limit=40}={}) {
  if(!path.isAbsolute(dataRoot??'')||!Number.isInteger(limit)||limit<1||limit>100)
    throw new TypeError('Invalid Studio conversation activity scope');
  const root=path.join(dataRoot,'conversations');
  const empty={schema:STUDIO_CONVERSATION_ACTIVITY_SCHEMA,source:'studio-conversation-snapshot',
    authoritativeFor:'saved-snapshot-only',state:'no-snapshots',conversations:[]};
  if(!existsSync(root))return empty;
  const rootStat=lstatSync(root);
  if(!rootStat.isDirectory()||rootStat.isSymbolicLink())return {...empty,state:'unavailable'};
  // The limit caps files read, not source-name discovery. UUID filenames do
  // not encode recency, so sort by source mtime rather than lexicographic id.
  const candidates=readdirSync(root).filter(name=>NAME.test(name))
    .map(name=>{try{return {name,mtime:lstatSync(path.join(root,name)).mtimeMs};}
      catch{return {name,mtime:-1};}})
    .sort((a,b)=>b.mtime-a.mtime).slice(0,200).map(x=>x.name);
  const conversations=[];
  let unavailable=0;
  for(const filename of candidates) {
    if(conversations.length>=limit)break;
    const id=NAME.exec(filename)[1],file=path.join(root,filename);
    try {
      const stat=lstatSync(file);
      if(!stat.isFile()||stat.isSymbolicLink()||stat.size>MAX_BYTES)throw new Error('UNSAFE_SOURCE');
      const raw=JSON.parse(readFileSync(file,'utf8'));
      if(!validConversationSnapshot(raw,id))throw new Error('INVALID_SNAPSHOT');
      let journal={state:'missing',turns:[]};
      if(raw.binding?.thread) {
        try {
          journal=readThreadTurnJournalEvidence({
            dataDir:path.join(root,'thread-turns'),namespace:'local-owner',
            origin:raw.binding.origin,thread:raw.binding.thread,conversationId:id
          });
        } catch { journal={state:'unavailable',turns:[]}; }
      }
      const byTurn=new Map(journal.turns.map(t=>[t.id,t]));
      conversations.push({id,site:raw.site??null,state:raw.state??'unknown',
        revision:raw.revision,updatedAt:raw.updatedAt??null,
        journalState:journal.state,journalRevision:journal.revision??null,
        // A snapshot is not proof of a current browser effect or that the
        // phone received a response. Never expose prompt/reply text.
        deliveryAcknowledged:false,
        attempts:raw.attempts.slice(-30).map(a=>{
          const j=byTurn.get(a.id);
          const attributed=j && j.key===a.key && j.payloadDigest===a.payloadDigest ? j:null;
          return {id:a.id,phase:a.phase??null,
            // Snapshot observation is distinct from verified journal evidence.
            sendState:a.send?.state??'unknown',replyState:a.reply?.state??'unknown',
            journalVerified:Boolean(attributed),
            journalDispatchAuthorized:attributed?.dispatchAuthorized??false,
            journalDeliveryObserved:attributed?.deliveryObserved??false,
            journalReplyObserved:attributed?.replyObserved??false,
            journalReadiness:attributed?.readiness??'unknown',
            journalCompletion:attributed?.completion??'unknown',
            uncertain:a.send?.state==='uncertain'||a.phase==='unknown'||
              attributed?.uncertainty===true};
        })});
    } catch {unavailable++; }
  }
  return {...empty,state:'source-backed',conversations,unavailable};
}
