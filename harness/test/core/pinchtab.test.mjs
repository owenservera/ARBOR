import test from 'node:test';
import assert from 'node:assert/strict';
import { connectPinchtab } from '../../src/core/pinchtab.mjs';

const BASE = 'http://127.0.0.1:9867';
const TOKEN = 'tok-SECRET-123';
const INSTANCE = 'inst_1';
const TABS_URL = `${BASE}/instances/${INSTANCE}/tabs`;

// Fake fetch: records every call, answers from a handler. No network, no server.
function fakeFetch(handler = () => ({ status: 200, body: [] })) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const call = {
      url: String(url),
      method: init.method ?? 'GET',
      headers: init.headers ?? {},
      body: init.body === undefined ? undefined : JSON.parse(init.body),
    };
    calls.push(call);
    const res = await handler(call);
    const status = res.status ?? 200;
    return { status, ok: status < 400, json: async () => res.body, text: async () => JSON.stringify(res.body ?? '') };
  };
  return { fetchImpl, calls };
}

const TAB_LIST = [{ id: 't1', instanceId: INSTANCE, url: 'https://x.test/a', title: 'A' }];

// Handler that answers the instance tab list and per-tab routes, and records everything.
function happyHandler(extra = {}) {
  return call => {
    if (call.url === TABS_URL) return { body: TAB_LIST };
    if (call.url === `${BASE}/instances/${INSTANCE}/tabs/open`) return { body: { tabId: 't1', url: call.body.url, title: 'A' } };
    if (extra[call.url]) return extra[call.url](call);
    return { body: { result: 'ok' } };
  };
}

async function connect(fetchImpl, overrides = {}) {
  return connectPinchtab({ baseUrl: BASE, instanceId: INSTANCE, token: TOKEN, fetchImpl, ...overrides });
}

// --- Safety rule 1: host / port / protocol ---

for (const baseUrl of [
  'http://localhost:9867',
  'http://[::1]:9867',
  'http://0.0.0.0:9867',
  'http://192.168.1.5:9867',
]) {
  test(`refuses baseUrl ${baseUrl}`, async () => {
    const { fetchImpl, calls } = fakeFetch();
    await assert.rejects(
      connectPinchtab({ baseUrl, instanceId: INSTANCE, token: TOKEN, fetchImpl }),
      { code: 'PINCHTAB_HOST_REFUSED' },
    );
    assert.equal(calls.length, 0);
  });
}

test('refuses port 9222', async () => {
  const { fetchImpl, calls } = fakeFetch();
  await assert.rejects(
    connectPinchtab({ baseUrl: 'http://127.0.0.1:9222', instanceId: INSTANCE, token: TOKEN, fetchImpl }),
    { code: 'PINCHTAB_HOST_REFUSED' },
  );
  assert.equal(calls.length, 0);
});

test('refuses non-http protocol on 127.0.0.1', async () => {
  const { fetchImpl, calls } = fakeFetch();
  await assert.rejects(
    connectPinchtab({ baseUrl: 'https://127.0.0.1:9867', instanceId: INSTANCE, token: TOKEN, fetchImpl }),
    { code: 'PINCHTAB_HOST_REFUSED' },
  );
  assert.equal(calls.length, 0);
});

// --- Safety rule 2: token ---

for (const token of ['', '   ', undefined]) {
  test(`refuses missing/empty token (${JSON.stringify(token)})`, async () => {
    const { fetchImpl, calls } = fakeFetch();
    await assert.rejects(
      connectPinchtab({ baseUrl: BASE, instanceId: INSTANCE, token, fetchImpl }),
      { code: 'PINCHTAB_TOKEN_REQUIRED' },
    );
    assert.equal(calls.length, 0);
  });
}

test('sends Authorization Bearer header on every request', async () => {
  const { fetchImpl, calls } = fakeFetch(happyHandler());
  const browser = await connect(fetchImpl);
  const page = await browser.attach('t1');
  await page.evaluate('1');
  await page.pressEnter();
  assert.ok(calls.length >= 3);
  for (const call of calls) assert.equal(call.headers.Authorization, `Bearer ${TOKEN}`);
});

