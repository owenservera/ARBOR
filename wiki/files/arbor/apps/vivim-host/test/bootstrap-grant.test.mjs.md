# File: apps/vivim-host/test/bootstrap-grant.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/bootstrap-grant.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 21454 B |
| Lines | 410 |
| Hash | 5c2c7eb45a47 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TOKEN | const | 16 | no | const TOKEN = &#39;test-owner-token-0123456789abcdef0123456789abcdef&#39;; |
| ISO | const | 17 | no | const ISO = &#39;2026-11-02T10:00:00.000Z&#39;; |
| DIGEST_A | const | 18 | no | const DIGEST_A = &#39;a&#39;.repeat(64); |
| DIGEST_B | const | 19 | no | const DIGEST_B = &#39;b&#39;.repeat(64); |
| F02 | const | 20 | no | const F02 = { |
| tempDir | function | 28 | no | function tempDir(prefix) { |
| openService | function | 33 | no | function openService(dir, { now = () =&gt; ISO, grant = null } = {}) { |
| ledger | const | 34 | no | const ledger = openLedger({ file: path.join(dir, &#39;ledger.db&#39;) }); |
| svc | const | 35 | no | const svc = createBootstrapService({ ledger, now }); |
| dir | const | 41 | no | const dir = tempDir(&#39;vivim-grant-bounds-&#39;); |
| grant | const | 44 | no | const grant = svc.grantBootstrap({ scope: &#39;full-bootstrap&#39; }); |
| stored | const | 56 | no | const stored = JSON.parse(ledger.meta.get(&#39;grant.bootstrap&#39;)); |
| dir | const | 63 | no | const dir = tempDir(&#39;vivim-grant-expired-&#39;); |
| clock | variable | 65 | no | let clock = ISO; |
| claim | const | 77 | no | const claim = svc.consumeGrantSend({ requestId: &#39;send-renewed&#39; }); |
| dir | const | 83 | no | const dir = tempDir(&#39;vivim-grant-digest-&#39;); |
| claim | const | 91 | no | const claim = svc.consumeGrantSend({ promptDigest: DIGEST_A, requestId: &#39;send-a&#39; }); |
| dir | const | 98 | no | const dir = tempDir(&#39;vivim-grant-cap-&#39;); |
| claim | const | 103 | no | const claim = svc.consumeGrantSend({ requestId: &#39;send-&#39; + i }); |
| preset | const | 113 | no | const preset = svc.choosePreset({ preset: &#39;grove&#39;, requestId: &#39;owner-after-cap&#39; }); |
| dir | const | 119 | no | const dir = tempDir(&#39;vivim-grant-shared-&#39;); |
| writer | const | 121 | no | const writer = openService(dir, { grant: { scope: &#39;full-bootstrap&#39;, maxSends: 2 } }); |
| reader | const | 122 | no | const reader = openService(dir); |
| dir | const | 140 | no | const dir = tempDir(&#39;vivim-grant-race-&#39;); |
| ledgerFile | const | 142 | no | const ledgerFile = path.join(dir, &#39;ledger.db&#39;); |
| issuer | const | 143 | no | const issuer = openLedger({ file: ledgerFile }); |
| serviceUrl | const | 147 | no | const serviceUrl = new URL(&#39;../bootstrap/service.mjs&#39;, import.meta.url).href; |
| ledgerUrl | const | 148 | no | const ledgerUrl = new URL(&#39;../bootstrap/ledger.mjs&#39;, import.meta.url).href; |
| child | const | 149 | no | const child = ` |
| ledger | const | 153 | no | const ledger = openLedger({ file: process.env.VIVIM_TEST_LEDGER }); |
| svc | const | 154 | no | const svc = createBootstrapService({ ledger, worldId: &#39;world-local&#39;, now: () =&gt; ${JSON.stringify(ISO)} }); |
| out | variable | 155 | no | let out; |
| claim | const | 157 | no | const claim = svc.consumeGrantSend({ requestId: process.env.VIVIM_TEST_REQ }); |
| run | function | 165 | no | const run = (index) =&gt; new Promise((resolve, reject) =&gt; { const result = path.join(dir, &#39;result-&#39; + index + &#39;.json&#39;); const childProcess = spawn(process.execPath, [&#39;--input-type=module&#39;, &#39;-e&#39;, child]… |
| result | const | 166 | no | const result = path.join(dir, &#39;result-&#39; + index + &#39;.json&#39;); |
| childProcess | const | 167 | no | const childProcess = spawn(process.execPath, [&#39;--input-type=module&#39;, &#39;-e&#39;, child], { env: { ...process.env, VIVIM_TEST_LEDGER: ledgerFile, VIVIM_TEST_REQ: &#39;race-&#39; + index, VIVIM_TEST_RESULT: result }… |
| results | const | 177 | no | const results = await Promise.all([0, 1, 2, 3, 4].map(run)); |
| granted | const | 178 | no | const granted = results.filter(r =&gt; r.ok); |
| refused | const | 179 | no | const refused = results.filter(r =&gt; !r.ok); |
| after | const | 184 | no | const after = openLedger({ file: ledgerFile }); |
| state | const | 185 | no | const state = createBootstrapService({ ledger: after, now: () =&gt; ISO }).grantState(); |
| dir | const | 191 | no | const dir = tempDir(&#39;vivim-grant-revoked-&#39;); |
| dir | const | 206 | no | const dir = tempDir(&#39;vivim-grant-legacy-&#39;); |
| ledger | const | 208 | no | const ledger = openLedger({ file: path.join(dir, &#39;ledger.db&#39;) }); |
| svc | const | 213 | no | const svc = createBootstrapService({ ledger, now: () =&gt; ISO }); |
| preset | const | 214 | no | const preset = svc.choosePreset({ preset: &#39;grove&#39;, requestId: &#39;owner-legacy&#39; }); |
| claim | const | 216 | no | const claim = svc.consumeGrantSend({ promptDigest: DIGEST_B, requestId: &#39;send-legacy&#39; }); |
| state | const | 220 | no | const state = svc.grantState(); |
| dir | const | 227 | no | const dir = tempDir(&#39;vivim-grant-owner-&#39;); |
| runtime | const | 229 | no | const runtime = createBootstrapRuntime({ dataRoot: dir, file: &#39;:memory:&#39; }); |
| server | const | 230 | no | const server = createHostServer({ dataRoot: dir, bootstrap: runtime, ownerToken: TOKEN }); |
| base | const | 232 | no | const base = &#39;http://127.0.0.1:&#39; + server.address().port; |
| post | function | 233 | no | const post = (headers = {}) =&gt; fetch(base + &#39;/api/host/bootstrap/grant&#39;, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39;, &#39;x-vivim-bootstrap&#39;: &#39;1&#39;, ...headers }, body: JSON.stringify(… |
| noToken | const | 238 | no | const noToken = await post(); |
| wrongToken | const | 240 | no | const wrongToken = await post({ authorization: &#39;Bearer wrong-owner-token-0123456789abcdef0123456789abcdef&#39; }); |
| notBearer | const | 242 | no | const notBearer = await post({ authorization: TOKEN }); |
| granted | const | 246 | no | const granted = await post({ authorization: &#39;Bearer &#39; + TOKEN }); |
| dir | const | 261 | no | const dir = tempDir(&#39;vivim-grant-confirm-&#39;); |
| source | const | 264 | no | const source = svc.grantBootstrap.toString(); |
| moduleSource | const | 267 | no | const moduleSource = readFileSync(new URL(&#39;../bootstrap/service.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| dir | const | 273 | no | const dir = tempDir(&#39;vivim-grant-scheduler-&#39;); |
| clock | const | 275 | no | const clock = { at: ISO }; |
| dispatches | const | 276 | no | const dispatches = []; |
| studio | const | 277 | no | const studio = { |
| build | function | 285 | no | const build = ({ maxSends = 5, expiresInMs = 600000 } = {}) =&gt; { |
| ledger | const | 286 | no | const ledger = openLedger({ file: path.join(dir, &#39;ledger.db&#39;) }); |
| svc | const | 287 | no | const svc = createBootstrapService({ ledger, now: () =&gt; clock.at }); |
| scheduler | const | 290 | no | const scheduler = createBootstrapScheduler({ ledger, worldId: &#39;world-local&#39;, now: () =&gt; clock.at, runtime: { status: () =&gt; ({ state: &#39;ready&#39;, ...svc.fullStatus() }), ingestF02: params =&gt; svc.ingestF0… |
| live | const | 310 | no | const live = build(); |
| lapsed | const | 319 | no | const lapsed = build({ expiresInMs: 60000 }); |
| spent | const | 329 | no | const spent = build({ maxSends: 1 }); |
| dir | const | 345 | no | const dir = tempDir(&#39;vivim-grant-scheduler-revoked-&#39;); |
| clock | const | 347 | no | const clock = { at: ISO }; |
| dispatches | const | 348 | no | const dispatches = []; |
| studio | const | 349 | no | const studio = { |
| build | function | 359 | no | const build = (name, statusOf = null) =&gt; { |
| ledgerDir | const | 360 | no | const ledgerDir = path.join(dir, name); |
| ledger | const | 362 | no | const ledger = openLedger({ file: path.join(ledgerDir, &#39;ledger.db&#39;) }); |
| svc | const | 363 | no | const svc = createBootstrapService({ ledger, now: () =&gt; clock.at }); |
| captured | const | 365 | no | const captured = svc.grantState(); |
| scheduler | const | 366 | no | const scheduler = createBootstrapScheduler({ ledger, worldId: &#39;world-local&#39;, now: () =&gt; clock.at, runtime: { status: statusOf ? () =&gt; ({ state: &#39;ready&#39;, ...statusOf(captured) }) : () =&gt; ({ state: &#39;re… |
| flagged | const | 388 | no | const flagged = build(&#39;flag&#39;); |
| tombstoned | const | 402 | no | const tombstoned = build(&#39;tombstone&#39;, captured =&gt; ({ grant: captured })); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 4 | external |
| node:assert/strict | import | 5 | external |
| node:fs | import | 6 | external |
| node:child_process | import | 7 | external |
| node:os | import | 8 | external |
| node:path | import | 9 | external |
| ../bootstrap/service.mjs | import | 10 | [apps/vivim-host/bootstrap/service.mjs](../bootstrap/service.mjs.md) |
| ../bootstrap/ledger.mjs | import | 11 | [apps/vivim-host/bootstrap/ledger.mjs](../bootstrap/ledger.mjs.md) |
| ../bootstrap/runtime.mjs | import | 12 | [apps/vivim-host/bootstrap/runtime.mjs](../bootstrap/runtime.mjs.md) |
| ../bootstrap/scheduler.mjs | import | 13 | [apps/vivim-host/bootstrap/scheduler.mjs](../bootstrap/scheduler.mjs.md) |
| ../server.mjs | import | 14 | [apps/vivim-host/server.mjs](../server.mjs.md) |
| node:fs | import | 150 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Bounded Host bootstrap grants: the cap, the expiry, the prompt binding and the
// owner-authenticated issuance path. These tests use the real bootstrap ledger, so the
// atomic claim is exercised through the same SQLite write lock the Host uses in production.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapService, GRANT_MAX_SENDS, GRANT_MAX_EXPIRY_MS, GRANT_REASONS } from '../bootstrap/service.mjs';
import { openLedger } from '../bootstrap/ledger.mjs';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createBootstrapScheduler } from '../bootstrap/scheduler.mjs';
import { createHostServer } from '../server.mjs';

const TOKEN = 'test-owner-token-0123456789abcdef0123456789abcdef';
const ISO = '2026-11-02T10:00:00.000Z';
const DIGEST_A = 'a'.repeat(64);
const DIGEST_B = 'b'.repeat(64);
const F02 = {
  schema: 'vivim.bootstrap-f02/2', pass: 'F02',
  visual: { background: '#101820', secondary: '#1d2b3a', accent: '#e8b04b', appearance: 'dark',
    texture: 'aurora', mood: 'cinematic', fontFamily: 'editorial', fontSizePx: 16, headingSizePx: 32,
    radiusPx: 18, spacingScale: 1.05, density: 'comfortable', motion: 'slow' },
  preferences: [], dislikes: [], unknowns: [], provisional: false
};

function tempDir(prefix) {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}
// A service over a file-backed ledger: two service instances can then observe the same
// grant record, which is what the Host does when the server and the worker both run.
function openService(dir, { now = () => ISO, grant = null } = {}) {
  const ledger = openLedger({ file: path.join(dir, 'ledger.db') });
  const svc = createBootstrapService({ ledger, now });
  if (grant) svc.grantBootstrap(grant);
  return { ledger, svc };
}

test('a new grant is issued with explicit bounds and keeps the legacy fields', t => {
  const dir = tempDir('vivim-grant-bounds-');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const { ledger, svc } = openService(dir);
  const grant = svc.grantBootstrap({ scope: 'full-bootstrap' });
  assert.equal(grant.scope, 'full-bootstrap');
  assert.equal(grant.worldId, 'world-local');
  assert.equal(grant.source, 'owner');
  assert.equal(grant.at, ISO);
  assert.equal(typeof grant.id, 'string');
  assert.equal(grant.maxSends, GRANT_MAX_SENDS);
  assert.equal(grant.sendsUsed, 0);
  assert.equal(grant.promptDigest, null);
  assert.equal(grant.freshThreadOnly, true);
  assert.equal(grant.expiresAt, new Date(Date.parse(ISO) + GRANT_MAX_EXPIRY_MS).toISOString());
  // The record is what the ledger holds, not only what the caller got back.
  const stored = JSON.parse(ledger.meta.get('grant.bootstrap'));
  assert.equal(stored.maxSends, GRANT_MAX_SENDS);
  assert.equal(stored.expiresAt, grant.expiresAt);
  ledger.close();
});

test('an expired grant is refused with its own code on the write path and the send path', t => {
  const dir = tempDir('vivim-grant-expired-');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  let clock = ISO;
  const { ledger, svc } = openService(dir, { now: () => clock });
  svc.grantBootstrap({ scope: 'full-bootstrap', expiresInMs: 60000 });
  clock = new Date(Date.parse(ISO) + 60001).toISOString();
  assert.throws(() => svc.choosePreset({ preset: 'grove', requestId: 'owner-expired' }),
    error => error.code === GRANT_REASONS.expired);
  assert.throws(() => svc.consumeGrantSend({ requestId: 'send-expired' }),
    error => error.code === GRANT_REASONS.expired);
  // A fresh owner grant restores the authority.
  clock = ISO;
  svc.grantBootstrap({ scope: 'full-bootstrap' });
  clock = new Date(Date.parse(ISO) + 1).toISOString();
  const claim = svc.consumeGrantSend({ requestId: 'send-renewed' });
  assert.equal(claim.ok, true);
  ledger.close();
});
```

_First 80 of 411 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
