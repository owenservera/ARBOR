/**
 * @hq:context Offline unified model inventory and provider budget evidence snapshot for context consumers.
 * @hq:owner hq-agent
 * @hq:task model-inventory-phase-1
 * @hq:invariant Configured enabled lanes define inventory; usage never creates a selectable lane or proves remaining quota.
 */
import { buildCatalog, readDeclaredReasoningLevels, summarizeUsage, classifyHealth } from './model-router.mjs';
import { budgetStatusFromUsage } from './model-budget.mjs';

export const MODEL_INVENTORY_SCHEMA = 'hq.model-inventory/1';
const DEFAULT_WINDOW_MS = 5 * 60 * 60 * 1000;
const DEFAULT_STALE_MS = 60 * 60 * 1000;

function timestamp(value) {
  const time = typeof value === 'number' ? value : typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(time) && time >= 0 ? time : null;
}

function provenance(at, source, now, maxAgeMs, failed = false) {
  const ms = timestamp(at);
  const stale = ms === null || ms > now || now - ms > maxAgeMs;
  return { source, observedAt: ms === null ? null : new Date(ms).toISOString(), stale, failed: failed === true };
}

/**
 * Build a read-only, JSON-safe snapshot from already acquired local data. No file reads or provider calls.
 * `quotaEvidence` accepts only independently admitted provider-direct observations with
 * {providerId, modelId?, remaining, unit, observedAt, source:'provider-direct', trusted:true}.
 * Missing, stale, failed, negative, or untrusted observations always yield UNKNOWN.
 * Provider-wide quotas belong to the provider, never to individual model rows.
 * Caller supplies `now` to keep freshness and output deterministic.
 * @param {Object} [options]
 * @param {Object|null} [options.providerConfig] Already acquired provider configuration.
 * @param {string|number|null} [options.configObservedAt] Configuration observation timestamp.
 * @param {Object} [options.depotCatalog] Already acquired pricing catalog.
 * @param {Array<Object>} [options.usageRows] Local model usage records.
 * @param {Array<Object>} [options.quotaEvidence] Provider-direct quota observations.
 * @param {number} options.now Current epoch-millisecond timestamp.
 * @param {number} [options.windowMs] Usage window in milliseconds.
 * @param {number} [options.staleAfterMs] Evidence freshness window in milliseconds.
 */