test('token never appears in thrown errors (HTTP failure)', async () => {
  const { fetchImpl } = fakeFetch(() => ({ status: 500, body: { error: 'boom' } }));
  const browser = await connect(fetchImpl);
  const err = await browser.targets().then(() => null, e => e);
  assert.ok(err);
  assert.equal(err.code, 'PINCHTAB_REQUEST_FAILED');
  assert.ok(!String(err.message).includes(TOKEN));
  assert.ok(!String(err.stack ?? '').includes(TOKEN));
  assert.ok(!JSON.stringify({ message: err.message, code: err.code }).includes(TOKEN));
});

test('token never appears in thrown errors (network failure)', async () => {
  const { fetchImpl } = fakeFetch(() => { throw new Error(`socket hang up for ${TOKEN}`); });
  const browser = await connect(fetchImpl);
  const err = await browser.targets().then(() => null, e => e);
  assert.ok(err);
  assert.equal(err.code, 'PINCHTAB_REQUEST_FAILED');
  assert.ok(!String(err.message).includes(TOKEN));
  assert.ok(!String(err.stack ?? '').includes(TOKEN));
});

test('token is not exposed on the returned Browser object', async () => {
  const { fetchImpl } = fakeFetch(happyHandler());
  const browser = await connect(fetchImpl);
  assert.ok(!JSON.stringify(browser).includes(TOKEN));
  assert.ok(!Object.values(browser).some(v => v === TOKEN));
});

// --- Safety rule 3: instance-scoped routes; rule 5: targets/attach ---

test('targets() calls only GET /instances/{id}/tabs', async () => {
  const { fetchImpl, calls } = fakeFetch(happyHandler());
  const browser = await connect(fetchImpl);
  const tabs = await browser.targets();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'GET');
  assert.equal(calls[0].url, TABS_URL);
  assert.deepEqual(tabs, [{ id: 't1', url: 'https://x.test/a', title: 'A', type: 'page' }]);
});

test('attach(unknown id) throws PINCHTAB_TAB_NOT_FOUND', async () => {
  const { fetchImpl } = fakeFetch(happyHandler());
  const browser = await connect(fetchImpl);
  await assert.rejects(browser.attach('t9'), { code: 'PINCHTAB_TAB_NOT_FOUND' });
});

test('attach requires exact id (prefix does not match)', async () => {
  const { fetchImpl } = fakeFetch(happyHandler());
  const browser = await connect(fetchImpl);
  await assert.rejects(browser.attach('t'), { code: 'PINCHTAB_TAB_NOT_FOUND' });
});

test('openPage posts {url} to the instance-scoped open route', async () => {
  const { fetchImpl, calls } = fakeFetch(happyHandler());
  const browser = await connect(fetchImpl);
  const page = await browser.openPage('https://x.test/new');
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].url, `${BASE}/instances/${INSTANCE}/tabs/open`);
  assert.deepEqual(calls[0].body, { url: 'https://x.test/new' });
  assert.equal(typeof page.evaluate, 'function');
});

// --- Safety rule 5: Page methods map to documented routes ---

test('evaluate sends expression and awaitPromise:true, returns result', async () => {
  const { fetchImpl, calls } = fakeFetch(happyHandler({
    [`${BASE}/tabs/t1/evaluate`]: () => ({ body: { result: 42 } }),
  }));
  const page = await (await connect(fetchImpl)).attach('t1');
  const value = await page.evaluate('6*7');
  assert.equal(value, 42);
  const call = calls.find(c => c.url === `${BASE}/tabs/t1/evaluate`);
  assert.equal(call.method, 'POST');
  assert.deepEqual(call.body, { expression: '6*7', awaitPromise: true });
});

