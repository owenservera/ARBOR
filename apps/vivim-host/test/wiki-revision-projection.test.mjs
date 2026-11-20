// Focused acceptance: Wiki revision projection N -> N+1 highlights only the changed
// section, keeps unchanged sections' DOM/state, and discards an out-of-order (stale)
// response instead of overwriting the fresh content. Mirrors the wiki.js VM harness in
// wiki-visual-contract.test.mjs. Source/VM test: not browser or Host acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const here = path.dirname(fileURLToPath(import.meta.url));
const pages = path.resolve(here, '../public/pages');
const script = readFileSync(path.join(pages, 'wiki.js'), 'utf8');
const css = readFileSync(path.join(pages, 'wiki.css'), 'utf8');
const ids = [...readFileSync(path.join(pages, 'wiki.html'), 'utf8').matchAll(/\bid="([a-z-]+)"/g)].map(m => m[1]);

class MockNode {
  constructor(tag) {
    this.tagName = tag.toLowerCase(); this.children = []; this.dataset = {}; this.listeners = {};
    this.className = ''; this.textContent = ''; this.value = ''; this.hidden = false;
    this.disabled = false; this.repaints = 0; this.attributes = {};
  }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = [...children]; this.repaints++; }
  addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
  setAttribute(name, value) { this.attributes[name] = value; }
  focus() { this.focused = true; }
  fire(name, event = {}) { for (const fn of this.listeners[name] || []) fn({ preventDefault() {}, ...event }); }
}
const clone = x => JSON.parse(JSON.stringify(x));
function allChildren(node) { return [node, ...node.children.flatMap(allChildren)]; }
function setup() {
  const elements = new Map(ids.map(id => [id, new MockNode(id)]));
  const docs = {
    '/api/wiki': { revision: 1, pages: { Main: { sections: { About: 'seed about', HowTo: 'First\nSecond' } } } },
    '/api/state': { revision: 0, wikiRevision: 1, chat: [] },
    '/api/roadmap': { acceleration: {}, buildQueue: [] },
    '/api/file-surface': { generatorVersion: 'gen/1', files: [] },
    '/api/journal': []
  };
  const fetch = async url => {
    if (url === '/api/host/control/ui-state') return { ok: true, status: 200, json: async () => ({ schema: 'vivim.control-ui-session/1', csrf: 'a'.repeat(64) }) };
    assert.ok(Object.hasOwn(docs, url), `no invented endpoint ${url}`);
    return { ok: true, status: 200, json: async () => clone(docs[url]) };
  };
  const document = { getElementById: id => elements.get(id), createElement: name => new MockNode(name), addEventListener() {}, hidden: false };
  let interval = null;
  const context = vm.createContext({ document, fetch, setInterval: fn => { interval = fn; return 1; }, AbortSignal, TextEncoder, Date, console });
  vm.runInContext(script, context, { filename: 'wiki.js' });
  return { elements, docs, context, el: id => elements.get(id), tick: () => interval() };
}
async function settle() { for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve)); }
const sectionNodes = ui => allChildren(ui.el('wiki-view')).filter(node => node.dataset?.wikiId);
const sectionNode = (ui, id) => sectionNodes(ui).find(node => node.dataset.wikiId === id);

