# File: contracts/hq-version-intelligence/types.d.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | contracts/hq-version-intelligence/types.d.ts |
| Language | TypeScript |
| Kind | source |
| Size | 4140 B |
| Lines | 16 |
| Hash | 2c5159514116 |
| Test | no |
| Generated | no |
| Component | contracts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Sha40 | type | 2 | yes | export type Sha40 = string; export type Sha256 = string; |
| Completeness | type | 3 | yes | export type Completeness=&#39;complete&#39;\|&#39;partial&#39;\|&#39;blocked&#39;\|&#39;missing&#39;; |
| HviStatus | type | 4 | yes | export type HviStatus=&#39;SOURCE_PRESENT&#39;\|&#39;SOURCE_IMPORTED&#39;\|&#39;SOURCE_PATCHED&#39;\|&#39;PREPARED_NOT_PROMOTED&#39;\|&#39;TEST_EXECUTED&#39;\|&#39;INTEGRATED_UNVERIFIED&#39;\|&#39;RUNTIME_VERIFIED&#39;\|&#39;BLOCKED&#39;\|&#39;UNRUN&#39;; |
| HviErrorCode | type | 5 | yes | export type HviErrorCode=&#39;PIN_NOT_FOUND&#39;\|&#39;SOURCE_UNAUTHORIZED&#39;\|&#39;PIN_MOVED&#39;\|&#39;SCOPE_ESCAPE&#39;\|&#39;INCOMPLETE_SCAN&#39;\|&#39;DIGEST_CONFLICT&#39;\|&#39;ID_CONFLICT&#39;\|&#39;EQUIVALENCE_UNPROVEN&#39;\|&#39;RESOURCE_LIMIT&#39;; |
| Coverage | interface | 6 | yes | export interface Coverage{completeness:Completeness;observed:number;expected:number\|null;truncated:boolean;reason?:string} |
| Pin | interface | 7 | yes | export interface Pin{schema:&#39;arbor.hvi.pin/1&#39;;pinId:string;provider:&#39;github&#39;\|&#39;git-local-approved&#39;;repoIdentity:{repository:string;remoteFingerprint?:Sha256};requestedRef:string;resolvedCommitSha:Sha4… |
| ManifestEntry | interface | 8 | yes | export interface ManifestEntry{path:string;mode:&#39;100644&#39;\|&#39;100755&#39;\|&#39;120000&#39;\|&#39;160000&#39;\|&#39;040000&#39;;blobSha:Sha40;bytes?:number;kind:&#39;file&#39;\|&#39;symlink&#39;\|&#39;submodule&#39;\|&#39;tree&#39;\|&#39;lfs_pointer&#39;\|&#39;binary&#39;\|&#39;unobservable&#39;… |
| Manifest | interface | 9 | yes | export interface Manifest{schema:&#39;arbor.hvi.manifest/1&#39;;pinId:string;commitSha:Sha40;digest:Sha256;entries:ManifestEntry[];coverage:Coverage;owner:string} |
| IdentityCandidate | interface | 10 | yes | export interface IdentityCandidate{id:string;left:string;right:string;identityBasis:string;disposition:&#39;REVIEW_REQUIRED&#39;\|&#39;CONFIRMED_EQUIVALENT&#39;\|&#39;KEEP_SEPARATE&#39;\|&#39;REJECTED&#39;;certainty:&#39;confirmed&#39;\|&#39;candi… |
| IdentityCrosswalk | interface | 11 | yes | export interface IdentityCrosswalk{schema:&#39;arbor.hvi.identity-crosswalk/1&#39;;pinIds:string[];candidates:IdentityCandidate[];authorityConflicts:object[];coverage:Coverage;owner:string} |
| NWayComparison | interface | 12 | yes | export interface NWayComparison{schema:&#39;arbor.hvi.comparison/1&#39;;targetPinId:string;sourcePins:string[];coverage:Coverage;summary:{source:&#39;SOURCE_PARITY&#39;\|&#39;INCOMPLETE&#39;;capability:&#39;SEMANTIC_PARITY&#39;\|&#39;UNV… |
| MigrationFinding | interface | 13 | yes | export interface MigrationFinding{schema:&#39;arbor.hvi.migration-finding/1&#39;;id:string;origin_repo:string;origin_sha:Sha40;origin_path:string;origin_blob:Sha40;target_repo:string;target_sha:Sha40;target_… |
| EvidenceReceipt | interface | 14 | yes | export interface EvidenceReceipt{schema:&#39;arbor.hvi.evidence-receipt/1&#39;;id:string;kind:&#39;source_blob&#39;\|&#39;source_symbol&#39;\|&#39;contract&#39;\|&#39;fixture&#39;\|&#39;executed_test&#39;\|&#39;host_receipt&#39;\|&#39;device_receipt&#39;\|&#39;owner_decisio… |
| HostReadResult | interface | 15 | yes | export interface HostReadResult{schema:&#39;arbor.hvi.host-read-result/1&#39;;operation:&#39;development.source.compare.read&#39;;status:&#39;ok&#39;\|&#39;denied&#39;\|&#39;incomplete&#39;;scope:&#39;development&#39;;actorId:string;sessionId:string… |
| RefusalError | interface | 16 | yes | export interface RefusalError{schema:&#39;arbor.hvi.refusal-error/1&#39;;code:HviErrorCode;message:string;owner:string;retryable:boolean;scope:&#39;development&#39;;evidenceRefs:string[]} |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/** HVI v1 source-only wire types; JSON Schemas are authoritative. */
export type Sha40 = string; export type Sha256 = string;
export type Completeness='complete'|'partial'|'blocked'|'missing';
export type HviStatus='SOURCE_PRESENT'|'SOURCE_IMPORTED'|'SOURCE_PATCHED'|'PREPARED_NOT_PROMOTED'|'TEST_EXECUTED'|'INTEGRATED_UNVERIFIED'|'RUNTIME_VERIFIED'|'BLOCKED'|'UNRUN';
export type HviErrorCode='PIN_NOT_FOUND'|'SOURCE_UNAUTHORIZED'|'PIN_MOVED'|'SCOPE_ESCAPE'|'INCOMPLETE_SCAN'|'DIGEST_CONFLICT'|'ID_CONFLICT'|'EQUIVALENCE_UNPROVEN'|'RESOURCE_LIMIT';
export interface Coverage{completeness:Completeness;observed:number;expected:number|null;truncated:boolean;reason?:string}
export interface Pin{schema:'arbor.hvi.pin/1';pinId:string;provider:'github'|'git-local-approved';repoIdentity:{repository:string;remoteFingerprint?:Sha256};requestedRef:string;resolvedCommitSha:Sha40;rootTreeSha:Sha40;manifestDigest:Sha256;acquiredAt:string;completeness:Completeness;scope:'development';owner:string;evidenceRef:string;subPath?:string;sourceGrantRef?:string}
export interface ManifestEntry{path:string;mode:'100644'|'100755'|'120000'|'160000'|'040000';blobSha:Sha40;bytes?:number;kind:'file'|'symlink'|'submodule'|'tree'|'lfs_pointer'|'binary'|'unobservable';parseStatus:'parsed'|'not_parsed'|'blocked'|'truncated'|'unsupported';symlinkTarget?:string;excludedReason?:string}
export interface Manifest{schema:'arbor.hvi.manifest/1';pinId:string;commitSha:Sha40;digest:Sha256;entries:ManifestEntry[];coverage:Coverage;owner:string}
export interface IdentityCandidate{id:string;left:string;right:string;identityBasis:string;disposition:'REVIEW_REQUIRED'|'CONFIRMED_EQUIVALENT'|'KEEP_SEPARATE'|'REJECTED';certainty:'confirmed'|'candidate'|'unknown';owner:string;evidenceRefs:string[];ownerConfirmed?:boolean;ownerReceiptRef?:string}
export interface IdentityCrosswalk{schema:'arbor.hvi.identity-crosswalk/1';pinIds:string[];candidates:IdentityCandidate[];authorityConflicts:object[];coverage:Coverage;owner:string}
export interface NWayComparison{schema:'arbor.hvi.comparison/1';targetPinId:string;sourcePins:string[];coverage:Coverage;summary:{source:'SOURCE_PARITY'|'INCOMPLETE';capability:'SEMANTIC_PARITY'|'UNVERIFIED'|'INCOMPLETE';runtime:'RUNTIME_PARITY'|'UNVERIFIED'};sourceDeltas:object[];capabilityDeltas:object[];identityCandidates:string[];authorityConflicts:string[];unported:string[];intentionallyExcluded:string[];unobserved:string[];runtimeProof:string[];mergePlan:string[];evidenceIndex:string[];limits:{maxPins:number;maxEntries:number;maxBlobBytes:number;truncated:boolean};errors:string[];reproducibilityDigest:Sha256;owner:string}
export interface MigrationFinding{schema:'arbor.hvi.migration-finding/1';id:string;origin_repo:string;origin_sha:Sha40;origin_path:string;origin_blob:Sha40;target_repo:string;target_sha:Sha40;target_path:string[];target_blob:Sha40[];identity_basis:string;source_lineage:string;capability_id:string|null;source_type:string;tests:string[];runtime_evidence:string[];decision:string;certainty:'confirmed'|'candidate'|'unknown';missing_reason:string|null;owner:string;merge_recommendation:string;evidence_refs:string[];coverage:Coverage}
export interface EvidenceReceipt{schema:'arbor.hvi.evidence-receipt/1';id:string;kind:'source_blob'|'source_symbol'|'contract'|'fixture'|'executed_test'|'host_receipt'|'device_receipt'|'owner_decision';claim:string;owner:string;source:{repo:string;commitSha:Sha40;path:string;blobSha:Sha40;lines?:[number,number]};evidenceDigest:Sha256;observation:string;status:HviStatus;command?:string;exitCode?:number;environment?:string;ownerConfirmed?:boolean}
export interface HostReadResult{schema:'arbor.hvi.host-read-result/1';operation:'development.source.compare.read';status:'ok'|'denied'|'incomplete';scope:'development';actorId:string;sessionId:string;grantRef:string;evaluatedAt:string;owner:'Host';coverage:Coverage;receipts:string[];resultDigest?:Sha256;errorCode?:HviErrorCode}
export interface RefusalError{schema:'arbor.hvi.refusal-error/1';code:HviErrorCode;message:string;owner:string;retryable:boolean;scope:'development';evidenceRefs:string[]}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
