/**
 * Wave 4 G — inert cross-device transport projection, NOT a Host ingress.
 * The caller MUST obtain TransportAuthority from the authenticated Host owner/device/world
 * broker (never from the phone, a text command, or the envelope itself). This adapter
 * creates no signature, approval, action registry, provider request, or Host plan.
 * Inbox dedupe is bounded process-local evidence, NOT durable Host effect fencing.
 */
import { createHash } from 'node:crypto';
import { validArgs } from './ir.ts';
import type { VisualCommand } from './ir.ts';
import type { DescriptorProofResult, DescriptorCrosswalkEvidence } from './wave3-descriptor-proof.ts';

export const TYPED_TRANSPORT_SCHEMA = 'vivim.wave4-typed-candidate/1' as const;
export type TransportDevice = 'desktop' | 'phone';
export type TransportAuthority = Readonly<{
  ownerId: string;
  worldId: string;
  deviceId: string;
  sessionId: string;
  device: TransportDevice;
  /** Host-verified facts, NOT self-attested values read from transport JSON. */
  authenticated: boolean;
  granted: boolean;
  connected: boolean;
  nowMs: number;
  policyVersion: string;
  hostWorldVersion: string;
  catalogVersion: number;
  catalogSha256: string;
  hqRegistrySha256: string;
  /** One existing Host-reviewed action descriptor bound by the caller; never inferred from wire JSON. */
  reviewed: Readonly<{semanticId:string;actionId:string;risk:'R0'|'R1'|'R2'|'R3';argsSchemaSha256:string}>;
}>;
export type TransportControls = Readonly<{
  correlationId: string;
  idempotencyKey: string;
  nonce: string;
  cancelId: string;
  sequence: number;
  issuedAtMs: number;
  expiresAtMs: number;
}>;
export type TypedCandidateEnvelope = Readonly<{
  schema: typeof TYPED_TRANSPORT_SCHEMA;
  kind: 'candidate_only';
  identity: Readonly<Pick<TransportAuthority, 'ownerId' | 'worldId' | 'deviceId' | 'sessionId' | 'device'>>;
  controls: TransportControls;
  /** Same semantic digest for text/touch/keyboard, even if source modality/commandId differ. */
  semanticDigest: string;
  /** Hash of ALL envelope fields (except this field); detects accidental/tampered edits, NOT authentication. */
  envelopeDigest: string;
  command: VisualCommand;
  sourceEvidence: DescriptorCrosswalkEvidence;
  executionAuthority: 'none';
  approval: 'not_requested';
}>;
export type TransportRefusal = Readonly<{outcome: 'refused'; reasonCode: string; effectPerformed: false}>;
export type TransportStage = Readonly<{outcome:'candidate'; envelope:TypedCandidateEnvelope; effectPerformed:false}> | TransportRefusal;
export type TransportReceipt = Readonly<{
  schema:'vivim.wave4-transport-receipt/1';
  outcome:'transport_only';
  correlationId:string;
  idempotencyKey:string;
  semanticDigest:string;
  status:'received'|'uncertain'|'cancelled';
  replayed:boolean;
  hostAccepted:false;
  executionAuthorized:false;
  effectPerformed:false;
}>;
export type TransportObservation = Readonly<{outcome:'observed';receipt:TransportReceipt}>|TransportRefusal;

