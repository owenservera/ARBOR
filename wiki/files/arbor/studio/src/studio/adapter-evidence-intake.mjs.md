# File: studio/src/studio/adapter-evidence-intake.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/adapter-evidence-intake.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6643 B |
| Lines | 89 |
| Hash | ac00e5e680e7 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| INTAKE_SCHEMA | const | 4 | yes | export const INTAKE_SCHEMA = &#39;aion.adapter-evidence-intake/1&#39;; |
| FEATURES | const | 5 | no | const FEATURES = new Set([&#39;composer&#39;,&#39;send-control&#39;,&#39;user-turn&#39;,&#39;assistant-turn&#39;,&#39;stop-control&#39;,&#39;thread-route&#39;,&#39;citation&#39;,&#39;artifact&#39;,&#39;task-progress&#39;,&#39;stream-component&#39;]); |
| OUTCOMES | const | 6 | no | const OUTCOMES = new Set([&#39;present&#39;,&#39;absent&#39;,&#39;unknown&#39;]); |
| CLASSES | const | 7 | no | const CLASSES = new Set([&#39;SAVED_REAL_CAPTURE&#39;,&#39;SANDBOX_REAL_BROWSER&#39;,&#39;WINDOWS_LIVE_ACCEPTED&#39;,&#39;SYNTHETIC_TEST&#39;]); |
| CARRIERS | const | 8 | no | const CARRIERS = new Set([&#39;dom&#39;,&#39;a11y&#39;,&#39;network&#39;,&#39;correlated&#39;]); |
| IDENTITY_FEATURES | const | 9 | no | const IDENTITY_FEATURES = new Set([&#39;user-turn&#39;,&#39;assistant-turn&#39;,&#39;thread-route&#39;]); |
| str | function | 10 | no | const str = (s, max=128) =&gt; typeof s === &#39;string&#39; &amp;&amp; s.length&gt;0 &amp;&amp; s.length&lt;=max &amp;&amp; !/[\\x00-\\x1f\\x7f]/.test(s); |
| obj | function | 11 | no | const obj = x =&gt; x !== null &amp;&amp; typeof x === &#39;object&#39; &amp;&amp; !Array.isArray(x); |
| fail | function | 12 | no | function fail(code) { throw Object.assign(new Error(code), {code}); } |
| origin | function | 13 | no | function origin(s) { try { const u=new URL(s); return u.protocol === &#39;https:&#39; &amp;&amp; u.origin===s; } catch {return false;} } |
| scopeKey | function | 14 | yes | export function scopeKey(scope) { |
| attr | function | 19 | no | const attr = (name, value) =&gt; str(value,100) &amp;&amp; /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,99}$/.test(value) |
| deriveCandidate | function | 21 | no | function deriveCandidate(o) { |
| role | const | 26 | no | const role=o.feature===&#39;user-turn&#39;?&#39;user&#39;:&#39;assistant&#39;; |
| c | const | 35 | no | const c=attr(name,o.attributes[key]); if (c) return c; |
| intakeEvents | function | 39 | yes | export async function intakeEvents(events,{verifyCapture}={}) { |
| probes | const | 41 | no | const probes=[], receipts=[], captures=new Map(), sources=new Set(); |
| scope | const | 43 | no | const scope=event?.scope, source=event?.source; |
| key | const | 44 | no | const key=scopeKey(scope); |
| ok | const | 53 | no | const ok=await verifyCapture({scope,source}); |
| captureScope | const | 56 | no | const captureScope=JSON.stringify([source.captureId,source.sessionId,source.rawDigest,key]); |
| prior | const | 57 | no | const prior=captures.get(source.captureId); |
| candidate | const | 66 | no | const candidate=deriveCandidate(o); |
| identityOkay | const | 68 | no | const identityOkay=!IDENTITY_FEATURES.has(o.feature) \|\| (o.identityVerdict===&#39;verified&#39; &amp;&amp; str(o.identityRef) &amp;&amp; (o.feature===&#39;thread-route&#39; \|\| o.identityRole===(o.feature===&#39;assistant-turn&#39;?&#39;assista… |
| outcome | const | 70 | no | const outcome = (!identityOkay \|\| (o.outcome===&#39;absent&#39; &amp;&amp; source.coverage!==&#39;complete&#39;)) ? &#39;unknown&#39; : o.outcome; |
| probe | const | 72 | no | const probe={siteId:scope.siteId,origin:scope.origin,surface:scope.surface, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./adapter-probes.mjs | import | 2 | [studio/src/studio/adapter-probes.mjs](./adapter-probes.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/adapter-accepted-session.mjs](./adapter-accepted-session.mjs.md) | ./adapter-evidence-intake.mjs |
| [studio/src/studio/adapter-improvement-pipeline.mjs](./adapter-improvement-pipeline.mjs.md) | ./adapter-evidence-intake.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// I1 Capture Studio evidence -> Round 8 source-qualified probes. No browser effects.
import { selectorForRole } from './adapter-probes.mjs';
// The verifier MUST be the Core session-bound acceptance reader, not a client boolean.
export const INTAKE_SCHEMA = 'aion.adapter-evidence-intake/1';
const FEATURES = new Set(['composer','send-control','user-turn','assistant-turn','stop-control','thread-route','citation','artifact','task-progress','stream-component']);
const OUTCOMES = new Set(['present','absent','unknown']);
const CLASSES = new Set(['SAVED_REAL_CAPTURE','SANDBOX_REAL_BROWSER','WINDOWS_LIVE_ACCEPTED','SYNTHETIC_TEST']);
const CARRIERS = new Set(['dom','a11y','network','correlated']);
const IDENTITY_FEATURES = new Set(['user-turn','assistant-turn','thread-route']);
const str = (s, max=128) => typeof s === 'string' && s.length>0 && s.length<=max && !/[\x00-\x1f\x7f]/.test(s);
const obj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
function fail(code) { throw Object.assign(new Error(code), {code}); }
function origin(s) { try { const u=new URL(s); return u.protocol === 'https:' && u.origin===s; } catch {return false;} }
export function scopeKey(scope) {
  if (!obj(scope) || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(scope.siteId??'') ||
      !origin(scope.origin) || !str(scope.surface,60) || !str(scope.accountRef,128)) fail('SCOPE_UNVERIFIED');
  return JSON.stringify([scope.siteId,scope.origin,scope.accountRef,scope.surface]);
}
const attr = (name, value) => str(value,100) && /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,99}$/.test(value)
  ? `[${name}="${value.replaceAll('\\','\\\\').replaceAll('"','\\"')}"]` : null;
function deriveCandidate(o) {
  // Preserve the existing factory's observed exact/suffix role-selector semantics.
  // An unbound role name alone cannot mint semantic identity: intakeEvents below
  // still requires the Core-qualified per-turn identity verdict.
  if (o.feature==='user-turn' || o.feature==='assistant-turn') {
    const role=o.feature==='user-turn'?'user':'assistant';
    if (o.attributes?.[o.roleAttribute]===role && ['exact','suffix'].includes(o.roleMatch))
      return selectorForRole(o.roleAttribute,role,o.roleMatch);
  }
  if (o.feature==='thread-route') return o.routePattern && /^\/[a-zA-Z0-9/_:.-]{2,160}$/.test(o.routePattern) ? o.routePattern : null;
  if (o.feature==='stream-component') return o.streamPath && /^\$\.[a-zA-Z0-9_.\[\]*-]{2,160}$/.test(o.streamPath) ? o.streamPath : null;
  if (!obj(o.attributes)) return null;
  // Stable structure only. Never learn text, a positional selector or a CSS action.
  for (const [key,name] of [['data-testid','data-testid'],['data-message-author-role','data-message-author-role'],['data-actor','data-actor'],['data-role','data-role'],['aria-label','aria-label']]) {
    const c=attr(name,o.attributes[key]); if (c) return c;
  }
  return null;
}
export async function intakeEvents(events,{verifyCapture}={}) {
  if(!Array.isArray(events)||events.length>2000 || typeof verifyCapture!=='function') fail('INTAKE_CONTRACT');
  const probes=[], receipts=[], captures=new Map(), sources=new Set();
  for (const event of events) {
    const scope=event?.scope, source=event?.source;
    const key=scopeKey(scope);
    if (!obj(source) || !str(source.captureId) || !str(source.sessionId) ||
        !Number.isSafeInteger(source.sequence) || source.sequence<0 ||
        !/^[a-f0-9]{64}$/.test(source.rawDigest??'') ||
        source.origin!==scope.origin || source.accountRef!==scope.accountRef ||
        !CLASSES.has(source.evidenceClass) || !CARRIERS.has(source.carrier) ||
        !['complete','partial','unknown'].includes(source.coverage) ||
        !str(source.evidenceRef,180)) fail('SOURCE_UNQUALIFIED');
    if (source.evidenceClass!=='SYNTHETIC_TEST') {
      const ok=await verifyCapture({scope,source});
      if(ok!==true) fail('CAPTURE_NOT_CORE_VERIFIED');
    }
    const captureScope=JSON.stringify([source.captureId,source.sessionId,source.rawDigest,key]);
    const prior=captures.get(source.captureId);
    if(prior && prior!==captureScope) fail('CAPTURE_ID_COLLISION');
    captures.set(source.captureId,captureScope);
    if (!Array.isArray(event.observations) || event.observations.length>200) fail('OBSERVATIONS_INVALID');
    for(const o of event.observations) {
      if(!obj(o) || !FEATURES.has(o.feature) || !OUTCOMES.has(o.outcome) ||
         !str(o.evidenceRef,180) || o.evidenceRef!==source.evidenceRef ||
         (o.feature==='stream-component' && !['network','correlated'].includes(source.carrier)) ||
         (o.feature!=='stream-component' && o.feature!=='thread-route' && !['dom','a11y'].includes(source.carrier))) fail('OBSERVATION_SOURCE_MISMATCH');
      const candidate=deriveCandidate(o);
      if (!candidate) continue; // Skip private text / unstable selectors rather than guessing.
      const identityOkay=!IDENTITY_FEATURES.has(o.feature) || (o.identityVerdict==='verified' &&
        str(o.identityRef) && (o.feature==='thread-route' || o.identityRole===(o.feature==='assistant-turn'?'assistant':'user')));
      const outcome = (!identityOkay || (o.outcome==='absent' && source.coverage!=='complete')) ? 'unknown' : o.outcome;
      const type=o.feature==='thread-route'?'route':o.feature==='stream-component'?'stream-map':'selector';
      const probe={siteId:scope.siteId,origin:scope.origin,surface:scope.surface,
        feature:o.feature,type,candidate,outcome,coverage:source.coverage,
        captureId:source.captureId,sequence:source.sequence,carrier:source.carrier,evidenceClass:source.evidenceClass,
        sessionId:source.sessionId,evidenceRef:source.evidenceRef,rawDigest:source.rawDigest,
        domDigest:source.domDigest??null,sourceProducer:source.producer??null};
      probes.push(probe);
      receipts.push({scopeKey:key,accountRef:scope.accountRef,sessionId:source.sessionId,
        captureId:source.captureId,rawDigest:source.rawDigest,evidenceRef:source.evidenceRef,
        domDigest:source.domDigest??null,sequence:source.sequence,carrier:source.carrier,
```

_First 80 of 90 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
