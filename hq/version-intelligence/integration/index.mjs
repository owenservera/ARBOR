/**
 * ARBOR HVI G1 native library/service boundary. Deterministic source analysis
 * only; Host registration and live actor/session grants belong to Lane H.
 */
import { bridgeSourceManifests } from './source-manifest-adapter.mjs';
import { comparePinned } from '../compare/index.mjs';
import { projectIntegratedReport } from './comparison-report-adapter.mjs';
import { joinParityEvidence } from './parity-evidence-adapter.mjs';
import { buildPinnedIdentityCrosswalk } from '../identity/index.mjs';
import { acquirePinnedSnapshot } from '../sources/snapshots.mjs';
import { assertVerifiedAdapter } from '../sources/adapters.mjs';

export const HVI_CAPABILITY_ID = 'arbor.hvi.compare.pinned/1';
export const HVI_TOOL_REQUEST_SCHEMA = 'arbor.hvi.tool-request/1';
export const HVI_SOURCE_SELECTION_SCHEMA = 'arbor.hvi.source-selection/1';
export const HVI_TOOL_RESULT_SCHEMA = 'arbor.hvi.tool-result/1';
export const HVI_TOOL_DEFINITION = Object.freeze({
  id: HVI_CAPABILITY_ID, kind: 'read_only_development_analysis',
  description: 'Compare 2..N explicitly pinned Git-object source manifests; source facts are not runtime proof.',
  triggers: ['compare repository versions','compare three commits','explain source lineage','show migration source differences'],
  inputs: { schema: HVI_TOOL_REQUEST_SCHEMA, sourceManifests: 'arbor.hvi.manifest/1[]',
    sourceSelection: HVI_SOURCE_SELECTION_SCHEMA, targetPinId: 'sha256 pin ID', pairwise: 'boolean', scope: 'bounded prefixes',
    budgets: 'resource ceilings', includeParity: 'boolean', identityRecords: 'source declarations only' },
  outputs: { schema: HVI_TOOL_RESULT_SCHEMA, comparison: 'arbor.hvi.version-comparison/1',
    evidenceReport: 'arbor.hvi.adapter.comparison-report/1',
    adapters: 'dual source manifest receipts', authority: 'source-only unverified' },
  authority: 'Host grants and actor/session enforcement REQUIRED before remote exposure',
  liveRegistered: false, effects: 'none', hiddenAutoScan: false,
  immediateLaunchMode: 'synthetic_fixture_or_explicit_operator_only',
});
function fail(code) { const e = new Error('HVI_TOOL_' + code); e.code = code; throw e; }
function bound(value, fallback, max) {
  if (value == null) return fallback;
  if (!Number.isSafeInteger(value) || value < 1 || value > max) fail('RESOURCE_LIMIT');
  return value;
}
function validatePrefixes(scope) {
  const prefixes = scope?.prefixes ?? [''];
  if (!Array.isArray(prefixes) || prefixes.length < 1 || prefixes.length > 32 ||
      prefixes.some(p => typeof p !== 'string' || p.includes('..') || p.includes('\\') ||
        p.startsWith('/') || p.includes('\0'))) fail('SCOPE_ESCAPE');
  return { prefixes };
}

