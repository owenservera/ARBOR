// VIVIM H05/B05: approved local, reversible *configuration* activations.
// The existing PC VersionedStore remains canonical; no second DB, network, browser,
// provider send, filesystem effect or permission grant is created here.
import { createHash } from 'node:crypto';
export const ACTIVATION_SCHEMA = 'vivim.capability-activation/1';
const ID = /^[a-z][a-z0-9._:-]{0,95}$/;
const WORLD = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,63}$/;
const PRESETS = new Set(['card','list','detail','gallery','timeline','off']);
const fail = (code) => Object.assign(new Error(code), { code });
const stable = v => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k,stable(v[k])])) : v;
const digest = o => createHash('sha256').update(JSON.stringify(stable(o))).digest('hex');
const clone = x => structuredClone(x);
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x) &&
  (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
function configFrom(raw, worldId) {
  if (!raw) return { schema:ACTIVATION_SCHEMA, worldId, capabilities:{}, views:{}, receipts:[] };
  if (!plain(raw) || raw.schema !== ACTIVATION_SCHEMA || raw.worldId !== worldId ||
      !plain(raw.capabilities) || !plain(raw.views) || !Array.isArray(raw.receipts)) throw fail('ACTIVATION_STATE_CORRUPT');
  return clone({schema:raw.schema,worldId,capabilities:raw.capabilities,views:raw.views,receipts:raw.receipts});
}
function versionOf(store, name) { const n = store.current(name); if (n !== null && (!Number.isInteger(n) || n < 1)) throw fail('ACTIVATION_VERSION_CORRUPT'); return n; }
function effectFor(capability, desired, view) {
  if (typeof desired !== 'boolean') throw fail('ACTIVATION_DESIRED_INVALID');
  if (view !== undefined && (!capability.views || !capability.views.includes(view) || !PRESETS.has(view))) throw fail('ACTIVATION_VIEW_INVALID');
  return {kind:'local-config',capabilityId:capability.id,enabled:desired,
    ...(view === undefined ? {} : {view})};
}
function sanitizedCatalog(catalog) {
  if (!Array.isArray(catalog) || catalog.length > 200) throw fail('ACTIVATION_CATALOG_INVALID');
  const out = new Map();
  for (const c of catalog) {
    if (!plain(c) || !ID.test(c.id) || !['R1_ADDITIVE','R2_SENSITIVE','R3_CAPABILITY'].includes(c.risk) ||
        !Array.isArray(c.requires) || c.requires.length > 20 || c.requires.some(x=>!ID.test(x)) ||
        (c.views !== undefined && (!Array.isArray(c.views) || c.views.some(x=>!PRESETS.has(x)))) || out.has(c.id))
      throw fail('ACTIVATION_CATALOG_INVALID');
    out.set(c.id,{id:c.id,risk:c.risk,requires:[...new Set(c.requires)],views:c.views??[]});
  }
  return out;
}
export function createCapabilityActivationEngine({store,worldId,catalog,verifyOwner,verifyGrant,now=()=>new Date().toISOString()}={}) {
  if (!WORLD.test(worldId??'') || !store?.current || !store?.load || !store?.compareAndSave ||
    typeof verifyOwner!=='function' || typeof verifyGrant!=='function') throw fail('ACTIVATION_DEPENDENCY');
  const known = sanitizedCatalog(catalog);
  const name = 'world-' + worldId.toLowerCase();
  const timestamp=()=>{const t=now(); if (typeof t!=='string' || !Number.isFinite(Date.parse(t))) throw fail('ACTIVATION_CLOCK'); return t;};
  function current() {
    const version=versionOf(store,name);
    return {version,config:configFrom(version===null?null:store.load(name),worldId)};
  }
  function plan({capabilityId,enabled,view,expectedVersion,idempotencyKey}={}) {
    if (typeof capabilityId !== 'string' || !ID.test(capabilityId) || !known.has(capabilityId) ||
        typeof idempotencyKey !== 'string' || !ID.test(idempotencyKey)) throw fail('ACTIVATION_INVALID_INPUT');
    const c=known.get(capabilityId);
    if (c.risk === 'R3_CAPABILITY') throw fail('ACTIVATION_EXTERNAL_EFFECT_REFUSED');
    const effect=effectFor(c,enabled,view);
    const {version,config}=current();
    if (expectedVersion !== version) throw fail('ACTIVATION_STALE_BASE');
    const missing=enabled ? c.requires.filter(id=>config.capabilities[id]!==true) :
      [...known.values()].filter(other=>other.requires.includes(capabilityId) &&
        config.capabilities[other.id]===true).map(x=>x.id);
    const risk=c.risk;
    const body={schema:'vivim.activation-plan/1',worldId,expectedVersion,idempotencyKey,
      capabilityId,effect,risk,requires:c.requires,missing,prior:{enabled:config.capabilities[capabilityId]===true,
        view:config.views[capabilityId]??null}};
    return Object.freeze({...body,planDigest:digest(body)});
  }
  async function activate(planInput,approval) {
    if (!plain(planInput) || !plain(approval)) throw fail('ACTIVATION_PLAN_REQUIRED');
    // A prior committed receipt is authoritative even after the base revision has advanced.
    // Replays cannot repeat an effect; mismatched digests cannot hijack a key.
    const replay=current().config.receipts.find(r=>r.idempotencyKey===planInput.idempotencyKey);
    if (replay) {
      if (replay.planDigest!==planInput.planDigest) throw fail('ACTIVATION_IDEMPOTENCY_CONFLICT');
      return {...clone(replay),replayed:true};
    }
    // Never trust caller-supplied effects, prerequisites or digest: recompute from catalog/state.
    const actual=plan({capabilityId:planInput.capabilityId,enabled:planInput.effect?.enabled,
      view:planInput.effect?.view,expectedVersion:planInput.expectedVersion,idempotencyKey:planInput.idempotencyKey});
    if (actual.planDigest !== planInput.planDigest || JSON.stringify(stable(actual))!==JSON.stringify(stable(planInput)))
      throw fail('ACTIVATION_PLAN_TAMPERED');
    if (actual.missing.length) throw fail('ACTIVATION_PREREQUISITE_MISSING');
    if (approval.worldId!==worldId || approval.planDigest!==actual.planDigest ||
        approval.expectedVersion!==actual.expectedVersion || approval.idempotencyKey!==actual.idempotencyKey ||
        typeof approval.approvalId!=='string' || !ID.test(approval.approvalId) ||
        !Number.isFinite(Date.parse(approval.expiresAt)) || Date.parse(approval.expiresAt)<=Date.parse(timestamp()))
      throw fail('ACTIVATION_APPROVAL_MISMATCH');
    const [owner,grant]=await Promise.all([
      verifyOwner({approval,plan:actual,requireFresh:actual.risk==='R2_SENSITIVE'}),
      verifyGrant({worldId,capabilityId:actual.capabilityId,risk:actual.risk,planDigest:actual.planDigest})]);
    if (owner?.verified!==true || owner?.approvalId!==approval.approvalId ||
      owner?.planDigest!==actual.planDigest || owner?.revoked===true ||
      (actual.risk==='R2_SENSITIVE' && owner?.fresh!==true) || grant?.allowed!==true)
      throw fail('ACTIVATION_AUTHORITY_REQUIRED');
    const {version,config}=current();
    // Persist replay key in the SAME canonical version transaction, not a second store.
    const existing=config.receipts.find(r=>r.idempotencyKey===actual.idempotencyKey);
    if (existing) {
      if (existing.planDigest!==actual.planDigest) throw fail('ACTIVATION_IDEMPOTENCY_CONFLICT');
      return {...clone(existing),replayed:true};
    }
    if (version !== actual.expectedVersion) throw fail('ACTIVATION_STALE_BASE');
    if (config.receipts.length>=500) throw fail('ACTIVATION_RECEIPT_CAPACITY');
    const next=clone(config);
    next.capabilities[actual.capabilityId]=actual.effect.enabled;
    if (actual.effect.view!==undefined) next.views[actual.capabilityId]=actual.effect.view;
    const receipt={schema:ACTIVATION_SCHEMA,worldId,idempotencyKey:actual.idempotencyKey,
      planDigest:actual.planDigest,approvalId:approval.approvalId,capabilityId:actual.capabilityId,
      expectedVersion:version,at:timestamp(),kind:'config-only',externalEffects:'none'};
    next.receipts.push(receipt);
    const saved=store.compareAndSave(name,next,{expectedVersion:version,changeNote:`activation ${actual.capabilityId}`});
    return {...receipt,version:saved.version};
  }
  function previewUndo(targetVersion) {
    const {version}=current();
    if (!Number.isInteger(targetVersion)||targetVersion<1||version===null||targetVersion>version) throw fail('ACTIVATION_UNDO_TARGET');
    const target=configFrom(store.load(name,targetVersion),worldId);
    return {schema:'vivim.activation-undo-plan/1',worldId,expectedVersion:version,targetVersion,
      targetDigest:digest({capabilities:target.capabilities,views:target.views}),note:'Only configuration restores; external effects are never reversed'};
  }
  async function undo(undoPlan,approval) {
    if (!plain(undoPlan)||!plain(approval)) throw fail('ACTIVATION_UNDO_INVALID');
    const canonical=previewUndo(undoPlan.targetVersion);
    if (JSON.stringify(canonical)!==JSON.stringify(undoPlan) || approval.worldId!==worldId ||
        approval.targetDigest!==canonical.targetDigest || approval.expectedVersion!==canonical.expectedVersion ||
        !ID.test(approval.approvalId??'') || !Number.isFinite(Date.parse(approval.expiresAt)) ||
        Date.parse(approval.expiresAt)<=Date.parse(timestamp())) throw fail('ACTIVATION_UNDO_INVALID');
    const owner=await verifyOwner({approval,plan:canonical,requireFresh:true});
    const grant=await verifyGrant({worldId,operation:'undo-config',risk:'R2_SENSITIVE',planDigest:canonical.targetDigest});
    if (owner?.verified!==true || owner?.fresh!==true || owner?.revoked===true ||
        owner?.approvalId!==approval.approvalId || owner?.planDigest!==canonical.targetDigest || grant?.allowed!==true)
      throw fail('ACTIVATION_AUTHORITY_REQUIRED');
    // Append a fresh restore revision but retain all receipt keys, including activations
    // performed *after* the target version. Never resurrect a replayable old key.
    const existing=current().config;
    const historical=configFrom(store.load(name,canonical.targetVersion),worldId);
    const restored={...existing,capabilities:historical.capabilities,views:historical.views};
    const saved=store.compareAndSave(name,restored,{expectedVersion:canonical.expectedVersion,
      changeNote:`restore config v${canonical.targetVersion}`});
    return {schema:ACTIVATION_SCHEMA,worldId,version:saved.version,restoredFrom:canonical.targetVersion,
      externalEffects:'not_reversed'};
  }
  return {schema:ACTIVATION_SCHEMA,worldId,current,plan,activate,previewUndo,undo};
}