test('url() evaluates location.href on the tab', async () => {
  const { fetchImpl, calls } = fakeFetch(happyHandler({
    [`${BASE}/tabs/t1/evaluate`]: () => ({ body: { result: 'https://x.test/a' } }),
  }));
  const page = await (await connect(fetchImpl)).attach('t1');
  assert.equal(await page.url(), 'https://x.test/a');
  const call = calls.find(c => c.url === `${BASE}/tabs/t1/evaluate`);
  assert.equal(call.body.expression, 'location.href');
});

test('evaluate with unresolved Promise hint throws PINCHTAB_UNRESOLVED_PROMISE', async () => {
  const { fetchImpl } = fakeFetch(happyHandler({
    [`${BASE}/tabs/t1/evaluate`]: () => ({ body: { hint: 'Promise returned; set awaitPromise' } }),
  }));
  const page = await (await connect(fetchImpl)).attach('t1');
  await assert.rejects(page.evaluate('fetch("/x")'), { code: 'PINCHTAB_UNRESOLVED_PROMISE' });
});

test('insertText sends keyboard-inserttext with text exactly', async () => {
  const text = "  héllo \"quoted\"\n'x' \\ end  ";
  const { fetchImpl, calls } = fakeFetch(happyHandler());
  const page = await (await connect(fetchImpl)).attach('t1');
  await page.insertText(text);
  const call = calls.find(c => c.url === `${BASE}/tabs/t1/action`);
  assert.equal(call.method, 'POST');
  assert.deepEqual(call.body, { kind: 'keyboard-inserttext', text });
});

test('pressEnter sends press Enter', async () => {
  const { fetchImpl, calls } = fakeFetch(happyHandler());
  const page = await (await connect(fetchImpl)).attach('t1');
  await page.pressEnter();
  const call = calls.find(c => c.url === `${BASE}/tabs/t1/action`);
  assert.deepEqual(call.body, { kind: 'press', key: 'Enter' });
});

test('click sends kind click with submit:true', async () => {
  const { fetchImpl, calls } = fakeFetch(happyHandler());
  const page = await (await connect(fetchImpl)).attach('t1');
  await page.click('#send');
  const call = calls.find(c => c.url === `${BASE}/tabs/t1/action`);
  assert.deepEqual(call.body, { kind: 'click', selector: '#send', submit: true });
});

test('close() throws PINCHTAB_CLOSE_UNSUPPORTED without any request', async () => {
  const { fetchImpl, calls } = fakeFetch(happyHandler());
  const page = await (await connect(fetchImpl)).attach('t1');
  const before = calls.length;
  await assert.rejects(page.close(), { code: 'PINCHTAB_CLOSE_UNSUPPORTED' });
  assert.equal(calls.length, before);
});

// --- Safety rule 4: exactly one attempt, no retries ---

test('HTTP 500 throws PINCHTAB_REQUEST_FAILED with status only, one call', async () => {
  const { fetchImpl, calls } = fakeFetch(call => {
    if (call.url === TABS_URL) return { body: TAB_LIST };
    return { status: 500, body: { error: 'secret body echo' } };
  });
  const page = await (await connect(fetchImpl)).attach('t1');
  const before = calls.length;
  const err = await page.pressEnter().then(() => null, e => e);
  assert.ok(err);
  assert.equal(err.code, 'PINCHTAB_REQUEST_FAILED');
  assert.ok(err.message.includes('500'));
  assert.ok(!err.message.includes('secret body echo'));
  assert.equal(calls.length - before, 1, 'fetch must be called exactly once (no retry)');
});

test('thrown network error is not retried (exactly one call)', async () => {
  const { fetchImpl, calls } = fakeFetch(call => {
    if (call.url === TABS_URL) return { body: TAB_LIST };
    throw new TypeError('fetch failed');
  });
  const page = await (await connect(fetchImpl)).attach('t1');
  const before = calls.length;
  const err = await page.click('#send').then(() => null, e => e);
  assert.ok(err);
  assert.equal(err.code, 'PINCHTAB_REQUEST_FAILED');
  assert.equal(calls.length - before, 1, 'fetch must be called exactly once (no retry)');
});

// --- verifyAttachedInstance: instance must be attached and on the expected loopback CDP port ---

