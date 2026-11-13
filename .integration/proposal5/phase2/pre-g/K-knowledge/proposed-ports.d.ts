/**
 * P2-K PRE-G TYPE PROPOSAL ONLY — not imported into any runtime.
 * Observed: B Host ledger has transaction(fn), meta.get/set; Labs import expects
 * injected store/authorize/sink; A CLI supports a scoped personal graph packet.
 * Everything marked PROPOSED must be implemented and authenticated by owning lane.
 * No provider API, new database, browser controller or effect authority.
 */

export type Sha256 = string; // Validate lowercase /^[0-9a-f]{64}$/ at the Host boundary.
export type IsoTime = string;
export type WorldId = string;
export type AccountId = string;
export type SourceId = string;
export type GrantId = string;
export type BatchKey = string;
export type GraphEpoch = number;
export type OpId = Sha256;
export type SourceOp = "import_archive" | "read_profile" | "run_bootstrap" | "disclose_context";
export type ImportMode = "backfill" | "incremental";
export type GateResult = "ALLOWED" | "DENIED" | "HOLD_UNCERTAIN" | "HELD_LOW_DISK";
export type ContentAuthority = "owner-authored" | "model-summarized" | "project-scoped" | "source-export";

/** Host-authenticated actor/account mapping, not browser login inference. */
export interface HostPrincipal {
  readonly ownerId: string;
  readonly worldId: WorldId;
  readonly accountId: AccountId;
  readonly verifiedByHost: true;
  readonly accountBindingRevision: number;
}

export interface SourceScope {
  readonly worldId: WorldId;
  readonly accountId: AccountId;
  readonly provider: "chatgpt";
  readonly sourceId: SourceId;
  readonly sourceRevision: Sha256; // Full-archive hash for historical ZIP.
  readonly operation: SourceOp;
  readonly purpose: "private-personal-ai";
}

/**
 * PROPOSED B adapter: existing signed-in readiness or full-bootstrap approval
 * does not grant archival import. Grant is rechecked before each effect.
 * thirdPartyReview / retention / source selection are Host-owned decisions.
 */
export interface HostSourceGrant {
  readonly allowed: true;
  readonly grantId: GrantId;
  readonly grantRevision: number;
  readonly worldId: WorldId;
  readonly accountId: AccountId;
  readonly sourceId: SourceId;
  readonly operations: readonly SourceOp[];
  readonly retentionClass: "keep-original" | "derived-only" | "review-required";
  readonly maxSensitivity: "S0" | "S1" | "S2" | "S3";
  readonly destinationDigest: Sha256;
  readonly expiry: IsoTime;
  readonly rightsReviewed: true;
  readonly thirdPartyReviewed: true;
  readonly revokedAt: null;
}
export interface HostSourceDenial {
  readonly allowed: false;
  readonly code: "NO_CONSENT" | "ACCOUNT_MISMATCH" | "SOURCE_MISMATCH" |
    "REVOKED" | "EXPIRED" | "RIGHTS_REQUIRED" | "STORAGE_HELD" | "POLICY_DENIED";
}
export interface HostSourceAuthority {
  authorizeSource(scope: SourceScope, principal: HostPrincipal): Promise<HostSourceGrant | HostSourceDenial>;
  currentGrant(grantId: GrantId, principal: HostPrincipal): Promise<HostSourceGrant | HostSourceDenial>;
}

export interface HostSqliteLedger {
  /** OBSERVED B: synchronous single-writer transaction; no async work inside. */
  transaction<T>(fn: () => T): T;
  meta: {
    get(key: string): string | null;
    set(key: string, value: string): unknown;
  };
}
export interface CheckpointRecord {
  readonly schema: "vivim.chatgpt-archive-job/1";
  readonly worldId: WorldId;
  readonly accountId: AccountId;
  readonly sourceId: SourceId;
  readonly archiveDigest: Sha256;
  readonly cursor: number;
  readonly pending: null | {
    readonly key: BatchKey;
    readonly digest: Sha256;
    readonly first: number;
    readonly last: number;
  };
  readonly status: "running" | "pending" | "complete" | "held" | "erasing" | "erased";
}
export interface HostCheckpointStore {
  read(key: string): CheckpointRecord | null;
  transact(key: string, update: (old: CheckpointRecord | null) => CheckpointRecord): CheckpointRecord;
}

export interface NormalizedChat {
  readonly source: "chatgpt-export";
  readonly accountId: AccountId;
  readonly nativeId: string;
  readonly contentDigest: Sha256;
  readonly revisionSchema: "vivim.personal-content-revision/2";
  readonly omissions: number;
  readonly messages: readonly unknown[]; // Private contents never go in journal metadata.
}
export interface ImportBatch {
  readonly key: BatchKey;
  readonly digest: Sha256;
  readonly sourceId: SourceId;
  readonly archiveDigest: Sha256;
  readonly scopeId: Sha256;
  readonly worldId: WorldId;
  readonly accountId: AccountId;
  readonly provider: "chatgpt";
  readonly range: { readonly first: number; readonly last: number };
  readonly conversations: readonly NormalizedChat[];
}
export interface HostCommittedReceipt {
  readonly status: "committed";
  readonly verified: true; // Only when Host independently verifies journal + signature/marker.
  readonly key: BatchKey;
  readonly digest: Sha256;
  readonly sourceId: SourceId;
  readonly worldId: WorldId;
  readonly accountId: AccountId;
  readonly grantId: GrantId;
  readonly sourceRevision: Sha256;
  readonly journalRef: string;
  readonly graphOpId: OpId;
  readonly graphMarkerDigest: Sha256;
}
export type Inspection =
  | { readonly status: "absent"; readonly receipt?: never }
  | { readonly status: "uncertain"; readonly reason: string; readonly receipt?: never }
  | { readonly status: "committed"; readonly receipt: HostCommittedReceipt };

