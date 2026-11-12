// ARBOR P2-C staging: PURE TEST-ONLY adapter. Do not mount as authentication, source owner, scheduler, publisher or effect authority.
// Expected context must come from trusted Host/B; this module checks consistency, not trust itself.
function record(v){return v!==null&&typeof v==="object"&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null)&&Object.values(Object.getOwnPropertyDescriptors(v)).every(d=>"value" in d);}

function exact(v,keys){return record(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));}

function id(v){return typeof v==="string"&&v.length>0&&v.length<=160&&!/[\x00-\x1f]/.test(v);}

function sourceRef(v){return exact(v,["id","domain","ownerRef","revision"])&&id(v.id)&&["development","personal","control","ui"].includes(v.domain)&&(v.ownerRef===null||id(v.ownerRef))&&(v.domain!=="personal"||id(v.ownerRef))&&Number.isSafeInteger(v.revision)&&v.revision>=0;}

function sameSource(a,b){return sourceRef(a)&&sourceRef(b)&&a.id===b.id&&a.domain===b.domain&&a.ownerRef===b.ownerRef&&a.revision===b.revision;}

function deny(code){return Object.freeze({ok:false,code});}

function acceptInertProjection(expected,view){
 if(!record(expected)||!id(expected.actorId)||!id(expected.sessionId)||!["desktop-owner","paired-phone-owner"].includes(expected.audience)||!sourceRef(expected.source)||!Number.isSafeInteger(expected.afterSeq)||expected.afterSeq<0)return deny("BAD_TRUSTED_CONTEXT");
 if(!exact(view,["schema","actorId","sessionId","audience","source","event","inert","effectAllowed","automaticRetryAllowed","status","cues"])||view.schema!=="arbor.p2c.inert-read/1")return deny("INVALID_PROJECTION");
 if(view.actorId!==expected.actorId||view.sessionId!==expected.sessionId||view.audience!==expected.audience)return deny("ACTOR_OR_AUDIENCE_MISMATCH");
 if(!sameSource(expected.source,view.source))return deny("FOREIGN_OR_STALE_SOURCE");
 if(!exact(view.event,["eventId","kind","seq","expectedRevision"])||!id(view.event.eventId)||!["draft","observation"].includes(view.event.kind)||!Number.isSafeInteger(view.event.seq)||view.event.seq<=expected.afterSeq||view.event.expectedRevision!==expected.source.revision)return deny("STALE_OR_UNAUTHORIZED_EVENT");
 if(view.inert!==true||view.effectAllowed!==false||view.automaticRetryAllowed!==false)return deny("EFFECT_CLAIM_FORBIDDEN");
 if(!["candidate","grounded"].includes(view.status))return deny("NOT_DISPLAYABLE");
 if(!Array.isArray(view.cues)||view.cues.length>32||!view.cues.every(c=>exact(c,["kind","code"])&&["semantic","chronos","source"].includes(c.kind)&&typeof c.code==="string"&&/^[A-Z][A-Z0-9_]{0,63}$/.test(c.code)))return deny("UNBOUNDED_OR_RAW_CUE");
 return Object.freeze({ok:true,schema:"arbor.p2c.inert-read/1",source:expected.source,eventSeq:view.event.seq,status:view.status,cues:Object.freeze(view.cues.map(c=>Object.freeze({kind:c.kind,code:c.code}))),inert:true,effectAllowed:false,automaticRetryAllowed:false});
}

function acceptChronosRead(expected,view,read){
 const gate=acceptInertProjection(expected,view);if(!gate.ok)return gate;
 if(!record(read)||read.effectAllowed!==false)return deny("CHRONOS_EFFECT_CLAIM");
 if(read.schema==="vivim.chronos.conversation-read/1"){
  if(read.automaticRetryAllowed!==false||!id(read.conversationId)||!Number.isSafeInteger(read.sourceRevision)||read.sourceRevision!==expected.source.revision||!Number.isSafeInteger(read.asOfMs)||!Array.isArray(read.turns)||read.turns.length>512||read.turns.some(t=>!record(t)||t.authoritativeSendReceipt!==false)||read.responseLatencyMs!==null)return deny("CHRONOS_CONVERSATION_UNTRUSTED");
  return Object.freeze({ok:true,kind:"conversation",status:read.clockQuality==="wall_clock_unverified"?"estimate_only":"degraded",sourceRevision:expected.source.revision,items:read.turns.length,effectAllowed:false,canExecute:false,automaticRetryAllowed:false});
 }
 if(read.schema==="vivim.chronos.supervisor-read/1"){
  if(read.dispatchAllowed!==false||read.durationAuthority!=="wall_clock_estimate_only"||!Number.isSafeInteger(read.observedAtMs)||!Number.isSafeInteger(read.sourceLastSeq)||!Array.isArray(read.lanes)||read.lanes.length>2000)return deny("CHRONOS_SUPERVISOR_UNTRUSTED");
  return Object.freeze({ok:true,kind:"supervisor",status:"estimate_only",sourceRevision:expected.source.revision,items:read.lanes.length,effectAllowed:false,canExecute:false,automaticRetryAllowed:false});
 }
 return deny("UNSUPPORTED_CHRONOS_SCHEMA");
}
export {sourceRef,sameSource,acceptInertProjection,acceptChronosRead};
