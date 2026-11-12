/**
 * @hq:context Pure, bounded optimization primitives for shared semantic-kernel research.
 * @hq:owner hq
 * @hq:task semantic-kernel-optimizers-v1
 * @hq:invariant No database, filesystem, network, clock, random source, or effects.
 * @hq:invariant Plans and suggestions never grant authority or execute capabilities.
 * @hq:see docs/research/semantic-language-kernel/ARCHITECTURE.md
 */
export const SEMANTIC_OPTIMIZERS_SCHEMA = 'hq.semantic-optimizers/1';

const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const str = (v) => String(v ?? '').trim();
const key = (v) => str(v).normalize('NFKC').replace(/\s+/gu, ' ').toLowerCase();
const sorted = (a) => [...a].sort(compare);
const list = (v) => Array.isArray(v) ? v : [];
const unit = (v) => Number.isFinite(Number(v)) ? Math.max(0, Math.min(1, Number(v))) : 0;
const integer = (v, fallback, maximum) => Number.isSafeInteger(v) && v >= 0 ? Math.min(v, maximum) : fallback;
// secretSegments mirrors the HQ-wide secret rule used by realtime, canon,
// filetypes and kb-intake: `.env*`, `*.env`, `*.keystore`, session.json,
// storage-state.json, release-profile.json, cookies, login data. The optimizer
// additionally refuses `*.pem` and `*.p12`. The rule is a superset of every HQ
// module's rule, so no path HQ excludes can enter an optimizer projection.
const SECRET_BASENAMES = new Set([
  'session.json', 'storage-state.json', 'release-profile.json', 'cookies', 'login data',
]);
const isSecretSegment = (segment) => {
  const name = String(segment ?? '').trim().toLowerCase();
  if (!name) return false;
  if (name.startsWith('.env')) return true;
  if (name.endsWith('.env')) return true;
  if (name.endsWith('.keystore')) return true;
  if (name.endsWith('.pem') || name.endsWith('.p12')) return true;
  return SECRET_BASENAMES.has(name);
};
const unsafePath = (path) => str(path).replace(/\\/g, '/').split('/').some(isSecretSegment);
const safe = (item) => item && item.secret !== true && !['secret', 'restricted', 'credential'].includes(key(item.sensitivity)) && !unsafePath(item.path);
const stable = (v) => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort(compare).map((k) => [k, stable(v[k])])) : v;
const stableJson = (v) => JSON.stringify(stable(v));
const topicsOf = (c) => sorted(new Set(list(c?.topics).map(key).filter(Boolean)));
// tieBreak — total order for candidates that share an id and a value/token
// ratio, so greedy selection never depends on the input order.
const tieBreak = (a, b) => compare(
  stableJson({ id: str(a?.id), relevance: unit(a?.relevance), tokens: a?.tokens, topics: topicsOf(a) }),
  stableJson({ id: str(b?.id), relevance: unit(b?.relevance), tokens: b?.tokens, topics: topicsOf(b) }),
);

/** A01: compile exact canonical aliases, preserving collisions rather than guessing. */
export function buildAliasIndex(entries = []) {
  const rows = new Map();
  for (const item of list(entries)) {
    const alias = key(item?.alias);
    const target = str(item?.target);
    if (!alias || !target) continue;
    if (!rows.has(alias)) rows.set(alias, new Set());
    rows.get(alias).add(target);
  }
  return {
    schema: SEMANTIC_OPTIMIZERS_SCHEMA,
    rows: [...rows].sort(([a], [b]) => compare(a, b))
      .map(([alias, targets]) => ({ alias, targets: sorted(targets) })),
  };
}

/** A02: exact/prefix lexicon resolution, fail closed on ambiguity. */
export function resolveAlias(index, input, { prefix = false, limit = 20 } = {}) {
  const phrase = key(input);
  if (!phrase) return { status: 'invalid', targets: [] };
  const rows = list(index?.rows).filter((r) => r && typeof r === 'object');
  const exact = rows.filter((r) => typeof r.alias === 'string' && r.alias === phrase);
  const matches = exact.length ? exact
    : prefix ? rows.filter((r) => typeof r.alias === 'string' && r.alias.startsWith(phrase))
      : [];
  const targets = sorted(new Set(matches.flatMap((r) => Array.isArray(r.targets) ? r.targets : [])));
  const capped = targets.slice(0, integer(limit, 20, 1000));
  return { status: !targets.length ? 'not_found' : targets.length === 1 ? 'resolved' : 'ambiguous',
    targets: capped, total: targets.length, truncated: capped.length < targets.length };
}

/** A03: deterministic, bounded evidence rank; score is descriptive, not authority. */
export function rankEvidence(items = [], { limit = 20, minimum = 0 } = {}) {
  const min = Math.max(0, Math.min(1000, integer(minimum, 0, 1000)));
  return list(items).filter((v) => safe(v) && str(v.id)).map((v) => ({
    id: str(v.id), score: Math.round(500 * unit(v.relevance) + 300 * unit(v.quality) + 200 * unit(v.freshness)),
    source: str(v.source), authority: str(v.authority) || 'unverified',
  })).filter((v) => v.score >= min)
    .sort((a, b) => b.score - a.score || compare(a.id, b.id) || compare(a.source, b.source))
    .slice(0, integer(limit, 20, 5000));
}

