// Cross-owner, read-only evidence gate: a bridge command can advance its Host
// timeline only when an exact Studio request key + payload digest + validated
// thread-turn journal all agree. Never creates send authority or retries effects.
import path from 'node:path';
import {createHash} from 'node:crypto';
import {readRelayJournalCorrelations} from '../../../studio/src/studio/relay-journal-correlation.mjs';

const EVENT_SOURCE=Object.freeze({
  'send.authorized':'studio','send.observed':'journal',
  'reply.observed':'studio','send.uncertain':'journal'
});
const eligible=(link,kind)=>{
  if(kind==='send.authorized')return link.stages.dispatchAuthorized===true;
  if(kind==='send.observed')return link.stages.sendObserved===true;
  if(kind==='reply.observed')return link.stages.replyObserved===true&&link.stages.replyReady===true;
  if(kind==='send.uncertain')return link.stages.uncertain===true&&link.stages.sendObserved!==true;
  return false;
};
export function createStudioJournalEvidence({dataRoot}={}) {
  if(typeof dataRoot!=='string'||!path.isAbsolute(dataRoot))
    throw new TypeError('Absolute local Studio dataRoot required');
  const links=()=>readRelayJournalCorrelations({dataRoot,limit:100}).correlations;
  function observe(commandId,kind,link=null){
    if(!Object.hasOwn(EVENT_SOURCE,kind))return null;
    const match=link??links().find(l=>l.commandId===commandId);
    if(!match||match.commandId!==commandId||!eligible(match,kind))return null;
    return {kind,conversationId:match.relayConversationId,
      messageId:'msg-'+commandId.slice(4),commandId,
      requestId:match.requestKey,threadRef:match.threadRef,
      source:EVENT_SOURCE[kind],sourceRef:'studio-turn-'+createHash('sha256')
        .update(match.studioConversationId+'\u0000'+match.turnId).digest('hex'),
      sourceRevision:match.sourceRevision,evidenceDigest:match.proofDigest};
  }
  async function verify(observation){
    if(!observation||EVENT_SOURCE[observation.kind]!==observation.source)
      return {verified:false};
    const current=observe(observation.commandId,observation.kind);
    if(!current)return {verified:false};
    const keys=['kind','conversationId','messageId','commandId','requestId',
      'threadRef','source','sourceRef','sourceRevision','evidenceDigest'];
    if(keys.some(key=>current[key]!==observation[key]))return {verified:false};
    return {verified:true,source:current.source,sourceRef:current.sourceRef,
      sourceRevision:current.sourceRevision,evidenceDigest:current.evidenceDigest};
  }
  return {links,observe,verify};
}
