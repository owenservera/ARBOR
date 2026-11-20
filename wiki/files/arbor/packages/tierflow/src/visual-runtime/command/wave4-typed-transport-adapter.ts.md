# File: packages/tierflow/src/visual-runtime/command/wave4-typed-transport-adapter.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/command/wave4-typed-transport-adapter.ts |
| Language | TypeScript |
| Kind | source |
| Size | 17626 B |
| Lines | 280 |
| Hash | ffb83547841f |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TYPED_TRANSPORT_SCHEMA | const | 13 | yes | export const TYPED_TRANSPORT_SCHEMA = &#39;vivim.wave4-typed-candidate/1&#39; as const; |
| TransportDevice | type | 14 | yes | export type TransportDevice = &#39;desktop&#39; \| &#39;phone&#39;; |
| TransportAuthority | type | 15 | yes | export type TransportAuthority = Readonly&lt;{ |
| TransportControls | type | 34 | yes | export type TransportControls = Readonly&lt;{ |
| TypedCandidateEnvelope | type | 43 | yes | export type TypedCandidateEnvelope = Readonly&lt;{ |
| TransportRefusal | type | 57 | yes | export type TransportRefusal = Readonly&lt;{outcome: &#39;refused&#39;; reasonCode: string; effectPerformed: false}&gt;; |
| TransportStage | type | 58 | yes | export type TransportStage = Readonly&lt;{outcome:&#39;candidate&#39;; envelope:TypedCandidateEnvelope; effectPerformed:false}&gt; \| TransportRefusal; |
| TransportReceipt | type | 59 | yes | export type TransportReceipt = Readonly&lt;{ |
| TransportObservation | type | 71 | yes | export type TransportObservation = Readonly&lt;{outcome:&#39;observed&#39;;receipt:TransportReceipt}&gt;\|TransportRefusal; |
| ID | const | 73 | no | const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/; |
| HASH | const | 74 | no | const HASH = /^[0-9a-f]{64}$/; |
| RISK | const | 75 | no | const RISK = [&#39;R0&#39;,&#39;R1&#39;,&#39;R2&#39;,&#39;R3&#39;]; |
| MAX_ENVELOPE_BYTES | const | 76 | no | const MAX_ENVELOPE_BYTES = 12_288; |
| MAX_LIFETIME_MS | const | 77 | no | const MAX_LIFETIME_MS = 10 * 60_000; |
| MAX_CLOCK_SKEW_MS | const | 78 | no | const MAX_CLOCK_SKEW_MS = 30_000; |
| deny | function | 79 | no | const deny = (reasonCode:string):TransportRefusal =&gt; ({outcome:&#39;refused&#39;,reasonCode,effectPerformed:false}); |
| p | const | 82 | no | const p=Object.getPrototypeOf(v); |
| keys | function | 86 | no | function keys(v:unknown, expected:readonly string[]):v is Record&lt;string,unknown&gt; { |
| id | function | 89 | no | function id(v:unknown):v is string { return typeof v===&#39;string&#39; &amp;&amp; ID.test(v); } |
| hash | function | 90 | no | function hash(v:unknown):v is string { return typeof v===&#39;string&#39; &amp;&amp; HASH.test(v); } |
| canonical | function | 91 | no | function canonical(v:unknown):string { |
| digest | function | 96 | no | function digest(v:unknown):string { return createHash(&#39;sha256&#39;).update(canonical(v)).digest(&#39;hex&#39;); } |
| validAuthority | function | 97 | no | function validAuthority(b:unknown):b is TransportAuthority { |
| validControls | function | 111 | no | function validControls(c:unknown, now:number):c is TransportControls { |
| validCommand | function | 122 | no | function validCommand(c:unknown):c is VisualCommand { |
| validEvidence | function | 153 | no | function validEvidence(e:unknown):e is DescriptorCrosswalkEvidence { |
| semanticDigest | function | 162 | no | function semanticDigest(command:VisualCommand,evidence:DescriptorCrosswalkEvidence):string { |
| checkCandidate | function | 169 | no | function checkCandidate(command:unknown,evidence:unknown,b:TransportAuthority):string\|null { |
| identity | function | 188 | no | function identity(b:TransportAuthority):TypedCandidateEnvelope[&#39;identity&#39;] { |
| stageTypedCandidate | function | 191 | yes | export function stageTypedCandidate(proof:DescriptorProofResult, authority:unknown, controls:unknown):TransportStage { |
| cause | const | 195 | no | const cause=checkCandidate(proof.command,proof.evidence,authority); |
| body | const | 197 | no | const body={schema:TYPED_TRANSPORT_SCHEMA,kind:&#39;candidate_only&#39; as const,identity:identity(authority), |
| envelope | const | 201 | no | const envelope:TypedCandidateEnvelope={...body,envelopeDigest:digest(body)}; |
| validateTypedEnvelope | function | 206 | yes | export function validateTypedEnvelope(value:unknown, authority:unknown):TransportStage { |
| wanted | const | 213 | no | const wanted=identity(authority); |
| cause | const | 216 | no | const cause=checkCandidate(value.command,value.sourceEvidence,authority); |
| e | const | 218 | no | const e=value as unknown as TypedCandidateEnvelope; |
| TypedTransportInbox | class | 227 | yes | export class TypedTransportInbox { |
| constructor | method | 231 | yes | constructor(maxEntries=128) { |
| key | method | 236 | no | private key(e:TypedCandidateEnvelope):string { |
| lane | method | 239 | no | private lane(e:TypedCandidateEnvelope):string { |
| receipt | method | 242 | no | private receipt(e:TypedCandidateEnvelope,status:TransportReceipt[&#39;status&#39;],replayed:boolean):TransportReceipt { |
| accept | method | 247 | yes | accept(candidate:unknown, authority:unknown):TransportObservation { |
| checked | const | 248 | no | const checked=validateTypedEnvelope(candidate,authority); |
| e | const | 250 | no | const e=checked.envelope,k=this.key(e),before=this.records.get(k); |
| change | method | 261 | no | private change(envelope:unknown,authority:unknown,next:&#39;uncertain&#39;\|&#39;cancelled&#39;,cancelId?:unknown):TransportObservation { |
| checked | const | 262 | no | const checked=validateTypedEnvelope(envelope,authority); |
| e | const | 264 | no | const e=checked.envelope, prior=this.records.get(this.key(e)); |
| markUncertain | method | 273 | yes | markUncertain(envelope:unknown,authority:unknown):TransportObservation { |
| cancel | method | 277 | yes | cancel(envelope:unknown,authority:unknown,cancelId:unknown):TransportObservation { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 8 | external |
| ./ir.ts | import | 9 | [packages/tierflow/src/visual-runtime/command/ir.ts](./ir.ts.md) |
| ./ir.ts | import | 10 | [packages/tierflow/src/visual-runtime/command/ir.ts](./ir.ts.md) |
| ./wave3-descriptor-proof.ts | import | 11 | [packages/tierflow/src/visual-runtime/command/wave3-descriptor-proof.ts](./wave3-descriptor-proof.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/integration-4/compose.ts](../integration-4/compose.ts.md) | ../command/wave4-typed-transport-adapter.ts |
| [packages/tierflow/tests/visual-runtime/wave4-g-typed-transport.test.ts](../../../tests/visual-runtime/wave4-g-typed-transport.test.ts.md) | ../../src/visual-runtime/command/wave4-typed-transport-adapter.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Wave 4 G — inert cross-device transport projection, NOT a Host ingress.
 * The caller MUST obtain TransportAuthority from the authenticated Host owner/device/world
 * broker (never from the phone, a text command, or the envelope itself). This adapter
 * creates no signature, approval, action registry, provider request, or Host plan.
 * Inbox dedupe is bounded process-local evidence, NOT durable Host effect fencing.
 */
import { createHash } from 'node:crypto';
import { validArgs } from './ir.ts';
import type { VisualCommand } from './ir.ts';
import type { DescriptorProofResult, DescriptorCrosswalkEvidence } from './wave3-descriptor-proof.ts';

export const TYPED_TRANSPORT_SCHEMA = 'vivim.wave4-typed-candidate/1' as const;
export type TransportDevice = 'desktop' | 'phone';
export type TransportAuthority = Readonly<{
  ownerId: string;
  worldId: string;
  deviceId: string;
  sessionId: string;
  device: TransportDevice;
  /** Host-verified facts, NOT self-attested values read from transport JSON. */
  authenticated: boolean;
  granted: boolean;
  connected: boolean;
  nowMs: number;
  policyVersion: string;
  hostWorldVersion: string;
  catalogVersion: number;
  catalogSha256: string;
  hqRegistrySha256: string;
  /** One existing Host-reviewed action descriptor bound by the caller; never inferred from wire JSON. */
  reviewed: Readonly<{semanticId:string;actionId:string;risk:'R0'|'R1'|'R2'|'R3';argsSchemaSha256:string}>;
}>;
export type TransportControls = Readonly<{
  correlationId: string;
  idempotencyKey: string;
  nonce: string;
  cancelId: string;
  sequence: number;
  issuedAtMs: number;
  expiresAtMs: number;
}>;
export type TypedCandidateEnvelope = Readonly<{
  schema: typeof TYPED_TRANSPORT_SCHEMA;
  kind: 'candidate_only';
  identity: Readonly<Pick<TransportAuthority, 'ownerId' | 'worldId' | 'deviceId' | 'sessionId' | 'device'>>;
  controls: TransportControls;
  /** Same semantic digest for text/touch/keyboard, even if source modality/commandId differ. */
  semanticDigest: string;
  /** Hash of ALL envelope fields (except this field); detects accidental/tampered edits, NOT authentication. */
  envelopeDigest: string;
  command: VisualCommand;
  sourceEvidence: DescriptorCrosswalkEvidence;
  executionAuthority: 'none';
  approval: 'not_requested';
}>;
export type TransportRefusal = Readonly<{outcome: 'refused'; reasonCode: string; effectPerformed: false}>;
export type TransportStage = Readonly<{outcome:'candidate'; envelope:TypedCandidateEnvelope; effectPerformed:false}> | TransportRefusal;
export type TransportReceipt = Readonly<{
  schema:'vivim.wave4-transport-receipt/1';
  outcome:'transport_only';
  correlationId:string;
  idempotencyKey:string;
  semanticDigest:string;
  status:'received'|'uncertain'|'cancelled';
  replayed:boolean;
  hostAccepted:false;
  executionAuthorized:false;
  effectPerformed:false;
}>;
export type TransportObservation = Readonly<{outcome:'observed';receipt:TransportReceipt}>|TransportRefusal;

const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
const HASH = /^[0-9a-f]{64}$/;
const RISK = ['R0','R1','R2','R3'];
const MAX_ENVELOPE_BYTES = 12_288;
const MAX_LIFETIME_MS = 10 * 60_000;
const MAX_CLOCK_SKEW_MS = 30_000;
const deny = (reasonCode:string):TransportRefusal => ({outcome:'refused',reasonCode,effectPerformed:false});
function record(v:unknown):v is Record<string,unknown> {
```

_First 80 of 281 lines._

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
