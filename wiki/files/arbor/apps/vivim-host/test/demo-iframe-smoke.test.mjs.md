# File: apps/vivim-host/test/demo-iframe-smoke.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/demo-iframe-smoke.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6347 B |
| Lines | 121 |
| Hash | 06de9b28fddd |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| httpFetch | function | 12 | no | function httpFetch(base, route, opts = {}) { |
| url | const | 14 | no | const url = new URL(base + route); |
| req | const | 15 | no | const req = httpRequest({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, method: opts.method \|\| &#39;GET&#39;, headers: opts.headers \|\| {} }, res =&gt; { const chunks = []; |
| chunks | const | 19 | no | const chunks = []; |
| body | const | 22 | no | const body = Buffer.concat(chunks).toString(&#39;utf8&#39;); |
| testDir | const | 46 | no | const testDir = typeof __dirname === &#39;string&#39; |
| demoDir | const | 49 | no | const demoDir = path.resolve(testDir, &#39;..&#39;, &#39;..&#39;, &#39;..&#39;, &#39;demo&#39;, &#39;host-legacy&#39;); |
| demoHtml | const | 50 | no | const demoHtml = readFileSync(path.join(demoDir, &#39;demo.html&#39;), &#39;utf8&#39;); |
| controllerSrc | const | 51 | no | const controllerSrc = readFileSync(path.join(demoDir, &#39;controller.js&#39;), &#39;utf8&#39;); |
| iframes | const | 54 | no | const iframes = demoHtml.match(/&lt;iframe\\b[\\s\\S]*?&lt;\\/iframe&gt;/g) \|\| []; |
| iframe | const | 56 | no | const iframe = iframes[0]; |
| inlineScripts | const | 66 | no | const inlineScripts = demoHtml.match(/&lt;script(?![^&gt;]*\\bsrc=)[^&gt;]*&gt;[\\s\\S]*?&lt;\\/script&gt;/g) \|\| []; |
| onAttrs | const | 68 | no | const onAttrs = demoHtml.match(/\\son[a-z]+\\s*=\\s*[&quot;&#39;`]/gi) \|\| []; |
| styleAttrs | const | 70 | no | const styleAttrs = demoHtml.match(/\\sstyle\\s*=\\s*[&quot;&#39;`]/gi) \|\| []; |
| code | const | 78 | no | const code = controllerSrc.replace(/\\/\\/[^\\n]*/g, &#39; &#39;).replace(/\\/\\*[\\s\\S]*?\\*\\//g, &#39; &#39;); |
| arg | const | 86 | no | const arg = m[1]; |
| rhs | const | 92 | no | const rhs = def[1]; |
| literal | const | 93 | no | const literal = rhs.match(/&#39;([^&#39;]*)&#39;\|&quot;([^&quot;]*)&quot;/); |
| isDemoLiteral | const | 94 | no | const isDemoLiteral = literal &amp;&amp; (literal[1] \|\| literal[2] \|\| &#39;&#39;).startsWith(&#39;/demo/&#39;); |
| builtFromBase | const | 95 | no | const builtFromBase = /FIXTURE_BASE\|FEEDBACK_URL\|INDEX_URL/.test(rhs) &amp;&amp; /FIXTURE_BASE\|FEEDBACK_URL\|INDEX_URL/.test(code); |
| dataRoot | const | 105 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-demo-iframe-&#39;)); |
| server | const | 106 | no | const server = createHostServer({ dataRoot }); |
| base | const | 109 | no | const base = &#39;http://127.0.0.1:&#39; + server.address().port; |
| shell | const | 110 | no | const shell = await httpFetch(base, &#39;/mobile/?host-preview=1&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 6 | external |
| node:assert/strict | import | 7 | external |
| node:http | import | 11 | external |
| node:fs | import | 37 | external |
| node:os | import | 38 | external |
| node:path | import | 39 | external |
| node:url | import | 40 | external |
| ../server.mjs | import | 41 | [apps/vivim-host/server.mjs](../server.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// C11 acceptance — iframe embedding smoke: the demo shell frames the phone
// PWA read-only, exactly one way. demo.html must embed /mobile/?host-preview=1
// (the production Host preview route, frame-ancestors 'self' on loopback),
// never reach into the frame (C7), ship no inline script or on*/style
// attributes (C4), and controller.js must fetch same-origin /demo/* only.
import test from 'node:test';
import assert from 'node:assert/strict';

// Raw HTTP over node:http — immune to globalThis.fetch being replaced by
// another test file's fixture stub (the demo suite runs in one bun process).
import { request as httpRequest } from 'node:http';
function httpFetch(base, route, opts = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(base + route);
    const req = httpRequest({
      hostname: url.hostname, port: url.port, path: url.pathname + url.search,
      method: opts.method || 'GET', headers: opts.headers || {}
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({
          status: res.statusCode,
          headers: { get: k => (res.headers[String(k).toLowerCase()] ?? null) },
          text: async () => body,
          json: async () => JSON.parse(body)
        });
      });
    });
    req.on('error', reject);
    if (opts.body != null) req.write(opts.body);
    req.end();
  });
}

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHostServer } from '../server.mjs';


// This test's directory. bun's import.meta.url loses the filename, so prefer
// __dirname (bun ESM has it) and fall back to fileURLToPath for node.
const testDir = typeof __dirname === 'string'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const demoDir = path.resolve(testDir, '..', '..', '..', 'demo', 'host-legacy');
const demoHtml = readFileSync(path.join(demoDir, 'demo.html'), 'utf8');
const controllerSrc = readFileSync(path.join(demoDir, 'controller.js'), 'utf8');

test('demo.html embeds exactly one read-only iframe pointed at the phone preview route', () => {
  const iframes = demoHtml.match(/<iframe\b[\s\S]*?<\/iframe>/g) || [];
  assert.equal(iframes.length, 1, 'demo.html must embed exactly one iframe, found ' + iframes.length);
  const iframe = iframes[0];
  assert.match(iframe, /id="demo-live-preview"/);
  assert.match(iframe, /src="\/mobile\/\?host-preview=1"/);
  assert.match(iframe, /referrerpolicy="no-referrer"/);
  assert.match(iframe, /title="[^"]+"/);
  // Read-only framing: no allow attributes that could grant the frame powers.
  assert.doesNotMatch(iframe, /\ballow=|\ballowfullscreen|\bsandbox=/);
});

test('demo.html ships no inline script, on* handlers or style attributes (C4)', () => {
  const inlineScripts = demoHtml.match(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g) || [];
  assert.deepEqual(inlineScripts, [], 'inline <script> found in demo.html');
  const onAttrs = demoHtml.match(/\son[a-z]+\s*=\s*["'`]/gi) || [];
  assert.deepEqual(onAttrs, [], 'on* event handler attributes found: ' + onAttrs.join(', '));
  const styleAttrs = demoHtml.match(/\sstyle\s*=\s*["'`]/gi) || [];
  assert.deepEqual(styleAttrs, [], 'style= attributes found: ' + styleAttrs.join(', '));
});

test('controller.js never reaches into the iframe (C7) and fetches same-origin /demo/* only', () => {
  // Strip comments first: the header documents the rule itself. Line comments
  // go FIRST — a // comment can contain /* (e.g. "/demo/*"), and letting the
  // block stripper run first would eat real code until the next */.
  const code = controllerSrc.replace(/\/\/[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
  assert.doesNotMatch(code, /contentWindow|contentDocument|postMessage/);
  assert.doesNotMatch(controllerSrc, /XMLHttpRequest|sendBeacon|WebSocket|EventSource/);
```

_First 80 of 122 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
