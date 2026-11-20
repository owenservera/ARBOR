# File: contracts/interop/v1/validate.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | contracts/interop/v1/validate.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1909 B |
| Lines | 33 |
| Hash | 75f276c99f2b |
| Test | no |
| Generated | no |
| Component | contracts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HOST_EFFECT_STATES | const | 2 | yes | export const HOST_EFFECT_STATES=Object.freeze([&#39;planned&#39;,&#39;approved&#39;,&#39;uncertain&#39;,&#39;applied&#39;,&#39;failed&#39;]); |
| GRADUATION_STATES | const | 3 | yes | export const GRADUATION_STATES=Object.freeze([&#39;IMPLEMENTED&#39;,&#39;VERIFIED&#39;,&#39;DESIGN_ONLY&#39;,&#39;PREVIEW&#39;,&#39;DEFERRED&#39;,&#39;BLOCKED&#39;]); |
| ref | function | 4 | no | const ref=v=&gt;typeof v===&#39;string&#39;&amp;&amp;v.length&gt;0&amp;&amp;v.length&lt;=256&amp;&amp;!/[\\x00-\\x1f]/.test(v); |
| isSourceRef | function | 5 | yes | export function isSourceRef(s){ |
| isEvidenceRef | function | 12 | yes | export function isEvidenceRef(e){ |
| canDisplayProjection | function | 18 | yes | export function canDisplayProjection(view,expected){ |
| projectHostJournalState | function | 27 | yes | export function projectHostJournalState({approval=false,claimed=false,receipt=null}={}){ |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [tests/compatibility/wave1f.test.mjs](../../../tests/compatibility/wave1f.test.mjs.md) | ../../contracts/interop/v1/validate.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
