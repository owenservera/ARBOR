# File: apps/mobile-relay/browser-device-key.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/browser-device-key.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6151 B |
| Lines | 133 |
| Hash | c2e9c5b1a3b3 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DB_NAME | const | 6 | no | const DB_NAME = &#39;vivim.browser-device-key.v1&#39;; |
| STORE | const | 7 | no | const STORE = &#39;keys&#39;; |
| DEVICE_KEY | const | 8 | no | const DEVICE_KEY = &#39;host-p256&#39;; |
| ALGORITHM | const | 9 | no | const ALGORITHM = { name: &#39;ECDSA&#39;, namedCurve: &#39;P-256&#39; }; |
| unavailable | function | 11 | no | function unavailable(code) { return Object.assign(new Error(code), { code }); } |
| openDatabase | function | 12 | no | function openDatabase(indexedDB) { |
| request | variable | 14 | no | let request; |
| db | const | 18 | no | const db = request.result; |
| transact | function | 26 | no | function transact(db, mode, generated) { |
| value | variable | 28 | no | let value; |
| tx | variable | 29 | no | let tx; |
| store | const | 32 | no | const store = tx.objectStore(STORE); |
| get | const | 33 | no | const get = store.get(DEVICE_KEY); |
| validKeys | function | 47 | no | function validKeys(pair) { |
| derEncodeP256 | function | 55 | no | function derEncodeP256(raw) { |
| bytes | const | 56 | no | const bytes = new Uint8Array(raw); |
| integer | function | 58 | no | const integer = (part) =&gt; { |
| start | variable | 59 | no | let start = 0; |
| val | const | 61 | no | const val = Array.from(part.slice(start)); |
| r | const | 65 | no | const r = integer(bytes.slice(0, 32)), s = integer(bytes.slice(32)); |
| createBrowserDeviceSigner | function | 68 | yes | export function createBrowserDeviceSigner({ crypto = globalThis.crypto, indexedDB = globalThis.indexedDB, secure = globalThis.isSecureContext, Encoder = globalThis.TextEncoder, base64 = globalThis.bt… |
| inFlight | variable | 73 | no | let inFlight = null; |
| preflight | function | 74 | no | function preflight() { |
| load | function | 80 | no | async function load() { |
| db | const | 82 | no | const db = await openDatabase(indexedDB); |
| pair | variable | 84 | no | let pair = await transact(db, &#39;readonly&#39;); |
| generated | const | 86 | no | const generated = await crypto.subtle.generateKey(ALGORITHM, false, [&#39;sign&#39;, &#39;verify&#39;]); |
| keys | function | 96 | no | function keys() { |
| requireExisting | function | 100 | no | async function requireExisting() { |
| db | const | 102 | no | const db = await openDatabase(indexedDB); |
| pair | variable | 103 | no | let pair; |
| encode64 | function | 111 | no | const encode64 = bytes =&gt; base64(Array.from(bytes, x =&gt; String.fromCharCode(x)).join(&#39;&#39;)); |
| signTranscript | function | 112 | no | async function signTranscript(fields) { |
| pair | const | 113 | no | const pair = await keys(); |
| bytes | const | 114 | no | const bytes = new Encoder().encode(fields.join(&#39;\\\\n&#39;)); |
| raw | const | 115 | no | const raw = await crypto.subtle.sign({ name: &#39;ECDSA&#39;, hash: &#39;SHA-256&#39; }, pair.privateKey, bytes); |
| pair | const | 123 | no | const pair = await keys(); |
| spki | const | 124 | no | const spki = await crypto.subtle.exportKey(&#39;spki&#39;, pair.publicKey); |
| encoded | const | 125 | no | const encoded = encode64(new Uint8Array(spki)); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/device-enrollment.mjs](./device-enrollment.mjs.md) | ./browser-device-key.mjs |
| [apps/mobile-relay/test/browser-device-key.test.mjs](./test/browser-device-key.test.mjs.md) | ../browser-device-key.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Browser-only device proof for the existing Host P-256 ECDSA grant protocol.
// A nonextractable private CryptoKey is persisted in IndexedDB, never localStorage.
// Key possession alone never approves a grant: Host approval, revocation and
// one-shot session nonces remain authoritative. The shipped service worker does not
// access this store; compromised same-origin scripts still could invoke signing.
const DB_NAME = 'vivim.browser-device-key.v1';
const STORE = 'keys';
const DEVICE_KEY = 'host-p256';
const ALGORITHM = { name: 'ECDSA', namedCurve: 'P-256' };

function unavailable(code) { return Object.assign(new Error(code), { code }); }
function openDatabase(indexedDB) {
  return new Promise((resolve, reject) => {
    let request;
    try { request = indexedDB.open(DB_NAME, 1); }
    catch { reject(unavailable('BROWSER_DEVICE_STORAGE_UNAVAILABLE')); return; }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(unavailable('BROWSER_DEVICE_STORAGE_UNAVAILABLE'));
    request.onblocked = () => reject(unavailable('BROWSER_DEVICE_STORAGE_UNAVAILABLE'));
  });
}
function transact(db, mode, generated) {
  return new Promise((resolve, reject) => {
    let value;
    let tx;
    try {
      tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      const get = store.get(DEVICE_KEY);
      get.onsuccess = () => {
        value = get.result;
        if (!value && generated && mode === 'readwrite') {
          value = { version: 1, privateKey: generated.privateKey, publicKey: generated.publicKey };
          store.put(value, DEVICE_KEY);
        }
      };
    } catch { reject(unavailable('BROWSER_DEVICE_STORAGE_UNAVAILABLE')); return; }
    tx.oncomplete = () => resolve(value ?? null);
    tx.onerror = () => reject(unavailable('BROWSER_DEVICE_STORAGE_UNAVAILABLE'));
    tx.onabort = () => reject(unavailable('BROWSER_DEVICE_STORAGE_UNAVAILABLE'));
  });
}
function validKeys(pair) {
  return pair?.version === 1 && pair.privateKey?.type === 'private' &&
    pair.privateKey.extractable === false && pair.privateKey.algorithm?.name === 'ECDSA' &&
    pair.privateKey.algorithm.namedCurve === 'P-256' &&
    pair.privateKey.usages?.includes('sign') && pair.publicKey?.type === 'public' &&
    pair.publicKey.algorithm?.namedCurve === 'P-256' &&
    pair.publicKey.usages?.includes('verify');
}
function derEncodeP256(raw) {
  const bytes = new Uint8Array(raw);
  if (bytes.length !== 64) throw unavailable('BROWSER_DEVICE_SIGNATURE_FORMAT_UNSUPPORTED');
  const integer = (part) => {
    let start = 0;
    while (start < part.length - 1 && part[start] === 0) start++;
    const val = Array.from(part.slice(start));
    if (val[0] & 0x80) val.unshift(0);
    return [0x02, val.length, ...val];
  };
  const r = integer(bytes.slice(0, 32)), s = integer(bytes.slice(32));
  return new Uint8Array([0x30, r.length + s.length, ...r, ...s]);
}
export function createBrowserDeviceSigner({
  crypto = globalThis.crypto, indexedDB = globalThis.indexedDB,
  secure = globalThis.isSecureContext, Encoder = globalThis.TextEncoder,
  base64 = globalThis.btoa,
} = {}) {
  let inFlight = null;
  function preflight() {
    if (secure !== true || !crypto?.subtle?.generateKey || !crypto?.subtle?.sign ||
      !crypto?.subtle?.exportKey || !crypto?.getRandomValues ||
      !indexedDB?.open || typeof Encoder !== 'function' || typeof base64 !== 'function')
      throw unavailable('SECURE_BROWSER_DEVICE_CRYPTO_REQUIRED');
  }
  async function load() {
```

_First 80 of 134 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
