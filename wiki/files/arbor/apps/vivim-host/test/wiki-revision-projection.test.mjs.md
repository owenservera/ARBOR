# File: apps/vivim-host/test/wiki-revision-projection.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/wiki-revision-projection.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7771 B |
| Lines | 123 |
| Hash | 2423ba37d617 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| here | const | 12 | no | const here = path.dirname(fileURLToPath(import.meta.url)); |
| pages | const | 13 | no | const pages = path.resolve(here, &#39;../public/pages&#39;); |
| script | const | 14 | no | const script = readFileSync(path.join(pages, &#39;wiki.js&#39;), &#39;utf8&#39;); |
| css | const | 15 | no | const css = readFileSync(path.join(pages, &#39;wiki.css&#39;), &#39;utf8&#39;); |
| ids | const | 16 | no | const ids = [...readFileSync(path.join(pages, &#39;wiki.html&#39;), &#39;utf8&#39;).matchAll(/\\bid=&quot;([a-z-]+)&quot;/g)].map(m =&gt; m[1]); |
| MockNode | class | 18 | no | class MockNode { |
| constructor | method | 19 | yes | constructor(tag) { |
| appendChild | method | 24 | yes | appendChild(child) { this.children.push(child); return child; } |
| replaceChildren | method | 25 | yes | replaceChildren(...children) { this.children = [...children]; this.repaints++; } |
| addEventListener | method | 26 | yes | addEventListener(name, callback) { (this.listeners[name] \|\|= []).push(callback); } |
| setAttribute | method | 27 | yes | setAttribute(name, value) { this.attributes[name] = value; } |
| focus | method | 28 | yes | focus() { this.focused = true; } |
| fire | method | 29 | yes | fire(name, event = {}) { for (const fn of this.listeners[name] \|\| []) fn({ preventDefault() {}, ...event }); } |
| clone | function | 31 | no | const clone = x =&gt; JSON.parse(JSON.stringify(x)); |
| allChildren | function | 32 | no | function allChildren(node) { return [node, ...node.children.flatMap(allChildren)]; } |
| setup | function | 33 | no | function setup() { |
| elements | const | 34 | no | const elements = new Map(ids.map(id =&gt; [id, new MockNode(id)])); |
| docs | const | 35 | no | const docs = { |
| fetch | function | 42 | no | const fetch = async url =&gt; { |
| document | const | 47 | no | const document = { getElementById: id =&gt; elements.get(id), createElement: name =&gt; new MockNode(name), addEventListener() {}, hidden: false }; |
| interval | variable | 48 | no | let interval = null; |
| context | const | 49 | no | const context = vm.createContext({ document, fetch, setInterval: fn =&gt; { interval = fn; return 1; }, AbortSignal, TextEncoder, Date, console }); |
| settle | function | 53 | no | async function settle() { for (let i = 0; i &lt; 8; i++) await new Promise(resolve =&gt; setImmediate(resolve)); } |
| sectionNodes | function | 54 | no | const sectionNodes = ui =&gt; allChildren(ui.el(&#39;wiki-view&#39;)).filter(node =&gt; node.dataset?.wikiId); |
| sectionNode | function | 55 | no | const sectionNode = (ui, id) =&gt; sectionNodes(ui).find(node =&gt; node.dataset.wikiId === id); |
| ui | const | 58 | no | const ui = setup(); await settle(); |
| about | const | 61 | no | const about = sectionNode(ui, &#39;Main/About&#39;); |
| howTo | const | 62 | no | const howTo = sectionNode(ui, &#39;Main/HowTo&#39;); |
| repaints | const | 64 | no | const repaints = ui.el(&#39;wiki-view&#39;).repaints; |
| aboutButton | const | 65 | no | const aboutButton = about.children[0].children[1]; |
| changed | const | 79 | no | const changed = sectionNode(ui, &#39;Main/HowTo&#39;); |
| movedAbout | const | 103 | no | const movedAbout = sectionNode(ui, &#39;Main/About&#39;); |
| ui | const | 114 | no | const ui = setup(); await settle(); |
| repaints | const | 115 | no | const repaints = ui.el(&#39;wiki-view&#39;).repaints; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 5 | external |
| node:assert/strict | import | 6 | external |
| node:fs | import | 7 | external |
| node:url | import | 8 | external |
| node:path | import | 9 | external |
| node:vm | import | 10 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 123 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
