# File: apps/vivim-host/control/personal-correction.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/personal-correction.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4691 B |
| Lines | 78 |
| Hash | e33c05950394 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CORRECTION_SCHEMA | const | 5 | yes | export const CORRECTION_SCHEMA = &#39;vivim.semantic-correction/1&#39;; |
| SHADOW_SCHEMA | const | 6 | yes | export const SHADOW_SCHEMA = &#39;vivim.semantic-shadow-report/1&#39;; |
| canonical | function | 7 | no | const canonical = v =&gt; Array.isArray(v) ? v.map(canonical) : v &amp;&amp; typeof v === &#39;object&#39; |
| digest | function | 10 | no | const digest = v =&gt; createHash(&#39;sha256&#39;).update(JSON.stringify(canonical(v))).digest(&#39;hex&#39;); |
| own | function | 11 | no | const own = v =&gt; v !== null &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v) &amp;&amp; |
| result | function | 14 | no | const result = (outcome, extra={}) =&gt; ({schema:CORRECTION_SCHEMA,outcome, executionAuthorized:false,...extra}); |
| deriveSemanticCorrection | function | 21 | yes | export function deriveSemanticCorrection({phrase, prior, corrected, scope={}, catalog}={}) { |
| claim | const | 25 | no | const claim = {phrase,actionId:corrected.actionId,args:corrected.args,scope, |
| rule | const | 27 | no | const rule = {schema:PERSONAL_RULE_SCHEMA,id:&#39;rule:correction-&#39;+digest(claim).slice(0,20), |
| valid | const | 30 | no | const valid = validatePersonalRule(rule,catalog); |
| changes | const | 34 | no | const changes = []; |
| fromArgs | const | 37 | no | const fromArgs = prior?.args ?? {}; |
| evaluateSemanticShadow | function | 50 | yes | export function evaluateSemanticShadow({rule,catalog,examples=[]}={}) { |
| shadow | const | 54 | no | const shadow={...rule,source:&#39;explicit-owner&#39;,state:&#39;accepted&#39;}; |
| failures | const | 55 | no | const failures=[],counts={positive:0,negative:0,baselineProtected:0}; |
| e | const | 57 | no | const e=examples[i]; |
| seen | const | 63 | no | const seen=resolvePersonalSemantics({text:e.text,baseline:e.baseline, scope:e.scope,catalog,rules:[shadow]}); |
| correct | variable | 65 | no | let correct=seen.outcome===e.expected; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |
| ./personal-semantics.mjs | import | 3 | [apps/vivim-host/control/personal-semantics.mjs](./personal-semantics.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/test/personal-correction.test.mjs](../test/personal-correction.test.mjs.md) | ../control/personal-correction.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Pure Lane B correction proposals and shadow semantic regression. No AI, I/O or effects.
import { createHash } from 'node:crypto';
import { PERSONAL_RULE_SCHEMA, validatePersonalRule, resolvePersonalSemantics } from './personal-semantics.mjs';

export const CORRECTION_SCHEMA = 'vivim.semantic-correction/1';
export const SHADOW_SCHEMA = 'vivim.semantic-shadow-report/1';
const canonical = v => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object'
  ? Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))
      .map(([k,val])=>[k,canonical(val)])) : v;
const digest = v => createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
const own = v => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null) &&
  Object.values(Object.getOwnPropertyDescriptors(v)).every(d=>Object.hasOwn(d,'value'));
const result = (outcome, extra={}) => ({schema:CORRECTION_SCHEMA,outcome,
  executionAuthorized:false,...extra});

/**
 * A correction is a structured explicit owner statement, not an LLM's own guess.
 * Only proposes a rule; durable state and acceptance belong to the Host rule store.
 */
export function deriveSemanticCorrection({phrase, prior, corrected, scope={}, catalog}={}) {
  if (!own(corrected) || typeof corrected.actionId !== 'string' ||
      !own(corrected.args) || !own(scope) || !catalog)
    return result('refused',{reason:'INVALID_CORRECTION'});
  const claim = {phrase,actionId:corrected.actionId,args:corrected.args,scope,
    catalogVersion:catalog.version};
  const rule = {schema:PERSONAL_RULE_SCHEMA,id:'rule:correction-'+digest(claim).slice(0,20),
    revision:1,phrase,actionId:corrected.actionId,args:{...corrected.args},
    scope:{...scope},state:'proposed',source:'explicit-owner',catalogVersion:catalog.version};
  const valid = validatePersonalRule(rule,catalog);
  if (!valid.ok) return result('refused',{reason:valid.reason});
  if (prior !== undefined && (!own(prior) || typeof prior.actionId !== 'string' ||
      !own(prior.args))) return result('refused',{reason:'INVALID_PRIOR'});
  const changes = [];
  if (prior?.actionId !== corrected.actionId)
    changes.push({field:'actionId',from:prior?.actionId??null,to:corrected.actionId});
  const fromArgs = prior?.args ?? {};
  for(const key of new Set([...Object.keys(fromArgs),...Object.keys(corrected.args)])){
    if(fromArgs[key]!==corrected.args[key])
      changes.push({field:'args.'+key,from:fromArgs[key]??null,to:corrected.args[key]??null});
  }
  if (!changes.length) return result('no_change',{reason:'SAME_CANONICAL_MEANING'});
  return result('proposal',{rule,changes,evidence:{
    provenance:'structured-explicit-owner-correction',proposalDigest:digest(rule)}});
}

/** Replays fixed expectations against an inert shadow copy of the proposed mapping.
 * This is a regression gate, not a replacement for owner acceptance or authorization.
 */
export function evaluateSemanticShadow({rule,catalog,examples=[]}={}) {
  if (!validatePersonalRule(rule,catalog).ok || !Array.isArray(examples) ||
      examples.length<1 || examples.length>1000)
    return {schema:SHADOW_SCHEMA,status:'invalid',executionPerformed:false};
  const shadow={...rule,source:'explicit-owner',state:'accepted'};
  const failures=[],counts={positive:0,negative:0,baselineProtected:0};
  for (let i=0;i<examples.length;i++){
    const e=examples[i];
    if (!own(e) || typeof e.text!=='string' || !own(e.baseline) ||
        !own(e.scope) || !['candidate','no_match','clarification_required','refused'].includes(e.expected) ||
        (e.expected==='candidate' && (typeof e.actionId!=='string' || !own(e.args)))) {
      failures.push({index:i,reason:'INVALID_FIXTURE'});continue;
    }
    const seen=resolvePersonalSemantics({text:e.text,baseline:e.baseline,
      scope:e.scope,catalog,rules:[shadow]});
    let correct=seen.outcome===e.expected;
    if(e.expected==='candidate') correct = correct &&
      seen.candidate?.actionId===e.actionId &&
      digest(seen.candidate.args)===digest(e.args);
    if (!correct) failures.push({index:i,reason:'SEMANTIC_MISMATCH',
      expected:e.expected,actual:seen.outcome});
    if(e.baseline.outcome!=='interpretation_required')counts.baselineProtected++;
    else if(e.expected==='candidate')counts.positive++;
    else counts.negative++;
  }
  return {schema:SHADOW_SCHEMA,status:failures.length?'regression':'pass',
    executionPerformed:false,total:examples.length,failures,counts,
    candidateDigest:digest(rule),fixturesDigest:digest(examples)};
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
