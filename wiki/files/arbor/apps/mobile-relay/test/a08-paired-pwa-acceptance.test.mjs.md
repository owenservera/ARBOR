# File: apps/mobile-relay/test/a08-paired-pwa-acceptance.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/a08-paired-pwa-acceptance.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7354 B |
| Lines | 139 |
| Hash | d290120a48a4 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| app | const | 9 | no | const app = readFileSync(new URL(&#39;../app.js&#39;, import.meta.url), &#39;utf8&#39;); |
| indexHtml | const | 10 | no | const indexHtml = readFileSync(new URL(&#39;../index.html&#39;, import.meta.url), &#39;utf8&#39;); |
| swSrc | const | 11 | no | const swSrc = readFileSync(new URL(&#39;../sw.js&#39;, import.meta.url), &#39;utf8&#39;); |
| manifest | const | 12 | no | const manifest = JSON.parse(readFileSync(new URL(&#39;../manifest.webmanifest&#39;, import.meta.url), &#39;utf8&#39;)); |
| called | variable | 43 | no | let called = 0; |
| fetchImpl | function | 44 | no | const fetchImpl = async () =&gt; { called += 1; throw new Error(&#39;must not fetch&#39;); }; |
| respond | function | 53 | no | const respond = (status, body = {}) =&gt; ({ ok: status &lt; 400, status, json: async () =&gt; ({ error: &#39;x&#39;, ...body }) }); |
| ok | const | 63 | no | const ok = await redeemDevicePairToken(&#39;a&#39;.repeat(64), { direct: true, fetchImpl: async () =&gt; respond(200, { enrollmentRequired: true, challengeId: &#39;c1&#39; }) }); |
| HTTPS_ORIGIN | const | 73 | no | const HTTPS_ORIGIN = &#39;https://host.example&#39;; |
| withLocalStorage | function | 74 | no | function withLocalStorage() { |
| store | const | 75 | no | const store = new Map(); |
| store | const | 89 | no | const store = withLocalStorage(); |
| GRANT | const | 90 | no | const GRANT = &#39;vivim.device.grant.v1&#39;; |
| grantId | const | 91 | no | const grantId = &#39;a&#39;.repeat(32); // grantId is validated against /^[a-f0-9]{32}$/ |
| session | variable | 93 | no | let session = &#39;stale&#39;; |
| lastQuery | variable | 94 | no | let lastQuery = &#39;&#39;; |
| transport | const | 99 | no | const transport = { direct: true, setDeviceSession: s =&gt; { session = s; } }; |
| result | const | 100 | no | const result = await resumeDeviceSession(transport); |
| result | const | 111 | no | const result = await resumeDeviceSession({ direct: true, setDeviceSession: () =&gt; {} }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 5 | external |
| node:assert/strict | import | 6 | external |
| node:fs | import | 7 | external |
| ../pairing-link.mjs | dynamic | 13 | [apps/mobile-relay/pairing-link.mjs](../pairing-link.mjs.md) |
| ../device-enrollment.mjs | dynamic | 88 | [apps/mobile-relay/device-enrollment.mjs](../device-enrollment.mjs.md) |
| ../device-enrollment.mjs | dynamic | 108 | [apps/mobile-relay/device-enrollment.mjs](../device-enrollment.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// A08 — Physical Windows Host and paired PWA acceptance (relay-side, build round 1).
// Exercises the PWA contracts the physical-host walkthrough depends on: single-use pairing
// redemption, device-grant revocation on reconnect, offline-shell guards and the HTTPS
// registration surface. Physical-device execution itself stays UNRUN (see roadmap A08 note).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const swSrc = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
const { parsePairFragment, redeemDevicePairToken } = await import('../pairing-link.mjs');

/* ---------- physical HTTPS pairing surface ---------- */

test('PWA shell is installable: manifest is standalone with maskable icon and theme color', () => {
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.name, 'VIVIM Mobile');
  assert.ok(manifest.icons.some(i => i.purpose === 'maskable' && i.sizes === '512x512'),
    'a maskable 512 icon is required for Android adaptive install');
  assert.ok(indexHtml.includes('<link rel="manifest" href="manifest.webmanifest">'),
    'index.html must link the manifest');
  assert.match(indexHtml, /<meta name="theme-color"/, 'theme-color meta must stay for install UI');
});

test('service worker registers on the Direct mount for physical paired devices', () => {
  assert.match(app, /navigator\.serviceWorker\.register\(transport\.direct \? '\/mobile\/sw\.js' : '\/sw\.js'\)/,
    'app.js must register the SW under the Direct mount scope');
});

/* ---------- pairing: single-use redemption contracts (PWA side of physical pairing) ---------- */

test('parsePairFragment classifies device tokens, legacy secrets, ask-fragments and junk', () => {
  assert.deepEqual(parsePairFragment('a'.repeat(64)), { type: 'device', token: 'a'.repeat(64) });
  assert.equal(parsePairFragment('abc-DEF_12').type, 'legacy');
  assert.deepEqual(parsePairFragment('#ask=1'), { type: 'none' });
  assert.equal(parsePairFragment('').type, 'none');
  assert.equal(parsePairFragment('bad token!!').type, 'invalid');
});

test('redeemDevicePairToken refuses non-direct and malformed tokens before any fetch', async () => {
  let called = 0;
  const fetchImpl = async () => { called += 1; throw new Error('must not fetch'); };
  await assert.rejects(redeemDevicePairToken('x', { fetchImpl }),
    /Open this link through your private VIVIM connection\./);
  await assert.rejects(redeemDevicePairToken('zzz', { direct: true, fetchImpl }),
    /Invalid pairing code\./);
  assert.equal(called, 0, 'no network call for invalid input');
});

test('redeemDevicePairToken maps 410 to expired and 409 to already-paired single-use errors', async () => {
  const respond = (status, body = {}) => ({
    ok: status < 400, status,
    json: async () => ({ error: 'x', ...body })
  });
  await assert.rejects(
    redeemDevicePairToken('a'.repeat(64), { direct: true, fetchImpl: async () => respond(410) }),
    /This code expired\. Create a new code on the PC\./);
  await assert.rejects(
    redeemDevicePairToken('a'.repeat(64), { direct: true, fetchImpl: async () => respond(409) }),
    /This device is already paired or this code was used\./);
  const ok = await redeemDevicePairToken('a'.repeat(64), {
    direct: true,
    fetchImpl: async () => respond(200, { enrollmentRequired: true, challengeId: 'c1' })
  });
  assert.equal(ok.status, 'enrollment_required');
  assert.equal(ok.paired, false);
});

/* ---------- revocation: reconnect after revoke clears the grant (no stale session) ---------- */

const HTTPS_ORIGIN = 'https://host.example';
function withLocalStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: k => store.has(k) ? store.get(k) : null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k)
  };
```

_First 80 of 140 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
