# File: apps/vivim-host/corpus/host-integration.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/corpus/host-integration.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12523 B |
| Lines | 191 |
| Hash | d49a77ca112b |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| hash | function | 8 | no | const hash = x=&gt;createHash(&#39;sha256&#39;).update(x).digest(&#39;hex&#39;); |
| stable | function | 9 | no | const stable = v=&gt;JSON.stringify(v,(_,x)=&gt;x&amp;&amp;typeof x===&#39;object&#39;&amp;&amp;!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=&gt;[k,x[k]])):x); |
| key | const | 10 | no | const key=Buffer.alloc(32,37), NOW=Date.parse(&#39;2026-11-06T13:00:00Z&#39;); |
| setup | function | 11 | no | function setup(t,{loseAck=false,forgeReceipt=false}={}) { |
| root | const | 12 | no | const root=mkdtempSync(path.join(tmpdir(),&#39;vivim-i5-&#39;)); |
| staged | const | 14 | no | const staged=path.join(root,&#39;stage&#39;);mkdirSync(staged); |
| principal | const | 15 | no | const principal={verified:true,ownerId:&#39;owner-a&#39;,deviceId:&#39;device-a&#39;,grantId:&#39;device-grant-a&#39;,worldId:&#39;world-local&#39;, |
| state | const | 17 | no | const state={principal,revoked:false,loss:loseAck,entries:new Map(),events:new Map(),scopes:new Map(), |
| raw | function | 19 | no | const raw=(i)=&gt;Buffer.from(&#39;Owner captured source bytes &#39;+i); |
| envelope | function | 20 | no | const envelope=i=&gt;{ |
| b | const | 21 | no | const b=raw(i),str=String(i).padStart(8,&#39;0&#39;); |
| hq | const | 29 | no | const hq={ |
| records | const | 35 | no | const records=[]; |
| d | const | 37 | no | const d={capture,eventHash:hash(stable(capture))}; |
| grants | const | 45 | no | const grants=new Map(); |
| authorizeDevice | function | 46 | no | const authorizeDevice=(_auth,scope)=&gt;{ |
| ownerApproval | function | 50 | no | const ownerApproval=async p=&gt;({...p,approvalId:&#39;approval-test-a&#39;,decision:&#39;approved&#39;}); |
| rawGrantFor | function | 51 | no | const rawGrantFor=({scopeId,eventId})=&gt;{ |
| event | const | 52 | no | const event=state.events.get(eventId)?.envelope; |
| grant | const | 54 | no | const grant={ref:&#39;raw-grant-&#39;+eventId,batchId:&#39;batch-test-&#39;+eventId,ownerId:state.principal.ownerId, |
| verifyCurrentGrant | function | 59 | no | const verifyCurrentGrant=(ref)=&gt;state.revoked?{...grants.get(ref),revoked:true}:grants.get(ref); |
| transportFactory | function | 60 | no | const transportFactory=({persistAccepted,lookupAccepted})=&gt;({ async issueScope({events}){ const sid=&#39;scope-&#39;+(state.scopes.size+1); state.scopes.set(sid,events.map(x=&gt;x.eventId)); for(const e of even… |
| sid | const | 62 | no | const sid=&#39;scope-&#39;+(state.scopes.size+1); |
| e | const | 72 | no | const e=state.events.get(eventId);if(offset!==e.cursor)throw Error(&#39;CURSOR&#39;); |
| f | const | 73 | no | const f=path.join(staged,eventId);writeFileSync(f,chunk,{flag:offset===0?&#39;w&#39;:&#39;a&#39;});e.cursor+=chunk.length; |
| e | const | 77 | no | const e=state.events.get(eventId); |
| receipt | const | 82 | no | const receipt=await persistAccepted({envelope:e.envelope,stagePath:path.join(staged,eventId), eventDigest:hash(stable(e.envelope)),expectedSha256:e.envelope.asset.sha256, deviceId:state.principal.dev… |
| e | const | 89 | no | const e=state.events.get(eventId); |
| receipt | const | 91 | no | const receipt=await lookupAccepted({worldId:e.envelope.worldId,eventId,digest:hash(stable(e.envelope))}); |
| intakeFactory | function | 97 | no | const intakeFactory=({root:corpusRoot,receiptKey,authenticate,resolveGrant})=&gt;({ async acceptBatch(req){ const p=authenticate(req.session);const g=resolveGrant(req.grantRef,p); if(g?.revoked!==false)… |
| p | const | 99 | no | const p=authenticate(req.session);const g=resolveGrant(req.grantRef,p); |
| item | const | 101 | no | const item=req.items[0];const key=hash(p.ownerId+&#39;\\0&#39;+item.envelope.worldId+&#39;\\0&#39;+item.envelope.eventId); |
| dir | const | 102 | no | const dir=path.join(corpusRoot,&#39;v1&#39;,key);mkdirSync(dir,{recursive:true}); |
| file | const | 103 | no | const file=path.join(dir,&#39;raw.bin&#39;);if(!existsSync(file)){writeFileSync(file,item.bytes);state.bytesWritten++} |
| body | const | 105 | no | const body={decision:&#39;authorized&#39;,events:[{state:&#39;accepted&#39;,eventKey:key}],batchId:req.batchId,accepted:1,duplicates:0}; |
| receipt | const | 106 | no | const receipt={...body,signature:forgeReceipt?&#39;0&#39;.repeat(64):createHmac(&#39;sha256&#39;,receiptKey).update(stable(body)).digest(&#39;hex&#39;)}; |
| make | function | 110 | no | const make=()=&gt;createHostPocketCorpusBridge({dataRoot:root,receiptKey:key,transportFactory,intakeFactory,hq, authorizeDevice,ownerApproval,rawGrantFor,verifyCurrentGrant,now:()=&gt;NOW}); |
| receipt | const | 120 | no | const receipt=await bridge.finalize({auth:{},scopeId,eventId:e.eventId}); |
| afterRestart | const | 136 | no | const afterRestart=make(), got=await afterRestart.reconcile({auth:{},scopeId,eventId:e.eventId}); |
| e | const | 156 | no | const e=envelope(22); |
| metadata | const | 161 | no | const metadata={...e,asset:{...e.asset,availability:&#39;metadata_only&#39;,sha256:null,bytes:null,contentRef:null}}; |
| before | const | 188 | no | const before=state.accepted; state.principal.ownerId=&#39;other-owner&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:crypto | import | 6 | external |
| ./host-integration.mjs | import | 7 | [apps/vivim-host/corpus/host-integration.mjs](./host-integration.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash, createHmac } from 'node:crypto';
import { createHostPocketCorpusBridge } from './host-integration.mjs';
const hash = x=>createHash('sha256').update(x).digest('hex');
const stable = v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const key=Buffer.alloc(32,37), NOW=Date.parse('2026-11-06T13:00:00Z');
function setup(t,{loseAck=false,forgeReceipt=false}={}) {
  const root=mkdtempSync(path.join(tmpdir(),'vivim-i5-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const staged=path.join(root,'stage');mkdirSync(staged);
  const principal={verified:true,ownerId:'owner-a',deviceId:'device-a',grantId:'device-grant-a',worldId:'world-local',
    scopes:['corpus:upload','corpus:intake','corpus:read'],expiresAt:NOW+1e6};
  const state={principal,revoked:false,loss:loseAck,entries:new Map(),events:new Map(),scopes:new Map(),
    accepted:0,readCalls:0,providerSends:0,worldWrites:0,bytesWritten:0};
  const raw=(i)=>Buffer.from('Owner captured source bytes '+i);
  const envelope=i=>{
    const b=raw(i),str=String(i).padStart(8,'0');
    return {schema:'vivim.corpus-intake/1',eventId:'evt-pocket-'+str,assetId:'asset-pocket-'+str,
      worldId:'world-local',kind:'note',title:'My source '+i,capturedAt:'2026-11-05T12:00:00.000Z',
      source:{registryId:'SRC-OWNER-INPUT',mechanism:'push',surface:'android.pocket',actor:'owner',publicUri:null},
      asset:{mediaType:'text/plain',availability:'stored',contentRef:'asset:asset-pocket-'+str,sha256:hash(b),bytes:b.length,role:'original'},
      policy:{purpose:'private-personal-ai',sensitivity:'S1',thirdParty:'none',rights:'owner_declared',ownerInitiated:true,grantRef:null},
      lineage:{parents:[],evidenceRefs:[]}};
  };
  const hq={
    validateCorpusCapture:e=>({ok:e?.schema==='vivim.corpus-intake/1'&&e?.source?.publicUri===null&&e?.policy?.grantRef===null}),
    canonicalCorpusJson:e=>({ok:true,json:stable(e)}),
    corpusEventDigest:e=>({ok:true,sha256:hash(stable(e))}),
    verifyIntakeReceipt:(receipt,k)=>receipt?.signature===createHmac('sha256',k).update(stable(Object.fromEntries(Object.entries(receipt).filter(([x])=>x!=='signature')))).digest('hex'),
    projectPocketEvidence:({entries},authority)=>{
      const records=[];
      for(const {capture,receipt} of entries) {
        const d={capture,eventHash:hash(stable(capture))};
        if(!authority.verifyHostAcceptance(receipt,d)||!authority.verifyOwnerApproval(receipt,d)||
           !authority.isScopeActive(receipt,d)||!authority.verifyStoredAsset(receipt,d))return {ok:false};
        records.push({id:capture.eventId,executable:false,kbFactStatus:'not_owner_confirmed'});
      }
      return {ok:true,schema:'simulated-projector',records,edges:[],replays:0};
    }
  };
  const grants=new Map();
  const authorizeDevice=(_auth,scope)=>{
    if(state.revoked||!state.principal.scopes.includes(scope))throw Object.assign(new Error('REVOKED'),{code:'REVOKED'});
    return state.principal;
  };
  const ownerApproval=async p=>({...p,approvalId:'approval-test-a',decision:'approved'});
  const rawGrantFor=({scopeId,eventId})=>{
    const event=state.events.get(eventId)?.envelope;
    if(!event)return null;
    const grant={ref:'raw-grant-'+eventId,batchId:'batch-test-'+eventId,ownerId:state.principal.ownerId,
      deviceId:state.principal.deviceId,worldId:event.worldId,scope:'corpus:raw-intake',revoked:state.revoked,
      expiresAt:NOW+1e6,approvedAt:NOW-1000,approvedBy:'owner',rightsReviewed:true,sensitivityReviewed:true,thirdPartyReviewed:true,approvedEvents:[{eventId,envelopeSha256:hash(stable(event))}]};
    grants.set(grant.ref,grant); return grant;
  };
  const verifyCurrentGrant=(ref)=>state.revoked?{...grants.get(ref),revoked:true}:grants.get(ref);
  const transportFactory=({persistAccepted,lookupAccepted})=>({
    async issueScope({events}){
      const sid='scope-'+(state.scopes.size+1);
      state.scopes.set(sid,events.map(x=>x.eventId));
      for(const e of events){const old=state.events.get(e.eventId);
        if(old&&stable(old.envelope)!==stable(e))throw Object.assign(new Error('CONFLICT'),{code:'CONFLICT'});
        if(!old)state.events.set(e.eventId,{envelope:e,status:'receiving',cursor:0,scopeId:sid});
      }
      return {scopeId:sid,events:events.map(e=>({eventId:e.eventId,bytes:e.asset.bytes}))};
    },
    inspect({eventId}){const e=state.events.get(eventId);return {state:e.status,cursor:e.cursor}},
    pushChunk({eventId,chunk,offset}){
      const e=state.events.get(eventId);if(offset!==e.cursor)throw Error('CURSOR');
      const f=path.join(staged,eventId);writeFileSync(f,chunk,{flag:offset===0?'w':'a'});e.cursor+=chunk.length;
      return {cursor:e.cursor};
    },
    async finalize({scopeId,eventId}){
      const e=state.events.get(eventId);
      if(e.status==='accepted')return e.receipt;
      if(e.status==='accepting')throw Error('UNCERTAIN');
      if(e.cursor!==e.envelope.asset.bytes)throw Error('TRANSFER_INCOMPLETE');
```

_First 80 of 192 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
