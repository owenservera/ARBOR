# File: apps/vivim-host/data-intelligence/catalog.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/data-intelligence/catalog.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3351 B |
| Lines | 78 |
| Hash | 7c269435075b |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| INVENTORY_SCHEMA | const | 6 | yes | export const INVENTORY_SCHEMA = &#39;vivim.data-inventory/1&#39;; |
| REGISTRY_URL | const | 7 | no | const REGISTRY_URL = new URL(&#39;../../../docs/data-intelligence/ingress-registry.v1.json&#39;, import.meta.url); |
| readIngressRegistry | function | 9 | yes | export function readIngressRegistry({ read = readFileSync } = {}) { |
| raw | variable | 10 | no | let raw; |
| registry | const | 17 | no | const registry = JSON.parse(raw); |
| ids | const | 21 | no | const ids = new Set(); |
| projectDataInventory | function | 38 | yes | export function projectDataInventory({ ledger, worldId = &#39;world-local&#39;, now = () =&gt; new Date().toISOString() } = {}) { |
| raw | const | 43 | no | const raw = ledger.stats(worldId); |
| count | function | 44 | no | const count = key =&gt; { |
| value | const | 45 | no | const value = raw?.[key]; |
| registry | const | 49 | no | const registry = readIngressRegistry(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 4 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/bootstrap/runtime.mjs](../bootstrap/runtime.mjs.md) | ../data-intelligence/catalog.mjs |
| [apps/vivim-host/test/data-intelligence.test.mjs](../test/data-intelligence.test.mjs.md) | ../data-intelligence/catalog.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM personal data intelligence V1: read-only source registry and inventory
// projection. The Host remains the only writer. No new capture authority, send,
// retention decision, disclosure grant or raw-content archive is introduced here.
import { readFileSync } from 'node:fs';

export const INVENTORY_SCHEMA = 'vivim.data-inventory/1';
const REGISTRY_URL = new URL('../../../docs/data-intelligence/ingress-registry.v1.json', import.meta.url);

export function readIngressRegistry({ read = readFileSync } = {}) {
  let raw;
  try {
    raw = read(REGISTRY_URL, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') throw new Error('DATA_INGRESS_REGISTRY_UNAVAILABLE');
    throw err;
  }
  const registry = JSON.parse(raw);
  if (registry?.schema !== 'vivim.ingress-registry/1' || !Array.isArray(registry.items)) {
    throw new Error('DATA_INGRESS_REGISTRY_INVALID');
  }
  const ids = new Set();
  for (const entry of registry.items) {
    if (!/^(AI0[1-6]|CT01|FS01|EXT01|TEL0[1-3]|SEN01)$/.test(entry.id) ||
        ids.has(entry.id) || entry.captureEnabled !== false ||
        entry.contentPolicy !== 'reference_existing_authority') {
      throw new Error('DATA_INGRESS_REGISTRY_INVALID');
    }
    ids.add(entry.id);
  }
  if (ids.size !== 13) throw new Error('DATA_INGRESS_REGISTRY_INCOMPLETE');
  return registry;
}

// Aggregate counts ALREADY present in the bootstrap ledger. They are NOT a count
// of distinct data assets, completed AI executions or successful evaluations.
// No user messages, claim bodies, digests, source paths or third-party IDs leave
// the authority through this projection.
export function projectDataInventory({ ledger, worldId = 'world-local', now = () => new Date().toISOString() } = {}) {
  if (!ledger || typeof ledger.stats !== 'function') throw new TypeError('DATA_INVENTORY_LEDGER_REQUIRED');
  if (typeof worldId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(worldId)) {
    throw new TypeError('DATA_INVENTORY_WORLD_INVALID');
  }
  const raw = ledger.stats(worldId);
  const count = key => {
    const value = raw?.[key];
    if (!Number.isSafeInteger(value) || value < 0) throw new TypeError('DATA_INVENTORY_COUNT_INVALID');
    return value;
  };
  const registry = readIngressRegistry();
  return {
    schema: INVENTORY_SCHEMA,
    worldId,
    observedAt: now(),
    authority: 'host-bootstrap-ledger',
    inventoryState: 'partial_existing_counts_only',
    dataAssetIndexState: 'not_implemented',
    privateContentIncluded: false,
    providerCaptureState: 'not_verified_by_inventory',
    utility: { status: 'not_measured', currency: null, multiplier: null },
    counts: {
      bootstrapObservations: count('observations'),
      bootstrapClaims: count('claims'),
      bootstrapRelationships: count('relationships'),
      bootstrapContradictions: count('contradictions'),
      bootstrapThemes: count('themes'),
      bootstrapPreferences: count('preferences'),
      bootstrapPasses: count('passes'),
      bootstrapJobs: count('jobs')
    },
    ingress: registry.items.map(item => ({
      id: item.id,
      kind: item.kind,
      indexState: item.id === 'CT01' ? 'existing_aggregate_only' : 'not_indexed',
      enabledByThisModule: false,
      utilityStatus: 'untested'
    }))
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
