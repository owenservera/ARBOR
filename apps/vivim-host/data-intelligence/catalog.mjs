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
