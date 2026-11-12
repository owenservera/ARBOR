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
 * @param {any} profile
 * @param {string} name
 * @returns {any|null}
 */
function roleValue(profile, name) {
  if (!name || name.startsWith('$')) return null;
  const roles = profile?.roles;
  if (!roles || typeof roles !== 'object' || Array.isArray(roles)) return null;
  const value = roles[name];
  return value ? value : null;
}

/** The providerIds the profile actually backs. A lane not in here has no model. */
function profileEntryIds(profile) {
  const ids = new Set();
  const entries = profile?.entries;
  if (!Array.isArray(entries)) return ids;
  for (const entry of entries) {
    const id = typeof entry?.providerId === 'string' ? entry.providerId : '';
    if (id) ids.add(id);
  }
  return ids;
}

/**
 * Normalise the health input to the only thing a lookup needs: a set of
 * providerIds, plus the count and provenance the `why` text quotes.
 *
 * @param {any} healthy `{list, probe?}`, a raw array, a Set, or null.
 */
function readHealth(healthy) {
  const raw = Array.isArray(healthy)
    ? healthy
    : healthy instanceof Set
      ? [...healthy]
      : Array.isArray(healthy?.list)
        ? healthy.list
        : [];
  const ids = new Set();
  for (const id of raw) {
    const value = typeof id === 'string' ? id.trim() : '';
    if (value) ids.add(value);
  }
  const probe = typeof healthy?.probe === 'boolean' ? healthy.probe : null;
  return { ids, probe, size: ids.size };
}

/**
 * One lane's reason. The wording distinguishes "not a profile entry" from
 * "not healthy", because a lane can be either and the repair is different.
 *
 * @param {{ providerId: string, has: boolean, inProfile: boolean, probe: boolean|null, healthyCount: number }} lane
 */
function explainLane({ providerId, has, inProfile, probe, healthyCount }) {
  if (!inProfile) {
    return has
      ? `'${providerId}' is in the healthy list but is not a profile entry — no model backs it, so health cannot rescue this lane`
      : `'${providerId}' is not a profile entry, and it is not in the healthy list either`;
  }
  if (has) {
    return probe === true
      ? `'${providerId}' is a profile entry and the live probe reported it serving`
      : `'${providerId}' is a profile entry and appears in the healthy list`;
  }
  if (healthyCount === 0) {
    return `'${providerId}' is a profile entry but the healthy list is empty — no lane could pass`;
  }
  return probe === true
    ? `'${providerId}' is a profile entry but the live probe dropped it`
    : `'${providerId}' is a profile entry but is not in the healthy list (${healthyCount} id${healthyCount === 1 ? '' : 's'} checked)`;
}
