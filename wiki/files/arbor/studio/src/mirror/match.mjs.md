# File: studio/src/mirror/match.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/mirror/match.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9023 B |
| Lines | 182 |
| Hash | 28b7d580a8f3 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WEIGHTS | const | 14 | no | const WEIGHTS = { method: 20, path: 45, query: 15, body: 15 }; |
| IGNORED_QUERY | const | 15 | no | const IGNORED_QUERY = new Set([&#39;_&#39;, &#39;t&#39;, &#39;ts&#39;, &#39;cb&#39;, &#39;_t&#39;, &#39;_ts&#39;, &#39;timestamp&#39;, &#39;nocache&#39;, &#39;rand&#39;, &#39;r&#39;, &#39;cachebust&#39;, &#39;_cb&#39;, &#39;v&#39;]); |
| REDACTED | const | 16 | no | const REDACTED = &#39;[redacted]&#39;; |
| parseJsonMaybe | function | 18 | yes | export function parseJsonMaybe(text) { |
| t | const | 20 | no | const t = text.trim(); |
| parseIncoming | function | 27 | yes | export function parseIncoming(req, body = Buffer.alloc(0)) { |
| raw | const | 28 | no | const raw = req.url ?? &#39;/&#39;; |
| absolute | const | 29 | no | const absolute = /^[a-z][a-z0-9+.-]*:\\/\\//i.test(raw); |
| u | variable | 30 | no | let u; |
| controls | const | 32 | no | const controls = {}; |
| hostHint | const | 36 | no | const hostHint = absolute ? u.host : (req.headers[&#39;x-mirror-host&#39;] \|\| controls.host \|\| null); |
| bodyText | const | 37 | no | const bodyText = body.length ? body.toString(&#39;utf8&#39;) : &#39;&#39;; |
| isWs | const | 38 | no | const isWs = String(req.headers.upgrade ?? &#39;&#39;).toLowerCase() === &#39;websocket&#39;; |
| methodScore | function | 50 | no | function methodScore(a, b) { |
| pathScore | function | 56 | yes | export function pathScore(a, b) { |
| ja | const | 57 | no | const ja = a.join(&#39;/&#39;), jb = b.join(&#39;/&#39;); |
| sum | variable | 60 | no | let sum = 0, template = true; |
| n | const | 68 | no | const n = Math.min(a.length, b.length), m = Math.max(a.length, b.length) \|\| 1; |
| p | variable | 69 | no | let p = 0; |
| jaccard | function | 74 | no | function jaccard(a, b) { |
| inter | variable | 76 | no | let inter = 0; |
| queryScore | function | 81 | yes | export function queryScore(inc, cap) { |
| A | const | 82 | no | const A = new Map(inc.filter(([k]) =&gt; !IGNORED_QUERY.has(k))); |
| B | const | 83 | no | const B = new Map(cap.filter(([k]) =&gt; !IGNORED_QUERY.has(k))); |
| keyJ | const | 85 | no | const keyJ = jaccard(new Set(A.keys()), new Set(B.keys())); |
| shared | variable | 86 | no | let shared = 0, same = 0; |
| w | const | 90 | no | const w = B.get(k); |
| flattenLeaves | function | 97 | yes | export function flattenLeaves(node, out = new Map(), p = &#39;&#39;, limit = 600) { |
| entries | const | 100 | no | const entries = Array.isArray(node) ? node.map((v, i) =&gt; [String(i), v]) : Object.entries(node); |
| tokens | function | 106 | no | function tokens(text, limit = 4000) { |
| s | const | 107 | no | const s = new Set(); |
| jsonSimilarity | function | 112 | yes | export function jsonSimilarity(a, b) { |
| A | const | 113 | no | const A = flattenLeaves(a), B = flattenLeaves(b); |
| keyJ | const | 114 | no | const keyJ = jaccard(new Set(A.keys()), new Set(B.keys())); |
| shared | variable | 115 | no | let shared = 0, same = 0; |
| w | const | 119 | no | const w = B.get(k); |
| textSimilarity | function | 126 | yes | export function textSimilarity(a, b) { |
| ja | const | 128 | no | const ja = parseJsonMaybe(a), jb = parseJsonMaybe(b); |
| bodyScore | function | 133 | yes | export function bodyScore(inc, ex) { |
| cap | const | 134 | no | const cap = ex.postData; |
| incEmpty | const | 135 | no | const incEmpty = !inc.bodyText, capEmpty = cap === undefined \|\| cap === &#39;&#39;; |
| scoreExchange | function | 144 | yes | export function scoreExchange(inc, ex) { |
| m | const | 145 | no | const m = methodScore(inc.method, ex.method); |
| p | const | 146 | no | const p = pathScore(inc.segs, ex._segs ??= splitPath(ex.path)); |
| q | const | 147 | no | const q = queryScore(inc.query, ex.query); |
| b | const | 148 | no | const b = inc.kind === &#39;ws&#39; ? 1 : bodyScore(inc, ex); |
| total | variable | 149 | no | let total = WEIGHTS.method * m + WEIGHTS.path * p.score + WEIGHTS.query * q + WEIGHTS.body * b; |
| hasPayload | const | 152 | no | const hasPayload = ex.bytes &gt; 0 \|\| ex.esMessages &gt; 0 \|\| ex.framesIn &gt; 0; |
| how | const | 155 | no | const how = m === 1 &amp;&amp; p.exact &amp;&amp; q &gt; 0.999 &amp;&amp; b &gt; 0.999 ? &#39;exact&#39; : m &gt;= 0.75 &amp;&amp; p.template ? &#39;route&#39; : &#39;nearest&#39;; |
| summarize | function | 159 | yes | export function summarize(ex, s) { |
| findMatch | function | 164 | yes | export function findMatch(catalog, inc, { minScore = 35, fallback = true } = {}) { |
| wantWs | const | 165 | no | const wantWs = inc.kind === &#39;ws&#39;; |
| scored | const | 166 | no | const scored = []; |
| best | const | 173 | no | const best = scored[0]; |
| pool | const | 175 | no | const pool = scored.filter((c) =&gt; c.ex.routeKey === best.ex.routeKey &amp;&amp; best.s.total - c.s.total &lt;= 0.5); |
| chosen | const | 177 | no | const chosen = pool[0]; |
| alternatives | const | 178 | no | const alternatives = scored.slice(0, 4).map((c) =&gt; summarize(c.ex, c.s)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./catalog.mjs | import | 12 | [studio/src/mirror/catalog.mjs](./catalog.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/mirror/index.mjs](./index.mjs.md) | ./match.mjs |
| [studio/src/mirror/index.mjs](./index.mjs.md) | ./match.mjs |
| [studio/src/mirror/template.mjs](./template.mjs.md) | ./match.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Request -> captured exchange matching by similarity scoring.
//
// Score (0..100, plus small bonuses):
//   method 20   same method (HEAD~GET counts 15)
//   path   45   exact path, else per-segment equality with id-like segments treated as variables
//   query  15   key Jaccard + value agreement (cache-buster keys ignored, redacted values wildcard)
//   body   15   JSON leaf-path Jaccard + leaf value agreement, or token Jaccard for text
//   host   +-5  only when the client names a host (absolute-form proxy URL or x-mirror-host)
// "how": exact (everything equal) | route (same method + templated path) | nearest (fallback).
// Among equally good candidates the least-used one in capture order wins, so a repeated call
// replays successive captures of the same endpoint (polling, multi-turn conversations).
import { splitPath, isIdLike } from './catalog.mjs';

const WEIGHTS = { method: 20, path: 45, query: 15, body: 15 };
const IGNORED_QUERY = new Set(['_', 't', 'ts', 'cb', '_t', '_ts', 'timestamp', 'nocache', 'rand', 'r', 'cachebust', '_cb', 'v']);
const REDACTED = '[redacted]';

export function parseJsonMaybe(text) {
  if (typeof text !== 'string') return undefined;
  const t = text.trim();
  if (!t || (t[0] !== '{' && t[0] !== '[')) return undefined;
  try { return JSON.parse(t); } catch { return undefined; }
}

// Normalised view of an incoming request. `controls` collects __mirror_* query parameters,
// which steer the mirror and never take part in matching.
export function parseIncoming(req, body = Buffer.alloc(0)) {
  const raw = req.url ?? '/';
  const absolute = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw);
  let u;
  try { u = new URL(absolute ? raw : raw.startsWith('/') ? raw : `/${raw}`, 'http://mirror.invalid'); } catch { u = new URL('http://mirror.invalid/'); }
  const controls = {};
  for (const k of [...u.searchParams.keys()]) {
    if (k.startsWith('__mirror_')) { controls[k.slice(9)] = u.searchParams.get(k); u.searchParams.delete(k); }
  }
  const hostHint = absolute ? u.host : (req.headers['x-mirror-host'] || controls.host || null);
  const bodyText = body.length ? body.toString('utf8') : '';
  const isWs = String(req.headers.upgrade ?? '').toLowerCase() === 'websocket';
  return {
    method: String(req.method ?? 'GET').toUpperCase(), kind: isWs ? 'ws' : 'http',
    path: u.pathname || '/', segs: splitPath(u.pathname), query: [...u.searchParams.entries()],
    search: u.search, hostHint: hostHint ? String(hostHint).toLowerCase() : null,
    headers: req.headers, body, bodyText, json: parseJsonMaybe(bodyText), controls,
  };
}

// ---------------------------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------------------------
function methodScore(a, b) {
  if (a === b) return 1;
  if ((a === 'HEAD' && b === 'GET') || (a === 'GET' && b === 'HEAD')) return 0.75;
  return 0;
}

export function pathScore(a, b) {
  const ja = a.join('/'), jb = b.join('/');
  if (ja === jb) return { score: 1, exact: true, template: true };
  if (a.length === b.length && a.length > 0) {
    let sum = 0, template = true;
    for (let i = 0; i < a.length; i++) {
      if (a[i] === b[i]) sum += 1;
      else if (b[i] === REDACTED || b[i] === '{id}' || (isIdLike(a[i]) && isIdLike(b[i]))) sum += 0.85;
      else { template = false; if (a[i].toLowerCase() === b[i].toLowerCase()) sum += 0.9; }
    }
    return { score: (sum / a.length) * (template ? 1 : 0.7), exact: false, template };
  }
  const n = Math.min(a.length, b.length), m = Math.max(a.length, b.length) || 1;
  let p = 0;
  while (p < n && (a[p] === b[p] || (isIdLike(a[p]) && isIdLike(b[p])))) p++;
  return { score: 0.5 * (p / m), exact: false, template: false };
}

function jaccard(a, b) {
  if (!a.size && !b.size) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}
```

_First 80 of 183 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
