# File: studio/scripts/fixture-site.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/fixture-site.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8109 B |
| Lines | 193 |
| Hash | aa3701849b8b |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sleep | function | 22 | no | const sleep = (ms) =&gt; new Promise((r) =&gt; setTimeout(r, ms)); |
| CHAT_WORDS | const | 27 | yes | export const CHAT_WORDS = Object.freeze([ &#39;wordalpha&#39;, &#39;wordbravo&#39;, &#39;wordcharl&#39;, &#39;worddelta&#39;, &#39;wordecho&#39;, &#39;wordfoxtrot&#39;, &#39;wordgolf&#39;, &#39;wordhotel&#39;, &#39;wordindia&#39;, &#39;wordjuliet&#39;, &#39;wordkilo&#39;, &#39;wordlima&#39;, ]); |
| CHAT_WORD_TYPO | const | 33 | yes | export const CHAT_WORD_TYPO = &#39;wordalpa&#39;; |
| ITEMS | const | 36 | yes | export const ITEMS = Object.freeze([ { id: &#39;item-01&#39;, name: &#39;Widget&#39;, price: 9.5 }, { id: &#39;item-02&#39;, name: &#39;Gadget&#39;, price: 19.25 }, { id: &#39;item-03&#39;, name: &#39;Doohickey&#39;, price: 3.75 }, { id: &#39;item-04&#39;… |
| CSV_TEXT | const | 48 | yes | export const CSV_TEXT = [ |
| NDJSON_ROWS | const | 58 | yes | export const NDJSON_ROWS = Object.freeze(Array.from({ length: 6 }, (_, i) =&gt; ({ id: `row-${String(i + 1).padStart(2, &#39;0&#39;)}`, label: `row ${i + 1}`, value: (i + 1) * 10, }))); |
| PAGE | const | 64 | no | const PAGE = `&lt;!doctype html&gt; |
| r | const | 76 | no | const r = await fetch(&#39;/api/chat&#39;, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify({ prompt: &#39;hello fixture&#39; }) }); |
| reader | const | 77 | no | const reader = r.body.getReader(); |
| dec | const | 78 | no | const dec = new TextDecoder(); |
| buf | variable | 79 | no | let buf = &#39;&#39;, text = &#39;&#39;; |
| i | variable | 84 | no | let i; |
| raw | const | 86 | no | const raw = buf.slice(0, i); buf = buf.slice(i + 2); |
| data | const | 87 | no | const data = raw.split(&#39;\\\\n&#39;).filter((l) =&gt; l.startsWith(&#39;data:&#39;)).map((l) =&gt; l.slice(5).trim()).join(&#39;&#39;); |
| j | const | 90 | no | const j = JSON.parse(data); |
| items | const | 98 | no | const items = await fetch(&#39;/api/items&#39;).then((r) =&gt; r.json()); |
| ul | const | 99 | no | const ul = document.getElementById(&#39;items&#39;); |
| li | const | 101 | no | const li = document.createElement(&#39;li&#39;); |
| startFixture | function | 117 | yes | export async function startFixture({ port = 0, host = &#39;127.0.0.1&#39;, outcomeText = &#39;&#39; } = {}) { |
| server | const | 118 | no | const server = http.createServer(async (req, res) =&gt; { const url = new URL(req.url, `http://${host}`); const p = url.pathname; try { if (p === &#39;/&#39; &amp;&amp; (req.method === &#39;GET&#39; \|\| req.method === &#39;HEAD&#39;)) { |
| url | const | 119 | no | const url = new URL(req.url, `http://${host}`); |
| p | const | 120 | no | const p = url.pathname; |
| wait | const | 160 | no | const wait = Math.min(2000, Math.max(0, Number(url.searchParams.get(&#39;wait&#39;) ?? 200) \|\| 0)); |
| actualPort | const | 179 | no | const actualPort = server.address().port; |
| fixture | const | 191 | no | const fixture = await startFixture({ port: Number(process.argv[2] ?? 0) }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:http | import | 20 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/scripts/live-e2e.mjs](./live-e2e.mjs.md) | ./fixture-site.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Deterministic local fixture site for the Capture Studio live end-to-end driver.
//
// Everything here is synthetic and fixed: no real website data, no randomness, no clock
// dependent content. Two runs produce byte-identical responses, so the driver can compare
// captured bytes with the fixture and know that a difference is a real difference.
//
//   node scripts/fixture-site.mjs            # prints the URL and stays up
//   import { startFixture } from './fixture-site.mjs'
//
// Endpoints
//   GET  /            HTML page; its inline script streams SSE text into the DOM, loads a
//                     JSON list and opens one WebSocket-free long poll
//   POST /api/chat    text/event-stream: 12 `data: {"delta":"word …"}` events 80 ms apart,
//                     then `data: [DONE]`
//   GET  /api/items   JSON array of 8 objects {id, name, price}
//   GET  /api/ndjson  application/x-ndjson: 6 lines spread over 300 ms
//   GET  /data.csv    text/csv: a small table
//   GET  /api/poll    long poll: answers with 204 after ?wait=ms (nothing else)

import http from 'node:http';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The twelve streamed words. Distinct, >= 8 characters and sharing the "word" prefix so the
// driver can (a) check that they appear in order in an export and (b) search for one of them
// and for a one-character typo of it.
export const CHAT_WORDS = Object.freeze([
  'wordalpha', 'wordbravo', 'wordcharl', 'worddelta', 'wordecho', 'wordfoxtrot',
  'wordgolf', 'wordhotel', 'wordindia', 'wordjuliet', 'wordkilo', 'wordlima',
]);

// A word from CHAT_WORDS with one transposed pair of characters (edit distance 1).
export const CHAT_WORD_TYPO = 'wordalpa';

// The JSON list served by GET /api/items.
export const ITEMS = Object.freeze([
  { id: 'item-01', name: 'Widget', price: 9.5 },
  { id: 'item-02', name: 'Gadget', price: 19.25 },
  { id: 'item-03', name: 'Doohickey', price: 3.75 },
  { id: 'item-04', name: 'Thingamabob', price: 42 },
  { id: 'item-05', name: 'Gizmo', price: 7.25 },
  { id: 'item-06', name: 'Sprocket', price: 15.5 },
  { id: 'item-07', name: 'Flange', price: 5.75 },
  { id: 'item-08', name: 'Bracket', price: 11.4 },
]);

// The table served by GET /data.csv.
export const CSV_TEXT = [
  'id,name,price',
  'item-01,Widget,9.50',
  'item-02,Gadget,19.25',
  'item-03,Doohickey,3.75',
  'item-04,Thingamabob,42.00',
  '',
].join('\n');

// The lines served by GET /api/ndjson.
export const NDJSON_ROWS = Object.freeze(Array.from({ length: 6 }, (_, i) => ({
  id: `row-${String(i + 1).padStart(2, '0')}`,
  label: `row ${i + 1}`,
  value: (i + 1) * 10,
})));

const PAGE = `<!doctype html>
<html><head><meta charset="utf-8"><title>Capture Studio Fixture</title></head>
<body><main>
<h1>Capture Studio fixture page</h1>
<div data-role="user">hello fixture</div>
<pre id="stream" data-role="assistant"></pre>
<ul id="items"></ul>
</main>
<script>
(async () => {
  // (a) POST /api/chat: read the SSE stream and render every delta into the DOM.
  try {
    const r = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: 'hello fixture' }) });
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = '', text = '';
    for (;;) {
```

_First 80 of 194 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
