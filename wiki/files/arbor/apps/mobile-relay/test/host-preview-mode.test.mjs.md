# File: apps/mobile-relay/test/host-preview-mode.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/host-preview-mode.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2749 B |
| Lines | 50 |
| Hash | 5e392149c312 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| app | const | 5 | no | const app = readFileSync(new URL(&#39;../app.js&#39;, import.meta.url), &#39;utf8&#39;); |
| html | const | 6 | no | const html = readFileSync(new URL(&#39;../index.html&#39;, import.meta.url), &#39;utf8&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('HOST_PREVIEW gate is strict and preview skips service worker registration', () => {
  assert.match(
    app,
    /const HOST_PREVIEW = new URLSearchParams\(location\.search\)\.get\('host-preview'\) === '1'\s*&& \['localhost', '127\.0\.0\.1', '\[::1\]'\]\.includes\(location\.hostname\)\s*&& location\.pathname\.startsWith\('\/mobile\/'\);/
  );
  assert.match(app, /if \(!HOST_PREVIEW && 'serviceWorker' in navigator\) \{/);
});

test('preview blocks send/update paths and renders read-only shell state', () => {
  assert.match(app, /if \(!S\.paired && !HOST_PREVIEW\) \{/);
  assert.match(
    app,
    /if \(HOST_PREVIEW\) \{\s*toast\('This is your phone preview\. Pair a phone or open Host Control to perform actions\.'\);\s*return;/
  );
  assert.match(app, /function updateSend\(\) \{\s*if \(HOST_PREVIEW \|\| !S\.paired\) \{ \$\('send'\)\.disabled = true; return; \}/);
  assert.match(app, /S\.paired = false;\s*S\.cmds = \[\]; S\.convs = \[\]; S\.active = null;/);
  assert.match(app, /setConn\('Desktop preview [^']*owner authorization required', true\);/);
});

test('preview exchanges one-use control-session hash and erases it from URL', () => {
  assert.match(app, /if \(fragment\.startsWith\('#control-session='\)\) \{/);
  assert.match(app, /history\.replaceState\(null, '', location\.pathname \+ location\.search\);/);
  assert.match(app, /const match = \/\^#control-session=\(\[a-f0-9\]\{64\}\)\$\/\.exec\(fragment\);/);
  assert.match(app, /await fetch\('\/api\/host\/control\/ui-exchange', \{/);
  assert.match(app, /'x-vivim-control': '1'/);
  assert.match(app, /body: JSON\.stringify\(\{ code: match\[1\] \}\)/);
});

test('host preview menu is built by installHostMenu with required links and attributes', () => {
  assert.match(app, /function installHostMenu\(\) \{/);
  assert.match(app, /section\.id = 'host-preview-menu';/);
  assert.match(app, /section\.setAttribute\('aria-label', 'Host utilities'\);/);
  for (const href of ['/onboarding', '/host/control', '/api/host/status']) {
    assert.ok(app.includes(`'${href}'`), `missing host menu link ${href}`);
  }
  assert.match(app, /\$\('gear'\)\.setAttribute\('aria-controls', section\.id\);/);
  // The menu is injected at runtime; a static duplicate in the document would drift.
  assert.doesNotMatch(html, /id="host-preview-menu"/);
});

test('start path uses preview init when HOST_PREVIEW is set', () => {
  assert.match(app, /if \(HOST_PREVIEW\) void startHostPreview\(\); else start\(\);/);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
