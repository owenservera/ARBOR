# File: studio/src/studio/adapter-improvement-pipeline.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/adapter-improvement-pipeline.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13683 B |
| Lines | 208 |
| Hash | 51e824be1a73 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PIPELINE_SCHEMA | const | 6 | yes | export const PIPELINE_SCHEMA = &#39;aion.adapter-improvement-proposal/1&#39;; |
| READ | const | 7 | no | const READ = [&#39;user-turn&#39;,&#39;assistant-turn&#39;,&#39;thread-route&#39;,&#39;citation&#39;,&#39;artifact&#39;,&#39;task-progress&#39;,&#39;stream-component&#39;]; |
| hash | function | 8 | no | const hash = value =&gt; createHash(&#39;sha256&#39;).update(JSON.stringify(value)).digest(&#39;hex&#39;); |
| sourceRefs | function | 9 | no | const sourceRefs = receipts =&gt; [...new Map(receipts.map(r =&gt; [r.evidenceRef, { captureId:r.captureId,sessionId:r.sessionId,sequence:r.sequence,rawDigest:r.rawDigest, domDigest:r.domDigest,evidenceRef… |
| err | function | 14 | no | const err = code =&gt; { throw Object.assign(new Error(code),{code}); }; |
| deepFreeze | function | 15 | no | function deepFreeze(value) { if(value &amp;&amp; typeof value===&#39;object&#39; &amp;&amp; !Object.isFrozen(value)){Object.freeze(value);for(const x of Object.values(value))deepFreeze(x);} return value; } |
| id | function | 16 | no | const id = e =&gt; e.source.captureId; |
| sessions | function | 17 | no | const sessions = events =&gt; [...new Set(events.map(e=&gt;e.source.sessionId))]; |
| assertDistinct | function | 18 | no | function assertDistinct(training, heldout, scope) { |
| all | const | 20 | no | const all = [...training,...heldout]; |
| trainIds | const | 22 | no | const trainIds=new Set(training.map(id)), trainSessions=new Set(sessions(training)); |
| trainDigests | const | 23 | no | const trainDigests=new Set(training.map(e=&gt;e.source.rawDigest)); |
| check | function | 26 | no | const check = records =&gt; { |
| bySession | const | 27 | no | const bySession=new Map(), byDigest=new Map(); |
| selected | function | 38 | no | function selected(candidate, feature) {return candidate?.features?.[feature]?.selected?.candidate??null;} |
| readRules | function | 41 | no | function readRules(adapter, feature) { |
| rule | const | 42 | no | const rule=selected(adapter,feature); |
| legacy | const | 44 | no | const legacy=feature===&#39;assistant-turn&#39;?adapter?.assistant?.containerSelectors |
| qualifiedReadFeatures | function | 50 | no | function qualifiedReadFeatures(candidate, probes, receipts, testOnly=false) { |
| slot | const | 52 | no | const slot=candidate?.features?.[feature],rule=slot?.selected; |
| byCapture | const | 54 | no | const byCapture=new Map(); |
| p | const | 56 | no | const p=probes[i],r=receipts[i]; |
| entry | const | 58 | no | const entry=byCapture.get(p.captureId)??{present:new Set(),absent:new Set()}; |
| records | const | 63 | no | const records=[...byCapture.values()]; |
| quality | function | 69 | no | function quality(candidate, probes, receipts) { |
| byCapture | const | 70 | no | const byCapture=new Map(); |
| p | const | 72 | no | const p=probes[i],r=receipts[i]; |
| key | const | 74 | no | const key=JSON.stringify([p.captureId,p.feature]); |
| result | const | 78 | no | const result={total:0,TP:0,FP:0,FN:0,TN:0,unknown:0,identityRoleErrors:0,coverage:0, |
| sq | variable | 80 | no | let sq=0, predictions=0; |
| rules | const | 82 | no | const rules=readRules(candidate,rec.feature); |
| valid | const | 83 | no | const valid=rec.observations.filter(({probe,receipt})=&gt;probe.outcome!==&#39;unknown&#39; &amp;&amp; receipt.identityVerified); |
| present | const | 85 | no | const present=valid.filter(x=&gt;x.probe.outcome===&#39;present&#39;); |
| truths | const | 87 | no | const truths=new Set(present.map(x=&gt;x.probe.candidate)); |
| expected | const | 89 | no | const expected=[...truths][0]??null; |
| prediction | const | 90 | no | const prediction=rules.length&gt;0, matched=!!expected&amp;&amp;rules.includes(expected); |
| probability | const | 96 | no | const probability=candidate?.features?.[rec.feature]?.selected?.confidence; |
| invalidDualRole | function | 107 | no | const invalidDualRole = candidate =&gt; { |
| a | const | 108 | no | const a=selected(candidate,&#39;assistant-turn&#39;),u=selected(candidate,&#39;user-turn&#39;); |
| diff | function | 111 | no | const diff = (oldv,newv) =&gt; ({newReadSuccess:newv.TP,baselineReadSuccess:oldv.TP, gain:newv.TP-oldv.TP,falseMatchDelta:newv.FP-oldv.FP,coverage:newv.coverage, brier:newv.calibration.brier}); |
| createAdapterImprovementPipeline | function | 114 | yes | export function createAdapterImprovementPipeline({synthesize,shadowEvaluate,assertIndependentHoldout, verifyCapture,store}={}) { |
| observed | const | 118 | no | const observed=new Map(); // volatile dedupe cache only, not site registry or durable store. |
| minted | const | 119 | no | const minted=new WeakSet(); // only server-produced, immutable proposals may be promoted |
| propose | function | 120 | no | async function propose({scope,training,heldout,seed=null,testOnly=false,trigger=&#39;new-evidence&#39;}={}) { |
| key | const | 121 | no | const key=scopeKey(scope); |
| a | const | 124 | no | const a=await intakeEvents(training,{verifyCapture}); |
| b | const | 125 | no | const b=await intakeEvents(heldout,{verifyCapture}); |
| sourceClasses | const | 126 | no | const sourceClasses=new Set([...a.receipts,...b.receipts].map(r=&gt;r.evidenceClass)); |
| synthetic | const | 127 | no | const synthetic=sourceClasses.has(&#39;SYNTHETIC_TEST&#39;); |
| active | const | 130 | no | const active=await store.current(key); |
| prior | const | 131 | no | const prior=active?.adapter??null; |
| candidate | const | 132 | no | const candidate=synthesize({siteId:scope.siteId,origin:scope.origin,surface:scope.surface,observations:a.probes,prior}); |
| holdoutIds | const | 133 | no | const holdoutIds=[...new Set(b.probes.map(x=&gt;x.captureId))]; |
| independent | const | 135 | no | const independent=assertIndependentHoldout(candidate,holdoutIds); |
| shadow | const | 136 | no | const shadow=shadowEvaluate(candidate,b.probes); |
| learnedScore | const | 137 | no | const learnedScore=quality(candidate,b.probes,b.receipts); |
| baseline | const | 138 | no | const baseline=quality(prior??seed,b.probes,b.receipts); |
| metrics | const | 139 | no | const metrics=diff(baseline,learnedScore); |
| eligible | const | 140 | no | const eligible=qualifiedReadFeatures(candidate,b.probes,b.receipts,testOnly); |
| drifted | const | 141 | no | const drifted=(candidate.drift??[]).map(d=&gt;({feature:d.feature,reason:d.reason})); |
| digest | const | 142 | no | const digest=hash([key,training.map(e=&gt;[id(e),e.source.rawDigest,e.source.sequence]), heldout.map(e=&gt;[id(e),e.source.rawDigest,e.source.sequence]),active?.version??null, hash(a.probes),hash(b.probes)… |
| noGain | const | 145 | no | const noGain=metrics.gain&lt;=0 &amp;&amp; !drifted.length; |
| regression | const | 146 | no | const regression=learnedScore.TP&lt;baseline.TP\|\|learnedScore.FP&gt;baseline.FP\|\| |
| quarantine | const | 148 | no | const quarantine=invalidDualRole(candidate)\|\|regression\|\| |
| status | const | 150 | no | const status=quarantine?&#39;quarantined&#39;:noGain?&#39;no-improvement&#39;:testOnly?&#39;test-only-preview&#39;:&#39;ready-for-read-only-promotion&#39;; |
| proposal | const | 151 | no | const proposal={schema:PIPELINE_SCHEMA,scope:{...scope},scopeKey:key, |
| promote | function | 164 | no | async function promote(proposal) { |
| key | const | 168 | no | const key=scopeKey(proposal.scope); |
| rollback | function | 175 | no | async function rollback(scope,targetVersion,expectedVersion) { |
| key | const | 176 | no | const key=scopeKey(scope); |
| resolveRead | function | 180 | no | async function resolveRead(scope,seed,{simulation=false,proposal=null}={}) { |
| key | const | 181 | no | const key=scopeKey(scope); |
| active | const | 182 | no | const active=await store.current(key); |
| selectReadRule | function | 193 | no | async function selectReadRule(scope,feature,seedRule,{pageEvidence}={}) { |
| read | const | 195 | no | const read=await resolveRead(scope,null); |
| choice | const | 196 | no | const choice=selected(read.adapter,feature); |
| proof | const | 197 | no | const proof=pageEvidence &amp;&amp; pageEvidence.origin===scope.origin &amp;&amp; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 3 | external |
| ./adapter-evidence-intake.mjs | import | 4 | [studio/src/studio/adapter-evidence-intake.mjs](./adapter-evidence-intake.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/adapter-studio-bridge.mjs](./adapter-studio-bridge.mjs.md) | ./adapter-improvement-pipeline.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// I1 reusable event-driven, read-only intelligence -> adapter proposal lifecycle.
// Inject Agent 14 Round 8/9 and Core's existing transactional VersionedStore bridge.
import { createHash } from 'node:crypto';
import { intakeEvents, scopeKey } from './adapter-evidence-intake.mjs';

export const PIPELINE_SCHEMA = 'aion.adapter-improvement-proposal/1';
const READ = ['user-turn','assistant-turn','thread-route','citation','artifact','task-progress','stream-component'];
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sourceRefs = receipts => [...new Map(receipts.map(r => [r.evidenceRef, {
  captureId:r.captureId,sessionId:r.sessionId,sequence:r.sequence,rawDigest:r.rawDigest,
  domDigest:r.domDigest,evidenceRef:r.evidenceRef,carrier:r.carrier,
  evidenceClass:r.evidenceClass,accountBinding:r.accountBinding,sourceProducer:r.sourceProducer,
}])).values()];
const err = code => { throw Object.assign(new Error(code),{code}); };
function deepFreeze(value) { if(value && typeof value==='object' && !Object.isFrozen(value)){Object.freeze(value);for(const x of Object.values(value))deepFreeze(x);} return value; }
const id = e => e.source.captureId;
const sessions = events => [...new Set(events.map(e=>e.source.sessionId))];
function assertDistinct(training, heldout, scope) {
  if(training.length===0||heldout.length===0) err('TRAIN_OR_HOLDOUT_MISSING');
  const all = [...training,...heldout];
  for(const e of all) if(scopeKey(e.scope)!==scopeKey(scope)) err('SCOPE_CROSSED');
  const trainIds=new Set(training.map(id)), trainSessions=new Set(sessions(training));
  const trainDigests=new Set(training.map(e=>e.source.rawDigest));
  if(heldout.some(e=>trainIds.has(id(e))||trainSessions.has(e.source.sessionId)||trainDigests.has(e.source.rawDigest))) err('HOLDOUT_NOT_INDEPENDENT');
  // Multiple captures in one session are not genuinely independent training votes.
  const check = records => {
    const bySession=new Map(), byDigest=new Map();
    for(const e of records){
      if(bySession.has(e.source.sessionId) && bySession.get(e.source.sessionId)!==e.source.captureId) err('SESSION_CAPTURE_ALIAS');
      bySession.set(e.source.sessionId,e.source.captureId);
      if(byDigest.has(e.source.rawDigest) && byDigest.get(e.source.rawDigest)!==e.source.captureId) err('DUPLICATE_SOURCE_RELABELED');
      byDigest.set(e.source.rawDigest,e.source.captureId);
    }
  };
  check(training);check(heldout);
  if(new Set(training.map(id)).size<3 || new Set(heldout.map(id)).size<2) err('INSUFFICIENT_INDEPENDENT_SESSIONS');
}
function selected(candidate, feature) {return candidate?.features?.[feature]?.selected?.candidate??null;}
// Compare against actual provider seed read rules, not an empty invented baseline.
// Seed rules are score-only and can never become learned or browser authority.
function readRules(adapter, feature) {
  const rule=selected(adapter,feature);
  if(rule)return [rule];
  const legacy=feature==='assistant-turn'?adapter?.assistant?.containerSelectors
    :feature==='user-turn'?adapter?.userTurn?.selectors
    :feature==='thread-route'?(adapter?.threadRoute?.pattern?[adapter.threadRoute.pattern]:null)
    :feature==='stream-component'?adapter?.streamHints?.urlPatterns:null;
  return Array.isArray(legacy)?legacy.filter(x=>typeof x==='string'&&x.length>0):[];
}
function qualifiedReadFeatures(candidate, probes, receipts, testOnly=false) {
  return READ.filter(feature=>{
    const slot=candidate?.features?.[feature],rule=slot?.selected;
    if(!rule||slot.inherited===true||(!testOnly&&rule.status!=='shadow-ready'))return false;
    const byCapture=new Map();
    for(let i=0;i<probes.length;i++){
      const p=probes[i],r=receipts[i];
      if(p.feature!==feature||r?.identityVerified!==true)continue;
      const entry=byCapture.get(p.captureId)??{present:new Set(),absent:new Set()};
      byCapture.set(p.captureId,entry);
      if(p.outcome==='present')entry.present.add(p.candidate);
      else if(p.outcome==='absent')entry.absent.add(p.candidate);
    }
    const records=[...byCapture.values()];
    return records.filter(v=>v.present.size===1&&v.present.has(rule.candidate)&&!v.absent.has(rule.candidate)).length>=2
      &&!records.some(v=>v.absent.has(rule.candidate)||v.present.size>1||
        (v.present.size===1&&!v.present.has(rule.candidate)));
  });
}
function quality(candidate, probes, receipts) {
  const byCapture=new Map();
  for(let i=0;i<probes.length;i++) {
    const p=probes[i],r=receipts[i];
    if(!READ.includes(p.feature)) continue;
    const key=JSON.stringify([p.captureId,p.feature]);
    if(!byCapture.has(key)) byCapture.set(key,{feature:p.feature,captureId:p.captureId,observations:[]});
    byCapture.get(key).observations.push({probe:p,receipt:r});
  }
  const result={total:0,TP:0,FP:0,FN:0,TN:0,unknown:0,identityRoleErrors:0,coverage:0,
    observed:[],calibration:{bins:[],brier:null}};
  let sq=0, predictions=0;
```

_First 80 of 209 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
