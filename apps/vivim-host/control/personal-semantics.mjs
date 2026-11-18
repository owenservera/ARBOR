// Lane B: pure, inert personal phrase resolution. No filesystem, AI, clock, grants or effects.
// The caller MUST pass the existing Host NLCL result first. A personal rule cannot
// supersede a canonical interpretation, refusal, incomplete command or clarification.
import { NCLL_VERSION } from '../../mobile-relay/nlcl/frames.mjs';
import { VEC_COMPILE_SCHEMA } from '../../mobile-relay/vec/compiler.mjs';
import {sha256Hex} from '../../mobile-relay/generative-ui/portable-digest.mjs';
import {validWikiRecipe} from './wiki-read-program.mjs';
export const PERSONAL_RULE_SCHEMA = 'vivim.personal-semantic-rule/1';
export const PERSONAL_RESOLUTION_SCHEMA = 'vivim.personal-resolution/1';
const SCOPE_KEYS = ['workspaceId', 'activity', 'providerId', 'surface'];
const STATES = ['observed', 'proposed', 'accepted', 'suspended', 'revoked'];
const record = v => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null) &&
  Object.values(Object.getOwnPropertyDescriptors(v)).every(d => Object.hasOwn(d, 'value'));
const keysOnly = (v, keys) => record(v) && Object.keys(v).every(k => keys.includes(k));
const phrase = value => typeof value === 'string' && value.length >= 2 && value.length <= 200 &&
  value === value.trim() && !/[\u0000-\u001f\u007f]/.test(value);
const utterance = value => typeof value === 'string' && value.trim().length >= 2 &&
  value.length <= 1000 && !/[\u0000-\u001f\u007f]/.test(value);
const normalize = value => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
export const TEMPLATE_SCHEMA='vivim.personal-command-template/1';
const slug=value=>typeof value==='string'&&/^[a-z][a-z0-9-]{0,62}$/.test(value)&&!['__proto__','prototype','constructor'].includes(value);
export const templateAlias=value=>typeof value==='string'&&/^[a-z][a-z0-9]{2,31}$/.test(value);
const canonical=v=>Array.isArray(v)?v.map(canonical):record(v)?
  Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
// Only this audited additive migration is compatible. Any other catalog change
// still requires new owner review; no stored rule or receipt is rewritten.
const CATALOG_13_DIGEST='422f499257f8828ffe22779a896008549966fdcc89bdcdaa2dc89803de7ae967';
export function compatibleRuleCatalog(rule,catalog){
  if(rule.catalogVersion===catalog.version)return true;
  if(rule.catalogVersion!==13||catalog.version!==14||rule.actionId==='program.read_wiki')return false;
  const predecessor={...catalog,version:13,actions:catalog.actions.filter(a=>a.id!=='program.read_wiki')};
  return predecessor.actions.length===36&&catalog.actions.length===37&&sha256Hex(JSON.stringify(canonical(predecessor)))===CATALOG_13_DIGEST;
}
export function templateDependencies(catalog){
  const action=catalog?.actions?.find(a=>a.id==='wiki.page.create');
  if(!action||action.risk!=='R1'||!['source_wired','verified'].includes(action.readiness)||
    !action.language||!record(action.args)||Object.keys(action.args).join(',')!=='page'||
    action.args.page.type!=='string')return null;
  return {catalogVersion:catalog.version,contract:JSON.stringify(canonical(action)),
    compiler:NCLL_VERSION,vec:VEC_COMPILE_SCHEMA,policy:'desktop-owner/wiki-create/fresh-approval/1'};
}
function validTemplate(rule){
  const t=rule.template;
  return keysOnly(t,['schema','receiptId','receiptDigest','sourceSemanticDigest','sourceEntryId','slot','dependencies','privacy'])&&
    t.schema===TEMPLATE_SCHEMA&&rule.actionId==='wiki.page.create'&&templateAlias(rule.phrase)&&
    rule.scope.surface==='desktop'&&rule.source==='explicit-owner'&&
    keysOnly(rule.args,['page'])&&slug(rule.args.page)&&
    /^ctl-[a-f0-9]{16}$/.test(t.receiptId)&&/^[a-f0-9]{64}$/.test(t.receiptDigest)&&
    /^[a-f0-9]{64}$/.test(t.sourceSemanticDigest)&&/^[a-f0-9-]{36}$/.test(t.sourceEntryId)&&
    t.privacy==='pc-only'&&keysOnly(t.slot,['name','type','provenance'])&&
    t.slot.name==='page'&&t.slot.type==='wiki-page-slug'&&t.slot.provenance==='owner-selected-receipt-argument'&&
    keysOnly(t.dependencies,['catalogVersion','contract','compiler','vec','policy'])&&
    t.dependencies.catalogVersion===rule.catalogVersion&&
    ['contract','compiler','vec','policy'].every(k=>typeof t.dependencies[k]==='string'&&t.dependencies[k].length>0&&t.dependencies[k].length<=20000);
}
export function currentTemplate(rule,catalog){
  const current=templateDependencies(catalog);
  return !!(rule?.template&&current&&compatibleRuleCatalog(rule,catalog)&&JSON.stringify(canonical({...rule.template.dependencies,catalogVersion:catalog.version}))===JSON.stringify(canonical(current)));
}
// One deliberately narrow named invocation, not another natural-language parser.
// Canonical NLCL/refusals always take precedence.
export function bindPersonalRule(rule,text,catalog){
  if(!rule.template)return normalize(rule.phrase)===normalize(text)?{...rule.args}:null;
  const parts=String(text).trim().split(/\s+/);
  if(parts.length!==2||normalize(parts[0])!==normalize(rule.phrase)||!slug(parts[1]))return null;
  if(!currentTemplate(rule,catalog))return null;
  const spec=catalog.actions.find(a=>a.id===rule.actionId).args.page;
  return parts[1].length>=spec.min&&parts[1].length<=spec.max?{page:parts[1]}:null;
}
const decision = (outcome, extra = {}) => ({ schema: PERSONAL_RESOLUTION_SCHEMA, outcome,
  executionAuthorized: false, ...extra });

