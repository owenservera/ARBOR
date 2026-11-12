// @ts-check
/**
 * @hq:context Owner-initiated, portable personal-corpus capture envelope.
 * @hq:invariant An intake record is evidence, never permission or a curated KB fact.
 * @hq:invariant Pure validation; no filesystem, network, DB, or provider effects.
 * @hq:see contracts/personal-corpus/README.md
 */
import { createHash } from 'node:crypto';

export const CORPUS_SCHEMA = 'vivim.corpus-intake/1';
export const CORPUS_KINDS = Object.freeze([
  'article', 'voice_memo', 'audiobook', 'document', 'image',
  'note', 'podcast', 'bookmark', 'conversation', 'other',
]);
export const CORPUS_SOURCE_IDS = Object.freeze(['SRC-MANUAL-IMPORT', 'SRC-OWNER-INPUT']);
export const CORPUS_AVAILABILITY = Object.freeze(['stored', 'referenced', 'metadata_only']);
export const CORPUS_PROCESS_STATES = Object.freeze(['not_applicable', 'pending', 'complete', 'blocked', 'failed']);

const obj = v => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  Object.getPrototypeOf(v) === Object.prototype;
const text = (v, max) => typeof v === 'string' && v.length > 0 &&
  v.length <= max && v.trim() === v;
const allowed = (v, values) => values.includes(v);
const ids = /^(evt|asset)-[a-z0-9][a-z0-9-]{7,95}$/;
const world = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const sha = /^[a-f0-9]{64}$/;
const mime = /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/;
const surface = /^[a-z][a-z0-9.-]{2,63}$/;
const assetRef = /^asset:asset-[a-z0-9][a-z0-9-]{7,95}$/;
const iso = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/;
const timestamp = v => typeof v === 'string' && iso.test(v) &&
  Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 19) === v.slice(0, 19);
const refs = v => Array.isArray(v) && v.length <= 32 &&
  v.every(x => text(x, 256)) && new Set(v).size === v.length;
const safePublicUri = v => {
  if (v === null) return true;
  if (!text(v, 2048)) return false;
  try {
    const u = new URL(v);
    return (u.protocol === 'http:' || u.protocol === 'https:') &&
      !!u.hostname && !u.username && !u.password && !u.search &&
      !u.hash && u.href === v;
  } catch { return false; }
};
function shape(v, required, path, errors) {
  if (!obj(v)) { errors.push(path + ':object_required'); return false; }
  for (const key of required)
    if (!Object.hasOwn(v, key)) errors.push(path + '.' + key + ':required');
  for (const key of Object.keys(v))
    if (!required.includes(key)) errors.push(path + '.' + key + ':unknown_field');
  return true;
}

