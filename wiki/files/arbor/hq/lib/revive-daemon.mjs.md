# File: hq/lib/revive-daemon.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/revive-daemon.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9749 B |
| Lines | 230 |
| Hash | 460af153c170 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| planReviveCycle | function | 59 | yes | export function planReviveCycle(input = {}) { |
| now | const | 68 | no | const now = Number(input?.now ?? Date.now()); |
| windowMs | const | 69 | no | const windowMs = Number(opts.windowMs ?? 5 * 60 * 60 * 1000); |
| stats | const | 70 | no | const stats = summarizeUsage(usageRows, { now, windowMs }); |
| health | const | 74 | no | const health = new Map(); |
| deadModels | const | 79 | no | const deadModels = []; |
| healthyModels | const | 81 | no | const healthyModels = []; |
| failedProviders | const | 83 | no | const failedProviders = new Set(); |
| catalogCandidates | const | 95 | no | const catalogCandidates = Object.entries(catalog).map(([key, price]) =&gt; ({ key, provider: key.split(&#39;/&#39;)[0], model: key.split(&#39;/&#39;).slice(1).join(&#39;/&#39;), isFree: Boolean(price?.isFree), |
| observedKeys | const | 106 | no | const observedKeys = new Set(stats.keys()); |
| candidates | const | 107 | no | const candidates = catalogCandidates.map((c) =&gt; { if (observedKeys.has(c.key)) return c; if (c.isFree) return { ...c, health: { state: &#39;healthy&#39;, reliability: 0.6, avgLatencyMs: 0 } }; return { ...c,… |
| safe | const | 113 | no | const safe = chooseSafeModel(candidates, failedProviders, { minReliability: Number(opts.minReliability ?? 0.5), maxUsdPerCall: Number(opts.maxUsdPerCall ?? 0.5), }); |
| reroutes | const | 120 | no | const reroutes = []; |
| skipped | const | 122 | no | const skipped = []; |
| name | const | 125 | no | const name = String(agent?.name ?? &#39;&#39;).trim(); |
| model | const | 126 | no | const model = String(agent?.model ?? &#39;&#39;).trim(); |
| h | const | 132 | no | const h = health.get(model); |
| isDead | const | 133 | no | const isDead = h &amp;&amp; (h.state === &#39;budget-blocked&#39; \|\| h.state === &#39;capped&#39; \|\| h.state === &#39;broken&#39;); |
| revives | const | 156 | no | const revives = []; |
| assessment | const | 158 | no | const assessment = assessLane(lane, now, { stallAfterMs: Number(opts.stallAfterMs ?? 3 * 60 * 60 * 1000), failAfterMs: Number(opts.failAfterMs ?? 24 * 60 * 60 * 1000), }); |
| ordered | const | 167 | no | const ordered = orderRevive(lane, safe.model, { brief: `Revive lane ${String(lane?.id ?? lane?.name ?? &#39;?&#39;)} — ${assessment.reason}`, file: String(lane?.file ?? &#39;hq/work/orders.json&#39;), proofCommand: … |
| actions | const | 185 | no | const actions = []; |
| code | const | 190 | no | const code = reroutes.length \|\| revives.length |
| renderReviveCycle | function | 213 | yes | export function renderReviveCycle(cycle) { |
| lines | const | 214 | no | const lines = []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./model-router.mjs | import | 18 | [hq/lib/model-router.mjs](./model-router.mjs.md) |
| ./revive-lane.mjs | import | 19 | [hq/lib/revive-lane.mjs](./revive-lane.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/revive.mjs](../bin/revive.mjs.md) | ../lib/revive-daemon.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | The revive daemon&#39;s planning core: one cycle that detects a dead model or a stalled lane, |
| 7 | owner | hq-agent | — | hq-agent |
| 8 | task | — | — | revive-daemon |
| 9 | invariant | — | — | pure: no fs, no child_process, no clock read. `now` is an argument and is required. |
| 10 | invariant | — | — | a budget-blocked or capped model is NEVER chosen as the safe model, and every sibling on |
| 12 | invariant | — | — | a reroute is only planned for an agent whose CURRENT model is dead. A healthy pin is left |
| 14 | invariant | — | — | every refusal is a stable code from REVIVE_CODES, never free prose alone. |
| 15 | see | — | hq/lib/revive-lane.mjs | hq/lib/revive-lane.mjs · hq/lib/model-router.mjs · hq/lib/model-budget.mjs |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context The revive daemon's planning core: one cycle that detects a dead model or a stalled lane,
 *   picks the next best safe model, plans the reroute and the revive order, and returns a decision.
 *   Pure: every input arrives as an argument, every decision returns data. The IO shell (hq/bin/revive.mjs)
 *   reads the session DB and writes the journal; this module never touches either.
 * @hq:owner hq-agent
 * @hq:task revive-daemon
 * @hq:invariant pure: no fs, no child_process, no clock read. `now` is an argument and is required.
 * @hq:invariant a budget-blocked or capped model is NEVER chosen as the safe model, and every sibling on
 *   the same failed provider is excluded too — credit exhaustion is a provider-level pool, not a model.
 * @hq:invariant a reroute is only planned for an agent whose CURRENT model is dead. A healthy pin is left
 *   alone: the router's own rule is that a dead model is not a pin to keep, and a working one is.
 * @hq:invariant every refusal is a stable code from REVIVE_CODES, never free prose alone.
 * @hq:see hq/lib/revive-lane.mjs · hq/lib/model-router.mjs · hq/lib/model-budget.mjs
 */

import { classifyHealth, summarizeUsage } from './model-router.mjs';
import { assessLane, chooseSafeModel, orderRevive, REVIVE_CODES } from './revive-lane.mjs';

/**
 * @typedef {Object} ReviveAgent
 * @property {string} name
 * @property {string} model
 * @property {string} [path]
 */

/**
 * One cycle of the daemon.
 *
 * @param {{
 *   agents?: Array<ReviveAgent>,
 *   usageRows?: Array<Object>,
 *   catalog?: Record<string, Object>,
 *   lanes?: Array<Object>,
 *   now?: number,
 *   opts?: {
 *     windowMs?: number,
 *     minReliability?: number,
 *     maxUsdPerCall?: number,
 *     stallAfterMs?: number,
 *     failAfterMs?: number,
 *     requireMajorityHealthy?: boolean,
 *   },
 * }} input
 * @returns {{
 *   schema: string,
 *   now: string,
 *   deadModels: Array<{key: string, state: string, reason: string}>,
 *   healthyModels: Array<{key: string, reliability: number}>,
 *   safeModel: Object|null,
 *   reroutes: Array<{agent: string, from: string, to: string, reason: string}>,
 *   revives: Array<{id: string, reviveOf: string, model: string, task: string, file: string, proofCommand: string}>,
 *   skipped: Array<{agent: string, reason: string}>,
 *   actions: string[],
 *   code: string,
 * }}
 */
export function planReviveCycle(input = {}) {
  const {
    agents = [],
    usageRows = [],
    catalog = {},
    lanes = [],
    opts = {},
  } = input ?? {};

  const now = Number(input?.now ?? Date.now());
  const windowMs = Number(opts.windowMs ?? 5 * 60 * 60 * 1000);
  const stats = summarizeUsage(usageRows, { now, windowMs });

  // ---- 1. classify every observed model -------------------------------------
  /** @type {Map<string, {state: string, reliability: number, reasons: string[], avgLatencyMs: number}>} */
  const health = new Map();
  for (const [key, rec] of stats) {
    health.set(key, classifyHealth(rec));
  }
  /** @type {Array<{key: string, state: string, reason: string}>} */
  const deadModels = [];
  /** @type {Array<{key: string, reliability: number}>} */
```

_First 80 of 231 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
