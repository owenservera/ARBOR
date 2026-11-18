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

test('host menu links the /wiki surface that renders ARBOR roadmap progress, with unique hrefs', () => {
  const menu = app.match(/for \(const \[label, href\] of \[([\s\S]*?)\]\) \{/);
  assert.ok(menu, 'installHostMenu must keep its label/href table');
  const hrefs = [...menu[1].matchAll(/'([^']+)'/g)].map(m => m[1]).filter(h => h.startsWith('/'));
  for (const href of ['/onboarding', '/host/control', '/api/host/status']) {
    assert.ok(hrefs.includes(href), `existing host menu link ${href} must stay`);
  }
  assert.ok(hrefs.includes('/wiki'), 'host menu must link /wiki (ARBOR roadmap surface)');
  assert.equal(new Set(hrefs).size, hrefs.length, 'host menu must not carry duplicate hrefs');
});

test('phone app reads the Host /api/roadmap feed for live ARBOR progress', () => {
  assert.ok(app.includes('/api/roadmap'), 'app.js must fetch /api/roadmap');
});

test('World tab renders roadmap progress and blockers from the model', () => {
  const host = fakeHost();
  renderWorld(host, {
    revision: { revision: 7, surfaceId: 'world', status: 'applied' },
    roadmap: {
      label: 'ARBOR progress',
      items: [{ title: 'GOAL-2 show live progress', detail: 'in progress' }],
      blockers: [{ title: 'blocked task', detail: 'needs host' }]
    }
  });
  const text = textOf(host);
  assert.match(text, /GOAL-2 show live progress/, 'roadmap item must reach the World tab');
  assert.match(text, /blocked task/, 'blocker must reach the World tab');
});

test('renderWorld keeps its existing empty states and gains a progress/blocker feed', () => {
  assert.ok(renderSrc.includes('Nothing here yet — build something in Build.'), 'built empty state must stay');
  assert.ok(renderSrc.includes('The Host reported no work in flight.'), 'running empty state must stay');
  assert.match(renderSrc, /blocker/i, 'renderWorld must carry a blockers feed');
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
