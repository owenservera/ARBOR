import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderWorld } from '../ux/render.mjs';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const renderSrc = readFileSync(new URL('../ux/render.mjs', import.meta.url), 'utf8');
const welcome = readFileSync(new URL('../welcome.mjs', import.meta.url), 'utf8');

/* ---------- small fake DOM, same shape as ux-surfaces.test.mjs ---------- */
class FakeNode {
  constructor(tag, ownerDocument) {
    this.tag = tag; this.ownerDocument = ownerDocument; this.style = {};
    this.children = []; this.attrs = {}; this.events = {}; this.className = ''; this.textContent = '';
    this.hidden = false; this.type = '';
  }
  appendChild(x) { this.children.push(x); return x; }
  append(...xs) { for (const x of xs) this.children.push(x); }
  replaceChildren(...xs) { this.children = xs; }
  setAttribute(k, v) { this.attrs[k] = v; }
  addEventListener(k, fn) { this.events[k] = fn; }
}
function fakeHost() {
  const doc = { createElement(tag) { return new FakeNode(tag, doc); } };
  const host = new FakeNode('section', doc);
  host.ownerDocument = doc;
  return host;
}
function textOf(node) {
  if (!node) return '';
  let out = node.textContent ? String(node.textContent) : '';
  for (const child of node.children || []) out += ' ' + textOf(child);
  return out;
}

/* ---------- GOAL-2 acceptance: live ARBOR progress + blockers reachable from the PWA ---------- */

test('host menu links the /wiki surface that renders owner Wiki, with unique hrefs', () => {
  const menu = app.match(/for \(const \[label, href\] of \[([\s\S]*?)\]\) \{/);
  assert.ok(menu, 'installHostMenu must keep its label/href table');
  const hrefs = [...menu[1].matchAll(/'([^']+)'/g)].map(m => m[1]).filter(h => h.startsWith('/'));
  for (const href of ['/onboarding', '/host/control', '/api/host/status']) {
    assert.ok(hrefs.includes(href), `existing host menu link ${href} must stay`);
  }
  assert.ok(hrefs.includes('/wiki'), 'host menu must link /wiki (owner Wiki surface)');
  assert.equal(new Set(hrefs).size, hrefs.length, 'host menu must not carry duplicate hrefs');
});

test('production PWA has no historical roadmap dependency', () => {
  assert.doesNotMatch(app, /\/api\/roadmap|refreshRoadmap/);
  assert.doesNotMatch(renderSrc, /\/api\/roadmap|roadmapCard/);
});

test('World keeps committed revision and live empty state', () => {
  const host = fakeHost();
  renderWorld(host, { revision: { revision: 7, surfaceId: 'world', status: 'applied' } });
  const text = textOf(host);
  assert.match(text, /Host revision 7/);
  assert.match(text, /Nothing here yet/);
  assert.doesNotMatch(text, /ARBOR progress|Loading the live roadmap/);
});

/* ---------- confirmed defect: readGraphContext silent no-op in host preview (app.js:226-227) ---------- */

test('gated readGraphContext gives visible feedback instead of a bare silent return', () => {
  assert.doesNotMatch(
    app,
    /if\(HOST_PREVIEW\|\|!transport\.direct\|\|!S\.paired\|\|!device\)\s*\{\s*chatContext=null;\s*renderFocusPanel\(\);\s*return;\s*\}/,
    'gated branch must not be chatContext=null;renderFocusPanel();return;'
  );
});

/* ---------- confirmed defect: welcome tour sheet churn on bootstrap-status (welcome.mjs:69) ---------- */

test('bootstrap-status does not re-render the open tour sheet; Next still advances', () => {
  assert.doesNotMatch(welcome, /if \(!host\.hidden\) renderTour\(\);/, 'listener must not re-render the visible tour');
  assert.match(welcome, /index\+\+;\s*renderTour\(\);/, 'Next handler must keep advancing the tour');
});
