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
  }
  let best = states[0];
  for (const v of states) if (v.score>best.score) best=v;
  return best.picks;
}
function stripSource(candidate) {
  return {ref:candidate.ref,revision:candidate.revision,ranges:candidate.ranges ?? [],
    classification:candidate.classification,layer:candidate.layer,trust:candidate.trust,
    sensitivity:candidate.sensitivity,sha256:candidate.sha256,estimatedTokens:candidate.cost,
    score:candidate.score};
}
function normaliseRequest(req) {
  if (!req || typeof req !== 'object' || Array.isArray(req)) throw fail('DCB_REQUEST','Request object required');
  const {purpose='dev_task',profile='handoff',taskRef,taskText='',audience,scope,disclosure=null,
    maxInputTokens=1800,reservedForUserPrompt=400,reservedForOutput=500,sourceHead=null,
    policyVersion='v1',now='2026-01-01T00:00:00.000Z'} = req;
  if (!['dev_task','personal_continuum'].includes(purpose) || !DCB_PROFILES.includes(profile)) throw fail('DCB_REQUEST','Unknown purpose/profile');
  if (typeof taskRef!=='string'|| !taskRef ||taskRef.length>128 ||typeof taskText!=='string'||taskText.length>10000)
    throw fail('DCB_REQUEST','Bounded task identity/text required');
  // Backward-compatible v2 generalization: a non-project activity must
  // supply an exact activityRef. Never invent a fake project identifier.
  const projectScoped=typeof audience?.projectRef==='string'&&audience.projectRef.length>0;
  const activityScoped=typeof audience?.activityRef==='string'&&audience.activityRef.length>0;
  if (!audience || typeof audience.principalRef!=='string'||!audience.principalRef
      || typeof audience.destinationProvider!=='string'||!audience.destinationProvider
      || (!projectScoped&&!activityScoped)
      || (audience.projectRef!=null&&!projectScoped)
      || (audience.activityRef!=null&&!activityScoped)
      || [audience.principalRef,audience.destinationProvider,
        ...(projectScoped?[audience.projectRef]:[]),
        ...(activityScoped?[audience.activityRef]:[])].some(v=>v.length>128))
    throw fail('DCB_AUDIENCE','Exact principal/provider and project or activity required');
  if (!scope || !Array.isArray(scope.allowedRefs) || !Array.isArray(scope.allowedPrefixes)
      || !Object.hasOwn(SENS,scope.maxSensitivity)) throw fail('DCB_SCOPE','Explicit source scope required');
  if (![maxInputTokens,reservedForUserPrompt,reservedForOutput].every(Number.isInteger)
      || maxInputTokens<256 ||maxInputTokens>MAX_TOKENS
      || reservedForUserPrompt<0 ||reservedForOutput<0 ||maxInputTokens-reservedForUserPrompt-reservedForOutput<80)
    throw fail('DCB_BUDGET','Invalid context window/reserves');
  if (!Number.isFinite(Date.parse(now))) throw fail('DCB_REQUEST','A pinned observation timestamp is required');
  if (sourceHead!==null && (typeof sourceHead!=='string'||sourceHead.length>128)) throw fail('DCB_REQUEST','Invalid pinned HEAD');
  if (typeof policyVersion!=='string'|| !policyVersion || policyVersion.length>50) throw fail('DCB_REQUEST','Policy version required');
  const resolved={purpose,profile,taskRef,taskText,audience,scope,disclosure,maxInputTokens,
    reservedForUserPrompt,reservedForOutput,sourceHead,policyVersion,now};
  if ([...scope.allowedRefs,...scope.allowedPrefixes].some(v => !pathRef(v))) throw fail('DCB_SCOPE','Unsafe source scope');
  return resolved;
}

