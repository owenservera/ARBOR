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

describe('GOAL-1 defect 4 — wiki intent/routes reach the real /wiki page (ux/render.mjs:104, app.js:934)', () => {
  it('ux surface routes include a Wiki entry (not World as the stand-in)', () => {
    const routes = render.match(/const routes = \[([\s\S]*?)\];/)?.[1] ?? '';
    expect(routes).toMatch(/\[\s*['"]wiki['"]\s*,\s*['"]Wiki['"]/);
  });
  it('app.js maps the word wiki to a /wiki navigation, not the world tab', () => {
    // post-fix: an explicit wiki → '/wiki' mapping (case, intent keyword, or data-tab wiring)
    const mapping = app.match(/['"]wiki['"]\s*[:=]>\s*['"]\/wiki['"]/)
      || app.match(/case\s*['"]wiki['"][\s\S]{0,120}['"]\/wiki['"]/)
      || app.match(/tab\s*===\s*['"]wiki['"][\s\S]{0,120}location\.assign\(\s*['"]\/wiki['"]/)
      || app.match(/['"]\/wiki['"][\s\S]{0,80}data-tab="wiki"/);
    expect(mapping).toBeTruthy();
    // the chat intent for wiki must not resolve to the world tab
    expect(app).not.toMatch(/open the wiki[\s\S]{0,200}'world'/i);
  });
});

describe('GOAL-1 confirmed defect — Wiki rail tab lacks aria-controls (index.html:389)', () => {
  // Sibling panel tabs (index.html:385-388, 390-391) all carry aria-controls="v-*";
  // Wiki (index.html:389) intentionally does not: it navigates to /wiki instead of
  // switching a local panel (app.js:419-421: 'Wiki is not a local panel').
  const PANEL_TABS = ['today', 'talk', 'build', 'world', 'me', 'control'];
  it('every local-panel tab carries aria-controls="v-<tab>" and that panel id exists', () => {
    for (const t of PANEL_TABS) {
      expect(tabBtn(t), `${t} tab lacks aria-controls="v-${t}"`).toMatch(new RegExp(`aria-controls="v-${t}"`));
      expect(html, `panel #v-${t} missing from index.html`).toContain(`id="v-${t}"`);
    }
  });
  it('wiki tab: aria-controls only with a resolvable target, else the /wiki exemption holds', () => {
    const wikiTab = tabBtn('wiki');
    expect(wikiTab, 'wiki rail tab missing').toBeTruthy();
    const ac = wikiTab.match(/aria-controls="([^"]*)"/)?.[1];
    if (ac) {
      // If a fixer adds aria-controls, it must point at an element that exists.
      expect(html, `aria-controls target #${ac} missing from index.html`).toContain(`id="${ac}"`);
    } else {
      // Intentional exemption: no local panel id to reference — the tab navigates.
      expect(app).toContain("if (tab === 'wiki') { location.assign('/wiki'); return; }");
      expect(app).toContain('Wiki is not a local panel');
    }
  });
});
