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
  assert.equal(empty.records.size, 0, 'resume never generates a replacement key');
  const invalid = fakeIndexedDB();
  invalid.records.set('host-p256', {version:1,privateKey:{type:'private',extractable:true},publicKey:{}});
  await assert.rejects(createBrowserDeviceSigner(env(invalid)).ready(), /BROWSER_DEVICE_KEY_LOST_OR_INVALID/);
});

test('simulated Host state: even valid proof cannot authorize pending/revoked/replayed grant', async () => {
  const signer = createBrowserDeviceSigner(env());
  const pem = await signer.publicKeyPem();
  const nonce = 'f'.repeat(32), time = String(Date.now());
  const sig = await signer.signSession('g', nonce, time, 'https://pc.ts.net', 'owner');
  const wire = ['vivim-session-v1','g',nonce,time,'https://pc.ts.net','owner'].join('\\n');
  const used = new Set();
  const authorize = status => status === 'active' && !used.has(nonce) && verifySig(pem,sig,wire);
  assert.equal(authorize('pending'),false);
  assert.equal(authorize('revoked'),false);
  assert.equal(authorize('active'),true);
  used.add(nonce);
  assert.equal(authorize('active'),false);
});
