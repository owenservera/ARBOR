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
    // post-fix: an explicit wiki → '/wiki' mapping (case, intent keyword, or
    // data-tab wiring). The old location.assign('/wiki') alternative is gone —
    // same-window navigation of the phone document is the confirmed defect.
    const mapping = app.match(/['"]wiki['"]\s*[:=]>\s*['"]\/wiki['"]/)
      || app.match(/case\s*['"]wiki['"][\s\S]{0,120}['"]\/wiki['"]/)
      || app.match(/tab\s*===\s*['"]wiki['"][\s\S]{0,60}openWiki\(\)/)
      || app.match(/window\.open\(\s*['"]\/wiki['"]\s*,\s*['"]_blank['"]/);
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
      // Intentional exemption: no local panel id to reference — the tab opens
      // /wiki at top level via openWiki() (regression: the old
      // location.assign('/wiki') tore the whole phone document out of the shell).
      expect(app).toContain("if (tab === 'wiki') { openWiki(); return; }");
      expect(app).toContain('Wiki is not a local panel');
    }
  });
});

describe('GOAL-1 confirmed defect — Wiki rail/section tab navigated the whole phone document to /wiki (app.js:418-457)', () => {
  // Defect: goTab('wiki') called location.assign('/wiki'), navigating the entire
  // phone document out of the PWA shell. /wiki is unframable anywhere
  // (X-Frame-Options: DENY + CSP frame-ancestors 'none'; only /mobile/* gets the
  // SAMEORIGIN exception), so a framed load died as a blank blocked frame and the
  // parent threw SecurityError 'cross-origin frame' while iframe src still read
  // /mobile/?host-preview=1. Fix contract: open /wiki at top level in a new
  // browser tab (window.open '/wiki','_blank','noopener' — same escape hatch as
  // the Host-menu target="_top" link) with toast feedback, never navigate or
  // frame the phone document.
  it('goTab wiki branch hands off to openWiki() — no same-window navigation of the phone document', () => {
    const goTab = app.match(/function goTab\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(goTab, 'goTab() found in app.js').toBeTruthy();
    expect(goTab).toContain("if (tab === 'wiki') { openWiki(); return; }");
    expect(goTab, 'goTab must not navigate the document (location.assign/href/replace)')
      .not.toMatch(/location\.(?:assign|replace)\s*\(|location\.href\s*=/);
  });
  it('openWiki() opens /wiki top-level in a new tab with noopener, plus toast feedback', () => {
    const openWiki = app.match(/function openWiki\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(openWiki, 'openWiki() found in app.js').toBeTruthy();
    expect(openWiki).toMatch(/window\.open\(\s*['"]\/wiki['"]\s*,\s*['"]_blank['"]\s*,\s*['"]noopener['"]\s*\)/);
    // user feedback: where the wiki went (both success and popup-blocked paths)
    const toasts = openWiki.match(/toast\([^)]*\)/g) ?? [];
    expect(toasts.length, 'openWiki toasts on success AND popup-blocked fallback').toBeGreaterThanOrEqual(2);
    expect(toasts.join('\n')).toMatch(/[Ww]iki/);
  });
  it('no code path navigates or frames the phone document at /wiki (unframable: X-Frame-Options DENY)', () => {
    for (const [name, src] of [['app.js', app], ['index.html', html]]) {
      expect(src.match(/location\.(?:assign|replace)\s*\(\s*['"]\/wiki|location\.href\s*=\s*['"]\/wiki/),
        `${name} navigates the phone document to /wiki`).toBeNull();
      expect(src.match(/<iframe\b[^>]*src="[^"]*\/wiki/), `${name} frames /wiki`).toBeNull();
    }
  });
  it('the Host-menu /wiki anchor keeps the top-level target="_top" escape hatch (app.js:936-946 pattern)', () => {
    const menu = app.match(/function installHostMenu\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(menu).toContain("['ARBOR progress (live roadmap)', '/wiki']");
    expect(menu).toMatch(/anchor\.target\s*=\s*['"]_top['"]/);
  });
});
