/**
 * @hq:context Budget-aware model routing: choose the cheapest healthy model that can do the task.
 * @hq:owner hq-agent
 * @hq:task team-routing
 * @hq:invariant this module decides and explains; it never mutates a config, an agent file or a provider.
 * @hq:see docs/AGENT-BUS.md
 *
 * Why it exists. Over five hours on 2026-11-04 this machine ran 310 turns on one paid provider,
 * 276 on a free model that then hit "free-models-per-day-high-balance" eighteen times, and lost five
 * lanes at once to that single cap. Input tokens outnumbered output tokens 160:1, so the dominant
 * cost is context, not generation. A route that ignores observed health and price repeats that loss.
 */
import {
  budgetStatusFromUsage,
  isBudgetBlocked,
  summarizeBudget,
} from './model-budget.mjs';

/** Rate-limit and quota language, including provider-specific free-tier daily caps. */
const CAP_RE = /rate[ _-]?limit|usage_limit|cooling down|daily[ _-]?cap|quota|free-models-per-day|token plan usage limit|usage limit reached|\(2056\)/i;
/** Payment or credential exhaustion — a different failure from a cap. */
const BUDGET_RE = /insufficient[\s_-]*balance|status=402|payment required|auth_failed|authentication failed|purchase credits|upgrade your token plan/i;
/** The provider rejected the shape of our request, not the request itself. */
const SHAPE_RE = /unsupported parameter|invalid_request|validation:/i;

/**
 * The provider rejected the reasoning LEVEL we asked for — not the model, not the request.
 *
 * @hq:why this is its own family. On 2026-11-05 every named-agent spawn on this machine failed
 *   with `reasoning-level-not-supported` because the roster pinned `thoughtLevel: max` onto a
 *   provider that accepts only low/medium/high. The model answered perfectly at other levels, so
 *   scoring that as "broken" would have sent the router hunting for a different model when the
 *   fix was one word in fifty-three agent definitions.
 */
const REASONING_LEVEL_RE = /reasoning[-_ ]?level[-_ ]?not[-_ ]?supported|reasoning effort[^.]*is not supported|unsupported reasoning|不支持所选思考档位/i;

/**
 * Reasoning levels this CLI accepts at all.
 *
 * @hq:why `max` is absent. It parses, it appears in fifty-three agent definitions, and every
 *   provider reached from here refuses it. A level the CLI can spell but no provider honours is
 *   the exact shape of failure this router now has to catch before it costs a whole roster.
 */
export const CLI_REASONING_LEVELS = ['low', 'medium', 'high'];

/**
 * @typedef {Object} Policy
 * @property {boolean} [preferFree]        Prefer zero-cost models when one is healthy.
 * @property {number}  [maxUsdPerCall]     Hard ceiling on the estimated cost of one call.
 * @property {number}  [latencyWeight]     Score points per millisecond of average latency.
 * @property {number}  [minReliability]    A model below this completion rate is not eligible.
 * @property {string[]} [pinnedModels]     "provider/model" keys the owner fixed; never re-route these.
 * @property {string[]} [blockedProviders] Providers this policy refuses to use.
 * @property {Map<string,any>} [budgetStatus]   Injected budget status map keyed provider/model -> {blocked, reason, source}.
 * @property {boolean} [respectBudget]          When true, budget-blocked current models are rerouted even if pinned (default true).
 * @property {{enabled:boolean,tierOrder:string[],modelTiers:Object<string,{tier:string,verifiedAt:string|number,planEntitlement?:{status:string,verifiedAt:string|number}}>,allowedUnknownQuotaModels?:string[],tierMaxAgeMs?:number}} [tieredSelector] Opt-in evidence-backed tier selection; included plans also require active entitlement and funded lane.
 */

export const DEFAULT_POLICY = {
  preferFree: true,
  // Input tokens ran 160:1 over output tokens on this machine, so a single call on a 50k context
  // at $3/M is already $0.15. A ceiling below that blocks every paid route instead of ranking them.
  maxUsdPerCall: 0.5,
  latencyWeight: 0.05,
  minReliability: 0.5,
  pinnedModels: [],
  blockedProviders: [],
  windowMs: 5 * 60 * 60 * 1000,
  respectBudget: true,
  // The reasoning level every route carries when nothing better is known. `max` is never a
  // default: no provider reached from this machine honours it, and one bad default silently
  // unspawns every agent that inherits it.
  reasoningLevel: 'high',
  /** Owner pins: "provider/model" -> reasoning level. Wins over anything observed. */
  reasoningLevels: {},
  /**
   * Models the owner wants lanes on when they are eligible.
   *
   * @hq:why this is not a block. A block on a provider is how five lanes die together: the free
   *   model caps, the blocked one is refused too, and every agent has nowhere left to go. A
   *   preference moves the roster onto the owner's budget model while leaving the paid plan as
   *   the fallback when that model is capped, broken or unproven.
   */
  preferredModels: [],
  /** Levels that must never be routed to, whatever the agent currently carries. */
  forbiddenLevels: ['max'],
};

/**
 * Decide whether a route plan may be written to disk.
 *
 * @hq:invariant writing an agent's model line is opt-in: only an explicit `--apply` writes.
 *   A missing flag, `--apply=false`, or `--dry-run` all mean propose-only. The router is trusted
 *   enough to choose; it is not trusted to act because nobody asked it to. On 2026-11-04 a bare
 *   `route-model` rewrote 31 agent definitions and left 31 `.bak-route-<stamp>` siblings, while
 *   six documents (team-automation.mjs:27, model-routing/SKILL.md:64, the plugin README:39)
 *   described that same command as "changes nothing".
 * @hq:why this is a function and not an inline expression. The old expression was
 *   `flags.apply !== false`, so the default was to write and every test of the plan was blind to
 *   it. A named predicate can be asserted against directly, including the empty-flag case.
 * @param {Record<string, unknown>} flags Parsed CLI flags.
 * @returns {boolean} True only when the caller asked for the write.
 */
