# File: tests/hq-version-intelligence/reference-oracle.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | tests/hq-version-intelligence/reference-oracle.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6076 B |
| Lines | 103 |
| Hash | 648963f82c5b |
| Test | yes |
| Generated | no |
| Component | tests |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fixedPins | const | 6 | yes | export const fixedPins=Object.freeze({ arbor:&#39;f9823a5131e73e7562db5a4ec14e1ec481557d69&#39;, hq:&#39;9b922ea049dbadc94e504b5b9432743995c020ca&#39;, harness:&#39;cae97afe848d79957c9d6c698a90996a758bfd56&#39;, tierflow:&#39;5… |
| canonical | function | 14 | yes | export function canonical(v) { |
| o | const | 17 | no | const o={};for(const k of Object.keys(v).sort())o[k]=canonical(v[k]);return o; |
| digest | function | 21 | yes | export function digest(v){return createHash(&#39;sha256&#39;).update(JSON.stringify(canonical(v))).digest(&#39;hex&#39;);} |
| acceptPin | function | 22 | yes | export function acceptPin(p){ |
| freezePin | function | 27 | yes | export function freezePin(pin, fresh){ |
| secret | const | 32 | no | const secret=/(\\.env(?:[^/]*$\|\\/)\|\\.pem$\|\\.p12$\|\\.keystore$\|(?:^\|\\/)(?:cookies\|login data\|session\\.json\|storage-state\\.json\|release-profile\\.json)(?:\\/\|$))/i; |
| safePath | function | 33 | yes | export function safePath(path,kind=&#39;file&#39;){ |
| parts | const | 36 | no | const parts=path.split(&#39;/&#39;); |
| classifySource | function | 41 | yes | export function classifySource(a,b,allTargets=[]){ |
| candidateEquivalence | function | 48 | yes | export function candidateEquivalence(left,right,decision=null){ |
| capabilityStage | function | 53 | yes | export function capabilityStage({source=false,installed=false,hostReceipt=false,deviceReceipt=false}={}){ |
| bounded | function | 60 | yes | export function bounded(rows,{maxEntries=1000,maxBlobBytes=1500000,cancelled=false}={}){ |
| items | const | 62 | no | const items=rows.slice(0,maxEntries).filter(x=&gt;(x.bytes??0)&lt;=maxBlobBytes); |
| checkGrant | function | 65 | yes | export function checkGrant({actorId,sessionId,grant,revoked=false,scope=&#39;development&#39;,personalWorld=false}={}){ |
| safePublicText | function | 69 | yes | export function safePublicText(text,allowed=false){ |
| classifyResearch | function | 73 | yes | export function classifyResearch({design=false,implemented=false,installed=false}={}){ |
| classifyGitObject | function | 80 | yes | export function classifyGitObject({mode=&#39;100644&#39;,content=&#39;&#39;,bytes=0,readable=true,sparse=false,pinnedCommit=null}={}){ |
| safeGitRef | function | 93 | yes | export function safeGitRef(ref){ |
| storageBound | function | 99 | yes | export function storageBound({error=null,previousSnapshot=null}={}){ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 5 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [tests/hq-version-intelligence/git-edge-negative-gates.test.mjs](./git-edge-negative-gates.test.mjs.md) | ./reference-oracle.mjs |
| [tests/hq-version-intelligence/hvi-contract-qa.test.mjs](./hvi-contract-qa.test.mjs.md) | ./reference-oracle.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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

/** Read-only fixture classification of object-type hazards, NOT Git IO. */
export function classifyGitObject({mode='100644',content='',bytes=0,readable=true,sparse=false,pinnedCommit=null}={}){
```

_First 80 of 104 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
