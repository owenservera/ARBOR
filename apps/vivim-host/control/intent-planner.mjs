// Universal Text Control — typed planner (UTC02). Pure: no shell, network, model or mutation.
// Text is interpreted by the vendored deterministic Omega NCLL engine against a WorldModel
// generated from the action catalog (apps/mobile-relay/control-language.mjs); AI output can
// only enter through planCandidate() and is validated exactly like a typed GUI action.
// Planning never executes. Execution belongs to control/dispatcher.mjs (approval + journal).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildControlWorld, interpretControl, LANGUAGE_SCHEMA } from '../../mobile-relay/control-language.mjs';
import { toCommandIntent, validateAiCommandCandidate, COMMAND_INTENT_SCHEMA } from './command-intent.mjs';
import { resolvePersonalSemantics } from './personal-semantics.mjs';
import { createVecCompiler } from '../../mobile-relay/vec/compiler.mjs';

const catalogPath = fileURLToPath(new URL('./action-catalog.v1.json', import.meta.url));
const err = code => Object.assign(new Error(code), { code });
const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const ID = /^[a-z][a-z0-9._-]{2,95}$/;
const ARG_KEY = /^[a-z][a-z0-9._-]{0,95}$/;
const WORD = /^[a-z][a-z0-9-]{0,31}$/;
const SURFACES = ['text', 'desktop', 'mobile', 'visual'];
const RISKS = ['R0', 'R1', 'R2', 'R3'];
const READINESS = ['adapter_pending', 'enforcement_missing', 'unsupported', 'source_wired', 'verified'];
const EXECUTABLE = new Set(['source_wired', 'verified']);
const FAMILIES = ['/', '@', '#', '!', '?', '+', '-', '&', '$', '*', '%', '∆', '✓', '=', '^', '~', '→'];

/** One canonical risk scale (R0–R3). Other VIVIM generations map onto it; never the reverse. */
export const RISK_CROSSWALK = Object.freeze({
  // capability-activation.mjs
  R1_ADDITIVE: 'R1', R2_SENSITIVE: 'R2', R3_CAPABILITY: 'R3',
  // vivim-final ActionPlan CapabilityRisk
  read: 'R0', reversible_write: 'R1', external_communication: 'R3', destructive: 'R3', security_sensitive: 'R3',
  // vivim-omega RiskClass
  READ: 'R0', MUTATION: 'R1', EXTERNAL_MUTATION: 'R3', ENGINE: 'R3',
});
export function canonicalRisk(value) {
  if (RISKS.includes(value)) return value;
  const mapped = RISK_CROSSWALK[value];
  if (!mapped) throw err('CONTROL_RISK_UNKNOWN');
  return mapped;
}

const words = (list, max) => Array.isArray(list) && list.length >= 1 && list.length <= max && list.every(w => typeof w === 'string' && WORD.test(w));

function validLanguage(a, catalog) {
  const L = a.language;
  if (L === undefined) return true;
  if (!plain(L) || !words(L.verbs, 32) || (L.family !== undefined && !FAMILIES.includes(L.family)) ||
      (L.reading !== undefined && (typeof L.reading !== 'string' || L.reading.length > 160)) ||
      (L.scope !== undefined && !words(L.scope, 32)) || (L.objects !== undefined && !words(L.objects, 32)) ||
      (L.scopeQuestion !== undefined && (typeof L.scopeQuestion !== 'string' || L.scopeQuestion.length > 240)) ||
      (L.group !== undefined && !plain(catalog.languageGroups?.[L.group]))) return false;
  if (L.slots !== undefined) {
    if (!plain(L.slots)) return false;
    for (const [key, hint] of Object.entries(L.slots)) {
      if (!Object.hasOwn(a.args, key) || !plain(hint) ||
          (hint.kind !== undefined && !['rest', 'text'].includes(hint.kind)) ||
          (hint.preps !== undefined && !words(hint.preps, 8)) ||
          (hint.patient !== undefined && typeof hint.patient !== 'boolean')) return false;
      if (hint.match !== undefined) {
        if (typeof hint.match !== 'string' || hint.match.length > 120) return false;
        try { new RegExp(hint.match); } catch { return false; }
      }
    }
  }
  return true;
}

