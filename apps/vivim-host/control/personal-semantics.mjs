// Lane B: pure, inert personal phrase resolution. No filesystem, AI, clock, grants or effects.
// The caller MUST pass the existing Host NLCL result first. A personal rule cannot
// supersede a canonical interpretation, refusal, incomplete command or clarification.
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
const decision = (outcome, extra = {}) => ({ schema: PERSONAL_RESOLUTION_SCHEMA, outcome,
  executionAuthorized: false, ...extra });

/** The private learning state must never be serialized as a Host grant. */
export function validatePersonalRule(rule, catalog) {
  if (!keysOnly(rule, ['schema', 'id', 'revision', 'phrase', 'actionId', 'args', 'scope',
    'state', 'source', 'catalogVersion']) || rule.schema !== PERSONAL_RULE_SCHEMA ||
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
function signature(rule) {
  return JSON.stringify([rule.actionId, Object.fromEntries(Object.entries(rule.args).sort(([a],[b]) => a.localeCompare(b)))]);
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
  const matches = rules.filter(rule => rule.state === 'accepted' &&
    normalize(rule.phrase) === normalize(text) && scoped(rule, scope));
  if (!matches.length) return decision('no_match', { reason: 'NO_ACCEPTED_MATCH' });
  if (matches.some(rule => rule.catalogVersion !== catalog.version))
    return decision('refused', { reason: 'STALE_CATALOG_RULE' });
  const highest = Math.max(...matches.map(rule => Object.keys(rule.scope).length));
  const mostSpecific = matches.filter(rule => Object.keys(rule.scope).length === highest);
  const unique = new Set(mostSpecific.map(signature));
  if (unique.size > 1) return decision('clarification_required', {
    reason: 'CONFLICTING_PERSONAL_RULES',
    ruleIds: mostSpecific.map(rule => rule.id).sort(),
  });
  // The tie has the same meaning; choose a stable provenance record.
  const rule = [...mostSpecific].sort((a,b) => a.id.localeCompare(b.id))[0];
  return decision('candidate', {
    candidate: { actionId: rule.actionId, args: { ...rule.args } },
    provenance: { method: 'accepted-personal-rule', ruleId: rule.id,
      ruleRevision: rule.revision, catalogRevision: catalog.version,
      semanticScope: { ...scope } },
  });
}