async function verifyAttached(fetchImpl, overrides = {}) {
  const { verifyAttachedInstance } = await import('../../src/core/pinchtab.mjs');
  return verifyAttachedInstance({ baseUrl: BASE, instanceId: INSTANCE, token: TOKEN, fetchImpl, ...overrides });
}

const INSTANCE_URL = `${BASE}/instances/${INSTANCE}`;
const RUNNING = { id: INSTANCE, attached: true, status: 'running', cdpUrl: 'ws://127.0.0.1:9333/devtools/browser/abc' };

for (const cdpUrl of ['ws://127.0.0.1:9333/devtools/browser/abc', 'http://127.0.0.1:9333']) {
  test(`verifyAttachedInstance accepts attached running instance on 127.0.0.1:9333 (${cdpUrl})`, async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({ body: { ...RUNNING, cdpUrl } }));
    const result = await verifyAttached(fetchImpl);
    assert.deepEqual(result, { id: INSTANCE, status: 'running' });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, 'GET');
    assert.equal(calls[0].url, INSTANCE_URL);
    assert.equal(calls[0].headers.Authorization, `Bearer ${TOKEN}`);
  });
}

async function expectNotOnExpectedCdp(body) {
  const { fetchImpl, calls } = fakeFetch(() => ({ body }));
  const err = await verifyAttached(fetchImpl).then(() => null, e => e);
  assert.ok(err, 'must reject');
  assert.equal(err.code, 'PINCHTAB_INSTANCE_NOT_ON_EXPECTED_CDP');
  assert.ok(!String(err.message).includes(String(body.cdpUrl)), 'message must not echo cdpUrl');
  assert.ok(!String(err.message).includes(TOKEN), 'message must not contain token');
  assert.ok(!String(err.stack ?? '').includes(TOKEN), 'stack must not contain token');
  assert.equal(calls.length, 1);
}

test('verifyAttachedInstance rejects cdpUrl on port 9222', async () => {
  await expectNotOnExpectedCdp({ ...RUNNING, cdpUrl: 'ws://127.0.0.1:9222/devtools/browser/abc' });
});

test('verifyAttachedInstance rejects non-loopback host 192.168.1.5', async () => {
  await expectNotOnExpectedCdp({ ...RUNNING, cdpUrl: 'ws://192.168.1.5:9333/devtools/browser/abc' });
});

test('verifyAttachedInstance rejects attached:false', async () => {
  await expectNotOnExpectedCdp({ ...RUNNING, attached: false });
});

test("verifyAttachedInstance rejects status 'stopped'", async () => {
  await expectNotOnExpectedCdp({ ...RUNNING, status: 'stopped' });
});

test('verifyAttachedInstance HTTP 500 makes exactly one call and throws PINCHTAB_REQUEST_FAILED without token', async () => {
  const { fetchImpl, calls } = fakeFetch(() => ({ status: 500, body: { error: 'secret body echo' } }));
  const err = await verifyAttached(fetchImpl).then(() => null, e => e);
  assert.ok(err);
  assert.equal(err.code, 'PINCHTAB_REQUEST_FAILED');
  assert.ok(!String(err.message).includes(TOKEN));
  assert.ok(!String(err.message).includes('secret body echo'));
  assert.equal(calls.length, 1, 'fetch must be called exactly once (no retry)');
});

test('verifyAttachedInstance network error makes exactly one call and throws PINCHTAB_REQUEST_FAILED without token', async () => {
  const { fetchImpl, calls } = fakeFetch(() => { throw new TypeError(`fetch failed ${TOKEN}`); });
  const err = await verifyAttached(fetchImpl).then(() => null, e => e);
  assert.ok(err);
  assert.equal(err.code, 'PINCHTAB_REQUEST_FAILED');
  assert.ok(!String(err.message).includes(TOKEN));
  assert.ok(!String(err.stack ?? '').includes(TOKEN));
  assert.equal(calls.length, 1, 'fetch must be called exactly once (no retry)');
});
