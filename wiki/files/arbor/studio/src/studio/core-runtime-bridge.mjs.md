# File: studio/src/studio/core-runtime-bridge.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/core-runtime-bridge.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 15859 B |
| Lines | 186 |
| Hash | 7a688dd9d7e1 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| BRIDGE_SCHEMA | const | 3 | yes | export const BRIDGE_SCHEMA = &#39;aion.webapp-harness-core/1&#39;; |
| str | function | 4 | no | const str = (x, n=256) =&gt; typeof x === &#39;string&#39; &amp;&amp; x.length &gt; 0 &amp;&amp; x.length &lt;= n &amp;&amp; !/[\\x00-\\x1f\\x7f]/.test(x); |
| seq | function | 5 | no | const seq = n =&gt; Number.isSafeInteger(n) &amp;&amp; n &gt;= 0; |
| hex | function | 6 | no | const hex = x =&gt; typeof x === &#39;string&#39; &amp;&amp; /^[a-f0-9]{64}$/.test(x); |
| fail | function | 7 | no | const fail = code =&gt; Object.assign(new Error(code), { code }); |
| same | function | 8 | no | const same = (a,b) =&gt; a !== null &amp;&amp; a !== undefined &amp;&amp; a === b; |
| origin | function | 9 | no | function origin(value) { |
| localSource | function | 13 | no | function localSource(s, captureRef, minSequence=0) { |
| unknown | function | 18 | no | const unknown = (reason) =&gt; ({state:&#39;unverified&#39;, nativeRef:null, source:null, reason}); |
| slot | function | 19 | no | function slot(claim, kind, page, at) { |
| resolveAttachment | function | 31 | yes | export function resolveAttachment({adapter,page,resolved={}}={}) { |
| pageOrigin | variable | 37 | no | let pageOrigin; |
| identity | const | 42 | no | const identity = {}; |
| account | const | 44 | no | const account = page.account?.state === &#39;authenticated&#39; &amp;&amp; localSource(page.account.source,page.captureRef,page.sequence) |
| capabilityTruth | function | 54 | yes | export function capabilityTruth({attachment,feature,staticHint=false,pageProbe=null,ownerEffectProof=null}={}) { |
| a | const | 56 | no | const a=attachment.attachment; |
| observed | const | 57 | no | const observed = !!pageProbe &amp;&amp; pageProbe.targetId===a.targetId &amp;&amp; pageProbe.origin===a.origin |
| verifiedAction | const | 61 | no | const verifiedAction = observed &amp;&amp; pageProbe.state===&#39;available&#39; &amp;&amp; ownerEffectProof?.source===&#39;studio-effect-owner&#39; |
| tier | const | 65 | no | const tier=verifiedAction?&#39;verified-action&#39;:observed?&#39;page-observed&#39;:staticHint?&#39;static-hint&#39;:&#39;unknown&#39;; |
| availability | const | 66 | no | const availability=observed?(pageProbe.state===&#39;available&#39;?&#39;supported&#39;:&#39;unavailable&#39;):&#39;unverified&#39;; |
| effectBoundary | function | 75 | yes | export function effectBoundary({attachment,capability,tool,requestedEffect,preflight,lease,journal,owner}={}) { |
| deny | function | 76 | no | const deny = reason =&gt; Object.freeze({schema:BRIDGE_SCHEMA,decision:&#39;deny&#39;,reason,dispatch:false,retryAuthorized:false}); |
| scope | const | 79 | no | const scope=capability.scope, target=attachment.attachment; |
| a | const | 90 | no | const a=attachment.attachment; |
| bound | const | 98 | no | const bound=attachment.identity[kind]; |
| absent | function | 104 | no | const absent = reason =&gt; ({state:&#39;unknown&#39;,reason,evidence:[]}); |
| checked | function | 105 | no | const checked = (reason, evidence) =&gt; ({state:&#39;observed&#39;,reason,evidence}); |
| evidenceMatches | function | 106 | no | function evidenceMatches(e,turn, sessionId,after) { |
| stage | function | 110 | no | const stage = (state, reason, evidence=[]) =&gt; ({state,reason,evidence}); |
| reconcileLifecycle | function | 115 | yes | export function reconcileLifecycle({run,stepKey,journal,binding,baseline,origin:expectedOrigin, attachment,reconcileUncertainStep,capture,acceptance,goal}={}) { |
| result | const | 117 | no | const result={schema:BRIDGE_SCHEMA,stepKey,delivery:absent(&#39;UNVERIFIED_INTENT&#39;),replyAttribution:absent(&#39;NO_FRESH_REPLY&#39;), |
| step | const | 123 | no | const step=run.steps.filter(s=&gt;s.key===stepKey); |
| effect | const | 125 | no | const effect=reconcileUncertainStep({run,stepKey,journal,intentBinding:binding}); |
| s | const | 132 | no | const s=step[0], b=binding; |
| bound | const | 133 | no | const bound=b?.source===&#39;trusted-pre-effect&#39; &amp;&amp; b?.runId===run.id &amp;&amp; b?.stepKey===stepKey |
| matches | const | 140 | no | const matches=journal.turns?.filter(t=&gt;t.key===b.journalTurnKey)??[]; |
| t | const | 142 | no | const t=matches[0]; |
| d | const | 155 | no | const d=t.delivery?.evidence; |
| r | const | 160 | no | const r=t.reply?.evidence; |
| duplicate | const | 161 | no | const duplicate=(journal.turns??[]).some(other=&gt;other!==t &amp;&amp; (other.reply?.evidence?.identity===r?.identity \|\| other.completion?.evidence?.identity===r?.identity)); |
| n | const | 168 | no | const n=t.completion?.evidence; |
| gates | const | 175 | no | const gates=acceptance?.gates; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/thread-identity.mjs](../capture/thread-identity.mjs.md) | ../studio/core-runtime-bridge.mjs |
| [studio/src/studio/harness-api.mjs](./harness-api.mjs.md) | ./core-runtime-bridge.mjs |
| [studio/test/unit/consolidate-studio-src.test.mjs](../../test/unit/consolidate-studio-src.test.mjs.md) | ../../src/studio/core-runtime-bridge.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// AION C1 provider-independent, data-only harness bridge (Node >=22).
// Pure decisions only. No browser actor, capture writer, journal writer or send authorization.
export const BRIDGE_SCHEMA = 'aion.webapp-harness-core/1';
const str = (x, n=256) => typeof x === 'string' && x.length > 0 && x.length <= n && !/[\x00-\x1f\x7f]/.test(x);
const seq = n => Number.isSafeInteger(n) && n >= 0;
const hex = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const fail = code => Object.assign(new Error(code), { code });
const same = (a,b) => a !== null && a !== undefined && a === b;
function origin(value) {
  try { const u = new URL(value); if (u.protocol === 'https:' && u.origin === value && !u.username && !u.password) return value; } catch {}
  throw fail('INVALID_CANONICAL_ORIGIN');
}
function localSource(s, captureRef, minSequence=0) {
  return !!s && ['native-route','native-message-id','provider-account-index','observed-task-id'].includes(s.kind)
    && str(s.captureRef,200) && s.captureRef === captureRef && seq(s.sequence) && s.sequence >= minSequence
    && str(s.reference,256) && ['saved-real-capture','live-browser-observation','synthetic-fixture'].includes(s.evidenceClass);
}
const unknown = (reason) => ({state:'unverified', nativeRef:null, source:null, reason});
function slot(claim, kind, page, at) {
  if (claim == null) return unknown('NO_DURABLE_IDENTITY');
  if (claim.kind !== kind || claim.verified !== true || !str(claim.nativeRef,256)
    || claim.origin !== page.origin || !localSource(claim.source, page.captureRef, at)) return unknown('IDENTITY_NOT_PROVEN');
  // Human-readable titles, text, ordinal positions and unqualified URL query fragments are not keys.
  if (['title','text','position','ordinal','url-query'].includes(claim.source?.kind)) return unknown('IDENTITY_NOT_PROVEN');
  return {state:'bound',kind,nativeRef:claim.nativeRef,source:structuredClone(claim.source),reason:null};
}

/** Only a trusted Capture Studio observation + provider-specific identity resolver may bind a native ID.
 * `resolved` comes from the existing selected adapter, never from caller-provided chat title/text.
 */
export function resolveAttachment({adapter,page,resolved={}}={}) {
  if (!adapter || !str(adapter.siteId,80) || !str(adapter.providerId,128) || !str(adapter.surface,80)
    || !['seed','learned-read-only'].includes(adapter.kind) || !str(adapter.version,80)) throw fail('INVALID_ADAPTER_CONTRACT');
  origin(adapter.origin);
  if (!page || !str(page.targetId,256) || !str(page.captureRef,200) || !seq(page.sequence)
    || !str(page.observedAt,64) || !Number.isFinite(Date.parse(page.observedAt))) throw fail('ATTACHMENT_EVIDENCE_MISSING');
  let pageOrigin;
  try { const u = new URL(page.url); pageOrigin = u.origin; if (u.protocol!=='https:') throw 0; }
  catch { throw fail('TARGET_URL_INVALID'); }
  if (pageOrigin !== adapter.origin || page.origin !== adapter.origin || page.siteId !== adapter.siteId
    || page.surface !== adapter.surface) throw fail('TARGET_SCOPE_MISMATCH');
  const identity = {};
  for (const kind of ['conversation','task','branch','generation']) identity[kind] = slot(resolved[kind],kind,page,page.sequence);
  const account = page.account?.state === 'authenticated' && localSource(page.account.source,page.captureRef,page.sequence)
    ? {state:'authenticated',ref:str(page.account.ref)?page.account.ref:null,source:structuredClone(page.account.source)}
    : {state:'unverified',ref:null,source:null};
  return Object.freeze({schema:BRIDGE_SCHEMA,adapter:{providerId:adapter.providerId,siteId:adapter.siteId,
    surface:adapter.surface,origin:adapter.origin,kind:adapter.kind,version:adapter.version},
    attachment:{targetId:page.targetId,url:page.url,origin:pageOrigin,captureRef:page.captureRef,sequence:page.sequence,
      observedAt:page.observedAt,verified:true},account,identity});
}

/** Truth levels are NOT capabilities inferred from selectors or product marketing. */
export function capabilityTruth({attachment,feature,staticHint=false,pageProbe=null,ownerEffectProof=null}={}) {
  if (attachment?.schema!==BRIDGE_SCHEMA || !str(feature,80)) throw fail('INVALID_CAPABILITY_REQUEST');
  const a=attachment.attachment;
  const observed = !!pageProbe && pageProbe.targetId===a.targetId && pageProbe.origin===a.origin
    && pageProbe.captureRef===a.captureRef && seq(pageProbe.sequence) && pageProbe.sequence>=a.sequence
    && str(pageProbe.reference) && pageProbe.source==='studio-page-observation'
    && ['available','unavailable'].includes(pageProbe.state);
  const verifiedAction = observed && pageProbe.state==='available' && ownerEffectProof?.source==='studio-effect-owner'
    && ownerEffectProof?.feature===feature && ownerEffectProof?.targetId===a.targetId
    && ownerEffectProof?.captureRef===a.captureRef && ownerEffectProof?.reference && ownerEffectProof?.state==='effect-observed'
    && seq(ownerEffectProof.sequence) && ownerEffectProof.sequence>=pageProbe.sequence;
  const tier=verifiedAction?'verified-action':observed?'page-observed':staticHint?'static-hint':'unknown';
  const availability=observed?(pageProbe.state==='available'?'supported':'unavailable'):'unverified';
  return Object.freeze({schema:BRIDGE_SCHEMA,feature,availability,tier,
    scope:{providerId:attachment.adapter.providerId,siteId:attachment.adapter.siteId,surface:attachment.adapter.surface,origin:a.origin,targetId:a.targetId,captureRef:a.captureRef,attachmentSequence:a.sequence},
    evidence:verifiedAction?[pageProbe.reference,ownerEffectProof.reference]:observed?[pageProbe.reference]:[],
    // These are read-only claims; no discovered adapter gains execution authority.
    executionAuthority:'existing-studio-effect-owner-only',sendAuthorized:false});
}

/** Pre-dispatch advisory: returning defer-to-studio is NOT a grant or an effect. */
export function effectBoundary({attachment,capability,tool,requestedEffect,preflight,lease,journal,owner}={}) {
  const deny = reason => Object.freeze({schema:BRIDGE_SCHEMA,decision:'deny',reason,dispatch:false,retryAuthorized:false});
  if (attachment?.schema!==BRIDGE_SCHEMA || capability?.schema!==BRIDGE_SCHEMA) return deny('UNVERIFIED_CONTRACT');
  if (requestedEffect!=='read' && requestedEffect!=='submit') return deny('UNKNOWN_EFFECT');
  const scope=capability.scope, target=attachment.attachment;
  if (!scope || scope.providerId!==attachment.adapter.providerId || scope.siteId!==attachment.adapter.siteId
```

_First 80 of 187 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
