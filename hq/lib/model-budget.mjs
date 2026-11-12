/**
 * @hq:context Automated model budget tracking: per-provider/model budget status computed from usage + provider config, for smart routing that never sends to a dead model.
 * @hq:owner hq-agent
 * @hq:task model-budget
 * @hq:invariant this module decides and explains; it never mutates a config, an agent file or a provider. Pure in-memory; no console.log; never prints an API key.
 * @hq:see hq/lib/model-router.mjs
 */

/** Budget/reasoning regexes mirrored from the router's classifyHealth so this module stays self-contained. */
const CAP_RE = /rate[ _-]?limit|usage_limit|cooling down|daily[ _-]?cap|quota|free-models-per-day|token plan usage limit|usage limit reached|\(2056\)/i;
const BUDGET_RE = /insufficient[\s_-]*balance|status=402|payment required|auth_failed|authentication failed|purchase credits|upgrade your token plan/i;
const SHAPE_RE = /unsupported parameter|invalid_request|validation:/i;
const AUTH_RE = /auth_failed|authentication failed/i;

const DEFAULT_WINDOW_MS = 5 * 60 * 60 * 1000;
const MIN_RELIABILITY = 0.5;

/** @typedef {Object} BudgetStatus
 * @property {string} key             "provider/model"
 * @property {string} provider
 * @property {string} model
 * @property {boolean} providerEnabled
 * @property {boolean} modelListed
 * @property {boolean} isFree
 * @property {number} priceInPerMillion
 * @property {number} priceOutPerMillion
 * @property {number} completed
 * @property {number} error
 * @property {number} cancelled
 * @property {number} total
 * @property {string} [lastError]
 * @property {'funded'|'warn'|'blocked'|'unverified'} budgetState
 * @property {string[]} reasons
 */

/** @typedef {Object} CatalogRow
 * @property {string} id
 * @property {number} [priceIn]
 * @property {number} [priceOut]
 * @property {boolean} [free]
 */

/**
 * Coerce a raw usage row's error fields into a normalized error group.
 */
function errorGroup(row) {
  return {
    errorType: row.error_type ?? 'unknown',
    errorCode: row.error_code ?? null,
    errorMessage: row.error_message ?? '',
    count: 1,
  };
}

/**
 * Aggregate usage rows within a time window into one stats record per `provider/model` key.
 * Mirrors the router's summarizeUsage windowing so budget and health agree on what "recent" means.
 *
 * @param {Array<Object>} usageRows
 * @param {number} now
 * @param {number} windowMs
 * @returns {Map<string, Object>}
 */
function aggregateUsage(usageRows, now, windowMs) {
  const floor = now - windowMs;
  /** @type {Map<string, Object>} */
  const stats = new Map();
  for (const row of Array.isArray(usageRows) ? usageRows : []) {
    if (!row || typeof row.started_at !== 'number' || row.started_at < floor) continue;
    const key = `${String(row.provider_id)}/${String(row.model_id)}`;
    let rec = stats.get(key);
    if (!rec) {
      rec = { key, provider: String(row.provider_id), model: String(row.model_id), completed: 0, error: 0, cancelled: 0, total: 0, errors: [], lastError: undefined };
      stats.set(key, rec);
    }
    rec.total += 1;
    if (row.status === 'completed') {
      rec.completed += 1;
    } else if (row.status === 'cancelled') {
      rec.cancelled += 1;
    } else {
      rec.error += 1;
      rec.lastError = String(row.error_message ?? row.error_type ?? 'unknown');
      const group = rec.errors.find((e) => e.errorType === row.error_type && e.errorCode === row.error_code && e.errorMessage === row.error_message);
      if (group) group.count += 1; else rec.errors.push(errorGroup(row));
    }
  }
  return stats;
}

/**
 * Index catalog model rows by id (exact) and by basename (last `/` segment) for tolerant lookup.
 *
 * @param {Object} catalog
 * @returns {Map<string, CatalogRow>}
 */
