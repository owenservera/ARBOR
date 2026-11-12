/**
 * Wave 3 Lane G: inert, exact Host v6 descriptor crosswalk fixture.
 * A trusted test/integration broker provides source bytes and owner-reviewed bindings;
 * this module CANNOT certify the broker, grants, live availability, or effect execution.
 * No registry, transport, Host calls, approval, fuzzy aliases or provider sends.
 */
import { createHash } from 'node:crypto';
import { compileVisualCommand } from './compile.ts';
import { validRow, type ActionDescriptor, type ArgRule, type CrosswalkRow } from './crosswalk.ts';
import { DIGEST, onlyKeys, safeRecord, validPins, type Compilation, type Risk, type VersionPins, type VisualCommand } from './ir.ts';
import type { HostActionDescriptor } from '../host/port.ts';

const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
const MAX_CATALOG_BYTES = 256_000;
const MAX_HQ_BYTES = 256_000;
const RISKS: readonly string[] = ['R0', 'R1', 'R2', 'R3'];
const READINESS: readonly string[] = ['verified', 'source_wired', 'adapter_pending', 'enforcement_missing', 'unsupported'];

/** Stable hashing only for comparing the *same* action argument contract, not a Host signature. */
export function descriptorArgsDigest(args: unknown): string | null {
  if (!safeRecord(args)) return null;
  const encode = (value: unknown): string => {
    if (Array.isArray(value)) return '[' + value.map(encode).join(',') + ']';
    if (safeRecord(value)) return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + encode(value[k])).join(',') + '}';
    return JSON.stringify(value);
  };
  try { return sha256(encode(args)); } catch { return null; }
}

/** Fixture-only human review: not asserted to exist in the current HQ action registry. */
export type ReviewedHostBinding = Readonly<{
  schema: 'vivim.reviewed-host-binding-fixture/1';
  semanticId: string;
  semanticVersion: string;
  actionId: string;
  risk: Risk;
  argsSchemaSha256: string;
  hostCatalogSha256: string;
  hqRegistrySha256: string;
  reviewed: true;
}>;

/** Trusted broker input. NEVER sourced from an owner command, NLCL output, or an AI proposal. */
export type DescriptorProofContext = Readonly<{
  schema: 'vivim.descriptor-proof-context-fixture/1';
  catalogText: string;
  expectedCatalogSha256: string;
  hqRegistryText: string;
  expectedHqRegistrySha256: string;
  reviews: readonly ReviewedHostBinding[];
  currentVersions: VersionPins;
  deviceSurface: 'desktop' | 'phone';
}>;

type CatalogAction = Pick<HostActionDescriptor, 'actionId' | 'risk' | 'readiness'> & {
  args: Readonly<Record<string, ArgRule>>;
};
export type DescriptorCrosswalkEvidence = Readonly<{
  evidenceClass: 'source_bound_inert_fixture';
  effectInvoked: false;
  hostAuthorizationRequired: true;
  liveHostVerified: false;
  catalogVersion: number;
  catalogSha256: string;
  hqRegistrySha256: string;
  argsSchemaSha256: string;
  deviceSurface: 'desktop' | 'phone';
}>;
export type DescriptorProofResult =
  | Readonly<{ outcome: 'candidate'; command: VisualCommand; evidence: DescriptorCrosswalkEvidence }>
  | Readonly<{ outcome: 'refused' | 'clarification_required'; reasonCode: string; alternatives: readonly string[]; effectInvoked: false }>;

