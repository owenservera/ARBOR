# File: apps/vivim-host/test/first-run-phone-contract.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/first-run-phone-contract.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7013 B |
| Lines | 126 |
| Hash | c63d368cc1e5 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dataRoot | const | 15 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-first-phone-&#39;)); |
| directOrigin | const | 16 | no | const directOrigin = &#39;https://pc.tailnet.ts.net&#39;; |
| ownerToken | const | 19 | no | const ownerToken = randomBytes(32).toString(&#39;hex&#39;); |
| server | const | 20 | no | const server = createHostServer({ dataRoot, ownerToken, directPhone: { origin: directOrigin, user: &#39;owner@example.com&#39; } }); |
| port | const | 24 | no | const port = server.address().port; |
| call | function | 25 | no | const call = (method, route, { direct = false, body, headers: extra = {} } = {}) =&gt; new Promise((resolve, reject) =&gt; { const headers = { host: direct ? &#39;pc.tailnet.ts.net&#39; : &#39;127.0.0.1:&#39; + port, ...(… |
| headers | const | 26 | no | const headers = { |
| req | const | 33 | no | const req = http.request({ hostname: &#39;127.0.0.1&#39;, port, path: route, method, headers }, response =&gt; { const chunks = []; response.on(&#39;data&#39;, chunk =&gt; chunks.push(chunk)); response.on(&#39;end&#39;, () =&gt; { t… |
| chunks | const | 34 | no | const chunks = []; |
| text | const | 38 | no | const text = Buffer.concat(chunks).toString(&#39;utf8&#39;); |
| before | const | 48 | no | const before = await call(&#39;GET&#39;, &#39;/api/onboarding/pair-status&#39;); |
| issued | const | 52 | no | const issued = await call(&#39;POST&#39;, &#39;/api/onboarding/pair/register&#39;, { body: {platform:&#39;android&#39;,app:&#39;vivim-mobile&#39;}, headers: { origin: &#39;http://127.0.0.1:&#39; + port, &#39;x-vivim-control&#39;: &#39;1&#39;, authorizatio… |
| proof | const | 63 | no | const proof = await call(&#39;POST&#39;, &#39;/mobile/api/pair&#39;, { direct:true, body:{token:issued.body.token} }); |
| publicKeyPem | const | 74 | no | const publicKeyPem = publicKey.export({ type: &#39;spki&#39;, format: &#39;pem&#39; }); |
| transcript | const | 75 | no | const transcript = [&#39;vivim-enrollment-v1&#39;, proof.body.challengeId, proof.body.challenge, |
| enrolled | const | 77 | no | const enrolled = await call(&#39;POST&#39;, &#39;/mobile/api/enrollment/prove&#39;, { direct:true, body:{ challengeId: proof.body.challengeId, publicKeyPem, signature: sign(&#39;sha256&#39;, Buffer.from(transcript, &#39;utf8&#39;),… |
| pending | const | 86 | no | const pending = await call(&#39;GET&#39;, &#39;/api/onboarding/pair-status&#39;); |
| owner | const | 89 | no | const owner = createEnrollment({ dataRoot, origin: null, user: null }); |
| sessionNonce | const | 94 | no | const sessionNonce = randomBytes(16).toString(&#39;hex&#39;); |
| sessionTimestamp | const | 95 | no | const sessionTimestamp = Date.now(); |
| sessionTranscript | const | 96 | no | const sessionTranscript = [&#39;vivim-session-v1&#39;, enrolled.body.grantId, sessionNonce, |
| session | const | 98 | no | const session = await call(&#39;POST&#39;, &#39;/mobile/api/enrollment/session&#39;, { direct:true, body:{ grantId: enrolled.body.grantId, nonce: sessionNonce, timestamp: sessionTimestamp, deviceKeyProof: sign(&#39;sha2… |
| device | const | 104 | no | const device = { &#39;x-vivim-grant-id&#39;: enrolled.body.grantId, &#39;x-vivim-device-session&#39;: session.body.sessionId }; |
| pc | const | 107 | no | const pc = await call(&#39;GET&#39;, &#39;/api/onboarding/pair-status&#39;); |
| guided | const | 111 | no | const guided = await call(&#39;GET&#39;, &#39;/api/onboarding/state&#39;); |
| repeated | const | 117 | no | const repeated = await call(&#39;POST&#39;, &#39;/mobile/api/pair&#39;, { direct:true, body:{token:issued.body.token} }); |
| attacker | const | 120 | no | const attacker = await call(&#39;POST&#39;, &#39;/mobile/api/pair&#39;, { direct:true, body:{token:&#39;a&#39;.repeat(64)} }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:http | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:fs | import | 6 | external |
| node:crypto | import | 7 | external |
| ../server.mjs | import | 8 | [apps/vivim-host/server.mjs](../server.mjs.md) |
| ../apk/enrollment.mjs | import | 9 | [apps/vivim-host/apk/enrollment.mjs](../apk/enrollment.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { createHostServer } from '../server.mjs';
import { createEnrollment } from '../apk/enrollment.mjs';

// Contract integration across the actual Host route, file-backed token store,
// authenticated Direct proxy route and onboarding status projection. No fake
// pairing endpoint or second browser owner is involved.
test('an installed phone redeems a single-use Direct token and the PC observes the same device', async () => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-first-phone-'));
  const directOrigin = 'https://pc.tailnet.ts.net';
  // Pair registration is a privileged owner POST: it needs the Host owner
  // capability as well as the Direct identity. Mint one for this run.
  const ownerToken = randomBytes(32).toString('hex');
  const server = createHostServer({
    dataRoot, ownerToken, directPhone: { origin: directOrigin, user: 'owner@example.com' }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const call = (method, route, { direct = false, body, headers: extra = {} } = {}) => new Promise((resolve, reject) => {
    const headers = {
      host: direct ? 'pc.tailnet.ts.net' : '127.0.0.1:' + port,
      ...(direct ? { 'x-forwarded-proto': 'https', 'tailscale-user-login': 'owner@example.com',
                     origin: directOrigin } : {}),
      ...extra
    };
    if (body !== undefined) headers['content-type'] = 'application/json';
    const req = http.request({ hostname: '127.0.0.1', port, path: route, method, headers }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        try {
          const text = Buffer.concat(chunks).toString('utf8');
          resolve({ status: response.statusCode, body: text ? JSON.parse(text) : null });
        } catch (error) { reject(error); }
      });
    });
    req.on('error', reject);
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
  try {
    const before = await call('GET', '/api/onboarding/pair-status');
    assert.equal(before.status, 200);
    assert.equal(before.body.paired, false);

    const issued = await call('POST', '/api/onboarding/pair/register', {
      body: {platform:'android',app:'vivim-mobile'},
      headers: { origin: 'http://127.0.0.1:' + port, 'x-vivim-control': '1',
        authorization: 'Bearer ' + ownerToken }
    });
    assert.equal(issued.status, 201);
    assert.match(issued.body.token, /^[a-f0-9]{64}$/);
    assert.ok(issued.body.expiresAt > Date.now());

    // QR redemption is discovery only: it consumes the token and issues an
    // enrollment challenge. It never pairs a device or mints a trusted ID.
    const proof = await call('POST', '/mobile/api/pair', { direct:true, body:{token:issued.body.token} });
    assert.equal(proof.status, 202);
    assert.equal(proof.body.ok, true);
    assert.equal(proof.body.paired, false);
    assert.equal(proof.body.enrollmentRequired, true);
    assert.equal(typeof proof.body.challengeId, 'string');
    assert.equal(typeof proof.body.challenge, 'string');
    assert.equal(typeof proof.body.nonce, 'string');

    // The phone proves the canonical transcript with a real EC P-256 device key.
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
    const transcript = ['vivim-enrollment-v1', proof.body.challengeId, proof.body.challenge,
      proof.body.nonce, directOrigin, 'owner@example.com'].join('\\n');
    const enrolled = await call('POST', '/mobile/api/enrollment/prove', { direct:true, body:{
      challengeId: proof.body.challengeId, publicKeyPem,
      signature: sign('sha256', Buffer.from(transcript, 'utf8'), privateKey).toString('base64'),
      signedTranscript: transcript, requestedScopes: ['relay:read', 'relay:write'] } });
```

_First 80 of 127 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
