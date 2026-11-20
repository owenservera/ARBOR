# File: packages/tierflow/src/coordination/contract.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/coordination/contract.ts |
| Language | TypeScript |
| Kind | source |
| Size | 16935 B |
| Lines | 501 |
| Hash | 3940da47c5b7 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| COORDINATION_CONTRACT | const | 20 | yes | export const COORDINATION_CONTRACT = &quot;tierflow.coordination/1&quot;; |
| COORDINATION_RECEIPT | const | 23 | yes | export const COORDINATION_RECEIPT = &quot;tierflow.coordination-receipt/1&quot;; |
| COORDINATION_AUTHORITY | const | 26 | yes | export const COORDINATION_AUTHORITY = &quot;coordination_only&quot;; |
| COORDINATION_KINDS | const | 29 | yes | export const COORDINATION_KINDS = [ |
| CoordinationKind | type | 41 | yes | export type CoordinationKind = (typeof COORDINATION_KINDS)[number]; |
| COORDINATION_RECEIPT_OPS | const | 44 | yes | export const COORDINATION_RECEIPT_OPS = [&quot;send&quot;, &quot;claim&quot;, &quot;ack&quot;, &quot;read&quot;, &quot;repair&quot;] as const; |
| CoordinationReceiptOp | type | 46 | yes | export type CoordinationReceiptOp = (typeof COORDINATION_RECEIPT_OPS)[number]; |
| AUTHORITY_SHAPED_KEYS | const | 49 | yes | export const AUTHORITY_SHAPED_KEYS: readonly string[] = [ |
| CoordinationPayload | interface | 64 | yes | export interface CoordinationPayload { |
| CoordinationMessage | interface | 78 | yes | export interface CoordinationMessage { |
| CoordinationReceipt | interface | 102 | yes | export interface CoordinationReceipt { |
| CoordinationCapabilities | interface | 117 | yes | export interface CoordinationCapabilities { |
| CoordinationIdentity | interface | 143 | yes | export interface CoordinationIdentity { |
| CoordinationError | class | 154 | yes | export class CoordinationError extends Error { |
| constructor | method | 157 | yes | constructor(code: string, message: string) { |
| CoordinationUnavailableError | class | 168 | yes | export class CoordinationUnavailableError extends CoordinationError { |
| constructor | method | 169 | yes | constructor(code: &quot;HQ_UNAVAILABLE&quot; \| &quot;CONTRACT_MISMATCH&quot;, message: string) { |
| CoordinationRejectedError | class | 176 | yes | export class CoordinationRejectedError extends CoordinationError { |
| constructor | method | 179 | yes | constructor(message: string, reason = &quot;rejected&quot;) { |
| CoordinationInvalidError | class | 187 | yes | export class CoordinationInvalidError extends CoordinationError { |
| constructor | method | 190 | yes | constructor(message: string, path: string \| null = null) { |
| isPlainObject | function | 201 | no | function isPlainObject(value: unknown): value is Record&lt;string, unknown&gt; { |
| findCoordinationViolations | function | 212 | yes | export function findCoordinationViolations(value: unknown, path = &quot;&quot;): string[] { |
| found | const | 213 | no | const found: string[] = []; |
| assertCoordinationOnly | function | 242 | yes | export function assertCoordinationOnly(record: unknown, path = &quot;&quot;): void { |
| violations | const | 243 | no | const violations = findCoordinationViolations(record, path); |
| authority | const | 253 | no | const authority = record[&quot;authority&quot;]; |
| readString | function | 262 | no | function readString(record: Record&lt;string, unknown&gt;, ...keys: string[]): string \| null { |
| value | const | 264 | no | const value = record[key]; |
| readNumber | function | 274 | no | function readNumber(record: Record&lt;string, unknown&gt;, ...keys: string[]): number \| null { |
| value | const | 276 | no | const value = record[key]; |
| readStringList | function | 286 | no | function readStringList(record: Record&lt;string, unknown&gt;, key: string): readonly string[] { |
| value | const | 287 | no | const value = record[key]; |
| readPayload | function | 295 | no | function readPayload(record: Record&lt;string, unknown&gt;): CoordinationPayload { |
| value | const | 296 | no | const value = record[&quot;payload&quot;]; |
| parseCoordinationMessage | function | 317 | yes | export function parseCoordinationMessage(value: unknown): CoordinationMessage { |
| kind | const | 323 | no | const kind = value[&quot;kind&quot;]; |
| id | const | 331 | no | const id = readString(value, &quot;id&quot;); |
| at | const | 335 | no | const at = readString(value, &quot;at&quot;); |
| seq | const | 339 | no | const seq = readNumber(value, &quot;seq&quot;); |
| schema | const | 343 | no | const schema = readString(value, &quot;schema&quot;) ?? &quot;&quot;; |
| digest | const | 344 | no | const digest = readString(value, &quot;digest&quot;) ?? &quot;&quot;; |
| body | const | 345 | no | const body = typeof value[&quot;body&quot;] === &quot;string&quot; ? (value[&quot;body&quot;] as string) : &quot;&quot;; |
| isCoordinationMessage | function | 372 | yes | export function isCoordinationMessage(value: unknown): value is CoordinationMessage { |
| CoordinationCheckQuery | interface | 385 | yes | export interface CoordinationCheckQuery { |
| CoordinationCheck | interface | 390 | yes | export interface CoordinationCheck { |
| CoordinationInboxQuery | interface | 397 | yes | export interface CoordinationInboxQuery { |
| CoordinationInbox | interface | 405 | yes | export interface CoordinationInbox { |
| CoordinationSendInput | interface | 411 | yes | export interface CoordinationSendInput { |
| CoordinationHandoffInput | interface | 423 | yes | export interface CoordinationHandoffInput extends CoordinationSendInput { |
| CoordinationClaimInput | interface | 427 | yes | export interface CoordinationClaimInput { |
| CoordinationReleaseInput | interface | 436 | yes | export interface CoordinationReleaseInput { |
| CoordinationAckInput | interface | 444 | yes | export interface CoordinationAckInput { |
| CoordinationSendResult | interface | 450 | yes | export interface CoordinationSendResult { |
| CoordinationReceiptsQuery | interface | 460 | yes | export interface CoordinationReceiptsQuery { |
| CoordinationRegistration | interface | 466 | yes | export interface CoordinationRegistration { |
| CoordinationStatus | interface | 474 | yes | export interface CoordinationStatus { |
| CoordinationBus | interface | 489 | yes | export interface CoordinationBus { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/coordination/index.ts](./index.ts.md) | ./contract.ts |
| [packages/tierflow/src/coordination/poller.ts](./poller.ts.md) | ./contract.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Project-neutral coordination contract — `tierflow.coordination/1`.
 *
 * HARD RULE (law, not a convention):
 *   a coordination message is coordination, NEVER permission.
 *
 * Nothing in this module executes, approves, sends externally, mutates a
 * repository or grants authority. It defines shapes, validation and a bus
 * interface. A provider adapter (see `src/adapters/hq/sync-bus.ts`) maps a
 * concrete transport onto these shapes; the core of TierFlow never learns
 * which provider is behind the bus.
 *
 * Records carry `authority: "coordination_only"` and nothing else. Any
 * authority-shaped key (approve, authorization, permission, grant, token,
 * secret, credential, execute, effect, browser, click) is refused at any
 * depth, so a message can never be read as a permission by accident.
 */

/** The contract id every provider adapter declares. */
export const COORDINATION_CONTRACT = "tierflow.coordination/1";

/** Schema id of the local receipt mirror written by an adapter. */
export const COORDINATION_RECEIPT = "tierflow.coordination-receipt/1";

/** The only authority value a coordination record may carry. */
export const COORDINATION_AUTHORITY = "coordination_only";

/** Message kinds, ordered by the coordination lifecycle. */
export const COORDINATION_KINDS = [
  "note",
  "handoff",
  "claim",
  "release",
  "question",
  "answer",
  "status",
  "decision",
  "ack",
] as const;

export type CoordinationKind = (typeof COORDINATION_KINDS)[number];

/** Receipt operations a provider may report. */
export const COORDINATION_RECEIPT_OPS = ["send", "claim", "ack", "read", "repair"] as const;

export type CoordinationReceiptOp = (typeof COORDINATION_RECEIPT_OPS)[number];

/** Keys that would turn a coordination record into a permission. */
export const AUTHORITY_SHAPED_KEYS: readonly string[] = [
  "approve",
  "authorization",
  "permission",
  "grant",
  "token",
  "secret",
  "credential",
  "execute",
  "effect",
  "browser",
  "click",
];

/** The four structured lists a handoff carries. */
export interface CoordinationPayload {
  readonly changed: readonly string[];
  readonly next: readonly string[];
  readonly open: readonly string[];
  readonly evidence: readonly string[];
}

/**
 * One coordination record, normalized to a provider-neutral shape.
 *
 * `schema` keeps the id of the record as delivered by the provider (for
 * example `hq.sync-bus/2`) so a reader can tell a current record from a
 * legacy one. The shape itself never depends on the provider.
 */
export interface CoordinationMessage {
  readonly schema: string;
  readonly seq: number;
```

_First 80 of 502 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
