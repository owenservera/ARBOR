// Host-side bootstrap runtime: one ledger, one trusted writer, one bounded projection.
// The ledger lives beside the existing Host data (never inside the JSON authorities).
// If node:sqlite is unavailable the runtime fails closed: reads report the reason and
// every mutation is refused, so no personalization is silently dropped.
import path from 'node:path';
import { openLedger } from './ledger.mjs';
import { createWebMemory } from './web-memory.mjs';
import { createRustWebReader } from './rust-web-reader.mjs';
import { createBootstrapService, WORLD_DEFAULT } from './service.mjs';
import { readIngressRegistry, projectDataInventory } from '../data-intelligence/catalog.mjs';

export const RUNTIME_SCHEMA = 'vivim.bootstrap-runtime/1';

export function bootstrapPaths(dataRoot) {
  const dir = path.join(dataRoot, 'bootstrap');
  return { dir, ledger: path.join(dir, 'ledger.db') };
}

export function createBootstrapRuntime({ dataRoot, worldId = WORLD_DEFAULT, file = null, now } = {}) {
  if (typeof dataRoot !== 'string' || !dataRoot) throw new TypeError('Bootstrap runtime: dataRoot required');
  const paths = bootstrapPaths(dataRoot);
  const ledgerFile = file ?? paths.ledger;

  let ledger = null, service = null, error = null;
  try {
    ledger = openLedger({ file: ledgerFile });
    service = createBootstrapService({ ledger, worldId, ...(now ? { now } : {}) });
  } catch (cause) {
    error = { code: cause?.code ?? 'LEDGER_OPEN_FAILED', reason: String(cause?.message ?? cause).slice(0, 240) };
  }

  // Shares this Host's existing SQLite writer and world scope, never creates an external KB.
  const webMemory = ledger ? createWebMemory({ ledger, worldId, ...(now ? { now } : {}) }) : null;
  const rustReadPage = createRustWebReader({ dataRoot: path.resolve(dataRoot) });
  let refreshPromise = null, nextAttemptAt = 0, sourceError = null;
  async function readWebMemory(args = {}) {
    if (!webMemory) return memoryUnavailable();
    if (webMemory.optedOut()) return webMemory.recent(args);
    // Coalesce simultaneous desktop/phone reads. A read-only CLI child cannot
    // race with another Host-ledger writer, and failed queries never fabricate visits.
    if (!refreshPromise && Date.now() >= nextAttemptAt) {
      nextAttemptAt = Date.now() + 3000;
      refreshPromise = (async () => {
        try {
          const prior = ledger.webVisits.status(worldId);
          const cursor = prior?.source_kind === 'rust-cli' ? Number(prior.cursor ?? 0) : 0;
          const batch = await rustReadPage(cursor);
          webMemory.project(batch, { sourceKind: 'rust-cli' });
          sourceError = null;
        } catch (cause) {
          sourceError = cause?.code ?? 'WEB_RUST_QUERY_FAILED';
        }
      })().finally(() => { refreshPromise = null; });
    }
    if (refreshPromise) await refreshPromise;
    const view = webMemory.recent(args);
    if (!sourceError) return view;
    return { ...view, state: view.state === 'disabled' ? 'disabled' :
      view.items.some(item => item.sourceOrigin === 'rust-cli') ? 'stale' : 'bridge-unavailable',
      sourceError, note: view.note + ' Rust source read is unavailable (' + sourceError + ').' };
  }
  const memoryUnavailable = () => ({
    schema: 'vivim.web-memory-view/1', state: 'unavailable', items: [], nextCursor: null,
    coverage: 'unavailable', note: 'Host SQLite ledger unavailable; history cannot be read.'
  });

  function requireService() {
    if (service) return service;
    const failure = new Error('Bootstrap ledger unavailable: ' + error.reason);
    failure.code = error.code;
    throw failure;
  }

  // Bounded read for every surface. Never throws: a broken ledger is a reported state.
  function projection() {
    if (!service) return { state: 'unavailable', code: error.code, reason: error.reason };
    try { return { state: 'ready', ...service.projection() }; }
    catch (cause) { return { state: 'unavailable', code: cause?.code ?? 'PROJECTION_FAILED', reason: String(cause?.message ?? cause).slice(0, 240) }; }
  }
  function status() {
    if (!service) return { state: 'unavailable', code: error.code, reason: error.reason };
    try { return { state: 'ready', ...service.fullStatus() }; }
    catch (cause) { return { state: 'unavailable', code: cause?.code ?? 'STATUS_FAILED', reason: String(cause?.message ?? cause).slice(0, 240) }; }
  }

  return {
    schema: RUNTIME_SCHEMA, worldId, paths, file: ledgerFile,
    // Same single ledger the service writes through; exposed so the scheduler shares its transaction.
    get ledger() { return ledger; },
    state: service ? 'ready' : 'unavailable',
    error,
    projection, status,
    webMemory: readWebMemory,
    // Internal, Host-owned ingestion/read functions; never public HTTP write routes.
    projectWebMemory: (response, opts) => webMemory ? webMemory.project(response, opts) : requireService(),
    previewWebContext: args => webMemory ? webMemory.contextPreview(args) : requireService(),
    // Private read-only V1 inventory: bounded existing Host ledger aggregates only.
    // The ingress registry is policy metadata; it never enables capture.
    dataIngressRegistry: () => readIngressRegistry(),
    dataInventory: () => {
      if (!ledger) return { schema: 'vivim.data-inventory/1', state: 'unavailable',
        code: error?.code ?? 'LEDGER_UNAVAILABLE', reason: error?.reason ?? 'Bootstrap ledger unavailable' };
      try { return { state: 'ready', ...projectDataInventory({ ledger, worldId, ...(now ? { now } : {}) }) }; }
      catch (cause) { return { schema: 'vivim.data-inventory/1', state: 'unavailable',
        code: cause?.code ?? 'INVENTORY_FAILED', reason: String(cause?.message ?? cause).slice(0, 160) }; }
    },
    oracleCorpus: args => requireService().oracleCorpus(args),
    grantBootstrap: args => requireService().grantBootstrap(args),
    revokeGrant: () => requireService().revokeGrant(),
    ingestF02: args => requireService().ingestF02(args),
    ingestF01: args => requireService().ingestF01(args),
    ingestPass: args => requireService().ingestPass(args),
    choosePreset: args => requireService().choosePreset(args),
    undoTheme: args => requireService().undoTheme(args),
    previewUiProposal: proposal => requireService().previewUiProposal(proposal),
    applyUiProposal: args => requireService().applyUiProposal(args),
    undoUiRevision: args => requireService().undoUiRevision(args),
    uiRevision: args => requireService().uiRevision(args),
    uiRevisionStatus: args => requireService().uiRevisionStatus(args),
    setPassState: args => requireService().setPassState(args),
    setHardNo: args => requireService().setHardNo(args),
    clearHardNo: args => requireService().clearHardNo(args),
    setOwnerPreference: args => requireService().setOwnerPreference(args),
    clearOwnerPreference: args => requireService().clearOwnerPreference(args),
    phase: () => requireService().phase(),
    cards: () => requireService().cards(),
    close() { try { ledger?.close(); } catch { /* already closed */ } }
  };
}
