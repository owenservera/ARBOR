# File: hq/lib/semantic-optimizers.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/semantic-optimizers.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14303 B |
| Lines | 267 |
| Hash | bb2f813d3b7d |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SEMANTIC_OPTIMIZERS_SCHEMA | const | 9 | yes | export const SEMANTIC_OPTIMIZERS_SCHEMA = &#39;hq.semantic-optimizers/1&#39;; |
| compare | function | 11 | no | const compare = (a, b) =&gt; a &lt; b ? -1 : a &gt; b ? 1 : 0; |
| str | function | 12 | no | const str = (v) =&gt; String(v ?? &#39;&#39;).trim(); |
| key | function | 13 | no | const key = (v) =&gt; str(v).normalize(&#39;NFKC&#39;).replace(/\\s+/gu, &#39; &#39;).toLowerCase(); |
| sorted | function | 14 | no | const sorted = (a) =&gt; [...a].sort(compare); |
| list | function | 15 | no | const list = (v) =&gt; Array.isArray(v) ? v : []; |
| unit | function | 16 | no | const unit = (v) =&gt; Number.isFinite(Number(v)) ? Math.max(0, Math.min(1, Number(v))) : 0; |
| integer | function | 17 | no | const integer = (v, fallback, maximum) =&gt; Number.isSafeInteger(v) &amp;&amp; v &gt;= 0 ? Math.min(v, maximum) : fallback; |
| SECRET_BASENAMES | const | 23 | no | const SECRET_BASENAMES = new Set([ &#39;session.json&#39;, &#39;storage-state.json&#39;, &#39;release-profile.json&#39;, &#39;cookies&#39;, &#39;login data&#39;, ]); |
| isSecretSegment | function | 26 | no | const isSecretSegment = (segment) =&gt; { |
| name | const | 27 | no | const name = String(segment ?? &#39;&#39;).trim().toLowerCase(); |
| unsafePath | function | 35 | no | const unsafePath = (path) =&gt; str(path).replace(/\\\\/g, &#39;/&#39;).split(&#39;/&#39;).some(isSecretSegment); |
| safe | function | 36 | no | const safe = (item) =&gt; item &amp;&amp; item.secret !== true &amp;&amp; ![&#39;secret&#39;, &#39;restricted&#39;, &#39;credential&#39;].includes(key(item.sensitivity)) &amp;&amp; !unsafePath(item.path); |
| stable | function | 37 | no | const stable = (v) =&gt; Array.isArray(v) ? v.map(stable) : v &amp;&amp; typeof v === &#39;object&#39; |
| stableJson | function | 39 | no | const stableJson = (v) =&gt; JSON.stringify(stable(v)); |
| topicsOf | function | 40 | no | const topicsOf = (c) =&gt; sorted(new Set(list(c?.topics).map(key).filter(Boolean))); |
| tieBreak | function | 43 | no | const tieBreak = (a, b) =&gt; compare( stableJson({ id: str(a?.id), relevance: unit(a?.relevance), tokens: a?.tokens, topics: topicsOf(a) }), stableJson({ id: str(b?.id), relevance: unit(b?.relevance), … |
| buildAliasIndex | function | 49 | yes | export function buildAliasIndex(entries = []) { |
| rows | const | 50 | no | const rows = new Map(); |
| alias | const | 52 | no | const alias = key(item?.alias); |
| target | const | 53 | no | const target = str(item?.target); |
| resolveAlias | function | 66 | yes | export function resolveAlias(index, input, { prefix = false, limit = 20 } = {}) { |
| phrase | const | 67 | no | const phrase = key(input); |
| rows | const | 69 | no | const rows = list(index?.rows).filter((r) =&gt; r &amp;&amp; typeof r === &#39;object&#39;); |
| exact | const | 70 | no | const exact = rows.filter((r) =&gt; typeof r.alias === &#39;string&#39; &amp;&amp; r.alias === phrase); |
| matches | const | 71 | no | const matches = exact.length ? exact |
| targets | const | 74 | no | const targets = sorted(new Set(matches.flatMap((r) =&gt; Array.isArray(r.targets) ? r.targets : []))); |
| capped | const | 75 | no | const capped = targets.slice(0, integer(limit, 20, 1000)); |
| rankEvidence | function | 81 | yes | export function rankEvidence(items = [], { limit = 20, minimum = 0 } = {}) { |
| min | const | 82 | no | const min = Math.max(0, Math.min(1000, integer(minimum, 0, 1000))); |
| packContext | function | 92 | yes | export function packContext(candidates = [], { budget = 4000, maxItems = 30 } = {}) { |
| cap | const | 93 | no | const cap = integer(budget, 4000, 100000); |
| max | const | 94 | no | const max = integer(maxItems, 30, 1000); |
| chosen | const | 95 | no | const chosen = [], covered = new Set(), used = new Set(); |
| spent | variable | 96 | no | let spent = 0; |
| eligible | const | 97 | no | const eligible = list(candidates).filter((c) =&gt; safe(c) &amp;&amp; str(c.id) &amp;&amp; Number.isSafeInteger(c.tokens) &amp;&amp; c.tokens &gt; 0 &amp;&amp; c.tokens &lt;= cap) |
| best | variable | 101 | no | let best = null; |
| topics | const | 104 | no | const topics = topicsOf(c); |
| newTopics | const | 105 | no | const newTopics = topics.filter((t) =&gt; !covered.has(t)); |
| value | const | 106 | no | const value = Math.round(1000 * unit(c.relevance)) + 300 * newTopics.length; |
| better | const | 110 | no | const better = !best |
| c | const | 116 | no | const c = best.item; |
| reconcileClaims | function | 125 | yes | export function reconcileClaims(claims = []) { |
| bySubject | const | 126 | no | const bySubject = new Map(); |
| subject | const | 128 | no | const subject = str(c?.subject); |
| byValue | const | 131 | no | const byValue = bySubject.get(subject); |
| valueKey | const | 132 | no | const valueKey = stableJson(c.value); |
| v | const | 134 | no | const v = byValue.get(valueKey); |
| traceImpact | function | 147 | yes | export function traceImpact(edges = [], changed = [], { maxNodes = 1000 } = {}) { |
| reverse | const | 148 | no | const reverse = new Map(); |
| origins | const | 155 | no | const origins = sorted(new Set(list(changed).map(str).filter(Boolean))); |
| cap | const | 156 | no | const cap = integer(maxNodes, 1000, 100000); |
| seen | const | 158 | no | const seen = new Map(origins.slice(0, cap).map((id) =&gt; [id, 0])); |
| queue | const | 159 | no | const queue = origins.map((id) =&gt; [id, 0]); |
| i | variable | 160 | no | let i = 0; |
| orderActionPlan | function | 176 | yes | export function orderActionPlan(actions = []) { |
| plan | const | 177 | no | const plan = list(actions); |
| ids | const | 178 | no | const ids = plan.map((a) =&gt; str(a?.id)); |
| set | const | 180 | no | const set = new Set(ids), next = new Map(ids.map((id) =&gt; [id, []])), count = new Map(ids.map((id) =&gt; [id, 0])); |
| missing | const | 181 | no | const missing = new Set(); |
| id | const | 183 | no | const id = str(a.id), deps = new Set((Array.isArray(a.dependsOn) ? a.dependsOn : []).map(str)); |
| ready | variable | 190 | no | let ready = ids.filter((id) =&gt; count.get(id) === 0).sort(compare); |
| result | const | 191 | no | const result = []; |
| id | const | 193 | no | const id = ready.shift(); result.push(id); |
| cycle | const | 199 | no | const cycle = ids.filter((id) =&gt; count.get(id) &gt; 0).sort(compare); |
| allocateTasks | function | 204 | yes | export function allocateTasks(tasks = [], agents = [], { claimed = [], completed = [] } = {}) { |
| owned | const | 205 | no | const owned = new Set(list(claimed).map(str)), done = new Set(list(completed).map(str)); |
| load | const | 206 | no | const load = new Map(), assignments = [], unassigned = []; |
| peers | const | 207 | no | const peers = list(agents).filter((a) =&gt; str(a?.id)).sort((a, b) =&gt; compare(str(a.id), str(b.id))); |
| queue | const | 209 | no | const queue = [...list(tasks)].sort((a, b) =&gt; (Number(b.priority) \|\| 0) - (Number(a.priority) \|\| 0) \|\| compare(str(a.id), str(b.id))); |
| id | const | 211 | no | const id = str(task?.id); |
| requirements | const | 215 | no | const requirements = Array.isArray(task.requires) ? task.requires.map(str) : []; |
| options | const | 216 | no | const options = peers.filter((a) =&gt; { const capacity = integer(a.capacity, 1, 1000); return load.get(str(a.id)) &lt; capacity &amp;&amp; (Array.isArray(a.repositories) &amp;&amp; (a.repositories.includes(&#39;*&#39;) \|\| a.repo… |
| capacity | const | 217 | no | const capacity = integer(a.capacity, 1, 1000); |
| agentId | const | 223 | no | const agentId = str(options[0].id); |
| coalesceObservations | function | 231 | yes | export function coalesceObservations(events = [], { maxEvents = 10000 } = {}) { |
| max | const | 232 | no | const max = integer(maxEvents, 10000, 100000); |
| stream | const | 233 | no | const stream = list(events); |
| kinds | const | 235 | no | const kinds = new Set([&#39;file.observed&#39;, &#39;index.invalidated&#39;, &#39;view.invalidated&#39;]); |
| output | const | 236 | no | const output = []; let segment = new Map(), collapsed = 0; |
| flush | function | 237 | no | const flush = () =&gt; { output.push(...segment.values()); segment = new Map(); }; |
| compactable | const | 239 | no | const compactable = e &amp;&amp; kinds.has(e.kind) &amp;&amp; e.coalescible === true &amp;&amp; e.requiresAck !== true &amp;&amp; |
| k | const | 243 | no | const k = stableJson([e.kind, e.project, e.subject]); |
| detectDrift | function | 254 | yes | export function detectDrift(records = []) { |
| id | const | 256 | no | const id = str(r?.id); |
| expectedDigest | const | 257 | no | const expectedDigest = str(r?.expectedDigest), actualDigest = str(r?.actualDigest); |
| expectedVersion | const | 258 | no | const expectedVersion = str(r?.expectedVersion), actualVersion = str(r?.actualVersion); |
| reasons | const | 259 | no | const reasons = []; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/semantic-registry.mjs](./semantic-registry.mjs.md) | ./semantic-optimizers.mjs |
| [hq/lib/wiki-program.mjs](./wiki-program.mjs.md) | ./semantic-optimizers.mjs |
| [hq/test/semantic-optimizers.test.mjs](../test/semantic-optimizers.test.mjs.md) | ../lib/semantic-optimizers.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Pure, bounded optimization primitives for shared semantic-kernel research. |
| 3 | owner | hq | — | hq |
| 4 | task | — | — | semantic-kernel-optimizers-v1 |
| 5 | invariant | — | — | No database, filesystem, network, clock, random source, or effects. |
| 6 | invariant | — | — | Plans and suggestions never grant authority or execute capabilities. |
| 7 | see | — | docs/research/semantic-language-kernel/ARCHITECTURE.md | docs/research/semantic-language-kernel/ARCHITECTURE.md |

## Excerpt

```javascript
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
```

_First 80 of 268 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
