# File: apps/vivim-host/bootstrap/capability-activation.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/bootstrap/capability-activation.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10413 B |
| Lines | 144 |
| Hash | cff0e68392fd |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ACTIVATION_SCHEMA | const | 5 | yes | export const ACTIVATION_SCHEMA = &#39;vivim.capability-activation/1&#39;; |
| ID | const | 6 | no | const ID = /^[a-z][a-z0-9._:-]{0,95}$/; |
| WORLD | const | 7 | no | const WORLD = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,63}$/; |
| PRESETS | const | 8 | no | const PRESETS = new Set([&#39;card&#39;,&#39;list&#39;,&#39;detail&#39;,&#39;gallery&#39;,&#39;timeline&#39;,&#39;off&#39;]); |
| fail | function | 9 | no | const fail = (code) =&gt; Object.assign(new Error(code), { code }); |
| stable | function | 10 | no | const stable = v =&gt; Array.isArray(v) ? v.map(stable) : v &amp;&amp; typeof v === &#39;object&#39; |
| digest | function | 12 | no | const digest = o =&gt; createHash(&#39;sha256&#39;).update(JSON.stringify(stable(o))).digest(&#39;hex&#39;); |
| clone | function | 13 | no | const clone = x =&gt; structuredClone(x); |
| plain | function | 14 | no | const plain = x =&gt; x !== null &amp;&amp; typeof x === &#39;object&#39; &amp;&amp; !Array.isArray(x) &amp;&amp; |
| configFrom | function | 16 | no | function configFrom(raw, worldId) { |
| versionOf | function | 22 | no | function versionOf(store, name) { const n = store.current(name); if (n !== null &amp;&amp; (!Number.isInteger(n) \|\| n &lt; 1)) throw fail(&#39;ACTIVATION_VERSION_CORRUPT&#39;); return n; } |
| effectFor | function | 23 | no | function effectFor(capability, desired, view) { |
| sanitizedCatalog | function | 29 | no | function sanitizedCatalog(catalog) { |
| out | const | 31 | no | const out = new Map(); |
| createCapabilityActivationEngine | function | 41 | yes | export function createCapabilityActivationEngine({store,worldId,catalog,verifyOwner,verifyGrant,now=()=&gt;new Date().toISOString()}={}) { |
| known | const | 44 | no | const known = sanitizedCatalog(catalog); |
| name | const | 45 | no | const name = &#39;world-&#39; + worldId.toLowerCase(); |
| timestamp | function | 46 | no | const timestamp=()=&gt;{const t=now(); if (typeof t!==&#39;string&#39; \|\| !Number.isFinite(Date.parse(t))) throw fail(&#39;ACTIVATION_CLOCK&#39;); return t;}; |
| current | function | 47 | no | function current() { |
| version | const | 48 | no | const version=versionOf(store,name); |
| plan | function | 51 | no | function plan({capabilityId,enabled,view,expectedVersion,idempotencyKey}={}) { |
| c | const | 54 | no | const c=known.get(capabilityId); |
| effect | const | 56 | no | const effect=effectFor(c,enabled,view); |
| missing | const | 59 | no | const missing=enabled ? c.requires.filter(id=&gt;config.capabilities[id]!==true) : |
| risk | const | 62 | no | const risk=c.risk; |
| body | const | 63 | no | const body={schema:&#39;vivim.activation-plan/1&#39;,worldId,expectedVersion,idempotencyKey, |
| activate | function | 68 | no | async function activate(planInput,approval) { |
| replay | const | 72 | no | const replay=current().config.receipts.find(r=&gt;r.idempotencyKey===planInput.idempotencyKey); |
| actual | const | 78 | no | const actual=plan({capabilityId:planInput.capabilityId,enabled:planInput.effect?.enabled, view:planInput.effect?.view,expectedVersion:planInput.expectedVersion,idempotencyKey:planInput.idempotencyKey… |
| existing | const | 97 | no | const existing=config.receipts.find(r=&gt;r.idempotencyKey===actual.idempotencyKey); |
| next | const | 104 | no | const next=clone(config); |
| receipt | const | 107 | no | const receipt={schema:ACTIVATION_SCHEMA,worldId,idempotencyKey:actual.idempotencyKey, |
| saved | const | 111 | no | const saved=store.compareAndSave(name,next,{expectedVersion:version,changeNote:`activation ${actual.capabilityId}`}); |
| previewUndo | function | 114 | no | function previewUndo(targetVersion) { |
| target | const | 117 | no | const target=configFrom(store.load(name,targetVersion),worldId); |
| undo | function | 121 | no | async function undo(undoPlan,approval) { |
| canonical | const | 123 | no | const canonical=previewUndo(undoPlan.targetVersion); |
| owner | const | 128 | no | const owner=await verifyOwner({approval,plan:canonical,requireFresh:true}); |
| grant | const | 129 | no | const grant=await verifyGrant({worldId,operation:&#39;undo-config&#39;,risk:&#39;R2_SENSITIVE&#39;,planDigest:canonical.targetDigest}); |
| existing | const | 135 | no | const existing=current().config; |
| historical | const | 136 | no | const historical=configFrom(store.load(name,canonical.targetVersion),worldId); |
| restored | const | 137 | no | const restored={...existing,capabilities:historical.capabilities,views:historical.views}; |
| saved | const | 138 | no | const saved=store.compareAndSave(name,restored,{expectedVersion:canonical.expectedVersion, changeNote:`restore config v${canonical.targetVersion}`}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 145 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