export function validateControlCatalog(catalog) {
  if (!plain(catalog) || catalog.schema !== 'vivim.control-action-catalog/1' ||
      !Array.isArray(catalog.actions) || catalog.actions.length > 3000 ||
      (catalog.languageGroups !== undefined && !plain(catalog.languageGroups))) throw err('CONTROL_CATALOG_INVALID');
  const ids = new Set(catalog.actions.map(a => a?.id));
  const seen = new Set();
  for (const a of catalog.actions) {
    if (!plain(a) || !ID.test(a.id) || seen.has(a.id) || !plain(a.args) ||
        !RISKS.includes(a.risk) || !SURFACES.every(s => a.surfaces?.includes(s)) ||
        typeof a.owner !== 'string' || !a.owner || !READINESS.includes(a.readiness) ||
        (EXECUTABLE.has(a.readiness) && (!a.executor || typeof a.executor !== 'string')) ||
        (a.risk === 'R3' && EXECUTABLE.has(a.readiness)) ||
        (a.aiCandidate !== undefined && typeof a.aiCandidate !== 'boolean') ||
        (a.undo !== undefined && (!plain(a.undo) || !ids.has(a.undo.actionId))) ||
        !Array.isArray(a.examples) || !a.examples.length || a.examples.some(x => typeof x !== 'string' || x.length > 240) ||
        !validLanguage(a, catalog)) throw err('CONTROL_CATALOG_INVALID');
    for (const [key, type] of Object.entries(a.args)) {
      if (!ARG_KEY.test(key) || !plain(type) ||
          (type.type !== 'string' && type.type !== 'enum') ||
          (type.type === 'enum' && (!Array.isArray(type.values) || !type.values.length ||
            type.values.some(x => typeof x !== 'string'))) ||
          (type.type === 'string' && (!Number.isInteger(type.min) || !Number.isInteger(type.max) ||
            type.min < 1 || type.max > 8000 || type.min > type.max))) throw err('CONTROL_CATALOG_INVALID');
    }
    seen.add(a.id);
  }
  return catalog;
}

export function loadControlCatalog() { return JSON.parse(readFileSync(catalogPath, 'utf8')); }

