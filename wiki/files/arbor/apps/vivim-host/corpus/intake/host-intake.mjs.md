# File: apps/vivim-host/corpus/intake/host-intake.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | apps/vivim-host/corpus/intake/host-intake.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16877 B |
| Lines | 233 |
| Hash | 5c61ce043534 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| INTAKE_SCHEMA | const | 6 | yes | export const INTAKE_SCHEMA = &#39;vivim.corpus-intake/1&#39;; |
| RECEIPT_SCHEMA | const | 7 | yes | export const RECEIPT_SCHEMA = &#39;vivim.corpus-host-receipt/1&#39;; |
| MAX_ITEMS | const | 8 | no | const MAX_ITEMS = 10, MAX_ITEM_BYTES = 25 * 1024 * 1024, MAX_BATCH_BYTES = 32 * 1024 * 1024; |
| ID | const | 9 | no | const ID = /^evt-[a-z0-9][a-z0-9-]{7,95}$/; |
| ASSET | const | 10 | no | const ASSET = /^asset-[a-z0-9][a-z0-9-]{7,95}$/; |
| WORLD | const | 11 | no | const WORLD = /^[a-z0-9][a-z0-9._-]{0,127}$/; |
| SHA | const | 12 | no | const SHA = /^[a-f0-9]{64}$/; |
| utc | function | 13 | no | const utc = s =&gt; typeof s === &#39;string&#39; &amp;&amp; /^\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d(?:\\.\\d{3})?Z$/.test(s) &amp;&amp; Number.isFinite(Date.parse(s)); |
| digest | function | 14 | no | const digest = v =&gt; createHash(&#39;sha256&#39;).update(v).digest(&#39;hex&#39;); |
| mac | function | 15 | no | const mac = (v, key) =&gt; &#39;hmac-sha256:&#39; + createHmac(&#39;sha256&#39;, key).update(stable(v)).digest(&#39;hex&#39;); |
| obj | function | 16 | no | const obj = v =&gt; v !== null &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); |
| keys | function | 17 | no | const keys = (v, names) =&gt; obj(v) &amp;&amp; Object.keys(v).sort().join(&#39;\|&#39;) === [...names].sort().join(&#39;\|&#39;); |
| set | function | 18 | no | const set = (v, values) =&gt; values.includes(v); |
| bad | function | 19 | no | const bad = (code, status = 403) =&gt; { throw Object.assign(new Error(code), { code, status }); }; |
| stable | function | 20 | no | const stable = v =&gt; JSON.stringify(v, (_k, x) =&gt; obj(x) ? Object.fromEntries(Object.keys(x).sort().map(k =&gt; [k, x[k]])) : x); |
| eventKey | function | 21 | no | const eventKey = (owner, world, event) =&gt; digest(owner + &#39;\\0&#39; + world + &#39;\\0&#39; + event); |
| validateOriginalEnvelope | function | 24 | yes | export function validateOriginalEnvelope(e) { |
| s | const | 30 | no | const s = e.source, a = e.asset, p = e.policy, l = e.lineage; |
| corpusIntakeApprovalDigest | function | 53 | yes | export function corpusIntakeApprovalDigest(envelope) { validateOriginalEnvelope(envelope); return digest(stable(envelope)); } |
| verifyIntakeReceipt | function | 55 | yes | export function verifyIntakeReceipt(receipt, key) { |
| expected | const | 59 | no | const expected = createHmac(&#39;sha256&#39;, key).update(stable(unsigned)).digest(); |
| syncDir | function | 62 | no | async function syncDir(dir) { |
| h | const | 63 | no | const h = await fs.open(dir, constants.O_RDONLY); |
| writeOnce | function | 68 | no | async function writeOnce(file, bytes) { |
| h | const | 69 | no | const h = await fs.open(file, constants.O_CREAT \| constants.O_EXCL \| constants.O_WRONLY \| (constants.O_NOFOLLOW \|\| 0), 0o600); |
| withWriterLock | function | 72 | no | async function withWriterLock(dir, action) { |
| lock | const | 73 | no | const lock = path.join(dir,&#39;writer.lock&#39;); |
| handle | variable | 74 | no | let handle; |
| ensurePrivateDirectory | function | 82 | no | async function ensurePrivateDirectory(dir) { |
| st | const | 84 | no | const st = await fs.lstat(dir); |
| existingRecord | function | 87 | no | async function existingRecord(dir, fingerprint, envelope, expectedLength, key, ownerId, id) { |
| st | const | 88 | no | const st = await fs.lstat(dir); |
| raw | variable | 100 | no | let raw; |
| e | const | 102 | no | const e = await fs.lstat(path.join(dir,&#39;envelope.json&#39;)); |
| persisted | const | 104 | no | const persisted = await fs.readFile(path.join(dir,&#39;envelope.json&#39;),&#39;utf8&#39;); |
| stRaw | const | 106 | no | const stRaw = await fs.lstat(path.join(dir,&#39;raw.bin&#39;)); |
| createHostCorpusIntake | function | 115 | yes | export function createHostCorpusIntake({ root, authenticate, resolveGrant, receiptKey, now = Date.now }) { |
| signingKey | const | 119 | no | const signingKey = Buffer.from(receiptKey); |
| receipt | function | 120 | no | const receipt = body =&gt; { |
| safe | const | 121 | no | const safe = { schema: RECEIPT_SCHEMA, ...body, at: new Date(now()).toISOString(), traceId: randomUUID() }; |
| acceptBatch | function | 124 | no | async function acceptBatch(request) { |
| batchId | variable | 125 | no | let batchId = null; |
| principal | const | 133 | no | const principal = await authenticate(request.session); |
| g | const | 139 | no | const g = await resolveGrant(request.grantRef, principal); |
| sessionStillValid | function | 150 | no | const sessionStillValid = async () =&gt; { |
| live | const | 151 | no | const live = await authenticate(request.session); |
| total | variable | 157 | no | let total = 0; |
| prepared | const | 158 | no | const prepared = [], identities = new Map(); |
| e | const | 161 | no | const e = item.envelope; |
| fp | const | 174 | no | const fp = digest(stable(e) + &#39;\\n&#39; + e.asset.sha256); |
| id | const | 175 | no | const id = eventKey(principal.ownerId,principal.worldId,e.eventId); |
| base | const | 180 | no | const base = path.join(root,&#39;v1&#39;); |
| events | const | 182 | no | const events = await withWriterLock(base,async () =&gt; { const committed = []; for (const {e,bytes,id,fp} of prepared) { await sessionStillValid(); const dir = path.join(base,id); |
| committed | const | 183 | no | const committed = []; |
| dir | const | 186 | no | const dir = path.join(base,id); |
| currentGrant | const | 198 | no | const currentGrant = await resolveGrant(request.grantRef, principal); |
| accepted | const | 224 | no | const accepted = events.filter(e=&gt;e.state===&#39;accepted&#39;).length; |
| code | const | 227 | no | const code = typeof error?.code === &#39;string&#39; &amp;&amp; /^(BATCH_INVALID\|DEVICE_UNAUTHORIZED\|INTAKE_GRANT_DENIED\|ENVELOPE_INVALID\|SOURCE_INVALID\|ASSET_INVALID\|POLICY_INVALID\|LINEAGE_INVALID\|RAW_REQUIRED\|SCOP… |
| status | const | 228 | no | const status = code === &#39;STORAGE_UNAVAILABLE&#39; ? 503 : error.status; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:path | import | 3 | external |
| node:crypto | import | 4 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/corpus/intake/host-intake.test.mjs](./host-intake.test.mjs.md) | ./host-intake.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
async function syncDir(dir) {
  const h = await fs.open(dir, constants.O_RDONLY);
  try { await h.sync(); }
  catch (error) { if (error?.code !== 'EPERM' && error?.code !== 'EINVAL' && error?.code !== 'ENOTSUP') throw error; }
  finally { await h.close(); }
}
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
```

_First 80 of 234 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