export function shouldApply(flags = {}) {
  return flags.apply === true && flags['dry-run'] !== true;
}

/**
 * Pull the reasoning levels a provider says it supports out of an error payload.
 *
 * @hq:why the CLI ships the supported set with the rejection. Learning the fix from the failure
 *   is cheaper than guessing a level and re-testing it against a live provider.
 * @param {string} message
 * @returns {string[]} Lower-cased level names, empty when the payload names none.
 */
export function parseSupportedLevels(message) {
  const text = String(message ?? '');
  const out = new Set();
  const listed = text.match(/supportedLevels["']?\s*[:=]\s*\[([^\]]*)\]/i);
  if (listed) for (const m of listed[1].matchAll(/["']([a-z]+)["']/gi)) out.add(m[1].toLowerCase());
  const plain = text.match(/supported levels?[:=]\s*([a-z, ]+)/i);
  if (plain) for (const part of plain[1].split(',')) {
    const v = part.trim().toLowerCase();
    if (v) out.add(v);
  }
  return [...out];
}

/**
 * Level names a reasoning effort can actually take.
 *
 * @hq:why the CLI's spawn error packs the MODEL into the same `selection=` field it uses for a
 *   level (`selection=minimax-m-plan/MiniMax-M3`). Reading that as a level would blacklist a
 *   model because of its own name, so a captured token is only believed when it is a level.
 */
const REASONING_LEVEL_NAMES = new Set(['low', 'medium', 'high', 'max', 'minimal', 'off', 'none', 'enabled', 'xhigh']);

/**
 * Read the reasoning level a provider refused, from the rejection message.
 *
 * @param {string} message
 * @returns {string|null} The refused level, or null when the message does not name one.
 */
export function parseRejectedLevel(message) {
  const text = String(message ?? '');
  const candidates = [
    text.match(/reasoning effort ["']?([a-z]+)["']? is not supported/i),
    text.match(/(?:reasoninglevel|reasoning_level|reasoning level|effort|level)\s*[:=]\s*["']?([a-z]+)/i),
    text.match(/selection\s*[:=]\s*["']?([a-z]+)/i),
  ];
  for (const m of candidates) {
    if (!m) continue;
    const value = m[1].toLowerCase();
    if (REASONING_LEVEL_NAMES.has(value)) return value;
  }
  return null;
}

/**
 * Choose the reasoning level for one model, and say where the choice came from.
 *
 * @hq:why a route without a level is a route that may not spawn. The order is deliberate: an
 *   owner pin wins, then a level the provider itself declared or reported, then the policy
 *   default. A level observed to be rejected for this exact model is never returned.
 * @param {{key:string, stats?:Map<string,any>, policy?:Policy, declaredLevels?:string[]}} input
 * @returns {{level:string|null, source:string, reason:string}}
 */
export function chooseReasoningLevel(input) {
  const { key, stats, policy = DEFAULT_POLICY, declaredLevels = [] } = input || {};
  const pinned = policy.reasoningLevels?.[key];
  if (pinned) return { level: String(pinned), source: 'owner pin', reason: `owner pinned ${key} to ${pinned}` };

  const rec = stats instanceof Map ? stats.get(key) : null;
  const rejected = new Set([...(rec?.rejectedLevels ?? [])]);
  const forbidden = new Set((policy.forbiddenLevels ?? []).map((l) => String(l).toLowerCase()));
  const offered = [...new Set([...(rec?.supportedLevels ?? []), ...declaredLevels].map((l) => String(l).toLowerCase()))]
    .filter((l) => !rejected.has(l) && !forbidden.has(l));
  if (offered.length) {
    return { level: offered[0], source: 'provider evidence', reason: `provider accepts ${offered.join('/')} for ${key}` };
  }
  const fallback = String(policy.reasoningLevel ?? DEFAULT_POLICY.reasoningLevel).toLowerCase();
  if (forbidden.has(fallback) || rejected.has(fallback)) {
    return { level: null, source: 'none', reason: `the default level ${fallback} is not usable for ${key}` };
  }
  return { level: fallback, source: 'policy default', reason: `no observed evidence for ${key}; using the policy default ${fallback}` };
}

/**
 * Read the reasoning levels the CLI's own provider registry declares for each model.
 *
 * @hq:why this is ground truth, not inference. The provider config carries
 *   `optionSpecs.reasoningLevel.values` per model; a level missing from that list is one the
 *   registry does not offer for that model.
 * @param {Object|null} providerConfig Parsed provider_config.json.
 * @returns {Map<string, string[]>} "provider/model" -> declared levels.
 */
export function readDeclaredReasoningLevels(providerConfig) {
  const out = new Map();
  const rules = providerConfig?.config?.modelConfigRules?.providerModelRules;
  for (const rule of Array.isArray(rules) ? rules : []) {
    const values = rule?.config?.optionSpecs?.reasoningLevel?.values;
    if (!Array.isArray(values) || !values.length) continue;
    const key = `${rule.providerId}/${rule.modelId}`;
    out.set(key, values.map((v) => String(v).toLowerCase()));
  }
  return out;
}

/**
 * Aggregate raw usage rows into one record per provider/model.
 *
 * @param {Array<Object>} rows Rows shaped like the ZCode `model_usage` table.
 * @param {{now?: number, windowMs?: number}} [opts]
 * @returns {Map<string, Object>} key `provider/model` -> totals, averages and error groups.
 */
export function summarizeUsage(rows, opts = {}) {
  const now = opts.now ?? Date.now();
  const windowMs = opts.windowMs ?? DEFAULT_POLICY.windowMs;
  const floor = now - windowMs;
  /** @type {Map<string, any>} */
  const out = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row || typeof row.started_at !== 'number' || row.started_at < floor) continue;
    const key = `${row.provider_id}/${row.model_id}`;
    let rec = out.get(key);
    if (!rec) {
      rec = { key, provider: row.provider_id, model: row.model_id, completed: 0, error: 0, cancelled: 0, total: 0, latencySum: 0, inputSum: 0, outputSum: 0, errors: [], lastCompletedAt: 0, lastErrorAt: 0, reasoningLevelErrors: 0, supportedLevels: new Set(), rejectedLevels: new Set() };
      out.set(key, rec);
    }
    rec.total += 1;
    if (row.status === 'completed') {
      rec.completed += 1;
      rec.latencySum += Number(row.duration_ms) || 0;
      rec.inputSum += Number(row.input_tokens) || 0;
      rec.outputSum += Number(row.output_tokens) || 0;
      rec.lastCompletedAt = Math.max(rec.lastCompletedAt || 0, Number(row.started_at) || 0);
    } else if (row.status === 'cancelled') {
      rec.cancelled += 1;
    } else {
      rec.error += 1;
      rec.lastErrorAt = Math.max(rec.lastErrorAt || 0, Number(row.started_at) || 0);
      const errorType = row.error_type ?? 'unknown';
      const errorCode = row.error_code ?? null;
      const errorMessage = row.error_message ?? '';
      // A rejected reasoning LEVEL is a pair failure, not a model failure. It is counted apart so
      // the model keeps its health and the router can learn which level to use instead.
      if (REASONING_LEVEL_RE.test(`${errorType} ${errorCode} ${errorMessage}`)) {
        rec.reasoningLevelErrors += 1;
        for (const level of parseSupportedLevels(errorMessage)) rec.supportedLevels.add(level);
        const refused = parseRejectedLevel(errorMessage);
        if (refused) rec.rejectedLevels.add(refused);
      }
      let group = rec.errors.find((g) => g.errorType === errorType && g.errorCode === errorCode && g.errorMessage === errorMessage);
      if (!group) { group = { errorType, errorCode, errorMessage, count: 0 }; rec.errors.push(group); }
      group.count += 1;
    }
  }
  for (const rec of out.values()) {
    const n = rec.completed || 1;
    rec.avgLatencyMs = rec.completed ? rec.latencySum / rec.completed : 0;
    rec.avgInputTokens = rec.completed ? rec.inputSum / n : 0;
    rec.avgOutputTokens = rec.completed ? rec.outputSum / n : 0;
    delete rec.latencySum; delete rec.inputSum; delete rec.outputSum;
    rec.supportedLevels = [...rec.supportedLevels];
    rec.rejectedLevels = [...rec.rejectedLevels];
  }
  return out;
}

/**
 * Decide whether a model is usable right now, and say why.
 *
 * @param {Object} stats One record from {@link summarizeUsage}.
 * @returns {{state: string, reliability: number, reasons: string[], avgLatencyMs: number}}
 *   state is one of healthy | capped | budget-blocked | broken | unproven.
 */
export function classifyHealth(stats) {
  const s = stats || {};
  const completed = Number(s.completed) || 0;
  const error = Number(s.error) || 0;
  const cancelled = Number(s.cancelled) || 0;
  const total = Number(s.total) || 0;
  const errors = Array.isArray(s.errors) ? s.errors : [];
  const reliability = completed + error > 0 ? completed / (completed + error) : 0;
  const avgLatencyMs = Number(s.avgLatencyMs) || 0;
  const blob = errors.map((e) => `${e.errorType || ''} ${e.errorCode || ''} ${e.errorMessage || ''}`).join(' \n ');

  if (total === 0) {
    return { state: 'unproven', reliability: 0, reasons: ['no observed usage'], avgLatencyMs };
  }
  const planCredit = /token plan usage limit|usage limit reached|\(2056\)|(?:^|\D)2056(?:\D|$)|purchase credits|upgrade your token plan/i.test(blob);
  // A model that completed a call AFTER its last budget error has recovered — crediting was
  // topped up, or the cap window rolled over. Without this, a provider stayed "budget-blocked"
  // for the whole 5h window even while it was serving every request.
  const recovered = Boolean(s.lastCompletedAt && s.lastErrorAt && s.lastCompletedAt > s.lastErrorAt);
  if ((BUDGET_RE.test(blob) || planCredit) && !recovered) {
    return {
      state: 'budget-blocked',
      reliability,
      reasons: [planCredit ? 'token plan credit exhausted — switch provider, do not wait' : 'insufficient balance or auth failure'],
      avgLatencyMs,
    };
  }
  if (CAP_RE.test(blob) && !recovered) {
    return { state: 'capped', reliability, reasons: ['daily cap or rate limit observed'], avgLatencyMs };
  }
  const shapeErrors = errors.filter((e) => SHAPE_RE.test(`${e.errorType} ${e.errorCode} ${e.errorMessage}`)).reduce((sum, e) => sum + e.count, 0);
  // A rejected reasoning LEVEL is not a model failure: the same model answers at the levels it
  // accepts. Counting it against reliability would push a working free model out of every plan
  // over a one-word mistake in an agent definition.
  const reasoningErrors = errors.filter((e) => REASONING_LEVEL_RE.test(`${e.errorType} ${e.errorCode} ${e.errorMessage}`)).reduce((sum, e) => sum + e.count, 0);
  const modelErrors = Math.max(error - reasoningErrors, 0);
  const modelReliability = completed + modelErrors > 0 ? completed / (completed + modelErrors) : reliability;
  const levelNotes = [];
  const rejectedLevels = Array.isArray(s.rejectedLevels) ? s.rejectedLevels : [];
  const supportedLevels = Array.isArray(s.supportedLevels) ? s.supportedLevels : [];
  if (reasoningErrors > 0) levelNotes.push(`${reasoningErrors} reasoning-level rejection(s)`);
  if (rejectedLevels.length) levelNotes.push(`rejected level(s): ${rejectedLevels.join('/')}`);
  if (supportedLevels.length) levelNotes.push(`accepted level(s): ${supportedLevels.join('/')}`);
  if (shapeErrors > 0 && shapeErrors === modelErrors && modelErrors / total >= 0.25) {
    return { state: 'broken', reliability: modelReliability, reasons: ['rejects our request shape'], avgLatencyMs, levelNotes };
  }
  if (completed > 0 && modelReliability >= DEFAULT_POLICY.minReliability) {
    return { state: 'healthy', reliability: modelReliability, reasons: [], avgLatencyMs, levelNotes, rejectedLevels, supportedLevels };
  }
  if (completed > 0) {
    return { state: 'unhealthy', reliability: modelReliability, reasons: [`low reliability ${(modelReliability * 100).toFixed(0)}%`], avgLatencyMs, levelNotes };
  }
  return { state: 'unproven', reliability: modelReliability, reasons: ['no successful call observed'], avgLatencyMs, levelNotes, rejectedLevels, supportedLevels };
}

/**
 * Score one candidate model for one task.
 *
 * @param {Object} input
 * @param {string} input.key            "provider/model".
 * @param {boolean} input.isFree
 * @param {{inputPerMillion:number, outputPerMillion:number}} input.price
 * @param {number} [input.contextWindowTokens]
 * @param {Object} input.health          Result of {@link classifyHealth}.
 * @param {Object} input.task            Task profile.
 * @param {Policy} input.policy
 * @returns {{key:string, eligible:boolean, reason:string, tier:number, score:number,
 *            rawCostUsd:number, effectiveCostUsd:number}}
 */
export function scoreCandidate(input) {
  const { key, provider = '', isFree = false, price = {}, health = {}, task = {}, policy = DEFAULT_POLICY } = input || {};
  const contextWindowTokens = Number(input?.contextWindowTokens) || null;
  const reliability = Math.max(Number(health.reliability) || 0, 0.05);

  const reject = (reason, tier = 9) => ({ key, eligible: false, reason, tier, score: Infinity, rawCostUsd: 0, effectiveCostUsd: 0 });

  if (Array.isArray(policy.pinnedModels) && policy.pinnedModels.includes(key)) return reject('pinned by owner');
  if (Array.isArray(policy.blockedProviders) && policy.blockedProviders.includes(provider)) return reject('provider blocked by policy');
  if (policy.respectBudget !== false && isBudgetBlocked(key, policy.budgetStatus)) return reject('budget blocked — no balance or auth failure');
  if (health.state === 'capped') return reject('capped — daily cap or rate limit observed');
  if (health.state === 'budget-blocked') return reject('budget blocked — no balance or auth failure');
  if (health.state === 'broken') return reject('rejects our request shape');
  if (health.state === 'unproven') return reject('unproven — no observed usage');
  if (policy.tieredSelector?.enabled && health.state !== 'healthy') return reject(`unhealthy — ${health.state ?? 'unknown'}`);
  const floor = Number(policy.minReliability) ?? DEFAULT_POLICY.minReliability;
  if (reliability < floor) return reject('reliability below floor');

  const estInput = Number(task.estInputTokens) || 0;
  const estOutput = Number(task.estOutputTokens) || 0;
  const minContext = Number(task.minContextTokens) || 0;
  if (contextWindowTokens && minContext > contextWindowTokens) return reject(`context window ${contextWindowTokens} < required ${minContext}`);
  if (contextWindowTokens && estInput > contextWindowTokens) return reject(`context window ${contextWindowTokens} < estimated input ${estInput}`);

  const rawCostUsd = (estInput * (Number(price.inputPerMillion) || 0) + estOutput * (Number(price.outputPerMillion) || 0)) / 1e6;
  if (policy.maxUsdPerCall && rawCostUsd > policy.maxUsdPerCall) {
    return reject(`over budget — $${rawCostUsd.toFixed(4)} per call exceeds $${policy.maxUsdPerCall}`);
  }

  const effectiveCostUsd = rawCostUsd / reliability;
  const preferred = Array.isArray(policy.preferredModels) && policy.preferredModels.includes(key);
  const priceKnown = price.priceKnown !== false;
  let tier = isFree ? 0 : (priceKnown ? 1 : 2);
  let tierName;
  if (policy.tieredSelector?.enabled) {
    const selector = policy.tieredSelector;
    const evidence = Object.hasOwn(selector.modelTiers ?? {}, key) ? selector.modelTiers[key] : undefined;
    const verifiedAt = typeof evidence?.verifiedAt === 'number' ? evidence.verifiedAt : Date.parse(evidence?.verifiedAt);
    const maxAge = selector.tierMaxAgeMs ?? policy.windowMs ?? DEFAULT_POLICY.windowMs;
    const now = Number(policy.now) || Date.now();
    if (!Number.isFinite(verifiedAt) || !Number.isFinite(maxAge) || maxAge < 0 || verifiedAt > now || now - verifiedAt > maxAge) return reject('stale or missing tier evidence');
    tierName = evidence.tier;
    const allowed = ['verified-free', 'included-plan', 'funded-metered', 'unknown-quota'];
    if (!allowed.includes(tierName) || !Array.isArray(selector.tierOrder) || !selector.tierOrder.includes(tierName)) return reject('tier not allowed by policy');
    if (tierName === 'verified-free' && (!isFree || !priceKnown)) return reject('free tier not verified by catalog');
    const budgetEntry = policy.budgetStatus instanceof Map ? policy.budgetStatus.get(key) : undefined;
    if (tierName === 'included-plan') {
      const entitlement = evidence.planEntitlement;
      const entitlementAt = typeof entitlement?.verifiedAt === 'number' ? entitlement.verifiedAt : Date.parse(entitlement?.verifiedAt);
      if (entitlement?.status !== 'active' || !Number.isFinite(entitlementAt) || entitlementAt > now || now - entitlementAt > maxAge || budgetEntry?.budgetState !== 'funded' || budgetEntry?.providerEnabled !== true || budgetEntry?.modelListed !== true) return reject('included plan entitlement or lane funding not verified');
    }
    if (tierName === 'funded-metered' && (isFree || !priceKnown || !budgetEntry?.providerEnabled || !budgetEntry?.modelListed || budgetEntry?.budgetState !== 'funded')) return reject('metered funding not verified');
    if (tierName === 'unknown-quota' && !(Array.isArray(selector.allowedUnknownQuotaModels) && selector.allowedUnknownQuotaModels.includes(key))) return reject('unknown quota not explicitly allowed');
    tier = selector.tierOrder.indexOf(tierName);
  }
  const latencyPoints = (Number(health.avgLatencyMs) || 0) * (policy.latencyWeight ?? 0.05);
  const reliabilityPoints = (1 - reliability) * 1000;
  const score = (effectiveCostUsd * 1e6 + latencyPoints + reliabilityPoints) - (preferred ? 1e6 : 0);
  return { key, eligible: true, reason: preferred ? 'owner preference' : '', tier, tierName, score, rawCostUsd, effectiveCostUsd, preferred };
}

/**
 * Choose one model for a task and explain the choice.
 *
 * @param {{task?: Object, policy?: Policy, candidates: Array<Object>}} input
 * @returns {{chosen: Object|null, rationale: string, rejected: Array<{key:string, reason:string}>}}
 */
export function routeTask(input) {
  const { task = {}, policy = DEFAULT_POLICY, candidates = [] } = input || {};
  const candidateList = Array.isArray(candidates) ? candidates : [];
  const sharedCreditExhausted = new Set(policy.creditExhaustedProviders ?? []);
  for (const c of candidateList) {
    if (c.health?.state === 'budget-blocked' && c.health.reasons?.some((r) => /token plan credit exhausted/i.test(r))) sharedCreditExhausted.add(c.provider);
  }
  if (policy.budgetStatus instanceof Map) {
    for (const [key, entry] of policy.budgetStatus) {
      if (isBudgetBlocked(key, policy.budgetStatus) && entry.reasons?.some((r) => /token plan credit exhausted|token plan usage limit|\b2056\b/i.test(r))) sharedCreditExhausted.add(key.split('/')[0]);
    }
  }
  const scored = candidateList.map((c) => ({
    ...c,
    scored: sharedCreditExhausted.has(c.provider)
      ? { key: c.key, eligible: false, reason: `provider ${c.provider} shared credit exhausted`, tier: 9, score: Infinity, rawCostUsd: 0, effectiveCostUsd: 0 }
      : scoreCandidate({
        key: c.key ?? `${c.provider}/${c.model}`,
        provider: c.provider, model: c.model, isFree: c.isFree,
        price: c.price, contextWindowTokens: c.contextWindowTokens,
        health: c.health, task, policy,
      }),
  }));
  const eligible = scored.filter((c) => c.scored.eligible).sort((a, b) =>
    (a.scored.tier - b.scored.tier) || (a.scored.score - b.scored.score) || a.scored.key.localeCompare(b.scored.key));
  const rejected = scored
    .filter((c) => c !== eligible[0])
    .map((c) => ({
      key: c.key ?? `${c.provider}/${c.model}`,
      reason: c.scored.eligible
        ? `not chosen — ${c.scored.tier > (eligible[0]?.scored.tier ?? 0) ? 'higher cost tier' : 'costlier or slower'}`
        : c.scored.reason,
      eligible: c.scored.eligible,
    }));

  if (!eligible.length) {
    return { chosen: null, rationale: `no eligible model for this task (${rejected.map((r) => `${r.key}: ${r.reason}`).join('; ') || 'no candidates'})`, rejected };
  }
  const best = eligible[0];
  const label = best.scored.tierName ?? (best.isFree ? 'free' : 'paid');
  const cost = best.price?.priceKnown === false && !best.isFree ? 'unpriced' : `$${best.scored.effectiveCostUsd.toFixed(4)} per call`;
  const parts = [`${best.key}: ${label}, ${best.health?.state ?? 'unknown'}, ${cost}, ${((Number(best.health?.avgLatencyMs) || 0) / 1000).toFixed(1)}s avg`];
  const cheaperRejected = rejected.filter((r) => !r.eligible && /cap|budget|shape|pinned/i.test(r.reason));
  if (cheaperRejected.length) parts.push(`rejected cheaper option ${cheaperRejected.map((r) => `${r.key} (${r.reason})`).join(', ')}`);
  return { chosen: { ...best, ...best.scored }, rationale: parts.join(' — '), rejected };
}

/**
 * Build a priced catalog keyed `provider/model` from the provider depot and what was observed.
 *
 * The depot holds T1-sourced prices per model id; the ZCode lanes hold the provider -> model
 * mapping. A model we have used but cannot price is kept and marked `priceKnown: false`, so the
 * router can still use it but never claims a cost for it.
 *
 * @param {{depotCatalog?: Object, observed?: Iterable<string>}} input
 * @returns {Map<string, {isFree: boolean, inputPerMillion: number, outputPerMillion: number,
 *   contextWindowTokens: number|null, priceKnown: boolean, source: string}>}
 */
export function buildCatalog(input = {}) {
  const depot = input.depotCatalog || null;
  const sources = depot?.sources || {};
  /** @type {Map<string, any>} */
  const priceIndex = new Map();
  const notePrice = (id, row, source) => {
    if (!id) return;
    const priceIn = Number(row.priceIn);
    const priceOut = Number(row.priceOut);
    if (!Number.isFinite(priceIn) && !Number.isFinite(priceOut)) return;
    const existing = priceIndex.get(id);
    const candidate = {
      inputPerMillion: Number.isFinite(priceIn) ? priceIn : (existing?.inputPerMillion ?? 0),
      outputPerMillion: Number.isFinite(priceOut) ? priceOut : (existing?.outputPerMillion ?? 0),
      contextWindowTokens: Number(row.contextLength) || existing?.contextWindowTokens || null,
      free: row.free === true || (Number.isFinite(priceIn) && priceIn === 0 && Number.isFinite(priceOut) && priceOut === 0),
      source,
    };
    // The cheapest cited price wins, so a T1 row beats an aggregate row on the same id.
    if (!existing || (candidate.inputPerMillion + candidate.outputPerMillion) < (existing.inputPerMillion + existing.outputPerMillion)) {
      priceIndex.set(id, candidate);
    }
  };
  for (const [sourceId, source] of Object.entries(sources)) {
    for (const row of source?.models || []) {
      if (row?.providerId && Array.isArray(row.models)) continue; // a lane row, not a model row
      notePrice(row?.id, row || {}, sourceId);
    }
  }

  /** @type {Map<string, any>} */
  const catalog = new Map();
  const add = (key, modelId, source) => {
    if (!key || catalog.has(key)) return;
    const price = priceIndex.get(modelId);
    const inputPerMillion = price?.inputPerMillion ?? 0;
    const outputPerMillion = price?.outputPerMillion ?? 0;
    const priceKnown = !!price;
    catalog.set(key, {
      isFree: price ? !!price.free : false,
      inputPerMillion,
      outputPerMillion,
      contextWindowTokens: price?.contextWindowTokens ?? null,
      priceKnown,
      source: price ? `${price.source}:${modelId}` : `observed:${modelId}`,
    });
  };

  for (const source of Object.values(sources)) {
    for (const row of source?.models || []) {
      if (!row?.providerId || !Array.isArray(row.models)) continue;
      if (row.enabled === false) continue;
      for (const modelId of row.models) add(`${row.providerId}/${modelId}`, modelId, 'depot');
    }
  }
  for (const key of input.observed || []) {
    const modelId = String(key).split('/').slice(1).join('/');
    add(String(key), modelId, 'observed');
  }
  return catalog;
}

/**
 * Pick a route different from `avoidKey` among the eligible candidates, preferring a free
 * healthy one. Returns null when none exists.
 *
 * @param {Object} decision  Result of {@link routeTask}.
 * @param {string} avoidKey  The key to avoid (the current model).
 * @param {Array<Object>} candidates  The candidate list passed to routeTask.
 * @param {Object} health    Map of key → health record.
 * @param {Object} task      Task profile.
 * @param {Policy} policy
 * @returns {string|null}
 */
function otherRouteKey(decision, avoidKey, candidates, health, task, policy) {
  const eligibles = candidates.filter((c) => {
    const scored = scoreCandidate({
      key: c.key, provider: c.provider, model: c.model, isFree: c.isFree, price: c.price,
      contextWindowTokens: c.contextWindowTokens, health: c.health, task, policy,
    });
    return scored.eligible && c.key !== avoidKey;
  });
  eligibles.sort((a, b) => {
    const sa = scoreCandidate({ key: a.key, provider: a.provider, model: a.model, isFree: a.isFree, price: a.price, contextWindowTokens: a.contextWindowTokens, health: a.health, task, policy });
    const sb = scoreCandidate({ key: b.key, provider: b.provider, model: b.model, isFree: b.isFree, price: b.price, contextWindowTokens: b.contextWindowTokens, health: b.health, task, policy });
    return (sa.tier - sb.tier) || (sa.score - sb.score);
  });
  return eligibles[0]?.key ?? null;
}

/**
 * Plan model moves for a set of agents.
 *
 * @param {{agents: Array<{name:string, model:string}>, usage: Array<Object>|Map<string,Object>,
 *          catalog: Object, policy?: Policy, now?: number, task?: Object}} input
 * @returns {{routes: Array<Object>, skipped: Array<{agent:string, reason:string}>}}
 */
export function planRoutes(input) {
  const { agents = [], catalog = {}, policy = DEFAULT_POLICY, now = Date.now(), task } = input || {};
  const budgetStatus = policy.budgetStatus ?? new Map();
  const stats = input?.usage instanceof Map ? input.usage : summarizeUsage(input?.usage ?? [], { now, windowMs: policy.windowMs });
  const health = new Map();
  for (const [key, s] of stats) health.set(key, classifyHealth(s));

  // Shared token-plan credit is provider-wide; a healthy sibling is not a safe alternative.
  const creditExhaustedProviders = new Set();
  if (policy.budgetStatus instanceof Map) {
    for (const [key, entry] of policy.budgetStatus) {
      if (isBudgetBlocked(key, policy.budgetStatus) && entry.reasons?.some((r) => /token plan credit exhausted|token plan usage limit|\b2056\b/i.test(r))) creditExhaustedProviders.add(key.split('/')[0]);
    }
  }
  for (const [key, s] of stats) {
    const creditError = (s.errors ?? []).some((e) => /token plan usage limit|usage limit reached|(?:^|\D)2056(?:\D|$)|purchase credits|upgrade your token plan/i.test(`${e.errorType} ${e.errorCode} ${e.errorMessage}`));
    if (creditError && s.lastErrorAt && s.lastErrorAt >= (s.lastCompletedAt || 0)) creditExhaustedProviders.add(key.split('/')[0]);
  }
  const routePolicy = { ...policy, now, creditExhaustedProviders };
  const catalogEntries = Object.entries(catalog || {});
  const routes = [];
  const skipped = [];

  for (const agent of agents) {
    const name = agent?.name ?? '(unnamed)';
    const from = agent?.model ?? '';
    if (!from) { skipped.push({ agent: name, reason: 'no model pinned' }); continue; }
    // Budget-blocked overrides even an owner pin: a dead model is not a pin to keep.
    const budgetBlocked = policy.respectBudget !== false && isBudgetBlocked(from, policy.budgetStatus);
    if (Array.isArray(policy.pinnedModels) && policy.pinnedModels.includes(from) && !budgetBlocked && !(policy.tieredSelector?.enabled && (creditExhaustedProviders.has(from.split('/')[0]) || ['capped', 'budget-blocked', 'broken'].includes(health.get(from)?.state)))) {
      skipped.push({ agent: name, reason: `model pinned by owner (${from})` });
      continue;
    }
    // An agent on `inherit` follows whatever the session model happens to be. That is the
    // failure this router exists to stop: five lanes once died together on one inherited model.
    const inherits = from === 'inherit';
    // A pair the provider refuses is the failure this router exists to prevent: the model is fine,
    // the LEVEL is not. Measured 2026-11-05: every named-agent spawn on this machine failed with
    // `reasoning-level-not-supported` because the roster pinned `thoughtLevel: max`, and a model
    // the provider refuses at one level still answers at another. So the repair keeps the model
    // and moves the level; it never sends a working model away over a word.
    const currentLevel = String(agent.thoughtLevel ?? '').toLowerCase() || null;
    const forbiddenLevels = new Set((policy.forbiddenLevels ?? []).map((l) => String(l).toLowerCase()));
    const observedRejected = Array.isArray(stats.get(from)?.rejectedLevels) ? stats.get(from).rejectedLevels : [];
    const declaredLevels = policy.declaredLevels instanceof Map ? policy.declaredLevels.get(from) : undefined;
    const levelChoice = chooseReasoningLevel({ key: from, stats, policy, declaredLevels });
    const levelRejected = Boolean(currentLevel) && (forbiddenLevels.has(currentLevel) || observedRejected.includes(currentLevel));
    if (levelRejected && (!policy.tieredSelector?.enabled || (health.get(from)?.state === 'healthy' && !budgetBlocked && !creditExhaustedProviders.has(from.split('/')[0])))) {
      if (!levelChoice.level) {
        skipped.push({ agent: name, reason: `reasoning level ${currentLevel} is refused by ${from} and no usable level is known` });
        continue;
      }
      routes.push({
        agent: name,
        from,
        to: from,
        thoughtLevel: levelChoice.level,
        levelOnly: true,
        inherited: inherits,
        reason: `reasoning level ${currentLevel} is refused by ${from}; the same model answers at ${levelChoice.level} (${levelChoice.source})`,
        currentState: classifyHealth(stats.get(from) ?? { completed: 0, error: 0, cancelled: 0, total: 0, errors: [] }).state,
        expectedSavingUsd: 0,
        expectedLatencyMs: Number(classifyHealth(stats.get(from) ?? { completed: 0, error: 0, cancelled: 0, total: 0, errors: [] }).avgLatencyMs ?? 0),
      });
      continue;
    }
    if (!inherits && !catalogEntries.some(([key]) => key === from)) {
      skipped.push({ agent: name, reason: `current model ${from} is not in the catalog` });
      continue;
    }
    const agentTask = agent.task ?? task ?? DEFAULT_POLICY.task;
    const candidates = catalogEntries.map(([key, price]) => {
      const stat = stats.get(key);
      return {
        key, provider: key.split('/')[0], model: key.split('/').slice(1).join('/'),
        isFree: !!price?.isFree, price,
        contextWindowTokens: price?.contextWindowTokens,
        health: health.get(key) ?? classifyHealth({ completed: 0, error: 0, cancelled: 0, total: 0, errors: [] }),
      };
    });
    const decision = routeTask({ task: agentTask, policy: routePolicy, candidates });
    const current = candidates.find((c) => c.key === from);
    const currentScored = inherits
      ? { eligible: false, reason: 'inherits the session model', tier: 9, score: Infinity, rawCostUsd: 0, effectiveCostUsd: 0 }
      : scoreCandidate({ key: from, provider: current?.provider, model: current?.model, isFree: current?.isFree, price: current?.price, contextWindowTokens: current?.contextWindowTokens, health: current?.health, task: agentTask, policy: routePolicy });

    // Provider-level budget-block contagion (F03): when one model on a provider returns
    // 2056 / token-plan-exhausted, every same-provider sibling shares that credit pool and
    // must not be kept as a "healthy pin". Credit exhaustion on one lane killed five lanes
    // at once; suppressing siblings prevents the repeat.
    const currentProviderCreditExhausted = current && creditExhaustedProviders.has(current.provider);

    if (!decision.chosen) {
      skipped.push({ agent: name, reason: currentProviderCreditExhausted
        ? `provider ${current.provider} credit exhausted — no safe alternative`
        : `no eligible alternative in the catalog (${from} is ${currentScored.reason || current?.health?.state})` });
      continue;
    }
    // Provider-level credit exhaustion (F03): when one model on a provider returns
    // 2056 / token-plan-exhausted, every same-provider sibling shares that credit pool.
    // A healthy pin on an exhausted provider is not auto-rerouted — it is skipped pending
    // review. A model that is itself budget-blocked must be rerouted, excluding siblings.
    if (currentProviderCreditExhausted) {
      if (current?.health?.state === 'budget-blocked') {
        const safeCandidates = candidates.filter((c) => c.provider !== current.provider);
        const safeDecision = routeTask({ task: agentTask, policy: routePolicy, candidates: safeCandidates });
        if (!safeDecision.chosen) {
          skipped.push({ agent: name, reason: `provider ${current.provider} credit exhausted — no safe alternative` });
          continue;
        }
        routes.push({
          agent: name,
          from,
          to: safeDecision.chosen.key,
          thoughtLevel: chooseReasoningLevel({ key: safeDecision.chosen.key, stats, policy, declaredLevels: policy.declaredLevels instanceof Map ? policy.declaredLevels.get(safeDecision.chosen.key) : undefined }).level,
          inherited: inherits,
          reason: `provider ${current.provider} credit exhausted — sibling ${from} hit token plan limit`,
          currentState: 'budget-blocked',
          expectedSavingUsd: 0,
          expectedLatencyMs: Number(safeDecision.chosen.health?.avgLatencyMs ?? 0),
        });
        continue;
      }
      skipped.push({
        agent: name,
        reason: `provider ${current.provider} credit exhausted — sibling ${from} hit token plan limit, pin kept pending review`,
      });
      continue;
    }
    if (decision.chosen.key === from) {
      skipped.push({ agent: name, reason: `already on the best route (${from})` });
      continue;
    }
    if (!currentProviderCreditExhausted && currentScored.eligible && currentScored.tier <= decision.chosen.tier && currentScored.score <= decision.chosen.score) {
      skipped.push({ agent: name, reason: `already on the best route (${from})` });
      continue;
    }
    // Budget-blocked overrides a healthy pin: route away regardless of "healthy pin kept",
    // even when the owner pinned it. A dead model is not a pin to keep.
    if (budgetBlocked && decision.chosen && current?.health?.state === 'healthy') {
      routes.push({
        agent: name,
        from,
        to: decision.chosen.key,
        thoughtLevel: chooseReasoningLevel({ key: decision.chosen.key, stats, policy, declaredLevels: policy.declaredLevels instanceof Map ? policy.declaredLevels.get(decision.chosen.key) : undefined }).level,
        inherited: inherits,
        reason: `budget blocked — ${current?.health?.reasons?.join('; ') || 'provider credit exhausted / model not listed / provider disabled'}`,
        currentState: 'budget-blocked',
        expectedSavingUsd: 0,
        expectedLatencyMs: Number(decision.chosen.health?.avgLatencyMs ?? 0),
      });
      continue;
    }
    // A healthy explicit pin is a decision somebody already made. The router re-routes a model
    // that is blocked, capped or broken; it does not second-guess a working one unless the
    // policy explicitly asks for continuous optimisation. A credit-exhausted provider voids
    // every pin on it — siblings of a 2056 model are not safe just because they have not
    // errored yet in this window.
    if (!inherits && !currentProviderCreditExhausted && currentScored.eligible && current?.health?.state === 'healthy' && !policy.optimizeHealthy) {
      skipped.push({ agent: name, reason: `healthy pin kept (${from}) — set optimizeHealthy to revisit` });
      continue;
    }
    routes.push({
      agent: name,
      from,
      to: decision.chosen.key,
      thoughtLevel: chooseReasoningLevel({ key: decision.chosen.key, stats, policy, declaredLevels: policy.declaredLevels instanceof Map ? policy.declaredLevels.get(decision.chosen.key) : undefined }).level,
      inherited: inherits,
      reason: inherits ? `inherits the session model — ${decision.rationale}` : decision.rationale,
      currentState: current?.health?.state ?? (inherits ? 'inherited' : 'unknown'),
      expectedSavingUsd: Number((Math.max(0, currentScored.rawCostUsd - decision.chosen.rawCostUsd)).toFixed(6)),
      expectedLatencyMs: Number(decision.chosen.health?.avgLatencyMs ?? 0),
    });
  }
	  return { routes, skipped };
	}

	/**
	 * Plan model moves with budget pre-screening: filters out budget-blocked current models and
	 * routes them to the best funded alternative. Wraps planRoutes with a budget-aware pass.
	 *
	 * @param {{agents: Array<{name:string, model:string}>, usage: Array<Object>|Map<string,Object>,
	 *          catalog: Object, budgetStatus?: Map<string,any>, policy?: Policy, now?: number,
	 *          task?: Object}} input
	 * @returns {{routes: Array<Object>, skipped: Array<{agent:string, reason:string}>}}
	 */
	export function budgetPlanRoutes(input) {
	  const { budgetStatus, policy = DEFAULT_POLICY, ...rest } = input || {};
	  const effectivePolicy = {
	    ...policy,
	    budgetStatus: budgetStatus ?? new Map(),
	    respectBudget: policy.respectBudget !== false,
	  };
	  return planRoutes({ ...rest, policy: effectivePolicy });
	}