export function buildModelInventorySnapshot({ providerConfig, configObservedAt = null, depotCatalog, usageRows = [], quotaEvidence = [], now, windowMs = DEFAULT_WINDOW_MS, staleAfterMs = DEFAULT_STALE_MS } = {}) {
  if (!Number.isFinite(now)) throw new TypeError('now must be an epoch-millisecond timestamp');
  if (!Number.isFinite(windowMs) || windowMs < 0 || !Number.isFinite(staleAfterMs) || staleAfterMs < 0) {
    throw new TypeError('freshness windows must be nonnegative milliseconds');
  }
  const rules = providerConfig?.config?.providerConfigRules?.providerRules;
  const modelRules = providerConfig?.config?.modelConfigRules?.providerModelRules;
  const declared = readDeclaredReasoningLevels(providerConfig);
  const recent = (Array.isArray(usageRows) ? usageRows : []).filter((row) =>
    Number.isFinite(row?.started_at) && row.started_at <= now && row.started_at >= now - windowMs);
  const usage = summarizeUsage(recent, { now, windowMs });
  const budget = budgetStatusFromUsage(recent, providerConfig, { now, windowMs, catalog: depotCatalog });
  const configEvidence = provenance(configObservedAt, 'provider_config', now, staleAfterMs);
  const pricingEvidence = provenance(depotCatalog?.refreshedAt, 'depotCatalog', now, staleAfterMs);
  const enabledRules = (Array.isArray(rules) ? rules : []).filter((rule) => rule?.enabled === true && typeof rule.providerId === 'string' && rule.providerId);
  const configured = enabledRules.map((rule) => {
    const ids = [rule.config?.personalModelIds, rule.config?.modelOrder]
      .flatMap((list) => Array.isArray(list) ? list : [])
      .filter((id) => typeof id === 'string' && id);
    for (const modelRule of Array.isArray(modelRules) ? modelRules : []) {
      if (modelRule?.providerId === rule.providerId && modelRule.config?.enabled !== false && typeof modelRule.modelId === 'string' && modelRule.modelId) {
        ids.push(modelRule.modelId);
      }
    }
    return { id: rule.providerId, config: rule.config, modelIds: [...new Set(ids)].sort() };
  }).sort((a, b) => a.id.localeCompare(b.id));
  const keys = configured.flatMap((lane) => lane.modelIds.map((id) => `${lane.id}/${id}`));
  const prices = buildCatalog({ depotCatalog, observed: keys });

  function remaining(providerId, modelId) {
    // An injected claim is not authoritative without explicit trust AND a direct-source tag.
    const matches = (Array.isArray(quotaEvidence) ? quotaEvidence : []).filter((entry) =>
      entry?.providerId === providerId && (modelId === null ? entry.modelId == null : entry.modelId === modelId));
    const latest = matches.sort((a, b) => (timestamp(b.observedAt) ?? -1) - (timestamp(a.observedAt) ?? -1))[0];
    const source = latest?.source === 'provider-direct' ? 'provider-direct' : 'none';
    const evidence = provenance(latest?.observedAt, source, now, staleAfterMs, latest?.failed);
    const valid = latest?.trusted === true && source === 'provider-direct' && !evidence.stale && !evidence.failed &&
      typeof latest.remaining === 'number' && Number.isFinite(latest.remaining) && latest.remaining >= 0 &&
      typeof latest.unit === 'string' && /^[a-z][a-z0-9_-]{0,31}$/i.test(latest.unit);
    return { state: valid ? 'KNOWN' : 'UNKNOWN', value: valid ? latest.remaining : null, unit: valid ? latest.unit : null, evidence };
  }

  const providers = configured.map((lane) => {
    const models = lane.modelIds.map((id) => {
      const key = `${lane.id}/${id}`;
      const stats = usage.get(key);
      const lastAt = recent.reduce((latest, row) => row.provider_id === lane.id && row.model_id === id ? Math.max(latest, row.started_at) : latest, -1);
      const observed = provenance(lastAt < 0 ? null : lastAt, 'model_usage', now, staleAfterMs);
      const price = prices.get(key);
      const status = budget.get(key);
      // The older budget classifier knows only personalModelIds/modelOrder. For a
      // providerModelRule-only lane, override only its synthetic "not listed" block;
      // never erase an observed auth, credit or cap failure on that exact model.
      const listedInProviderRule = [lane.config?.personalModelIds, lane.config?.modelOrder]
        .some((list) => Array.isArray(list) && list.includes(id));
      const health = classifyHealth(stats).state;
      const budgetState = !listedInProviderRule && status?.budgetState === 'blocked' &&
        !['budget-blocked', 'capped', 'broken'].includes(health)
        ? 'unverified' : (status?.budgetState ?? 'unverified');
      return {
        key, providerId: lane.id, modelId: id, enabled: true,
        reasoningLevels: declared.get(key) ?? [],
        pricing: { isFree: price?.priceKnown === true ? price.isFree : null, priceKnown: price?.priceKnown === true,
          inputPerMillion: price?.priceKnown === true ? price.inputPerMillion : null,
          outputPerMillion: price?.priceKnown === true ? price.outputPerMillion : null,
          evidence: price?.priceKnown === true ? pricingEvidence : provenance(null, 'none', now, staleAfterMs) },
        usage: { completed: stats?.completed ?? 0, error: stats?.error ?? 0, cancelled: stats?.cancelled ?? 0,
          total: stats?.total ?? 0, health, evidence: observed },
        budgetState,
        remainingQuota: remaining(lane.id, id),
      };
    });
    return { providerId: lane.id, enabled: true, source: 'provider_config.providerConfigRules',
      configEvidence, models, remainingQuota: remaining(lane.id, null) };
  });
  return { schema: MODEL_INVENTORY_SCHEMA, generatedAt: new Date(now).toISOString(),
    sources: { configuration: 'provider_config.providerConfigRules', history: 'model_usage', pricing: 'depotCatalog' },
    providers, modelCount: keys.length };
}