/** Deterministic, strict contract validator. Never repairs a malformed record. */
export function validateCorpusCapture(r) {
  const errors = [];
  if (!obj(r)) return { ok: false, errors: ['capture:object_required'] };
  let encoded;
  try { encoded = JSON.stringify(r); }
  catch { return { ok:false, errors:['capture:not_json_serializable'] }; }
  if (encoded === undefined) return { ok:false, errors:['capture:not_json_serializable'] };
  if (encoded.length > 16384)
    return { ok:false, errors:['capture:size_limit'] };
  if (!shape(r, ['schema','eventId','assetId','worldId','kind','title','capturedAt',
    'source','asset','policy','lineage'], 'capture', errors)) return { ok:false, errors };
  if (r.schema !== CORPUS_SCHEMA) errors.push('schema:unsupported');
  if (typeof r.eventId !== 'string' || !ids.test(r.eventId) || !r.eventId.startsWith('evt-'))
    errors.push('eventId:invalid');
  if (typeof r.assetId !== 'string' || !ids.test(r.assetId) || !r.assetId.startsWith('asset-'))
    errors.push('assetId:invalid');
  if (typeof r.worldId !== 'string' || !world.test(r.worldId)) errors.push('worldId:invalid');
  if (!allowed(r.kind, CORPUS_KINDS)) errors.push('kind:unknown');
  if (!text(r.title, 160)) errors.push('title:invalid');
  if (!timestamp(r.capturedAt)) errors.push('capturedAt:invalid');
  if (shape(r.source, ['registryId','mechanism','surface','actor','publicUri'], 'source', errors)) {
    if (!allowed(r.source.registryId, CORPUS_SOURCE_IDS)) errors.push('source.registryId:unknown');
    if (!allowed(r.source.mechanism, ['import','push'])) errors.push('source.mechanism:invalid');
    if (!text(r.source.surface, 64) || !surface.test(r.source.surface))
      errors.push('source.surface:invalid');
    if (r.source.actor !== 'owner') errors.push('source.actor:invalid');
    if (!safePublicUri(r.source.publicUri)) errors.push('source.publicUri:unsafe');
    if ((r.source.registryId === 'SRC-MANUAL-IMPORT' && r.source.mechanism !== 'import') ||
        (r.source.registryId === 'SRC-OWNER-INPUT' && r.source.mechanism !== 'push'))
      errors.push('source:registry_mechanism_mismatch');
  }
  if (shape(r.asset, ['mediaType','availability','contentRef','sha256','bytes','role'], 'asset', errors)) {
    if (!text(r.asset.mediaType,127) || !mime.test(r.asset.mediaType))
      errors.push('asset.mediaType:invalid');
    if (!allowed(r.asset.availability, CORPUS_AVAILABILITY))
      errors.push('asset.availability:invalid');
    if (!allowed(r.asset.role, ['original','derived'])) errors.push('asset.role:invalid');
    if (r.asset.contentRef !== null &&
        (typeof r.asset.contentRef !== 'string' || !assetRef.test(r.asset.contentRef)))
      errors.push('asset.contentRef:invalid');
    if (r.asset.sha256 !== null &&
        (typeof r.asset.sha256 !== 'string' || !sha.test(r.asset.sha256)))
      errors.push('asset.sha256:invalid');
    if (r.asset.bytes !== null && (!Number.isSafeInteger(r.asset.bytes) || r.asset.bytes < 0))
      errors.push('asset.bytes:invalid');
    if (r.asset.availability === 'stored' &&
        (typeof r.asset.sha256 !== 'string' || !sha.test(r.asset.sha256) ||
          r.asset.contentRef !== 'asset:' + r.assetId))
      errors.push('asset:stored_requires_digest_and_owned_ref');
    if (r.asset.availability === 'metadata_only' &&
        (r.asset.contentRef !== null || r.asset.sha256 !== null || r.asset.bytes !== null))
      errors.push('asset:metadata_only_has_no_payload');
    if (r.asset.availability === 'referenced' &&
        r.asset.contentRef === null && r.source?.publicUri == null)
      errors.push('asset:reference_required');
  }
  if (shape(r.policy, ['purpose','sensitivity','thirdParty','rights','ownerInitiated','grantRef'], 'policy', errors)) {
    if (r.policy.purpose !== 'private-personal-ai') errors.push('policy.purpose:invalid');
    if (!allowed(r.policy.sensitivity, ['S0','S1','S2','S3']))
      errors.push('policy.sensitivity:invalid');
    if (!allowed(r.policy.thirdParty, ['none','possible','present','unknown']))
      errors.push('policy.thirdParty:invalid');
    if (!allowed(r.policy.rights, ['unknown','review_required','owner_declared']))
      errors.push('policy.rights:invalid');
    if (r.policy.ownerInitiated !== true) errors.push('policy:owner_action_required');
    if (r.policy.grantRef !== null && !text(r.policy.grantRef,256))
      errors.push('policy.grantRef:invalid');
  }
  if (shape(r.lineage, ['parents','evidenceRefs'], 'lineage', errors)) {
    if (!refs(r.lineage.parents) || r.lineage.parents.includes(r.assetId))
      errors.push('lineage.parents:invalid');
    if (!refs(r.lineage.evidenceRefs)) errors.push('lineage.evidenceRefs:invalid');
    if (r.asset?.role === 'derived' &&
        (!Array.isArray(r.lineage.parents) || r.lineage.parents.length === 0))
      errors.push('lineage:derived_requires_parent');
  }
  return { ok: errors.length === 0, errors };
}
function sort(value) {
  if (Array.isArray(value)) return value.map(sort);
  if (obj(value)) return Object.fromEntries(
    Object.keys(value).sort().map(k => [k, sort(value[k])]));
  return value;
}
export function canonicalCorpusJson(record) {
  const checked = validateCorpusCapture(record);
  return checked.ok ? { ok:true, json:JSON.stringify(sort(record)) } : checked;
}
/** Same (world,event) and same bytes = replay, conflicting bytes = conflict. */
export function compareCorpusReplay(a, b) {
  const aa = canonicalCorpusJson(a), bb = canonicalCorpusJson(b);
  if (!aa.ok || !bb.ok) return { kind:'invalid', errors:[...(aa.errors||[]), ...(bb.errors||[])] };
  if (a.worldId !== b.worldId || a.eventId !== b.eventId) return { kind:'distinct' };
  return { kind: aa.json === bb.json ? 'replay' : 'conflict' };
}
/** Local digest over canonical event metadata, NOT a public telemetry identifier. */
export function corpusEventDigest(record) {
  const a = canonicalCorpusJson(record);
  return a.ok ? { ok:true, sha256:createHash('sha256').update(a.json, 'utf8').digest('hex') } : a;
}
