# File: apps/vivim-host/test/control-panel-browser.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/control-panel-browser.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7881 B |
| Lines | 136 |
| Hash | 8fa18a35e445 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| js | const | 7 | no | const js = readFileSync(fileURLToPath(new URL(&#39;../public/control-panel.js&#39;, import.meta.url)), &#39;utf8&#39;); |
| FakeNode | class | 8 | no | class FakeNode { |
| constructor | method | 9 | yes | constructor(tag = &#39;div&#39;) { |
| append | method | 13 | yes | append(...nodes) { this.children.push(...nodes); } |
| replaceChildren | method | 14 | yes | replaceChildren(...nodes) { this.children = [...nodes]; } |
| addEventListener | method | 15 | yes | addEventListener(name, cb) { this.listeners.set(name, cb); } |
| trigger | method | 16 | yes | async trigger(name, event = {}) { return this.listeners.get(name)?.(event); } |
| focus | method | 17 | yes | focus() {} |
| content | function | 19 | no | const content = node =&gt; [node.textContent, ...node.children.map(x =&gt; x instanceof FakeNode ? content(x) : String(x))].join(&#39; &#39;); |
| find | function | 21 | no | const find = (node, needle) =&gt; { |
| hit | const | 24 | no | const hit = find(child, needle); if (hit) return hit; |
| tick | function | 28 | no | const tick = () =&gt; new Promise(resolve =&gt; setImmediate(resolve)); |
| ids | const | 31 | no | const ids = [&#39;host-command-form&#39;,&#39;host-control-unlock&#39;,&#39;host-control-lock&#39;, |
| nodes | const | 35 | no | const nodes = new Map(ids.map(id =&gt; [id, new FakeNode(id)])); |
| calls | const | 36 | no | const calls = []; |
| code | const | 37 | no | const code = &#39;a&#39;.repeat(64), csrf = &#39;b&#39;.repeat(64); |
| plan | const | 38 | no | const plan = { outcome:&#39;approval_required&#39;,title:&#39;Choose visual theme&#39;,actionId:&#39;ui.theme.set_preset&#39;, |
| receipt | const | 42 | no | const receipt = { schema:&#39;vivim.control-receipt/1&#39;,planId:plan.planId,planDigest:plan.planDigest, |
| cookie | variable | 45 | no | let cookie = false; |
| fakeFetch | function | 46 | no | const fakeFetch = async (url, opts = {}) =&gt; { |
| route | const | 48 | no | const route = url.split(&#39;/control/&#39;)[1]; |
| data | const | 56 | no | const data = route === &#39;catalog&#39; ? {actions:[{actionId:plan.actionId,title:plan.title, |
| location | const | 71 | no | const location = {hash:&#39;#control-session=&#39;+code,pathname:&#39;/&#39;,search:&#39;&#39;}; |
| history | const | 72 | no | const history = {replaceState(_state,_title,url) { assert.equal(url,&#39;/&#39;); location.hash=&#39;&#39;; }}; |
| context | const | 73 | no | const context = { document:{ |
| text | const | 87 | no | const text = nodes.get(&#39;host-command-text&#39;), form = nodes.get(&#39;host-command-form&#39;); |
| approval | const | 92 | no | const approval = find(nodes.get(&#39;host-control-result&#39;),&#39;Approve &amp; apply on PC&#39;); |
| planned | const | 94 | no | const planned = calls.find(x=&gt;x.url.endsWith(&#39;/plan&#39;) &amp;&amp; JSON.parse(x.opts.body).text); |
| executions | const | 98 | no | const executions = calls.filter(x=&gt;x.url.endsWith(&#39;/execute&#39;)); |
| historic | const | 103 | no | const historic = find(nodes.get(&#39;host-control-recent&#39;),&#39;View receipt&#39;); |
| quick | const | 107 | no | const quick=nodes.get(&#39;host-remember-preference&#39;); |
| review | const | 108 | no | const review=nodes.get(&#39;host-remember-review&#39;); |
| beforeQuick | const | 111 | no | const beforeQuick=calls.filter(x=&gt;x.url.endsWith(&#39;/execute&#39;)).length; |
| lastPlan | const | 113 | no | const lastPlan=calls.filter(x=&gt;x.url.endsWith(&#39;/plan&#39;)).at(-1); |
| remove | const | 120 | no | const remove=find(nodes.get(&#39;host-preferences-list&#39;),&#39;Review removal&#39;); |
| lastRemoval | const | 123 | no | const lastRemoval=calls.filter(x=&gt;x.url.endsWith(&#39;/plan&#39;)).at(-1); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:url | import | 4 | external |
| node:vm | import | 5 | external |

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
import vm from 'node:vm';

const js = readFileSync(fileURLToPath(new URL('../public/control-panel.js', import.meta.url)), 'utf8');
class FakeNode {
  constructor(tag = 'div') {
    this.tagName = tag; this.children = []; this.listeners = new Map(); this.value = '';
    this.disabled = false; this.hidden = false; this.textContent = ''; this.type = '';
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  addEventListener(name, cb) { this.listeners.set(name, cb); }
  async trigger(name, event = {}) { return this.listeners.get(name)?.(event); }
  focus() {}
}
const content = node => [node.textContent, ...node.children.map(x =>
  x instanceof FakeNode ? content(x) : String(x))].join(' ');
const find = (node, needle) => {
  if (node.tagName === 'button' && node.textContent.includes(needle)) return node;
  for (const child of node.children) if (child instanceof FakeNode) {
    const hit = find(child, needle); if (hit) return hit;
  }
  return null;
};
const tick = () => new Promise(resolve => setImmediate(resolve));

test('native session → exact text plan → explicit approval → receipt and lock', async () => {
  const ids = ['host-command-form','host-control-unlock','host-control-lock',
    'host-command-text','host-command-submit','host-control-examples','host-control-catalog',
    'host-control-result','host-control-recent','host-control-auth-status','host-control-refresh',
    'host-remember-preference','host-remember-review','host-preferences-list','host-preferences-refresh'];
  const nodes = new Map(ids.map(id => [id, new FakeNode(id)]));
  const calls = [];
  const code = 'a'.repeat(64), csrf = 'b'.repeat(64);
  const plan = { outcome:'approval_required',title:'Choose visual theme',actionId:'ui.theme.set_preset',
    risk:'R1',args:{preset:'dusk'},planId:'ctl-1234567890abcdef',
    planDigest:'c'.repeat(64),expiresAt:new Date(Date.now() + 300000).toISOString(),
    liveAcceptance:'pending' };
  const receipt = { schema:'vivim.control-receipt/1',planId:plan.planId,planDigest:plan.planDigest,
    actionId:plan.actionId,status:'applied',at:new Date().toISOString(),result:{preset:'dusk'},
    undo:{actionId:'ui.theme.undo',args:{}},liveAcceptance:'pending' };
  let cookie = false;
  const fakeFetch = async (url, opts = {}) => {
    calls.push({url,opts});
    const route = url.split('/control/')[1];
    if (route === 'ui-exchange') {
      assert.deepEqual(JSON.parse(opts.body),{code});
      cookie = true;
      return {ok:true,status:200,json:async () => ({csrf,expiresAt:Date.now()+900000})};
    }
    if (!cookie || (opts.method === 'POST' && opts.headers?.['x-vivim-ui-csrf'] !== csrf))
      return {ok:false,status:401,json:async () => ({code:'OWNER_AUTH'})};
    const data = route === 'catalog' ? {actions:[{actionId:plan.actionId,title:plan.title,
      risk:'R1',category:'appearance',executable:true,args:{preset:{type:'enum',values:['dusk','ink']}},
      examples:['set my theme to dusk']}]} :
      route === 'recent' ? {items:[{planId:plan.planId,actionId:plan.actionId,state:'applied',createdAt:receipt.at}]} :
      route === 'plan' && JSON.parse(opts.body).actionId === 'personalization.preference.list'
        ? {outcome:'done',result:{state:'source-backed',preferences:[{
          id:'prf-owner-pref-'+'a'.repeat(24),value:'Compact layouts',source:'owner'
        }]}} :
      route === 'plan' ? plan :
      route === 'execute' ? receipt :
      route === 'ui-logout' ? {revoked:true} :
      route === 'plans/' + plan.planId ? {planId:plan.planId,state:'applied',actionId:plan.actionId,receipt} : {};
    if (route === 'ui-logout') cookie = false;
    return {ok:true,status:200,json:async () => data};
  };
  const location = {hash:'#control-session='+code,pathname:'/',search:''};
  const history = {replaceState(_state,_title,url) { assert.equal(url,'/'); location.hash=''; }};
  const context = { document:{
      getElementById:id => nodes.get(id),
      createElement:tag => new FakeNode(tag),
      createTextNode:value => String(value)
    },window:{addEventListener(){},location,history},
    fetch:fakeFetch,console,Date,JSON,Map,Object,String,encodeURIComponent };
  vm.runInNewContext(js, context, {filename:'control-panel.js'});
  await tick(); await tick();
```

_First 80 of 137 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
