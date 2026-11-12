// Wave 5B: isolated Host-owned raw evidence intake. No HTTP route, World writer, or effect dispatcher.
import { promises as fs, constants } from 'node:fs';
import path from 'node:path';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export const INTAKE_SCHEMA = 'vivim.corpus-intake/1';
export const RECEIPT_SCHEMA = 'vivim.corpus-host-receipt/1';
const MAX_ITEMS = 10, MAX_ITEM_BYTES = 25 * 1024 * 1024, MAX_BATCH_BYTES = 32 * 1024 * 1024;
const ID = /^evt-[a-z0-9][a-z0-9-]{7,95}$/;
const ASSET = /^asset-[a-z0-9][a-z0-9-]{7,95}$/;
const WORLD = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const SHA = /^[a-f0-9]{64}$/;
const utc = s => typeof s === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(s) && Number.isFinite(Date.parse(s));
const digest = v => createHash('sha256').update(v).digest('hex');
const mac = (v, key) => 'hmac-sha256:' + createHmac('sha256', key).update(stable(v)).digest('hex');
const obj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const keys = (v, names) => obj(v) && Object.keys(v).sort().join('|') === [...names].sort().join('|');
const set = (v, values) => values.includes(v);
const bad = (code, status = 403) => { throw Object.assign(new Error(code), { code, status }); };
const stable = v => JSON.stringify(v, (_k, x) => obj(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, x[k]])) : x);
const eventKey = (owner, world, event) => digest(owner + '\0' + world + '\0' + event);