export function createDCBComposer({resolveSources,readSource}={}) {
  if (typeof resolveSources!=='function'||typeof readSource!=='function')
    throw fail('DCB_DEPENDENCY','Canonical source resolver and pinned reader adapters required');
  async function compose(input) {
    const req = normaliseRequest(input);
    const candidates = await resolveSources({taskRef:req.taskRef,purpose:req.purpose,
      profile:req.profile,projectRef:req.audience.projectRef,sourceHead:req.sourceHead});
    if (!Array.isArray(candidates)||candidates.length>MAX_SOURCES)
      throw fail('DCB_SOURCES','Canonical resolver must return a bounded array');
    const omissions=[]; const eligible=[]; const seen=new Set();
    const order=candidates.map(x=>({...x})).sort((a,b)=>String(a.ref).localeCompare(String(b.ref)));
    const taskTerms=tokens(`${req.taskRef} ${req.taskText}`);
    for (const c of order) {
      const omit=reason=>{omissions.push({ref:String(c.ref??'invalid').slice(0,120),reason});};
      if (!pathRef(c.ref)||typeof c.revision!=='string'||!c.revision||
          typeof c.sha256!=='string'||!/^[a-f0-9]{64}$/.test(c.sha256)||
          !DCB_LAYERS.includes(c.layer)||!CLASS.has(c.classification)||
          !Object.hasOwn(TRUST,c.trust)||!Object.hasOwn(SENS,c.sensitivity)||
          (c.ranges!==undefined && (!Array.isArray(c.ranges)||c.ranges.length>30||
            c.ranges.some(r=>typeof r!=='string'|| !/^L[1-9]\d{0,6}-L[1-9]\d{0,6}$/.test(r))))) {omit('invalid_source_metadata');continue;}
      const denial=verifiedScope(c,req);if (denial) {omit(denial);continue;}
      if (req.sourceHead && c.head && c.head!==req.sourceHead) {omit('stale_head');continue;}
      const identity=`${c.ref}\0${c.revision}\0${JSON.stringify(c.ranges??[])}`;
      if (seen.has(identity)) {omit('duplicate_ref');continue;}
      seen.add(identity);
      let source;
      try {source=await readSource({ref:c.ref,revision:c.revision,ranges:c.ranges??[],head:req.sourceHead});}
      catch {omit('source_unavailable');continue;}
      if (!source ||typeof source.text!=='string'||!source.text||
          Buffer.byteLength(source.text,'utf8')>MAX_SOURCE_BYTES ||
          source.revision!==c.revision ||sha(source.text)!==c.sha256 ||
          (source.sha256 && source.sha256!==c.sha256)) {omit('hash_or_revision_mismatch');continue;}
      const text=source.text;
      const encodedHeader = JSON.stringify({ref:c.ref,revision:c.revision,layer:c.layer,trust:c.trust,sha256:c.sha256});
      const cost=countTokens(`SOURCE ${encodedHeader}\nUNTRUSTED DATA ${JSON.stringify(text)}`)+2;
      const score=scoreCandidate(c,text,taskTerms,Date.parse(req.now));
      eligible.push({...c,cost,score,text});
    }
    // Exact duplicate content cannot appear twice under different refs.
    const seenContent=new Set(), unique=[];
    for (const c of eligible.sort((a,b)=>b.score-a.score||a.ref.localeCompare(b.ref))) {
      const hashKey=`${c.sha256}\0${c.layer}`;
      if (seenContent.has(hashKey)) {omissions.push({ref:c.ref,reason:'duplicate_content'});continue;}
      seenContent.add(hashKey);unique.push(c);
    }
    unique.sort((a,b)=>a.ref.localeCompare(b.ref));
    const overhead=80;
    const capacity=req.maxInputTokens-req.reservedForUserPrompt-req.reservedForOutput-overhead;
    const chosen=new Set(chooseKnapsack(unique,capacity));
    let used=0;
    const included=[];
    for (let i=0;i<unique.length;i++) {
      const c=unique[i];
      if (chosen.has(i)) {used+=c.cost;included.push(c);}
      else omissions.push({ref:c.ref,reason:'over_budget_or_lower_rank'});
    }
    if (used>capacity) throw fail('DCB_INTERNAL','Budget exceeded');
    const sources=included.map(stripSource);
    omissions.sort((a,b)=>a.ref.localeCompare(b.ref)||a.reason.localeCompare(b.reason));
    const sourceFingerprint=digest(sources.map(s=>({ref:s.ref,revision:s.revision,sha256:s.sha256})));
    // Exclude observation timestamp to preserve deterministic hashes for the same task,
    // source HEAD, audience, disclosure and policy. Still include the scope itself.
    const base={schema:DCB_SCHEMA,profile:req.profile,purpose:req.purpose,taskRef:req.taskRef,
      audience:{...req.audience},sourceHead:req.sourceHead,policyVersion:req.policyVersion,
      scopeDigest:digest(req.scope),disclosureDigest:digest(req.disclosure),
      sources,omissions,budget:{maxInputTokens:req.maxInputTokens,
        reservedForUserPrompt:req.reservedForUserPrompt,reservedForOutput:req.reservedForOutput,
        overhead,estimatedIncludedTokens:used,availableForSources:capacity,estimator:'utf8-bytes/3'},sourceFingerprint};
    const manifestDigest=digest(base);
    const manifest=Object.freeze({...base,id:`dcb-${manifestDigest.slice(0,24)}`,manifestDigest,
      destinationVerified:req.audience.destinationModelVerified===true});
    // Keep data visibly quoted as untrusted source material; do not merge with the
    // owner's instruction channel or attach the raw user task automatically.
    const fragment=included.map(c => `SOURCE ${JSON.stringify({ref:c.ref,revision:c.revision,layer:c.layer,trust:c.trust,sha256:c.sha256})}\n`+
      `UNTRUSTED DATA ${JSON.stringify(c.text)}`).join('\n\n');
    if (countTokens(fragment)>capacity) throw fail('DCB_INTERNAL','Rendered fragment exceeds budget');
    return {manifest,fragment,preview:{included:sources,omissions,estimatedTokens:used},
      transferable:req.audience.destinationModelVerified===true &&
        (included.every(c=>verifiedScope(c,req)===null))};
  }
  async function verify(bundle, input) {
    if (!bundle?.manifest ||typeof bundle.manifest.manifestDigest!=='string') throw fail('DCB_VERIFY','Bundle manifest required');
    const reconstructed=await compose(input);
    return {valid:reconstructed.manifest.manifestDigest===bundle.manifest.manifestDigest,
      expected:bundle.manifest.manifestDigest,current:reconstructed.manifest.manifestDigest,
      unchangedSources:reconstructed.manifest.sourceFingerprint===bundle.manifest.sourceFingerprint};
  }
  return {schema:DCB_SCHEMA,compose,verify};
}