/** Caller grant callback is NOT independently attested Host authority. */
export async function runHviTool(input, { authorize, signal, context } = {}) {
  if (input?.schema !== HVI_TOOL_REQUEST_SCHEMA ||
      !Array.isArray(input.sourceManifests)) fail('INVALID_REQUEST');
  if (typeof authorize !== 'function') fail('SOURCE_UNAUTHORIZED');
  if (signal?.aborted) fail('RESOURCE_LIMIT');
  const maxPins = bound(input.budgets?.maxPins, 16, 16);
  const maxEntries = bound(input.budgets?.maxEntries, 100000, 1000000);
  const maxFindings = bound(input.budgets?.maxFindings, 20000, 100000);
  if (input.sourceManifests.length < 2 || input.sourceManifests.length > maxPins) fail('RESOURCE_LIMIT');
  const totalNative = input.sourceManifests.reduce((a, m) => a + (Array.isArray(m?.entries) ? m.entries.length : 0), 0);
  if (totalNative > maxEntries) fail('RESOURCE_LIMIT');
  const bridges = bridgeSourceManifests(input.sourceManifests);
  for (const b of bridges) {
    if (signal?.aborted) fail('RESOURCE_LIMIT');
    const decision = await authorize({ operation: 'hvi.source.compare', scope: 'development',
      capabilityId: HVI_CAPABILITY_ID, pinId: b.pin.pinId,
      repoIdentity: b.pin.repoIdentity, resolvedCommitSha: b.pin.resolvedCommitSha,
      sourceGrantRef: b.pin.sourceGrantRef || null, context: context || null });
    if (decision !== true) fail('SOURCE_UNAUTHORIZED');
  }
  if (!bridges.some(b => b.pin.pinId === input.targetPinId)) fail('PIN_NOT_FOUND');
  if (input.identityDecisions?.length) fail('EQUIVALENCE_UNPROVEN');
  const comparison = comparePinned({
    pins: bridges.map(b => b.pin), manifests: bridges.map(b => b.manifest),
    targetPinId: input.targetPinId, pairwise: input.pairwise ?? false,
    scope: validatePrefixes(input.scope), signal,
    budgets: { maxPins, maxEntries, maxFindings,
      maxPairs: bound(input.budgets?.maxPairs, 120, 8128) },
    identityDecisions: [],
  });
  const evidenceReport = projectIntegratedReport(comparison, input.reportOptions || {});
  let identity = null;
  if (input.identityRecords != null || input.identityLinks != null) {
    if (!Array.isArray(input.identityRecords ?? []) ||
        !Array.isArray(input.identityLinks ?? []) ||
        (input.identityRecords || []).length > 10000) fail('RESOURCE_LIMIT');
    identity = buildPinnedIdentityCrosswalk({
      pins: bridges.map(b => b.pin),
      records: input.identityRecords || [], links: input.identityLinks || [],
      decisions: [], maxRecords: 10000, maxCandidatePairs: 10000 });
  }
  let parity = null;
  if (input.includeParity === true) {
    const target = bridges.find(b => b.pin.pinId === input.targetPinId);
    if (bridges.some(b => b.nativeManifest.entries.length > 10000)) fail('RESOURCE_LIMIT');
    parity = bridges.filter(b => b !== target).map(donorBridge =>
      joinParityEvidence({ donorBridge, targetBridge: target, comparison }));
  }
  return {
    schema: HVI_TOOL_RESULT_SCHEMA, capabilityId: HVI_CAPABILITY_ID,
    status: evidenceReport.status, runtimeAccepted: false,
    grantProvenance: 'CALLER_SUPPLIED_NOT_HOST_ATTESTED',
    hostBound: false, sourceAuthority: 'READ_ONLY_DEVELOPMENT',
    sourcePins: bridges.map(b => b.pin),
    adapterReceipts: bridges.map(b => b.receipt),
    comparison, evidenceReport, identity, parity,
    limitations: ['not runtime verified','Host agent route not yet registered by H',
      'no donor file execution','path absence is not capability absence'],
  };
}

function validateSourceSelection(input) {
  if (input?.schema !== HVI_SOURCE_SELECTION_SCHEMA || !Array.isArray(input.sources) ||
      input.sources.length < 2 || input.sources.length > 16) fail('INVALID_REQUEST');
  if (!Number.isSafeInteger(input.targetIndex) || input.targetIndex < 0 ||
      input.targetIndex >= input.sources.length) fail('INVALID_REQUEST');
  if (input.pairwise !== undefined && input.pairwise !== true && input.pairwise !== false) {
    fail('INVALID_REQUEST');
  }
  if (input.includeParity !== undefined && typeof input.includeParity !== 'boolean') {
    fail('INVALID_REQUEST');
  }
  const seen = new Set();
  return input.sources.map(source => {
    if (!source || typeof source !== 'object' || Array.isArray(source) ||
        typeof source.repo !== 'string' || (source.ref == null && source.sha == null)) {
      fail('INVALID_REQUEST');
    }
    if (source.provider !== undefined && source.provider !== 'github') fail('SOURCE_UNAUTHORIZED');
    if (source.subPath !== undefined && typeof source.subPath !== 'string') fail('SCOPE_ESCAPE');
    if (source.sourceGrantRef !== undefined && source.sourceGrantRef !== null &&
        typeof source.sourceGrantRef !== 'string') fail('SOURCE_UNAUTHORIZED');
    const key = String(source.repo) + '\u0000' + String(source.ref ?? '') + '\u0000' +
      String(source.sha ?? '') + '\u0000' + String(source.subPath ?? '');
    if (seen.has(key)) fail('INVALID_REQUEST');
    seen.add(key);
    return { ...source, provider: 'github' };
  });
}

/**
 * Live composition: registered approved repositories -> verified pins + snapshots
 * -> the existing runHviTool analysis. No second interpreter: acquisition only
 * feeds the same comparison, identity, report and parity adapters.
 * options.adapter/approvedRepositories are authority-bearing injections; the
 * authorize callback is re-evaluated on every source read.
 */
export async function runHviSelectedSources(input, {
  adapter, approvedRepositories, authorize, signal, context, limits, inspectContent, acquiredAt,
} = {}) {
  const sources = validateSourceSelection(input);
  assertVerifiedAdapter(adapter);
  if (typeof authorize !== 'function') fail('SOURCE_UNAUTHORIZED');
  const acquired = [];
  for (const source of sources) {
    if (signal?.aborted) fail('RESOURCE_LIMIT');
    const selection = await acquirePinnedSnapshot(source, {
      adapter, authorize, approvedRepositories, limits,
      inspectContent: inspectContent === true, signal, acquiredAt,
    });
    acquired.push(selection);
  }
  const target = acquired[input.targetIndex];
  return runHviTool({
    schema: HVI_TOOL_REQUEST_SCHEMA,
    sourceManifests: acquired.map(x => x.manifest),
    targetPinId: target.pin.pinId,
    pairwise: input.pairwise === true,
    scope: input.scope,
    budgets: input.budgets,
    includeParity: input.includeParity === true,
    reportOptions: input.reportOptions,
  }, { authorize, signal, context });
}
