# File: packages/tierflow/src/visual-runtime/final-wave/lane-b/studio-editing.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/final-wave/lane-b/studio-editing.ts |
| Language | TypeScript |
| Kind | source |
| Size | 13244 B |
| Lines | 182 |
| Hash | 7e1e8b85a8f6 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STUDIO_EDITING_SCHEMA | const | 8 | yes | export const STUDIO_EDITING_SCHEMA=&#39;vivim.studio-editing-adapter/1&#39; as const; |
| Refusal | type | 9 | yes | export type Refusal=&#39;FORBIDDEN&#39;\|&#39;INVALID_OPERATION&#39;\|&#39;NOT_FOUND&#39;\|&#39;REVISION_CONFLICT&#39;\|&#39;DIGEST_MISMATCH&#39;\|&#39;REVIEW_REQUIRED&#39;\|&#39;REVIEW_EXPIRED&#39;\|&#39;REVIEW_DENIED&#39;\|&#39;SCHEMA_BRIDGE_NOT_READY&#39;\|&#39;IDEMPOTENCY_CONFLIC… |
| Result | type | 10 | yes | export type Result&lt;T&gt;={readonly ok:true;readonly value:T;readonly replayed?:boolean}\|{readonly ok:false;readonly code:Refusal;readonly currentRevision?:number}; |
| StudioReview | interface | 11 | yes | export interface StudioReview { |
| Dependencies | interface | 17 | yes | export interface Dependencies { |
| Change | interface | 27 | yes | export interface Change {readonly ref:string;readonly kind:&#39;add&#39;\|&#39;remove&#39;\|&#39;change&#39;;readonly from:string\|null;readonly to:string\|null} |
| Preview | interface | 28 | yes | export interface Preview { |
| Commit | interface | 35 | yes | export interface Commit { |
| fail | function | 39 | no | const fail=(code:Refusal,currentRevision?:number):Result&lt;never&gt;=&gt;currentRevision===undefined?{ok:false,code}:{ok:false,code,currentRevision}; |
| nonempty | function | 40 | no | const nonempty=(x:unknown):x is string=&gt;typeof x===&#39;string&#39;&amp;&amp;x.trim().length&gt;0; |
| natural | function | 41 | no | const natural=(x:unknown):x is number=&gt;typeof x===&#39;number&#39;&amp;&amp;Number.isSafeInteger(x)&amp;&amp;x&gt;=0; |
| parse | function | 42 | no | function parse(raw:unknown,id:string):WorldDocument\|null { |
| diff | function | 46 | no | function diff(a:WorldDocument,b:WorldDocument):readonly Change[] { |
| out | const | 47 | no | const out:Change[]=[]; |
| collections | const | 53 | no | const collections:[string,readonly {id:string}[],readonly {id:string}[]][]=[ |
| oldMap | const | 56 | no | const oldMap=new Map(oldRows.map(x=&gt;[x.id,x])),newMap=new Map(newRows.map(x=&gt;[x.id,x])); |
| StudioEditingAdapter | class | 62 | yes | export class StudioEditingAdapter { |
| constructor | method | 64 | yes | constructor(d:Dependencies) { |
| codes | const | 76 | no | const codes:readonly string[]=[&#39;FORBIDDEN&#39;,&#39;NOT_FOUND&#39;,&#39;REVISION_CONFLICT&#39;,&#39;DIGEST_MISMATCH&#39;,&#39;IDEMPOTENCY_CONFLICT&#39;,&#39;UNCERTAIN&#39;,&#39;UNAVAILABLE&#39;]; |
| load | method | 79 | yes | load(p:VerifiedUiPrincipal,id:string):Result&lt;UiFixtureRevision&gt; { |
| r | const | 82 | no | const r=this.#d.revisions.readCurrent(p,id); |
| d | const | 85 | no | const d=parse(r.value.document,id); |
| current | const | 91 | no | const current=this.load(p,id);if(!current.ok)return current; |
| edit | method | 95 | yes | edit(p:VerifiedUiPrincipal,draftId:string,draftRevision:number,ops:readonly UiOperation[]):Result&lt;UiFixtureDraft&gt; { |
| draft | const | 101 | no | const draft=this.#d.revisions.preview(p,draftId);if(!draft.ok)return this.#map(draft); |
| current | const | 103 | no | const current=parse(draft.value.document,draft.value.documentId); |
| changes | const | 109 | no | const changes=diff(a,b),baseDigest=contentHash(a),editedDigest=contentHash(b); |
| previewDigest | const | 110 | no | const previewDigest=payloadHash({schema:STUDIO_EDITING_SCHEMA,id,draftId,draftRevision,baseRevision,baseDigest,editedDigest,changes,policyRevision:p.policyRevision}); |
| preview | method | 114 | yes | preview(p:VerifiedUiPrincipal,draftId:string):Result&lt;Preview&gt; { |
| r | const | 116 | no | const r=this.#d.revisions.preview(p,draftId);if(!r.ok)return this.#map(r); |
| current | const | 117 | no | const current=this.load(p,r.value.documentId);if(!current.ok)return current; |
| a | const | 119 | no | const a=parse(current.value.document,r.value.documentId),b=parse(r.value.document,r.value.documentId); |
| commit | method | 143 | yes | commit(p:VerifiedUiPrincipal,id:string,draftId:string,review:StudioReview):Result&lt;Commit&gt; { |
| v | const | 145 | no | const v=this.preview(p,draftId);if(!v.ok)return v; |
| a | const | 146 | no | const a=this.#review(p,review,v.value);if(!a.ok)return a; |
| r | const | 147 | no | const r=this.#d.revisions.publish(p,this.#cmd(p,id,v.value)); |
| observePublish | method | 151 | yes | observePublish(p:VerifiedUiPrincipal,id:string,v:Preview):Result&lt;Commit&gt; { |
| r | const | 154 | no | const r=this.#d.revisions.getCommandOutcome(p,&#39;publish&#39;,this.#cmd(p,id,v)); |
| previewUndo | method | 157 | yes | previewUndo(p:VerifiedUiPrincipal,id:string,targetRevision:number):Result&lt;Preview&gt; { |
| current | const | 159 | no | const current=this.load(p,id);if(!current.ok)return current; |
| historical | variable | 161 | no | let historical:WorldDocument\|null; |
| a | const | 163 | no | const a=parse(current.value.document,id),b=parse(historical,id); |
| undo | method | 167 | yes | undo(p:VerifiedUiPrincipal,id:string,worldId:string,targetRevision:number,review:StudioReview):Result&lt;Commit&gt; { |
| v | const | 169 | no | const v=this.previewUndo(p,worldId,targetRevision);if(!v.ok)return v; |
| a | const | 170 | no | const a=this.#review(p,review,v.value);if(!a.ok)return a; |
| r | const | 171 | no | const r=this.#d.revisions.rollback(p,{...this.#cmd(p,id,v.value),targetRevision}); |
| observeUndo | method | 176 | yes | observeUndo(p:VerifiedUiPrincipal,id:string,v:Preview,targetRevision:number):Result&lt;Commit&gt; { |
| r | const | 179 | no | const r=this.#d.revisions.getCommandOutcome(p,&#39;rollback&#39;,{...this.#cmd(p,id,v),targetRevision}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../../ui/hash.ts | import | 2 | [packages/tierflow/src/ui/hash.ts](../../../ui/hash.ts.md) |
| ../../../ui/world.ts | import | 3 | [packages/tierflow/src/ui/world.ts](../../../ui/world.ts.md) |
| ../../../ui/world.ts | import | 4 | [packages/tierflow/src/ui/world.ts](../../../ui/world.ts.md) |
| ../../../ui/types.ts | import | 5 | [packages/tierflow/src/ui/types.ts](../../../ui/types.ts.md) |
| ../../revisions/port.ts | import | 6 | [packages/tierflow/src/visual-runtime/revisions/port.ts](../../revisions/port.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/final-wave/integration/master.ts](../integration/master.ts.md) | ../lane-b/studio-editing.ts |
| [packages/tierflow/tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts](../../../../tests/visual-runtime/final-wave/lane-b/studio-editing.test.ts.md) | ../../../../src/visual-runtime/final-wave/lane-b/studio-editing.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/** Lane B: Studio is an adapter to the existing single-writer UiRevisionPort, never a publisher. */
import { commandEnvelopeHash, contentHash, payloadHash } from '../../../ui/hash.ts';
import { applyUiOperations, parseUiDocument } from '../../../ui/world.ts';
import type { UiOperation } from '../../../ui/world.ts';
import type { UiDocument as WorldDocument } from '../../../ui/types.ts';
import type { VerifiedUiPrincipal, UiRevisionPort, UiFixtureDraft, UiFixtureRevision, RevisionCommand } from '../../revisions/port.ts';

export const STUDIO_EDITING_SCHEMA='vivim.studio-editing-adapter/1' as const;
export type Refusal='FORBIDDEN'|'INVALID_OPERATION'|'NOT_FOUND'|'REVISION_CONFLICT'|'DIGEST_MISMATCH'|'REVIEW_REQUIRED'|'REVIEW_EXPIRED'|'REVIEW_DENIED'|'SCHEMA_BRIDGE_NOT_READY'|'IDEMPOTENCY_CONFLICT'|'UNCERTAIN'|'UNAVAILABLE';
export type Result<T>={readonly ok:true;readonly value:T;readonly replayed?:boolean}|{readonly ok:false;readonly code:Refusal;readonly currentRevision?:number};
export interface StudioReview {
  readonly schema:'vivim.studio-ui-review/1';readonly decision:'approved'|'denied';
  readonly ownerRef:string;readonly actorRef:string;readonly deviceRef:string;readonly sessionRef:string;
  readonly worldRef:string;readonly previewDigest:string;readonly baseRevision:number;
  readonly policyRevision:string;readonly expiresAtMs:number;readonly proofRef:string;
}
export interface Dependencies {
  readonly revisions:UiRevisionPort;
  /** Trusted Host/owner broker, never made from client JSON. */
  readonly verifyPrincipal:(p:VerifiedUiPrincipal)=>boolean;
  /** Must atomically consume the one-use proof at the real owner broker. */
  readonly consumeOwnerReview:(p:VerifiedUiPrincipal,r:StudioReview)=>boolean;
  /** Existing UiStore.getRevision, not a second history store. */
  readonly readHistorical:(p:VerifiedUiPrincipal,id:string,revision:number)=>WorldDocument|null;
  readonly nowMs?:()=>number;
}
export interface Change {readonly ref:string;readonly kind:'add'|'remove'|'change';readonly from:string|null;readonly to:string|null}
export interface Preview {
  readonly schema:typeof STUDIO_EDITING_SCHEMA;readonly worldRef:string;readonly draftId:string|null;
  readonly baseRevision:number;readonly draftRevision:number|null;
  readonly baseDigest:string;readonly editedDigest:string;readonly previewDigest:string;
  readonly changes:readonly Change[];readonly visual2d:'SCHEMA_BRIDGE_NOT_READY';
  readonly effectPerformed:false;readonly ownerReviewRequired:true;
}
export interface Commit {
  readonly kind:'ui-revision-only';readonly commandId:string;readonly revision:number;
  readonly documentDigest:string;readonly replayed:boolean;readonly hostEffectReceipt:null;readonly effectPerformed:false;
}
const fail=(code:Refusal,currentRevision?:number):Result<never>=>currentRevision===undefined?{ok:false,code}:{ok:false,code,currentRevision};
const nonempty=(x:unknown):x is string=>typeof x==='string'&&x.trim().length>0;
const natural=(x:unknown):x is number=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0;
function parse(raw:unknown,id:string):WorldDocument|null {
  try {commandEnvelopeHash(raw,'studio-world-inert');const d=parseUiDocument(raw);return d.world.id===id?d:null;}
  catch{return null;}
}
function diff(a:WorldDocument,b:WorldDocument):readonly Change[] {
  const out:Change[]=[];
  function record(ref:string,x:unknown,y:unknown):void {
    const from=x===undefined?null:payloadHash(x),to=y===undefined?null:payloadHash(y);
    if(from!==to)out.push({ref,kind:x===undefined?'add':y===undefined?'remove':'change',from,to});
  }
  record('world:'+a.world.id,a.world,b.world);
  const collections:[string,readonly {id:string}[],readonly {id:string}[]][]=[
    ['object',a.objects,b.objects],['relationship',a.relationships,b.relationships],['dataFlow',a.dataFlows,b.dataFlows]];
  for(const [prefix,oldRows,newRows] of collections) {
    const oldMap=new Map(oldRows.map(x=>[x.id,x])),newMap=new Map(newRows.map(x=>[x.id,x]));
    for(const id of [...new Set([...oldMap.keys(),...newMap.keys()])].sort())record(prefix+':'+id,oldMap.get(id),newMap.get(id));
    record(prefix+':order',oldRows.map(x=>x.id),newRows.map(x=>x.id));
  }
  return out;
}
export class StudioEditingAdapter {
  readonly #d:Dependencies;
  constructor(d:Dependencies) {
    if(!d?.revisions||typeof d.verifyPrincipal!=='function'||typeof d.consumeOwnerReview!=='function'||typeof d.readHistorical!=='function')
      throw new TypeError('Trusted revision authority and owner broker required');
    this.#d=d;
  }
  #allowed(p:VerifiedUiPrincipal,scope:string):boolean {
    if(!p||![p.ownerRef,p.actorRef,p.deviceRef,p.sessionRef,p.grantRef,p.policyRevision].every(nonempty)||
      !Array.isArray(p.scopes)||!p.scopes.includes(scope))return false;
    try{return this.#d.verifyPrincipal(p)===true;}catch{return false;}
  }
  #map<T>(r:{ok:true;value:T;replayed?:boolean}|{ok:false;code:string;currentRevision?:number}):Result<T> {
    if(r.ok)return {ok:true,value:r.value,replayed:r.replayed};
    const codes:readonly string[]=['FORBIDDEN','NOT_FOUND','REVISION_CONFLICT','DIGEST_MISMATCH','IDEMPOTENCY_CONFLICT','UNCERTAIN','UNAVAILABLE'];
    return fail(codes.includes(r.code)?r.code as Refusal:'INVALID_OPERATION',r.currentRevision);
  }
  load(p:VerifiedUiPrincipal,id:string):Result<UiFixtureRevision> {
    if(!this.#allowed(p,'ui:read'))return fail('FORBIDDEN');
```

_First 80 of 183 lines._

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
