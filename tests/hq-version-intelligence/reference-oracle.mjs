/**
 * INDEPENDENT TEST ORACLE ONLY. Not installed product source; no new owner,
 * graph, executor, registry or authority. G1 must run against A-E implementations.
 */
import {createHash} from 'node:crypto';
export const fixedPins=Object.freeze({
 arbor:'f9823a5131e73e7562db5a4ec14e1ec481557d69',
 hq:'9b922ea049dbadc94e504b5b9432743995c020ca',
 harness:'cae97afe848d79957c9d6c698a90996a758bfd56',
 tierflow:'50822f11ee63c3d80f631f8fea7dcb9b19bffc38',
 labs:'022608f5797e7b4a14ccc4c393bd3c5a4704a4be',
 labsResearch:'67e76c5b730dcc2cd3ab3919c3ba273a6c260db8'
});
export function canonical(v) {
 if(Array.isArray(v)) return v.map(canonical);
 if(v!==null && typeof v==='object') {
  const o={};for(const k of Object.keys(v).sort())o[k]=canonical(v[k]);return o;
 }
 return v;
}
export function digest(v){return createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');}
export function acceptPin(p){
 return Boolean(p && /^[a-f0-9]{40}$/.test(p.resolvedCommitSha||'') &&
 /^[a-f0-9]{40}$/.test(p.rootTreeSha||'') && p.scope==='development' &&
 p.repoIdentity && p.repoIdentity.repository && p.pinId && p.manifestDigest);
}
export function freezePin(pin, fresh){
 if(!acceptPin(pin)) return {ok:false,code:'PIN_NOT_FOUND'};
 if(fresh && fresh!==pin.resolvedCommitSha)return {ok:false,code:'PIN_MOVED',pin};
 return {ok:true,pin};
}
const secret=/(\.env(?:[^/]*$|\/)|\.pem$|\.p12$|\.keystore$|(?:^|\/)(?:cookies|login data|session\.json|storage-state\.json|release-profile\.json)(?:\/|$))/i;
export function safePath(path,kind='file'){
 if(typeof path!=='string'||!path||path.length>2048||/[\x00-\x1f\x7f]/.test(path))return false;
 if(path.startsWith('/')||path.startsWith('\\')||/^[a-zA-Z]:/.test(path)||path.includes('\\'))return false;
 const parts=path.split('/');
 if(parts.some(x=>x===''||x==='.'||x==='..'||x==='.git')||secret.test(path))return false;
 if(kind==='symlink'||kind==='junction'||kind==='submodule')return false;
 return true;
}
export function classifySource(a,b,allTargets=[]){
 if(a.blobSha && b?.blobSha===a.blobSha)return 'EXACT_BLOB';
 if(b?.blobSha)return 'SAME_PATH_CHANGED';
 if(allTargets.some(x=>x.path!==a.path&&x.blobSha===a.blobSha))return 'EXACT_RELOCATION';
 if(a.coverage!=='complete'||b?.coverage==='partial'||b?.coverage==='missing'||b?.coverage==='blocked')return 'UNOBSERVABLE';
 return 'MISSING_AT_TARGET';
}
export function candidateEquivalence(left,right,decision=null){
 if(!decision||decision.ownerConfirmed!==true||!decision.receipt||left.owner!==right.owner)
  return {disposition:'REVIEW_REQUIRED',authority:'unchanged'};
 return {disposition:'CONFIRMED_EQUIVALENT',authority:'unchanged',receipt:decision.receipt};
}
export function capabilityStage({source=false,installed=false,hostReceipt=false,deviceReceipt=false}={}){
 if(!source)return 'UNKNOWN';
 if(!installed)return 'IMPORTED_NOT_WIRED';
 if(!hostReceipt)return 'SOURCE_WIRED_UNVERIFIED';
 if(!deviceReceipt)return 'SOURCE_WIRED_UNVERIFIED';
 return 'RUNTIME_VERIFIED';
}
export function bounded(rows,{maxEntries=1000,maxBlobBytes=1500000,cancelled=false}={}){
 if(cancelled)return {items:[],truncated:true,completeness:'partial',reason:'cancelled'};
 const items=rows.slice(0,maxEntries).filter(x=>(x.bytes??0)<=maxBlobBytes);
 return {items,truncated:items.length!==rows.length,completeness:items.length===rows.length?'complete':'partial',reason:items.length===rows.length?null:'resource_bound'};
}
export function checkGrant({actorId,sessionId,grant,revoked=false,scope='development',personalWorld=false}={}){
 return Boolean(actorId && sessionId && grant && grant.actorId===actorId && grant.sessionId===sessionId &&
 grant.active===true && !revoked && scope==='development' && !personalWorld && grant.scope==='development');
}
export function safePublicText(text,allowed=false){
 if(!allowed||typeof text!=='string'||/token\s*=|password\s*=|api[_-]?key\s*=|private world|session cookie/i.test(text))return null;
 return text;
}
export function classifyResearch({design=false,implemented=false,installed=false}={}){
 if(installed)return 'SOURCE_WIRED_UNVERIFIED';
 if(implemented)return 'RESEARCH_IMPLEMENTED';
 return design?'DESIGN_ONLY':'UNKNOWN';
}
