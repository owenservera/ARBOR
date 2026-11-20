// D14.wiki-source-card — equivalent wiki-source coverage inside the test/*.test.mjs glob.
//
// The four root-level wiki suites (goal-wiki, goal1-wiki-chat-regression,
// goal1-wiki-tab-open, wiki-receipt-refresh) live at the apps/mobile-relay root,
// outside the `test/*.test.mjs` glob, so `npm test` / `node --test test/*.test.mjs`
// does not run them. They are dispatched only by explicit `node --test <files>`.
// This suite pins the same wiki source contract (Host wiki route, tab panel,
// TABS membership, goTab refresh) from within the glob so wiki regressions are
// covered by the standard test command.
//
// Runtime: node:test. No bun-only imports.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const here = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const app = readFileSync(here + '../app.js', 'utf8');
const html = readFileSync(here + '../index.html', 'utf8');
const model = readFileSync(here + '../ux/model.mjs', 'utf8');

test('wiki fetch uses the Host control route under HOST_PREVIEW at both call sites, no stale /api/wiki', () => {
  const hits = app.match(/fetch\(HOST_PREVIEW\s*\?\s*'\/api\/host\/control\/wiki-view'\s*:\s*'\/mobile\/api\/wiki'/g) ?? [];
  assert.equal(hits.length, 2, 'expected both wiki fetch call sites (app.js:788 and app.js:1795); found ' + hits.length);
  assert.ok(!app.includes("'/api/wiki'"), 'stale quoted /api/wiki route literal still present in app.js');
});

test('index.html exposes an accessible Wiki tab and panel', () => {
  assert.match(html, /id="tab-wiki"[^>]*role="tab"[^>]*aria-controls="v-wiki"/);
  assert.match(html, /id="v-wiki"[^>]*role="tabpanel"/);
  assert.ok(/data-tab="wiki">Wiki<\/button>/.test(html), 'visible Wiki button in tab rail');
});

test('ux/model.mjs TABS includes wiki', () => {
  assert.ok(/TABS\s*=\s*Object\.freeze\(\['today',\s*'talk',\s*'build',\s*'world',\s*'wiki'/.test(model),
    'TABS must include wiki');
});

test('goTab selects wiki and refreshes it without tearing away the phone document', () => {
  const events = [];
  const sandbox = {
    S: { tab: 'talk', paired: false }, TABS: ['talk', 'wiki'], HOST_PREVIEW: false,
    dockAssist: { reset() {} }, compose: { resetAssist() {} },
    clearWikiSources() {}, build: null, $: () => null, schedule() {}, refreshHostPreview() {},
    closeDrawer() {}, renderTabs() { events.push('tabs'); },
    renderSurfaces() { events.push('surface'); }, refreshWiki() { events.push('wiki'); },
    refreshMedia() {}, playerActive: false, stopMediaPlayer() {},
    chatContextEpoch: 0, chatContext: null, buildBindingSequence: 0,
    document: { getElementById: () => ({ scrollIntoView() {} }) }
  };
  const start = app.indexOf('function goTab(');
  assert.notEqual(start, -1);
  let i = app.indexOf('(', start), parens = 0;
  for (; i < app.length; i++) {
    if (app[i] === '(') parens++;
    else if (app[i] === ')') parens--;
    else if (app[i] === '{' && parens === 0) break;
  }
  let depth = 0, end = -1;
  for (let j = i; j < app.length; j++) {
    if (app[j] === '{') depth++;
    else if (app[j] === '}') { depth--; if (depth === 0) { end = j + 1; break; } }
  }
  assert.notEqual(end, -1, 'unbalanced braces in goTab');
  vm.createContext(sandbox);
  vm.runInContext(app.slice(start, end), sandbox);
  sandbox.goTab('wiki');
  assert.equal(sandbox.S.tab, 'wiki');
  assert.deepEqual(events, ['tabs', 'surface', 'wiki']);
});