/** A04: coverage-aware, token-bounded greedy context selection (experimental). */
export function packContext(candidates = [], { budget = 4000, maxItems = 30 } = {}) {
  const cap = integer(budget, 4000, 100000);
  const max = integer(maxItems, 30, 1000);
  const chosen = [], covered = new Set(), used = new Set();
  let spent = 0;
  const eligible = list(candidates).filter((c) => safe(c) && str(c.id) &&
    Number.isSafeInteger(c.tokens) && c.tokens > 0 && c.tokens <= cap)
    .sort((a, b) => compare(str(a.id), str(b.id)));
  while (chosen.length < max) {
    let best = null;
    for (const c of eligible) {
      if (used.has(str(c.id)) || spent + c.tokens > cap) continue;
      const topics = topicsOf(c);
      const newTopics = topics.filter((t) => !covered.has(t));
      const value = Math.round(1000 * unit(c.relevance)) + 300 * newTopics.length;
      // Ratio comparison (value per token) with a total tie-break: candidates
      // that share an id and a ratio fall back to a canonical key, so the
      // selection never depends on the input order.
      const better = !best
        || value * best.item.tokens > best.value * c.tokens
        || (value * best.item.tokens === best.value * c.tokens && tieBreak(c, best.item) < 0);
      if (better) best = { item: c, value, topics };
    }
    if (!best || best.value <= 0) break;
    const c = best.item;
    spent += c.tokens; used.add(str(c.id));
    for (const t of best.topics) covered.add(t);
    chosen.push({ id: str(c.id), tokens: c.tokens, value: best.value });
  }
  return { selected: chosen, tokens: spent, budget: cap, topics: sorted(covered) };
}

/** A05: collapse exact identical claims but preserve different values as contradictions. */
export function reconcileClaims(claims = []) {
  const bySubject = new Map();
  for (const c of list(claims)) {
    const subject = str(c?.subject);
    if (!subject || !safe(c)) continue;
    if (!bySubject.has(subject)) bySubject.set(subject, new Map());
    const byValue = bySubject.get(subject);
    const valueKey = stableJson(c.value);
    if (!byValue.has(valueKey)) byValue.set(valueKey, { value: stable(c.value), sources: new Set(), ids: new Set() });
    const v = byValue.get(valueKey);
    if (str(c.source)) v.sources.add(str(c.source));
    if (str(c.id)) v.ids.add(str(c.id));
  }
  return [...bySubject].sort(([a], [b]) => compare(a, b)).map(([subject, values]) => ({
    subject, contradicted: values.size > 1,
    alternatives: [...values].sort(([a], [b]) => compare(a, b)).map(([, v]) => ({
      value: v.value, sources: sorted(v.sources), claimIds: sorted(v.ids),
    })),
  }));
}

/** A06: reverse BFS: "from" depends on "to"; changing "to" impacts "from". */
export function traceImpact(edges = [], changed = [], { maxNodes = 1000 } = {}) {
  const reverse = new Map();
  for (const edge of list(edges)) {
    const from = str(edge?.from), to = str(edge?.to);
    if (!from || !to) continue;
    if (!reverse.has(to)) reverse.set(to, new Set());
    reverse.get(to).add(from);
  }
  const origins = sorted(new Set(list(changed).map(str).filter(Boolean)));
  const cap = integer(maxNodes, 1000, 100000);
  if (cap === 0) return { nodes: [], truncated: origins.length > 0 };
  const seen = new Map(origins.slice(0, cap).map((id) => [id, 0]));
  const queue = origins.map((id) => [id, 0]);
  let i = 0;
  while (i < queue.length && seen.size < cap) {
    const [at, depth] = queue[i++];
    for (const parent of sorted(reverse.get(at) ?? [])) {
      if (seen.has(parent)) continue;
      if (seen.size >= cap) break;
      seen.set(parent, depth + 1);
      queue.push([parent, depth + 1]);
    }
  }
  return { nodes: [...seen].map(([id, depth]) => ({ id, depth }))
    .sort((a, b) => a.depth - b.depth || compare(a.id, b.id)),
    truncated: i < queue.length || queue.length > cap || origins.length > cap };
}

