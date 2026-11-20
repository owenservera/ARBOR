# File: studio/src/mirror/catalog.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/mirror/catalog.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14208 B |
| Lines | 285 |
| Hash | c471418a59de |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SEG_RE | const | 13 | no | const SEG_RE = /^\\d{6}\\.jsonl$/; |
| HEAVY | const | 14 | no | const HEAVY = new Set([&#39;chunk&#39;, &#39;body&#39;, &#39;ws.frame&#39;, &#39;dom.batch&#39;]); |
| HEAD_BYTES | const | 15 | no | const HEAD_BYTES = 1024; |
| STREAM_KINDS | const | 17 | yes | export const STREAM_KINDS = new Set([&#39;sse&#39;, &#39;ndjson&#39;, &#39;eventsource&#39;, &#39;chunked&#39;]); |
| openSession | function | 22 | yes | export function openSession(session) { |
| dir | const | 25 | no | const dir = path.resolve(session); |
| rawDirOf | function | 34 | yes | export function rawDirOf(session) { |
| rawLines | function | 42 | no | function* rawLines(rawDir) { |
| files | const | 44 | no | const files = readdirSync(rawDir).filter((f) =&gt; SEG_RE.test(f)).sort(); |
| buf | const | 45 | no | const buf = Buffer.allocUnsafe(1 &lt;&lt; 22); |
| fd | const | 47 | no | const fd = openSync(path.join(rawDir, f), &#39;r&#39;); |
| pos | variable | 49 | no | let pos = 0, carry = null; |
| n | const | 51 | no | const n = readSync(fd, buf, 0, buf.length, pos); |
| chunk | variable | 54 | no | let chunk = buf.subarray(0, n); |
| start | variable | 56 | no | let start = 0, nl; |
| num | function | 68 | no | const num = (re, s) =&gt; { const m = re.exec(s); return m ? Number(m[1]) : undefined; }; |
| str | function | 69 | no | const str = (re, s) =&gt; re.exec(s)?.[1]; |
| UUID | const | 74 | no | const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; |
| isIdLike | function | 75 | yes | export function isIdLike(seg) { |
| s | const | 76 | no | const s = String(seg ?? &#39;&#39;); |
| splitPath | function | 81 | yes | export function splitPath(p) { return String(p ?? &#39;/&#39;).split(&#39;/&#39;).filter(Boolean); } |
| templatePath | function | 82 | yes | export function templatePath(p) { |
| parseUrl | function | 86 | no | function parseUrl(url) { |
| u | const | 88 | no | const u = new URL(url); |
| s | const | 91 | no | const s = String(url ?? &#39;&#39;); |
| q | const | 92 | no | const q = s.indexOf(&#39;?&#39;); |
| loadCatalog | function | 100 | yes | export function loadCatalog(sessionLike) { |
| session | const | 101 | no | const session = openSession(sessionLike); |
| rawDir | const | 102 | no | const rawDir = rawDirOf(session); |
| exchanges | const | 103 | no | const exchanges = []; |
| current | const | 104 | no | const current = new Map(); // sid -&gt; latest exchange (redirect hops start a new one) |
| hops | const | 105 | no | const hops = new Map(); // sid -&gt; hop count |
| runStartT | variable | 106 | no | let runStartT = null, records = 0, corrupt = 0; |
| open | function | 108 | no | const open = (sid, init) =&gt; { |
| hop | const | 109 | no | const hop = hops.get(sid) ?? 0; |
| ex | const | 111 | no | const ex = { |
| head | const | 125 | no | const head = line.subarray(0, 320).toString(&#39;utf8&#39;); |
| k | const | 126 | no | const k = str(/&quot;k&quot;:&quot;([^&quot;]+)&quot;/, head); |
| sid | const | 131 | no | const sid = str(/&quot;sid&quot;:&quot;((?:[^&quot;\\\\]\|\\\\.)*)&quot;/, head); |
| ex | const | 132 | no | const ex = sid !== undefined ? current.get(sid) : undefined; |
| seq | const | 134 | no | const seq = num(/&quot;seq&quot;:(\\d+)/, head), t = num(/&quot;t&quot;:(\\d+)/, head); |
| seqTo | variable | 135 | no | let seqTo = num(/&quot;seqTo&quot;:(\\d+)/, line.subarray(0, 512).toString(&#39;utf8&#39;)); |
| dir | const | 145 | no | const dir = str(/&quot;dir&quot;:&quot;(in\|out)&quot;/, head); |
| n | const | 151 | no | const n = num(/&quot;n&quot;:(\\d+)/, head); |
| r | const | 155 | no | const r = JSON.parse(line.toString(&#39;utf8&#39;)); |
| r | variable | 162 | no | let r; |
| ex | variable | 166 | no | let ex = current.get(r.sid); |
| u | const | 169 | no | const u = parseUrl(r.url); |
| u | const | 179 | no | const u = parseUrl(r.url); |
| sp | const | 203 | no | const sp = r.headers?.[&#39;sec-websocket-protocol&#39;] ?? r.headers?.[&#39;Sec-WebSocket-Protocol&#39;]; |
| profile | variable | 219 | no | let profile = null; |
| routeKindOf | function | 229 | yes | export function routeKindOf(ex) { |
| declared | const | 231 | no | const declared = classifyMime(ex.mime); |
| d | const | 233 | no | const d = ex.head?.length ? sniff(ex.mime, ex.head) : declared; |
| loadExchangeRecords | function | 245 | yes | export async function loadExchangeRecords(catalog, ex) { |
| out | const | 246 | no | const out = []; |
| session | const | 247 | no | const session = catalog.session; |
| opts | const | 248 | no | const opts = { fromSeq: Math.max(0, (ex.seqFrom ?? 1) - 1), toSeq: ex.seqTo ?? Infinity }; |
| iter | const | 249 | no | const iter = typeof session.streamRecords === &#39;function&#39; ? session.streamRecords(ex.sid, opts) : session.records(opts); |
| KIND_RANK | const | 262 | no | const KIND_RANK = { sse: 9, eventsource: 8, ndjson: 7, ws: 7, chunked: 6, json: 5, html: 4, text: 3, binary: 2, http: 1 }; |
| routeTableOf | function | 263 | yes | export function routeTableOf(catalog) { |
| groups | const | 264 | no | const groups = new Map(); |
| g | variable | 266 | no | let g = groups.get(ex.routeKey); |
| rows | const | 273 | no | const rows = []; |
| kind | const | 275 | no | const kind = Object.keys(g.kinds).sort((a, b) =&gt; (KIND_RANK[b] ?? 0) - (KIND_RANK[a] ?? 0) \|\| g.kinds[b] - g.kinds[a])[0]; |
| withBody | const | 276 | no | const withBody = g.list.filter((e) =&gt; e.bytes &gt; 0 \|\| e.framesIn &gt; 0 \|\| e.esMessages &gt; 0); |
| rep | const | 277 | no | const rep = (withBody.length ? withBody : g.list).at(-1); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 8 | external |
| node:path | import | 9 | external |
| ../store/session.mjs | import | 10 | [studio/src/store/session.mjs](../store/session.mjs.md) |
| ../decode/decoders.mjs | import | 11 | [studio/src/decode/decoders.mjs](../decode/decoders.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/mirror/index.mjs](./index.mjs.md) | ./catalog.mjs |
| [studio/src/mirror/index.mjs](./index.mjs.md) | ./catalog.mjs |
| [studio/src/mirror/match.mjs](./match.mjs.md) | ./catalog.mjs |
| [studio/src/mirror/template.mjs](./template.mjs.md) | ./catalog.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Capture catalog for the local mirror.
//
// One entry ("exchange") per captured HTTP request hop or WebSocket, built synchronously from the
// raw log. Payload-heavy records (chunk/body/ws.frame/dom.batch) are recognised from their line
// prefix and only counted, so building the catalog never decodes the captured bodies; the first
// body chunk of each exchange is kept (head) so the transport can be sniffed from real bytes.
// Bodies are loaded lazily, per exchange, through Session.streamRecords (stream locator + seek).
import { openSync, readSync, closeSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { Session } from '../store/session.mjs';
import { sniff, classifyMime } from '../decode/decoders.mjs';

const SEG_RE = /^\d{6}\.jsonl$/;
const HEAVY = new Set(['chunk', 'body', 'ws.frame', 'dom.batch']);
const HEAD_BYTES = 1024;

export const STREAM_KINDS = new Set(['sse', 'ndjson', 'eventsource', 'chunked']);

// ---------------------------------------------------------------------------------------------
// Session resolution: a Session instance, a session directory, or { dir }.
// ---------------------------------------------------------------------------------------------
export function openSession(session) {
  if (!session) throw new Error('mirror: a session is required');
  if (typeof session === 'string') {
    const dir = path.resolve(session);
    if (!existsSync(path.join(dir, 'raw')) && !existsSync(path.join(dir, 'session.json'))) throw new Error(`mirror: no capture session at ${dir}`);
    return new Session(dir);
  }
  if (typeof session.records === 'function' && typeof session.dir === 'string') return session;
  if (typeof session.dir === 'string') return new Session(session.dir);
  throw new Error('mirror: unsupported session value (expected Session, directory path or { dir })');
}

export function rawDirOf(session) {
  return session.rawDir ?? path.join(session.dir, 'raw');
}

// ---------------------------------------------------------------------------------------------
// Synchronous raw line reader (segments in order, big lines carried across reads).
// Yielded buffers are only valid until the next iteration step.
// ---------------------------------------------------------------------------------------------
function* rawLines(rawDir) {
  if (!existsSync(rawDir)) return;
  const files = readdirSync(rawDir).filter((f) => SEG_RE.test(f)).sort();
  const buf = Buffer.allocUnsafe(1 << 22);
  for (const f of files) {
    const fd = openSync(path.join(rawDir, f), 'r');
    try {
      let pos = 0, carry = null;
      for (;;) {
        const n = readSync(fd, buf, 0, buf.length, pos);
        if (n <= 0) break;
        pos += n;
        let chunk = buf.subarray(0, n);
        if (carry) { chunk = Buffer.concat([carry, chunk]); carry = null; }
        let start = 0, nl;
        while ((nl = chunk.indexOf(0x0a, start)) !== -1) {
          if (nl > start) yield chunk.subarray(start, nl);
          start = nl + 1;
        }
        if (start < chunk.length) carry = Buffer.from(chunk.subarray(start));
      }
      if (carry?.length) yield carry; // torn trailing line: the parse below rejects it
    } finally { closeSync(fd); }
  }
}

const num = (re, s) => { const m = re.exec(s); return m ? Number(m[1]) : undefined; };
const str = (re, s) => re.exec(s)?.[1];

// ---------------------------------------------------------------------------------------------
// Path helpers shared with the matcher and the route table.
// ---------------------------------------------------------------------------------------------
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isIdLike(seg) {
  const s = String(seg ?? '');
  if (!s) return false;
  return UUID.test(s) || /^\d+$/.test(s) || /^[0-9a-f]{8,}$/i.test(s)
    || (/^[A-Za-z0-9_-]{16,}$/.test(s) && /\d/.test(s) && /[A-Za-z]/.test(s));
}
```

_First 80 of 286 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
