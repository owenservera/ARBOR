// GOAL-1 "Open the Wiki from Chat" — regression tests for confirmed defects.
// Scope: apps/mobile-relay/index.html, apps/mobile-relay/app.js, apps/mobile-relay/ux/render.mjs
// Sources are parsed as text; app.js/index.html are plain scripts (no exports), so a
// full DOM harness is out of scope here — structural assertions guard the acceptance.
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = import.meta.dir; // apps/mobile-relay
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
    expect(affordance).toBeTruthy();
    expect(/wiki/i.test(affordance.replace(/<[^>]*>/g, ''))).toBe(true); // visible word "Wiki"
  });

  it('some user-visible Wiki affordance exists anywhere in the PWA chrome', () => {
    // button/link whose text or label says Wiki, or href into /wiki
    const hit = html.match(/<(?:button|a)\b[^>]*>(?:[^<]*[Ww]iki[^<]*)<\/(?:button|a)>/)
      || html.match(/<(?:button|a)\b[^>]*href="\/wiki[^"]*"[^>]*>/)
      || html.match(/<(?:button|a)\b[^>]*aria-label="[^"]*[Ww]iki[^"]*"[^>]*>/);
    expect(hit).toBeTruthy();
  });
});

describe('GOAL-1 defect 3 — first-time user lands in Chat, not Today (index.html:385)', () => {
  it('talk tab carries the initial "on" state', () => {
    expect(tabBtn('talk')).toMatch(/class="tab on"/);
  });
  it('today tab does not carry the initial "on" state', () => {
    expect(tabBtn('today')).not.toMatch(/class="tab on"/);
  });
});

describe('GOAL-1 defect 2 — first visit to /mobile is not forced into host-preview (app.js:139)', () => {
  it('HOST_PREVIEW stays gated on the explicit ?host-preview=1 query param', () => {
    expect(app).toContain("new URLSearchParams(location.search).get('host-preview') === '1'");
  });
  it('no scope source injects host-preview=1 into the URL for plain first visits', () => {
    for (const [name, src] of [['index.html', html], ['app.js', app]]) {
      const writer = src.match(/(?:location\.search\s*=|history\.(?:push|replace)State|location\.href\s*=|location\.assign|location\.replace)\s*\(?[^;\n]*host-preview/);
      expect(writer, `${name} rewrites the URL into host-preview`).toBeNull();
    }
  });
  it('composer hide is driven by that param only, never an unconditional first-visit flag', () => {
    const hides = app.match(/composer\.hidden\s*=\s*[^;\n]+;/g) ?? [];
    for (const h of hides) {
      // the host-preview flag must never drive composer visibility (defect: first visits forced into preview)
      expect(h.includes('HOST_PREVIEW'), `composer hide driven by HOST_PREVIEW: ${h}`).toBe(false);
    }
    expect(hides, 'composer stays typeable').toContain('composer.hidden = false;');
  });
});


describe('Wiki is a real PWA tab', () => {
  it('has a Wiki tab, selectable local panel and the default Talk tab', () => {
    expect(html).toMatch(/id="tab-wiki"[^>]*role="tab"[^>]*aria-controls="v-wiki"/);
    expect(html).toMatch(/id="v-wiki"[^>]*role="tabpanel"/);
    expect(html).toMatch(/id="tab-talk"[^>]*class="tab on"/);
  });
  it('routes through goTab and never tears away the phone document', () => {
    expect(app).toContain("if (tab === 'wiki') void refreshWiki()");
    expect(app).toContain("S.tab = tab");
    expect(render).toContain("options.onNavigate(tab)");
    expect(render).not.toContain("location.assign('/wiki')");
    expect(app).not.toContain("window.open('/wiki'");
  });
  it('reads the Host Wiki rather than a local hardcoded replacement', () => {
    expect(app).toContain("HOST_PREVIEW ? '/api/wiki' : '/mobile/api/wiki'");
    expect(app).toContain('Wiki read refused');
    expect(app).toContain('wiki.revision < S.wiki.revision');
    expect(app).toContain('clearWiki(');
  });
});
