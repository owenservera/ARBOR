# File: apps/vivim-host/apk/enrollment.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/apk/enrollment.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11639 B |
| Lines | 213 |
| Hash | 166c41d14f80 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CHALLENGE_TTL_MS | const | 10 | no | const CHALLENGE_TTL_MS = 10 * 60 * 1000; // 10 minutes |
| GRANT_DIR_NAME | const | 11 | no | const GRANT_DIR_NAME = &#39;device-grants&#39;; |
| fail | function | 12 | no | const fail = (code, status = 403) =&gt; { throw Object.assign(new Error(code), { status, code }); }; |
| same | function | 13 | no | const same = (a, b) =&gt; { |
| x | const | 14 | no | const x = Buffer.from(String(a ?? &#39;&#39;)); const y = Buffer.from(String(b ?? &#39;&#39;)); |
| requireDeviceSignature | function | 17 | no | const requireDeviceSignature = (pem, message, signature) =&gt; { |
| key | variable | 20 | no | let key; |
| createEnrollment | function | 32 | yes | export function createEnrollment({ dataRoot, origin, user }) { |
| dir | const | 33 | no | const dir = path.join(dataRoot, GRANT_DIR_NAME); |
| grantsPath | const | 35 | no | const grantsPath = path.join(dir, &#39;grants.json&#39;); |
| challenges | const | 37 | no | const challenges = new Map(); |
| BASELINE | const | 42 | no | const BASELINE=Symbol(&#39;device-grants-baseline&#39;); |
| lockPath | const | 43 | no | const lockPath=path.join(dir,&#39;grants.writer.lock&#39;); |
| digestRaw | function | 44 | no | const digestRaw=raw=&gt;raw===null?null:createHash(&#39;sha256&#39;).update(raw).digest(&#39;hex&#39;); |
| stamp | function | 45 | no | const stamp=(grants,raw)=&gt;Object.defineProperty(grants,BASELINE,{ value:digestRaw(raw),enumerable:false,configurable:false }); |
| readRaw | function | 48 | no | const readRaw=()=&gt;{ |
| loadGrants | function | 55 | no | const loadGrants=()=&gt;{ |
| raw | const | 56 | no | const raw=readRaw(); |
| parsed | variable | 58 | no | let parsed; |
| saveGrants | function | 65 | no | const saveGrants=(grants)=&gt;{ |
| lock | variable | 68 | no | let lock; |
| tmp | const | 76 | no | const tmp=grantsPath+&#39;.&#39;+randomBytes(8).toString(&#39;hex&#39;)+&#39;.tmp&#39;; |
| now | function | 87 | no | const now = () =&gt; Date.now(); |
| startChallenge | function | 90 | no | const startChallenge = ({ deviceHint } = {}) =&gt; { |
| challengeId | const | 91 | no | const challengeId = randomBytes(16).toString(&#39;hex&#39;); |
| nonce | const | 92 | no | const nonce = randomBytes(32).toString(&#39;hex&#39;); |
| challenge | const | 93 | no | const challenge = randomBytes(32).toString(&#39;hex&#39;); |
| expiresAt | const | 94 | no | const expiresAt = now() + CHALLENGE_TTL_MS; |
| prove | function | 101 | no | const prove = ({ challengeId, publicKeyPem, signature, requestedScopes = [], signedTranscript }) =&gt; { |
| entry | const | 102 | no | const entry = challenges.get(challengeId); |
| canonical | const | 108 | no | const canonical = [&#39;vivim-enrollment-v1&#39;, entry.challengeId \|\| challengeId, |
| deviceFingerprint | const | 116 | no | const deviceFingerprint = createHash(&#39;sha256&#39;).update(publicKeyPem).digest(&#39;hex&#39;); |
| deviceId | const | 117 | no | const deviceId = deviceFingerprint.slice(0, 32); |
| grantId | const | 118 | no | const grantId = randomBytes(16).toString(&#39;hex&#39;); |
| grant | const | 119 | no | const grant = { |
| grants | const | 124 | no | const grants = loadGrants(); |
| status | function | 132 | no | const status = ({ challengeId }) =&gt; { |
| entry | const | 133 | no | const entry = challenges.get(challengeId); |
| createSession | function | 142 | no | const createSession = ({ grantId, deviceKeyProof, nonce, timestamp }) =&gt; { |
| grants | const | 143 | no | const grants = loadGrants(); |
| grant | const | 144 | no | const grant = grants.find((g) =&gt; g.grantId === grantId); |
| sessionId | const | 155 | no | const sessionId = randomBytes(16).toString(&#39;hex&#39;); |
| expiresAt | const | 160 | no | const expiresAt = now() + 4 * 60 * 60 * 1000; // 4 hours |
| grant | const | 171 | no | const grant = loadGrants().find(g =&gt; g.grantId === grantId); |
| grants | const | 178 | no | const grants = loadGrants(); |
| grant | const | 179 | no | const grant = grants.find((g) =&gt; g.grantId === grantId); |
| grants | const | 192 | no | const grants = loadGrants(); |
| grant | const | 193 | no | const grant = grants.find((g) =&gt; g.grantId === grantId); |
| grants | const | 203 | no | const grants = loadGrants(); |
| grant | const | 204 | no | const grant = grants.find((g) =&gt; g.grantId === grantId); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 6 | external |
| node:fs | import | 7 | external |
| node:path | import | 8 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/direct-phone.mjs](../direct-phone.mjs.md) | ./apk/enrollment.mjs |
| [apps/vivim-host/onboarding/service.mjs](../onboarding/service.mjs.md) | ../apk/enrollment.mjs |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./apk/enrollment.mjs |
| [apps/vivim-host/test/apk-enrollment.test.mjs](../test/apk-enrollment.test.mjs.md) | ../apk/enrollment.mjs |
| [apps/vivim-host/test/control-devices.test.mjs](../test/control-devices.test.mjs.md) | ../apk/enrollment.mjs |
| [apps/vivim-host/test/control-http.test.mjs](../test/control-http.test.mjs.md) | ../apk/enrollment.mjs |
| [apps/vivim-host/test/control-wiki-phone.test.mjs](../test/control-wiki-phone.test.mjs.md) | ../apk/enrollment.mjs |
| [apps/vivim-host/test/direct-phone.test.mjs](../test/direct-phone.test.mjs.md) | ../apk/enrollment.mjs |
| [apps/vivim-host/test/enrollment-security.test.mjs](../test/enrollment-security.test.mjs.md) | ../apk/enrollment.mjs |
| [apps/vivim-host/test/first-run-phone-contract.test.mjs](../test/first-run-phone-contract.test.mjs.md) | ../apk/enrollment.mjs |
| [apps/vivim-host/test/media-stream-http.test.mjs](../test/media-stream-http.test.mjs.md) | ../apk/enrollment.mjs |
| [apps/vivim-host/test/onboarding.test.mjs](../test/onboarding.test.mjs.md) | ../apk/enrollment.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// APK07 per-device enrollment scaffolding.
// Challenges are single-use, short-lived, and bound to a Host instance. The phone
// generates its own device key (Android Keystore on device; here we accept the
// public key + signature proof) and the Host commits a scoped, revocable grant only
// after explicit owner approval (PC-only approve/revoke routes live on the Host).
import { createHash, randomBytes, createPublicKey, verify, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, renameSync, openSync, closeSync } from 'node:fs';
import path from 'node:path';

const CHALLENGE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const GRANT_DIR_NAME = 'device-grants';
const fail = (code, status = 403) => { throw Object.assign(new Error(code), { status, code }); };
const same = (a, b) => {
  const x = Buffer.from(String(a ?? '')); const y = Buffer.from(String(b ?? ''));
  return x.length === y.length && timingSafeEqual(x, y);
};
const requireDeviceSignature = (pem, message, signature) => {
  if (typeof message !== 'string' || typeof signature !== 'string' ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(signature)) fail('INVALID_DEVICE_SIGNATURE', 403);
  let key;
  try {
    key = createPublicKey(pem);
    if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1') fail('UNSUPPORTED_DEVICE_KEY', 400);
    if (!verify('sha256', Buffer.from(message, 'utf8'), key, Buffer.from(signature, 'base64'))) fail('INVALID_DEVICE_SIGNATURE', 403);
  } catch (error) {
    if (error.status) throw error;
    fail('INVALID_DEVICE_SIGNATURE', 403);
  }
};


export function createEnrollment({ dataRoot, origin, user }) {
  const dir = path.join(dataRoot, GRANT_DIR_NAME);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
  const grantsPath = path.join(dir, 'grants.json');
  // challenges: challengeId -> { challenge, nonce, expiresAt, origin, user, deviceHint }
  const challenges = new Map();

  // The same Host and Tailscale subprocesses may open independent grant-store
  // instances. CAS + exclusive lock prevents a stale writer from overwriting a
  // new approval, revoke or session. Crash-left locks deliberately fail closed.
  const BASELINE=Symbol('device-grants-baseline');
  const lockPath=path.join(dir,'grants.writer.lock');
  const digestRaw=raw=>raw===null?null:createHash('sha256').update(raw).digest('hex');
  const stamp=(grants,raw)=>Object.defineProperty(grants,BASELINE,{
    value:digestRaw(raw),enumerable:false,configurable:false
  });
  const readRaw=()=>{
    try{return readFileSync(grantsPath,'utf8');}
    catch(error) {
      if(error.code==='ENOENT')return null;
      fail('GRANT_STORE_UNREADABLE',503);
    }
  };
  const loadGrants=()=>{
    const raw=readRaw();
    if(raw===null)return stamp([],null);
    let parsed;
    try{parsed=JSON.parse(raw);}catch{fail('GRANT_STORE_CORRUPT',503);}
    if(!Array.isArray(parsed)||parsed.some(g=>!g||typeof g!=='object'||
      typeof g.grantId!=='string'||typeof g.status!=='string'||
      !Array.isArray(g.scopes)))fail('GRANT_STORE_CORRUPT',503);
    return stamp(parsed,raw);
  };
  const saveGrants=(grants)=>{
    if(!Array.isArray(grants)||!Object.hasOwn(grants,BASELINE))
      fail('GRANT_UNVERSIONED_UPDATE',409);
    let lock;
    try{lock=openSync(lockPath,'wx',0o600);}
    catch(error) {
      if(error.code==='EEXIST')fail('GRANT_WRITER_BUSY',409);
      fail('GRANT_STORE_UNREADABLE',503);
    }
    try{
      if(digestRaw(readRaw())!==grants[BASELINE])fail('GRANT_STORE_CHANGED',409);
      const tmp=grantsPath+'.'+randomBytes(8).toString('hex')+'.tmp';
      try{
        writeFileSync(tmp,JSON.stringify(grants,null,2),{mode:0o600});
        renameSync(tmp,grantsPath);
      } finally {
```

_First 80 of 214 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
