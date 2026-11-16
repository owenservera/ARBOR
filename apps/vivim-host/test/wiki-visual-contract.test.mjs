import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { createVecCompiler, VEC_COMPILE_SCHEMA } from '../../mobile-relay/vec/compiler.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const pages = path.resolve(here, '../public/pages');
const script = readFileSync(path.join(pages, 'wiki.js'), 'utf8');
const html = readFileSync(path.join(pages, 'wiki.html'), 'utf8');
const css = readFileSync(path.join(pages, 'wiki.css'), 'utf8');
const ids = [...html.matchAll(/\bid="([a-z-]+)"/g)].map(match => match[1]);

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
const baseWiki = { revision: 1, pages: { Main: { sections: { About: '<img src=x onerror=alert(1)>', HowTo: 'First\nSecond' } } } };
const baseRoadmap = { acceleration: { revision: 'R002', activeBatch: 'ACCEL-A' }, buildQueue: [
  { itemId: 'A02', status: 'in-progress', verification: 'UNRUN', ownerAcceptance: 'PENDING', note: 'Host journal' },
  { itemId: 'A04', status: 'queued', verification: 'UNRUN', ownerAcceptance: 'PENDING', dependsOn: ['A02'], note: 'VEC compiler' }
] };
const baseSurface = { schema: 'vivim.file-surface/1', generatorVersion: 'file-surface-gen/1 stage-a', files: [
  { path: 'apps/vivim-host/public/pages/wiki.js', surface: '<script>not executable</script>', commentIds: ['a'], actionIds: [], sourceDigest: 'example-digest' }
] };
function allChildren(node) { return [node, ...node.children.flatMap(allChildren)]; }
function setup() {
  const elements = new Map(ids.map(id => [id, new MockNode(id)]));
  const docs = {
    '/api/wiki': clone(baseWiki),
    '/api/state': { revision: 0, wikiRevision: 1, chat: [] },
    '/api/roadmap': clone(baseRoadmap),
    '/api/file-surface': clone(baseSurface),
    '/api/journal': []
  };
  let postStatus = 200, postThrows = false, getFailure = null, ownerSession = true;
  const posts = [];
  let interval = null;
  const fetch = async (url, options = {}) => {
    if (url === '/api/host/control/ui-state') {
      assert.equal(options.credentials, 'same-origin');
      return ownerSession
        ? { ok: true, status: 200, json: async () => ({ schema: 'vivim.control-ui-session/1', csrf: 'a'.repeat(64) }) }
        : { ok: false, status: 401, json: async () => ({ code: 'OWNER_AUTH' }) };
    }
    if (url === '/api/mutate') {
      const body = JSON.parse(options.body);
      assert.equal(options.credentials, 'same-origin');
      assert.equal(options.headers['x-vivim-ui-csrf'], 'a'.repeat(64), 'Host-issued session CSRF is mandatory');
      posts.push({ url, body, options });
      if (postThrows) throw new Error('socket disconnected');
      if (postStatus !== 200) return { ok: false, status: postStatus, text: async () => 'refused by Host' };
      docs['/api/wiki'].pages[body.edit.page].sections[body.edit.section] = body.edit.content;
      docs['/api/wiki'].revision++;
      docs['/api/state'].revision++;
      docs['/api/state'].wikiRevision = docs['/api/wiki'].revision;
      const ack = { ...body, wikiRevision: docs['/api/wiki'].revision, revision: docs['/api/state'].revision, receivedAt: '2026-11-14T22:00:00Z' };
      docs['/api/journal'].push(ack);
      return { ok: true, status: 200, json: async () => clone(ack) };
    }
    if (getFailure === url) throw new Error('source unreachable');
    assert.ok(Object.hasOwn(docs, url), `no invented endpoint ${url}`);
    assert.equal(options.cache, 'no-store');
    return { ok: true, status: 200, json: async () => clone(docs[url]) };
  };
  const document = { getElementById: id => {
    assert.ok(elements.has(id), `Wiki JS cannot reference absent DOM id ${id}`);
    return elements.get(id);
  }, createElement: name => new MockNode(name), addEventListener() {}, hidden: false };
  const context = vm.createContext({ document, fetch, setInterval: fn => { interval = fn; return 1; }, AbortSignal, TextEncoder, Date, console });
  vm.runInContext(script, context, { filename: 'wiki.js' });
  const el = id => elements.get(id);
  return { elements, docs, posts, el, context, tick: () => interval(),
    setPostStatus: value => { postStatus = value; }, setPostThrows: value => { postThrows = value; },
    setGetFailure: value => { getFailure = value; },
    setOwnerSession: value => { ownerSession = value; } };
}
async function settle() { for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve)); }

