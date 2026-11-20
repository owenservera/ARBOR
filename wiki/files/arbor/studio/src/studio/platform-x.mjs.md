# File: studio/src/studio/platform-x.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/platform-x.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5171 B |
| Lines | 113 |
| Hash | d69a5c016c0d |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MB | const | 5 | no | const MB = 1024 * 1024; |
| handlePlatformX | function | 7 | yes | export async function handlePlatformX(req, res, ctx, url) { |
| parts | variable | 9 | no | let parts; |
| route | const | 12 | no | const route = match(parts[3], parts.slice(4)); |
| mod | variable | 21 | no | let mod; |
| data | const | 24 | no | const data = await mod.runBench(); |
| data | const | 28 | no | const data = await route.run(req, ctx, url); |
| sessionRoute | function | 47 | no | function sessionRoute(head, rest) { |
| id | const | 49 | no | const id = rest[0]; |
| openSession | function | 56 | no | function openSession(ctx, id) { |
| dedupeOpts | function | 66 | no | function dedupeOpts(url) { |
| q | const | 67 | no | const q = Object.fromEntries(url.searchParams); |
| max | const | 68 | no | const max = integer(q.max, 3000, 1000000, 1); |
| threshold | const | 70 | no | const threshold = Number(q.threshold); |
| textBody | function | 75 | no | async function textBody(req) { |
| body | const | 76 | no | const body = await readJson(req, MB); |
| readJson | function | 82 | no | function readJson(req, max) { |
| declared | const | 84 | no | const declared = Number(req.headers[&#39;content-length&#39;] ?? 0); |
| n | variable | 86 | no | let n = 0, oversized = false; |
| parts | const | 87 | no | const parts = []; |
| body | const | 98 | no | const body = parts.length ? JSON.parse(Buffer.concat(parts).toString(&#39;utf8&#39;)) : {}; |
| call | function | 106 | no | async function call(name, invoke) { |
| mod | variable | 107 | no | let mod; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../store/session.mjs | import | 2 | [studio/src/store/session.mjs](../store/session.mjs.md) |
| ./http.mjs | import | 3 | [studio/src/studio/http.mjs](./http.mjs.md) |
| ../intel/bench.mjs | dynamic | 22 | [studio/src/intel/bench.mjs](../intel/bench.mjs.md) |
| ../intel/platform.mjs | dynamic | 108 | [studio/src/intel/platform.mjs](../intel/platform.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/server.mjs](./server.mjs.md) | ./platform-x.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Optional /api/x routes. Loopback, Host, Origin, and token checks stay in the studio server.
import { Session } from '../store/session.mjs';
import { problem, json, integer, storageName } from './http.mjs';

const MB = 1024 * 1024;

export async function handlePlatformX(req, res, ctx, url) {
  if (url.pathname !== '/api/x' && !url.pathname.startsWith('/api/x/')) return false;
  let parts;
  try { parts = url.pathname.replace(/\/+$/, '').split('/').map(decodeURIComponent); }
  catch { json(res, 400, { error: 'Malformed path encoding' }); return true; }
  const route = match(parts[3], parts.slice(4));
  if (!route) return false;
  if (req.method !== route.method) {
    res.setHeader('allow', route.method);
    json(res, 405, { error: `${route.method} required` });
    return true;
  }
  try {
    if (route.bench) {
      let mod;
      try { mod = await import('../intel/bench.mjs'); }
      catch (e) { json(res, 501, { error: `bench unavailable: ${String(e?.message ?? e)}` }); return true; }
      const data = await mod.runBench();
      if (!res.headersSent) json(res, 200, data);
      return true;
    }
    const data = await route.run(req, ctx, url);
    if (!res.headersSent) json(res, 200, data);
  } catch (e) {
    if (res.headersSent) res.destroy();
    else json(res, e.status ?? 500, { error: String(e.message ?? e) });
  }
  return true;
}

function match(head, rest) {
  if (rest.length) return sessionRoute(head, rest);
  if (head === 'stats') return { method: 'GET', run: (_req, ctx) => call('platformStats', (fn) => fn({ settings: ctx.settings, dataDir: ctx.dataDir })) };
  if (head === 'registry') return { method: 'GET', run: () => call('registrySnapshot', (fn) => fn()) };
  if (head === 'autodetect') return { method: 'POST', run: (req) => call('detectAndScan', async (fn) => fn(await textBody(req))) };
  if (head === 'csv') return { method: 'POST', run: (req) => call('csvAnalyze', async (fn) => fn(await textBody(req))) };
  if (head === 'bench') return { method: 'GET', bench: true, run: () => {} };
  return null;
}

function sessionRoute(head, rest) {
  if (rest.length !== 1) return null;
  const id = rest[0];
  if (head === 'graph') return { method: 'GET', run: (_req, ctx) => call('analyzeSessionGraph', (fn) => fn(openSession(ctx, id))) };
  if (head === 'dedupe') return { method: 'GET', run: (_req, ctx, url) => call('dedupeSession', (fn) => fn(openSession(ctx, id), dedupeOpts(url))) };
  if (head === 'keyphrases') return { method: 'GET', run: (_req, ctx, url) => call('keyphrasesSession', async (fn) => ({ keyphrases: await fn(openSession(ctx, id), { limit: integer(Object.fromEntries(url.searchParams).limit, 20, 1000, 1) }) })) };
  return null;
}

function openSession(ctx, id) {
  storageName(id, 'session');
  try { return Session.open(ctx.sessionsDir, id); }
  catch (e) {
    if (/matches \d+ sessions/.test(e.message)) throw problem(409, e.message, 'AMBIGUOUS_SESSION');
    if (/No session|No sessions/.test(e.message)) throw problem(404, e.message, 'NOT_FOUND');
    throw e;
  }
}

function dedupeOpts(url) {
  const q = Object.fromEntries(url.searchParams);
  const max = integer(q.max, 3000, 1000000, 1);
  if (q.threshold === undefined) return { max, threshold: 0.8 };
  const threshold = Number(q.threshold);
  if (typeof q.threshold !== 'string' || q.threshold.trim() === '' || !Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw problem(400, 'threshold must be between 0 and 1');
  return { max, threshold };
}

async function textBody(req) {
  const body = await readJson(req, MB);
  if (typeof body.text !== 'string') throw problem(400, 'text must be a string');
  if (Buffer.byteLength(body.text) > MB) throw problem(413, 'body too large');
  return body.text;
}
```

_First 80 of 114 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
