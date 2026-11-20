# File: apps/vivim-host/test/enrollment-security.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/enrollment-security.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10796 B |
| Lines | 161 |
| Hash | c83bf74feed5 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dataRoot | const | 10 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-enrollment-&#39;)); |
| origin | const | 12 | no | const origin = &#39;https://phone.example.ts.net&#39;, user = &#39;owner@example.com&#39;; |
| e | const | 13 | no | const e = createEnrollment({dataRoot, origin, user}); |
| publicKeyPem | const | 15 | no | const publicKeyPem = publicKey.export({type:&#39;spki&#39;,format:&#39;pem&#39;}); |
| first | const | 16 | no | const first = e.startChallenge(); |
| transcript | const | 17 | no | const transcript = [&#39;vivim-enrollment-v1&#39;,first.challengeId,first.challenge,first.nonce,origin,user].join(&#39;\\\\n&#39;); |
| signature | const | 20 | no | const signature = sign(&#39;sha256&#39;,Buffer.from(transcript),privateKey).toString(&#39;base64&#39;); |
| grant | const | 21 | no | const grant = e.prove({challengeId:first.challengeId,publicKeyPem,signature,signedTranscript:transcript,requestedScopes:[&#39;control:read&#39;]}); |
| nonce | const | 27 | no | const nonce = randomBytes(16).toString(&#39;hex&#39;), timestamp = Date.now(); |
| sessionTranscript | const | 28 | no | const sessionTranscript = [&#39;vivim-session-v1&#39;,grant.grantId,nonce,String(timestamp),origin,user].join(&#39;\\\\n&#39;); |
| deviceKeyProof | const | 29 | no | const deviceKeyProof = sign(&#39;sha256&#39;,Buffer.from(sessionTranscript),privateKey).toString(&#39;base64&#39;); |
| active | const | 30 | no | const active = e.createSession({grantId:grant.grantId,nonce,timestamp,deviceKeyProof}); |
| dataRoot | const | 39 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-enrollment-replay-&#39;)); |
| origin | const | 41 | no | const origin = &#39;https://phone.example.ts.net&#39;, user = &#39;owner@example.com&#39;; |
| e | const | 42 | no | const e = createEnrollment({ dataRoot, origin, user }); |
| publicKeyPem | const | 44 | no | const publicKeyPem = publicKey.export({ type: &#39;spki&#39;, format: &#39;pem&#39; }); |
| challenge | const | 45 | no | const challenge = e.startChallenge(); |
| transcript | const | 46 | no | const transcript = [&#39;vivim-enrollment-v1&#39;, challenge.challengeId, challenge.challenge, challenge.nonce, origin, user].join(&#39;\\\\n&#39;); |
| signature | const | 47 | no | const signature = sign(&#39;sha256&#39;, Buffer.from(transcript), privateKey).toString(&#39;base64&#39;); |
| session | function | 51 | no | function session(nonce) { |
| timestamp | const | 52 | no | const timestamp = Date.now(); |
| proof | const | 53 | no | const proof = sign(&#39;sha256&#39;, Buffer.from([&#39;vivim-session-v1&#39;, grantId, nonce, String(timestamp), origin, user].join(&#39;\\\\n&#39;)), privateKey).toString(&#39;base64&#39;); |
| a | const | 56 | no | const a = session(randomBytes(16).toString(&#39;hex&#39;)); |
| b | const | 57 | no | const b = session(randomBytes(16).toString(&#39;hex&#39;)); |
| first | const | 58 | no | const first = e.createSession(a); |
| second | const | 59 | no | const second = e.createSession(b); |
| dataRoot | const | 67 | no | const dataRoot=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-grant-atomic-&#39;)); |
| origin | const | 69 | no | const origin=&#39;https://phone.example.ts.net&#39;,user=&#39;owner@example.com&#39;; |
| enrollment | const | 70 | no | const enrollment=createEnrollment({dataRoot,origin,user}); |
| first | const | 72 | no | const first=enrollment.startChallenge(); |
| signedTranscript | const | 73 | no | const signedTranscript=[&#39;vivim-enrollment-v1&#39;,first.challengeId,first.challenge,first.nonce,origin,user].join(&#39;\\\\n&#39;); |
| grant | const | 74 | no | const grant=enrollment.prove({challengeId:first.challengeId, publicKeyPem:publicKey.export({type:&#39;spki&#39;,format:&#39;pem&#39;}), signature:sign(&#39;sha256&#39;,Buffer.from(signedTranscript),privateKey).toString(&#39;bas… |
| dataRoot | const | 85 | no | const dataRoot=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-grants-corrupt-&#39;)); |
| dir | const | 87 | no | const dir=path.join(dataRoot,&#39;device-grants&#39;);mkdirSync(dir,{recursive:true}); |
| authority | const | 89 | no | const authority=createEnrollment({dataRoot,origin:&#39;https://phone.example.ts.net&#39;,user:&#39;owner@example.com&#39;}); |
| dataRoot | const | 97 | no | const dataRoot=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-key-identity-&#39;)); |
| origin | const | 99 | no | const origin=&#39;https://phone.example.ts.net&#39;,user=&#39;owner@example.com&#39;; |
| authority | const | 100 | no | const authority=createEnrollment({dataRoot,origin,user}); |
| publicKeyPem | const | 102 | no | const publicKeyPem=publicKey.export({type:&#39;spki&#39;,format:&#39;pem&#39;}); |
| prove | function | 103 | no | const prove=()=&gt;{ |
| challenge | const | 104 | no | const challenge=authority.startChallenge(); |
| transcript | const | 105 | no | const transcript=[&#39;vivim-enrollment-v1&#39;,challenge.challengeId,challenge.challenge,challenge.nonce,origin,user].join(&#39;\\\\n&#39;); |
| first | const | 110 | no | const first=prove(),second=prove(); |
| dataRoot | const | 118 | no | const dataRoot=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-locked-grants-&#39;)); |
| origin | const | 120 | no | const origin=&#39;https://phone.example.ts.net&#39;,user=&#39;owner@example.com&#39;; |
| authority | const | 121 | no | const authority=createEnrollment({dataRoot,origin,user}); |
| challenge | const | 123 | no | const challenge=authority.startChallenge(); |
| signedTranscript | const | 124 | no | const signedTranscript=[&#39;vivim-enrollment-v1&#39;,challenge.challengeId,challenge.challenge, |
| proof | const | 126 | no | const proof={challengeId:challenge.challengeId, |
| lock | const | 130 | no | const lock=path.join(dataRoot,&#39;device-grants&#39;,&#39;grants.writer.lock&#39;); |
| fd | const | 131 | no | const fd=openSync(lock,&#39;wx&#39;,0o600); |
| dataRoot | const | 139 | no | const dataRoot=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-grants-cas-&#39;)); |
| origin | const | 141 | no | const origin=&#39;https://phone.example.ts.net&#39;,user=&#39;owner@example.com&#39;; |
| phone | const | 142 | no | const phone=createEnrollment({dataRoot,origin,user}),owner=createEnrollment({dataRoot,origin:null,user:null}); |
| challenge | const | 144 | no | const challenge=phone.startChallenge(); |
| transcript | const | 145 | no | const transcript=[&#39;vivim-enrollment-v1&#39;,challenge.challengeId,challenge.challenge, |
| grant | const | 147 | no | const grant=phone.prove({challengeId:challenge.challengeId, publicKeyPem:publicKey.export({type:&#39;spki&#39;,format:&#39;pem&#39;}), signature:sign(&#39;sha256&#39;,Buffer.from(transcript),privateKey).toString(&#39;base64&#39;), … |
| revoked | variable | 151 | no | let revoked=false; |
| narrowed | const | 152 | no | const narrowed=new Proxy([&#39;relay:read&#39;],{get(target,key,receiver){ if(key===&#39;some&#39; &amp;&amp; !revoked){ revoked=true;owner.revokeGrant({grantId:grant.grantId,revokedBy:&#39;pc-owner&#39;}); } return Reflect.get(tar… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:crypto | import | 3 | external |
| node:fs | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| ../apk/enrollment.mjs | import | 7 | [apps/vivim-host/apk/enrollment.mjs](../apk/enrollment.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, openSync, closeSync, unlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createEnrollment } from '../apk/enrollment.mjs';

test('enrollment rejects forged proof and creates key-backed session only after PC approval', (t) => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-enrollment-'));
  t.after(() => rmSync(dataRoot, { recursive: true, force: true }));
  const origin = 'https://phone.example.ts.net', user = 'owner@example.com';
  const e = createEnrollment({dataRoot, origin, user});
  const {publicKey, privateKey} = generateKeyPairSync('ec', {namedCurve:'prime256v1'});
  const publicKeyPem = publicKey.export({type:'spki',format:'pem'});
  const first = e.startChallenge();
  const transcript = ['vivim-enrollment-v1',first.challengeId,first.challenge,first.nonce,origin,user].join('\\n');
  assert.throws(() => e.prove({challengeId:first.challengeId,publicKeyPem,signature:'AAAA',signedTranscript:transcript}), /INVALID_DEVICE_SIGNATURE/);
  assert.throws(() => e.prove({challengeId:first.challengeId,publicKeyPem,signature:'AAAA',signedTranscript:'attacker'}), /TRANSCRIPT_MISMATCH/);
  const signature = sign('sha256',Buffer.from(transcript),privateKey).toString('base64');
  const grant = e.prove({challengeId:first.challengeId,publicKeyPem,signature,signedTranscript:transcript,requestedScopes:['control:read']});
  assert.equal(grant.status,'pending');
  assert.throws(() => e.createSession({grantId:grant.grantId}), /GRANT_NOT_ACTIVE/);
  assert.ok(!('publicKeyPem' in e.listGrants()[0]));
  e.approveGrant({grantId:grant.grantId,approvedScopes:['control:read'],approvedBy:'pc-owner'});
  assert.throws(() => e.createSession({grantId:grant.grantId,nonce:'a'.repeat(32),timestamp:Date.now(),deviceKeyProof:'AAAA'}), /INVALID_DEVICE_SIGNATURE/);
  const nonce = randomBytes(16).toString('hex'), timestamp = Date.now();
  const sessionTranscript = ['vivim-session-v1',grant.grantId,nonce,String(timestamp),origin,user].join('\\n');
  const deviceKeyProof = sign('sha256',Buffer.from(sessionTranscript),privateKey).toString('base64');
  const active = e.createSession({grantId:grant.grantId,nonce,timestamp,deviceKeyProof});
  assert.equal(active.grantId,grant.grantId);
  assert.equal(e.validateGrant({grantId:grant.grantId,sessionId:active.sessionId}).grantId,grant.grantId);
  assert.throws(() => e.createSession({grantId:grant.grantId,nonce,timestamp,deviceKeyProof}), /SESSION_PROOF_REPLAY/);
  e.revokeGrant({grantId:grant.grantId,revokedBy:'pc-owner'});
  assert.throws(() => e.validateGrant({grantId:grant.grantId,sessionId:active.sessionId}), /GRANT_NOT_ACTIVE/);
});

test('a prior device signature cannot restore an earlier session; approval cannot escalate scope', (t) => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-enrollment-replay-'));
  t.after(() => rmSync(dataRoot, { recursive: true, force: true }));
  const origin = 'https://phone.example.ts.net', user = 'owner@example.com';
  const e = createEnrollment({ dataRoot, origin, user });
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  const challenge = e.startChallenge();
  const transcript = ['vivim-enrollment-v1', challenge.challengeId, challenge.challenge, challenge.nonce, origin, user].join('\\n');
  const signature = sign('sha256', Buffer.from(transcript), privateKey).toString('base64');
  const { grantId } = e.prove({ challengeId: challenge.challengeId, publicKeyPem, signature, signedTranscript: transcript, requestedScopes: ['relay:read', 'relay:write'] });
  assert.throws(() => e.approveGrant({ grantId, approvedScopes: ['control:execute'], approvedBy: 'owner' }), /INVALID_APPROVED_SCOPES/);
  e.approveGrant({ grantId, approvedScopes: ['relay:read'], approvedBy: 'owner' });
  function session(nonce) {
    const timestamp = Date.now();
    const proof = sign('sha256', Buffer.from(['vivim-session-v1', grantId, nonce, String(timestamp), origin, user].join('\\n')), privateKey).toString('base64');
    return { grantId, nonce, timestamp, deviceKeyProof: proof };
  }
  const a = session(randomBytes(16).toString('hex'));
  const b = session(randomBytes(16).toString('hex'));
  const first = e.createSession(a);
  const second = e.createSession(b);
  assert.throws(() => e.validateGrant({ grantId, sessionId: first.sessionId }), /SESSION_MISMATCH/);
  assert.throws(() => e.createSession(a), /SESSION_PROOF_REPLAY/);
  assert.equal(e.validateGrant({ grantId, sessionId: second.sessionId }).grantId, grantId);
  assert.ok(!('usedSessionNonces' in e.listGrants()[0]));
});

test('invalid owner-approved scopes never activate a pending grant',t=>{
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-grant-atomic-'));
  t.after(()=>rmSync(dataRoot,{recursive:true,force:true}));
  const origin='https://phone.example.ts.net',user='owner@example.com';
  const enrollment=createEnrollment({dataRoot,origin,user});
  const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const first=enrollment.startChallenge();
  const signedTranscript=['vivim-enrollment-v1',first.challengeId,first.challenge,first.nonce,origin,user].join('\\n');
  const grant=enrollment.prove({challengeId:first.challengeId,
    publicKeyPem:publicKey.export({type:'spki',format:'pem'}),
    signature:sign('sha256',Buffer.from(signedTranscript),privateKey).toString('base64'),
    signedTranscript,requestedScopes:['relay:read']});
  assert.throws(()=>enrollment.approveGrant({grantId:grant.grantId,
    approvedScopes:['relay:read','control:execute'],approvedBy:'owner'}),/INVALID_APPROVED_SCOPES/);
  assert.equal(enrollment.grantStatus({grantId:grant.grantId}).status,'pending');
```

_First 80 of 162 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
