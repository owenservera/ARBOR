// Pure, dependency-free guard. Never a Host dispatcher, signer or identity issuer.
export const HOST_EFFECT_STATES=Object.freeze(['planned','approved','uncertain','applied','failed']);
export const GRADUATION_STATES=Object.freeze(['IMPLEMENTED','VERIFIED','DESIGN_ONLY','PREVIEW','DEFERRED','BLOCKED']);
const ref=v=>typeof v==='string'&&v.length>0&&v.length<=256&&!/[\x00-\x1f]/.test(v);
export function isSourceRef(s){
 return !!s&&typeof s==='object'&&!Array.isArray(s)&&ref(s.id)&&
 ['development','personal','control','ui'].includes(s.domain)&&
 (s.ownerRef===null||ref(s.ownerRef))&&
 (s.domain!=='personal'||ref(s.ownerRef))&&
 Number.isSafeInteger(s.revision)&&s.revision>=0;
}
export function isEvidenceRef(e){
 return !!e&&typeof e==='object'&&isSourceRef(e.source)&&
 typeof e.digest==='string'&&/^[a-f0-9]{64}$/.test(e.digest)&&
 ['rule','accepted-pattern','source-observed','model-proposed'].includes(e.confidence);
}
/** Inert projection only. Source version and owner must match trusted Host-provided read context. */
export function canDisplayProjection(view,expected){
 return !!view&&view.schema==='arbor.inert-view/1'&&view.inert===true&&
 isSourceRef(view.source)&&isSourceRef(expected)&&
 ['candidate','grounded'].includes(view.status)&&view.source.id===expected.id&&
 view.source.domain===expected.domain&&view.source.ownerRef===expected.ownerRef&&
 view.source.revision===expected.revision&&
 Array.isArray(view.actions)&&view.actions.every(ref);
}
/** Mirror Host journal's read-state, not a write transition. A claim sans receipt is UNCERTAIN. */
export function projectHostJournalState({approval=false,claimed=false,receipt=null}={}){
 if(receipt!==null){
  if(!claimed||!receipt||!['applied','failed','uncertain'].includes(receipt.status))return 'uncertain';
  return receipt.status;
 }
 return claimed?'uncertain':approval?'approved':'planned';
}
