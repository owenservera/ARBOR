# File: studio/src/intel/graph-analytics.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/graph-analytics.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10430 B |
| Lines | 282 |
| Hash | 6c77d1a73bfd |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SEP | const | 5 | no | const SEP = &#39;\\u0000&#39;; |
| idOf | function | 7 | no | function idOf(value) { |
| t | const | 9 | no | const t = typeof value; |
| raw | const | 13 | no | const raw = value.id ?? value.eid ?? value.name ?? value.label; |
| weightOf | function | 19 | no | function weightOf(edge) { |
| raw | const | 20 | no | const raw = edge.weight !== undefined ? edge.weight : edge.confidence; |
| n | const | 21 | no | const n = typeof raw === &#39;number&#39; ? raw : Number(raw); |
| toArray | function | 25 | no | function toArray(value) { |
| normalizeNodes | function | 32 | no | function normalizeNodes(nodes) { |
| seen | const | 33 | no | const seen = new Set(); |
| id | const | 35 | no | const id = idOf(raw); |
| mergeEdges | function | 42 | no | function mergeEdges(ids, edges) { |
| known | const | 43 | no | const known = new Set(ids); |
| map | const | 44 | no | const map = new Map(); |
| to | const | 48 | no | const to = idOf(edge.to !== undefined ? edge.to : edge.target); |
| key | const | 50 | no | const key = from + SEP + to; |
| prev | const | 51 | no | const prev = map.get(key); |
| weight | const | 52 | no | const weight = weightOf(edge); |
| outAdjacency | function | 59 | no | function outAdjacency(ids, edges) { |
| out | const | 60 | no | const out = new Map(ids.map((id) =&gt; [id, []])); |
| cmpId | function | 65 | no | function cmpId(a, b) { return a &lt; b ? -1 : a &gt; b ? 1 : 0; } |
| pagerank | function | 67 | yes | export function pagerank(nodes, edges, opts = {}) { |
| ids | const | 69 | no | const ids = normalizeNodes(nodes); |
| n | const | 70 | no | const n = ids.length; |
| scores | const | 71 | no | const scores = {}; |
| out | const | 74 | no | const out = outAdjacency(ids, edges); |
| outSum | const | 75 | no | const outSum = new Map(); |
| dangling | const | 76 | no | const dangling = []; |
| sum | variable | 78 | no | let sum = 0; |
| rank | variable | 84 | no | let rank = new Map(ids.map((id) =&gt; [id, 1 / n])); |
| iterLimit | const | 85 | no | const iterLimit = Number.isFinite(maxIter) ? Math.max(0, Math.floor(maxIter)) : 100; |
| iterations | variable | 86 | no | let iterations = 0; |
| converged | variable | 87 | no | let converged = false; |
| danglingMass | variable | 91 | no | let danglingMass = 0; |
| base | const | 93 | no | const base = (1 - damping) / n + (damping * danglingMass) / n; |
| next | const | 94 | no | const next = new Map(ids.map((id) =&gt; [id, base])); |
| sum | const | 96 | no | const sum = outSum.get(id); |
| share | const | 98 | no | const share = (damping * rank.get(id)) / sum; |
| delta | variable | 101 | no | let delta = 0; |
| total | variable | 107 | no | let total = 0; |
| betweenness | function | 113 | yes | export function betweenness(nodes, edges, opts = {}) { |
| ids | const | 115 | no | const ids = normalizeNodes(nodes); |
| n | const | 116 | no | const n = ids.length; |
| scores | const | 117 | no | const scores = {}; |
| adj | const | 120 | no | const adj = new Map(ids.map((id) =&gt; [id, []])); |
| limit | const | 128 | no | const limit = Number.isFinite(maxSources) ? Math.max(0, Math.floor(maxSources)) : n; |
| sources | const | 129 | no | const sources = ids.slice(0, limit); |
| sampled | const | 130 | no | const sampled = sources.length &lt; n; |
| cumulative | const | 132 | no | const cumulative = new Map(ids.map((id) =&gt; [id, 0])); |
| stack | const | 134 | no | const stack = []; |
| preds | const | 135 | no | const preds = new Map(ids.map((id) =&gt; [id, []])); |
| sigma | const | 136 | no | const sigma = new Map(ids.map((id) =&gt; [id, 0])); |
| dist | const | 137 | no | const dist = new Map(ids.map((id) =&gt; [id, -1])); |
| delta | const | 138 | no | const delta = new Map(ids.map((id) =&gt; [id, 0])); |
| queue | const | 141 | no | const queue = [source]; |
| v | const | 144 | no | const v = queue[head]; |
| dv | const | 146 | no | const dv = dist.get(v); |
| w | const | 157 | no | const w = stack[i]; |
| sw | const | 158 | no | const sw = sigma.get(w); |
| scale | const | 164 | no | const scale = sampled &amp;&amp; sources.length &gt; 0 ? n / sources.length : 1; |
| denom | const | 165 | no | const denom = normalize &amp;&amp; n &gt; 2 ? (directed ? (n - 1) * (n - 2) : ((n - 1) * (n - 2)) / 2) : 0; |
| components | function | 170 | yes | export function components(nodes, edges) { |
| ids | const | 171 | no | const ids = normalizeNodes(nodes); |
| parent | const | 172 | no | const parent = new Map(ids.map((id) =&gt; [id, id])); |
| find | function | 173 | no | const find = (x) =&gt; { |
| root | variable | 174 | no | let root = x; |
| a | const | 180 | no | const a = find(edge.from); |
| b | const | 181 | no | const b = find(edge.to); |
| groups | const | 185 | no | const groups = new Map(); |
| root | const | 187 | no | const root = find(id); |
| communities | function | 196 | yes | export function communities(nodes, edges, opts = {}) { |
| ids | const | 198 | no | const ids = normalizeNodes(nodes); |
| labels | const | 199 | no | const labels = {}; |
| neighbours | const | 202 | no | const neighbours = new Map(ids.map((id) =&gt; [id, new Map()])); |
| a | const | 205 | no | const a = neighbours.get(edge.from); |
| b | const | 206 | no | const b = neighbours.get(edge.to); |
| label | const | 211 | no | const label = new Map(ids.map((id) =&gt; [id, id])); |
| iterLimit | const | 212 | no | const iterLimit = Number.isFinite(maxIter) ? Math.max(0, Math.floor(maxIter)) : 0; |
| iterations | variable | 213 | no | let iterations = 0; |
| changed | variable | 217 | no | let changed = false; |
| totals | const | 219 | no | const totals = new Map(); |
| l | const | 221 | no | const l = label.get(nb); |
| bestLabel | variable | 224 | no | let bestLabel = null; |
| bestWeight | variable | 225 | no | let bestWeight = -Infinity; |
| weight | const | 227 | no | const weight = totals.get(l); |
| buckets | const | 238 | no | const buckets = new Map(); |
| l | const | 240 | no | const l = label.get(id); |
| groups | const | 245 | no | const groups = [...buckets.values()] |
| topK | function | 251 | yes | export function topK(scoreObj, k = 10) { |
| limit | const | 252 | no | const limit = Number.isFinite(k) ? Math.max(0, Math.floor(k)) : 10; |
| entries | const | 253 | no | const entries = []; |
| score | const | 255 | no | const score = typeof raw === &#39;number&#39; ? raw : Number(raw); |
| graphAnalytics | function | 263 | yes | export function graphAnalytics(graph, opts = {}) { |
| source | const | 264 | no | const source = graph ?? {}; |
| options | const | 265 | no | const options = opts ?? {}; |
| ids | const | 266 | no | const ids = normalizeNodes(source.nodes ?? []); |
| merged | const | 267 | no | const merged = mergeEdges(ids, source.edges ?? []); |
| rank | const | 269 | no | const rank = pagerank(ids, merged, options.pagerank ?? {}); |
| centrality | const | 270 | no | const centrality = betweenness(ids, merged, options.betweenness ?? {}); |
| parts | const | 271 | no | const parts = components(ids, merged); |
| comms | const | 272 | no | const comms = communities(ids, merged, options.communities ?? {}); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/intel/platform.mjs](./platform.mjs.md) | ./graph-analytics.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// graph-analytics.mjs — deterministic graph metrics over plain {nodes, edges} views.
// Zero deps. Every export accepts nodes = string ids and edges = {from,to,weight=1}.
// Missing weights default to 1, edges to unknown nodes are ignored, parallel edges sum.

const SEP = '\u0000';

function idOf(value) {
  if (value === null || value === undefined) return null;
  const t = typeof value;
  if (t === 'string') return value;
  if (t === 'number' || t === 'boolean' || t === 'bigint') return String(value);
  if (t === 'object') {
    const raw = value.id ?? value.eid ?? value.name ?? value.label;
    return raw === null || raw === undefined ? null : String(raw);
  }
  return null;
}

function weightOf(edge) {
  const raw = edge.weight !== undefined ? edge.weight : edge.confidence;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 1;
}

function toArray(value) {
  if (!value) return [];
  if (value instanceof Map) return [...value.values()];
  return Array.isArray(value) ? value : [...value];
}

// Deduped, sorted node ids.
function normalizeNodes(nodes) {
  const seen = new Set();
  for (const raw of toArray(nodes)) {
    const id = idOf(raw);
    if (id !== null) seen.add(id);
  }
  return [...seen].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

// Merged parallel edges, sorted by (from,to) for order-independent floats.
function mergeEdges(ids, edges) {
  const known = new Set(ids);
  const map = new Map();
  for (const edge of toArray(edges)) {
    if (!edge || typeof edge !== 'object') continue;
    const from = idOf(edge.from !== undefined ? edge.from : edge.source);
    const to = idOf(edge.to !== undefined ? edge.to : edge.target);
    if (from === null || to === null || !known.has(from) || !known.has(to)) continue;
    const key = from + SEP + to;
    const prev = map.get(key);
    const weight = weightOf(edge);
    if (prev) prev.weight += weight;
    else map.set(key, { from, to, weight });
  }
  return [...map.values()].sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : a.to < b.to ? -1 : a.to > b.to ? 1 : 0));
}

function outAdjacency(ids, edges) {
  const out = new Map(ids.map((id) => [id, []]));
  for (const edge of mergeEdges(ids, edges)) out.get(edge.from).push({ to: edge.to, weight: edge.weight });
  return out;
}

function cmpId(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

export function pagerank(nodes, edges, opts = {}) {
  const { damping = 0.85, tol = 1e-8, maxIter = 100 } = opts || {};
  const ids = normalizeNodes(nodes);
  const n = ids.length;
  const scores = {};
  if (n === 0) return { scores, iterations: 0, converged: true };

  const out = outAdjacency(ids, edges);
  const outSum = new Map();
  const dangling = [];
  for (const id of ids) {
    let sum = 0;
    for (const link of out.get(id)) sum += link.weight;
    outSum.set(id, sum);
```

_First 80 of 283 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