/** The private learning state must never be serialized as a Host grant. */
export function validatePersonalRule(rule, catalog) {
  if (!keysOnly(rule, ['schema', 'id', 'revision', 'phrase', 'actionId', 'args', 'scope',
    'state', 'source', 'catalogVersion','template','readProgram']) || rule.schema !== PERSONAL_RULE_SCHEMA ||
    typeof rule.id !== 'string' || !/^rule:[a-z0-9][a-z0-9._-]{0,79}$/.test(rule.id) ||
    !Number.isSafeInteger(rule.revision) || rule.revision < 1 ||
    !phrase(rule.phrase) || typeof rule.actionId !== 'string' ||
    !STATES.includes(rule.state) || !['explicit-owner', 'system-observed'].includes(rule.source) ||
    (rule.state === 'accepted' && rule.source !== 'explicit-owner') ||
    !Number.isSafeInteger(rule.catalogVersion) || rule.catalogVersion < 1 ||
    !keysOnly(rule.scope, SCOPE_KEYS) ||
    Object.entries(rule.scope).some(([key, value]) => typeof value !== 'string' ||
      value.length < 1 || value.length > 128 || (key === 'surface' &&
      !['text', 'desktop', 'mobile', 'visual'].includes(value))) ||
    !record(rule.args) || !record(catalog) || !Array.isArray(catalog.actions))
    return { ok: false, reason: 'INVALID_RULE' };
  // Stale templates remain readable/revocable after catalog changes; only
  // matching current dependencies can activate them.
  if(Object.hasOwn(rule,'readProgram')){
    // Stale recipes remain readable/revocable; current dependency validation is an invocation check.
    const r=rule.readProgram;
    return !rule.template&&rule.actionId==='program.read_wiki'&&rule.scope.surface==='desktop'&&rule.source==='explicit-owner'&&
      keysOnly(rule.args,['commands'])&&typeof rule.args.commands==='string'&&rule.args.commands.length<=950&&
      r?.schema==='vivim.wiki-read-recipe/1'&&Array.isArray(r.steps)&&r.steps.length>=2&&r.steps.length<=8&&Array.isArray(r.dependencies)
      ?{ok:true}:{ok:false,reason:'INVALID_READ_RECIPE'};
  }
  if(Object.hasOwn(rule,'template'))return validTemplate(rule)?{ok:true}:{ok:false,reason:'INVALID_TEMPLATE'};
  const action = catalog.actions.find(a => a.id === rule.actionId);
  if (!action || !action.language || !record(action.args) ||
    Object.keys(rule.args).length !== Object.keys(action.args).length ||
    Object.keys(rule.args).some(k => !Object.hasOwn(action.args, k)))
    return { ok: false, reason: 'UNKNOWN_OR_INELIGIBLE_ACTION' };
  for (const [key, spec] of Object.entries(action.args)) {
    const v = rule.args[key];
    if (typeof v !== 'string' || !v.length || v !== v.trim() ||
      (spec.type === 'enum' && !spec.values.includes(v)) ||
      (spec.type === 'string' && (v.length < spec.min || v.length > spec.max)) ||
      !['enum', 'string'].includes(spec.type)) return { ok: false, reason: 'INVALID_ARGUMENTS' };
  }
  return { ok: true };
}

