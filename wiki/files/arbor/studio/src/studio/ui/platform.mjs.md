# File: studio/src/studio/ui/platform.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/ui/platform.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 19409 B |
| Lines | 444 |
| Hash | ae7848e323f1 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| state | const | 5 | no | const state = { sessions: [], selected: &#39;&#39; }; |
| $ | function | 7 | no | const $ = (sel) =&gt; document.querySelector(sel); |
| out | function | 8 | no | const out = (id) =&gt; document.getElementById(id); |
| el | function | 10 | no | function el(tag, props = {}, children = []) { |
| node | const | 11 | no | const node = document.createElement(tag); |
| clear | function | 22 | no | function clear(node) { node.replaceChildren(); } |
| showError | function | 24 | no | function showError(node, result) { |
| status | const | 26 | no | const status = result?.status ?? 0; |
| message | const | 27 | no | const message = result?.data?.error ?? (status ? `HTTP ${status}` : &#39;request failed&#39;); |
| fetchJson | function | 31 | no | async function fetchJson(path, options = {}) { |
| res | variable | 32 | no | let res; |
| data | variable | 42 | no | let data = {}; |
| text | const | 43 | no | const text = await res.text(); |
| dl | function | 52 | no | function dl(pairs) { |
| node | const | 53 | no | const node = el(&#39;dl&#39;, { class: &#39;kv&#39; }); |
| table | function | 60 | no | function table(headers, rows) { |
| wrap | const | 61 | no | const wrap = el(&#39;div&#39;, { class: &#39;table-wrap&#39; }); |
| t | const | 62 | no | const t = el(&#39;table&#39;); |
| head | const | 63 | no | const head = el(&#39;tr&#39;); |
| body | const | 66 | no | const body = el(&#39;tbody&#39;); |
| tr | const | 68 | no | const tr = el(&#39;tr&#39;); |
| td | const | 70 | no | const td = el(&#39;td&#39;); |
| bar | function | 82 | no | function bar(value) { |
| pct | const | 83 | no | const pct = Math.max(0, Math.min(1, Number(value) \|\| 0)); |
| renderSnippet | function | 88 | no | function renderSnippet(detail, fallback) { |
| text | const | 89 | no | const text = typeof detail?.text === &#39;string&#39; ? detail.text : (typeof fallback === &#39;string&#39; ? fallback : &#39;&#39;); |
| node | const | 90 | no | const node = el(&#39;div&#39;, { class: &#39;snippet&#39; }); |
| raw | const | 91 | no | const raw = Array.isArray(detail?.highlights) ? detail.highlights : []; |
| ranges | const | 92 | no | const ranges = raw |
| cursor | variable | 97 | no | let cursor = 0; |
| i | variable | 98 | no | let i = 0; |
| j | variable | 101 | no | let j = i + 1; |
| list | function | 113 | no | function list(items) { |
| node | const | 114 | no | const node = el(&#39;ul&#39;, { class: &#39;plain&#39; }); |
| li | const | 116 | no | const li = el(&#39;li&#39;); |
| loadSessions | function | 126 | no | async function loadSessions() { |
| result | const | 127 | no | const result = await fetchJson(&#39;/api/sessions&#39;); |
| previous | const | 129 | no | const previous = state.selected; |
| sessions | const | 136 | no | const sessions = Array.isArray(result.data) ? result.data : Array.isArray(result.data?.sessions) ? result.data.sessions : []; |
| id | const | 140 | no | const id = s?.id ?? &#39;&#39;; |
| label | const | 141 | no | const label = s?.label ?? s?.id ?? &#39;(unnamed)&#39;; |
| status | const | 142 | no | const status = s?.status ? ` (${s.status})` : &#39;&#39;; |
| syncSessionLabels | function | 150 | no | function syncSessionLabels() { |
| loadOverview | function | 157 | no | async function loadOverview() { |
| node | const | 158 | no | const node = out(&#39;overview-out&#39;); |
| result | const | 159 | no | const result = await fetchJson(&#39;/api/x/stats&#39;); |
| badge | const | 160 | no | const badge = out(&#39;up-state&#39;); |
| stats | const | 167 | no | const stats = result.data; |
| up | const | 168 | no | const up = stats?.schema === &#39;capture-studio.platform-stats/1&#39;; |
| integrity | const | 172 | no | const integrity = stats?.integrity ?? {}; |
| knowledge | const | 173 | no | const knowledge = stats?.knowledge ?? {}; |
| migrations | const | 190 | no | const migrations = Array.isArray(stats?.migrations) ? stats.migrations : []; |
| hitsOf | function | 196 | no | function hitsOf(data) { |
| runSearch | function | 204 | no | async function runSearch() { |
| node | const | 205 | no | const node = out(&#39;search-out&#39;); |
| query | const | 206 | no | const query = out(&#39;search-q&#39;).value.trim(); |
| limit | const | 207 | no | const limit = Number(out(&#39;search-limit&#39;).value) \|\| 20; |
| params | const | 209 | no | const params = new URLSearchParams({ q: query, limit: String(limit) }); |
| onlySession | const | 210 | no | const onlySession = out(&#39;search-only-session&#39;)?.checked &amp;&amp; state.selected; |
| result | variable | 212 | no | let result = await fetchJson(`/api/search?${params.toString()}`); |
| source | variable | 213 | no | let source = &#39;/api/search&#39;; |
| hits | const | 220 | no | const hits = hitsOf(result.data); |
| title | const | 224 | no | const title = el(&#39;div&#39;, { class: &#39;muted&#39; }); |
| bits | const | 225 | no | const bits = [hit?.layer, hit?.sid ?? hit?.ref ?? hit?.eid, hit?.seq != null ? `seq ${hit.seq}` : null, |
| block | const | 228 | no | const block = el(&#39;div&#39;, { class: &#39;hit&#39; }, [title, renderSnippet(hit?.snippetDetail, hit?.snippet)]); |
| matched | const | 229 | no | const matched = Array.isArray(hit?.matched) ? hit.matched : []; |
| fuzzy | const | 230 | no | const fuzzy = Array.isArray(hit?.fuzzyMatched) ? hit.fuzzyMatched : []; |
| terms | const | 232 | no | const terms = el(&#39;div&#39;, { class: &#39;muted&#39; }); |
| fuzzyTerms | const | 233 | no | const fuzzyTerms = fuzzy.map((f) =&gt; (f &amp;&amp; typeof f === &#39;object&#39; ? (f.to ?? f.term ?? &#39;&#39;) : String(f))).filter(Boolean); |
| runDetect | function | 244 | no | async function runDetect() { |
| node | const | 245 | no | const node = out(&#39;detect-out&#39;); |
| text | const | 246 | no | const text = out(&#39;detect-text&#39;).value; |
| result | const | 247 | no | const result = await fetchJson(&#39;/api/x/autodetect&#39;, { method: &#39;POST&#39;, body: JSON.stringify({ text }) }); |
| data | const | 249 | no | const data = result.data; |
| candidates | const | 259 | no | const candidates = Array.isArray(data?.candidates) ? data.candidates : []; |
| row | const | 262 | no | const row = el(&#39;div&#39;, { class: &#39;bars&#39; }); |
| evidence | const | 268 | no | const evidence = Array.isArray(c?.evidence) ? c.evidence : []; |
| scan | const | 271 | no | const scan = data?.securityScan ?? {}; |
| counts | const | 273 | no | const counts = scan?.counts &amp;&amp; typeof scan.counts === &#39;object&#39; ? scan.counts : {}; |
| total | const | 274 | no | const total = Object.values(counts).reduce((sum, n) =&gt; sum + (Number(n) \|\| 0), 0); |
| matches | const | 277 | no | const matches = Array.isArray(scan?.matches) ? scan.matches : []; |
| runGraph | function | 286 | no | async function runGraph() { |
| node | const | 287 | no | const node = out(&#39;graph-out&#39;); |
| result | const | 289 | no | const result = await fetchJson(`/api/x/graph/${encodeURIComponent(state.selected)}`); |
| data | const | 291 | no | const data = result.data; |
| stats | const | 292 | no | const stats = data?.stats ?? {}; |
| rankRows | const | 305 | no | const rankRows = (data?.pagerank?.ranked ?? []).map((r) =&gt; [r?.id, r?.score, bar(r?.score)]); |
| centerRows | const | 308 | no | const centerRows = (data?.betweenness?.ranked ?? []).map((r) =&gt; [r?.id, r?.score]); |
| comms | const | 312 | no | const comms = Array.isArray(data?.communities) ? data.communities : []; |
| comps | const | 315 | no | const comps = Array.isArray(data?.components) ? data.components : []; |
| runDedupe | function | 321 | no | async function runDedupe() { |
| node | const | 322 | no | const node = out(&#39;dedupe-out&#39;); |
| max | const | 324 | no | const max = Number(out(&#39;dedupe-max&#39;).value) \|\| 3000; |
| result | const | 325 | no | const result = await fetchJson(`/api/x/dedupe/${encodeURIComponent(state.selected)}?max=${max}`); |
| data | const | 327 | no | const data = result.data; |
| stats | const | 328 | no | const stats = data?.stats ?? {}; |
| wasted | const | 330 | no | const wasted = Number(stats?.wastedShare) \|\| 0; |
| clusters | const | 339 | no | const clusters = Array.isArray(data?.clusters) ? data.clusters : []; |
| runCsv | function | 346 | no | async function runCsv() { |
| node | const | 347 | no | const node = out(&#39;csv-out&#39;); |
| text | const | 348 | no | const text = out(&#39;csv-text&#39;).value; |
| result | const | 349 | no | const result = await fetchJson(&#39;/api/x/csv&#39;, { method: &#39;POST&#39;, body: JSON.stringify({ text }) }); |
| data | const | 351 | no | const data = result.data; |
| headerScore | const | 353 | no | const headerScore = data?.headerScore ?? {}; |
| header | const | 361 | no | const header = Array.isArray(data?.header) ? data.header : []; |
| records | const | 362 | no | const records = Array.isArray(data?.records) ? data.records : []; |
| columns | const | 364 | no | const columns = header.length ? header : (records[0] ? Object.keys(records[0]) : []); |
| rows | const | 365 | no | const rows = records.map((r) =&gt; columns.map((c) =&gt; { if (r &amp;&amp; typeof r === &#39;object&#39;) { const v = Array.isArray(r) ? r[columns.indexOf(c)] : r[c]; return v == null ? &#39;&#39; : typeof v === &#39;object&#39; ? JSON.… |
| v | const | 367 | no | const v = Array.isArray(r) ? r[columns.indexOf(c)] : r[c]; |
| runRegistry | function | 377 | no | async function runRegistry() { |
| node | const | 378 | no | const node = out(&#39;registry-out&#39;); |
| result | const | 379 | no | const result = await fetchJson(&#39;/api/x/registry&#39;); |
| kinds | const | 381 | no | const kinds = result.data?.kinds ?? {}; |
| names | const | 383 | no | const names = Object.keys(kinds); |
| entries | const | 386 | no | const entries = Array.isArray(kinds[kind]?.entries) ? kinds[kind].entries : []; |
| runBench | function | 396 | no | async function runBench() { |
| node | const | 397 | no | const node = out(&#39;bench-out&#39;); |
| result | const | 398 | no | const result = await fetchJson(&#39;/api/x/bench&#39;); |
| pre | function | 404 | no | function pre(data) { |
| selectTab | function | 410 | no | function selectTab(name) { |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Platform dashboard for the optional /api/x capabilities.
// Same-origin local Studio requests. Default local access needs no cookie; optional token mode uses one.
// Captured text is rendered with textContent and DOM nodes, never as HTML.

const state = { sessions: [], selected: '' };

const $ = (sel) => document.querySelector(sel);
const out = (id) => document.getElementById(id);

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, String(value));
  }
  for (const child of [].concat(children)) if (child != null) node.append(child);
  return node;
}

function clear(node) { node.replaceChildren(); }

function showError(node, result) {
  clear(node);
  const status = result?.status ?? 0;
  const message = result?.data?.error ?? (status ? `HTTP ${status}` : 'request failed');
  node.append(el('p', { class: 'err', text: `${status || 0} — ${message}` }));
}

async function fetchJson(path, options = {}) {
  let res;
  try {
    res = await fetch(path, {
      credentials: 'same-origin',
      ...options,
      headers: options.body ? { 'content-type': 'application/json' } : {},
    });
  } catch (e) {
    return { ok: false, status: 0, data: { error: String(e?.message ?? e) } };
  }
  let data = {};
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); }
    catch { data = { error: 'response was not JSON' }; }
  }
  if (!data || typeof data !== 'object') data = { value: data };
  return { ok: res.ok, status: res.status, data };
}

function dl(pairs) {
  const node = el('dl', { class: 'kv' });
  for (const [key, value] of pairs) {
    node.append(el('dt', { text: key }), el('dd', { text: value == null ? '—' : String(value) }));
  }
  return node;
}

function table(headers, rows) {
  const wrap = el('div', { class: 'table-wrap' });
  const t = el('table');
  const head = el('tr');
  for (const h of headers) head.append(el('th', { text: h }));
  t.append(el('thead', {}, [head]));
  const body = el('tbody');
  for (const row of rows) {
    const tr = el('tr');
    for (const cell of row) {
      const td = el('td');
      if (cell instanceof Node) td.append(cell);
      else td.textContent = cell == null ? '' : String(cell);
      tr.append(td);
    }
    body.append(tr);
  }
  t.append(body);
  wrap.append(t);
  return wrap;
}
```

_First 80 of 445 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