function refuse(reasonCode: string, outcome: 'refused' | 'clarification_required' = 'refused'): DescriptorProofResult {
  return { outcome, reasonCode, alternatives: [], effectInvoked: false };
}
function reviewed(v: unknown): v is ReviewedHostBinding {
  return onlyKeys(v, ['schema', 'semanticId', 'semanticVersion', 'actionId', 'risk', 'argsSchemaSha256',
    'hostCatalogSha256', 'hqRegistrySha256', 'reviewed']) &&
    v.schema === 'vivim.reviewed-host-binding-fixture/1' && v.reviewed === true &&
    typeof v.semanticId === 'string' && /^[a-z0-9][a-z0-9._-]{0,94}@\d+(?:\.\d+)*$/.test(v.semanticId) &&
    typeof v.semanticVersion === 'string' && v.semanticVersion === v.semanticId.split('@')[1] &&
    typeof v.actionId === 'string' && /^[a-z][a-z0-9._-]{1,95}$/.test(v.actionId) &&
    RISKS.includes(v.risk as string) &&
    [v.argsSchemaSha256, v.hostCatalogSha256, v.hqRegistrySha256].every(x => typeof x === 'string' && DIGEST.test(x));
}
function validContext(v: unknown): v is DescriptorProofContext {
  return onlyKeys(v, ['schema', 'catalogText', 'expectedCatalogSha256', 'hqRegistryText',
    'expectedHqRegistrySha256', 'reviews', 'currentVersions', 'deviceSurface']) &&
    v.schema === 'vivim.descriptor-proof-context-fixture/1' &&
    typeof v.catalogText === 'string' && Buffer.byteLength(v.catalogText) <= MAX_CATALOG_BYTES &&
    typeof v.hqRegistryText === 'string' && Buffer.byteLength(v.hqRegistryText) <= MAX_HQ_BYTES &&
    typeof v.expectedCatalogSha256 === 'string' && DIGEST.test(v.expectedCatalogSha256) &&
    typeof v.expectedHqRegistrySha256 === 'string' && DIGEST.test(v.expectedHqRegistrySha256) &&
    Array.isArray(v.reviews) && v.reviews.length >= 1 && v.reviews.length <= 64 &&
    v.reviews.every(reviewed) && validPins(v.currentVersions) &&
    typeof v.currentVersions.hostWorld === 'string' && typeof v.currentVersions.policy === 'string' &&
    (v.deviceSurface === 'desktop' || v.deviceSurface === 'phone');
}
function parseCatalog(text: string): {version: number; actions: readonly CatalogAction[]} | null {
  let payload: unknown;
  try { payload = JSON.parse(text); } catch { return null; }
  if (!safeRecord(payload) || payload.schema !== 'vivim.control-action-catalog/1' ||
      !Number.isSafeInteger(payload.version) || (payload.version as number) < 1 ||
      !safeRecord(payload.policy) ||
      payload.policy.allUserFacingActionsRequireTextPath !== true ||
      payload.policy.uiSharesTypedExecutor !== true ||
      payload.policy.unverifiedActionsAreNotAvailable !== true ||
      payload.policy.modelRole !== 'candidate_only' ||
      payload.policy.sourceWiredIsNotLiveAcceptance !== true ||
      !Array.isArray(payload.actions) || payload.actions.length > 512) return null;
  const ids = new Set<string>();
  const actions: CatalogAction[] = [];
  for (const raw of payload.actions) {
    if (!safeRecord(raw) || typeof raw.id !== 'string' || !/^[a-z][a-z0-9._-]{1,95}$/.test(raw.id) ||
        ids.has(raw.id) || typeof raw.risk !== 'string' || !RISKS.includes(raw.risk) ||
        typeof raw.readiness !== 'string' || !READINESS.includes(raw.readiness) || !safeRecord(raw.args)) return null;
    ids.add(raw.id);
    // The canonical crosswalk validator owns argument-schema validation.
    actions.push({actionId:raw.id, risk:raw.risk as Risk,
      readiness:raw.readiness as HostActionDescriptor['readiness'], args:raw.args as Record<string, ArgRule>});
  }
  return {version:payload.version as number, actions};
}

/**
 * Pure ingress: exact text/touch/keyboard -> same typed IR (apart from source modality).
 * A valid candidate is explicitly NOT an approval, grant, authenticated Host plan or send.
 */
