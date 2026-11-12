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
    return fd;
  }
  return { transaction, stageAtCursor, stagePath };
}

export function createCorpusTransferProtocol({ dataRoot, validateCapture, canonicalCapture,
  authorizeDevice, approveTransfer, persistAccepted, lookupAccepted, now = () => Date.now() }) {
  if ([validateCapture, canonicalCapture, authorizeDevice, approveTransfer,
    persistAccepted, lookupAccepted, now].some(f => typeof f !== 'function')) fail('HOST_ADAPTER_REQUIRED', 500);
  const db = createLedger(dataRoot);
  const authDevice = auth => {
    const x = authorizeDevice(auth); // must call the existing grant/session validator; never trust request deviceId
    if (!x || !id(x.deviceId) || !id(x.grantId) || !Array.isArray(x.scopes) ||
      !x.scopes.includes('corpus:upload')) fail('DEVICE_NOT_AUTHORIZED', 403);
    return x;
  };
  const authorized = (state, scopeId, auth) => {
    const device = authDevice(auth);
    const scope = state.scopes[scopeId];
    if (!scope || scope.deviceId !== device.deviceId || scope.grantId !== device.grantId) fail('SCOPE_UNAUTHORIZED', 403);
    if (now() >= scope.expiresAt) fail('SCOPE_EXPIRED', 403);
    return scope;
  };
  function proposed(events) {
    if (!Array.isArray(events) || !events.length || events.length > TRANSPORT_LIMITS.maxEvents) fail('BATCH_COUNT_LIMIT');
    let total = 0; const seen = new Set();
    return events.map(e => {
      if (!validateCapture(e)?.ok) fail('CORPUS_ENVELOPE_INVALID');
      // One Host World per batch: otherwise eventId-only cursor operations become ambiguous.
      if (e.worldId !== events[0].worldId) fail('MIXED_WORLD_BATCH');
      const c = canonicalCapture(e);
      if (!c?.ok || typeof c.json !== 'string' || Buffer.byteLength(c.json) > 16384) fail('CORPUS_CANONICAL_INVALID');
      // Validate the canonicalization adapter supplied by HQ, fail closed on non-identical material.
      let canonical;
      try { canonical = JSON.parse(c.json); } catch { fail('CORPUS_CANONICAL_INVALID'); }
      if (!same(canonical.worldId, e.worldId) || !same(canonical.eventId, e.eventId) ||
          !same(canonical.asset?.sha256, e.asset?.sha256)) fail('CORPUS_CANONICAL_MISMATCH');
      const eventKey = keyOf(e);
      if (seen.has(eventKey)) fail('DUPLICATE_BATCH_EVENT', 409);
      seen.add(eventKey);
      const bytes = e.asset.availability === 'stored' ? e.asset.bytes : 0;
      const sha256 = e.asset.availability === 'stored' ? e.asset.sha256 : null;
      if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > TRANSPORT_LIMITS.maxAssetBytes ||
          (sha256 !== null && !HEX.test(sha256))) fail('ASSET_BUDGET_OR_HASH_INVALID');
      total += bytes;
      if (total > TRANSPORT_LIMITS.maxBatchBytes) fail('BATCH_BYTE_LIMIT');
      return { eventKey, worldId:e.worldId, eventId:e.eventId, digest: hash(c.json),
        sha256, bytes, envelope: canonical };
    });
  }
  const scopeFor = (state, scopeId, auth, eventId) => {
    const scope = authorized(state, scopeId, auth);
    const target = scope.eventKeys.map(k => state.events[k]).find(e => e?.eventId === eventId);
    if (!target) fail('EVENT_NOT_IN_SCOPE', 403);
    if (target.scopeId !== scopeId && target.status !== 'accepted') fail('EVENT_SCOPE_SUPERSEDED', 409);
    return target;
  };
  const receiptMatches = (receipt, event) => receipt?.durable === true &&
    receipt.worldId === event.worldId && receipt.eventId === event.eventId &&
    receipt.digest === event.digest && typeof receipt.receiptId === 'string' &&
    receipt.receiptId.length > 0 && receipt.receiptId.length <= 256 &&
    receipt.sha256 === event.sha256;
  const progress = e => ({ schema: TRANSPORT_SCHEMA, eventId:e.eventId, worldId:e.worldId,
    cursor:e.cursor, bytes:e.bytes, state:e.status, receipt:e.status === 'accepted' ? e.receipt : null });
  function fullHash(e) {
    if (e.bytes === 0 && e.sha256 === null) return null;
    const fd = db.stageAtCursor(keyOf(e), e.cursor); const dig = createHash('sha256');
    const block = Buffer.allocUnsafe(TRANSPORT_LIMITS.maxChunkBytes);
    try {
      let left = e.bytes, pos = 0;
      while (left > 0) {
        const n = readSync(fd, block, 0, Math.min(left, block.length), pos);
        if (!n) fail('STAGED_BYTES_MISSING', 503);
        dig.update(block.subarray(0, n)); pos += n; left -= n;
      }
    } finally { closeSync(fd); }
    return dig.digest('hex');
  }
  return {
    // Host-only, explicit per-batch approval. A local capture or connection event is never a scope.
    async issueScope({ auth, events, ttlMs }) {
      const device = authDevice(auth), req = proposed(events);
      if (!Number.isSafeInteger(ttlMs) || ttlMs < 1000 || ttlMs > TRANSPORT_LIMITS.maxScopeMs) fail('INVALID_SCOPE_TTL');
      const proposedExpiry = now() + ttlMs;
      const approval = await approveTransfer({ deviceId: device.deviceId, grantId:device.grantId,
        events: req.map(({eventKey, digest, sha256, bytes})=>({eventKey,digest,sha256,bytes})), expiresAt: proposedExpiry });
      // Approval returned by trusted Host approval broker, not a request JSON field.
      if (approval?.decision !== 'approved' || !id(approval.approvalId) ||
          approval.deviceId !== device.deviceId || approval.grantId !== device.grantId ||
          approval.expiresAt !== proposedExpiry ||
          JSON.stringify(approval.events) !== JSON.stringify(req.map(({eventKey,digest,sha256,bytes})=>({eventKey,digest,sha256,bytes}))))
        fail('OWNER_APPROVAL_REQUIRED', 403);
      // Recheck session and revocation AFTER asynchronous owner decision.
      const live = authDevice(auth);
      if (live.deviceId !== device.deviceId || live.grantId !== device.grantId || now() >= proposedExpiry) fail('APPROVAL_EXPIRED', 403);
      return db.transaction(state => {
        for (const e of req) {
          const old = state.events[e.eventKey];
          if (old && (old.digest !== e.digest || old.sha256 !== e.sha256 || old.bytes !== e.bytes)) fail('EVENT_REPLAY_CONFLICT', 409);
          if (old && old.deviceId !== device.deviceId && old.status !== 'accepted') fail('EVENT_DEVICE_CONFLICT', 409);
        }
        const scopeId = randomBytes(16).toString('hex');
        state.scopes[scopeId] = { deviceId: device.deviceId, grantId: device.grantId,
          approvalId:approval.approvalId, expiresAt:proposedExpiry, eventKeys:req.map(e=>e.eventKey) };
        for (const e of req) {
          const old = state.events[e.eventKey];
          if (old) { if (old.status !== 'accepted') old.scopeId = scopeId; }
          else state.events[e.eventKey] = { ...e, deviceId:device.deviceId, scopeId, cursor:0,
            status:'receiving', receipt:null };
        }
        return { dirty:true, value:{ schema:TRANSPORT_SCHEMA, scopeId, expiresAt: proposedExpiry,
          events:req.map(e=>({eventId:e.eventId, bytes:e.bytes})) } };
      });
    },
    inspect({ auth, scopeId, eventId }) {
      return db.transaction(s => { const e = scopeFor(s,scopeId,auth,eventId);
        return { dirty:false, value:progress(e) }; });
    },
    pushChunk({ auth, scopeId, eventId, offset, chunk }) {
      if (!Buffer.isBuffer(chunk) || !chunk.length || chunk.length > TRANSPORT_LIMITS.maxChunkBytes) fail('INVALID_CHUNK');
      if (!Number.isSafeInteger(offset) || offset < 0) fail('INVALID_CURSOR');
      return db.transaction(s => {
        const e = scopeFor(s,scopeId,auth,eventId);
        if (e.status !== 'receiving') fail('EVENT_NOT_RECEIVING',409);
        if (e.sha256 === null || offset + chunk.length > e.bytes) fail('CHUNK_EXCEEDS_APPROVAL');
        if (offset > e.cursor || (offset < e.cursor && offset + chunk.length > e.cursor)) fail('CURSOR_CONFLICT',409);
        const fd = db.stageAtCursor(keyOf(e), e.cursor);
        try {
          if (offset < e.cursor) {
            const old = Buffer.alloc(chunk.length);
            if (readSync(fd,old,0,old.length,offset) !== old.length || !old.equals(chunk)) fail('RETRY_BYTES_CONFLICT',409);
            return { dirty:false, value:progress(e) };
          }
          let written=0;
          while(written<chunk.length) {
            const n=writeSync(fd,chunk,written,chunk.length-written,offset+written);
            if(!n) fail('STAGE_WRITE_FAILED',503);
            written+=n;
          }
          fsyncSync(fd); // Original bytes are persisted before advancing durable cursor.
          e.cursor += chunk.length;
          return { dirty:true, value:progress(e) };
        } finally { closeSync(fd); }
      });
    },
    async finalize({ auth, scopeId, eventId }) {
      const ready = db.transaction(s => {
        const e = scopeFor(s,scopeId,auth,eventId);
        if (e.status === 'accepted') return { dirty:false, value:{accepted:progress(e)} };
        if (e.status === 'accepting') fail('ACCEPT_UNCERTAIN_RECONCILE_REQUIRED',409);
        if (e.cursor !== e.bytes) fail('TRANSFER_INCOMPLETE',409);
        if (e.sha256 !== null && fullHash(e) !== e.sha256) fail('ASSET_SHA256_MISMATCH',422);
        e.status='accepting'; // persist before invoking any Host receiver side effect
        return { dirty:true, value:{event:structuredClone(e)} };
      });
      if (ready.accepted) return ready.accepted;
      const e=ready.event;
      let receipt;
      try {
        receipt=await persistAccepted({ envelope:e.envelope, stagePath:e.sha256===null?null:db.stagePath(keyOf(e)),
          eventDigest:e.digest, expectedSha256:e.sha256, deviceId:e.deviceId,
          scopeId, idempotencyKey:keyOf(e) });
      } catch { fail('HOST_ACCEPT_UNCERTAIN',503); }
      if (!receiptMatches(receipt,e)) fail('HOST_DURABLE_RECEIPT_REQUIRED',503);
      return db.transaction(s => {
        const current = scopeFor(s,scopeId,auth,eventId);
        if (current.status !== 'accepting' || current.digest !== e.digest) fail('ACCEPT_STATE_CHANGED',409);
        current.receipt=receipt; current.status='accepted';
        return {dirty:true,value:progress(current)};
      });
    },
    // Explicit owner-initiated reconciliation after uncertain Host persistence; never
    // calls persistAccepted and never sends bytes or external provider actions.
    async reconcile({ auth, scopeId, eventId }) {
      const pending = db.transaction(s => {
        const e=scopeFor(s,scopeId,auth,eventId);
        return {dirty:false,value:structuredClone(e)};
      });
      if (pending.status !== 'accepting') return progress(pending);
      const receipt = await lookupAccepted({worldId:pending.worldId,eventId:pending.eventId,digest:pending.digest});
      if (receipt === null) return {...progress(pending), state:'uncertain'};
      if (!receiptMatches(receipt,pending)) fail('HOST_RECEIPT_CONFLICT',409);
      return db.transaction(s => {
        const e=scopeFor(s,scopeId,auth,eventId);
        if(e.status !== 'accepting' || e.digest !== pending.digest) fail('ACCEPT_STATE_CHANGED',409);
        e.receipt=receipt; e.status='accepted';
        return {dirty:true,value:progress(e)};
      });
    },
  };
}
