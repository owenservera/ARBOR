# File: studio/src/mirror/replay.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/mirror/replay.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10740 B |
| Lines | 210 |
| Hash | 15a0b882fb8d |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| createClock | function | 12 | yes | export function createClock({ speed = 1, instant = false } = {}) { |
| start | const | 13 | no | const start = performance.now(); |
| factor | const | 14 | no | const factor = instant \|\| !(Number(speed) &gt; 0) \|\| !Number.isFinite(Number(speed)) ? 0 : 1 / Number(speed); |
| wait | const | 21 | no | const wait = start + Math.max(0, atMs) * factor - performance.now(); |
| relativeTimes | function | 27 | yes | export function relativeTimes(records, t0) { |
| out | const | 28 | no | const out = []; |
| lastAt | variable | 29 | no | let lastAt = 0, lastCt = null; |
| at | variable | 31 | no | let at; |
| DROP_RES_HEADERS | const | 44 | no | const DROP_RES_HEADERS = new Set([ &#39;content-length&#39;, &#39;content-encoding&#39;, &#39;transfer-encoding&#39;, &#39;connection&#39;, &#39;keep-alive&#39;, &#39;set-cookie&#39;, &#39;cookie&#39;, &#39;strict-transport-security&#39;, &#39;alt-svc&#39;, &#39;content-secu… |
| cleanResponseHeaders | function | 51 | yes | export function cleanResponseHeaders(headers) { |
| out | const | 52 | no | const out = []; |
| n | const | 54 | no | const n = name.toLowerCase(); |
| values | const | 57 | no | const values = String(value).split(&#39;\\n&#39;).map((v) =&gt; v.trim()).filter((v) =&gt; v &amp;&amp; !/[\\r\\0]/.test(v)); |
| localizeUrl | function | 64 | yes | export function localizeUrl(url, hosts) { |
| u | const | 66 | no | const u = new URL(url); |
| buildHttpPlan | function | 73 | yes | export function buildHttpPlan(ex, records, { hosts = [] } = {}) { |
| ats | const | 74 | no | const ats = relativeTimes(records, ex.startT ?? records[0]?.t ?? 0); |
| status | variable | 75 | no | let status, headers = [], headersAt = null, endAt = null, end = &#39;end&#39;, mime; |
| parts | const | 76 | no | const parts = [], es = [], notes = {}; |
| at | const | 78 | no | const at = ats[i]; |
| s | variable | 99 | no | let s = &#39;&#39;; |
| waitDrain | function | 120 | no | function waitDrain(res, signal) { |
| done | function | 122 | no | const done = () =&gt; { res.off(&#39;drain&#39;, done); signal?.removeEventListener(&#39;abort&#39;, ab); resolve(); }; |
| ab | function | 123 | no | const ab = () =&gt; { res.off(&#39;drain&#39;, done); reject(signal.reason ?? new Error(&#39;aborted&#39;)); }; |
| sendHttpPlan | function | 130 | yes | export async function sendHttpPlan(req, res, plan, { clock, extraHeaders = [], head = false }) { |
| ac | const | 131 | no | const ac = new AbortController(); |
| onClose | function | 132 | no | const onClose = () =&gt; { if (!res.writableFinished) ac.abort(new Error(&#39;client closed&#39;)); }; |
| bytes | variable | 135 | no | let bytes = 0, chunks = 0; |
| single | const | 139 | no | const single = plan.parts.length &lt;= 1 &amp;&amp; plan.end === &#39;end&#39;; |
| buildWsScript | function | 170 | yes | export function buildWsScript(ex, records) { |
| ats | const | 171 | no | const ats = relativeTimes(records, ex.startT ?? records[0]?.t ?? 0); |
| frames | const | 172 | no | const frames = []; |
| dir | const | 175 | no | const dir = r.dir === &#39;out&#39; ? &#39;out&#39; : &#39;in&#39;; |
| prev | const | 178 | no | const prev = [...frames].reverse().find((x) =&gt; x.dir === dir &amp;&amp; !x.metaOnly); |
| binaryish | const | 185 | no | const binaryish = r.opcode === 2 \|\| r.opcode === 8; |
| payload | const | 186 | no | const payload = Buffer.from(r.payload ?? &#39;&#39;, binaryish ? &#39;base64&#39; : &#39;utf8&#39;); |
| turns | const | 192 | no | const turns = [{ index: 0, trigger: null, start: 0, frames: [] }]; |
| t | const | 198 | no | const t = turns[turns.length - 1]; |
| counts | const | 203 | no | const counts = new Map(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:timers/promises | import | 6 | external |
| node:perf_hooks | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/mirror/index.mjs](./index.mjs.md) | ./replay.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Replay plans and timed writers.
//
// Timing: offsets are measured from the captured request (or WebSocket open). Consecutive records
// that both carry the browser's monotonic timestamp (ct, seconds) use its difference; otherwise
// the collector's wall clock (t, ms) is used. speed > 1 plays faster, instant skips every wait.
import { setTimeout as sleep } from 'node:timers/promises';
import { performance } from 'node:perf_hooks';

// ---------------------------------------------------------------------------------------------
// Clock
// ---------------------------------------------------------------------------------------------
export function createClock({ speed = 1, instant = false } = {}) {
  const start = performance.now();
  const factor = instant || !(Number(speed) > 0) || !Number.isFinite(Number(speed)) ? 0 : 1 / Number(speed);
  return {
    instant: factor === 0,
    elapsed: () => performance.now() - start,
    async until(atMs, signal) {
      if (signal?.aborted) throw signal.reason ?? new Error('aborted');
      if (factor === 0) return;
      const wait = start + Math.max(0, atMs) * factor - performance.now();
      if (wait > 1) await sleep(wait, undefined, signal ? { signal } : undefined);
    },
  };
}

export function relativeTimes(records, t0) {
  const out = [];
  let lastAt = 0, lastCt = null;
  for (const r of records) {
    let at;
    if (typeof r.ct === 'number' && lastCt !== null) at = lastAt + Math.max(0, (r.ct - lastCt) * 1000);
    else at = Math.max(lastAt, (r.t ?? t0) - t0);
    out.push(at);
    lastAt = at;
    lastCt = typeof r.ct === 'number' ? r.ct : null;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------------------------
const DROP_RES_HEADERS = new Set([
  'content-length', 'content-encoding', 'transfer-encoding', 'connection', 'keep-alive', 'set-cookie', 'cookie',
  'strict-transport-security', 'alt-svc', 'content-security-policy', 'content-security-policy-report-only',
  'report-to', 'nel', 'upgrade', 'proxy-connection', 'trailer', 'te', 'access-control-allow-origin',
  'access-control-allow-credentials', 'public-key-pins', 'expect-ct', 'location',
]);

export function cleanResponseHeaders(headers) {
  const out = [];
  for (const [name, value] of Object.entries(headers ?? {})) {
    const n = name.toLowerCase();
    if (n.startsWith(':') || DROP_RES_HEADERS.has(n)) continue;
    if (value === '[redacted]' || value === '[dropped]' || value === undefined || value === null) continue;
    const values = String(value).split('\n').map((v) => v.trim()).filter((v) => v && !/[\r\0]/.test(v));
    if (values.length) out.push([n, values.length === 1 ? values[0] : values]);
  }
  return out;
}

// Rewrite an absolute URL on a captured host to a mirror-relative path.
export function localizeUrl(url, hosts) {
  try {
    const u = new URL(url);
    if (hosts.includes(u.host)) return `${u.pathname}${u.search}${u.hash}`;
  } catch { /* relative already */ }
  return url;
}

// { status, headers:[[k,v]], headersAt, parts:[{at,buf}], endAt, end:'end'|'destroy', notes }
export function buildHttpPlan(ex, records, { hosts = [] } = {}) {
  const ats = relativeTimes(records, ex.startT ?? records[0]?.t ?? 0);
  let status, headers = [], headersAt = null, endAt = null, end = 'end', mime;
  const parts = [], es = [], notes = {};
  records.forEach((r, i) => {
    const at = ats[i];
    switch (r.k) {
      case 'res': status = r.status; mime = r.mime; headers = cleanResponseHeaders(r.headers); headersAt = at; if (r.redirect) notes.redirect = true; break;
```

_First 80 of 211 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