// Minimum portable-contract mirror. Integration 5 must additionally call HQ's canonical validator.
export function validateOriginalEnvelope(e) {
  if (!keys(e, ['schema','eventId','assetId','worldId','kind','title','capturedAt','source','asset','policy','lineage']) ||
      e.schema !== INTAKE_SCHEMA || !ID.test(e.eventId) || !ASSET.test(e.assetId) || !WORLD.test(e.worldId) ||
      !set(e.kind, ['article','voice_memo','audiobook','document','image','note','podcast','bookmark','conversation','other']) ||
      typeof e.title !== 'string' || !e.title.length || e.title.length > 160 || e.title.trim() !== e.title || !utc(e.capturedAt) ||
      new Date(e.capturedAt).toISOString().slice(0,19) !== e.capturedAt.slice(0,19)) bad('ENVELOPE_INVALID',400);
  const s = e.source, a = e.asset, p = e.policy, l = e.lineage;
  if (!keys(s,['registryId','mechanism','surface','actor','publicUri']) ||
      !set(s.registryId,['SRC-MANUAL-IMPORT','SRC-OWNER-INPUT']) ||
      s.mechanism !== (s.registryId === 'SRC-MANUAL-IMPORT' ? 'import' : 'push') ||
      !/^[a-z][a-z0-9.-]{2,63}$/.test(s.surface) || s.actor !== 'owner' ||
      !(s.publicUri === null || (typeof s.publicUri === 'string' && s.publicUri.length <= 2048 &&
      /^https?:\/\/[^\s?#@]+(?:\/[^?#]*)?$/.test(s.publicUri) && (()=>{try { const u = new URL(s.publicUri); return !!u.hostname && !u.username && !u.password && !u.search && !u.hash && u.href === s.publicUri; }catch{return false;}})()))) bad('SOURCE_INVALID',400);
  if (!keys(a,['mediaType','availability','contentRef','sha256','bytes','role']) ||
      !/^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/.test(a.mediaType) || a.mediaType.length > 127 ||
      a.availability !== 'stored' || a.role !== 'original' || a.contentRef !== 'asset:' + e.assetId ||
      !SHA.test(a.sha256) || !Number.isSafeInteger(a.bytes) || a.bytes < 0 || a.bytes > MAX_ITEM_BYTES) bad('ASSET_INVALID',400);
  if (!keys(p,['purpose','sensitivity','thirdParty','rights','ownerInitiated','grantRef']) ||
      p.purpose !== 'private-personal-ai' || !set(p.sensitivity,['S0','S1','S2','S3']) ||
      !set(p.thirdParty,['none','possible','present','unknown']) ||
      !set(p.rights,['unknown','review_required','owner_declared']) || p.ownerInitiated !== true ||
      (p.grantRef !== null && (typeof p.grantRef !== 'string' || !p.grantRef.length || p.grantRef.length > 256))) bad('POLICY_INVALID',400);
  if (!keys(l,['parents','evidenceRefs']) || !Array.isArray(l.parents) || !Array.isArray(l.evidenceRefs) ||
      l.parents.length || l.evidenceRefs.length > 32 ||
      l.evidenceRefs.some(v=>typeof v!=='string'||!v.length||v.length>256) ||
      new Set(l.evidenceRefs).size !== l.evidenceRefs.length) bad('LINEAGE_INVALID',400);
  return true;
}

export function corpusIntakeApprovalDigest(envelope) { validateOriginalEnvelope(envelope); return digest(stable(envelope)); }

export function verifyIntakeReceipt(receipt, key) {
  if (!obj(receipt) || typeof receipt.signature !== 'string' || !/^hmac-sha256:[a-f0-9]{64}$/.test(receipt.signature)) return false;
  if (!Buffer.isBuffer(key) || key.length < 32) return false;
  const { signature, ...unsigned } = receipt;
  const expected = createHmac('sha256', key).update(stable(unsigned)).digest();
  return timingSafeEqual(expected, Buffer.from(signature.slice('hmac-sha256:'.length),'hex'));
}
async function syncDir(dir) { const h = await fs.open(dir, constants.O_RDONLY); try { await h.sync(); } finally { await h.close(); } }
async function writeOnce(file, bytes) {
  const h = await fs.open(file, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW || 0), 0o600);
  try { await h.writeFile(bytes); await h.sync(); } finally { await h.close(); }
}
async function withWriterLock(dir, action) {
  const lock = path.join(dir,'writer.lock');
  let handle;
  try { handle = await fs.open(lock,constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW || 0),0o600); }
  catch (error) { if (error.code === 'EEXIST') bad('INTAKE_WRITER_BUSY',409); throw error; }
  try {
    await handle.writeFile('vivim-host-corpus-intake-v1\n'); await handle.sync(); await syncDir(dir);
    return await action();
  } finally { await handle.close(); await fs.unlink(lock); await syncDir(dir); }
}
async function ensurePrivateDirectory(dir) {
  await fs.mkdir(dir,{recursive:true,mode:0o700});
  const st = await fs.lstat(dir);
  if (!st.isDirectory() || st.isSymbolicLink()) bad('STORAGE_UNSAFE',503);
}
async function existingRecord(dir, fingerprint, envelope, expectedLength, key, ownerId, id) {
  const st = await fs.lstat(dir);
  if (!st.isDirectory() || st.isSymbolicLink()) bad('STORAGE_UNSAFE',503);
  let record;
  try { record = JSON.parse(await fs.readFile(path.join(dir,'commit.json'),'utf8')); }
  catch { bad('INTERRUPTED_REQUIRES_REVIEW',409); }
  const { authTag, ...unsigned } = record;
  if (record.schema !== 'vivim.host-raw-record/1' || record.ownerId !== ownerId || record.eventKey !== id ||
      record.worldId !== envelope.worldId || !SHA.test(record.fingerprint) || !SHA.test(record.sha256) ||
      !SHA.test(record.envelopeSha256) || !Number.isSafeInteger(record.bytes) || authTag !== mac(unsigned,key))
    bad('CORRUPT_STORED_EVIDENCE',409);
  if (record.fingerprint !== fingerprint || record.sha256 !== envelope.asset.sha256 ||
      record.envelopeSha256 !== digest(stable(envelope)) || record.bytes !== expectedLength) bad('ALTERED_REPLAY',409);
  let raw;
  try {
    const e = await fs.lstat(path.join(dir,'envelope.json'));
    if (!e.isFile() || e.isSymbolicLink() || e.size > 16384) bad('CORRUPT_STORED_EVIDENCE',409);
    const persisted = await fs.readFile(path.join(dir,'envelope.json'),'utf8');
    if (persisted !== stable(envelope)) bad('CORRUPT_STORED_EVIDENCE',409);
    const stRaw = await fs.lstat(path.join(dir,'raw.bin'));
    if (!stRaw.isFile() || stRaw.isSymbolicLink() || stRaw.size !== expectedLength) bad('CORRUPT_STORED_EVIDENCE',409);
    raw = await fs.readFile(path.join(dir,'raw.bin'));
  } catch { bad('CORRUPT_STORED_EVIDENCE',409); }
  if (digest(raw) !== envelope.asset.sha256) bad('CORRUPT_STORED_EVIDENCE',409);
  return 'duplicate';
}

/** Trusted Host adapter must supply authenticated device session, resolved owner grant, and private signing key. */
export function createHostCorpusIntake({ root, authenticate, resolveGrant, receiptKey, now = Date.now }) {
  if (typeof root !== 'string' || !path.isAbsolute(root) || typeof authenticate !== 'function' ||
      typeof resolveGrant !== 'function' || !Buffer.isBuffer(receiptKey) || receiptKey.length < 32 ||
      typeof now !== 'function') throw new TypeError('HOST_INTAKE_TRUST_ADAPTER_REQUIRED');
  const signingKey = Buffer.from(receiptKey);
  const receipt = body => {
    const safe = { schema: RECEIPT_SCHEMA, ...body, at: new Date(now()).toISOString(), traceId: randomUUID() };
    return { ...safe, signature: mac(safe, signingKey) };
  };
  async function acceptBatch(request) {
    let batchId = null;
    try {
      if (!obj(request) || !/^batch-[a-z0-9-]{8,80}$/.test(request.batchId) ||
          typeof request.grantRef !== 'string' || !request.grantRef || request.grantRef.length > 256 ||
          !Array.isArray(request.items) || request.items.length < 1 || request.items.length > MAX_ITEMS)
        bad('BATCH_INVALID',400);
      batchId = request.batchId;
      // A caller-provided principal or permission object is never accepted as authority.
      const principal = await authenticate(request.session);
      if (!obj(principal) || principal.verified !== true || typeof principal.ownerId !== 'string' ||
          !/^[a-z0-9._-]{1,128}$/.test(principal.ownerId) || !/^[a-z0-9._-]{1,128}$/.test(principal.deviceId) ||
          !WORLD.test(principal.worldId) || !Array.isArray(principal.scopes) ||
          !principal.scopes.includes('corpus:intake') || !Number.isFinite(principal.expiresAt) || principal.expiresAt <= now())
        bad('DEVICE_UNAUTHORIZED',401);
      const g = await resolveGrant(request.grantRef, principal);
      if (!obj(g) || g.ref !== request.grantRef || g.ownerId !== principal.ownerId ||
          g.deviceId !== principal.deviceId || g.worldId !== principal.worldId ||
          g.scope !== 'corpus:raw-intake' || g.approvedBy !== 'owner' || g.revoked !== false ||
          !Number.isFinite(g.approvedAt) || g.approvedAt > now() || !Number.isFinite(g.expiresAt) || g.expiresAt <= now() ||
          g.rightsReviewed !== true || g.sensitivityReviewed !== true || g.thirdPartyReviewed !== true ||
          !set(g.maxSensitivity,['S0','S1','S2','S3']) || !Array.isArray(g.kinds) || !g.kinds.length ||
          g.batchId !== batchId || !Array.isArray(g.approvedEvents) || g.approvedEvents.length !== request.items.length ||
          !Number.isSafeInteger(g.maxItems) || g.maxItems < 1 || g.maxItems > MAX_ITEMS ||
          !Number.isSafeInteger(g.maxTotalBytes) || g.maxTotalBytes < 1 || g.maxTotalBytes > MAX_BATCH_BYTES)
        bad('INTAKE_GRANT_DENIED',403);
      const sessionStillValid = async () => {
        const live = await authenticate(request.session);
        if (!obj(live) || live.verified !== true || live.ownerId !== principal.ownerId ||
            live.deviceId !== principal.deviceId || live.worldId !== principal.worldId ||
            !Array.isArray(live.scopes) || !live.scopes.includes('corpus:intake') ||
            !Number.isFinite(live.expiresAt) || live.expiresAt <= now()) bad('DEVICE_UNAUTHORIZED',401);
      };
      let total = 0;
      const prepared = [], identities = new Map();
      for (const item of request.items) {
        if (!obj(item) || !Buffer.isBuffer(item.bytes)) bad('RAW_REQUIRED',400);
        const e = item.envelope;
        validateOriginalEnvelope(e);
        if (!g.approvedEvents.some(a => obj(a) && a.eventId === e.eventId &&
            a.envelopeSha256 === corpusIntakeApprovalDigest(e))) bad('SCOPE_DENIED',403);
        if (e.worldId !== principal.worldId || (e.policy.grantRef !== null && e.policy.grantRef !== g.ref) || !g.kinds.includes(e.kind) ||
            Number(e.policy.sensitivity[1]) > Number(g.maxSensitivity[1]) ||
            (e.policy.rights !== 'owner_declared' && g.allowUncertainRights !== true) ||
            (e.policy.thirdParty !== 'none' && g.allowThirdParty !== true)) bad('SCOPE_DENIED',403);
        if (item.bytes.length !== e.asset.bytes || item.bytes.length > MAX_ITEM_BYTES || digest(item.bytes) !== e.asset.sha256)
          bad('DIGEST_MISMATCH',400);
        total += item.bytes.length;
        if (total > Math.min(MAX_BATCH_BYTES, g.maxTotalBytes ?? MAX_BATCH_BYTES) ||
            prepared.length + 1 > Math.min(MAX_ITEMS,g.maxItems ?? MAX_ITEMS)) bad('BUDGET_EXCEEDED',413);
        const fp = digest(stable(e) + '\n' + e.asset.sha256);
        const id = eventKey(principal.ownerId,principal.worldId,e.eventId);
        if (identities.has(id)) bad(identities.get(id) === fp ? 'DUPLICATE_WITHIN_BATCH' : 'ALTERED_REPLAY',409);
        identities.set(id,fp);
        prepared.push({e, bytes:Buffer.from(item.bytes), id, fp});
      }
      const base = path.join(root,'v1');
      await ensurePrivateDirectory(root); await ensurePrivateDirectory(base); await syncDir(root);
      const events = await withWriterLock(base,async () => {
      const committed = [];
      for (const {e,bytes,id,fp} of prepared) {
        await sessionStillValid();
        const dir = path.join(base,id);
        try { await fs.mkdir(dir,{mode:0o700}); await syncDir(base); }
        catch (error) {
          if (error.code !== 'EEXIST') throw error;
          committed.push({ eventKey:id, state:await existingRecord(dir,fp,e,bytes.length,signingKey,principal.ownerId,id) });
          continue;
        }
        // Commit marker is last. No ACK follows any write/sync failure; incomplete directories require review.
        await writeOnce(path.join(dir,'raw.bin'),bytes);
        await writeOnce(path.join(dir,'envelope.json'),stable(e));
        // Validate the live session and consent again before durable commit; revoked scope strands a reviewable stage.
        await sessionStillValid();
        const currentGrant = await resolveGrant(request.grantRef, principal);
        if (!obj(currentGrant) || currentGrant.revoked !== false ||
            !Number.isFinite(currentGrant.expiresAt) || currentGrant.expiresAt <= now() ||
            !Number.isFinite(currentGrant.approvedAt) || currentGrant.approvedAt > now() ||
            currentGrant.ref !== g.ref || currentGrant.batchId !== batchId || principal.expiresAt <= now() ||
            currentGrant.ownerId !== principal.ownerId || currentGrant.deviceId !== principal.deviceId ||
            currentGrant.worldId !== principal.worldId || currentGrant.scope !== 'corpus:raw-intake' ||
            currentGrant.approvedBy !== 'owner' || currentGrant.maxSensitivity !== g.maxSensitivity ||
            currentGrant.maxItems !== g.maxItems || currentGrant.maxTotalBytes !== g.maxTotalBytes ||
            currentGrant.allowUncertainRights !== g.allowUncertainRights ||
            currentGrant.allowThirdParty !== g.allowThirdParty ||
            !Array.isArray(currentGrant.kinds) || !currentGrant.kinds.includes(e.kind) ||
            currentGrant.rightsReviewed !== true || currentGrant.sensitivityReviewed !== true ||
            currentGrant.thirdPartyReviewed !== true ||
            !Array.isArray(currentGrant.approvedEvents) ||
            !currentGrant.approvedEvents.some(a => obj(a) && a.eventId === e.eventId &&
              a.envelopeSha256 === corpusIntakeApprovalDigest(e))) bad('INTAKE_GRANT_DENIED',403);
        const record = {schema:'vivim.host-raw-record/1', eventKey:id, ownerId:principal.ownerId,
          worldId:e.worldId, deviceId:principal.deviceId, grantRef:g.ref,
          fingerprint:fp, envelopeSha256:digest(stable(e)), sha256:e.asset.sha256, bytes:bytes.length};
        await writeOnce(path.join(dir,'commit.json'),JSON.stringify({...record,authTag:mac(record,signingKey)}));
        await syncDir(dir); await syncDir(base);
        committed.push({eventKey:id,state:'accepted'});
      }
      return committed;
      });
      const accepted = events.filter(e=>e.state==='accepted').length;
      return {status:accepted?201:200,receipt:receipt({batchId,decision:'authorized',events,accepted,duplicates:events.length-accepted})};
    } catch (error) {
      const code = typeof error?.code === 'string' && /^(BATCH_INVALID|DEVICE_UNAUTHORIZED|INTAKE_GRANT_DENIED|ENVELOPE_INVALID|SOURCE_INVALID|ASSET_INVALID|POLICY_INVALID|LINEAGE_INVALID|RAW_REQUIRED|SCOPE_DENIED|DIGEST_MISMATCH|BUDGET_EXCEEDED|DUPLICATE_WITHIN_BATCH|ALTERED_REPLAY|INTERRUPTED_REQUIRES_REVIEW|CORRUPT_STORED_EVIDENCE|STORAGE_UNSAFE|INTAKE_WRITER_BUSY)$/.test(error.code) ? error.code : 'STORAGE_UNAVAILABLE';
      const status = code === 'STORAGE_UNAVAILABLE' ? 503 : error.status;
      return {status:status || 503,receipt:receipt({batchId,decision:'denied',code})};
    }
  }
  return Object.freeze({acceptBatch});
}
