# File: apps/mobile-relay/goal-wiki.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/goal-wiki.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5357 B |
| Lines | 92 |
| Hash | 94c1504cd91a |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dir | const | 13 | no | const dir = fileURLToPath(new URL(&#39;.&#39;, import.meta.url)); // apps/mobile-relay |
| html | const | 14 | no | const html = readFileSync(join(dir, &#39;index.html&#39;), &#39;utf8&#39;); |
| app | const | 15 | no | const app = readFileSync(join(dir, &#39;app.js&#39;), &#39;utf8&#39;); |
| render | const | 16 | no | const render = readFileSync(join(dir, &#39;ux/render.mjs&#39;), &#39;utf8&#39;); |
| tabsBlock | const | 19 | no | const tabsBlock = html.match(/&lt;nav id=&quot;tabs&quot;[\\s\\S]*?&lt;\\/nav&gt;/)?.[0] ?? &#39;&#39;; |
| tabBtn | function | 20 | no | const tabBtn = (tab) =&gt; tabsBlock.match(new RegExp(`&lt;button[^&gt;]*data-tab=&quot;${tab}&quot;[^&gt;]*&gt;[^&lt;]*`))?.[0] ?? &#39;&#39;; |
| wikiTab | const | 24 | no | const wikiTab = tabBtn(&#39;wiki&#39;); |
| wikiLink | const | 25 | no | const wikiLink = tabsBlock.match(/&lt;a[^&gt;]*href=&quot;[^&quot;]*\\/wiki[^&quot;]*&quot;[^&gt;]*&gt;/)?.[0] ?? &#39;&#39;; |
| affordance | const | 26 | no | const affordance = wikiTab \|\| wikiLink; |
| hit | const | 33 | no | const hit = html.match(/&lt;(?:button\|a)\\b[^&gt;]*&gt;(?:[^&lt;]*[Ww]iki[^&lt;]*)&lt;\\/(?:button\|a)&gt;/) |
| writer | const | 56 | no | const writer = src.match(/(?:location\\.search\\s*=\|history\\.(?:push\|replace)State\|location\\.href\\s*=\|location\\.assign\|location\\.replace)\\s*\\(?[^;\\n]*host-preview/); assert.equal(writer, null, `${name}… |
| hides | const | 61 | no | const hides = app.match(/composer\\.hidden\\s*=\\s*[^;\\n]+;/g) ?? []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 7 | external |
| node:assert/strict | import | 8 | external |
| node:fs | import | 9 | external |
| node:url | import | 10 | external |
| node:path | import | 11 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// GOAL-1 "Open the Wiki from Chat" — regression tests for confirmed defects.
// Scope: apps/mobile-relay/index.html, apps/mobile-relay/app.js, apps/mobile-relay/ux/render.mjs
// Sources are parsed as text; app.js/index.html are plain scripts (no exports), so a
// full DOM harness is out of scope here — structural assertions guard the acceptance.
// Runtime: node:test. This file lives at the package root (outside the test/*.test.mjs
// glob) and is dispatched with `node --test`, so bun-only imports are not allowed here.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const dir = fileURLToPath(new URL('.', import.meta.url)); // apps/mobile-relay
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const app = readFileSync(join(dir, 'app.js'), 'utf8');
const render = readFileSync(join(dir, 'ux/render.mjs'), 'utf8');

// nav#tabs rail (index.html:384-391)
const tabsBlock = html.match(/<nav id="tabs"[\s\S]*?<\/nav>/)?.[0] ?? '';
const tabBtn = (tab) => tabsBlock.match(new RegExp(`<button[^>]*data-tab="${tab}"[^>]*>[^<]*`))?.[0] ?? '';

describe('GOAL-1 defect 1 — PWA has a Wiki affordance (index.html:384-391)', () => {
  it('tab rail contains a Wiki affordance (data-tab="wiki" or /wiki link)', () => {
    const wikiTab = tabBtn('wiki');
    const wikiLink = tabsBlock.match(/<a[^>]*href="[^"]*\/wiki[^"]*"[^>]*>/)?.[0] ?? '';
    const affordance = wikiTab || wikiLink;
    assert.ok(affordance, 'no Wiki affordance found in the tab rail');
    assert.match(affordance.replace(/<[^>]*>/g, ''), /wiki/i); // visible word "Wiki"
  });

  it('some user-visible Wiki affordance exists anywhere in the PWA chrome', () => {
    // button/link whose text or label says Wiki, or href into /wiki
    const hit = html.match(/<(?:button|a)\b[^>]*>(?:[^<]*[Ww]iki[^<]*)<\/(?:button|a)>/)
      || html.match(/<(?:button|a)\b[^>]*href="\/wiki[^"]*"[^>]*>/)
      || html.match(/<(?:button|a)\b[^>]*aria-label="[^"]*[Ww]iki[^"]*"[^>]*>/);
    assert.ok(hit, 'no user-visible Wiki affordance in the PWA chrome');
  });
});

describe('GOAL-1 defect 3 — first-time user lands in Chat, not Today (index.html:385)', () => {
  it('talk tab carries the initial "on" state', () => {
    assert.match(tabBtn('talk'), /class="tab on"/);
  });
  it('today tab does not carry the initial "on" state', () => {
    assert.doesNotMatch(tabBtn('today'), /class="tab on"/);
  });
});

describe('GOAL-1 defect 2 — first visit to /mobile is not forced into host-preview (app.js:139)', () => {
  it('HOST_PREVIEW stays gated on the explicit ?host-preview=1 query param', () => {
    assert.ok(app.includes("new URLSearchParams(location.search).get('host-preview') === '1'"),
      'HOST_PREVIEW must stay gated on the explicit ?host-preview=1 param');
  });
  it('no scope source injects host-preview=1 into the URL for plain first visits', () => {
    for (const [name, src] of [['index.html', html], ['app.js', app]]) {
      const writer = src.match(/(?:location\.search\s*=|history\.(?:push|replace)State|location\.href\s*=|location\.assign|location\.replace)\s*\(?[^;\n]*host-preview/);
      assert.equal(writer, null, `${name} rewrites the URL into host-preview`);
    }
  });
  it('composer hide is driven by that param only, never an unconditional first-visit flag', () => {
    const hides = app.match(/composer\.hidden\s*=\s*[^;\n]+;/g) ?? [];
    for (const h of hides) {
      // the host-preview flag must never drive composer visibility (defect: first visits forced into preview)
      assert.equal(h.includes('HOST_PREVIEW'), false, `composer hide driven by HOST_PREVIEW: ${h}`);
    }
    assert.ok(hides.includes('composer.hidden = false;'), 'composer stays typeable');
  });
});


describe('Wiki is a real PWA tab', () => {
  it('has a Wiki tab, selectable local panel and the default Talk tab', () => {
    assert.match(html, /id="tab-wiki"[^>]*role="tab"[^>]*aria-controls="v-wiki"/);
    assert.match(html, /id="v-wiki"[^>]*role="tabpanel"/);
    assert.match(html, /id="tab-talk"[^>]*class="tab on"/);
  });
  it('routes through goTab and never tears away the phone document', () => {
    assert.ok(app.includes("if (tab === 'wiki') void refreshWiki()"), 'goTab must refresh Wiki on selection');
    assert.ok(app.includes("S.tab = tab"), 'goTab must record the selected tab');
    assert.ok(render.includes("options.onNavigate(tab)"), 'render must navigate through onNavigate');
```

_First 80 of 93 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
