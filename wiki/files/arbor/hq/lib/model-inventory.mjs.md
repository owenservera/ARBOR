# File: hq/lib/model-inventory.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/model-inventory.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8125 B |
| Lines | 120 |
| Hash | df95ffd92182 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MODEL_INVENTORY_SCHEMA | const | 10 | yes | export const MODEL_INVENTORY_SCHEMA = &#39;hq.model-inventory/1&#39;; |
| DEFAULT_WINDOW_MS | const | 11 | no | const DEFAULT_WINDOW_MS = 5 * 60 * 60 * 1000; |
| DEFAULT_STALE_MS | const | 12 | no | const DEFAULT_STALE_MS = 60 * 60 * 1000; |
| timestamp | function | 14 | no | function timestamp(value) { |
| time | const | 15 | no | const time = typeof value === &#39;number&#39; ? value : typeof value === &#39;string&#39; ? Date.parse(value) : NaN; |
| provenance | function | 19 | no | function provenance(at, source, now, maxAgeMs, failed = false) { |
| ms | const | 20 | no | const ms = timestamp(at); |
| stale | const | 21 | no | const stale = ms === null \|\| ms &gt; now \|\| now - ms &gt; maxAgeMs; |
| buildModelInventorySnapshot | function | 42 | yes | export function buildModelInventorySnapshot({ providerConfig, configObservedAt = null, depotCatalog, usageRows = [], quotaEvidence = [], now, windowMs = DEFAULT_WINDOW_MS, staleAfterMs = DEFAULT_STAL… |
| rules | const | 47 | no | const rules = providerConfig?.config?.providerConfigRules?.providerRules; |
| modelRules | const | 48 | no | const modelRules = providerConfig?.config?.modelConfigRules?.providerModelRules; |
| declared | const | 49 | no | const declared = readDeclaredReasoningLevels(providerConfig); |
| recent | const | 50 | no | const recent = (Array.isArray(usageRows) ? usageRows : []).filter((row) =&gt; Number.isFinite(row?.started_at) &amp;&amp; row.started_at &lt;= now &amp;&amp; row.started_at &gt;= now - windowMs); |
| usage | const | 52 | no | const usage = summarizeUsage(recent, { now, windowMs }); |
| budget | const | 53 | no | const budget = budgetStatusFromUsage(recent, providerConfig, { now, windowMs, catalog: depotCatalog }); |
| configEvidence | const | 54 | no | const configEvidence = provenance(configObservedAt, &#39;provider_config&#39;, now, staleAfterMs); |
| pricingEvidence | const | 55 | no | const pricingEvidence = provenance(depotCatalog?.refreshedAt, &#39;depotCatalog&#39;, now, staleAfterMs); |
| enabledRules | const | 56 | no | const enabledRules = (Array.isArray(rules) ? rules : []).filter((rule) =&gt; rule?.enabled === true &amp;&amp; typeof rule.providerId === &#39;string&#39; &amp;&amp; rule.providerId); |
| configured | const | 57 | no | const configured = enabledRules.map((rule) =&gt; { const ids = [rule.config?.personalModelIds, rule.config?.modelOrder] .flatMap((list) =&gt; Array.isArray(list) ? list : []) .filter((id) =&gt; typeof id === … |
| ids | const | 58 | no | const ids = [rule.config?.personalModelIds, rule.config?.modelOrder] |
| keys | const | 68 | no | const keys = configured.flatMap((lane) =&gt; lane.modelIds.map((id) =&gt; `${lane.id}/${id}`)); |
| prices | const | 69 | no | const prices = buildCatalog({ depotCatalog, observed: keys }); |
| remaining | function | 71 | no | function remaining(providerId, modelId) { |
| matches | const | 73 | no | const matches = (Array.isArray(quotaEvidence) ? quotaEvidence : []).filter((entry) =&gt; entry?.providerId === providerId &amp;&amp; (modelId === null ? entry.modelId == null : entry.modelId === modelId)); |
| latest | const | 75 | no | const latest = matches.sort((a, b) =&gt; (timestamp(b.observedAt) ?? -1) - (timestamp(a.observedAt) ?? -1))[0]; |
| source | const | 76 | no | const source = latest?.source === &#39;provider-direct&#39; ? &#39;provider-direct&#39; : &#39;none&#39;; |
| evidence | const | 77 | no | const evidence = provenance(latest?.observedAt, source, now, staleAfterMs, latest?.failed); |
| valid | const | 78 | no | const valid = latest?.trusted === true &amp;&amp; source === &#39;provider-direct&#39; &amp;&amp; !evidence.stale &amp;&amp; !evidence.failed &amp;&amp; |
| providers | const | 84 | no | const providers = configured.map((lane) =&gt; { const models = lane.modelIds.map((id) =&gt; { const key = `${lane.id}/${id}`; const stats = usage.get(key); const lastAt = recent.reduce((latest, row) =&gt; row… |
| models | const | 85 | no | const models = lane.modelIds.map((id) =&gt; { const key = `${lane.id}/${id}`; const stats = usage.get(key); const lastAt = recent.reduce((latest, row) =&gt; row.provider_id === lane.id &amp;&amp; row.model_id === … |
| key | const | 86 | no | const key = `${lane.id}/${id}`; |
| stats | const | 87 | no | const stats = usage.get(key); |
| lastAt | const | 88 | no | const lastAt = recent.reduce((latest, row) =&gt; row.provider_id === lane.id &amp;&amp; row.model_id === id ? Math.max(latest, row.started_at) : latest, -1); |
| observed | const | 89 | no | const observed = provenance(lastAt &lt; 0 ? null : lastAt, &#39;model_usage&#39;, now, staleAfterMs); |
| price | const | 90 | no | const price = prices.get(key); |
| status | const | 91 | no | const status = budget.get(key); |
| listedInProviderRule | const | 95 | no | const listedInProviderRule = [lane.config?.personalModelIds, lane.config?.modelOrder] |
| health | const | 97 | no | const health = classifyHealth(stats).state; |
| budgetState | const | 98 | no | const budgetState = !listedInProviderRule &amp;&amp; status?.budgetState === &#39;blocked&#39; &amp;&amp; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./model-router.mjs | import | 7 | [hq/lib/model-router.mjs](./model-router.mjs.md) |
| ./model-budget.mjs | import | 8 | [hq/lib/model-budget.mjs](./model-budget.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/spawn.mjs](../bin/spawn.mjs.md) | ../lib/model-inventory.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Offline unified model inventory and provider budget evidence snapshot for context consumers. |
| 3 | owner | hq-agent | — | hq-agent |
| 4 | task | — | — | model-inventory-phase-1 |
| 5 | invariant | — | — | Configured enabled lanes define inventory; usage never creates a selectable lane or proves remaining quota. |

## Excerpt

```javascript
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
```

_First 80 of 121 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