export function compileDescriptorProof(input: unknown, trusted: unknown): DescriptorProofResult {
  if (!validContext(trusted)) return refuse('INVALID_TRUSTED_FIXTURE');
  if (sha256(trusted.catalogText) !== trusted.expectedCatalogSha256 ||
      sha256(trusted.hqRegistryText) !== trusted.expectedHqRegistrySha256)
    return refuse('SOURCE_DIGEST_MISMATCH');
  const catalog = parseCatalog(trusted.catalogText);
  if (!catalog) return refuse('INVALID_HOST_CATALOG');
  const semanticIds = new Set<string>();
  const actionIds = new Set<string>();
  const rows: CrosswalkRow[] = [];
  const descriptors: ActionDescriptor[] = [];
  for (const review of trusted.reviews) {
    if (semanticIds.has(review.semanticId) || actionIds.has(review.actionId))
      return refuse('AMBIGUOUS_REVIEW_BINDING');
    semanticIds.add(review.semanticId);
    actionIds.add(review.actionId);
    if (review.hostCatalogSha256 !== trusted.expectedCatalogSha256 ||
        review.hqRegistrySha256 !== trusted.expectedHqRegistrySha256)
      return refuse('STALE_REVIEW_BINDING');
    const hostAction = catalog.actions.find(a => a.actionId === review.actionId);
    if (!hostAction) return refuse('UNSUPPORTED_HOST_ACTION');
    const argsSchemaHash = descriptorArgsDigest(hostAction.args);
    if (argsSchemaHash === null || argsSchemaHash !== review.argsSchemaSha256 || hostAction.risk !== review.risk)
      return refuse('UNREVIEWED_HOST_CONTRACT');
    if (!['verified', 'source_wired'].includes(hostAction.readiness))
      return refuse('HOST_ACTION_NOT_WIRED');
    const row: CrosswalkRow = {
      semanticRef:{id:review.semanticId, version:review.semanticVersion, sourceHash:trusted.expectedHqRegistrySha256},
      target:{owner:'host_effect', actionId:review.actionId, catalogVersion:catalog.version},
      argsSchema:hostAction.args, argsSchemaHash,
      risk:hostAction.risk, riskSource:{authority:'host_catalog', sourceHash:trusted.expectedCatalogSha256},
      implementationStatus:hostAction.readiness === 'verified' ? 'verified' : 'source_wired', reviewedEnabled:true,
    };
    if (!validRow(row)) return refuse('UNSUPPORTED_ARGUMENT_SCHEMA');
    rows.push(row);
    descriptors.push({target:{...row.target},argsSchemaHash,sourceHash:trusted.expectedCatalogSha256,
      risk:row.risk,implementationStatus:row.implementationStatus,
      capability:{supportedByBuild:true,availableNow:'unknown',permittedForActor:'unknown',
        verifiedByEvidence:false,reasonCodes:['FIXTURE_ONLY','LIVE_HOST_NOT_CHECKED']}});
  }
  // Compilation never receives a Host transport or user-supplied registry entries.
  let compiled: Compilation;
  try { compiled = compileVisualCommand(input, {rows,descriptors,currentVersions:trusted.currentVersions}); }
  catch { return refuse('MALFORMED_COMMAND_INPUT'); }
  if (compiled.outcome !== 'candidate')
    return refuse(compiled.reasonCode,compiled.outcome);
  // Device identity is a separate trusted broker fact: touch != phone, keyboard != desktop.
  if (compiled.command.risk.level === 'R3') return refuse('R3_REFUSED');
  if (compiled.command.risk.level === 'R2' && trusted.deviceSurface === 'phone')
    return refuse('R2_DESKTOP_REQUIRED');
  // Strict current host-world and policy pins; existing compiler allows partial pins.
  if (!safeRecord(input) || !safeRecord(input.expectedVersions) ||
      input.expectedVersions.hostWorld !== trusted.currentVersions.hostWorld ||
      input.expectedVersions.policy !== trusted.currentVersions.policy)
    return refuse('REQUIRED_VERSION_PINS_MISSING_OR_STALE');
  const picked = rows.find(r => r.semanticRef.id === compiled.command.semanticRef.id);
  if (!picked) return refuse('UNBOUND_MEANING');
  return {outcome:'candidate',command:compiled.command,evidence:{
    evidenceClass:'source_bound_inert_fixture',effectInvoked:false,hostAuthorizationRequired:true,
    liveHostVerified:false,catalogVersion:catalog.version,catalogSha256:trusted.expectedCatalogSha256,
    hqRegistrySha256:trusted.expectedHqRegistrySha256,argsSchemaSha256:picked.argsSchemaHash,
    deviceSurface:trusted.deviceSurface,
  }};
}
