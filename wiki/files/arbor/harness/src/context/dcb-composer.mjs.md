# File: harness/src/context/dcb-composer.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/context/dcb-composer.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14808 B |
| Lines | 216 |
| Hash | 257622302649 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DCB_SCHEMA | const | 8 | yes | export const DCB_SCHEMA = &#39;vivim.dynamic-context-bundle/1&#39;; |
| DCB_PROFILES | const | 9 | yes | export const DCB_PROFILES = Object.freeze([&#39;seed&#39;,&#39;reunion&#39;,&#39;convergence&#39;,&#39;continuum&#39;,&#39;handoff&#39;,&#39;probe&#39;,&#39;deep_research&#39;,&#39;decision_brief&#39;]); |
| DCB_LAYERS | const | 10 | yes | export const DCB_LAYERS = Object.freeze([&#39;L0Identity&#39;,&#39;L1GlobalPrefs&#39;,&#39;L2Topic&#39;,&#39;L3Entity&#39;, &#39;LpProjectState&#39;,&#39;LdDecisions&#39;,&#39;L4Conversation&#39;,&#39;L5JitContext&#39;,&#39;L6RecentHistory&#39;]); |
| TRUST | const | 12 | no | const TRUST = { owner_confirmed:1, observed:0.82, sourced:0.72, provider_reported:0.42, untrusted:0.2 }; |
| SENS | const | 14 | no | const SENS = { public:0,internal:1,private:2,sensitive:3,secret:4 }; |
| MAX_SOURCES | const | 15 | no | const MAX_SOURCES = 250, MAX_SOURCE_BYTES = 1000000, MAX_TOKENS = 24000; |
| fail | function | 16 | no | const fail = (code,message) =&gt; Object.assign(new Error(message),{code}); |
| sha | function | 17 | no | const sha = value =&gt; createHash(&#39;sha256&#39;).update(value).digest(&#39;hex&#39;); |
| stable | function | 18 | no | const stable = x =&gt; Array.isArray(x) ? x.map(stable) : x &amp;&amp; typeof x === &#39;object&#39; |
| digest | function | 20 | no | const digest = x =&gt; sha(JSON.stringify(stable(x))); |
| tokens | function | 21 | no | const tokens = str =&gt; [...new Set(String(str).toLowerCase().match(/[\\p{L}\\p{N}_-]{3,}/gu) ?? [])]; |
| countTokens | function | 22 | no | const countTokens = s =&gt; Math.max(1, Math.ceil(Buffer.byteLength(s,&#39;utf8&#39;) / 3)); // conservative estimate, NOT tokenizer output |
| pathRef | function | 23 | no | function pathRef(ref) { |
| verifiedScope | function | 29 | no | function verifiedScope(candidate, request) { |
| privateSource | const | 40 | no | const privateSource = [&#39;personal&#39;,&#39;conversation&#39;].includes(candidate.classification) |
| scoreCandidate | function | 49 | no | function scoreCandidate(candidate, text, taskTerms, nowMs) { |
| words | const | 50 | no | const words = tokens((Array.isArray(candidate.keywords) ? candidate.keywords.join(&#39; &#39;) : &#39;&#39;) + &#39; &#39; + text.slice(0, 2500)); |
| bag | const | 51 | no | const bag = new Set(words); |
| coverage | const | 54 | no | const coverage = taskTerms.length ? match / taskTerms.length : 0; |
| basis | const | 55 | no | const basis = TRUST[candidate.trust]; |
| age | const | 56 | no | const age = candidate.updatedAt &amp;&amp; Number.isFinite(Date.parse(candidate.updatedAt)) |
| recency | const | 58 | no | const recency = age === null ? 0.25 : Math.exp(-age/90); |
| evidence | const | 59 | no | const evidence = candidate.classification === &#39;decision&#39; ? 1.0 : candidate.classification === &#39;test&#39; ? 0.8 |
| chooseKnapsack | function | 64 | no | function chooseKnapsack(rows, capacity) { |
| UNIT | const | 67 | no | const UNIT = 16; |
| cap | const | 68 | no | const cap = Math.floor(capacity/UNIT); |
| states | const | 70 | no | const states = Array.from({length:cap+1},()=&gt;({score:-Infinity,picks:[]})); |
| weight | const | 73 | no | const weight = Math.ceil(rows[i].cost/UNIT); |
| prior | const | 76 | no | const prior = states[k-weight]; |
| val | const | 78 | no | const val = prior.score + rows[i].score; |
| best | variable | 82 | no | let best = states[0]; |
| stripSource | function | 86 | no | function stripSource(candidate) { |
| normaliseRequest | function | 92 | no | function normaliseRequest(req) { |
| projectScoped | const | 102 | no | const projectScoped=typeof audience?.projectRef===&#39;string&#39;&amp;&amp;audience.projectRef.length&gt;0; |
| activityScoped | const | 103 | no | const activityScoped=typeof audience?.activityRef===&#39;string&#39;&amp;&amp;audience.activityRef.length&gt;0; |
| resolved | const | 122 | no | const resolved={purpose,profile,taskRef,taskText,audience,scope,disclosure,maxInputTokens, |
| createDCBComposer | function | 128 | yes | export function createDCBComposer({resolveSources,readSource}={}) { |
| compose | function | 131 | no | async function compose(input) { |
| req | const | 132 | no | const req = normaliseRequest(input); |
| candidates | const | 133 | no | const candidates = await resolveSources({taskRef:req.taskRef,purpose:req.purpose, profile:req.profile,projectRef:req.audience.projectRef,sourceHead:req.sourceHead}); |
| omissions | const | 137 | no | const omissions=[]; const eligible=[]; const seen=new Set(); |
| order | const | 138 | no | const order=candidates.map(x=&gt;({...x})).sort((a,b)=&gt;String(a.ref).localeCompare(String(b.ref))); |
| taskTerms | const | 139 | no | const taskTerms=tokens(`${req.taskRef} ${req.taskText}`); |
| omit | function | 141 | no | const omit=reason=&gt;{omissions.push({ref:String(c.ref??&#39;invalid&#39;).slice(0,120),reason});}; |
| denial | const | 148 | no | const denial=verifiedScope(c,req);if (denial) {omit(denial);continue;} |
| identity | const | 150 | no | const identity=`${c.ref}\\0${c.revision}\\0${JSON.stringify(c.ranges??[])}`; |
| source | variable | 153 | no | let source; |
| text | const | 160 | no | const text=source.text; |
| encodedHeader | const | 161 | no | const encodedHeader = JSON.stringify({ref:c.ref,revision:c.revision,layer:c.layer,trust:c.trust,sha256:c.sha256}); |
| cost | const | 162 | no | const cost=countTokens(`SOURCE ${encodedHeader}\\nUNTRUSTED DATA ${JSON.stringify(text)}`)+2; |
| score | const | 163 | no | const score=scoreCandidate(c,text,taskTerms,Date.parse(req.now)); |
| seenContent | const | 167 | no | const seenContent=new Set(), unique=[]; |
| hashKey | const | 169 | no | const hashKey=`${c.sha256}\\0${c.layer}`; |
| overhead | const | 174 | no | const overhead=80; |
| capacity | const | 175 | no | const capacity=req.maxInputTokens-req.reservedForUserPrompt-req.reservedForOutput-overhead; |
| chosen | const | 176 | no | const chosen=new Set(chooseKnapsack(unique,capacity)); |
| used | variable | 177 | no | let used=0; |
| included | const | 178 | no | const included=[]; |
| c | const | 180 | no | const c=unique[i]; |
| sources | const | 185 | no | const sources=included.map(stripSource); |
| sourceFingerprint | const | 187 | no | const sourceFingerprint=digest(sources.map(s=&gt;({ref:s.ref,revision:s.revision,sha256:s.sha256}))); |
| base | const | 190 | no | const base={schema:DCB_SCHEMA,profile:req.profile,purpose:req.purpose,taskRef:req.taskRef, |
| manifestDigest | const | 196 | no | const manifestDigest=digest(base); |
| manifest | const | 197 | no | const manifest=Object.freeze({...base,id:`dcb-${manifestDigest.slice(0,24)}`,manifestDigest, destinationVerified:req.audience.destinationModelVerified===true}); |
| fragment | const | 201 | no | const fragment=included.map(c =&gt; `SOURCE ${JSON.stringify({ref:c.ref,revision:c.revision,layer:c.layer,trust:c.trust,sha256:c.sha256})}\\n`+ `UNTRUSTED DATA ${JSON.stringify(c.text)}`).join(&#39;\\n\\n&#39;); |
| verify | function | 208 | no | async function verify(bundle, input) { |
| reconstructed | const | 210 | no | const reconstructed=await compose(input); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 6 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/src/context/dcb-v2-planner.mjs](./dcb-v2-planner.mjs.md) | ./dcb-composer.mjs |
| [harness/test/context/dcb-sources.test.mjs](../../test/context/dcb-sources.test.mjs.md) | ../../src/context/dcb-composer.mjs |
| [harness/test/context/dcb-universal-activity.test.mjs](../../test/context/dcb-universal-activity.test.mjs.md) | ../../src/context/dcb-composer.mjs |
| [studio/src/agents/personal-agent-service.mjs](../../../studio/src/agents/personal-agent-service.mjs.md) | ../../../harness/src/context/dcb-composer.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM Dynamic Context Bundles v1: deterministic, policy-scoped local projection.
// This module NEVER sends, opens browsers, reads arbitrary paths, mutates personal
// authorities, or carries private context into a cloud relay.
// Host adapters resolve canonical refs and read pinned sources; the existing
// owner-approved Studio/Harness send-once boundary remains mandatory downstream.
import { createHash } from 'node:crypto';

export const DCB_SCHEMA = 'vivim.dynamic-context-bundle/1';
export const DCB_PROFILES = Object.freeze(['seed','reunion','convergence','continuum','handoff','probe','deep_research','decision_brief']);
export const DCB_LAYERS = Object.freeze(['L0Identity','L1GlobalPrefs','L2Topic','L3Entity',
  'LpProjectState','LdDecisions','L4Conversation','L5JitContext','L6RecentHistory']);
const TRUST = { owner_confirmed:1, observed:0.82, sourced:0.72, provider_reported:0.42, untrusted:0.2 };
const CLASS = new Set(['task_evidence','source','decision','test','receipt','personal','conversation','project']);
const SENS = { public:0,internal:1,private:2,sensitive:3,secret:4 };
const MAX_SOURCES = 250, MAX_SOURCE_BYTES = 1000000, MAX_TOKENS = 24000;
const fail = (code,message) => Object.assign(new Error(message),{code});
const sha = value => createHash('sha256').update(value).digest('hex');
const stable = x => Array.isArray(x) ? x.map(stable) : x && typeof x === 'object'
  ? Object.fromEntries(Object.keys(x).sort().map(k => [k, stable(x[k])])) : x;
const digest = x => sha(JSON.stringify(stable(x)));
const tokens = str => [...new Set(String(str).toLowerCase().match(/[\p{L}\p{N}_-]{3,}/gu) ?? [])];
const countTokens = s => Math.max(1, Math.ceil(Buffer.byteLength(s,'utf8') / 3)); // conservative estimate, NOT tokenizer output
function pathRef(ref) {
  if (typeof ref !== 'string' || !ref || ref.length > 512 || ref.includes('\\') || ref.startsWith('/')
      || /[\x00-\x1f]/.test(ref) || /(^|\/)\.\.?($|\/)/.test(ref)
      || !/^[a-zA-Z0-9_.@:/#-]+$/.test(ref) || /^[a-z]+:\/\//i.test(ref)) return false;
  return true;
}
function verifiedScope(candidate, request) {
  const {scope, audience, disclosure} = request;
  if (!scope.allowedRefs?.includes(candidate.ref) &&
    !scope.allowedPrefixes?.some(pre => pathRef(pre) && candidate.ref.startsWith(pre))) return 'denied_by_scope';
  if (candidate.sensitivity === 'secret') return 'secret_always_denied';
  if (SENS[candidate.sensitivity] > SENS[scope.maxSensitivity]) return 'denied_by_sensitivity';
  if (candidate.principalRef && candidate.principalRef !== audience.principalRef) return 'wrong_principal';
  if (candidate.projectRef && candidate.projectRef !== audience.projectRef) return 'wrong_project';
  if (candidate.activityRef && candidate.activityRef !== audience.activityRef) return 'wrong_activity';
  // Personal content crossing to ANY external webapp needs exact destination and
  // exact source disclosure. Generic grants do not count.
  const privateSource = ['personal','conversation'].includes(candidate.classification)
    || SENS[candidate.sensitivity] >= SENS.private;
  if (privateSource && audience.destinationProvider) {
    if (disclosure?.approved !== true || disclosure.principalRef !== audience.principalRef
        || disclosure.destinationProvider !== audience.destinationProvider
        || !disclosure.sourceRefs?.includes(candidate.ref)) return 'disclosure_required';
  }
  return null;
}
function scoreCandidate(candidate, text, taskTerms, nowMs) {
  const words = tokens((Array.isArray(candidate.keywords) ? candidate.keywords.join(' ') : '') + ' ' + text.slice(0, 2500));
  const bag = new Set(words);
  let match = 0;
  for (const t of taskTerms) if (bag.has(t)) match++;
  const coverage = taskTerms.length ? match / taskTerms.length : 0;
  const basis = TRUST[candidate.trust];
  const age = candidate.updatedAt && Number.isFinite(Date.parse(candidate.updatedAt))
    ? Math.max(0, (nowMs - Date.parse(candidate.updatedAt))/86400000) : null;
  const recency = age === null ? 0.25 : Math.exp(-age/90);
  const evidence = candidate.classification === 'decision' ? 1.0 : candidate.classification === 'test' ? 0.8
    : candidate.classification === 'task_evidence' ? 0.9 : candidate.classification === 'receipt' ? 0.7 : 0.25;
  return Math.round(100*(1 + 3.6*coverage + 1.5*basis + 0.6*recency + evidence
    + Math.min(1,Math.max(-1,Number(candidate.priority) || 0))));
}
function chooseKnapsack(rows, capacity) {
  // Exact bounded 0/1 knapsack; stable ordering and tie-breaks. Units = 16
  // estimated tokens; floor capacity for strict non-overrun on final check.
  const UNIT = 16;
  const cap = Math.floor(capacity/UNIT);
  if (cap < 1 || !rows.length) return [];
  const states = Array.from({length:cap+1},()=>({score:-Infinity,picks:[]}));
  states[0] = {score:0,picks:[]};
  for (let i=0;i<rows.length;i++) {
    const weight = Math.ceil(rows[i].cost/UNIT);
    if (weight>cap) continue;
    for (let k=cap;k>=weight;k--) {
      const prior = states[k-weight];
      if (!Number.isFinite(prior.score)) continue;
      const val = prior.score + rows[i].score;
      if (val > states[k].score) states[k] = {score:val,picks:[...prior.picks,i]};
    }
```

_First 80 of 217 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
