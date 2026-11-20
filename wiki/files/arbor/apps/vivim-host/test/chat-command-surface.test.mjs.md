# File: apps/vivim-host/test/chat-command-surface.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/chat-command-surface.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14577 B |
| Lines | 278 |
| Hash | e3bd9031c670 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| src | const | 13 | no | const src = readFileSync(fileURLToPath(new URL(&#39;../public/pages/chat.js&#39;, import.meta.url)), &#39;utf8&#39;); |
| ownerToken | const | 14 | no | const ownerToken = randomBytes(32).toString(&#39;hex&#39;); |
| tick | function | 15 | no | const tick = () =&gt; new Promise(resolve =&gt; setTimeout(resolve, 10)); |
| dom | function | 23 | no | function dom() { |
| Node | class | 24 | no | class Node { |
| constructor | method | 25 | yes | constructor(tag = &#39;div&#39;) { |
| append | method | 37 | yes | append(...children) { this.children.push(...children); } |
| replaceChildren | method | 38 | yes | replaceChildren(...children) { this.children = [...children]; } |
| addEventListener | method | 39 | yes | addEventListener(kind, handler) { (this.listeners[kind] \|\|= []).push(handler); } |
| fire | method | 40 | yes | async fire(kind, event = {}) { |
| focus | method | 45 | yes | focus() {} |
| setAttribute | method | 46 | yes | setAttribute(name,value){this.attributes[name]=value;} |
| elements | const | 48 | no | const elements = new Map([&#39;log&#39;, &#39;rev&#39;, &#39;f&#39;, &#39;t&#39;, &#39;send&#39;, &#39;control-status&#39;, &#39;control-result&#39;, &#39;control-recent&#39;, &#39;control-logout&#39;,&#39;composer-assist&#39;].map(id =&gt; [id, new Node()])); |
| all | function | 50 | no | const all = root =&gt; [root, ...root.children.flatMap(child =&gt; all(child))]; |
| text | function | 51 | no | const text = id =&gt; all(elements.get(id)).map(n =&gt; n.textContent).join(&#39; &#39;); |
| buttons | function | 52 | no | const buttons = id =&gt; all(elements.get(id)).filter(n =&gt; n.tagName === &#39;BUTTON&#39;); |
| document | const | 53 | no | const document={getElementById:id=&gt;elements.get(id)\|\|null,createElement:tag=&gt;new Node(tag),addEventListener(){}}; |
| withHost | function | 57 | no | async function withHost(fn) { |
| root | const | 58 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-chat-command-&#39;)); |
| server | variable | 59 | no | let server = createHostServer({ dataRoot: root, ownerToken }); |
| base | variable | 61 | no | let base = &#39;http://127.0.0.1:&#39; + server.address().port; |
| send | function | 62 | no | const send = (route, body, headers = {}) =&gt; fetch(base + route, { method: &#39;POST&#39;, headers: { origin: base, &#39;content-type&#39;: &#39;application/json&#39;, ...headers }, body: JSON.stringify(body) }); |
| restart | function | 67 | no | const restart = async () =&gt; { |
| openSession | function | 81 | no | async function openSession(send) { |
| issued | const | 82 | no | const issued = await send(&#39;/api/host/control/ui-session&#39;, {}, { authorization: &#39;Bearer &#39; + ownerToken, &#39;x-vivim-control&#39;: &#39;1&#39; }); |
| browser | function | 88 | no | function browser(base, code = &#39;&#39;, shared = { cookie: &#39;&#39;, executeCount: 0, loseResponse: false }) { |
| ui | const | 89 | no | const ui = dom(); |
| window | const | 90 | no | const window = { |
| browserFetch | function | 94 | no | async function browserFetch(route, opts = {}) { |
| h | const | 95 | no | const h = new Headers(opts.headers \|\| {}); |
| response | const | 99 | no | const response = await fetch(base + route, { ...opts, headers: h }); |
| entry | const | 110 | no | const entry=src.replace(&quot;import { resolveDesktopDestination, resolveProductRoute } from &#39;/mobile/control-language.mjs&#39;;&quot;,&#39;&#39;) |
| findButton | function | 116 | no | const findButton = (ui, text) =&gt; ui.buttons(&#39;control-result&#39;).find(b =&gt; b.textContent.includes(text)); |
| grant | const | 120 | no | const grant = await send(&#39;/api/host/bootstrap/grant&#39;, { scope: &#39;onboarding-visual&#39; }, { authorization: &#39;Bearer &#39; + ownerToken, &#39;x-vivim-bootstrap&#39;: &#39;1&#39; }); |
| code | const | 124 | no | const code = await openSession(send); |
| shared | const | 125 | no | const shared = { cookie: &#39;&#39;, executeCount: 0, loseResponse: false }; |
| readTheme | function | 133 | no | const readTheme = async () =&gt; { |
| res | const | 134 | no | const res = await send(&#39;/api/host/control/plan&#39;, { actionId: &#39;ui.theme.show&#39;, args: {} }, { authorization: &#39;Bearer &#39; + ownerToken, &#39;x-vivim-control&#39;: &#39;1&#39; }); |
| approve | const | 142 | no | const approve = findButton(ui, &#39;Approve &amp; apply on PC&#39;); |
| entries | const | 150 | no | const entries = await (await fetch(base + &#39;/api/journal&#39;)).json(); |
| reload | const | 153 | no | const reload = browser(base, &#39;&#39;, shared); |
| shared | const | 161 | no | const shared = { cookie: &#39;&#39;, executeCount: 0, loseResponse: false }; |
| state | const | 168 | no | const state = await (await fetch(base + &#39;/api/state&#39;)).json(); |
| shared | const | 177 | no | const shared = { cookie: &#39;&#39;, executeCount: 0, loseResponse: false }; |
| themeFromHost | function | 194 | no | async function themeFromHost(send) { |
| response | const | 195 | no | const response = await send(&#39;/api/host/control/plan&#39;, { actionId: &#39;ui.theme.show&#39;, args: {} }, { authorization: &#39;Bearer &#39; + ownerToken, &#39;x-vivim-control&#39;: &#39;1&#39; }); |
| plan | const | 199 | no | const plan = await response.json(); |
| shared | const | 206 | no | const shared = { cookie: &#39;&#39;, executeCount: 0, loseResponse: false }; |
| ui | const | 207 | no | const ui = browser(base, await openSession(send), shared).ui; |
| before | const | 221 | no | const before = (await themeFromHost(send)).preset; |
| cancel | const | 225 | no | const cancel = findButton(ui, &#39;Cancel · no Host change&#39;); |
| loggedOut | const | 233 | no | const loggedOut = await send(&#39;/api/host/control/ui-logout&#39;, {}, { cookie: shared.cookie, &#39;x-vivim-control&#39;: &#39;1&#39;, &#39;x-vivim-ui-csrf&#39;: shared.csrf }); |
| shared | const | 251 | no | const shared = { cookie: &#39;&#39;, executeCount: 0, loseResponse: false }; |
| ui | const | 252 | no | const ui = browser(base, await openSession(send), shared).ui; |
| approve | const | 256 | no | const approve = findButton(ui, &#39;Approve &amp; apply on PC&#39;); |
| afterRestart | const | 263 | no | const afterRestart = await restart(); |
| previous | const | 266 | no | const previous = await fetch(afterRestart.base + &#39;/api/host/control/recent&#39;, { headers: { authorization: &#39;Bearer &#39; + ownerToken } }); |
| recent | const | 269 | no | const recent = (await previous.json()).items; |
| reopened | const | 273 | no | const reopened = browser(afterRestart.base, await openSession(send), { cookie: &#39;&#39;, executeCount: 0, loseResponse: false }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:url | import | 4 | external |
| node:path | import | 5 | external |
| node:os | import | 6 | external |
| node:vm | import | 7 | external |
| ../../mobile-relay/control-language.mjs | import | 8 | [apps/mobile-relay/control-language.mjs](../../mobile-relay/control-language.mjs.md) |
| ../../mobile-relay/composer-assist.mjs | import | 9 | [apps/mobile-relay/composer-assist.mjs](../../mobile-relay/composer-assist.mjs.md) |
| node:crypto | import | 10 | external |
| ../server.mjs | import | 11 | [apps/vivim-host/server.mjs](../server.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { resolveDesktopDestination, resolveProductRoute } from '../../mobile-relay/control-language.mjs';
import { mountComposerAssist } from '../../mobile-relay/composer-assist.mjs';
import { randomBytes } from 'node:crypto';
import { createHostServer } from '../server.mjs';

const src = readFileSync(fileURLToPath(new URL('../public/pages/chat.js', import.meta.url)), 'utf8');
const ownerToken = randomBytes(32).toString('hex');
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
async function until(testFn) {
  for (let i = 0; i < 150; i++) {
    if (testFn()) return;
    await tick();
  }
  assert.fail('Timed out waiting for the Chat UI to render');
}
function dom() {
  class Node {
    constructor(tag = 'div') {
      this.tagName = tag.toUpperCase();
      this.textContent = '';
      this.className = '';
      this.disabled = false;
      this.hidden = false;
      this.value = '';
      this.children = [];
      this.listeners = {};this.attributes={};this.dataset={};
      this.scrollHeight = 0;
      this.scrollTop = 0;
    }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = [...children]; }
    addEventListener(kind, handler) { (this.listeners[kind] ||= []).push(handler); }
    async fire(kind, event = {}) {
      await Promise.all((this.listeners[kind] || []).map(fn => fn({
        preventDefault() {}, ...event
      })));
    }
    focus() {}
    setAttribute(name,value){this.attributes[name]=value;}
  }
  const elements = new Map(['log', 'rev', 'f', 't', 'send', 'control-status',
    'control-result', 'control-recent', 'control-logout','composer-assist'].map(id => [id, new Node()]));
  const all = root => [root, ...root.children.flatMap(child => all(child))];
  const text = id => all(elements.get(id)).map(n => n.textContent).join(' ');
  const buttons = id => all(elements.get(id)).filter(n => n.tagName === 'BUTTON');
  const document={getElementById:id=>elements.get(id)||null,createElement:tag=>new Node(tag),addEventListener(){}};
  for(const node of elements.values())node.ownerDocument=document;
  return {elements,text,buttons,document};
}
async function withHost(fn) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-chat-command-'));
  let server = createHostServer({ dataRoot: root, ownerToken });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let base = 'http://127.0.0.1:' + server.address().port;
  const send = (route, body, headers = {}) => fetch(base + route, {
    method: 'POST', headers: { origin: base, 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  // Restart the actual Host on the same data directory, not a mocked projection.
  const restart = async () => {
    await new Promise(resolve => server.close(resolve));
    server = createHostServer({ dataRoot: root, ownerToken });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = 'http://127.0.0.1:' + server.address().port;
    return { base, send };
  };
  try { await fn({ base, send, restart }); }
  finally {
    await new Promise(resolve => server.close(resolve));
    try { rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 }); }
    catch { /* Windows SQLite handles can close after the Host listener */ }
  }
}
```

_First 80 of 279 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
