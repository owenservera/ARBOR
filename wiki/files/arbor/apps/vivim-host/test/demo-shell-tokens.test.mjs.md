# File: apps/vivim-host/test/demo-shell-tokens.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/demo-shell-tokens.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5793 B |
| Lines | 119 |
| Hash | 8f2718cfde78 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| httpFetch | function | 13 | no | function httpFetch(base, route, opts = {}) { |
| url | const | 15 | no | const url = new URL(base + route); |
| req | const | 16 | no | const req = httpRequest({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, method: opts.method \|\| &#39;GET&#39;, headers: opts.headers \|\| {} }, res =&gt; { const chunks = []; |
| chunks | const | 20 | no | const chunks = []; |
| body | const | 23 | no | const body = Buffer.concat(chunks).toString(&#39;utf8&#39;); |
| testDir | const | 45 | no | const testDir = typeof __dirname === &#39;string&#39; |
| demoDir | const | 48 | no | const demoDir = path.resolve(testDir, &#39;..&#39;, &#39;..&#39;, &#39;..&#39;, &#39;demo&#39;, &#39;host-legacy&#39;); |
| publicDir | const | 49 | no | const publicDir = path.resolve(testDir, &#39;..&#39;, &#39;public&#39;); |
| tokensCss | const | 51 | no | const tokensCss = readFileSync(path.join(publicDir, &#39;vivim-tokens.css&#39;), &#39;utf8&#39;); |
| demoHtml | const | 52 | no | const demoHtml = readFileSync(path.join(demoDir, &#39;demo.html&#39;), &#39;utf8&#39;); |
| stripComments | function | 55 | no | const stripComments = css =&gt; css.replace(/\\/\\*[\\s\\S]*?\\*\\//g, &#39; &#39;); |
| hexColor | const | 56 | no | const hexColor = /#(?:[0-9a-fA-F]{3}\|[0-9a-fA-F]{4}\|[0-9a-fA-F]{6}\|[0-9a-fA-F]{8})(?![\\w-])/; |
| readDemoCss | function | 58 | no | function readDemoCss() { |
| p | const | 59 | no | const p = path.join(demoDir, &#39;demo.css&#39;); |
| css | const | 65 | no | const css = readDemoCss(); |
| matches | const | 66 | no | const matches = stripComments(css).match(new RegExp(hexColor, &#39;g&#39;)); |
| defined | const | 71 | no | const defined = [...stripComments(readDemoCss()).matchAll(/--([a-z0-9-]+)\\s*:/g)].map(m =&gt; &#39;--&#39; + m[1]); |
| tokenNames | const | 76 | no | const tokenNames = new Set([...tokensCss.matchAll(/(--[a-z0-9-]+)\\s*:/g)].map(m =&gt; m[1])); |
| used | const | 78 | no | const used = [...stripComments(readDemoCss()).matchAll(/var\\((--[a-z0-9-]+)/g)].map(m =&gt; m[1]); assert.ok(used.length &gt;= 100, &#39;demo.css barely uses tokens: &#39; + used.length + &#39; var() occurrences&#39;); co… |
| missing | const | 80 | no | const missing = [...new Set(used.filter(name =&gt; !tokenNames.has(name)))]; |
| lines | const | 85 | no | const lines = stripComments(readDemoCss()).split(&#39;\\n&#39;).filter(l =&gt; /font-family\\s*:/.test(l)); |
| value | const | 88 | no | const value = line.split(/font-family\\s*:/)[1].split(&#39;;&#39;)[0].trim(); |
| tokensAt | const | 94 | no | const tokensAt = demoHtml.indexOf(&#39;/vivim-tokens.css&#39;); |
| demoAt | const | 95 | no | const demoAt = demoHtml.indexOf(&#39;/demo/demo.css&#39;); |
| dataRoot | const | 103 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-demo-tokens-&#39;)); |
| server | const | 104 | no | const server = createHostServer({ dataRoot }); |
| base | const | 107 | no | const base = &#39;http://127.0.0.1:&#39; + server.address().port; |
| res | const | 108 | no | const res = await httpFetch(base, &#39;/vivim-tokens.css&#39;); |
| css | const | 111 | no | const css = await res.text(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 7 | external |
| node:assert/strict | import | 8 | external |
| node:http | import | 12 | external |
| node:fs | import | 38 | external |
| node:os | import | 39 | external |
| node:path | import | 40 | external |
| node:url | import | 41 | external |
| ../server.mjs | dynamic | 102 | [apps/vivim-host/server.mjs](../server.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// C11 acceptance — demo shell consumes vivim-tokens.css design tokens only.
// demo.css header (C10 tokens only): every color, spacing, radius, stroke,
// size and typeface comes from /vivim-tokens.css — no hex colors, no new
// -- token names, no raw font-family literals. demo.html must load the
// token sheet before the demo stylesheet. demo.css is read lazily so a
// missing stylesheet is one loud red test, not a dead module.
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

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// This test's directory: bun's import.meta.url loses the filename, so prefer
// __dirname (bun ESM has it) and fall back to fileURLToPath for node.
const testDir = typeof __dirname === 'string'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const demoDir = path.resolve(testDir, '..', '..', '..', 'demo', 'host-legacy');
const publicDir = path.resolve(testDir, '..', 'public');

const tokensCss = readFileSync(path.join(publicDir, 'vivim-tokens.css'), 'utf8');
const demoHtml = readFileSync(path.join(demoDir, 'demo.html'), 'utf8');

// Strip /* */ comments so prose like "no hex colors" never matches itself.
const stripComments = css => css.replace(/\/\*[\s\S]*?\*\//g, ' ');
const hexColor = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![\w-])/;

function readDemoCss() {
  const p = path.join(demoDir, 'demo.css');
  assert.ok(existsSync(p), 'demo/host-legacy/demo.css is missing — the demo shell stylesheet must exist (C10)');
  return readFileSync(p, 'utf8');
}

test('demo.css defines no hex colors', () => {
  const css = readDemoCss();
  const matches = stripComments(css).match(new RegExp(hexColor, 'g'));
  assert.equal(matches, null, 'hex colors found in demo.css: ' + (matches || []).join(', '));
});

test('demo.css defines no new custom properties (tokens come from vivim-tokens.css)', () => {
  const defined = [...stripComments(readDemoCss()).matchAll(/--([a-z0-9-]+)\s*:/g)].map(m => '--' + m[1]);
  assert.deepEqual(defined, [], 'new -- token names defined in demo.css: ' + defined.join(', '));
});

test('every var() in demo.css resolves to a token defined in vivim-tokens.css', () => {
  const tokenNames = new Set([...tokensCss.matchAll(/(--[a-z0-9-]+)\s*:/g)].map(m => m[1]));
  assert.ok(tokenNames.size > 0, 'vivim-tokens.css defines no tokens');
  const used = [...stripComments(readDemoCss()).matchAll(/var\((--[a-z0-9-]+)/g)].map(m => m[1]);
  assert.ok(used.length >= 100, 'demo.css barely uses tokens: ' + used.length + ' var() occurrences');
  const missing = [...new Set(used.filter(name => !tokenNames.has(name)))];
```

_First 80 of 120 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