/** A07: fail-closed, stable topological plan ordering; no execution. */
export function orderActionPlan(actions = []) {
  const plan = list(actions);
  const ids = plan.map((a) => str(a?.id));
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) return { status: 'invalid', order: [], missing: [], cycle: [] };
  const set = new Set(ids), next = new Map(ids.map((id) => [id, []])), count = new Map(ids.map((id) => [id, 0]));
  const missing = new Set();
  for (const a of plan) {
    const id = str(a.id), deps = new Set((Array.isArray(a.dependsOn) ? a.dependsOn : []).map(str));
    for (const dep of deps) {
      if (!set.has(dep)) { missing.add(dep); continue; }
      next.get(dep).push(id); count.set(id, count.get(id) + 1);
    }
  }
  if (missing.size) return { status: 'blocked', order: [], missing: sorted(missing), cycle: [] };
  let ready = ids.filter((id) => count.get(id) === 0).sort(compare);
  const result = [];
  while (ready.length) {
    const id = ready.shift(); result.push(id);
    for (const target of sorted(next.get(id))) {
      count.set(target, count.get(target) - 1);
      if (count.get(target) === 0) { ready.push(target); ready.sort(compare); }
    }
  }
  const cycle = ids.filter((id) => count.get(id) > 0).sort(compare);
  return { status: cycle.length ? 'blocked' : 'ordered', order: cycle.length ? [] : result, missing: [], cycle };
}

/** A08: deterministic capacity-constrained agent assignment proposals only. */
export function allocateTasks(tasks = [], agents = [], { claimed = [], completed = [] } = {}) {
  const owned = new Set(list(claimed).map(str)), done = new Set(list(completed).map(str));
  const load = new Map(), assignments = [], unassigned = [];
  const peers = list(agents).filter((a) => str(a?.id)).sort((a, b) => compare(str(a.id), str(b.id)));
  for (const a of peers) load.set(str(a.id), 0);
  const queue = [...list(tasks)].sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0) || compare(str(a.id), str(b.id)));
  for (const task of queue) {
    const id = str(task?.id);
    if (!id) { unassigned.push({ id, reason: 'invalid' }); continue; }
    if (owned.has(id)) { unassigned.push({ id, reason: 'claimed' }); continue; }
    if ((Array.isArray(task.dependsOn) ? task.dependsOn : []).some((d) => !done.has(str(d)))) { unassigned.push({ id, reason: 'dependencies' }); continue; }
    const requirements = Array.isArray(task.requires) ? task.requires.map(str) : [];
    const options = peers.filter((a) => {
      const capacity = integer(a.capacity, 1, 1000);
      return load.get(str(a.id)) < capacity &&
        (Array.isArray(a.repositories) && (a.repositories.includes('*') || a.repositories.includes(task.repository))) &&
        requirements.every((r) => Array.isArray(a.capabilities) && a.capabilities.includes(r));
    }).sort((a, b) => load.get(str(a.id)) - load.get(str(b.id)) || compare(str(a.id), str(b.id)));
    if (!options.length) { unassigned.push({ id, reason: 'no_eligible_agent' }); continue; }
    const agentId = str(options[0].id);
    assignments.push({ taskId: id, agentId, status: 'proposal_only' });
    load.set(agentId, load.get(agentId) + 1);
  }
  return { assignments, unassigned };
}

/** A09: compact safe observations within segments, never across an effect/ack barrier. */
export function coalesceObservations(events = [], { maxEvents = 10000 } = {}) {
  const max = integer(maxEvents, 10000, 100000);
  const stream = list(events);
  if (stream.length > max) return { status: 'blocked', events: [], reason: 'input_limit' };
  const kinds = new Set(['file.observed', 'index.invalidated', 'view.invalidated']);
  const output = []; let segment = new Map(), collapsed = 0;
  const flush = () => { output.push(...segment.values()); segment = new Map(); };
  for (const e of stream) {
    const compactable = e && kinds.has(e.kind) && e.coalescible === true && e.requiresAck !== true &&
      e.effect !== true && e.receipt !== true && e.approval !== true &&
      str(e.project) && str(e.subject) && Number.isSafeInteger(e.revision);
    if (!compactable) { flush(); output.push(e); continue; }
    const k = stableJson([e.kind, e.project, e.subject]);
    if (segment.has(k)) {
      collapsed++;
      if (e.revision >= segment.get(k).revision) segment.set(k, e);
    } else segment.set(k, e);
  }
  flush();
  return { status: 'ok', events: output, collapsed };
}

/** A10: compare observed sources to pinned contract identity; never auto-migrate. */
export function detectDrift(records = []) {
  return list(records).map((r) => {
    const id = str(r?.id);
    const expectedDigest = str(r?.expectedDigest), actualDigest = str(r?.actualDigest);
    const expectedVersion = str(r?.expectedVersion), actualVersion = str(r?.actualVersion);
    const reasons = [];
    if (!id) reasons.push('missing_id');
    if (r?.exists === false) reasons.push('missing_source');
    if (!expectedDigest || !actualDigest) reasons.push('missing_digest');
    else if (expectedDigest !== actualDigest) reasons.push('content_changed');
    if (expectedVersion && expectedVersion !== actualVersion) reasons.push('version_changed');
    return { id, status: reasons.length ? 'drift' : 'current', reasons };
  }).sort((a, b) => compare(a.id, b.id));
}
