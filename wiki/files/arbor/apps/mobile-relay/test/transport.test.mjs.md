# File: apps/mobile-relay/test/transport.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/transport.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8438 B |
| Lines | 139 |
| Hash | b3757b21f77e |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CLOUD | const | 5 | no | const CLOUD = &#39;https://vivim-mobile-relay.vercel.app&#39;; |
| DEVICE_SESSION | const | 7 | no | const DEVICE_SESSION = { grantId: &#39;a&#39;.repeat(32), sessionId: &#39;b&#39;.repeat(32), expiresAt: Date.now() + 3600000 }; |
| fixture | function | 9 | no | function fixture(origin = CLOUD, pathname = &#39;/mobile&#39;, fetchImpl = async () =&gt; ({ ok: true, status: 200, json: async () =&gt; ({ paired: true }) }), search = &#39;&#39;, deviceSession = false) { |
| values | const | 10 | no | const values = new Map(), calls = [], navigations = []; |
| storage | const | 11 | no | const storage = { getItem: k =&gt; values.get(k) ?? null, setItem: (k, v) =&gt; values.set(k, v), removeItem: k =&gt; values.delete(k) }; |
| transport | const | 12 | no | const transport = createTransport({ location: { origin, pathname, search }, storage, fetchImpl: (...args) =&gt; { calls.push(args); return fetchImpl(...args); }, navigate: url =&gt; navigations.push(url) }… |
| f | const | 24 | no | const f = fixture(); await f.transport.request(&#39;session&#39;); |
| f | const | 34 | no | const f = fixture(&#39;https://pc.tailnet.ts.net&#39;, &#39;/mobile/&#39;, async () =&gt; { throw new TypeError(&#39;offline&#39;); }); |
| f | const | 47 | no | const f = fixture(CLOUD, &#39;/mobile&#39;, async () =&gt; { throw new TypeError(&#39;offline&#39;); }); |
| f | const | 59 | no | const f = fixture(&#39;https://pc.tailnet.ts.net&#39;, &#39;/mobile/&#39;, async () =&gt; { throw new TypeError(&#39;offline&#39;); }, &#39;&#39;, true); |
| f | const | 68 | no | const f = fixture(&#39;https://pc.tailnet.ts.net&#39;, &#39;/mobile/&#39;, async () =&gt; { throw new TypeError(&#39;offline&#39;); }, &#39;&#39;, true); |
| f | const | 85 | no | const f = fixture(CLOUD, &#39;/mobile&#39;, async () =&gt; { throw new TypeError(&#39;offline&#39;); }); |
| f | const | 101 | no | const f = fixture(&#39;https://pc.tailnet.ts.net&#39;, &#39;/mobile/&#39;, async () =&gt; ({ ok: false, status: 401, json: async () =&gt; ({ error: &#39;Unauthorized&#39; }) }), &#39;&#39;, true); |
| f | const | 110 | no | const f = fixture(); |
| f | const | 116 | no | const f = fixture(&#39;https://pc.tailnet.ts.net&#39;, &#39;/mobile/&#39;, async () =&gt; { throw new TypeError(&#39;offline&#39;); }, &#39;?connection=direct&#39;, true); |
| f | const | 125 | no | const f = fixture(CLOUD, &#39;/mobile&#39;, async () =&gt; ({ ok: status === 200, status, json: async () =&gt; { throw new SyntaxError(&#39;HTML&#39;); } })); |
| f | const | 133 | no | const f = fixture(CLOUD, &#39;/mobile&#39;, async () =&gt; ({ ok: status === 200, status, json: async () =&gt; { throw new SyntaxError(&#39;HTML&#39;); } })); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../transport.mjs | import | 3 | [apps/mobile-relay/transport.mjs](../transport.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTransport, directOrigin } from '../transport.mjs';

const CLOUD = 'https://vivim-mobile-relay.vercel.app';
// A Direct device session is ephemeral and device-scoped: 32 hex ids, live expiry.
const DEVICE_SESSION = { grantId: 'a'.repeat(32), sessionId: 'b'.repeat(32), expiresAt: Date.now() + 3600000 };

function fixture(origin = CLOUD, pathname = '/mobile', fetchImpl = async () => ({ ok: true, status: 200, json: async () => ({ paired: true }) }), search = '', deviceSession = false) {
  const values = new Map(), calls = [], navigations = [];
  const storage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) };
  const transport = createTransport({ location: { origin, pathname, search }, storage, fetchImpl: (...args) => { calls.push(args); return fetchImpl(...args); }, navigate: url => navigations.push(url) });
  if (deviceSession) transport.setDeviceSession({ ...DEVICE_SESSION });
  return { transport, calls, navigations, values };
}

test('validates direct origins and rejects paths, credentials and unknown hosts', () => {
  assert.equal(directOrigin('https://pc.tailnet.ts.net'), 'https://pc.tailnet.ts.net');
  assert.equal(directOrigin('http://127.0.0.1:3000'), 'http://127.0.0.1:3000');
  for (const value of ['https://evil.com', 'http://pc.tailnet.ts.net', 'https://a@pc.tailnet.ts.net', 'https://pc.tailnet.ts.net/private', 'https://pc.tailnet.ts.net/?x=1']) assert.equal(directOrigin(value), null);
});

test('cloud default and explicit direct navigate without cross-origin fetch', async () => {
  const f = fixture(); await f.transport.request('session');
  assert.equal(f.transport.mode(), 'auto'); assert.equal(f.calls[0][0], '/api/relay?path=session');
  f.transport.select('direct', 'https://pc.tailnet.ts.net');
  assert.deepEqual(f.navigations, ['https://pc.tailnet.ts.net/mobile/?connection=direct']);
  assert.throws(() => f.transport.select('direct', 'https://bad.example'), /Tailscale/);
});

// A Direct relay call is device-scoped: the Host rejects every relay request
// without a valid grant + session, so the transport fails closed before any fetch.
test('a direct request without a device session fails closed with 401 and makes no network call', async () => {
  const f = fixture('https://pc.tailnet.ts.net', '/mobile/', async () => { throw new TypeError('offline'); });
  await assert.rejects(f.transport.request('session'), e => e.status === 401 && /device session/.test(e.message));
  assert.equal(f.calls.length, 0);
  assert.deepEqual(f.navigations, []);
  await assert.rejects(f.transport.request('commands', { method: 'POST', body: '{}' }), e => e.status === 401);
  assert.equal(f.calls.length, 0);
  assert.deepEqual(f.navigations, []);
  // The send never left the phone, so nothing is left pending.
  assert.equal(f.transport.pending(), false);
});

// The one allowed fallback: a failed READ-ONLY session preflight in auto mode.
test('a failed read-only session preflight may fall back to the cloud relay in auto mode', async () => {
  const f = fixture(CLOUD, '/mobile', async () => { throw new TypeError('offline'); });
  await assert.rejects(f.transport.request('status'));
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0][0], '/api/relay?path=status');
  assert.deepEqual(f.navigations, []);
  await assert.rejects(f.transport.request('session'));
  assert.equal(f.calls.length, 2);
  assert.deepEqual(f.navigations, [CLOUD + '/mobile?connection=auto']);
});

// A Direct Host never navigates to Cloud implicitly, not even on a failed preflight.
test('a direct host never falls back to the cloud relay', async () => {
  const f = fixture('https://pc.tailnet.ts.net', '/mobile/', async () => { throw new TypeError('offline'); }, '', true);
  await assert.rejects(f.transport.request('status'));
  assert.equal(f.calls.length, 1);
  await assert.rejects(f.transport.request('session'));
  assert.equal(f.calls.length, 2);
  assert.deepEqual(f.navigations, []);
});

test('uncertain mutation is never retried or automatically switched', async () => {
  const f = fixture('https://pc.tailnet.ts.net', '/mobile/', async () => { throw new TypeError('offline'); }, '', true);
  await assert.rejects(f.transport.request('commands', { method: 'POST', body: '{}' }), /uncertain/);
  await assert.rejects(f.transport.request('commands', { method: 'POST', body: '{}' }), /uncertain/);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0][1].headers['x-vivim-grant-id'], DEVICE_SESSION.grantId);
  assert.equal(f.calls[0][1].headers['x-vivim-device-session'], DEVICE_SESSION.sessionId);
  assert.equal(f.transport.pending(), true);
  assert.deepEqual(f.navigations, []);
  await assert.rejects(f.transport.request('session'));
  assert.equal(f.calls.length, 2);
  assert.deepEqual(f.navigations, []);
  assert.throws(() => f.transport.select('cloud'), /Cloud mode is disabled/);
  // A pending send blocks every transport switch, including another Direct origin.
```

_First 80 of 140 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