/**
 * PROPOSED B authoritative bridge; NOT demonstrated as existing names in W1 B.
 * inspectEvidenceBatch MUST take and verify key + digest; old Labs fallback
 * forwards key without digest and must not be promoted unmodified.
 * Never trust caller-provided verified:true as an actual verified receipt.
 */
export interface HostPersonalEvidencePort {
  inspectEvidenceBatch(
    identity: Pick<ImportBatch, "key" | "digest" | "sourceId" | "worldId" | "accountId" | "archiveDigest">,
    principal: HostPrincipal
  ): Promise<Inspection>;
  commitEvidenceAndGraph(batch: ImportBatch, principal: HostPrincipal, grant: HostSourceGrant): Promise<HostCommittedReceipt>;
  verifyPublishedReceipt(receipt: HostCommittedReceipt, principal: HostPrincipal): Promise<boolean>;
}

/** A's existing hqkg-personal CLI packet; execution is ONLY Host-invoked. */
export interface HqkgPersonalPacket {
  readonly schema: "vivim.hqkg-personal/1";
  readonly op: "apply" | "preflight" | "inspect" | "compact" | "erase" | "erase-effects";
  readonly scope: Sha256;
  readonly opId?: OpId;
  readonly payloadDigest?: Sha256;
  readonly expectedEpoch?: GraphEpoch;
  readonly expectedBytes?: number;
  readonly nodes?: readonly unknown[];
  readonly edges?: readonly unknown[];
  readonly nodeIds?: readonly string[];
  readonly edgeIds?: readonly string[];
}
export interface HostGraphBridge {
  inspect(scope: Sha256, principal: HostPrincipal): Promise<{
    readonly epoch: GraphEpoch; readonly bytes: number; readonly marker: null | {
      readonly opId: OpId; readonly payloadDigest: Sha256
    };
  }>;
  applyWithCAS(packet: HqkgPersonalPacket, principal: HostPrincipal): Promise<{
    readonly epoch: GraphEpoch; readonly bytes: number; readonly verifiedMarker: boolean;
  }>;
  eraseEffectWithFence(packet: HqkgPersonalPacket, principal: HostPrincipal, erasureFence: string): Promise<{
    readonly verified: boolean; readonly verificationDigest: Sha256;
  }>;
}

/** PROPOSED B policy over existing storage; no new database or storage service. */
export interface ProtectedStorageBudget {
  readonly freeBytes: number;
  readonly osEmergencyReserveBytes: number;
  readonly rockProtectedGrowthReserveBytes: number;
  readonly estimatedPeakWriteBytes: number;
  readonly rollbackHeadroomBytes: number;
  readonly reclaimableCacheBytes: number;
}
export interface HostStoragePolicy {
  inspectBudget(principal: HostPrincipal, requestedBytes: number): Promise<ProtectedStorageBudget>;
  reserveForImport(principal: HostPrincipal, grant: HostSourceGrant, requestedBytes: number):
    Promise<{ readonly admitted: true; readonly reservationId: string } |
      { readonly admitted: false; readonly reason: "LOW_DISK" | "ROCK_PROTECTED" | "POLICY_HELD" }>;
  evictRebuildableProjection(principal: HostPrincipal, refs: readonly string[]): Promise<readonly string[]>;
  // NEVER silently evict original raw evidence, consent/revocation fences, or protected receipts.
}

/** PROPOSED B+A fence; revocation alone is not deletion. */
export interface ErasureRequest {
  readonly worldId: WorldId;
  readonly accountId: AccountId;
  readonly sourceId: SourceId;
  readonly grantId: GrantId;
  readonly mode: "stop-capture" | "disconnect-keep-history" | "delete-all-derived";
  readonly ownerApproved: true;
}
export interface HostErasureCoordinator {
  fenceBeforeReplay(req: ErasureRequest, principal: HostPrincipal): Promise<string>;
  eraseOwnedEvidenceAndDerivatives(req: ErasureRequest, fence: string, principal: HostPrincipal): Promise<{
    readonly rawBytesDeleted: number;
    readonly derivedRefsInvalidated: readonly string[];
    readonly graphMarkerErased: boolean;
    readonly indexAndDcbInvalidated: boolean;
    readonly authoritativeReceipt: string;
  }>;
  verifyNoReimport(req: ErasureRequest, fence: string, principal: HostPrincipal): Promise<boolean>;
}

// NOT PART OF THIS TYPE CONTRACT: an HQ development-session personal DB,
// a second graph writer, direct Studio control, or new external provider APIs.
