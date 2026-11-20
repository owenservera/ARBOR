# File: apps/vivim-host/test/control-browser-session.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/control-browser-session.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4715 B |
| Lines | 86 |
| Hash | ee4848fbf207 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| time | variable | 10 | no | let time = 100000; |
| store | const | 11 | no | const store = createControlBrowserSessions({now:()=&gt;time,codeTtlMs:1000,sessionTtlMs:2000}); |
| expired | const | 12 | no | const expired = store.issue(); |
| issued | const | 15 | no | const issued = store.issue(); |
| opened | const | 16 | no | const opened = store.exchange(issued.code); |
| req | const | 18 | no | const req = { headers: { cookie: UI_COOKIE + &#39;=&#39; + opened.sessionId } }; |
| live | const | 28 | no | const live = store.exchange(store.issue().code); |
| other | const | 29 | no | const other = {headers:{cookie:UI_COOKIE+&#39;=&#39;+live.sessionId}}; |
| dataRoot | const | 35 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-browser-session-&#39;)); |
| owner | const | 36 | no | const owner = &#39;test-local-owner-capability-of-adequate-length&#39;; |
| server | const | 37 | no | const server = createHostServer({dataRoot,ownerToken:owner}); |
| closed | const | 40 | no | const closed=new Promise(resolve=&gt;server.close(resolve)); |
| base | const | 46 | no | const base = &#39;http://127.0.0.1:&#39; + server.address().port; |
| headers | const | 47 | no | const headers = {&#39;origin&#39;:base,&#39;x-vivim-control&#39;:&#39;1&#39;,&#39;content-type&#39;:&#39;application/json&#39;}; |
| post | function | 48 | no | const post = (route,body,extra={}) =&gt; fetch(base + &#39;/api/host/control/&#39; + route, {method:&#39;POST&#39;,headers:{...headers,...extra},body:JSON.stringify(body)}); |
| issued | const | 52 | no | const issued = await post(&#39;ui-session&#39;,{}, {authorization:&#39;Bearer &#39;+owner}); |
| exchanged | const | 57 | no | const exchanged = await post(&#39;ui-exchange&#39;,{code}); |
| setCookie | const | 59 | no | const setCookie = exchanged.headers.get(&#39;set-cookie&#39;); |
| cookie | const | 62 | no | const cookie = setCookie.split(&#39;;&#39;)[0]; |
| session | const | 66 | no | const session = await fetch(base+&#39;/api/host/control/ui-state&#39;,{headers:{cookie}}); |
| withCsrf | const | 71 | no | const withCsrf = {cookie,&#39;x-vivim-ui-csrf&#39;:csrf}; |
| plan | const | 72 | no | const plan = await post(&#39;plan&#39;,{text:&#39;show my theme&#39;},withCsrf); |
| legacy | const | 80 | no | const legacy=await post(route,{grantId:&#39;a&#39;.repeat(32)},withCsrf); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../control/browser-session.mjs | import | 6 | [apps/vivim-host/control/browser-session.mjs](../control/browser-session.mjs.md) |
| ../server.mjs | import | 7 | [apps/vivim-host/server.mjs](../server.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createControlBrowserSessions, UI_COOKIE } from '../control/browser-session.mjs';
import { createHostServer } from '../server.mjs';

test('single-use browser launch code, expiry, per-session CSRF and revocation', () => {
  let time = 100000;
  const store = createControlBrowserSessions({now:()=>time,codeTtlMs:1000,sessionTtlMs:2000});
  const expired = store.issue();
  time+=1001;
  assert.throws(()=>store.exchange(expired.code),/CONTROL_UI_CODE_UNKNOWN/);
  const issued = store.issue();
  const opened = store.exchange(issued.code);
  assert.throws(()=>store.exchange(issued.code),/CONTROL_UI_CODE_UNKNOWN/);
  const req = { headers: { cookie: UI_COOKIE + '=' + opened.sessionId } };
  assert.equal(store.authorized(req),true);
  assert.equal(store.authorized(req,{mutate:true}),false);
  req.headers['x-vivim-ui-csrf'] = opened.csrf;
  assert.equal(store.authorized(req,{mutate:true}),true);
  req.headers['x-vivim-ui-csrf'] = 'forged';
  assert.equal(store.authorized(req,{mutate:true}),false);
  delete req.headers['x-vivim-ui-csrf'];
  store.revoke(req);
  assert.equal(store.authorized(req),false);
  const live = store.exchange(store.issue().code);
  const other = {headers:{cookie:UI_COOKIE+'='+live.sessionId}};
  time+=2001;
  assert.equal(store.authorized(other),false);
});

test('actual loopback Host exchanges native code for HttpOnly session and requires CSRF for actions', async t => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-browser-session-'));
  const owner = 'test-local-owner-capability-of-adequate-length';
  const server = createHostServer({dataRoot,ownerToken:owner});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{
    const closed=new Promise(resolve=>server.close(resolve));
    server.closeAllConnections?.();
    await closed;
    // Windows releases handles lazily; retry instead of failing on transient EPERM/EBUSY.
    rmSync(dataRoot,{recursive:true,force:true,maxRetries:10,retryDelay:300});
  });
  const base = 'http://127.0.0.1:' + server.address().port;
  const headers = {'origin':base,'x-vivim-control':'1','content-type':'application/json'};
  const post = (route,body,extra={}) => fetch(base + '/api/host/control/' + route,
    {method:'POST',headers:{...headers,...extra},body:JSON.stringify(body)});
  assert.equal((await post('ui-session',{})).status,401);
  assert.equal((await post('ui-session',{}, {authorization:'Bearer '+owner,origin:'https://attacker.invalid'})).status,403);
  const issued = await post('ui-session',{}, {authorization:'Bearer '+owner});
  assert.equal(issued.status,201);
  const {code} = await issued.json();
  assert.match(code,/^[a-f0-9]{64}$/);
  assert.equal((await post('ui-exchange',{code}, {origin:'https://attacker.invalid'})).status,403);
  const exchanged = await post('ui-exchange',{code});
  assert.equal(exchanged.status,200);
  const setCookie = exchanged.headers.get('set-cookie');
  assert.match(setCookie,/HttpOnly/);
  assert.match(setCookie,/SameSite=Strict/);
  const cookie = setCookie.split(';')[0];
  const {csrf} = await exchanged.json();
  assert.match(csrf,/^[a-f0-9]{64}$/);
  assert.equal((await post('ui-exchange',{code})).status,403);
  const session = await fetch(base+'/api/host/control/ui-state',{headers:{cookie}});
  assert.equal(session.status,200);
  assert.equal((await session.json()).csrf,csrf);
  assert.equal((await fetch(base+'/api/host/control/catalog',{headers:{cookie}})).status,200);
  assert.equal((await post('plan',{text:'show my theme'},{cookie})).status,401);
  const withCsrf = {cookie,'x-vivim-ui-csrf':csrf};
  const plan = await post('plan',{text:'show my theme'},withCsrf);
  assert.equal(plan.status,200);
  assert.equal((await plan.json()).outcome,'done');
  assert.equal((await post('plan',{text:'show my theme'},
    {...withCsrf,origin:'https://attacker.invalid'})).status,403);
  // Old direct grant routes remain addressable for a clear migration error,
  // but can never mutate grants outside the typed R2 owner approval journal.
  for(const route of ['devices/approve','devices/revoke']){
    const legacy=await post(route,{grantId:'a'.repeat(32)},withCsrf);
```

_First 80 of 87 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