function indexCatalog(catalog) {
  /** @type {Map<string, CatalogRow>} */
  const index = new Map();
  const sources = catalog && catalog.sources ? catalog.sources : {};
  for (const source of Object.values(sources)) {
    for (const row of source?.models ?? []) {
      if (!row || !row.id) continue;
      const id = String(row.id);
      if (!index.has(id)) index.set(id, row);
      const base = id.split('/').pop();
      if (base && !index.has(base)) index.set(base, row);
    }
  }
  return index;
}

/**
 * Look up a catalog row for a model id.
 * @param {Map<string, CatalogRow>} index
 * @param {string} modelId
 * @returns {CatalogRow|undefined}
 */
function lookupCatalog(index, modelId) {
  if (!index) return undefined;
  return index.get(modelId) || index.get(String(modelId).split('/').pop());
}

/**
 * Classify recent usage into a health state, mirroring the router's classifyHealth budget-relevant rules.
 * @param {Object|null} stats
 * @returns {{state: string, reliability: number, reasons: string[]}}
 */
function classifyHealth(stats) {
  const s = stats || {};
  const completed = Number(s.completed) || 0;
  const error = Number(s.error) || 0;
  const total = Number(s.total) || 0;
  const errors = Array.isArray(s.errors) ? s.errors : [];
  const reliability = completed + error > 0 ? completed / (completed + error) : 0;
  const blob = errors.map((e) => `${e.errorType || ''} ${e.errorCode || ''} ${e.errorMessage || ''}`).join(' \n ');

  if (total === 0) {
    return { state: 'unproven', reliability: 0, reasons: ['no observed usage'] };
  }
  const planCredit = /token plan usage limit|usage limit reached|\(2056\)|(?:^|\D)2056(?:\D|$)|purchase credits|upgrade your token plan/i.test(blob);
  const isBudget = BUDGET_RE.test(blob) || planCredit;
  if (isBudget) {
    return {
      state: 'budget-blocked',
      reliability,
      reasons: [planCredit ? 'token plan credit exhausted — switch provider, do not wait' : 'insufficient balance or auth failure'],
    };
  }
  if (CAP_RE.test(blob)) {
    return { state: 'capped', reliability, reasons: ['daily cap or rate limit observed'] };
  }
  const shapeErrors = errors.filter((e) => SHAPE_RE.test(`${e.errorType} ${e.errorCode} ${e.errorMessage}`)).reduce((sum, e) => sum + e.count, 0);
  if (shapeErrors > 0 && shapeErrors === error && error / total >= 0.25) {
    return { state: 'broken', reliability, reasons: ['rejects our request shape'] };
  }
  if (completed > 0 && reliability >= MIN_RELIABILITY) {
    return { state: 'healthy', reliability, reasons: [] };
  }
  if (completed > 0) {
    return { state: 'unhealthy', reliability, reasons: [`low reliability ${(reliability * 100).toFixed(0)}%`] };
  }
  return { state: 'unproven', reliability, reasons: ['no successful call observed'] };
}

/**
 * Determine whether a catalog row indicates a free model.
 * @param {CatalogRow|undefined} row
 * @returns {boolean}
 */
function isFreeRow(row) {
  if (!row) return false;
  if (row.free === true) return true;
  const priceIn = Number(row.priceIn);
  const priceOut = Number(row.priceOut);
  return Number.isFinite(priceIn) && priceIn === 0 && Number.isFinite(priceOut) && priceOut === 0;
}

/**
 * Build the per-provider/model budget status map from usage rows + provider config.
 *
 * @param {Array<Object>} usageRows    Rows shaped like the ZCode `model_usage` table.
 * @param {Object} providerConfig      Provider config shape { config: { providerConfigRules: { providerRules: [...] } } }.
 * @param {Object} [opts]
 * @param {number} [opts.now]          Now epoch ms (default Date.now).
 * @param {number} [opts.windowMs]     Usage window ms (default 5h).
 * @param {Object} [opts.catalog]      Catalog { sources: { [name]: { models: [...] } } } for free/price lookup.
 * @returns {Map<string, BudgetStatus>}
 */
