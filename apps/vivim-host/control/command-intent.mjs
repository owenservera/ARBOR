// V0.1 typed command intent. Pure interpretation data; never a permission or execution token.
// Browser/phone and desktop share the exact same NLCL world; Host owns effects.
import { interpretControl } from '../../mobile-relay/control-language.mjs';
import { resolvePersonalSemantics } from './personal-semantics.mjs';

export const COMMAND_INTENT_SCHEMA = 'vivim.command-intent/0.1';
const isRecord = v => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const allowedOutcomes = new Set(['candidate', 'clarification_required', 'interpretation_required', 'refused']);
const riskOrder = ['R0', 'R1', 'R2', 'R3'];

function refuse(input, code, message, extra = {}) {
  return { schema: COMMAND_INTENT_SCHEMA, outcome: 'refused',
    refusal: { code, message }, ...extra, provenance: {
      method: 'deterministic-validation', catalogRevision: input.catalogRevision ?? null,
      worldRevision: input.worldRevision ?? null, authority: 'none' } };
}
function canonical(actionId, args) {
  return '/' + actionId + Object.keys(args).sort().map(k => ' ' + k + '=' + JSON.stringify(args[k])).join('');
}
function checkedArgs(action, args) {
  if (!isRecord(args) || Object.keys(args).some(k => !Object.hasOwn(action.args, k))) return null;
  const normalized = {};
  for (const [key, type] of Object.entries(action.args)) {
    const value = args[key];
    if (typeof value !== 'string' || !value || value !== value.trim() ||
      (type.type === 'enum' && !type.values.includes(value)) ||
      (type.type === 'string' && (value.length < type.min || value.length > type.max)))
      return null;
    normalized[key] = value;
  }
  return normalized;
}
function context(input, catalog, world) {
  if (!isRecord(input) || typeof input.text !== 'string' || !input.text.trim() || input.text.length > 1000 ||
      !isRecord(catalog) || !Array.isArray(catalog.actions) || !world)
    return { refusal: 'INVALID_CONTEXT' };
  if (input.catalogRevision !== undefined && input.catalogRevision !== catalog.version)
    return { refusal: 'STALE_CATALOG' };
  if (input.worldRevision !== undefined && input.worldRevision !== world.v)
    return { refusal: 'STALE_WORLD' };
  if (input.audience !== undefined &&
      (typeof input.audience !== 'string' || input.audience.length > 64))
    return { refusal: 'INVALID_AUDIENCE' };
  if (input.scope !== undefined &&
      (typeof input.scope !== 'string' || !['text', 'desktop', 'mobile', 'visual'].includes(input.scope)))
    return { refusal: 'INVALID_SCOPE' };
  return { actions: new Map(catalog.actions.map(a => [a.id, a])) };
}
function provenance(input, catalog, world, method, feedback) {
  return { method, engineVersion: feedback?.nlclVersion ?? null,
    catalogRevision: catalog.version, worldRevision: world.v,
    audience: input.audience ?? 'owner', surface: input.scope ?? 'text',
    confidence: feedback?.confidence ?? null, authority: 'none' };
}
function actionShape(action, args) {
  return { actionId: action.id, args, canonical: canonical(action.id, args),
    risk: action.risk, requiredScopes: Array.isArray(action.requiredScopes) ? [...action.requiredScopes] : [],
    owner: action.owner, readiness: action.readiness };
}

/**
 * Input {text, worldRevision?, catalogRevision?, audience?, scope?}.
 * All outcomes are inert. Model suggestions use validateAiCommandCandidate separately.
 */
