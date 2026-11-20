# File: harness/test/core/pinchtab.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/core/pinchtab.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14441 B |
| Lines | 328 |
| Hash | 7013a7e30b7e |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| BASE | const | 5 | no | const BASE = &#39;http://127.0.0.1:9867&#39;; |
| TOKEN | const | 6 | no | const TOKEN = &#39;tok-SECRET-123&#39;; |
| INSTANCE | const | 7 | no | const INSTANCE = &#39;inst_1&#39;; |
| TABS_URL | const | 8 | no | const TABS_URL = `${BASE}/instances/${INSTANCE}/tabs`; |
| fakeFetch | function | 11 | no | function fakeFetch(handler = () =&gt; ({ status: 200, body: [] })) { |
| calls | const | 12 | no | const calls = []; |
| fetchImpl | function | 13 | no | const fetchImpl = async (url, init = {}) =&gt; { |
| call | const | 14 | no | const call = { |
| res | const | 21 | no | const res = await handler(call); |
| status | const | 22 | no | const status = res.status ?? 200; |
| TAB_LIST | const | 28 | no | const TAB_LIST = [{ id: &#39;t1&#39;, instanceId: INSTANCE, url: &#39;https://x.test/a&#39;, title: &#39;A&#39; }]; |
| happyHandler | function | 31 | no | function happyHandler(extra = {}) { |
| connect | function | 40 | no | async function connect(fetchImpl, overrides = {}) { |
| browser | const | 95 | no | const browser = await connect(fetchImpl); |
| page | const | 96 | no | const page = await browser.attach(&#39;t1&#39;); |
| browser | const | 105 | no | const browser = await connect(fetchImpl); |
| err | const | 106 | no | const err = await browser.targets().then(() =&gt; null, e =&gt; e); |
| browser | const | 116 | no | const browser = await connect(fetchImpl); |
| err | const | 117 | no | const err = await browser.targets().then(() =&gt; null, e =&gt; e); |
| browser | const | 126 | no | const browser = await connect(fetchImpl); |
| browser | const | 135 | no | const browser = await connect(fetchImpl); |
| tabs | const | 136 | no | const tabs = await browser.targets(); |
| browser | const | 145 | no | const browser = await connect(fetchImpl); |
| browser | const | 151 | no | const browser = await connect(fetchImpl); |
| browser | const | 157 | no | const browser = await connect(fetchImpl); |
| page | const | 158 | no | const page = await browser.openPage(&#39;https://x.test/new&#39;); |
| page | const | 171 | no | const page = await (await connect(fetchImpl)).attach(&#39;t1&#39;); |
| value | const | 172 | no | const value = await page.evaluate(&#39;6*7&#39;); |
| call | const | 174 | no | const call = calls.find(c =&gt; c.url === `${BASE}/tabs/t1/evaluate`); |
| page | const | 183 | no | const page = await (await connect(fetchImpl)).attach(&#39;t1&#39;); |
| call | const | 185 | no | const call = calls.find(c =&gt; c.url === `${BASE}/tabs/t1/evaluate`); |
| page | const | 193 | no | const page = await (await connect(fetchImpl)).attach(&#39;t1&#39;); |
| text | const | 198 | no | const text = &quot; héllo \\&quot;quoted\\&quot;\\n&#39;x&#39; \\\\ end &quot;; |
| page | const | 200 | no | const page = await (await connect(fetchImpl)).attach(&#39;t1&#39;); |
| call | const | 202 | no | const call = calls.find(c =&gt; c.url === `${BASE}/tabs/t1/action`); |
| page | const | 209 | no | const page = await (await connect(fetchImpl)).attach(&#39;t1&#39;); |
| call | const | 211 | no | const call = calls.find(c =&gt; c.url === `${BASE}/tabs/t1/action`); |
| page | const | 217 | no | const page = await (await connect(fetchImpl)).attach(&#39;t1&#39;); |
| call | const | 219 | no | const call = calls.find(c =&gt; c.url === `${BASE}/tabs/t1/action`); |
| page | const | 225 | no | const page = await (await connect(fetchImpl)).attach(&#39;t1&#39;); |
| before | const | 226 | no | const before = calls.length; |
| page | const | 238 | no | const page = await (await connect(fetchImpl)).attach(&#39;t1&#39;); |
| before | const | 239 | no | const before = calls.length; |
| err | const | 240 | no | const err = await page.pressEnter().then(() =&gt; null, e =&gt; e); |
| page | const | 253 | no | const page = await (await connect(fetchImpl)).attach(&#39;t1&#39;); |
| before | const | 254 | no | const before = calls.length; |
| err | const | 255 | no | const err = await page.click(&#39;#send&#39;).then(() =&gt; null, e =&gt; e); |
| verifyAttached | function | 263 | no | async function verifyAttached(fetchImpl, overrides = {}) { |
| INSTANCE_URL | const | 268 | no | const INSTANCE_URL = `${BASE}/instances/${INSTANCE}`; |
| RUNNING | const | 269 | no | const RUNNING = { id: INSTANCE, attached: true, status: &#39;running&#39;, cdpUrl: &#39;ws://127.0.0.1:9333/devtools/browser/abc&#39; }; |
| result | const | 274 | no | const result = await verifyAttached(fetchImpl); |
| expectNotOnExpectedCdp | function | 283 | no | async function expectNotOnExpectedCdp(body) { |
| err | const | 285 | no | const err = await verifyAttached(fetchImpl).then(() =&gt; null, e =&gt; e); |
| err | const | 312 | no | const err = await verifyAttached(fetchImpl).then(() =&gt; null, e =&gt; e); |
| err | const | 322 | no | const err = await verifyAttached(fetchImpl).then(() =&gt; null, e =&gt; e); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/core/pinchtab.mjs | import | 3 | [harness/src/core/pinchtab.mjs](../../src/core/pinchtab.mjs.md) |
| ../../src/core/pinchtab.mjs | dynamic | 264 | [harness/src/core/pinchtab.mjs](../../src/core/pinchtab.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 329 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
