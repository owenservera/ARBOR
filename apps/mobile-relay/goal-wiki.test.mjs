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
    assert.ok(!render.includes("location.assign('/wiki')"), 'render must not tear away the phone document');
    assert.ok(!app.includes("window.open('/wiki'"), 'app must not open a new window for Wiki');
  });
  it('reads the Host Wiki rather than a local hardcoded replacement', () => {
    // app.js:788 and app.js:1783 read the Host control route under HOST_PREVIEW
    assert.ok(app.includes("HOST_PREVIEW ? '/api/host/control/wiki-view' : '/mobile/api/wiki'"),
      'wiki fetch must use /api/host/control/wiki-view under HOST_PREVIEW');
    assert.ok(app.includes('Wiki read refused'));
    assert.ok(app.includes('wiki.revision < S.wiki.revision'));
    assert.ok(app.includes('clearWiki('));
  });
});