export function toCommandIntent(input, { catalog, world, personalRules = [], personalScope = null } = {}) {
  const check = context(input, catalog, world);
  if (check.refusal) return refuse(input ?? {}, check.refusal, 'Invalid or stale command context.');
  // Recompute the NLCL reading. Never accept externally supplied interpretation
  // objects or a model's claim that a rule was already accepted.
  const baseline = interpretControl(input.text, { catalog, world });
  let meaning = baseline;
  let personalProvenance = null;
  if (baseline.outcome === 'interpretation_required') {
    const resolved = resolvePersonalSemantics({ text: input.text, baseline, catalog,
      rules: personalRules, scope: personalScope ?? { surface: input.scope ?? 'text' } });
    if (resolved.outcome === 'candidate') {
      meaning = { ...baseline, outcome: 'candidate', candidate: resolved.candidate };
      personalProvenance = resolved.provenance;
    } else if (resolved.outcome === 'clarification_required') {
      meaning = { ...baseline, outcome: 'clarification_required',
        question: 'Conflicting accepted personal meanings. Please specify the action.',
        choices: [] };
      personalProvenance = { method: 'personal-rule-conflict', ruleIds: resolved.ruleIds };
    } else if (resolved.outcome === 'refused') {
      meaning = { ...baseline, outcome: 'refused',
        refusal: { code: resolved.reason, message: 'Personal rule invalid or stale.' } };
      personalProvenance = { method: 'personal-rule-refusal', reason: resolved.reason };
    }
  }
  const meta = { provenance: {
    ...provenance(input, catalog, world,
      personalProvenance?.method ?? 'deterministic-nlcl', meaning.feedback),
    ...(personalProvenance ? { personalRule: personalProvenance } : {}),
  } };
  if (meaning.outcome === 'refused') {
    return { schema: COMMAND_INTENT_SCHEMA, outcome: 'refused',
      refusal: meaning.refusal ?? { code: 'UNSAFE_SYNTAX', message: 'Command was refused.' }, ...meta };
  }
  if (meaning.outcome === 'clarification_required') {
    const choices = (meaning.choices ?? []).slice(0, 8)
      .filter(id => check.actions.has(id))
      .map(id => { const a = check.actions.get(id); return { actionId: id, title: a.title, risk: a.risk }; });
    return { schema: COMMAND_INTENT_SCHEMA, outcome: 'clarification_required',
      question: meaning.question ?? 'Which one do you mean?', alternatives: choices,
      risk: choices.reduce((r, a) => riskOrder.indexOf(a.risk) > riskOrder.indexOf(r) ? a.risk : r, 'R0'), ...meta };
  }
  if (meaning.outcome === 'incomplete') {
    return { schema: COMMAND_INTENT_SCHEMA, outcome: 'clarification_required',
      question: meaning.question ?? 'Which argument is missing?',
      missing: meaning.missing ?? [],
      alternatives: meaning.candidate?.actionId && check.actions.has(meaning.candidate.actionId)
        ? [{ actionId: meaning.candidate.actionId, title: check.actions.get(meaning.candidate.actionId).title,
            risk: check.actions.get(meaning.candidate.actionId).risk }] : [], ...meta };
  }
  if (meaning.outcome !== 'candidate') {
    return { schema: COMMAND_INTENT_SCHEMA, outcome: 'interpretation_required',
      refusal: { code: 'NO_DETERMINISTIC_MATCH', message: 'A catalog-bounded proposal or clarification is needed.' }, ...meta };
  }
  const action = check.actions.get(meaning.candidate?.actionId);
  if (!action) return refuse(input, 'UNKNOWN_ACTION', 'Action not in the Host catalog.');
  const args = checkedArgs(action, meaning.candidate.args);
  if (!args) return refuse(input, 'INVALID_ARGS', 'Candidate does not satisfy the catalog.');
  return { schema: COMMAND_INTENT_SCHEMA, outcome: 'candidate', ...actionShape(action, args), ...meta };
}

/**
 * Model suggestions are untrusted proposals. The original owner text is mandatory:
 * negated/compound/refused text is never turned into a single runnable candidate.
 * No grants, authorization, source or risk from AI output are accepted.
 */
export function validateAiCommandCandidate(input, { catalog, world, personalRules = [], personalScope = null } = {}) {
  const check = context(input, catalog, world);
  if (check.refusal) return refuse(input ?? {}, check.refusal, 'Invalid or stale command context.');
  const proposal = input.candidate;
  if (!isRecord(proposal) ||
      Object.keys(proposal).some(k => !['actionId', 'args', 'rationale', 'uncertainty'].includes(k)) ||
      (proposal.rationale !== undefined && (typeof proposal.rationale !== 'string' || proposal.rationale.length > 500)) ||
      (proposal.uncertainty !== undefined &&
        (typeof proposal.uncertainty !== 'number' || !Number.isFinite(proposal.uncertainty) ||
         proposal.uncertainty < 0 || proposal.uncertainty > 1)))
    return refuse(input, 'INVALID_AI_PROPOSAL', 'AI proposal shape is invalid.');
  const reading = toCommandIntent(input, { catalog, world, personalRules, personalScope });
  if (!allowedOutcomes.has(reading.outcome) || reading.outcome === 'refused' ||
      reading.outcome === 'clarification_required')
    return refuse(input, 'UNSAFE_OR_UNRESOLVED_TEXT', 'Owner text must be clarified before proposing an action.');
  if (reading.outcome === 'candidate' && reading.actionId !== proposal.actionId)
    return refuse(input, 'CONFLICTING_ACTION', 'AI proposal conflicts with the deterministic reading.');
  const action = check.actions.get(proposal.actionId);
  if (!action || action.aiCandidate === false)
    return refuse(input, 'AI_ACTION_NOT_ALLOWED', 'AI may only propose catalog-approved action IDs.');
  const args = checkedArgs(action, proposal.args ?? {});
  if (!args) return refuse(input, 'INVALID_ARGS', 'AI proposed invalid or missing arguments.');
  if (reading.outcome === 'candidate' && reading.canonical !== canonical(action.id, args))
    return refuse(input, 'CONFLICTING_ARGUMENTS', 'AI proposal changes arguments already resolved from owner text.');
  return { schema: COMMAND_INTENT_SCHEMA, outcome: 'candidate',
    ...actionShape(action, args),
    provenance: { ...provenance(input, catalog, world, 'bounded-ai-proposal', null),
      rationale: proposal.rationale ?? null, uncertainty: proposal.uncertainty ?? null } };
}
