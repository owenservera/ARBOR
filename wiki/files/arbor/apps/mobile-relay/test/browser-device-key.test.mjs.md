# File: apps/mobile-relay/test/browser-device-key.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/browser-device-key.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4808 B |
| Lines | 100 |
| Hash | ecaec160d88f |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fakeIndexedDB | function | 7 | no | function fakeIndexedDB() { |
| records | const | 8 | no | const records = new Map(); |
| db | const | 9 | no | const db = { |
| tx | const | 13 | no | const tx = { oncomplete: null, onerror: null, onabort: null }; |
| req | const | 16 | no | const req = { result: undefined, onsuccess: null }; |
| req | const | 31 | no | const req = {}; |
| env | const | 38 | no | const env = (indexedDB = fakeIndexedDB()) =&gt; ({ crypto: webcrypto, indexedDB, secure: true, Encoder: TextEncoder, base64: btoa }); |
| verifySig | function | 39 | no | const verifySig = (pem, signed, message) =&gt; |
| i | const | 43 | no | const i = fakeIndexedDB(); |
| signer | const | 44 | no | const signer = createBrowserDeviceSigner(env(i)); |
| key | const | 46 | no | const key = i.records.get(&#39;host-p256&#39;); |
| pem | const | 50 | no | const pem = await signer.publicKeyPem(); |
| msg | const | 51 | no | const msg = [&#39;vivim-enrollment-v1&#39;,&#39;challengeId&#39;,&#39;challenge&#39;,&#39;nonce&#39;,&#39;https://pc.ts.net&#39;,&#39;owner&#39;].join(&#39;\\\\n&#39;); |
| signature | const | 52 | no | const signature = await signer.signEnrollment(&#39;challengeId&#39;,&#39;challenge&#39;,&#39;nonce&#39;,&#39;https://pc.ts.net&#39;,&#39;owner&#39;); |
| db | const | 59 | no | const db = fakeIndexedDB(); |
| a | const | 60 | no | const a = createBrowserDeviceSigner(env(db)); |
| originalPem | const | 61 | no | const originalPem = await a.publicKeyPem(); |
| b | const | 62 | no | const b = createBrowserDeviceSigner(env(db)); |
| msg | const | 64 | no | const msg = [&#39;vivim-session-v1&#39;,&#39;grantId&#39;,&#39;a&#39;.repeat(32),&#39;123456&#39;,&#39;https://pc.ts.net&#39;,&#39;owner&#39;].join(&#39;\\\\n&#39;); |
| proof | const | 65 | no | const proof = await b.signSession(&#39;grantId&#39;,&#39;a&#39;.repeat(32),&#39;123456&#39;,&#39;https://pc.ts.net&#39;,&#39;owner&#39;); |
| attacker | const | 67 | no | const attacker = createBrowserDeviceSigner(env()); |
| stolenGrantProof | const | 68 | no | const stolenGrantProof = await attacker.signSession(&#39;grantId&#39;,&#39;a&#39;.repeat(32),&#39;123456&#39;,&#39;https://pc.ts.net&#39;,&#39;owner&#39;); |
| bad | const | 73 | no | const bad = [ |
| empty | const | 78 | no | const empty = fakeIndexedDB(); |
| missing | const | 79 | no | const missing = createBrowserDeviceSigner(env(empty)); |
| invalid | const | 82 | no | const invalid = fakeIndexedDB(); |
| signer | const | 88 | no | const signer = createBrowserDeviceSigner(env()); |
| pem | const | 89 | no | const pem = await signer.publicKeyPem(); |
| nonce | const | 90 | no | const nonce = &#39;f&#39;.repeat(32), time = String(Date.now()); |
| sig | const | 91 | no | const sig = await signer.signSession(&#39;g&#39;, nonce, time, &#39;https://pc.ts.net&#39;, &#39;owner&#39;); |
| wire | const | 92 | no | const wire = [&#39;vivim-session-v1&#39;,&#39;g&#39;,nonce,time,&#39;https://pc.ts.net&#39;,&#39;owner&#39;].join(&#39;\\\\n&#39;); |
| used | const | 93 | no | const used = new Set(); |
| authorize | function | 94 | no | const authorize = status =&gt; status === &#39;active&#39; &amp;&amp; !used.has(nonce) &amp;&amp; verifySig(pem,sig,wire); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:crypto | import | 3 | external |
| ../browser-device-key.mjs | import | 4 | [apps/mobile-relay/browser-device-key.mjs](../browser-device-key.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto, createPublicKey, verify } from 'node:crypto';
import { createBrowserDeviceSigner } from '../browser-device-key.mjs';

// Transactional IndexedDB facade for CryptoKey storage; real browser acceptance is separate.
function fakeIndexedDB() {
  const records = new Map();
  const db = {
    objectStoreNames: { contains: () => true },
    close() {},
    transaction(name, mode) {
      const tx = { oncomplete: null, onerror: null, onabort: null };
      tx.objectStore = () => ({
        get(key) {
          const req = { result: undefined, onsuccess: null };
          queueMicrotask(() => {
            req.result = records.get(key);
            req.onsuccess?.();
            queueMicrotask(() => tx.oncomplete?.());
          });
          return req;
        },
        put(value, key) { records.set(key, value); },
      });
      return tx;
    },
  };
  return {
    open() {
      const req = {};
      queueMicrotask(() => { req.result = db; req.onsuccess?.(); });
      return req;
    },
    records,
  };
}
const env = (indexedDB = fakeIndexedDB()) => ({ crypto: webcrypto, indexedDB, secure: true, Encoder: TextEncoder, base64: btoa });
const verifySig = (pem, signed, message) =>
  verify('sha256', Buffer.from(message), createPublicKey(pem), Buffer.from(signed, 'base64'));

test('nonextractable browser P-256 key emits Node Host-compatible DER signatures', async () => {
  const i = fakeIndexedDB();
  const signer = createBrowserDeviceSigner(env(i));
  await signer.ready();
  const key = i.records.get('host-p256');
  assert.equal(key.privateKey.extractable, false);
  assert.equal(key.privateKey.algorithm.namedCurve, 'P-256');
  assert.equal(key.publicKey.type, 'public');
  const pem = await signer.publicKeyPem();
  const msg = ['vivim-enrollment-v1','challengeId','challenge','nonce','https://pc.ts.net','owner'].join('\\n');
  const signature = await signer.signEnrollment('challengeId','challenge','nonce','https://pc.ts.net','owner');
  assert.ok(verifySig(pem, signature, msg));
  assert.equal(verifySig(pem, signature, msg + '\nchanged'), false);
  assert.equal(Buffer.from(signature,'base64')[0], 0x30);
});

test('keys persist across signer instances; a stolen grant ID without its key cannot prove session', async () => {
  const db = fakeIndexedDB();
  const a = createBrowserDeviceSigner(env(db));
  const originalPem = await a.publicKeyPem();
  const b = createBrowserDeviceSigner(env(db));
  assert.equal(await b.publicKeyPem(), originalPem);
  const msg = ['vivim-session-v1','grantId','a'.repeat(32),'123456','https://pc.ts.net','owner'].join('\\n');
  const proof = await b.signSession('grantId','a'.repeat(32),'123456','https://pc.ts.net','owner');
  assert.ok(verifySig(originalPem, proof, msg));
  const attacker = createBrowserDeviceSigner(env());
  const stolenGrantProof = await attacker.signSession('grantId','a'.repeat(32),'123456','https://pc.ts.net','owner');
  assert.equal(verifySig(originalPem, stolenGrantProof, msg), false);
});

test('secure origin, WebCrypto and persistent storage mandatory; no ephemeral fallback', async () => {
  const bad = [
    {...env(), secure:false}, {...env(), crypto:null},
    {...env(), indexedDB:null}, {...env(), base64:null},
  ];
  for (const e of bad) await assert.rejects(createBrowserDeviceSigner(e).ready(), /SECURE_BROWSER_DEVICE_CRYPTO_REQUIRED/);
  const empty = fakeIndexedDB();
  const missing = createBrowserDeviceSigner(env(empty));
  await assert.rejects(missing.requireExisting(), /BROWSER_DEVICE_KEY_MISSING/);
```

_First 80 of 101 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