// All external APIs are Host-owned. Source/VM tests are not browser or Host acceptance.
test('external-asset CSP, accessible controls, and read-only typed VEC seam', () => {
  assert.match(html, /<script type="module" src="\/wiki\.js"><\/script>/);
  assert.match(html, /<link rel="stylesheet" href="\/wiki\.css">/);
  assert.doesNotMatch(html, /<style\b|\sonclick=|<script(?! type="module" src="\/wiki\.js")/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /data-vec-schema="vivim\.vec-compile\/0\.1"/);
  assert.match(html, /data-vec-outcome="unsupported"/);
  assert.match(html, /<label for="edit-content">/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(max-width: 600px\)/);
  assert.doesNotMatch(script, /\.innerHTML\s*=|\beval\s*\(|new Function\s*\(|https?:\/\//);
  assert.match(script, /LEGACY_OWNER_NOT_MIGRATED/);
  assert.match(script, /authorization:'none', executed:false, persisted:false/);
  assert.doesNotMatch(script, /createVecCompiler\s*\(|\bcompile\s*\(|\/api\/compile|\/api\/publish/);
});

test('Host source projection: revisions, seed truth, actual files[] schema and unchanged-poll no repaint', async () => {
  const ui = setup(); await settle();
  assert.match(ui.el('rev').textContent, /Wiki revision: 1/);
  assert.match(ui.el('state-rev').textContent, /Chat state: 0/);
  assert.match(ui.el('source-mode').textContent, /seed\/demo baseline/);
  assert.match(ui.el('roadmap-source').textContent, /roadmap\.v1\.json/);
  assert.match(ui.el('surface-source').textContent, /1 indexed files/);
  assert.match(ui.el('journal-source').textContent, /0 entries/);
  const wikiNodes = allChildren(ui.el('wiki-view'));
  assert.ok(wikiNodes.some(n => n.textContent === '<img src=x onerror=alert(1)>'));
  assert.ok(wikiNodes.some(n => /seed \/ no edit record observed/.test(n.textContent)));
  const surfaceNodes = allChildren(ui.el('surface-view'));
  assert.ok(surfaceNodes.some(n => n.textContent === 'apps/vivim-host/public/pages/wiki.js'));
  assert.ok(surfaceNodes.some(n => n.textContent === '<script>not executable</script>'));
  const roadmapNodes = allChildren(ui.el('roadmap-view'));
  assert.ok(roadmapNodes.some(n => n.textContent === 'A04'));
  assert.ok(roadmapNodes.some(n => n.textContent === 'UNRUN / PENDING'));
  const repaints = ['wiki', 'roadmap', 'surface', 'journal'].map(k => ui.el(k + '-view').repaints);
  ui.tick(); await settle();
  assert.deepEqual(['wiki', 'roadmap', 'surface', 'journal'].map(k => ui.el(k + '-view').repaints), repaints);
  ui.setGetFailure('/api/wiki'); ui.tick(); await settle();
  assert.equal(ui.el('wiki-view').repaints, repaints[0], 'last good Wiki remains in DOM on a network failure');
  assert.match(ui.el('wiki-source').textContent, /stale\/unavailable: source unreachable/);
  assert.match(ui.el('sync-status').textContent, /Retry pending/);
  ui.setGetFailure(null); ui.el('refresh-now').fire('click'); await settle();
  assert.doesNotMatch(ui.el('wiki-source').textContent, /stale\/unavailable/);
});

test('fresh revision diff, explicit Host POST receipt, readback and stale refusal without losing the draft', async () => {
  const ui = setup(); await settle();
  const edit = allChildren(ui.el('wiki-view')).find(n => n.tagName === 'button' && /Main\/HowTo/.test(n.attributes['aria-label']));
  assert.ok(edit, 'edit is an accessible explicit button, not a clickable card');
  edit.fire('click');
  ui.el('edit-content').value = 'New first line\nSecond';
  ui.el('edit-content').fire('input');
  ui.el('edit-review').fire('click'); await settle();
  assert.equal(ui.el('edit-save').hidden, false);
  assert.match(ui.el('edit-preview-meta').textContent, /expectedRevision=1/);
  assert.match(ui.el('edit-diff').textContent, /- First/);
  assert.match(ui.el('edit-diff').textContent, /\+ New first line/);
  assert.equal(ui.posts.length, 0, 'preview never writes');
  // Source changes between review and submit: client refuses without POST.
  ui.docs['/api/wiki'].revision = 2;
  ui.el('edit').fire('submit'); await settle();
  assert.equal(ui.posts.length, 0);
  assert.equal(ui.el('edit-content').value, 'New first line\nSecond');
  assert.equal(ui.el('edit-rebase').hidden, false);
  ui.el('edit-rebase').fire('click'); await settle();
  assert.equal(ui.el('edit-content').value, 'New first line\nSecond');
  ui.el('edit-review').fire('click'); await settle();
  assert.match(ui.el('edit-preview-meta').textContent, /expectedRevision=2/);
  ui.setPostStatus(409);
  ui.el('edit').fire('submit'); await settle();
  assert.equal(ui.posts.length, 1);
  assert.match(ui.el('edit-status').textContent, /Host refused HTTP 409/);
  assert.equal(ui.el('edit-content').value, 'New first line\nSecond');
  ui.setPostStatus(200);
  ui.el('edit-review').fire('click'); await settle();
  ui.el('edit').fire('submit'); await settle();
  assert.equal(ui.posts.length, 2);
  assert.equal(ui.posts[1].body.expectedRevision, 2);
  assert.equal(ui.posts[1].body.actor, 'owner-browser');
  assert.equal(ui.posts[1].options.headers['x-vivim-control'], '1');
  assert.equal(ui.posts[1].options.headers['x-vivim-ui-csrf'], 'a'.repeat(64));
  assert.equal(ui.docs['/api/wiki'].revision, 3);
  assert.equal(ui.el('edit-content').disabled, true);
  assert.match(ui.el('edit-status').textContent, /fresh GET \/api\/wiki confirms/);
});

test('400/403 Host refusal retains draft and never claims saved', async () => {
  for (const status of [400, 403]) {
    const ui = setup(); await settle();
    const edit = allChildren(ui.el('wiki-view')).find(n => n.tagName === 'button' && /Main\/About/.test(n.attributes['aria-label']));
    edit.fire('click');
    ui.el('edit-content').value = 'draft retained';
    ui.el('edit-review').fire('click'); await settle();
    ui.setPostStatus(status);
    ui.el('edit').fire('submit'); await settle();
    assert.match(ui.el('edit-status').textContent, new RegExp(`Host refused HTTP ${status}`));
    assert.equal(ui.el('edit-content').value, 'draft retained');
    assert.equal(ui.el('edit-save').hidden, false, 'user can review/retry a definite refusal');
    assert.equal(ui.docs['/api/wiki'].revision, 1);
  }
});

test('uncertain network POST outcome is not retried blindly', async () => {
  const ui = setup(); await settle();
  const edit = allChildren(ui.el('wiki-view')).find(n => n.tagName === 'button' && /Main\/About/.test(n.attributes['aria-label']));
  edit.fire('click'); ui.el('edit-content').value = 'important draft';
  ui.el('edit-review').fire('click'); await settle();
  ui.setPostThrows(true); ui.el('edit').fire('submit'); await settle();
  assert.match(ui.el('edit-status').textContent, /Network\/receipt uncertainty/);
  assert.equal(ui.el('edit-content').value, 'important draft');
  assert.equal(ui.el('edit-save').hidden, true);
  ui.el('edit').fire('submit'); await settle();
  assert.equal(ui.posts.length, 1, 'retry blocked until readback');
});

test('no owner browser session refuses Wiki save without posting or losing draft', async () => {
  const ui = setup(); await settle();
  ui.setOwnerSession(false);
  const edit = allChildren(ui.el('wiki-view')).find(n => n.tagName === 'button' && /Main\/HowTo/.test(n.attributes['aria-label']));
  edit.fire('click');
  ui.el('edit-content').value = 'private draft';
  ui.el('edit-review').fire('click'); await settle();
  ui.el('edit').fire('submit'); await settle();
	assert.equal(ui.posts.length, 0);
	assert.equal(ui.el('edit-content').value, 'private draft');
	assert.match(ui.el('edit-status').textContent, /Owner session required|Unlock Host Control/);
});

// --- A04 acceptance: three bounded intents through existing NLCL/VEC surfaces ---

test('Intent 1: VEC wiki domain stays a read-only projection; open-the-wiki navigates instead of demanding missing Wiki section parameters', () => {
  const c = createVecCompiler();
  // wiki and command keep incumbent owners until source parity is independently established.
  // No guarded edit is ever produced; the domain is unsupported, not a parameter-demand.
  const wikiResult = c.compile({ domain: 'wiki', text: 'open the wiki', context: {} });
  assert.equal(wikiResult.outcome, 'unsupported');
  assert.equal(wikiResult.code, 'LEGACY_OWNER_NOT_MIGRATED');
  assert.equal(wikiResult.schema, VEC_COMPILE_SCHEMA);
  assert.equal(wikiResult.authorization, 'none');
  assert.equal(wikiResult.executed, false);
  assert.equal(wikiResult.persisted, false);
  assert.equal(wikiResult.product, 'wiki-projection');
  assert.equal(wikiResult.legacyOwner, 'hq.wiki-program/1');
  // command keeps its incumbent owner too (read-only, no execution).
  assert.equal(c.compile({ domain: 'command', text: 'open the wiki', context: {} }).code,
    'LEGACY_OWNER_NOT_MIGRATED');
  assert.equal(c.compile({ domain: 'command', text: 'open the wiki', context: {} }).product,
    'command-plan');
  // unknown domain is refused, not silently executed.
  assert.equal(c.compile({ domain: 'unknown', text: 'open the wiki' }).code, 'UNKNOWN_DOMAIN');
  // A caller cannot forge authorization/execution/persistence out of an adapter result.
  const forged = createVecCompiler({ adapters: {
    wiki: () => ({ outcome: 'candidate', authorization: 'yes', persisted: true, executed: true, code: 'DEMO' })
  } });
  const out = forged.compile({ domain: 'wiki', text: 'open the wiki' });
  assert.equal(out.outcome, 'candidate');
  assert.equal(out.authorization, 'none');
  assert.equal(out.executed, false);
  assert.equal(out.persisted, false);
});

test('Intent 2: source-backed ARBOR progress projection shows source identity/revision and repaints on changed revision', async () => {
  const ui = setup(); await settle();
  // Source identity/revision surface: roadmap = keeper-owned roadmap.v1.json via /api/roadmap.
  assert.match(ui.el('roadmap-source').textContent, /roadmap\.v1\.json/);
  assert.match(ui.el('roadmap-source').textContent, /\/api\/roadmap/);
  const roadmapNodes = allChildren(ui.el('roadmap-view'));
  assert.ok(roadmapNodes.some(n => n.textContent === 'A04'), 'A04 present in source-backed queue');
  assert.ok(roadmapNodes.some(n => n.textContent.includes('needs A02')), 'dependency shown');
  assert.ok(roadmapNodes.some(n => n.textContent === 'UNRUN / PENDING'), 'honest UNRUN / PENDING status');

  // Chat state shows the Wiki revision as source identity/revision.
  assert.match(ui.el('state-rev').textContent, /Chat state: 0 · Wiki 1/);

  // Source revision change: mutating the source snapshot triggers a repaint (projection updates on changed revision).
  const before = ui.el('roadmap-view').repaints;
  ui.docs['/api/roadmap'].buildQueue[0].status = 'in-progress';
  ui.docs['/api/roadmap'].acceleration.activeBatch = 'ACCEL-B';
  ui.tick(); await settle();
  assert.notEqual(ui.el('roadmap-view').repaints, before, 'changed source revision repaints the projection');
  assert.match(ui.el('roadmap-source').textContent, /ACCEL-B/, 'updated source revision visible');
});

test('Intent 3: preview refuses stale revision and unapproved publish; no parallel visual publisher introduced', async () => {
  const ui = setup(); await settle();
  const edit = allChildren(ui.el('wiki-view')).find(n => n.tagName === 'button' && /Main\/HowTo/.test(n.attributes['aria-label']));
  edit.fire('click');
  ui.el('edit-content').value = 'New first line\nSecond';
  ui.el('edit-review').fire('click'); await settle();
  assert.equal(ui.el('edit-save').hidden, false);
  assert.match(ui.el('edit-preview-meta').textContent, /expectedRevision=1/);
  assert.equal(ui.posts.length, 0, 'preview never writes');

  // Stale revision between review and submit: refused without POST; draft preserved; no save claimed.
  ui.docs['/api/wiki'].revision = 2;
  ui.el('edit').fire('submit'); await settle();
  assert.equal(ui.posts.length, 0);
  assert.equal(ui.el('edit-content').value, 'New first line\nSecond');
  assert.equal(ui.el('edit-save').hidden, true);
  assert.equal(ui.el('edit-rebase').hidden, false);
  assert.match(ui.el('edit-status').textContent, /Revision or draft changed after preview|Stale revision/);

  // No parallel visual publisher: wiki.js installs no VEC compiler and never calls compile/
  // publish for the wiki domain; the VEC seam stays read-only (unsupported / LEGACY_OWNER_NOT_MIGRATED).
  assert.doesNotMatch(script, /createVecCompiler\s*\(|\/api\/compile|\/api\/publish/);
  assert.match(script, /authorization:'none', executed:false, persisted:false/);
  const c = createVecCompiler();
  assert.equal(c.compile({ domain: 'wiki', text: 'open the wiki', context: {} }).code, 'LEGACY_OWNER_NOT_MIGRATED');
});
