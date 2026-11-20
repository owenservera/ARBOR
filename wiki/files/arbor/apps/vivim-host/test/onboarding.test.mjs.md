# File: apps/vivim-host/test/onboarding.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/onboarding.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16978 B |
| Lines | 279 |
| Hash | c2da5ddc76a6 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| rmTolerant | function | 17 | no | const rmTolerant = (dir, attempts = 10) =&gt; { |
| THREAD | const | 28 | no | const THREAD = &#39;chatgpt-c:6ae55c0e-65bc-83eb-a0d3-8cef6db604c9&#39;; |
| F02 | const | 29 | no | const F02 = { |
| f01 | function | 35 | no | const f01 = generationId =&gt; ({ schema: &#39;vivim.bootstrap-fast/1&#39;, generationId, passId: &#39;F01&#39;, communication: { language: &#39;English&#39;, tone: &#39;direct&#39;, responseStyle: &#39;short answers first&#39; }, focus: [{ l… |
| fakeStudio | function | 44 | no | function fakeStudio({ signedIn = true, reply = &#39;fenced&#39; } = {}) { |
| conversations | const | 45 | no | const conversations = new Map(); |
| log | const | 46 | no | const log = { creates: 0, submits: 0, finishes: [] }; |
| id | const | 53 | no | const id = `conv-${log.creates}`; |
| snapshot | const | 54 | no | const snapshot = { id, revision: 1, site, state: signedIn ? &#39;ready&#39; : &#39;blocked&#39;, binding: { targetId: `tab-${id}` }, readiness: signedIn ? undefined : { reason: &#39;AUTH_WALL&#39; } }; |
| body | const | 60 | no | const body = prompt.includes(&#39;bootstrap-f02/2&#39;) ? F02 : f01(/generationId` must equal `&quot;([^&quot;]+)&quot;/.exec(prompt)?.[1]); |
| text | const | 61 | no | const text = reply === &#39;fenced&#39; ? &#39;Here you go:\\n```json\\n&#39; + JSON.stringify(body) + &#39;\\n```&#39; : JSON.stringify(body); |
| fixture | function | 70 | no | function fixture(options = {}) { |
| dataRoot | const | 71 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-onb-&#39;)); |
| runtime | const | 72 | no | const runtime = createBootstrapRuntime({ dataRoot }); |
| studio | const | 73 | no | const studio = options.studio ?? fakeStudio(options); |
| clock | variable | 74 | no | let clock = Date.parse(&#39;2026-11-01T05:00:00Z&#39;); |
| svc | const | 75 | no | const svc = createOnboardingService({ dataRoot, getRuntime: () =&gt; runtime, studio, directOrigin: &#39;https://pc.tailnet.ts.net&#39;, now: () =&gt; clock }); |
| win | const | 80 | no | const win = detectEnvironment({ platform: &#39;win32&#39;, env: { LOCALAPPDATA: &#39;C:\\\\Users\\\\o\\\\AppData\\\\Local&#39; }, home: &#39;C:\\\\Users\\\\o&#39;, exists: f =&gt; f.endsWith(&#39;msedge.exe&#39;) &amp;&amp; f.includes(&#39;(x86)&#39;), nodeVersi… |
| mac | const | 84 | no | const mac = detectEnvironment({ platform: &#39;darwin&#39;, home: &#39;/Users/o&#39;, exists: f =&gt; f.includes(&#39;Google Chrome.app&#39;) }); |
| none | const | 86 | no | const none = detectEnvironment({ platform: &#39;linux&#39;, home: &#39;/home/o&#39;, exists: () =&gt; false, nodeVersion: &#39;20.1.0&#39; }); |
| f | const | 97 | no | const f = fixture(); |
| ready | const | 99 | no | const ready = await f.svc.check(&#39;chatgpt&#39;); |
| out | const | 105 | no | const out = fixture({ signedIn: false }); |
| r | const | 107 | no | const r = await out.svc.check(&#39;chatgpt&#39;); |
| f | const | 113 | no | const f = fixture(); |
| review | const | 118 | no | const review = f.svc.review(); |
| status | const | 123 | no | const status = await f.svc.status(); |
| theme | const | 127 | no | const theme = f.runtime.status().theme; |
| f | const | 137 | no | const f = fixture({ signedIn: false }); |
| f | const | 151 | no | const f = fixture(); |
| f | const | 164 | no | const f = fixture(); |
| f | const | 172 | no | const f = fixture(); |
| phone | const | 176 | no | const phone = (await f.svc.status()).phone; |
| dataRoot | const | 184 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-onb-http-&#39;)); |
| ownerToken | const | 185 | no | const ownerToken = &#39;test-owner-token-onboarding-0123456789&#39;; |
| calls | const | 186 | no | const calls = []; |
| svc | const | 187 | no | const svc = { |
| server | const | 191 | no | const server = createHostServer({ dataRoot, onboarding: svc, ownerToken }); |
| port | const | 193 | no | const port = server.address().port, host = `127.0.0.1:${port}`; |
| call | function | 194 | no | const call = (method, route, { headers = {}, body } = {}) =&gt; new Promise((resolve, reject) =&gt; { const req = http.request({ host: &#39;127.0.0.1&#39;, port, path: route, method, headers: { host, ...headers } … |
| req | const | 195 | no | const req = http.request({ host: &#39;127.0.0.1&#39;, port, path: route, method, headers: { host, ...headers } }, res =&gt; { let data = &#39;&#39;; res.on(&#39;data&#39;, c =&gt; { data += c; }); res.on(&#39;end&#39;, () =&gt; resolve({ st… |
| data | variable | 196 | no | let data = &#39;&#39;; res.on(&#39;data&#39;, c =&gt; { data += c; }); res.on(&#39;end&#39;, () =&gt; resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null })); |
| state | const | 201 | no | const state = await call(&#39;GET&#39;, &#39;/api/onboarding/state&#39;); |
| pair | const | 204 | no | const pair = await call(&#39;GET&#39;, &#39;/api/onboarding/pair-status&#39;); |
| json | const | 208 | no | const json = { &#39;content-type&#39;: &#39;application/json&#39; }; |
| auth | const | 209 | no | const auth = { authorization: `Bearer ${ownerToken}` }; |
| okHeaders | const | 210 | no | const okHeaders = { ...json, ...auth, origin: `http://${host}`, &#39;x-vivim-control&#39;: &#39;1&#39; }; |
| affected | const | 211 | no | const affected = [ |
| unauth | const | 220 | no | const unauth = await call(&#39;POST&#39;, route, { headers: { ...json, origin: `http://${host}`, &#39;x-vivim-control&#39;: &#39;1&#39; }, body }); |
| cross | const | 222 | no | const cross = await call(&#39;POST&#39;, route, { headers: { ...json, ...auth, origin: &#39;https://evil.example&#39;, &#39;x-vivim-control&#39;: &#39;1&#39; }, body }); |
| noCsrf | const | 224 | no | const noCsrf = await call(&#39;POST&#39;, route, { headers: { ...json, ...auth, origin: `http://${host}` }, body }); |
| ok | const | 228 | no | const ok = await call(&#39;POST&#39;, &#39;/api/onboarding/primary&#39;, { headers: okHeaders, body: &#39;{&quot;provider&quot;:&quot;chatgpt&quot;}&#39; }); |
| dataRoot | const | 235 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-direct-cards-&#39;)); |
| runtime | const | 236 | no | const runtime = createBootstrapRuntime({ dataRoot }); |
| origin | const | 240 | no | const origin = &#39;https://pc.tailnet.ts.net&#39;; |
| server | const | 241 | no | const server = createHostServer({ dataRoot, bootstrap: runtime, directPhone: { origin, user: &#39;owner@example.com&#39; } }); |
| call | function | 243 | no | const call = (method, route, { headers = {}, body } = {}) =&gt; new Promise((resolve, reject) =&gt; { const req = http.request({ host: &#39;127.0.0.1&#39;, port: server.address().port, path: route, method, headers… |
| req | const | 244 | no | const req = http.request({ host: &#39;127.0.0.1&#39;, port: server.address().port, path: route, method, headers: { host: &#39;pc.tailnet.ts.net&#39;, &#39;x-forwarded-proto&#39;: &#39;https&#39;, &#39;tailscale-user-login&#39;: &#39;owner@exam… |
| data | variable | 246 | no | let data = &#39;&#39;; res.on(&#39;data&#39;, c =&gt; { data += c; }); res.on(&#39;end&#39;, () =&gt; resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null })); |
| publicKeyPem | const | 253 | no | const publicKeyPem = publicKey.export({ type: &#39;spki&#39;, format: &#39;pem&#39; }); |
| json | const | 254 | no | const json = { &#39;content-type&#39;: &#39;application/json&#39; }; |
| start | const | 255 | no | const start = (await call(&#39;POST&#39;, &#39;/mobile/api/enrollment/start&#39;, { headers: json, body: &#39;{}&#39; })).body; |
| transcript | const | 256 | no | const transcript = [&#39;vivim-enrollment-v1&#39;, start.challengeId, start.challenge, start.nonce, origin, &#39;owner@example.com&#39;].join(&#39;\\\\n&#39;); |
| enrolled | const | 257 | no | const enrolled = (await call(&#39;POST&#39;, &#39;/mobile/api/enrollment/prove&#39;, { headers: json, body: JSON.stringify({ challengeId: start.challengeId, publicKeyPem, signature: sign(&#39;sha256&#39;, Buffer.from(transc… |
| nonce | const | 264 | no | const nonce = randomBytes(16).toString(&#39;hex&#39;), timestamp = Date.now(); |
| sessionTranscript | const | 265 | no | const sessionTranscript = [&#39;vivim-session-v1&#39;, enrolled.grantId, nonce, String(timestamp), origin, &#39;owner@example.com&#39;].join(&#39;\\\\n&#39;); |
| session | const | 266 | no | const session = (await call(&#39;POST&#39;, &#39;/mobile/api/enrollment/session&#39;, { headers: json, body: JSON.stringify({ grantId: enrolled.grantId, nonce, timestamp, deviceKeyProof: sign(&#39;sha256&#39;, Buffer.from(s… |
| device | const | 271 | no | const device = { &#39;x-vivim-grant-id&#39;: enrolled.grantId, &#39;x-vivim-device-session&#39;: session.sessionId }; |
| body | const | 272 | no | const body = (await call(&#39;GET&#39;, &#39;/mobile/api/relay?path=status&#39;, { headers: device })).body; |
| bootstrap | const | 273 | no | const bootstrap = body.snapshot.bootstrap; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:http | import | 6 | external |
| node:crypto | import | 7 | external |
| ../bootstrap/runtime.mjs | import | 8 | [apps/vivim-host/bootstrap/runtime.mjs](../bootstrap/runtime.mjs.md) |
| ../onboarding/service.mjs | import | 9 | [apps/vivim-host/onboarding/service.mjs](../onboarding/service.mjs.md) |
| ../onboarding/studio-port.mjs | import | 10 | [apps/vivim-host/onboarding/studio-port.mjs](../onboarding/studio-port.mjs.md) |
| ../onboarding/environment.mjs | import | 11 | [apps/vivim-host/onboarding/environment.mjs](../onboarding/environment.mjs.md) |
| ../server.mjs | import | 12 | [apps/vivim-host/server.mjs](../server.mjs.md) |
| ../apk/enrollment.mjs | import | 13 | [apps/vivim-host/apk/enrollment.mjs](../apk/enrollment.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

````javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createOnboardingService } from '../onboarding/service.mjs';
import { createStudioPort } from '../onboarding/studio-port.mjs';
import { detectEnvironment } from '../onboarding/environment.mjs';
import { createHostServer } from '../server.mjs';
import { createEnrollment } from '../apk/enrollment.mjs';

// A closed runtime/server can keep Windows file handles busy for a few hundred ms;
// a teardown rm must never turn a passing suite red. EBUSY/EPERM/ENOTEMPTY retire.
const rmTolerant = (dir, attempts = 10) => {
  for (let i = 0; i < attempts; i++) {
    try { rmSync(dir, { recursive: true, force: true }); return; }
    catch (error) {
      if (error.code !== 'EBUSY' && error.code !== 'EPERM' && error.code !== 'ENOTEMPTY') throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
  rmSync(dir, { recursive: true, force: true }); // last try: let a real failure surface
};

const THREAD = 'chatgpt-c:6ae55c0e-65bc-83eb-a0d3-8cef6db604c9';
const F02 = {
  schema: 'vivim.bootstrap-f02/2', pass: 'F02', provisional: false,
  visual: { background: '#101820', secondary: '#1d2b3a', accent: '#e8b04b', appearance: 'dark', texture: 'aurora', mood: 'cinematic', fontFamily: 'editorial', fontSizePx: 16, headingSizePx: 32, radiusPx: 18, spacingScale: 1.05, density: 'comfortable', motion: 'slow' },
  preferences: [{ trait: 'warm amber highlights', basis: 'recurring', confidence: 0.7, scope: 'global' }],
  dislikes: [], unknowns: ['exact favourite typeface']
};
const f01 = generationId => ({
  schema: 'vivim.bootstrap-fast/1', generationId, passId: 'F01',
  communication: { language: 'English', tone: 'direct', responseStyle: 'short answers first' },
  focus: [{ label: 'VIVIM local-first harness', kind: 'project', freshness: 'current', basis: 'explicitly_stated', explanation: 'Building a local-first provider harness.' }],
  unknowns: ['preferred working hours'],
  suggestedCards: [{ title: 'VIVIM project', focus: 'VIVIM local-first harness' }]
});

// A fake Studio that behaves like the real conversation API: fresh owned tabs, one journaled turn per key.
function fakeStudio({ signedIn = true, reply = 'fenced' } = {}) {
  const conversations = new Map();
  const log = { creates: 0, submits: 0, finishes: [] };
  return {
    log,
    reachable: async () => true,
    sites: async () => [{ id: 'chatgpt' }, { id: 'claude' }],
    async create({ site }) {
      log.creates++;
      const id = `conv-${log.creates}`;
      const snapshot = { id, revision: 1, site, state: signedIn ? 'ready' : 'blocked', binding: { targetId: `tab-${id}` }, readiness: signedIn ? undefined : { reason: 'AUTH_WALL' } };
      conversations.set(id, { ...snapshot, turns: [] });
      return snapshot;
    },
    async submit(id, { key, prompt }) {
      log.submits++;
      const body = prompt.includes('bootstrap-f02/2') ? F02 : f01(/generationId` must equal `"([^"]+)"/.exec(prompt)?.[1]);
      const text = reply === 'fenced' ? 'Here you go:\n```json\n' + JSON.stringify(body) + '\n```' : JSON.stringify(body);
      conversations.get(id).turns.push({ key, phase: 'observed', send: { state: 'observed' }, reply: { verified: true, settled: true, text } });
      return {};
    },
    async get(id) { const c = conversations.get(id); return { ...c, identity: { state: 'bound' }, binding: { ...c.binding, thread: { ref: THREAD } } }; },
    async finish(id, args) { log.finishes.push([id, args]); return {}; }
  };
}

function fixture(options = {}) {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-onb-'));
  const runtime = createBootstrapRuntime({ dataRoot });
  const studio = options.studio ?? fakeStudio(options);
  let clock = Date.parse('2026-11-01T05:00:00Z');
  const svc = createOnboardingService({ dataRoot, getRuntime: () => runtime, studio, directOrigin: 'https://pc.tailnet.ts.net', now: () => clock });
  return { dataRoot, runtime, studio, svc, advance: ms => { clock += ms; }, dispose: () => { runtime.close(); try { rmTolerant(dataRoot); } catch { /* leftover temp: runtime handles can outlive close on Windows; the assertions above already decided the outcome */ } } };
}

test('environment detection finds the browser on each platform and never invents one', () => {
  const win = detectEnvironment({ platform: 'win32', env: { LOCALAPPDATA: 'C:\\Users\\o\\AppData\\Local' }, home: 'C:\\Users\\o', exists: f => f.endsWith('msedge.exe') && f.includes('(x86)'), nodeVersion: '22.3.0' });
````

_First 80 of 280 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