const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
const HASH = /^[0-9a-f]{64}$/;
const RISK = ['R0','R1','R2','R3'];
const MAX_ENVELOPE_BYTES = 12_288;
const MAX_LIFETIME_MS = 10 * 60_000;
const MAX_CLOCK_SKEW_MS = 30_000;
const deny = (reasonCode:string):TransportRefusal => ({outcome:'refused',reasonCode,effectPerformed:false});
function record(v:unknown):v is Record<string,unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const p=Object.getPrototypeOf(v);
  return (p===Object.prototype || p===null) &&
    Object.values(Object.getOwnPropertyDescriptors(v)).every(d=>Object.hasOwn(d,'value'));
}
function keys(v:unknown, expected:readonly string[]):v is Record<string,unknown> {
  return record(v) && Object.keys(v).every(k=>expected.includes(k));
}
function id(v:unknown):v is string { return typeof v==='string' && ID.test(v); }
function hash(v:unknown):v is string { return typeof v==='string' && HASH.test(v); }
function canonical(v:unknown):string {
  if (Array.isArray(v)) return '['+v.map(canonical).join(',')+']';
  if (record(v)) return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
  return JSON.stringify(v);
}
function digest(v:unknown):string { return createHash('sha256').update(canonical(v)).digest('hex'); }
function validAuthority(b:unknown):b is TransportAuthority {
  return keys(b,['ownerId','worldId','deviceId','sessionId','device','authenticated','granted','connected',
    'nowMs','policyVersion','hostWorldVersion','catalogVersion','catalogSha256','hqRegistrySha256','reviewed']) &&
    ['ownerId','worldId','deviceId','sessionId','policyVersion','hostWorldVersion'].every(k=>id(b[k])) &&
    (b.device==='desktop'||b.device==='phone') &&
    b.authenticated===true && b.granted===true && b.connected===true &&
    Number.isSafeInteger(b.nowMs) && (b.nowMs as number)>=0 &&
    Number.isSafeInteger(b.catalogVersion) && (b.catalogVersion as number)>=1 &&
    hash(b.catalogSha256) && hash(b.hqRegistrySha256) &&
    keys(b.reviewed,['semanticId','actionId','risk','argsSchemaSha256']) &&
    typeof b.reviewed.semanticId==='string' && /^[a-z0-9][a-z0-9._-]{0,94}@\d+(?:\.\d+)*$/.test(b.reviewed.semanticId) &&
    typeof b.reviewed.actionId==='string' && /^[a-z][a-z0-9._-]{1,95}$/.test(b.reviewed.actionId) &&
    RISK.includes(b.reviewed.risk as string) && hash(b.reviewed.argsSchemaSha256);
}
function validControls(c:unknown, now:number):c is TransportControls {
  return keys(c,['correlationId','idempotencyKey','nonce','cancelId','sequence','issuedAtMs','expiresAtMs']) &&
    ['correlationId','idempotencyKey','nonce','cancelId'].every(k=>id(c[k])) &&
    Number.isSafeInteger(c.sequence) && (c.sequence as number)>=1 &&
    Number.isSafeInteger(c.issuedAtMs) && Number.isSafeInteger(c.expiresAtMs) &&
    (c.issuedAtMs as number)<=now+MAX_CLOCK_SKEW_MS &&
    (c.issuedAtMs as number)>=now-MAX_LIFETIME_MS &&
    (c.expiresAtMs as number)>(c.issuedAtMs as number) &&
    (c.expiresAtMs as number)-(c.issuedAtMs as number)<=MAX_LIFETIME_MS &&
    (c.expiresAtMs as number)>now;
}
function validCommand(c:unknown):c is VisualCommand {
  if (!keys(c,['schema','commandId','source','semanticRef','target','args','risk',
      'sourceVersions','interpretation','capability']) || c.schema!=='vivim.visual-command/1' || !id(c.commandId) ||
      !keys(c.source,['surface','inputDigest']) || !['text','touch','keyboard'].includes(c.source.surface as string) ||
      !hash(c.source.inputDigest) ||
      !keys(c.semanticRef,['id','version','sourceHash']) ||
      typeof c.semanticRef.id!=='string' || !/^[a-z0-9][a-z0-9._-]{0,94}@\d+(?:\.\d+)*$/.test(c.semanticRef.id) ||
      typeof c.semanticRef.version!=='string' || c.semanticRef.id.split('@')[1]!==c.semanticRef.version ||
      !hash(c.semanticRef.sourceHash) ||
      !keys(c.target,['owner','actionId','catalogVersion']) || c.target.owner!=='host_effect' ||
      typeof c.target.actionId!=='string' || !/^[a-z][a-z0-9._-]{1,95}$/.test(c.target.actionId) ||
      !Number.isSafeInteger(c.target.catalogVersion) || (c.target.catalogVersion as number)<1 ||
      !validArgs(c.args) ||
      !keys(c.risk,['level','source','sourceHash']) || !RISK.includes(c.risk.level as string) ||
      c.risk.source!=='host_catalog' || !hash(c.risk.sourceHash) ||
      !keys(c.sourceVersions,['kb','hostWorld','uiRevision','policy']) ||
      !Object.values(c.sourceVersions).every(v=>id(v)) ||
      !id(c.sourceVersions.policy) || !id(c.sourceVersions.hostWorld) ||
      !keys(c.interpretation,['method','outcome','reasonCodes']) || c.interpretation.outcome!=='candidate' ||
      !['exact-text','explicit-selector','bounded-ai-proposal'].includes(c.interpretation.method as string) ||
      !Array.isArray(c.interpretation.reasonCodes) || c.interpretation.reasonCodes.length>16 ||
      !c.interpretation.reasonCodes.every((r:unknown)=>typeof r==='string' && /^[A-Z0-9_]{1,64}$/.test(r)) ||
      !keys(c.capability,['supportedByBuild','availableNow','permittedForActor','verifiedByEvidence','reasonCodes']) ||
      ![true,false,'unknown'].includes(c.capability.supportedByBuild as string|boolean) ||
      !['yes','no','unknown'].includes(c.capability.availableNow as string) ||
      !['yes','no','unknown'].includes(c.capability.permittedForActor as string) ||
      typeof c.capability.verifiedByEvidence!=='boolean' ||
      !Array.isArray(c.capability.reasonCodes) || c.capability.reasonCodes.length>16 ||
      !c.capability.reasonCodes.every((r:unknown)=>typeof r==='string' && /^[A-Z][A-Z0-9_]{0,63}$/.test(r))) return false;
  return true;
}
function validEvidence(e:unknown):e is DescriptorCrosswalkEvidence {
  return keys(e,['evidenceClass','effectInvoked','hostAuthorizationRequired','liveHostVerified','catalogVersion',
    'catalogSha256','hqRegistrySha256','argsSchemaSha256','deviceSurface']) &&
    e.evidenceClass==='source_bound_inert_fixture' && e.effectInvoked===false &&
    e.hostAuthorizationRequired===true && e.liveHostVerified===false &&
    Number.isSafeInteger(e.catalogVersion) && (e.catalogVersion as number)>=1 &&
    hash(e.catalogSha256) && hash(e.hqRegistrySha256) && hash(e.argsSchemaSha256) &&
    (e.deviceSurface==='desktop'||e.deviceSurface==='phone');
}
function semanticDigest(command:VisualCommand,evidence:DescriptorCrosswalkEvidence):string {
  return digest({semanticRef:command.semanticRef,target:command.target,args:command.args,
    risk:command.risk,sourceVersions:command.sourceVersions,
    catalogSha256:evidence.catalogSha256,hqRegistrySha256:evidence.hqRegistrySha256,
    argsSchemaSha256:evidence.argsSchemaSha256});
}
/** Check compiled proof and current authenticated Host pins again at the transport boundary. */
function checkCandidate(command:unknown,evidence:unknown,b:TransportAuthority):string|null {
  if (!validCommand(command) || !validEvidence(evidence)) return 'INVALID_TYPED_PROOF';
  if (evidence.deviceSurface!==b.device) return 'DEVICE_SURFACE_MISMATCH';
  if (command.semanticRef.id!==b.reviewed.semanticId ||
      command.target.actionId!==b.reviewed.actionId ||
      command.risk.level!==b.reviewed.risk ||
      evidence.argsSchemaSha256!==b.reviewed.argsSchemaSha256)
    return 'UNREVIEWED_ACTION_OR_RISK';
  if (command.target.catalogVersion!==b.catalogVersion || evidence.catalogVersion!==b.catalogVersion ||
      command.risk.sourceHash!==b.catalogSha256 || evidence.catalogSha256!==b.catalogSha256 ||
      command.semanticRef.sourceHash!==b.hqRegistrySha256 || evidence.hqRegistrySha256!==b.hqRegistrySha256 ||
      command.sourceVersions.policy!==b.policyVersion || command.sourceVersions.hostWorld!==b.hostWorldVersion)
    return 'STALE_OR_UNREVIEWED_SOURCE';
  if (command.risk.level==='R3') return 'R3_REFUSED';
  if (command.risk.level==='R2' && b.device==='phone') return 'R2_DESKTOP_REQUIRED';
  if (command.capability.supportedByBuild===false || command.capability.availableNow==='no' ||
      command.capability.permittedForActor==='no') return 'CAPABILITY_DENIED';
  return null;
}
function identity(b:TransportAuthority):TypedCandidateEnvelope['identity'] {
  return {ownerId:b.ownerId,worldId:b.worldId,deviceId:b.deviceId,sessionId:b.sessionId,device:b.device};
}
export function stageTypedCandidate(proof:DescriptorProofResult, authority:unknown, controls:unknown):TransportStage {
  if (!validAuthority(authority)) return deny('HOST_AUTHORITY_REQUIRED');
  if (!validControls(controls,authority.nowMs)) return deny('INVALID_OR_EXPIRED_CONTROLS');
  if (!record(proof) || proof.outcome!=='candidate') return deny('NOT_A_COMPILED_CANDIDATE');
  const cause=checkCandidate(proof.command,proof.evidence,authority);
  if (cause) return deny(cause);
  const body={schema:TYPED_TRANSPORT_SCHEMA,kind:'candidate_only' as const,identity:identity(authority),
    controls:{...controls},semanticDigest:semanticDigest(proof.command,proof.evidence),
    command:proof.command,sourceEvidence:proof.evidence,
    executionAuthority:'none' as const,approval:'not_requested' as const};
  const envelope:TypedCandidateEnvelope={...body,envelopeDigest:digest(body)};
  try { if (Buffer.byteLength(JSON.stringify(envelope))>MAX_ENVELOPE_BYTES) return deny('ENVELOPE_TOO_LARGE'); }
  catch { return deny('INVALID_TYPED_PROOF'); }
  return {outcome:'candidate',envelope,effectPerformed:false};
}
export function validateTypedEnvelope(value:unknown, authority:unknown):TransportStage {
  if (!validAuthority(authority)) return deny('HOST_AUTHORITY_REQUIRED');
  if (!keys(value,['schema','kind','identity','controls','semanticDigest','envelopeDigest','command','sourceEvidence',
      'executionAuthority','approval']) || value.schema!==TYPED_TRANSPORT_SCHEMA || value.kind!=='candidate_only' ||
      value.executionAuthority!=='none' || value.approval!=='not_requested' ||
      !keys(value.identity,['ownerId','worldId','deviceId','sessionId','device']) ||
      !hash(value.semanticDigest) || !hash(value.envelopeDigest)) return deny('INVALID_ENVELOPE');
  const wanted=identity(authority);
  if (!Object.entries(wanted).every(([k,v])=>(value.identity as Record<string,unknown>)[k]===v)) return deny('IDENTITY_MISMATCH');
  if (!validControls(value.controls,authority.nowMs)) return deny('INVALID_OR_EXPIRED_CONTROLS');
  const cause=checkCandidate(value.command,value.sourceEvidence,authority);
  if (cause) return deny(cause);
  const e=value as unknown as TypedCandidateEnvelope;
  if (e.semanticDigest!==semanticDigest(e.command,e.sourceEvidence)) return deny('SEMANTIC_DIGEST_MISMATCH');
  const {envelopeDigest:claimed,...body}=e;
  if (claimed!==digest(body)) return deny('ENVELOPE_DIGEST_MISMATCH');
  try { if (Buffer.byteLength(JSON.stringify(e))>MAX_ENVELOPE_BYTES) return deny('ENVELOPE_TOO_LARGE'); }
  catch { return deny('INVALID_ENVELOPE'); }
  return {outcome:'candidate',envelope:e,effectPerformed:false};
}
/** Bounded in-memory receipt/cancellation ledger. Its receipts prove local reception ONLY. */
export class TypedTransportInbox {
  private readonly maxEntries:number;
  private readonly records=new Map<string,{envelope:TypedCandidateEnvelope;status:TransportReceipt['status']}>();
  private readonly highestSequence=new Map<string,number>();
  constructor(maxEntries=128) {
    if (!Number.isSafeInteger(maxEntries)||maxEntries<1||maxEntries>1024) throw Error('INVALID_LEDGER_BOUND');
    this.maxEntries=maxEntries;
  }
  get size():number {return this.records.size;}
  private key(e:TypedCandidateEnvelope):string {
    return [e.identity.ownerId,e.identity.worldId,e.identity.deviceId,e.identity.sessionId,e.controls.idempotencyKey].join('|');
  }
  private lane(e:TypedCandidateEnvelope):string {
    return [e.identity.ownerId,e.identity.worldId,e.identity.deviceId,e.identity.sessionId].join('|');
  }
  private receipt(e:TypedCandidateEnvelope,status:TransportReceipt['status'],replayed:boolean):TransportReceipt {
    return {schema:'vivim.wave4-transport-receipt/1',outcome:'transport_only',correlationId:e.controls.correlationId,
      idempotencyKey:e.controls.idempotencyKey,semanticDigest:e.semanticDigest,status,replayed,
      hostAccepted:false,executionAuthorized:false,effectPerformed:false};
  }
  accept(candidate:unknown, authority:unknown):TransportObservation {
    const checked=validateTypedEnvelope(candidate,authority);
    if(checked.outcome!=='candidate') return checked;
    const e=checked.envelope,k=this.key(e),before=this.records.get(k);
    if(before) {
      if(before.envelope.envelopeDigest!==e.envelopeDigest) return deny('IDEMPOTENCY_COLLISION');
      return {outcome:'observed',receipt:this.receipt(e,before.status,true)};
    }
    if(this.records.size>=this.maxEntries) return deny('TRANSPORT_LEDGER_FULL');
    if(e.controls.sequence<=(this.highestSequence.get(this.lane(e))??0)) return deny('REORDERED_OR_REPLAYED_SEQUENCE');
    this.records.set(k,{envelope:e,status:'received'});
    this.highestSequence.set(this.lane(e),e.controls.sequence);
    return {outcome:'observed',receipt:this.receipt(e,'received',false)};
  }
  private change(envelope:unknown,authority:unknown,next:'uncertain'|'cancelled',cancelId?:unknown):TransportObservation {
    const checked=validateTypedEnvelope(envelope,authority);
    if(checked.outcome!=='candidate') return checked;
    const e=checked.envelope, prior=this.records.get(this.key(e));
    if(!prior || prior.envelope.envelopeDigest!==e.envelopeDigest) return deny('TRANSPORT_RECORD_UNKNOWN');
    if(next==='cancelled' && cancelId!==e.controls.cancelId) return deny('CANCEL_BINDING_MISMATCH');
    if(prior.status==='uncertain' && next==='cancelled') return deny('CANCEL_UNCERTAIN_CHECK_HOST');
    if(prior.status==='cancelled' && next==='uncertain') return deny('ALREADY_CANCELLED');
    if(prior.status==='received') prior.status=next;
    return {outcome:'observed',receipt:this.receipt(e,prior.status,false)};
  }
  /** Dropped ACK/connection ambiguity: halt retries; do NOT infer a failed Host effect. */
  markUncertain(envelope:unknown,authority:unknown):TransportObservation {
    return this.change(envelope,authority,'uncertain');
  }
  /** Local cancellation only: NOT a cancellation of an already-claimed Host effect. */
  cancel(envelope:unknown,authority:unknown,cancelId:unknown):TransportObservation {
    return this.change(envelope,authority,'cancelled',cancelId);
  }
}
