# File: apps/vivim-host/test/wiki-visual-contract.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/wiki-visual-contract.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 25792 B |
| Lines | 408 |
| Hash | 8d044d09a013 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| here | const | 11 | no | const here = path.dirname(fileURLToPath(import.meta.url)); |
| pages | const | 12 | no | const pages = path.resolve(here, &#39;../public/pages&#39;); |
| script | const | 13 | no | const script = readFileSync(path.join(pages, &#39;wiki.js&#39;), &#39;utf8&#39;); |
| html | const | 14 | no | const html = readFileSync(path.join(pages, &#39;wiki.html&#39;), &#39;utf8&#39;); |
| css | const | 15 | no | const css = readFileSync(path.join(pages, &#39;wiki.css&#39;), &#39;utf8&#39;); |
| ids | const | 16 | no | const ids = [...html.matchAll(/\\bid=&quot;([a-z-]+)&quot;/g)].map(match =&gt; match[1]); |
| MockNode | class | 18 | no | class MockNode { |
| constructor | method | 19 | yes | constructor(tag) { |
| appendChild | method | 24 | yes | appendChild(child) { this.children.push(child); return child; } |
| append | method | 25 | yes | append(...children){this.children.push(...children);} |
| replaceChildren | method | 26 | yes | replaceChildren(...children) { this.children = [...children]; this.repaints++; } |
| addEventListener | method | 27 | yes | addEventListener(name, callback) { (this.listeners[name] \|\|= []).push(callback); } |
| setAttribute | method | 28 | yes | setAttribute(name, value) { this.attributes[name] = value; } |
| focus | method | 29 | yes | focus() { this.focused = true; } |
| fire | method | 30 | yes | fire(name, event = {}) { for (const fn of this.listeners[name] \|\| []) fn({ preventDefault() {}, ...event }); } |
| clone | function | 32 | no | const clone = x =&gt; JSON.parse(JSON.stringify(x)); |
| baseWiki | const | 33 | no | const baseWiki = { revision: 1, pages: { Main: { sections: { About: &#39;&lt;img src=x onerror=alert(1)&gt;&#39;, HowTo: &#39;First\\nSecond&#39; } } } }; |
| anchorId | const | 34 | no | const anchorId=&#39;hq:file-anchor:&#39;+&#39;b&#39;.repeat(64), fingerprint=&#39;c&#39;.repeat(64),sourceDigest=&#39;d&#39;.repeat(64); |
| baseSurface | const | 35 | no | const baseSurface = { authority:&#39;read_only_projection&#39;,schema: &#39;vivim.file-surface/1&#39;, generatorVersion: &#39;hq.source-index/1&#39;, status: &#39;indexed&#39;, files: [ |
| allChildren | function | 38 | no | function allChildren(node) { return [node, ...node.children.flatMap(allChildren)]; } |
| setup | function | 39 | no | function setup() { |
| elements | const | 40 | no | const elements = new Map(ids.map(id =&gt; [id, new MockNode(id)])); |
| docs | const | 41 | no | const docs = { |
| postStatus | variable | 51 | no | let postStatus = 200, postThrows = false, getFailure = null, ownerSession = true; |
| interpretStatus | variable | 52 | no | let interpretStatus = 200; |
| meaning | variable | 53 | no | let meaning = { schema: &#39;vivim.control-language/1&#39;, outcome: &#39;candidate&#39;, |
| interpretCalls | const | 56 | no | const interpretCalls = []; |
| posts | const | 57 | no | const posts = []; |
| interval | variable | 58 | no | let interval = null; |
| fetch | function | 59 | no | const fetch = async (url, options = {}) =&gt; { |
| body | const | 95 | no | const body = JSON.parse(options.body); |
| ack | const | 105 | no | const ack = { ...body, wikiRevision: docs[&#39;/api/wiki&#39;].revision, revision: docs[&#39;/api/state&#39;].revision, receivedAt: &#39;2026-11-14T22:00:00Z&#39; }; |
| document | const | 114 | no | const document = { getElementById: id =&gt; { |
| context | const | 119 | no | const context = vm.createContext({ resolveDesktopDestination, resolveProductRoute, mountComposerAssist, sourceCards,sameSourceCard,matchesSourceContext,exactSourceContextUrl,reconcileSourceCards, doc… |
| el | function | 121 | no | const el = id =&gt; elements.get(id); |
| settle | function | 129 | no | async function settle() { for (let i = 0; i &lt; 8; i++) await new Promise(resolve =&gt; setImmediate(resolve)); } |
| ui | const | 152 | no | const ui = setup(); await settle(); |
| wikiNodes | const | 158 | no | const wikiNodes = allChildren(ui.el(&#39;wiki-view&#39;)); |
| surfaceNodes | const | 161 | no | const surfaceNodes = allChildren(ui.el(&#39;surface-view&#39;)); |
| repaints | const | 167 | no | const repaints = [&#39;wiki&#39;, &#39;surface&#39;, &#39;journal&#39;].map(k =&gt; ui.el(k + &#39;-view&#39;).repaints); |
| ui | const | 179 | no | const ui = setup(); await settle(); |
| rendered | const | 182 | no | const rendered = allChildren(ui.el(&#39;surface-context-view&#39;)); |
| ui | const | 197 | no | const ui = setup(); await settle(); |
| nodes | const | 216 | no | const nodes = allChildren(ui.el(&#39;context-view&#39;)); |
| ui | const | 231 | no | const ui = setup(); await settle(); |
| nodes | const | 242 | no | const nodes = allChildren(ui.el(&#39;context-view&#39;)); |
| ui | const | 255 | no | const ui = setup(); await settle(); |
| sentence | const | 256 | no | const sentence = &#39;edit wiki section main/about saying Voice notes are now our active priority&#39;; |
| sentence | const | 279 | no | const sentence = &#39;edit wiki section main/about saying Voice notes are now our active priority&#39;; |
| typed | function | 280 | no | const typed = (target, content) =&gt; ({ schema: &#39;vivim.control-language/1&#39;, outcome: &#39;candidate&#39;, candidate: { actionId: &#39;wiki.section.edit&#39;, args: { target, content } } }); |
| ui | const | 290 | no | const ui = setup(); await settle(); |
| ambiguous | const | 299 | no | const ambiguous = setup(); await settle(); |
| denied | const | 309 | no | const denied = setup(); await settle(); |
| stale | const | 316 | no | const stale = setup(); await settle(); |
| ui | const | 328 | no | const ui = setup(); await settle(); |
| edit | const | 329 | no | const edit = allChildren(ui.el(&#39;wiki-view&#39;)).find(n =&gt; n.tagName === &#39;button&#39; &amp;&amp; /Main\\/HowTo/.test(n.attributes[&#39;aria-label&#39;])); |
| ui | const | 370 | no | const ui = setup(); await settle(); |
| edit | const | 371 | no | const edit = allChildren(ui.el(&#39;wiki-view&#39;)).find(n =&gt; n.tagName === &#39;button&#39; &amp;&amp; /Main\\/About/.test(n.attributes[&#39;aria-label&#39;])); |
| ui | const | 385 | no | const ui = setup(); await settle(); |
| edit | const | 386 | no | const edit = allChildren(ui.el(&#39;wiki-view&#39;)).find(n =&gt; n.tagName === &#39;button&#39; &amp;&amp; /Main\\/About/.test(n.attributes[&#39;aria-label&#39;])); |
| ui | const | 398 | no | const ui = setup(); await settle(); |
| edit | const | 400 | no | const edit = allChildren(ui.el(&#39;wiki-view&#39;)).find(n =&gt; n.tagName === &#39;button&#39; &amp;&amp; /Main\\/HowTo/.test(n.attributes[&#39;aria-label&#39;])); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:url | import | 4 | external |
| node:path | import | 5 | external |
| node:vm | import | 6 | external |
| ../../mobile-relay/control-language.mjs | import | 7 | [apps/mobile-relay/control-language.mjs](../../mobile-relay/control-language.mjs.md) |
| ../../mobile-relay/composer-assist.mjs | import | 8 | [apps/mobile-relay/composer-assist.mjs](../../mobile-relay/composer-assist.mjs.md) |
| ../../mobile-relay/wiki-source-view.mjs | import | 9 | [apps/mobile-relay/wiki-source-view.mjs](../../mobile-relay/wiki-source-view.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
  let interval = null;
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
```

_First 80 of 409 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
