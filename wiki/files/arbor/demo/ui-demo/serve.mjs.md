# File: demo/ui-demo/serve.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | demo/ui-demo/serve.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4463 B |
| Lines | 95 |
| Hash | 809c1a43aa8e |
| Test | no |
| Generated | no |
| Component | demo |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| here | const | 11 | no | const here = path.dirname(fileURLToPath(import.meta.url)); |
| root | const | 12 | no | const root = resolve(fileURLToPath(new URL(&#39;./dist/&#39;, import.meta.url))); |
| feedbackDir | const | 13 | no | const feedbackDir = resolve(here, &#39;feedback&#39;); |
| inboxPath | const | 14 | no | const inboxPath = join(feedbackDir, &#39;inbox.json&#39;); |
| types | const | 16 | no | const types = { &#39;.html&#39;: &#39;text/html; charset=utf-8&#39;, &#39;.mjs&#39;: &#39;text/javascript; charset=utf-8&#39;, |
| headers | const | 19 | no | const headers = { |
| ensureInbox | function | 27 | no | function ensureInbox() { |
| readInbox | function | 31 | no | function readInbox() { ensureInbox(); return JSON.parse(readFileSync(inboxPath, &#39;utf8&#39;) \|\| &#39;[]&#39;); } |
| appendRound | function | 32 | no | function appendRound(round) { ensureInbox(); const arr = readInbox(); arr.push(round); writeFileSync(inboxPath, JSON.stringify(arr, null, 2)); return round; } |
| createDemoServer | function | 34 | yes | export function createDemoServer() { |
| url | const | 36 | no | const url = new URL(req.url \|\| &#39;/&#39;, &#39;http://127.0.0.1&#39;); |
| method | const | 38 | no | const method = (req.method \|\| &#39;GET&#39;).toUpperCase(); |
| body | variable | 42 | no | let body = &#39;&#39;; |
| payload | const | 46 | no | const payload = JSON.parse(body \|\| &#39;{}&#39;); |
| round | const | 47 | no | const round = { |
| stored | const | 53 | no | const stored = appendRound(round); |
| p | const | 72 | no | const p = pathname === &#39;/&#39; ? &#39;/index.html&#39; : pathname; |
| filename | const | 73 | no | const filename = resolve(join(root, p.slice(1))); |
| stat | const | 78 | no | const stat = statSync(filename); |
| raw | const | 91 | no | const raw = Number(process.env.VIVIM_UI_DEMO_PORT \|\| 4173); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:http | import | 4 | external |
| node:fs | import | 5 | external |
| node:path | import | 6 | external |
| node:path | import | 7 | external |
| node:url | import | 8 | external |
| ./build.mjs | import | 9 | [demo/ui-demo/build.mjs](./build.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Loopback-only demo server. Static dist/ plus a single writable surface: POST /feedback,
// which appends the posted JSON round to demo/ui-demo/feedback/inbox.json (array of rounds)
// and returns it. Strict CSP. GET/HEAD only elsewhere; every other write is 405. Backend zero.
import { createServer } from 'node:http';
import { readFileSync, createReadStream, statSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDemo } from './build.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const feedbackDir = resolve(here, 'feedback');
const inboxPath = join(feedbackDir, 'inbox.json');

const types = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const headers = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'none'"
};

function ensureInbox() {
  mkdirSync(feedbackDir, { recursive: true });
  if (!existsSync(inboxPath)) writeFileSync(inboxPath, '[]', 'utf8');
}
function readInbox() { ensureInbox(); return JSON.parse(readFileSync(inboxPath, 'utf8') || '[]'); }
function appendRound(round) { ensureInbox(); const arr = readInbox(); arr.push(round); writeFileSync(inboxPath, JSON.stringify(arr, null, 2)); return round; }

export function createDemoServer() {
  return createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const { pathname } = url;
    const method = (req.method || 'GET').toUpperCase();

    // Only writable surface: POST /feedback. Returns the stored round.
    if (pathname === '/feedback' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const round = {
            round: payload.round != null ? payload.round : String(Date.now()),
            approveAll: !!payload.approveAll,
            verdicts: Array.isArray(payload.verdicts) ? payload.verdicts : [],
            receivedAt: new Date().toISOString()
          };
          const stored = appendRound(round);
          res.writeHead(200, { ...headers, 'content-type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(stored));
        } catch {
          res.writeHead(400, { ...headers, 'content-type': 'text/plain; charset=utf-8' });
          res.end('Invalid feedback JSON');
        }
      });
      return;
    }

    // Everything else that mutates is refused 405.
    if (!['GET', 'HEAD'].includes(method)) {
      res.writeHead(405, { ...headers, 'content-type': 'text/plain; charset=utf-8' });
      res.end('Demo harness is read-only except POST /feedback');
      return;
    }

    // Static GET/HEAD from dist.
    const p = pathname === '/' ? '/index.html' : pathname;
    const filename = resolve(join(root, p.slice(1)));
    if (!filename.startsWith(root + sep)) {
      res.writeHead(403, headers); res.end(); return;
    }
    try {
      const stat = statSync(filename);
      if (!stat.isFile()) throw Error('not a file');
      res.writeHead(200, { ...headers, 'content-type': types[extname(filename)] || 'application/octet-stream', 'content-length': stat.size });
```

_First 80 of 96 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
