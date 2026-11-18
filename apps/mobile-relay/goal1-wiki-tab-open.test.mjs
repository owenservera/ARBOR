import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const app = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const render = readFileSync(new URL('./ux/render.mjs', import.meta.url), 'utf8');
const model = readFileSync(new URL('./ux/model.mjs', import.meta.url), 'utf8');

function functionSource(src, name) {
  const start = src.indexOf('function ' + name + '(');
  assert.notEqual(start, -1);
  const body = src.indexOf('{', start);
  let depth = 0;
  for (let i = body; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error('Unclosed function ' + name);
}

test('Wiki has an actual accessible tab panel', () => {
  assert.match(html, /id="tab-wiki"[^>]*role="tab"[^>]*aria-controls="v-wiki"/);
  assert.match(html, /id="v-wiki"[^>]*role="tabpanel"/);
  assert.match(model, /TABS[^\n]*'wiki'/);
});

test('Wiki navigation stays inside the PWA and refreshes actual Host state', () => {
  const events = [];
  const sandbox = {
    S: { tab: 'talk' }, TABS: ['talk', 'wiki'], HOST_PREVIEW: false,
    dockExpanded: false, chatContextEpoch: 0, chatContext: null,
    closeDrawer() {}, renderTabs() { events.push('tabs'); },
    renderSurfaces() { events.push('surface'); }, refreshWiki() { events.push('read'); },
    refreshMedia() {}, playerActive: false, stopMediaPlayer() {},
    document: { getElementById: () => ({ scrollIntoView() {} }) }
  };
  vm.createContext(sandbox);
  vm.runInContext(functionSource(app, 'goTab'), sandbox);
  sandbox.goTab('wiki');
  assert.equal(sandbox.S.tab, 'wiki');
  assert.deepEqual(events, ['tabs', 'surface', 'read']);
});

test('Wiki projection is read-only, scoped, and renders text safely', () => {
  assert.match(app, /fetch\(HOST_PREVIEW \? '\/api\/wiki' : '\/mobile\/api\/wiki'/);
  assert.match(app, /control:read/);
  assert.match(functionSource(app, 'renderWiki'), /replaceChildren/);
  assert.doesNotMatch(functionSource(app, 'renderWiki'), /innerHTML|insertAdjacentHTML/);
  assert.doesNotMatch(render, /location\.assign\('\/wiki'\)/);
});