test('N -> N+1: highlight the changed section only, keep untouched DOM/state, discard a stale response', async () => {
  const ui = setup(); await settle();
  assert.match(ui.el('rev').textContent, /Wiki revision: 1/);

  const about = sectionNode(ui, 'Main/About');
  const howTo = sectionNode(ui, 'Main/HowTo');
  assert.ok(about && howTo, 'seed sections are projected');
  const repaints = ui.el('wiki-view').repaints;
  const aboutButton = about.children[0].children[1];
  assert.equal(aboutButton.tagName, 'button', 'About keeps its edit button');

  // N -> N+1: only Main/HowTo content changes.
  ui.docs['/api/wiki'].revision = 2;
  ui.docs['/api/wiki'].pages.Main.sections.HowTo = 'New first line\nSecond';
  ui.el('refresh-now').fire('click'); await settle();
  assert.equal(ui.el('wiki-view').repaints, repaints, 'no full rebuild on a content revision bump');
  assert.match(ui.el('rev').textContent, /Wiki revision: 2/);
  assert.equal(aboutButton.listeners.click.length, 1, 'unchanged section keeps its listener/DOM state');
  assert.equal(sectionNode(ui, 'Main/About'), about, 'unchanged section keeps the same DOM node');
  assert.equal(about.children.find(n => n.className === 'body').textContent, 'seed about', 'unchanged body untouched');
  assert.equal(about.dataset.revision, '2', 'unchanged section still refreshes its revision label');
  assert.equal(about.className, 'section', 'unchanged section is not highlighted');
  const changed = sectionNode(ui, 'Main/HowTo');
  assert.match(changed.className, /(^|\s)changed(\s|$)/);
  assert.equal(changed.dataset.changedRevision, '2');
  assert.equal(changed.children.find(n => n.className === 'body').textContent, 'New first line\nSecond');
  assert.match(changed.children.find(n => n.className === 'meta').textContent, /changed in Wiki rev 2/);
  assert.equal(ui.el('wiki-view').repaints, repaints, 'highlight is an in-place patch, not a rebuild');

  // Stale response: an older revision answered after the newer one must be discarded.
  ui.docs['/api/wiki'].revision = 1;
  ui.docs['/api/wiki'].pages.Main.sections.HowTo = 'First\nSecond';
  ui.el('refresh-now').fire('click'); await settle();
  assert.match(ui.el('rev').textContent, /Wiki revision: 2/, 'stale response cannot roll the view back');
  assert.equal(ui.el('wiki-view').repaints, repaints, 'stale response performs no DOM work');
  assert.equal(sectionNode(ui, 'Main/HowTo').children.find(n => n.className === 'body').textContent,
    'New first line\nSecond', 'fresh content survives an out-of-order response');
  assert.match(sectionNode(ui, 'Main/HowTo').className, /changed/, 'fresh highlight survives');
  assert.match(ui.el('wiki-source').textContent, /stale rev 1 discarded \(current rev 2\)/);
  assert.doesNotMatch(ui.el('sync-status').textContent, /Retry pending/, 'discard is not a source failure');

  // N+1 -> N+2: the highlight moves to the newly changed section and clears from the old one.
  ui.docs['/api/wiki'].revision = 3;
  ui.docs['/api/wiki'].pages.Main.sections.About = 'revised about';
  ui.el('refresh-now').fire('click'); await settle();
  assert.equal(ui.el('wiki-view').repaints, repaints, 'second projection is also in place');
  const movedAbout = sectionNode(ui, 'Main/About');
  assert.equal(movedAbout, about, 'same DOM node updated in place');
  assert.match(movedAbout.className, /changed/);
  assert.equal(movedAbout.dataset.changedRevision, '3');
  assert.equal(sectionNode(ui, 'Main/HowTo').className, 'section', 'previous highlight clears');
  assert.equal(sectionNode(ui, 'Main/HowTo').children.find(n => n.className === 'body').textContent,
    'New first line\nSecond', 'previously changed section is not rewritten');
  assert.equal(ui.el('wiki-view').repaints, repaints, 'still no unrelated rebuild');
});

test('structural page/section changes still fall back to a full render', async () => {
  const ui = setup(); await settle();
  const repaints = ui.el('wiki-view').repaints;
  ui.docs['/api/wiki'].pages.Main.sections.Extra = 'added section';
  ui.docs['/api/wiki'].revision = 2;
  ui.el('refresh-now').fire('click'); await settle();
  assert.ok(ui.el('wiki-view').repaints > repaints, 'added section rebuilds the Wiki view');
  assert.ok(sectionNode(ui, 'Main/Extra'), 'new section projected');
  assert.equal(ui.el('wiki-view').repaints, repaints + 1, 'exactly one rebuild');
  assert.match(css, /\.section\.changed/, 'changed-section styling exists');
});