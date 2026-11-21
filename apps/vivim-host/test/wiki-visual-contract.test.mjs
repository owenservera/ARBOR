import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { resolveDesktopDestination, resolveProductRoute } from '../../mobile-relay/control-language.mjs';
import { mountComposerAssist } from '../../mobile-relay/composer-assist.mjs';
import { sourceCards, sameSourceCard, matchesSourceContext, exactSourceContextUrl, reconcileSourceCards } from '../../mobile-relay/wiki-source-view.mjs';

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
  insertBefore(node, ref) { const i = ref ? this.children.indexOf(ref) : -1; if (i < 0) this.children.push(node); else this.children.splice(i, 0, node); return node; }
  removeChild(node) { const i = this.children.indexOf(node); if (i >= 0) this.children.splice(i, 1); return node; }
  append(...children){this.children.push(...children);}
  replaceChildren(...children) { this.children = [...children]; this.repaints++; }
  addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
  setAttribute(name, value) { this.attributes[name] = value; }
  focus() { this.focused = true; }
  fire(name, event = {}) { for (const fn of this.listeners[name] || []) fn({ preventDefault() {}, ...event }); }
}
const clone = x => JSON.parse(JSON.stringify(x));
const baseWiki = { revision: 1, pages: { Main: { sections: { About: '<img src=x onerror=alert(1)>', HowTo: 'First\nSecond' } } } };
const anchorId='hq:file-anchor:'+'b'.repeat(64), fingerprint='c'.repeat(64),sourceDigest='d'.repeat(64);
const baseSurface = { authority:'read_only_projection',schema: 'vivim.file-surface/1', generatorVersion: 'hq.source-index/1', status: 'indexed', files: [
  { project: 'arbor', sourceId: 'arbor:apps/vivim-host/public/pages/wiki.js', path: 'apps/vivim-host/public/pages/wiki.js', surface: '<script>not executable</script>', commentIds: ['vivim.example@1'], actionIds: [], sourceDigest,currentDigest:sourceDigest, freshness: 'indexed', annotations: [{ semanticId: 'vivim.example@1', kind: 'consumes', line: 12, resolution: 'unknown',semanticAnchor:{anchorId,fingerprint,semanticId:'vivim.example@1',annotationKind:'consumes',contentHash:sourceDigest,lines:[12],state:'indexed'},evidence:{origin:'extracted',assurance:'verified',claim:'annotation-occurrence',conflict:false} }], relationships: [] }
] };
function allChildren(node) { return [node, ...node.children.flatMap(allChildren)]; }
function setup() {
  const elements = new Map(ids.map(id => [id, new MockNode(id)]));
  const docs = {
    '/api/wiki': clone(baseWiki),
    '/api/state': { revision: 0, wikiRevision: 1, chat: [] },
    '/api/host/control/wiki-context': {
      schema: 'vivim.wiki-context/1', state: 'source-backed', revision: 0,
      totalObserved: 0, omitted: 0, items: []
    },
    '/api/file-surface': clone(baseSurface),
    '/api/journal': []
  };
  let postStatus = 200, postThrows = false, getFailure = null, ownerSession = true;
  let interpretStatus = 200;
  let meaning = { schema: 'vivim.control-language/1', outcome: 'candidate',
    candidate: { actionId: 'wiki.section.edit',
      args: { target: 'main/about', content: 'Voice notes are now our active priority' } } };
  const interpretCalls = [];
  const posts = [];
  const intervals = [];
  const fetch = async (url, options = {}) => {
    if (url === '/api/host/control/ui-state') {
      assert.equal(options.credentials, 'same-origin');
      return ownerSession
        ? { ok: true, status: 200, json: async () => ({ schema: 'vivim.control-ui-session/1', csrf: 'a'.repeat(64) }) }
        : { ok: false, status: 401, json: async () => ({ code: 'OWNER_AUTH' }) };
    }
    if ((url === '/api/host/control/wiki-context' || url.startsWith('/api/file-surface')) && !ownerSession)
      return { ok: false, status: 401, json: async () => ({ code: 'OWNER_AUTH' }) };
    if (url.startsWith('/api/file-surface/context?')) {
      assert.equal(options.credentials, 'same-origin');
      const record = docs['/api/file-surface'].files[0];
      return { ok: true, status: 200, json: async () => ({
        schema: 'vivim.source-context/1', status: 'indexed',
        sourceId: record.sourceId, sourceDigest: record.sourceDigest,
        anchor:{anchorId,fingerprint,line:12,semanticId:'vivim.example@1',resolution:'unknown',authority:'read_only_projection'},
        context: { schema: 'hq.context-bundle/1', authority:'read_only_projection',digest: 'e'.repeat(64),
          sources: [{ ref: record.sourceId, contentHash:sourceDigest,lines: [12, 16],semanticReferences:[{line:12,semanticAnchor:{anchorId,fingerprint}}] }],
          fragment: '<script>literal source, not executable HTML</script>' }
      }) };
    }
    if (url.startsWith('/api/file-surface?q=')) return {
      ok: true, status: 200, json: async () => clone(docs['/api/file-surface'])
    };
    if (url === '/api/host/control/interpret') {
      assert.equal(options.method, 'POST');
      assert.equal(options.credentials, 'same-origin');
      assert.equal(options.headers['x-vivim-control'], '1');
      assert.equal(options.headers['x-vivim-ui-csrf'], 'a'.repeat(64));
      assert.deepEqual(Object.keys(JSON.parse(options.body)), ['text']);
      interpretCalls.push({ url, options });
      if (!ownerSession || interpretStatus !== 200)
        return { ok: false, status: !ownerSession ? 401 : interpretStatus };
      return { ok: true, status: 200, json: async () => clone(meaning) };
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
  for(const node of elements.values())node.ownerDocument=document;
  const context = vm.createContext({ resolveDesktopDestination, resolveProductRoute, mountComposerAssist, sourceCards,sameSourceCard,matchesSourceContext,exactSourceContextUrl,reconcileSourceCards, document, fetch, setInterval: fn => { intervals.push(fn); return intervals.length; }, AbortSignal, TextEncoder, Date, console });
  vm.runInContext(script.replace("import { resolveDesktopDestination, resolveProductRoute } from '/mobile/control-language.mjs';",'').replace("import { mountComposerAssist } from '/mobile/composer-assist.mjs';",'').replace("import { sourceCards, sameSourceCard, matchesSourceContext, exactSourceContextUrl, reconcileSourceCards } from '/mobile/wiki-source-view.mjs';",''), context, { filename: 'wiki.js' });
  const el = id => elements.get(id);
  return { elements, docs, posts, interpretCalls, el, context, tick: () => intervals[0]?.(),
    setPostStatus: value => { postStatus = value; }, setPostThrows: value => { postThrows = value; },
    setGetFailure: value => { getFailure = value; },
    setOwnerSession: value => { ownerSession = value; },
    setInterpretation: value => { meaning = value; },
    setInterpretStatus: value => { interpretStatus = value; } };
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
  assert.match(html, /<label for="wiki-command">/);
  assert.match(html, /<form id="wiki-command-form"/);
  assert.match(css, /\.wiki-command-form/);
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
  assert.match(ui.el('source-mode').textContent, /initial Wiki content/);
  assert.match(ui.el('surface-source').textContent, /1 indexed files/);
  assert.match(ui.el('journal-source').textContent, /0 entries/);
  const wikiNodes = allChildren(ui.el('wiki-view'));
  assert.ok(wikiNodes.some(n => n.textContent === '<img src=x onerror=alert(1)>'));
  assert.ok(wikiNodes.some(n => /initial section \/ no edit record observed/.test(n.textContent)));
  const surfaceNodes = allChildren(ui.el('surface-view'));
  assert.ok(surfaceNodes.some(n => n.textContent === 'apps/vivim-host/public/pages/wiki.js'));
  assert.ok(surfaceNodes.some(n => n.textContent === '<script>not executable</script>'));
  assert.ok(surfaceNodes.some(n => n.textContent === 'vivim.example@1 · verified-occurrence'));
  assert.ok(surfaceNodes.some(n => n.tagName === 'button' && n.textContent === 'Read verified source context'));
  assert.ok(surfaceNodes.some(n => n.textContent.includes('Anchor '+anchorId)));
  const repaints = ['wiki', 'surface', 'journal'].map(k => ui.el(k + '-view').repaints);
  ui.tick(); await settle();
  assert.deepEqual(['wiki', 'surface', 'journal'].map(k => ui.el(k + '-view').repaints), repaints);
  ui.setGetFailure('/api/wiki'); ui.tick(); await settle();
  assert.equal(ui.el('wiki-view').repaints, repaints[0], 'last good Wiki remains in DOM on a network failure');
  assert.match(ui.el('wiki-source').textContent, /stale\/unavailable: source unreachable/);
  assert.match(ui.el('sync-status').textContent, /Retry pending/);
  ui.setGetFailure(null); ui.el('refresh-now').fire('click'); await settle();
  assert.doesNotMatch(ui.el('wiki-source').textContent, /stale\/unavailable/);
});

test('source search composes a unique current file context inline and removes stale or revoked content', async () => {
  const ui = setup(); await settle();
  ui.el('surface-query').value = 'vivim.example@1';
  ui.el('surface-search').fire('submit'); await settle();
  const rendered = allChildren(ui.el('surface-context-view'));
  assert.ok(rendered.some(node => node.textContent === '<script>literal source, not executable HTML</script>'));
  assert.ok(rendered.some(node => /Verified context · arbor:apps/.test(node.textContent)));
  ui.docs['/api/file-surface'].files[0].freshness = 'stale';
  ui.tick(); await settle();
  assert.equal(allChildren(ui.el('surface-context-view')).some(node =>
    node.textContent === '<script>literal source, not executable HTML</script>'), false);
  ui.docs['/api/file-surface'].files[0].freshness = 'indexed';
  ui.el('surface-search').fire('submit'); await settle();
  ui.setOwnerSession(false);
  ui.tick(); await settle();
  assert.match(ui.el('surface-context-view').children[0].textContent, /No cached context/);
});

test('D4 committed Wiki provenance and receipt readback refresh and clear on auth loss', async () => {
  const ui = setup(); await settle();
  ui.docs['/api/wiki'].revision = 2;
  ui.docs['/api/state'].wikiRevision = 2;
  ui.docs['/api/host/control/wiki-context'] = {
    schema: 'vivim.wiki-context/1', state: 'source-backed', revision: 2,
    wikiRevision: 2, totalObserved: 0, omitted: 0, items: [],
    wikiChanges: { total: 1, omitted: 0, items: [{
      source: 'host-product-journal', entryId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      sequence: 2, receivedAt: '2026-11-18T12:00:00Z', kind: 'committed-wiki-edit',
      wikiRevision: 2, previousWikiRevision: 1, status: 'current-section-revision',
      relationship: { kind: 'mutated-section', page: 'Main', section: 'About' }
    }] },
    applicationEffects: { state: 'source-backed', scannedPlans: 1, scanLimit: 100, omitted: 0, items: [{
      source: 'host-control-receipt', planId: 'ctl-0000000000000001', planDigest: 'a'.repeat(64),
      actionId: 'ui.theme.set_preset', receivedAt: '2026-11-18T12:01:00Z',
      kind: 'executed-effect', status: 'historical-applied-receipt', sourceRevision: 4
    }] }
  };
  ui.tick(); await settle();
  const nodes = allChildren(ui.el('context-view'));
  assert.ok(nodes.some(n => n.textContent === 'Main/About'));
  assert.ok(nodes.some(n => /Committed Wiki effect.*current-section-revision/.test(n.textContent)));
  assert.ok(nodes.some(n => n.textContent === 'ui.theme.set_preset'));
  assert.ok(nodes.some(n => /Historical applied receipt.*source revision 4/.test(n.textContent)));
  ui.setGetFailure('/api/wiki'); ui.tick(); await settle();
  assert.ok(!allChildren(ui.el('context-view')).some(n => /Committed Wiki effect|Historical applied receipt/.test(n.textContent)));
  ui.setGetFailure(null); ui.tick(); await settle();
  assert.ok(allChildren(ui.el('context-view')).some(n => /Committed Wiki effect/.test(n.textContent)));
  ui.setOwnerSession(false); ui.tick(); await settle();
  assert.ok(!allChildren(ui.el('context-view')).some(n =>
    /Main\/About|ui\.theme\.set_preset/.test(n.textContent)));
});

test('private context refreshes during polling and clears after owner auth loss', async () => {
  const ui = setup(); await settle();
  assert.match(ui.el('context-source').textContent, /0 observed/);
  ui.docs['/api/host/control/wiki-context'] = {
    schema: 'vivim.wiki-context/1', state: 'source-backed', revision: 1,
    totalObserved: 1, omitted: 0, items: [{
      source: 'host-product-journal', entryId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      sequence: 1, receivedAt: '2026-11-18T12:00:00Z', actorDeclared: 'human',
      text: '<img src=x onerror=alert(1)>', status: 'user-statement-unverified'
    }]
  };
  ui.tick(); await settle();
  const nodes = allChildren(ui.el('context-view'));
  assert.ok(nodes.some(n => n.textContent === '<img src=x onerror=alert(1)>'));
  assert.ok(nodes.some(n => /Unverified user statement/.test(n.textContent)));
  ui.setOwnerSession(false);
  ui.tick(); await settle();
  assert.match(ui.el('context-view').children[0].textContent, /Owner context locked/);
  assert.match(ui.el('surface-view').children[0].textContent, /Source index locked/);
  assert.ok(!allChildren(ui.el('surface-view')).some(n => n.textContent.includes('vivim.example@1')));
  assert.equal(allChildren(ui.el('context-view')).some(n =>
    n.textContent === '<img src=x onerror=alert(1)>'), false);
});

test('typed Wiki command opens existing editor; interpretation/review do not write, confirmation does', async () => {
  const ui = setup(); await settle();
  const sentence = 'edit wiki section main/about saying Voice notes are now our active priority';
  ui.el('wiki-command').value = sentence;
  ui.el('wiki-command-form').fire('submit'); await settle();
  assert.equal(ui.interpretCalls.length, 1);
  assert.equal(ui.el('edit-target').textContent, 'Main/About');
  assert.equal(ui.el('edit-content').value, 'Voice notes are now our active priority');
  assert.match(ui.el('edit-command-context').textContent, /wiki\.section\.edit/);
  assert.match(ui.el('edit-command-context').textContent, /edit wiki section main\/about/);
  assert.equal(ui.posts.length, 0, 'typed interpretation must not append');
  ui.el('edit-review').fire('click'); await settle();
  assert.equal(ui.el('edit-save').hidden, false);
  assert.match(ui.el('edit-diff').textContent, /\+ Voice notes are now our active priority/);
  assert.equal(ui.posts.length, 0, 'diff preview must not append');
  ui.el('edit').fire('submit'); await settle();
  assert.equal(ui.posts.length, 1);
  assert.deepEqual(ui.posts[0].body.edit, { action: 'set-section', page: 'Main',
    section: 'About', content: 'Voice notes are now our active priority' });
  assert.equal(ui.docs['/api/wiki'].pages.Main.sections.About, 'Voice notes are now our active priority');
  assert.equal(ui.docs['/api/wiki'].revision, 2);
  assert.match(ui.el('edit-status').textContent, /fresh GET \/api\/wiki confirms/);
});

test('unsupported, missing, ambiguous and oversized NL Wiki targets never create a mutation', async () => {
  const sentence = 'edit wiki section main/about saying Voice notes are now our active priority';
  const typed = (target, content) => ({ schema: 'vivim.control-language/1',
    outcome: 'candidate', candidate: { actionId: 'wiki.section.edit', args: { target, content } } });
  for (const { reply, expected } of [
    { reply: { schema: 'vivim.control-language/1', outcome: 'clarification_required',
      question: 'Specify a single action.' }, expected: /No Wiki edit/ },
    { reply: { schema: 'vivim.control-language/1', outcome: 'candidate',
      candidate: { actionId: 'ui.theme.set_preset', args: { preset: 'dusk' } } }, expected: /No Wiki edit/ },
    { reply: typed('main/missing', 'new'), expected: /does not exist/ },
    { reply: typed('main/about', 'ü'.repeat(1600)), expected: /limits/ }
  ]) {
    const ui = setup(); await settle();
    ui.setInterpretation(reply);
    ui.el('wiki-command').value = sentence;
    ui.el('wiki-command-form').fire('submit'); await settle();
    assert.match(ui.el('wiki-command-status').textContent, expected);
    assert.equal(ui.el('edit-target').textContent, '');
    assert.equal(ui.posts.length, 0);
    assert.equal(ui.el('wiki-command').value, sentence);
  }
  const ambiguous = setup(); await settle();
  ambiguous.docs['/api/wiki'].pages.main = { sections: { About: 'A duplicate folded name' } };
  ambiguous.setInterpretation(typed('main/about', 'new'));
  ambiguous.el('wiki-command').value = sentence;
  ambiguous.el('wiki-command-form').fire('submit'); await settle();
  assert.match(ambiguous.el('wiki-command-status').textContent, /Ambiguous Wiki target/);
  assert.equal(ambiguous.posts.length, 0);
});

test('NL Wiki interpretation requires owner and preserves stale drafts without auto-retry', async () => {
  const denied = setup(); await settle();
  denied.setOwnerSession(false);
  denied.el('wiki-command').value = 'edit wiki section main/about saying New text';
  denied.el('wiki-command-form').fire('submit'); await settle();
  assert.match(denied.el('wiki-command-status').textContent, /HTTP 401|Owner session required/);
  assert.equal(denied.posts.length, 0);
  assert.equal(denied.el('edit-target').textContent, '');
  const stale = setup(); await settle();
  stale.el('wiki-command').value = 'edit wiki section main/about saying New text';
  stale.el('wiki-command-form').fire('submit'); await settle();
  stale.el('edit-review').fire('click'); await settle();
  stale.docs['/api/wiki'].revision = 2;
  stale.el('edit').fire('submit'); await settle();
  assert.equal(stale.posts.length, 0);
  assert.equal(stale.el('edit-content').value, 'Voice notes are now our active priority');
  assert.equal(stale.el('edit-rebase').hidden, false);
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
