# File: hq/lib/lane-health.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/lane-health.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6561 B |
| Lines | 151 |
| Hash | 5b381856427e |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| VERDICTS | const | 23 | yes | export const VERDICTS = Object.freeze([ &#39;role-missing&#39;, &#39;no-ladder&#39;, &#39;no-entry-in-profile&#39;, &#39;health-set-empty&#39;, |
| diagnoseLane | function | 44 | yes | export function diagnoseLane({ profile, role, healthy } = {}) { |
| name | const | 45 | no | const name = String(role ?? &#39;&#39;).trim(); |
| entryIds | const | 47 | no | const entryIds = profileEntryIds(profile); |
| value | const | 49 | no | const value = roleValue(profile, name); |
| home | const | 52 | no | const home = typeof value.home === &#39;string&#39; &amp;&amp; value.home ? value.home : null; |
| ladder | const | 53 | no | const ladder = Array.isArray(value.ladder) |
| tried | const | 58 | no | const tried = ladder.map((providerId) =&gt; { const inProfile = entryIds.has(providerId); const has = healthyIds.has(providerId); return { providerId, has, inProfile, why: explainLane({ providerId, has,… |
| inProfile | const | 59 | no | const inProfile = entryIds.has(providerId); |
| has | const | 60 | no | const has = healthyIds.has(providerId); |
| ok | const | 64 | no | const ok = tried.some((t) =&gt; t.inProfile &amp;&amp; t.has); |
| verdict | const | 65 | no | const verdict = ok |
| roleValue | function | 85 | no | function roleValue(profile, name) { |
| roles | const | 87 | no | const roles = profile?.roles; |
| value | const | 89 | no | const value = roles[name]; |
| profileEntryIds | function | 94 | no | function profileEntryIds(profile) { |
| ids | const | 95 | no | const ids = new Set(); |
| entries | const | 96 | no | const entries = profile?.entries; |
| id | const | 99 | no | const id = typeof entry?.providerId === &#39;string&#39; ? entry.providerId : &#39;&#39;; |
| readHealth | function | 111 | no | function readHealth(healthy) { |
| raw | const | 112 | no | const raw = Array.isArray(healthy) |
| ids | const | 119 | no | const ids = new Set(); |
| value | const | 121 | no | const value = typeof id === &#39;string&#39; ? id.trim() : &#39;&#39;; |
| probe | const | 124 | no | const probe = typeof healthy?.probe === &#39;boolean&#39; ? healthy.probe : null; |
| explainLane | function | 134 | no | function explainLane({ providerId, has, inProfile, probe, healthyCount }) { |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Lane health — name the one predicate that stopped a routing role resolving (role, ladder, profile entry, or health list) from the values alone. |
| 4 | owner | hq-agent | — | hq-agent |
| 5 | task | — | — | lane-health |
| 6 | invariant | — | — | read-only: this module never probes a lane, loads a profile, or rewrites one; every verdict comes from the values passed in |
| 7 | invariant | — | — | the verdict is the first predicate that failed on the resolution path, so the repair lands on the cause and not on a healthy symptom |
| 8 | invariant | — | — | a lane absent from the profile is rejected before its health is consulted: a ghost lane cannot resolve, however healthy it looks |
| 9 | why | — | — | the health input accepts {list}, a raw array and a Set: the live defect is a caller handing resolveRole an array, which has no .has — the diagnostic must be able to ask the predicate question of eith… |
| 10 | see | — | hq/lib/channel-seats.mjs | hq/lib/channel-seats.mjs · doc:docs/CANON-DECISIONS.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Lane health — name the one predicate that stopped a routing role resolving (role, ladder, profile entry, or health list) from the values alone.
 * @hq:owner hq-agent
 * @hq:task lane-health
 * @hq:invariant read-only: this module never probes a lane, loads a profile, or rewrites one; every verdict comes from the values passed in
 * @hq:invariant the verdict is the first predicate that failed on the resolution path, so the repair lands on the cause and not on a healthy symptom
 * @hq:invariant a lane absent from the profile is rejected before its health is consulted: a ghost lane cannot resolve, however healthy it looks
 * @hq:why the health input accepts {list}, a raw array and a Set: the live defect is a caller handing resolveRole an array, which has no .has — the diagnostic must be able to ask the predicate question of either shape without throwing on it
 * @hq:see hq/lib/channel-seats.mjs · doc:docs/CANON-DECISIONS.md
 */

/**
 * The closed vocabulary. Precedence, first failure wins:
 *   role-missing -> no-ladder -> no-entry-in-profile -> health-set-empty
 *   -> healthy-does-not-contain-ladder -> ok
 *
 * @typedef {'role-missing'|'no-ladder'|'no-entry-in-profile'|'health-set-empty'|'healthy-does-not-contain-ladder'|'ok'} Verdict
 * @typedef {{ providerId: string, has: boolean, inProfile: boolean, why: string }} LaneAttempt
 * @typedef {{ ok: boolean, role: string, home: string|null, ladder: string[], tried: LaneAttempt[], verdict: Verdict }} LaneDiagnosis
 */

export const VERDICTS = Object.freeze([
  'role-missing',
  'no-ladder',
  'no-entry-in-profile',
  'health-set-empty',
  'healthy-does-not-contain-ladder',
  'ok',
]);

/**
 * Explain why one role can or cannot resolve, against exactly the data a caller
 * has. Nothing here is inferred: every `has` and `inProfile` is a lookup in the
 * values passed in, and the verdict names the first lookup that failed.
 *
 * `healthy.probe` is provenance, not evidence: `true` means the list came from a
 * real per-lane call, `false` or absent means it is only what the lane list
 * advertised. It changes the wording of `why`, never the verdict.
 *
 * @param {{ profile?: any, role?: any, healthy?: any }} [input]
 * @returns {LaneDiagnosis}
 */
export function diagnoseLane({ profile, role, healthy } = {}) {
  const name = String(role ?? '').trim();
  const { ids: healthyIds, probe, size: healthyCount } = readHealth(healthy);
  const entryIds = profileEntryIds(profile);

  const value = roleValue(profile, name);
  if (!value) return { ok: false, role: name, home: null, ladder: [], tried: [], verdict: 'role-missing' };

  const home = typeof value.home === 'string' && value.home ? value.home : null;
  const ladder = Array.isArray(value.ladder)
    ? value.ladder.filter((p) => typeof p === 'string' && p.length > 0)
    : [];
  if (!ladder.length) return { ok: false, role: name, home, ladder: [], tried: [], verdict: 'no-ladder' };

  const tried = ladder.map((providerId) => {
    const inProfile = entryIds.has(providerId);
    const has = healthyIds.has(providerId);
    return { providerId, has, inProfile, why: explainLane({ providerId, has, inProfile, probe, healthyCount }) };
  });

  const ok = tried.some((t) => t.inProfile && t.has);
  const verdict = ok
    ? 'ok'
    : !tried.some((t) => t.inProfile)
      ? 'no-entry-in-profile'
      : healthyCount === 0
        ? 'health-set-empty'
        : 'healthy-does-not-contain-ladder';

  return { ok, role: name, home, ladder: [...ladder], tried, verdict };
}

/**
 * The role object a name resolves to, mirroring the profile loader: a `$`-prefixed
 * key is documentation, and a falsy value is no role. A non-object value is
 * returned so the ladder check reports it as `no-ladder` rather than `role-missing`.
 *
```

_First 80 of 152 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