export function createControlPlanner({ catalog = loadControlCatalog(), lexicon = () => [],
  personalRules = () => [], commandScope = () => ({}) } = {}) {
  validateControlCatalog(catalog);
  if (typeof personalRules !== 'function' || typeof commandScope !== 'function') throw err('CONTROL_PERSONAL_RULE_SOURCE');
  function scopeFor(source) {
    const input = commandScope();
    if (!plain(input) || Object.keys(input).some(key => !['workspaceId','activity','providerId'].includes(key)) ||
      Object.values(input).some(v => typeof v !== 'string' || v.length < 1 || v.length > 128))
      throw err('CONTROL_SEMANTIC_SCOPE_INVALID');
    return { ...input, surface: source };
  }
  const actions = new Map(catalog.actions.map(a => [a.id, a]));
  const executable = a => EXECUTABLE.has(a.readiness);
  const safeSummary = a => ({ actionId: a.id, title: a.title, category: a.category ?? null, risk: a.risk, target: a.target,
    readiness: a.readiness, available: a.readiness === 'verified', executable: executable(a),
    liveAcceptance: a.readiness === 'verified' ? 'verified' : 'pending',
    surfaces: a.surfaces, reversible: a.reversible === true, examples: a.examples,
    args: Object.fromEntries(Object.entries(a.args).map(([k, t]) => [k, t.type === 'enum' ? { type: 'enum', values: t.values } : { type: 'string', min: t.min, max: t.max }])),
    ...(a.precondition ? { precondition: a.precondition } : {}) });
  const taught = () => { const v = lexicon(); return Array.isArray(v) ? v : []; };
  // Version the actual lexicon contents, not just its length: replacing a taught
  // alias with another must invalidate a mobile client's prior WorldModel.
  function world(entries = taught(), rules = personalRules()) {
    let hash = 2166136261;
    // Semantic rules are part of the same versioned interpretation world.
    // A changed/revoked phrase invalidates stale command-intent worldRevision pins.
    const canonical = v => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v).sort(([a],[b]) => a.localeCompare(b))
        .map(([k,val]) => [k,canonical(val)])) : v;
    const ruleKeys = rules.filter(r => r.state === 'accepted')
      .map(r => 'rule:' + JSON.stringify(canonical({
        id:r.id,revision:r.revision,phrase:r.phrase,scope:r.scope,
        actionId:r.actionId,args:r.args,catalogVersion:r.catalogVersion,
      })));
    const keys = [...entries.map(e => String(e.word) + '\0' + String(e.actionId)), ...ruleKeys].sort();
    for (const key of keys) {
      for (let i = 0; i < key.length; i++) {
        hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
      }
      hash = Math.imul(hash ^ 10, 16777619);
    }
    const revision = catalog.version * 4294967296 + (hash >>> 0);
    return buildControlWorld(catalog, { lexicon: entries, version: revision });
  }

  function describe() {
    return { schema: 'vivim.control-discovery/1', version: catalog.version,
      status: 'plan_and_dispatch', language: LANGUAGE_SCHEMA, commandIntentSchema: COMMAND_INTENT_SCHEMA,
      note: 'Executable means a Host executor is wired; only verified means live-accepted. Every non-read action needs owner approval.',
      coverage: { scope:'typed-action-catalog-only', total:catalog.actions.length,
        sourceWired:catalog.actions.filter(a=>a.readiness==='source_wired').length,
        verified:catalog.actions.filter(a=>a.readiness==='verified').length,
        unavailable:catalog.actions.filter(a=>!executable(a)).length,
        notMappedToAllAtomicCapabilities:true },
      actions: catalog.actions.map(safeSummary) };
  }

  function planTyped({ actionId, args = {}, source = 'text', origin = 'typed' } = {}) {
    if (!SURFACES.includes(source)) throw err('CONTROL_SOURCE_INVALID');
    if (typeof actionId !== 'string' || !actions.has(actionId)) throw err('CONTROL_ACTION_UNKNOWN');
    const a = actions.get(actionId);
    if (!plain(args) || Object.keys(args).some(k => !Object.hasOwn(a.args, k)) ||
        Object.keys(a.args).some(k => !Object.hasOwn(args, k))) throw err('CONTROL_ARGS_INVALID');
    const normalized = {};
    for (const [key, type] of Object.entries(a.args)) {
      const val = args[key];
      if (typeof val !== 'string' || !val.trim() || val !== val.trim() ||
          (type.type === 'enum' && !type.values.includes(val)) ||
          (type.type === 'string' && (val.length < type.min || val.length > type.max))) throw err('CONTROL_ARGS_INVALID');
      normalized[key] = val;
    }
    const runnable = executable(a);
    return { schema: 'vivim.control-plan/1', source, origin, actionId, title: a.title, args: normalized, target: a.target,
      risk: a.risk, readiness: a.readiness, liveAcceptance: a.readiness === 'verified' ? 'verified' : 'pending',
      outcome: !runnable ? 'unavailable' : a.risk === 'R0' ? 'ready' : 'approval_required',
      requiresApproval: a.risk !== 'R0', executorStatus: a.readiness,
      reversible: a.reversible === true, executionPerformed: false,
      ...(a.undo ? { undoActionId: a.undo.actionId } : {}),
      ...(a.precondition ? { precondition: a.precondition } : {}) };
  }

  function interpretText(text, { source = 'text', worldSnapshot = world() } = {}) {
    if (typeof text !== 'string' || text.length > 1000) throw err('CONTROL_TEXT_INVALID');
    if (!SURFACES.includes(source)) throw err('CONTROL_SOURCE_INVALID');
    // A personal rule may fill an NLCL gap, never override its positive match, refusal,
    // ambiguity or incomplete command. Existing syntax guards always run first.
    const baseline = interpretControl(text, { catalog, world: worldSnapshot });
    if (baseline.outcome !== 'interpretation_required') return baseline;
    const resolved = resolvePersonalSemantics({ text, baseline, catalog,
      rules: personalRules(), scope: scopeFor(source) });
    if (resolved.outcome === 'candidate') return {
      ...baseline, outcome: 'candidate', candidate: resolved.candidate,
      provenance: resolved.provenance,
    };
    if (resolved.outcome === 'clarification_required') return {
      ...baseline, outcome: 'clarification_required',
      question: 'This phrase has conflicting accepted meanings. Please specify the action.',
      choices: [], semanticRuleIds: resolved.ruleIds,
      provenance: { method: 'personal-rule-conflict', ruleIds: resolved.ruleIds },
    };
    if (resolved.outcome === 'refused') return {
      ...baseline, outcome: 'refused',
      refusal: { code: resolved.reason, message: 'A personal command rule is invalid or stale.' },
      provenance: { method: 'personal-rule-refusal', reason: resolved.reason },
    };
    return baseline;
  }

  // The VEC adapter is installed by Host code, not selected by user or model input.
  // The same command-intent object supplies both the public IR and the typed plan.
  const commandCompiler = createVecCompiler({ adapters: { command: ({ text, input, worldSnapshot, rules, scope }) => {
    const intent = toCommandIntent({ ...input, text },
      { catalog, world: worldSnapshot, personalRules: rules, personalScope: scope });
    const outcome = intent.outcome === 'interpretation_required' ? 'unsupported' : intent.outcome;
    return { outcome, code: intent.refusal?.code ?? 'NONE', proposal: intent };
  } } });

  function compileCommand(text, { source = 'text', audience = 'owner',
    worldRevision, catalogRevision } = {}) {
    if (typeof text !== 'string' || text.length > 1000) throw err('CONTROL_TEXT_INVALID');
    if (!SURFACES.includes(source)) throw err('CONTROL_SOURCE_INVALID');
    const rules = personalRules();
    const worldSnapshot = world(taught(), rules);
    return commandCompiler.compile({ domain: 'command', text, context: {
      input: { scope: source, audience, worldRevision, catalogRevision },
      worldSnapshot, rules, scope: scopeFor(source)
    } });
  }

  function planText(text, { source = 'text', worldRevision, catalogRevision } = {}) {
    if (typeof text !== 'string' || !text.trim() || text.length > 1000) throw err('CONTROL_TEXT_INVALID');
    const compiled = compileCommand(text.trim(), { source, worldRevision, catalogRevision });
    const meaning = compiled.proposal;
    const language = { ...meaning?.language, vec: compiled };
    const base = { schema: 'vivim.control-plan/1', source, executionPerformed: false, language };
    if (!meaning || meaning.schema !== COMMAND_INTENT_SCHEMA ||
        compiled.authorization !== 'none' || compiled.executed !== false || compiled.persisted !== false)
      return { ...base, outcome: 'refused', refusal: { code: compiled.code, message: 'Command compilation refused.' } };
    if (compiled.outcome === 'candidate' && meaning.outcome === 'candidate') {
      // Refuse stale interpretations before handing them to the existing approval planner.
      if (meaning.provenance.catalogRevision !== catalog.version ||
          meaning.provenance.worldRevision !== world().v)
        return { ...base, outcome: 'refused', refusal: { code: 'STALE_WORLD', message: 'Command context changed.' } };
      return { ...planTyped({ actionId: meaning.actionId, args: meaning.args, source,
        origin: meaning.provenance.method === 'accepted-personal-rule' ? 'personal_rule' : 'deterministic' }), language };
    }
    if (compiled.outcome === 'refused' || meaning.outcome === 'refused')
      return { ...base, outcome: 'refused', refusal: meaning.refusal ?? { code: compiled.code, message: 'Command refused.' } };
    if (meaning.outcome === 'clarification_required') {
      if (meaning.missing?.length) return { ...base, outcome: 'incomplete',
        question: meaning.question ?? 'Missing information.',
        ...(meaning.alternatives?.[0] ? { actionId: meaning.alternatives[0].actionId } : {}),
        missing: meaning.missing };
      const ranked = (meaning.alternatives ?? []).map(choice => actions.get(choice.actionId)).filter(Boolean);
      return { ...base, outcome: 'clarification_required', question: meaning.question,
        choices: ranked.map(a => a.id), choiceDetails: ranked.map(a => ({ actionId: a.id, title: a.title, risk: a.risk, readiness: a.readiness })),
        risk: ranked.reduce((m, a) => RISKS.indexOf(a.risk) > RISKS.indexOf(m) ? a.risk : m, 'R0') };
    }
    if (compiled.outcome === 'unsupported' && meaning.outcome === 'interpretation_required')
      return { ...base, outcome: 'interpretation_required', route: 'existing_harness_ai_candidate_only',
        message: 'No deterministic action matched. AI interpretation may propose a typed action; nothing was changed.' };
    return { ...base, outcome: 'refused', refusal: { code: 'CONTROL_COMPILATION_INVALID', message: 'Inconsistent command compilation.' } };
  }

  /** V0.1 typed, inert command IR; no dispatcher/approval side effects. */
  function interpretCommand(text, options = {}) {
    const compiled = compileCommand(text, options);
    return compiled.proposal ?? { schema: COMMAND_INTENT_SCHEMA, outcome: 'refused',
      refusal: { code: compiled.code, message: 'Command compilation refused.' },
      provenance: { authority: 'none' } };
  }

  /** Bound a model's suggestion to its original owner sentence and the exact catalog. */
  function validateCommandCandidate(text, candidate, { source = 'text', audience = 'owner',
    worldRevision, catalogRevision } = {}) {
    if (typeof text !== 'string' || text.length > 1000) throw err('CONTROL_TEXT_INVALID');
    const rules = personalRules();
    const w = world(taught(), rules);
    return validateAiCommandCandidate({ text, candidate, scope: source, audience,
      worldRevision, catalogRevision }, { catalog, world: w, personalRules: rules, personalScope: scopeFor(source) });
  }

  /** UTC05 entry: an untrusted model proposal. Shape-checked, catalog-validated, never trusted. */
  function planCandidate(candidate, { source = 'text' } = {}) {
    if (!plain(candidate) || Object.keys(candidate).some(k => !['actionId', 'args', 'rationale', 'uncertainty'].includes(k)) ||
        (candidate.rationale !== undefined && (typeof candidate.rationale !== 'string' || candidate.rationale.length > 500)) ||
        (candidate.uncertainty !== undefined && (typeof candidate.uncertainty !== 'number' || !(candidate.uncertainty >= 0 && candidate.uncertainty <= 1))))
      throw err('CONTROL_CANDIDATE_INVALID');
    const a = actions.get(candidate.actionId);
    if (a?.aiCandidate === false) throw err('CONTROL_CANDIDATE_REFUSED');
    const plan = planTyped({ actionId: candidate.actionId, args: candidate.args ?? {}, source, origin: 'ai_candidate' });
    return { ...plan, requiresApproval: true, outcome: plan.outcome === 'ready' ? 'approval_required' : plan.outcome,
      candidate: { rationale: candidate.rationale ?? null, uncertainty: candidate.uncertainty ?? null } };
  }

  /** Public language metadata for client-side keystroke feedback (no executors, no state). */
  function languagePack() {
    return { schema: 'vivim.control-language-pack/1', world: world(),
      catalog: { schema: catalog.schema, version: catalog.version, languageGroups: catalog.languageGroups ?? {},
        actions: catalog.actions.map(a => ({ id: a.id, title: a.title, risk: a.risk, readiness: a.readiness, owner: a.owner,
          args: a.args, examples: a.examples, ...(a.language ? { language: a.language } : {}) })) } };
  }

  return { schema: 'vivim.control-planner/1', catalog, describe, world, languagePack, interpretText,
    interpretCommand, validateCommandCandidate, planTyped, planText, planCandidate };
}
