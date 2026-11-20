# File: hq/lib/revive-lane.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/revive-lane.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11572 B |
| Lines | 223 |
| Hash | 6a62741b8235 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REVIVE_CODES | const | 16 | yes | export const REVIVE_CODES = Object.freeze({ LANE_HEALTHY: &#39;LANE_HEALTHY&#39;, LANE_STALLED: &#39;LANE_STALLED&#39;, LANE_FAILED: &#39;LANE_FAILED&#39;, LANE_MISSING: &#39;LANE_MISSING&#39;, |
| TERMINAL_STATES | const | 30 | yes | export const TERMINAL_STATES = /** @type {const} */ ([&#39;done&#39;, &#39;blocked&#39;, &#39;cancelled&#39;, &#39;failed&#39;]); |
| OPEN_STATES | const | 32 | yes | export const OPEN_STATES = /** @type {const} */ ([&#39;pending&#39;, &#39;sent&#39;, &#39;running&#39;, &#39;open&#39;]); |
| assessLane | function | 54 | yes | export function assessLane(lane, nowMs, opts = {}) { |
| stallAfterMs | const | 55 | no | const stallAfterMs = Number(opts.stallAfterMs ?? 3 * 60 * 60 * 1000); // 3 hours default |
| failAfterMs | const | 56 | no | const failAfterMs = Number(opts.failAfterMs ?? 24 * 60 * 60 * 1000); // 24 hours default |
| now | const | 57 | no | const now = toMs(nowMs); |
| state | const | 60 | no | const state = String(lane?.status ?? lane?.state ?? &#39;&#39;).toLowerCase(); |
| updatedAt | const | 61 | no | const updatedAt = toMs(lane?.updatedAt ?? lane?.at ?? lane?.startedAt); |
| ageMs | const | 62 | no | const ageMs = updatedAt === null ? null : Math.max(0, now - updatedAt); |
| ageMinutes | const | 63 | no | const ageMinutes = ageMs === null ? null : Math.round(ageMs / 60_000); |
| chooseSafeModel | function | 99 | yes | export function chooseSafeModel(catalog, failedProviders = new Set(), opts = {}) { |
| preferFree | const | 100 | no | const preferFree = opts.preferFree !== false; |
| minReliability | const | 101 | no | const minReliability = Number(opts.minReliability ?? 0.5); |
| maxUsdPerCall | const | 102 | no | const maxUsdPerCall = Number(opts.maxUsdPerCall ?? 0.5); |
| eligible | const | 105 | no | const eligible = []; |
| rejected | const | 107 | no | const rejected = []; |
| h | const | 110 | no | const h = c.health ?? { state: &#39;unproven&#39;, reliability: 0, avgLatencyMs: 0 }; |
| state | const | 111 | no | const state = String(h.state ?? &#39;unproven&#39;); |
| reliability | const | 117 | no | const reliability = Number(h.reliability) \|\| 0; |
| tier | const | 120 | no | const tier = isFreeTier(c.isFree) ? 0 : 1; |
| latencyPoints | const | 121 | no | const latencyPoints = Number(h.avgLatencyMs) \|\| 0; |
| reliabilityPoints | const | 122 | no | const reliabilityPoints = (1 - reliability) * 1000; |
| score | const | 123 | no | const score = tier * 1e6 + latencyPoints + reliabilityPoints; |
| best | const | 133 | no | const best = eligible[0]; |
| orderRevive | function | 152 | yes | export function orderRevive(lane, model, opts = {}) { |
| laneId | const | 156 | no | const laneId = String(lane?.id ?? lane?.name ?? lane?.sessionId ?? &#39;unknown&#39;); |
| order | const | 157 | no | const order = { |
| reviewGate | function | 184 | yes | export function reviewGate(completed, n, cycle) { |
| total | const | 185 | no | const total = Array.isArray(completed) ? completed.length : 0; |
| sinceLastReview | const | 186 | no | const sinceLastReview = cycle % n; |
| boundary | const | 192 | no | const boundary = completed.slice(Math.max(0, total - n)); |
| allPassed | const | 193 | no | const allPassed = boundary.every((t) =&gt; t.status === &#39;done&#39;); |
| anyBlocked | const | 194 | no | const anyBlocked = boundary.some((t) =&gt; t.status === &#39;blocked&#39; \|\| t.status === &#39;failed&#39;); |
| anyMissingProof | const | 195 | no | const anyMissingProof = boundary.some((t) =&gt; !t.proofCommand); |
| toMs | function | 211 | no | function toMs(value) { |
| t | const | 214 | no | const t = Date.parse(value.trim()); |
| isFreeTier | function | 221 | no | function isFreeTier(isFree) { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/revive-lane.mjs |
| [hq/lib/revive-daemon.mjs](./revive-daemon.mjs.md) | ./revive-lane.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Self-healing revive lane: monitors all factory lanes, detects model/provider failures, |
| 7 | owner | hq-agent | — | hq-agent |
| 8 | task | — | — | revive-lane |
| 9 | invariant | — | — | pure: no fs, no child_process, no clock read. `now` is an argument and is required. |
| 10 | invariant | — | — | the safe model is never budget-blocked, capped, or broken — it is chosen by health, |
| 12 | invariant | — | — | every refusal is a stable code from REVIVE_CODES, never free text alone. |
| 13 | see | — | hq/lib/model-router.mjs | hq/lib/model-router.mjs · hq/lib/autonomy.mjs · hq/lib/work-orders.mjs |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Self-healing revive lane: monitors all factory lanes, detects model/provider failures,
 *   and restarts any stalled or dead lane using a safe model. If the operating chief goes down,
 *   this lane revives the whole process. Pure decision module — no fs, no spawn, no clock read;
 *   everything arrives as arguments and every decision returns data with a stable code.
 * @hq:owner hq-agent
 * @hq:task revive-lane
 * @hq:invariant pure: no fs, no child_process, no clock read. `now` is an argument and is required.
 * @hq:invariant the safe model is never budget-blocked, capped, or broken — it is chosen by health,
 *   never hardcoded to a single provider.
 * @hq:invariant every refusal is a stable code from REVIVE_CODES, never free text alone.
 * @hq:see hq/lib/model-router.mjs · hq/lib/autonomy.mjs · hq/lib/work-orders.mjs
 */

export const REVIVE_CODES = Object.freeze({
  LANE_HEALTHY: 'LANE_HEALTHY',
  LANE_STALLED: 'LANE_STALLED',
  LANE_FAILED: 'LANE_FAILED',
  LANE_MISSING: 'LANE_MISSING',
  NO_SAFE_MODEL: 'NO_SAFE_MODEL',
  SAFE_MODEL_FOUND: 'SAFE_MODEL_FOUND',
  REVIVE_ORDERED: 'REVIVE_ORDERED',
  REVIVE_BLOCKED: 'REVIVE_BLOCKED',
  REVIEW_DUE: 'REVIEW_DUE',
  REVIEW_CLEAR: 'REVIEW_CLEAR',
});

/** Terminal states a lane can be in — nothing more to wait for. */
export const TERMINAL_STATES = /** @type {const} */ (['done', 'blocked', 'cancelled', 'failed']);
/** Open states — the lane may still be working or may be stalled. */
export const OPEN_STATES = /** @type {const} */ (['pending', 'sent', 'running', 'open']);

/**
 * The safe-model budget: a model is "safe" only when it is healthy, funded, and not the same
 * provider as a recently-failed model (provider-level credit exhaustion contagion).
 * @typedef {Object} SafeModel
 * @property {string} key          "provider/model"
 * @property {string} provider
 * @property {string} model
 * @property {boolean} isFree
 * @property {string} healthState  'healthy' | 'capped' | 'budget-blocked' | 'broken' | 'unproven'
 * @property {number} reliability
 * @property {number} avgLatencyMs
 */

/**
 * Decide whether a lane is healthy, stalled, or failed based on its observed state and age.
 * @param {Object} lane
 * @param {number} nowMs
 * @param {Object} [opts] { stallAfterMs, failAfterMs }
 * @returns {{code: string, state: string, reason: string, ageMinutes: number|null}}
 */
export function assessLane(lane, nowMs, opts = {}) {
  const stallAfterMs = Number(opts.stallAfterMs ?? 3 * 60 * 60 * 1000); // 3 hours default
  const failAfterMs = Number(opts.failAfterMs ?? 24 * 60 * 60 * 1000); // 24 hours default
  const now = toMs(nowMs);
  if (now === null) throw new TypeError('revive-lane: assessLane needs a numeric nowMs');

  const state = String(lane?.status ?? lane?.state ?? '').toLowerCase();
  const updatedAt = toMs(lane?.updatedAt ?? lane?.at ?? lane?.startedAt);
  const ageMs = updatedAt === null ? null : Math.max(0, now - updatedAt);
  const ageMinutes = ageMs === null ? null : Math.round(ageMs / 60_000);

  if (TERMINAL_STATES.includes(/** @type {any} */ (state))) {
    return {
      code: state === 'done' ? REVIVE_CODES.LANE_HEALTHY : REVIVE_CODES.LANE_FAILED,
      state,
      reason: `lane ${String(lane?.id ?? lane?.name ?? '?')} is ${state} (terminal); no revive action`,
      ageMinutes,
    };
  }

  if (OPEN_STATES.includes(/** @type {any} */ (state))) {
    if (ageMs === null) {
      return { code: REVIVE_CODES.LANE_STALLED, state, reason: 'lane has no updatedAt timestamp — cannot determine liveness', ageMinutes: null };
    }
    if (ageMs >= failAfterMs) {
      return { code: REVIVE_CODES.LANE_FAILED, state, reason: `lane ${String(lane?.id ?? lane?.name ?? '?')} has been ${state} for ${ageMinutes}m, past ${Math.round(failAfterMs / 60_000)}m failure threshold`, ageMinutes };
    }
```

_First 80 of 224 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