export function budgetStatusFromUsage(usageRows, providerConfig, opts = {}) {
  const now = Number(opts.now) || Date.now();
  const windowMs = Number.isFinite(opts.windowMs) ? opts.windowMs : DEFAULT_WINDOW_MS;
  const catalogIndex = indexCatalog(opts.catalog);

  const rules = new Map();
  for (const rule of (providerConfig?.config?.providerConfigRules?.providerRules ?? [])) {
    if (rule && rule.providerId) rules.set(String(rule.providerId), rule);
  }

  const stats = aggregateUsage(usageRows, now, windowMs);

  /** @type {Map<string, BudgetStatus>} */
  const out = new Map();

  const consider = (providerId, modelId) => {
    const key = `${String(providerId)}/${String(modelId)}`;
    if (out.has(key)) return;
    const rule = rules.get(String(providerId));
    const providerEnabled = rule ? rule.enabled === true : false;
    const personalIds = rule ? (rule.config && Array.isArray(rule.config.personalModelIds) ? rule.config.personalModelIds : []) : [];
    const modelOrder = rule ? (rule.config && Array.isArray(rule.config.modelOrder) ? rule.config.modelOrder : []) : [];
    const modelListed = personalIds.includes(String(modelId)) || modelOrder.includes(String(modelId));

    const stat = stats.get(key);
    const row = lookupCatalog(catalogIndex, String(modelId));
    const isFree = isFreeRow(row);
    const priceIn = row ? Number(row.priceIn) : 0;
    const priceOut = row ? Number(row.priceOut) : 0;

    const health = classifyHealth(stat);
    const hasAuthFailed = stat && stat.errors.some((e) => AUTH_RE.test(`${e.errorType || ''} ${e.errorMessage || ''}`));

    let budgetState;
    const reasons = [];

    if (!providerEnabled) {
      budgetState = 'blocked';
      reasons.push('provider disabled in provider_config.json');
    } else if (!modelListed) {
      budgetState = 'blocked';
      reasons.push('model not in provider personalModelIds/modelOrder');
    } else if (health.state === 'budget-blocked') {
      if (isFree && hasAuthFailed) {
        budgetState = 'warn';
        reasons.push('free model auth_failed — may recover, route away if a funded alternative exists');
      } else {
        budgetState = 'blocked';
        reasons.push(...health.reasons);
      }
    } else if (health.state === 'capped' || health.state === 'broken') {
      budgetState = 'blocked';
      reasons.push(...health.reasons);
    } else if (health.state === 'healthy') {
      budgetState = 'funded';
      reasons.push('enabled, listed, successful completions with no budget errors');
    } else if (health.state === 'unhealthy' && completedOrZero(stat) === 0 && (Number(stat.error) || 0) > 0) {
      budgetState = 'warn';
      reasons.push('mostly errors, no completions in window — route away if a funded alternative exists');
    } else if (health.state === 'unhealthy') {
      budgetState = 'warn';
      reasons.push(...health.reasons);
    } else if (health.state === 'unproven' && (Number(stat?.error) || 0) > 0 && completedOrZero(stat) === 0) {
      // Errors observed but no successful call: mostly errors, no completions in window.
      budgetState = 'warn';
      reasons.push('errors with no completed call in window — route away if a funded alternative exists');
    } else {
      // unproven (no usage at all)
      budgetState = 'unverified';
      reasons.push('no observed usage — not clearly dead');
    }

    out.set(key, {
      key,
      provider: String(providerId),
      model: String(modelId),
      providerEnabled,
      modelListed,
      isFree,
      priceInPerMillion: Number.isFinite(priceIn) ? priceIn : 0,
      priceOutPerMillion: Number.isFinite(priceOut) ? priceOut : 0,
      completed: Number(stat?.completed) || 0,
      error: Number(stat?.error) || 0,
      cancelled: Number(stat?.cancelled) || 0,
      total: Number(stat?.total) || 0,
      lastError: stat?.lastError,
      budgetState,
      reasons,
    });
  };

  // Keys observed in usage.
  for (const [key, stat] of stats) {
    consider(stat.provider, stat.model);
  }

  // Keys configured in provider config but unused this window (surfaces 'unverified').
  for (const rule of rules.values()) {
    if (rule.enabled !== true) continue;
    const listed = [
      ...(Array.isArray(rule.config?.personalModelIds) ? rule.config.personalModelIds : []),
      ...(Array.isArray(rule.config?.modelOrder) ? rule.config.modelOrder : []),
    ];
    for (const modelId of listed) consider(rule.providerId, modelId);
  }

  return out;
}

