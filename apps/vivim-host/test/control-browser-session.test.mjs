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
    assert.equal(legacy.status,409);
    assert.equal((await legacy.json()).code,'CONTROL_ACTION_PLAN_REQUIRED');
  }
  assert.equal((await post('ui-logout',{},withCsrf)).status,200);
  assert.equal((await fetch(base+'/api/host/control/catalog',{headers:{cookie}})).status,401);
});
