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
    if(!nonempty(id))return fail('INVALID_OPERATION');
    const r=this.#d.revisions.readCurrent(p,id);
    if(!r.ok)return this.#map(r);
    if(!r.value)return fail('NOT_FOUND');
    const d=parse(r.value.document,id);
    return d&&contentHash(d)===r.value.documentDigest?{ok:true,value:r.value}:fail('SCHEMA_BRIDGE_NOT_READY');
  }
  begin(p:VerifiedUiPrincipal,id:string,draftId:string,revision:number):Result<UiFixtureDraft> {
    if(!this.#allowed(p,'ui:draft'))return fail('FORBIDDEN');
    if(!nonempty(draftId)||!natural(revision))return fail('INVALID_OPERATION');
    const current=this.load(p,id);if(!current.ok)return current;
    if(current.value.revision!==revision)return fail('REVISION_CONFLICT',current.value.revision);
    return this.#map(this.#d.revisions.createDraft(p,draftId,id,current.value.document));
  }
  edit(p:VerifiedUiPrincipal,draftId:string,draftRevision:number,ops:readonly UiOperation[]):Result<UiFixtureDraft> {
    if(!this.#allowed(p,'ui:draft')||!this.#allowed(p,'ui:read'))return fail('FORBIDDEN');
    if(!natural(draftRevision)||draftRevision<1||!Array.isArray(ops)||ops.length<1||ops.length>16)return fail('INVALID_OPERATION');
    try{commandEnvelopeHash(ops,p);}catch{return fail('INVALID_OPERATION');}
    if(ops.some(x=>!x||!nonempty(x.op)||x.op.startsWith('dataFlow.')))return fail('INVALID_OPERATION');
    if(/(?:<\s*\/?\s*(?:script|iframe|object|svg)\b|javascript\s*:|vbscript\s*:|on(?:error|load|click)\s*=)/i.test(JSON.stringify(ops)))return fail('INVALID_OPERATION');
    const draft=this.#d.revisions.preview(p,draftId);if(!draft.ok)return this.#map(draft);
    if(draft.value.draftRevision!==draftRevision)return fail('REVISION_CONFLICT',draft.value.draftRevision);
    const current=parse(draft.value.document,draft.value.documentId);
    if(!current||contentHash(current)!==draft.value.documentDigest)return fail('SCHEMA_BRIDGE_NOT_READY');
    try{return this.#map(this.#d.revisions.editDraft(p,draftId,draftRevision,applyUiOperations(current,[...ops])));}
    catch{return fail('INVALID_OPERATION');}
  }
  #snapshot(p:VerifiedUiPrincipal,id:string,draftId:string|null,draftRevision:number|null,baseRevision:number,a:WorldDocument,b:WorldDocument):Preview {
    const changes=diff(a,b),baseDigest=contentHash(a),editedDigest=contentHash(b);
    const previewDigest=payloadHash({schema:STUDIO_EDITING_SCHEMA,id,draftId,draftRevision,baseRevision,baseDigest,editedDigest,changes,policyRevision:p.policyRevision});
    return {schema:STUDIO_EDITING_SCHEMA,worldRef:id,draftId,draftRevision,baseRevision,baseDigest,editedDigest,
      previewDigest,changes,visual2d:'SCHEMA_BRIDGE_NOT_READY',effectPerformed:false,ownerReviewRequired:true};
  }
  preview(p:VerifiedUiPrincipal,draftId:string):Result<Preview> {
    if(!this.#allowed(p,'ui:read'))return fail('FORBIDDEN');
    const r=this.#d.revisions.preview(p,draftId);if(!r.ok)return this.#map(r);
    const current=this.load(p,r.value.documentId);if(!current.ok)return current;
    if(current.value.revision!==r.value.baseRevision)return fail('REVISION_CONFLICT',current.value.revision);
    const a=parse(current.value.document,r.value.documentId),b=parse(r.value.document,r.value.documentId);
    if(!a||!b||contentHash(b)!==r.value.documentDigest)return fail('SCHEMA_BRIDGE_NOT_READY');
    return {ok:true,value:this.#snapshot(p,r.value.documentId,draftId,r.value.draftRevision,r.value.baseRevision,a,b)};
  }
  #review(p:VerifiedUiPrincipal,r:StudioReview,v:Preview):Result<true> {
    if(!this.#allowed(p,'ui:publish'))return fail('FORBIDDEN');
    if(!r||r.schema!=='vivim.studio-ui-review/1'||!nonempty(r.proofRef)||
      r.ownerRef!==p.ownerRef||r.actorRef!==p.actorRef||r.deviceRef!==p.deviceRef||r.sessionRef!==p.sessionRef||
      r.worldRef!==v.worldRef||r.baseRevision!==v.baseRevision||r.previewDigest!==v.previewDigest||
      r.policyRevision!==p.policyRevision)return fail('REVIEW_REQUIRED');
    if(!Number.isFinite(r.expiresAtMs)||r.expiresAtMs<=(this.#d.nowMs?.()??Date.now()))return fail('REVIEW_EXPIRED');
    if(r.decision!=='approved')return fail('REVIEW_DENIED');
    try{if(!this.#d.consumeOwnerReview(p,r))return fail('REVIEW_DENIED');}catch{return fail('REVIEW_DENIED');}
    return {ok:true,value:true};
  }
  #cmd(p:VerifiedUiPrincipal,id:string,v:Preview):RevisionCommand {
    return {commandId:id,documentId:v.worldRef,expectedRevision:v.baseRevision,
      ...(v.draftId?{draftId:v.draftId,documentDigest:v.editedDigest}:{}),
      sourceVersions:{policyRevision:p.policyRevision},target:{worldRef:v.worldRef,previewDigest:v.previewDigest}};
  }
  #commit(id:string,row:UiFixtureRevision,replayed:boolean):Commit {
    return {kind:'ui-revision-only',commandId:id,revision:row.revision,documentDigest:row.documentDigest,
      replayed,hostEffectReceipt:null,effectPerformed:false};
  }
  commit(p:VerifiedUiPrincipal,id:string,draftId:string,review:StudioReview):Result<Commit> {
    if(!nonempty(id))return fail('INVALID_OPERATION');
    const v=this.preview(p,draftId);if(!v.ok)return v;
    const a=this.#review(p,review,v.value);if(!a.ok)return a;
    const r=this.#d.revisions.publish(p,this.#cmd(p,id,v.value));
    return r.ok?{ok:true,value:this.#commit(id,r.value,r.replayed===true),replayed:r.replayed}:this.#map(r);
  }
  /** Lost ACK: query the existing durable journal. Do NOT resend publish. */
  observePublish(p:VerifiedUiPrincipal,id:string,v:Preview):Result<Commit> {
    if(!this.#allowed(p,'ui:read'))return fail('FORBIDDEN');
    if(!nonempty(id)||v.schema!==STUDIO_EDITING_SCHEMA||!v.draftId)return fail('INVALID_OPERATION');
    const r=this.#d.revisions.getCommandOutcome(p,'publish',this.#cmd(p,id,v));
    return r.ok?{ok:true,value:this.#commit(id,r.value,true),replayed:true}:this.#map(r);
  }
  previewUndo(p:VerifiedUiPrincipal,id:string,targetRevision:number):Result<Preview> {
    if(!this.#allowed(p,'ui:read'))return fail('FORBIDDEN');
    const current=this.load(p,id);if(!current.ok)return current;
    if(!natural(targetRevision)||targetRevision<1||targetRevision>=current.value.revision)return fail('INVALID_OPERATION');
    let historical:WorldDocument|null;
    try{historical=this.#d.readHistorical(p,id,targetRevision);}catch{return fail('UNAVAILABLE');}
    const a=parse(current.value.document,id),b=parse(historical,id);
    return a&&b?{ok:true,value:this.#snapshot(p,id,null,null,current.value.revision,a,b)}:fail('SCHEMA_BRIDGE_NOT_READY');
  }
  /** UI-only append-only rollback; never rewinds Host actions, grants or effects. */
  undo(p:VerifiedUiPrincipal,id:string,worldId:string,targetRevision:number,review:StudioReview):Result<Commit> {
    if(!nonempty(id)||!this.#allowed(p,'ui:rollback'))return fail('FORBIDDEN');
    const v=this.previewUndo(p,worldId,targetRevision);if(!v.ok)return v;
    const a=this.#review(p,review,v.value);if(!a.ok)return a;
    const r=this.#d.revisions.rollback(p,{...this.#cmd(p,id,v.value),targetRevision});
    if(!r.ok)return this.#map(r);
    if(r.value.documentDigest!==v.value.editedDigest)return fail('DIGEST_MISMATCH');
    return {ok:true,value:this.#commit(id,r.value,r.replayed===true),replayed:r.replayed};
  }
  observeUndo(p:VerifiedUiPrincipal,id:string,v:Preview,targetRevision:number):Result<Commit> {
    if(!this.#allowed(p,'ui:read'))return fail('FORBIDDEN');
    if(!nonempty(id)||v.schema!==STUDIO_EDITING_SCHEMA||v.draftId!==null||!natural(targetRevision))return fail('INVALID_OPERATION');
    const r=this.#d.revisions.getCommandOutcome(p,'rollback',{...this.#cmd(p,id,v),targetRevision});
    return r.ok?{ok:true,value:this.#commit(id,r.value,true),replayed:true}:this.#map(r);
  }
}
