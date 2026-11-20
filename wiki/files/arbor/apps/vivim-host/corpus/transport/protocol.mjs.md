# File: apps/vivim-host/corpus/transport/protocol.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | apps/vivim-host/corpus/transport/protocol.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 15465 B |
| Lines | 271 |
| Hash | b3b6739d56de |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TRANSPORT_SCHEMA | const | 9 | yes | export const TRANSPORT_SCHEMA = &#39;vivim.corpus-transfer/1&#39;; |
| TRANSPORT_LIMITS | const | 10 | yes | export const TRANSPORT_LIMITS = Object.freeze({ maxEvents: 10, maxBatchBytes: 32 * 1024 * 1024, maxAssetBytes: 25 * 1024 * 1024, maxChunkBytes: 256 * 1024, maxScopeMs: 24 * 60 * 60 * 1000 }); |
| HEX | const | 12 | no | const HEX = /^[a-f0-9]{64}$/; |
| id | function | 13 | no | const id = v =&gt; typeof v === &#39;string&#39; &amp;&amp; /^[a-z0-9][a-z0-9._:-]{0,127}$/.test(v); |
| hash | function | 14 | no | const hash = b =&gt; createHash(&#39;sha256&#39;).update(b).digest(&#39;hex&#39;); |
| keyOf | function | 15 | no | const keyOf = e =&gt; JSON.stringify([e.worldId, e.eventId]); |
| fail | function | 16 | no | const fail = (code, status = 400) =&gt; { throw Object.assign(new Error(code), { code, status }); }; |
| same | function | 17 | no | const same = (a, b) =&gt; a === b; |
| createLedger | function | 21 | no | function createLedger(dataRoot) { |
| dir | const | 23 | no | const dir = path.join(dataRoot, &#39;corpus-transfer-v1&#39;); |
| staging | const | 24 | no | const staging = path.join(dir, &#39;staging&#39;); |
| file | const | 26 | no | const file = path.join(dir, &#39;ledger.json&#39;), lock = path.join(dir, &#39;writer.lock&#39;); |
| dirSync | function | 27 | no | const dirSync = where =&gt; { const fd = openSync(where, &#39;r&#39;); try { fsyncSync(fd); } finally { closeSync(fd); } }; |
| load | function | 28 | no | function load() { |
| raw | variable | 29 | no | let raw; |
| state | variable | 33 | no | let state; |
| save | function | 39 | no | function save(state) { |
| bytes | const | 40 | no | const bytes = JSON.stringify(state); |
| tmp | const | 42 | no | const tmp = file + &#39;.&#39; + randomBytes(8).toString(&#39;hex&#39;) + &#39;.tmp&#39;; |
| fd | variable | 43 | no | let fd; |
| transaction | function | 56 | no | function transaction(fn) { |
| lockFd | variable | 57 | no | let lockFd; |
| state | const | 61 | no | const state = load(); const out = fn(state); |
| stagePath | function | 68 | no | const stagePath = eventKey =&gt; path.join(staging, hash(eventKey) + &#39;.part&#39;); |
| stageAtCursor | function | 71 | no | function stageAtCursor(eventKey, cursor) { |
| name | const | 72 | no | const name = stagePath(eventKey); |
| fd | variable | 73 | no | let fd; |
| size | const | 78 | no | const size = fstatSync(fd).size; |
| createCorpusTransferProtocol | function | 86 | yes | export function createCorpusTransferProtocol({ dataRoot, validateCapture, canonicalCapture, authorizeDevice, approveTransfer, persistAccepted, lookupAccepted, now = () =&gt; Date.now() }) { |
| db | const | 90 | no | const db = createLedger(dataRoot); |
| authDevice | function | 91 | no | const authDevice = auth =&gt; { |
| x | const | 92 | no | const x = authorizeDevice(auth); // must call the existing grant/session validator; never trust request deviceId |
| authorized | function | 97 | no | const authorized = (state, scopeId, auth) =&gt; { |
| device | const | 98 | no | const device = authDevice(auth); |
| scope | const | 99 | no | const scope = state.scopes[scopeId]; |
| proposed | function | 104 | no | function proposed(events) { |
| total | variable | 106 | no | let total = 0; const seen = new Set(); |
| c | const | 111 | no | const c = canonicalCapture(e); |
| canonical | variable | 114 | no | let canonical; |
| eventKey | const | 118 | no | const eventKey = keyOf(e); |
| bytes | const | 121 | no | const bytes = e.asset.availability === &#39;stored&#39; ? e.asset.bytes : 0; |
| sha256 | const | 122 | no | const sha256 = e.asset.availability === &#39;stored&#39; ? e.asset.sha256 : null; |
| scopeFor | function | 131 | no | const scopeFor = (state, scopeId, auth, eventId) =&gt; { |
| scope | const | 132 | no | const scope = authorized(state, scopeId, auth); |
| target | const | 133 | no | const target = scope.eventKeys.map(k =&gt; state.events[k]).find(e =&gt; e?.eventId === eventId); |
| receiptMatches | function | 138 | no | const receiptMatches = (receipt, event) =&gt; receipt?.durable === true &amp;&amp; |
| progress | function | 143 | no | const progress = e =&gt; ({ schema: TRANSPORT_SCHEMA, eventId:e.eventId, worldId:e.worldId, cursor:e.cursor, bytes:e.bytes, state:e.status, receipt:e.status === &#39;accepted&#39; ? e.receipt : null }); |
| fullHash | function | 145 | no | function fullHash(e) { |
| fd | const | 147 | no | const fd = db.stageAtCursor(keyOf(e), e.cursor); const dig = createHash(&#39;sha256&#39;); |
| block | const | 148 | no | const block = Buffer.allocUnsafe(TRANSPORT_LIMITS.maxChunkBytes); |
| left | variable | 150 | no | let left = e.bytes, pos = 0; |
| n | const | 152 | no | const n = readSync(fd, block, 0, Math.min(left, block.length), pos); |
| device | const | 162 | no | const device = authDevice(auth), req = proposed(events); |
| proposedExpiry | const | 164 | no | const proposedExpiry = now() + ttlMs; |
| approval | const | 165 | no | const approval = await approveTransfer({ deviceId: device.deviceId, grantId:device.grantId, events: req.map(({eventKey, digest, sha256, bytes})=&gt;({eventKey,digest,sha256,bytes})), expiresAt: proposed… |
| live | const | 174 | no | const live = authDevice(auth); |
| old | const | 178 | no | const old = state.events[e.eventKey]; |
| scopeId | const | 182 | no | const scopeId = randomBytes(16).toString(&#39;hex&#39;); |
| old | const | 186 | no | const old = state.events[e.eventKey]; |
| e | const | 203 | no | const e = scopeFor(s,scopeId,auth,eventId); |
| fd | const | 207 | no | const fd = db.stageAtCursor(keyOf(e), e.cursor); |
| old | const | 210 | no | const old = Buffer.alloc(chunk.length); |
| written | variable | 214 | no | let written=0; |
| n | const | 216 | no | const n=writeSync(fd,chunk,written,chunk.length-written,offset+written); |
| ready | const | 227 | no | const ready = db.transaction(s =&gt; { const e = scopeFor(s,scopeId,auth,eventId); if (e.status === &#39;accepted&#39;) return { dirty:false, value:{accepted:progress(e)} }; if (e.status === &#39;accepting&#39;) fail(&#39;… |
| e | const | 228 | no | const e = scopeFor(s,scopeId,auth,eventId); |
| e | const | 237 | no | const e=ready.event; |
| receipt | variable | 238 | no | let receipt; |
| current | const | 246 | no | const current = scopeFor(s,scopeId,auth,eventId); |
| pending | const | 255 | no | const pending = db.transaction(s =&gt; { const e=scopeFor(s,scopeId,auth,eventId); return {dirty:false,value:structuredClone(e)}; }); |
| e | const | 256 | no | const e=scopeFor(s,scopeId,auth,eventId); |
| receipt | const | 260 | no | const receipt = await lookupAccepted({worldId:pending.worldId,eventId:pending.eventId,digest:pending.digest}); |
| e | const | 264 | no | const e=scopeFor(s,scopeId,auth,eventId); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |
| node:fs | import | 5 | external |
| node:path | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/corpus/transport/hq-contract.test.mjs](./hq-contract.test.mjs.md) | ./protocol.mjs |
| [apps/vivim-host/corpus/transport/protocol.test.mjs](./protocol.test.mjs.md) | ./protocol.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM Pocket Wave 5A — isolated, versioned phone -> Host raw-evidence transfer.
// No HTTP routes, device enrollment, KB promotion, World writes or provider effects.
// The Host integration MUST supply the canonical HQ validator and durable receiver.
import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, openSync, closeSync, readFileSync, writeFileSync, renameSync,
  unlinkSync, fsyncSync, fstatSync, statSync, ftruncateSync, readSync, writeSync } from 'node:fs';
import path from 'node:path';

export const TRANSPORT_SCHEMA = 'vivim.corpus-transfer/1';
export const TRANSPORT_LIMITS = Object.freeze({ maxEvents: 10, maxBatchBytes: 32 * 1024 * 1024,
  maxAssetBytes: 25 * 1024 * 1024, maxChunkBytes: 256 * 1024, maxScopeMs: 24 * 60 * 60 * 1000 });
const HEX = /^[a-f0-9]{64}$/;
const id = v => typeof v === 'string' && /^[a-z0-9][a-z0-9._:-]{0,127}$/.test(v);
const hash = b => createHash('sha256').update(b).digest('hex');
const keyOf = e => JSON.stringify([e.worldId, e.eventId]);
const fail = (code, status = 400) => { throw Object.assign(new Error(code), { code, status }); };
const same = (a, b) => a === b;

// Synchronous critical section across Host workers. A crash-left lock fails closed;
// it must be investigated, not silently stolen. Never treat write as durable ACK.
function createLedger(dataRoot) {
  if (typeof dataRoot !== 'string' || !path.isAbsolute(dataRoot)) fail('INVALID_DATA_ROOT');
  const dir = path.join(dataRoot, 'corpus-transfer-v1');
  const staging = path.join(dir, 'staging');
  mkdirSync(staging, { recursive: true, mode: 0o700 });
  const file = path.join(dir, 'ledger.json'), lock = path.join(dir, 'writer.lock');
  const dirSync = where => { const fd = openSync(where, 'r'); try { fsyncSync(fd); } finally { closeSync(fd); } };
  function load() {
    let raw;
    try { raw = readFileSync(file, 'utf8'); }
    catch (e) { if (e.code === 'ENOENT') return { schema: TRANSPORT_SCHEMA, scopes: {}, events: {} }; throw e; }
    if (Buffer.byteLength(raw) > 16 * 1024 * 1024) fail('LEDGER_TOO_LARGE', 503);
    let state;
    try { state = JSON.parse(raw); } catch { fail('LEDGER_CORRUPT', 503); }
    if (state?.schema !== TRANSPORT_SCHEMA || !state.scopes || !state.events ||
      Array.isArray(state.scopes) || Array.isArray(state.events)) fail('LEDGER_CORRUPT', 503);
    return state;
  }
  function save(state) {
    const bytes = JSON.stringify(state);
    if (Buffer.byteLength(bytes) > 16 * 1024 * 1024) fail('LEDGER_FULL', 507);
    const tmp = file + '.' + randomBytes(8).toString('hex') + '.tmp';
    let fd;
    try {
      fd = openSync(tmp, 'wx', 0o600);
      writeFileSync(fd, bytes); fsyncSync(fd); closeSync(fd); fd = undefined;
      renameSync(tmp, file);
      // Directory fsync is not portable to Windows; the live Host must test its
      // filesystem's rename/power-loss semantics before declaring durable ACK.
      if (process.platform !== 'win32') dirSync(dir);
    } finally {
      if (fd !== undefined) closeSync(fd);
      try { unlinkSync(tmp); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    }
  }
  function transaction(fn) {
    let lockFd;
    try { lockFd = openSync(lock, 'wx', 0o600); }
    catch (e) { if (e.code === 'EEXIST') fail('TRANSPORT_WRITER_BUSY', 409); throw e; }
    try {
      const state = load(); const out = fn(state);
      if (out.dirty) save(state);
      return out.value;
    } finally {
      try { closeSync(lockFd); } finally { unlinkSync(lock); }
    }
  }
  const stagePath = eventKey => path.join(staging, hash(eventKey) + '.part');
  // If a crash wrote data but did not publish the cursor, discard only the
  // uncommitted tail. A missing committed prefix is a hard integrity failure.
  function stageAtCursor(eventKey, cursor) {
    const name = stagePath(eventKey);
    let fd;
    try { fd = openSync(name, 'r+'); }
    catch (e) { if (e.code !== 'ENOENT' || cursor !== 0) fail('STAGED_BYTES_MISSING', 503);
      fd = openSync(name, 'wx+', 0o600);
      if (process.platform !== 'win32') dirSync(staging); }
    const size = fstatSync(fd).size;
    if (size < cursor) { closeSync(fd); fail('STAGED_BYTES_MISSING', 503); }
    if (size > cursor) { ftruncateSync(fd, cursor); fsyncSync(fd); }
```

_First 80 of 272 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
