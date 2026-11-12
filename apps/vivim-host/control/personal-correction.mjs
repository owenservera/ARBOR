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
