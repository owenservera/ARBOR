# File: studio/ui-preview/serve.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/ui-preview/serve.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2480 B |
| Lines | 46 |
| Hash | 3d874f11025c |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 8 | no | const root = resolve(fileURLToPath(new URL(&#39;./dist/&#39;, import.meta.url))); |
| types | const | 9 | no | const types = { &#39;.html&#39;: &#39;text/html; charset=utf-8&#39;, &#39;.mjs&#39;: &#39;text/javascript; charset=utf-8&#39;, |
| headers | const | 11 | no | const headers = { |
| createPreviewServer | function | 17 | yes | export function createPreviewServer() { |
| url | const | 19 | no | const url = new URL(req.url \|\| &#39;/&#39;, &#39;http://127.0.0.1&#39;); |
| path | const | 20 | no | const path = url.pathname === &#39;/&#39; ? &#39;/index.html&#39; : url.pathname; |
| filename | const | 27 | no | const filename = resolve(join(root, path.slice(1))); |
| stat | const | 30 | no | const stat = statSync(filename); |
| raw | const | 42 | no | const raw = Number(process.env.VIVIM_UI_PREVIEW_PORT \|\| 4173); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:http | import | 2 | external |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |
| node:url | import | 5 | external |
| ./build.mjs | import | 6 | [studio/ui-preview/build.mjs](./build.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Loopback-only frontend view. No backend proxy, no provider effects and no credentials.
import { createServer } from 'node:http';
import { readFileSync, createReadStream, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPreview } from './build.mjs';

const root = resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const headers = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'none'",
};
export function createPreviewServer() {
  return createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
      res.writeHead(405, { ...headers, 'content-type': 'text/plain' }); res.end('Read-only preview'); return;
    }
    if (!/^\/(?:index\.html|ui\/[a-z-]+\.mjs)$/.test(path)) {
      res.writeHead(404, headers); res.end(); return;
    }
    const filename = resolve(join(root, path.slice(1)));
    if (!filename.startsWith(root + sep)) { res.writeHead(403, headers); res.end(); return; }
    try {
      const stat = statSync(filename);
      if (!stat.isFile()) throw Error('not a file');
      res.writeHead(200, { ...headers, 'content-type': types[extname(filename)] || 'application/octet-stream',
        'content-length': stat.size });
      if (req.method === 'HEAD') res.end(); else createReadStream(filename).pipe(res);
    } catch {
      res.writeHead(404, headers); res.end();
    }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildPreview(root);
  const raw = Number(process.env.VIVIM_UI_PREVIEW_PORT || 4173);
  if (!Number.isSafeInteger(raw) || raw < 1024 || raw > 65535) throw Error('Invalid preview port');
  createPreviewServer().listen(raw, '127.0.0.1', () =>
    process.stdout.write('VIVIM UI DEMO only — http://127.0.0.1:' + raw + '/\n'));
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