function completedOrZero(stat) {
  return stat ? Number(stat.completed) || 0 : 0;
}

/**
 * True when the given key's budget state is 'blocked' (must never be routed to).
 * @param {string} key
 * @param {Map<string, BudgetStatus>} budgetStatusMap
 * @returns {boolean}
 */
export function isBudgetBlocked(key, budgetStatusMap) {
  const entry = budgetStatusMap && budgetStatusMap.get(String(key));
  if (!entry) return false;
  return Boolean(entry.budgetState === 'blocked' || entry.blocked === true);
}

/**
 * Summarize counts across a budget status map.
 * @param {Map<string, BudgetStatus>} budgetStatusMap
 * @returns {{total:number, funded:number, warn:number, blocked:number, unverified:number, blockedKeys:string[], warnKeys:string[]}}
 */
export function summarizeBudget(budgetStatusMap) {
  const summary = { total: 0, funded: 0, warn: 0, blocked: 0, unverified: 0, blockedKeys: [], warnKeys: [] };
  if (!budgetStatusMap) return summary;
  for (const entry of budgetStatusMap.values()) {
    summary.total += 1;
    if (entry.budgetState === 'funded') { summary.funded += 1; }
    else if (entry.budgetState === 'warn') { summary.warn += 1; summary.warnKeys.push(entry.key); }
    else if (entry.budgetState === 'blocked') { summary.blocked += 1; summary.blockedKeys.push(entry.key); }
    else if (entry.budgetState === 'unverified') { summary.unverified += 1; }
  }
  return summary;
}

/**
 * Render a printable table (string lines) of the budget status map for the panel.
 * @param {Map<string, BudgetStatus>} budgetStatusMap
 * @param {Object} [opts]
 * @returns {string[]}
 */
export function renderBudgetTable(budgetStatusMap, opts = {}) {
  const lines = [];
  const showReasons = opts.showReasons !== false;
  const maxReason = Number.isFinite(opts.maxReasonLen) ? opts.maxReasonLen : 60;

  lines.push('Model Budget Status (provider/model — never route to blocked)');
  lines.push('key                           en lst free completed error total   state    reasons');
  lines.push('------------------------------------------------------------ ----------');

  if (!budgetStatusMap || budgetStatusMap.size === 0) {
    lines.push('(no models)');
    return lines;
  }

  const entries = Array.from(budgetStatusMap.values()).sort((a, b) => {
    const order = { blocked: 0, warn: 1, unverified: 2, funded: 3 };
    const oa = order[a.budgetState] ?? 9;
    const ob = order[b.budgetState] ?? 9;
    return oa - ob || a.key.localeCompare(b.key);
  });

  for (const e of entries) {
    const key = String(e.key).padEnd(29).slice(0, 29);
    const en = e.providerEnabled ? 'yes ' : 'no  ';
    const lst = e.modelListed ? 'yes ' : 'no  ';
    const free = e.isFree ? 'yes ' : 'no  ';
    const completed = String(e.completed).padStart(3);
    const error = String(e.error).padStart(5);
    const total = String(e.total).padStart(5);
    const state = String(e.budgetState).padEnd(8);
    let reason = '';
    if (showReasons && e.reasons && e.reasons.length) {
      reason = e.reasons[0];
      if (reason.length > maxReason) reason = reason.slice(0, maxReason - 1) + '…';
    }
    lines.push(`${key} ${en} ${lst} ${free} ${completed}   ${error}  ${total}  ${state} ${reason}`);
  }

  const summary = summarizeBudget(budgetStatusMap);
  lines.push('');
  lines.push(`total=${summary.total} funded=${summary.funded} warn=${summary.warn} blocked=${summary.blocked} unverified=${summary.unverified}`);
  return lines;
}
