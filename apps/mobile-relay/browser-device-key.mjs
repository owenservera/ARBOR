// Browser-only device proof for the existing Host P-256 ECDSA grant protocol.
// A nonextractable private CryptoKey is persisted in IndexedDB, never localStorage.
// Key possession alone never approves a grant: Host approval, revocation and
// one-shot session nonces remain authoritative. No service worker can read this key.
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
    preflight();
    const db = await openDatabase(indexedDB);
    try {
      let pair = await transact(db, 'readonly');
      if (!pair) {
        const generated = await crypto.subtle.generateKey(ALGORITHM, false, ['sign', 'verify']);
        if (!validKeys({ version: 1, ...generated }))
          throw unavailable('NONEXTRACTABLE_BROWSER_DEVICE_KEY_REQUIRED');
        // Transaction get-then-put is serialized across tabs. First key wins.
        pair = await transact(db, 'readwrite', generated);
      }
      if (!validKeys(pair)) throw unavailable('BROWSER_DEVICE_KEY_LOST_OR_INVALID');
      return pair;
    } finally { db.close(); }
  }
  function keys() {
    if (!inFlight) inFlight = load().catch(error => { inFlight = null; throw error; });
    return inFlight;
  }
  async function requireExisting() {
    preflight();
    const db = await openDatabase(indexedDB);
    let pair;
    try { pair = await transact(db, 'readonly'); }
    finally { db.close(); }
    if (!pair) throw unavailable('BROWSER_DEVICE_KEY_MISSING');
    if (!validKeys(pair)) throw unavailable('BROWSER_DEVICE_KEY_LOST_OR_INVALID');
    inFlight = Promise.resolve(pair);
    return true;
  }
  const encode64 = bytes => base64(Array.from(bytes, x => String.fromCharCode(x)).join(''));
  async function signTranscript(fields) {
    const pair = await keys();
    const bytes = new Encoder().encode(fields.join('\\n'));
    const raw = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pair.privateKey, bytes);
    return encode64(derEncodeP256(raw)); // Node Host verifier requires ASN.1 DER, not P1363.
  }
  return Object.freeze({
    kind: 'browser',
    ready: async () => { await keys(); return true; },
    requireExisting,
    async publicKeyPem() {
      const pair = await keys();
      const spki = await crypto.subtle.exportKey('spki', pair.publicKey);
      const encoded = encode64(new Uint8Array(spki));
      return '-----BEGIN PUBLIC KEY-----\n' + encoded.match(/.{1,64}/g).join('\n') + '\n-----END PUBLIC KEY-----\n';
    },
    signEnrollment: (id, challenge, nonce, origin, user) =>
      signTranscript(['vivim-enrollment-v1', id, challenge, nonce, origin, user]),
    signSession: (grantId, nonce, timestamp, origin, user) =>
      signTranscript(['vivim-session-v1', grantId, nonce, timestamp, origin, user]),
  });
}
