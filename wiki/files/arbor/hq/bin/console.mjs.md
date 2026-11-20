# File: hq/bin/console.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/bin/console.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8502 B |
| Lines | 164 |
| Hash | ef6307a27967 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REPO_ROOT | const | 22 | no | const REPO_ROOT = resolve(import.meta.url, &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| CONFIG_PATH | const | 23 | no | const CONFIG_PATH = process.env.VIVIM_PROVIDER_CONFIG ?? &#39;C:/Users/VIVIM.inc/.zcode/v2/provider_config.json&#39;; |
| USAGE_DB_PATH | const | 26 | no | const USAGE_DB_PATH = process.env.VIVIM_USAGE_DB ?? join( process.env.USERPROFILE \|\| process.env.HOME \|\| &#39;&#39;, &#39;.zcode&#39;, &#39;cli&#39;, &#39;db&#39;, &#39;db.sqlite&#39;, ); |
| loadProviderRules | function | 31 | no | function loadProviderRules() { |
| text | variable | 32 | no | let text; |
| config | variable | 35 | no | let config; |
| rules | const | 38 | no | const rules = config?.config?.providerConfigRules?.providerRules ?? []; |
| fingerprint | function | 43 | no | function fingerprint(key) { |
| buildRows | function | 49 | no | function buildRows(rules, usageRows, now) { |
| stats | const | 50 | no | const stats = usageRows.length ? summarizeUsage(usageRows, { now }) : new Map(); |
| budgetStatus | const | 51 | no | const budgetStatus = budgetStatusFromUsage ? budgetStatusFromUsage(usageRows, { now }) : new Map(); |
| rows | const | 54 | no | const rows = []; |
| providerId | const | 57 | no | const providerId = String(rule?.providerId ?? rule?.id ?? &#39;unknown&#39;); |
| providerName | const | 58 | no | const providerName = String(rule?.providerName ?? providerId); |
| providerEnabled | const | 59 | no | const providerEnabled = rule?.enabled !== false; |
| cfg | const | 60 | no | const cfg = rule?.config ?? {}; |
| modelIds | const | 61 | no | const modelIds = Array.isArray(cfg?.personalModelIds) ? cfg.personalModelIds : []; |
| access | const | 62 | no | const access = cfg?.access ?? {}; |
| keyFingerprint | const | 63 | no | const keyFingerprint = fingerprint(access?.apiKey ?? &#39;&#39;); |
| key | const | 77 | no | const key = `${providerId}/${modelId}`; |
| statsRec | const | 78 | no | const statsRec = stats.get(key); |
| health | const | 79 | no | const health = statsRec ? classifyHealth(statsRec) : { state: &#39;unproven&#39;, reliability: 0, avgLatencyMs: 0, reasons: [&#39;no observed usage&#39;] }; |
| budget | const | 80 | no | const budget = budgetStatus.get(key) ?? { state: &#39;unverified&#39;, reasons: [&#39;no usage data&#39;] }; |
| modelRule | const | 83 | no | const modelRule = Array.isArray(cfg?.providerModelRules) ? cfg.providerModelRules.find((r) =&gt; String(r?.modelId ?? r?.id) === modelId) : null; |
| isFree | const | 86 | no | const isFree = /(:free\|-free)$/i.test(modelId) \|\| Boolean(modelRule?.config?.properties?.free === true); |
| pa | const | 97 | no | const pa = a.provider.localeCompare(b.provider); |
| renderRow | function | 104 | no | function renderRow(r) { |
| h | const | 105 | no | const h = r.health; |
| b | const | 106 | no | const b = r.budget; |
| enabledTag | const | 107 | no | const enabledTag = r.enabled ? &#39;EN&#39; : &#39;DIS&#39;; |
| listedTag | const | 108 | no | const listedTag = r.modelListed ? &#39;LIST&#39; : &#39;NOLIST&#39;; |
| freeTag | const | 109 | no | const freeTag = r.isFree ? &#39;free&#39; : &#39;paid&#39;; |
| healthTag | const | 110 | no | const healthTag = h.state.toUpperCase().padEnd(16); |
| budgetTag | const | 111 | no | const budgetTag = b.state.toUpperCase().padEnd(9); |
| rel | const | 112 | no | const rel = h.reliability &gt; 0 ? `${(h.reliability * 100).toFixed(0)}%` : &#39;—&#39;; |
| lat | const | 113 | no | const lat = h.avgLatencyMs &gt; 0 ? `${(h.avgLatencyMs / 1000).toFixed(1)}s` : &#39;—&#39;; |
| reason | const | 114 | no | const reason = h.reasons?.slice(0, 2).join(&#39;; &#39;) \|\| b.reasons?.slice(0, 2).join(&#39;; &#39;) \|\| &#39;—&#39;; |
| renderConsole | function | 119 | no | function renderConsole(rows) { |
| lines | const | 120 | no | const lines = []; |
| blocked | const | 129 | no | const blocked = rows.filter((r) =&gt; r.health.state === &#39;budget-blocked&#39; \|\| r.health.state === &#39;capped&#39; \|\| r.health.state === &#39;broken&#39;); |
| healthy | const | 130 | no | const healthy = rows.filter((r) =&gt; r.health.state === &#39;healthy&#39;); |
| main | function | 140 | no | async function main() { |
| usageRows | variable | 146 | no | let usageRows = []; |
| db | const | 148 | no | const db = new DatabaseSync(USAGE_DB_PATH, { readOnly: true }); |
| cutoff | const | 149 | no | const cutoff = Date.now() - 5 * 60 * 60 * 1000; |
| now | const | 156 | no | const now = Date.now(); |
| rows | const | 157 | no | const rows = buildRows(rules, usageRows, now); |
| scriptPath | const | 161 | no | const scriptPath = process.argv[1] ?? &#39;&#39;; |
| buildRows | export | 164 | yes | export { buildRows, renderConsole, renderRow, loadProviderRules, fingerprint } |
| fingerprint | export | 164 | yes | export { buildRows, renderConsole, renderRow, loadProviderRules, fingerprint } |
| loadProviderRules | export | 164 | yes | export { buildRows, renderConsole, renderRow, loadProviderRules, fingerprint } |
| renderConsole | export | 164 | yes | export { buildRows, renderConsole, renderRow, loadProviderRules, fingerprint } |
| renderRow | export | 164 | yes | export { buildRows, renderConsole, renderRow, loadProviderRules, fingerprint } |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 15 | external |
| node:path | import | 16 | external |
| node:sqlite | import | 17 | external |
| ../lib/model-router.mjs | import | 18 | [hq/lib/model-router.mjs](../lib/model-router.mjs.md) |
| ../lib/model-router.mjs | import | 19 | [hq/lib/model-router.mjs](../lib/model-router.mjs.md) |
| ../lib/model-budget.mjs | import | 20 | [hq/lib/model-budget.mjs](../lib/model-budget.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](./hq.mjs.md) | ./console.mjs |
| [hq/bin/hq.mjs](./hq.mjs.md) | ./console.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 4 | context | — | — | Multi-model console: one-line health dashboard for every model in provider_config.json. |
| 8 | owner | hq-agent | — | hq-agent |
| 9 | task | — | — | model-console |
| 10 | invariant | — | — | read-only: never mutates provider_config.json, model budget, or agent definitions. |
| 11 | invariant | — | — | no API keys or secrets are printed to stdout. |
| 12 | see | — | hq/lib/model-router.mjs | hq/lib/model-router.mjs · hq/lib/model-budget.mjs · hq/lib/revive-lane.mjs |

## Excerpt

```javascript
#!/usr/bin/env node
// @ts-check
/**
 * @hq:context Multi-model console: one-line health dashboard for every model in provider_config.json.
 *   Reads provider_config.json (read-only), the model budget table, and `hq team` output.
 *   Shows provider, model ID, enabled, health state, budget state, last error, and route status.
 *   No secrets are printed — keys are named by fingerprint only.
 * @hq:owner hq-agent
 * @hq:task model-console
 * @hq:invariant read-only: never mutates provider_config.json, model budget, or agent definitions.
 * @hq:invariant no API keys or secrets are printed to stdout.
 * @hq:see hq/lib/model-router.mjs · hq/lib/model-budget.mjs · hq/lib/revive-lane.mjs
 */

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { classifyHealth } from '../lib/model-router.mjs';
import { summarizeUsage } from '../lib/model-router.mjs';
import { budgetStatusFromUsage } from '../lib/model-budget.mjs';

const REPO_ROOT = resolve(import.meta.url, '..', '..', '..');
const CONFIG_PATH = process.env.VIVIM_PROVIDER_CONFIG ?? 'C:/Users/VIVIM.inc/.zcode/v2/provider_config.json';
// model_usage lives in the ZCode session store, NOT the HQ index. Reading the wrong DB
// made every model read UNPROVEN while the real table held thousands of completions.
const USAGE_DB_PATH = process.env.VIVIM_USAGE_DB ?? join(
  process.env.USERPROFILE || process.env.HOME || '', '.zcode', 'cli', 'db', 'db.sqlite',
);

/** Parse provider_config.json and return the provider rules array. */
function loadProviderRules() {
  let text;
  try { text = readFileSync(CONFIG_PATH, 'utf8'); }
  catch (err) { return { ok: false, error: `cannot read provider_config.json: ${/** @type {any} */ (err).message}`, rules: [] }; }
  let config;
  try { config = JSON.parse(text); }
  catch (err) { return { ok: false, error: `provider_config.json is not valid JSON: ${/** @type {any} */ (err).message}`, rules: [] }; }
  const rules = config?.config?.providerConfigRules?.providerRules ?? [];
  return { ok: true, rules, raw: config };
}

/** Fingerprint an API key: first 4 + last 4 hex, never the full value. */
function fingerprint(key) {
  if (typeof key !== 'string' || key.length < 8) return 'unset';
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

/** Build one console row per provider/model combination. */
function buildRows(rules, usageRows, now) {
  const stats = usageRows.length ? summarizeUsage(usageRows, { now }) : new Map();
  const budgetStatus = budgetStatusFromUsage ? budgetStatusFromUsage(usageRows, { now }) : new Map();

  /** @type {Array<{provider:string, providerName:string, enabled:boolean, model:string, modelListed:boolean, isFree:boolean, health:{state:string, reliability:number, avgLatencyMs:number, reasons:string[]}, budget:{state:string, reasons:string[]}, key:string, fingerprint:string}>} */
  const rows = [];

  for (const rule of rules) {
    const providerId = String(rule?.providerId ?? rule?.id ?? 'unknown');
    const providerName = String(rule?.providerName ?? providerId);
    const providerEnabled = rule?.enabled !== false;
    const cfg = rule?.config ?? {};
    const modelIds = Array.isArray(cfg?.personalModelIds) ? cfg.personalModelIds : [];
    const access = cfg?.access ?? {};
    const keyFingerprint = fingerprint(access?.apiKey ?? '');

    if (modelIds.length === 0) {
      rows.push({
        provider: providerId, providerName, enabled: providerEnabled, model: '(none listed)',
        modelListed: false, isFree: false,
        health: { state: 'unproven', reliability: 0, avgLatencyMs: 0, reasons: ['no models listed'] },
        budget: { state: 'unverified', reasons: ['no models to assess'] },
        key: `${providerId}/(none)`, fingerprint: keyFingerprint,
      });
      continue;
    }

    for (const modelId of modelIds) {
      const key = `${providerId}/${modelId}`;
      const statsRec = stats.get(key);
      const health = statsRec ? classifyHealth(statsRec) : { state: 'unproven', reliability: 0, avgLatencyMs: 0, reasons: ['no observed usage'] };
      const budget = budgetStatus.get(key) ?? { state: 'unverified', reasons: ['no usage data'] };
```

_First 80 of 165 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