function scoped(rule, scope) {
  return Object.entries(rule.scope).every(([k, v]) => scope[k] === v);
}
function signature(rule,args) {
  return JSON.stringify([rule.actionId,Object.fromEntries(Object.entries(args).sort(([a],[b])=>a.localeCompare(b)))]);
}

/**
 * Only activates on the *existing* NLCL's interpretation_required result.
 * Callers must not bypass the existing safety grammar or the Host planner.
 * No phrase learning or model inference occurs here; accepted rules are inputs.
 */
export function resolvePersonalSemantics({ text, baseline, rules, catalog, scope = {} } = {}) {
  // A one-character unknown utterance is simply outside the personal phrase grammar.
  if (typeof text === 'string' && text.trim().length < 2)
    return decision('no_match', { reason: 'TOO_SHORT' });
  if (!utterance(text) || !record(baseline) || !record(catalog) ||
    !Number.isSafeInteger(catalog.version) || !Array.isArray(catalog.actions) ||
    !Array.isArray(rules) || rules.length > 500 ||
    !keysOnly(scope, SCOPE_KEYS) ||
    Object.entries(scope).some(([key, value]) => typeof value !== 'string' ||
      value.length < 1 || value.length > 128 || (key === 'surface' &&
      !['text', 'desktop', 'mobile', 'visual'].includes(value))))
    return decision('refused', { reason: 'INVALID_INPUT' });
  if (baseline.outcome !== 'interpretation_required')
    return decision('no_match', { reason: 'BASELINE_PRIORITY' });
  const seen = new Set();
  for (const rule of rules) {
    const checked = validatePersonalRule(rule, catalog);
    if (!checked.ok || seen.has(rule.id)) return decision('refused', { reason: checked.reason ?? 'DUPLICATE_RULE_ID' });
    seen.add(rule.id);
  }
  const parts=text.trim().split(/\s+/);
  const matches = rules.filter(rule => rule.state === 'accepted' && scoped(rule,scope)&&
    (rule.template?normalize(parts[0])===normalize(rule.phrase):normalize(rule.phrase)===normalize(text)));
  if (!matches.length) return decision('no_match', { reason: 'NO_ACCEPTED_MATCH' });
  if (matches.some(rule=>rule.template&&!currentTemplate(rule,catalog)))return decision('refused',{reason:'STALE_TEMPLATE_DEPENDENCY'});
  if(matches.some(rule=>rule.readProgram&&!validWikiRecipe(rule.readProgram,rule.args.commands,catalog)))return decision('refused',{reason:'STALE_READ_RECIPE'});
  if (matches.some(rule => !compatibleRuleCatalog(rule,catalog)))
    return decision('refused', { reason: 'STALE_CATALOG_RULE' });
  const bound=matches.map(rule=>({rule,args:bindPersonalRule(rule,text,catalog)}));
  if(bound.some(x=>!x.args))return decision('clarification_required',{reason:'TEMPLATE_PARAMETER_REQUIRED',ruleIds:matches.map(r=>r.id).sort()});
  const highest = Math.max(...bound.map(x=>Object.keys(x.rule.scope).length));
  const mostSpecific=bound.filter(x=>Object.keys(x.rule.scope).length===highest);
  const unique=new Set(mostSpecific.map(x=>signature(x.rule,x.args)));
  if (unique.size > 1) return decision('clarification_required', {
    reason: 'CONFLICTING_PERSONAL_RULES',
    ruleIds: mostSpecific.map(x=>x.rule.id).sort(),
  });
  // The tie has the same meaning; choose a stable provenance record.
  const {rule,args}=[...mostSpecific].sort((a,b)=>a.rule.id.localeCompare(b.rule.id))[0];
  return decision('candidate', {
    candidate: { actionId: rule.actionId, args },
    provenance: { method: 'accepted-personal-rule', ruleId: rule.id,
      ruleRevision: rule.revision, catalogRevision: catalog.version,
      semanticScope: { ...scope },...(rule.template?{reuse:'parameterized-template',templateSchema:TEMPLATE_SCHEMA,invocation:text}:{} ) },
  });
}
