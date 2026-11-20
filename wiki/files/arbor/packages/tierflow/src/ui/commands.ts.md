# File: packages/tierflow/src/ui/commands.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/ui/commands.ts |
| Language | TypeScript |
| Kind | source |
| Size | 40934 B |
| Lines | 1088 |
| Hash | 7d97c0c8ac5f |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| COMMAND_KINDS | const | 52 | no | const COMMAND_KINDS: readonly UiCommandKind[] = [ |
| STORE_ERROR_CODES | const | 64 | no | const STORE_ERROR_CODES: ReadonlySet&lt;string&gt; = new Set&lt;string&gt;([ &quot;NOT_FOUND&quot;, &quot;REVISION_CONFLICT&quot;, &quot;STORE_LOCKED&quot;, &quot;UNSUPPORTED_VERSION&quot;, |
| UiWorldModule | interface | 79 | yes | export interface UiWorldModule { |
| DEFAULT_WORLD_MODULE | const | 88 | no | const DEFAULT_WORLD_MODULE: UiWorldModule = { |
| UiStateWriter | interface | 103 | yes | export interface UiStateWriter { |
| UiStateProjectionError | class | 109 | yes | export class UiStateProjectionError extends Error { |
| constructor | method | 114 | yes | constructor(code: UiErrorCode, message: string) { |
| UiStateProjection | class | 128 | yes | export class UiStateProjection { |
| constructor | method | 138 | yes | constructor(initial: Readonly&lt;Record&lt;string, unknown&gt;&gt; = {}, onSet?: (path: string, value: UiScalar) =&gt; void) { |
| get | method | 144 | yes | get(path: string): UiScalar \| undefined { |
| normalized | const | 145 | no | const normalized = normalizeStatePath(path); |
| has | method | 150 | yes | has(path: string): boolean { |
| normalized | const | 151 | no | const normalized = normalizeStatePath(path); |
| set | method | 162 | yes | set(path: string, value: UiScalar): void { |
| normalized | const | 163 | no | const normalized = normalizeStatePath(path); |
| snapshot | method | 178 | yes | snapshot(): Record&lt;string, UiScalar&gt; { |
| copy | const | 179 | no | const copy: Record&lt;string, UiScalar&gt; = {}; |
| writer | method | 185 | yes | writer(): UiStateWriter { |
| UiCoreOptions | interface | 191 | yes | export interface UiCoreOptions { |
| MutationOutcome | interface | 217 | no | interface MutationOutcome { |
| CommandFailure | class | 229 | no | class CommandFailure extends Error { |
| constructor | method | 233 | yes | constructor(code: UiErrorCode, message: string, currentRevision?: number) { |
| MappedFailure | interface | 242 | no | interface MappedFailure { |
| UiCore | class | 254 | yes | export class UiCore implements UiCommandPort, UiRevisionFeed { |
| constructor | method | 261 | yes | constructor(options: UiCoreOptions) { |
| submit | method | 278 | yes | async submit(command: UiCommand): Promise&lt;UiResult&lt;UiRevision&gt;&gt; { |
| raw | const | 279 | no | const raw: unknown = command; |
| commandId | const | 284 | no | const commandId = raw[&quot;commandId&quot;]; |
| kind | const | 288 | no | const kind = raw[&quot;kind&quot;]; |
| actorId | const | 292 | no | const actorId = raw[&quot;actorId&quot;]; |
| payloadInput | const | 297 | no | const payloadInput = raw[&quot;payload&quot;]; |
| payload | const | 301 | no | const payload: Readonly&lt;Record&lt;string, unknown&gt;&gt; = payloadInput ?? {}; |
| verifiedPrincipal | variable | 302 | no | let verifiedPrincipal: unknown = { trust: &quot;legacy-unverified&quot;, actorRef: actorId }; |
| principal | const | 305 | no | const principal = this.#resolvePrincipal(command); |
| needed | const | 320 | no | const needed = kind.startsWith(&quot;ui.draft.&quot;) ? &quot;ui:draft&quot; |
| hash | variable | 333 | no | let hash: string; |
| decision | const | 341 | no | const decision = this.#store.runCommandAtomic({ commandId, envelopeHash: hash, actorId, kind, |
| outcome | const | 347 | no | const outcome = this.#execute(kind, payload, raw[&quot;expectedRevision&quot;], actorId); |
| inner | const | 365 | no | const inner = error instanceof UiStoreError &amp;&amp; error.cause ? error.cause : error; |
| mapped | const | 366 | no | const mapped = this.#mapError(inner); |
| current | method | 373 | yes | current(worldId: string): UiRevision \| null { |
| worlds | method | 379 | yes | worlds(): Array&lt;{ |
| drafts | method | 391 | yes | drafts(filter: { worldId?: string; actorId?: string } = {}): UiDraft[] { |
| preview | method | 402 | yes | preview(draftId: string): |
| draft | variable | 417 | no | let draft: UiDraft \| null; |
| mapped | const | 421 | no | const mapped = this.#mapError(error); |
| diagnostics | const | 428 | no | const diagnostics = this.#world.validate(draft.document); |
| document | variable | 429 | no | let document: UiDocument; |
| failure | const | 433 | no | const failure = this.#documentFailure(error); |
| onRevision | method | 449 | yes | onRevision(listener: (revision: UiRevision) =&gt; void): () =&gt; void { |
| subscribe | method | 458 | yes | subscribe(listener: (revision: UiRevision) =&gt; void): () =&gt; void { |
| requestedId | const | 497 | no | const requestedId = payload[&quot;worldId&quot;]; |
| worldId | const | 501 | no | const worldId = requestedId ?? `w_${randomUUID()}`; |
| requestedTitle | const | 503 | no | const requestedTitle = payload[&quot;title&quot;]; |
| requestedAccent | const | 507 | no | const requestedAccent = payload[&quot;accent&quot;]; |
| existing | const | 512 | no | const existing = this.#store.listWorlds().find((world) =&gt; world.worldId === worldId); |
| base | const | 521 | no | const base = this.#world.defaultDocument(&quot;custom&quot;); |
| document | const | 522 | no | const document = this.#acceptDocument({ ...base, world: { ...base.world, id: worldId, |
| contentHash | const | 533 | no | const contentHash = this.#world.hash(document); |
| revision | const | 534 | no | const revision = this.#store.publish({ worldId, document, contentHash, expectedRevision: 0, |
| worldId | const | 552 | no | const worldId = payload[&quot;worldId&quot;]; |
| current | const | 556 | no | const current = this.#requireCurrent(worldId); |
| requestedBase | const | 558 | no | const requestedBase = payload[&quot;baseRevision&quot;]; |
| base | variable | 559 | no | let base = current; |
| found | const | 564 | no | const found = this.#store.getRevision(worldId, requestedBase); |
| requestedId | const | 571 | no | const requestedId = payload[&quot;draftId&quot;]; |
| draftId | const | 575 | no | const draftId = requestedId ?? randomUUID(); |
| document | const | 577 | no | const document = this.#acceptDocument(base.document); |
| draft | const | 578 | no | const draft = this.#store.createDraft({ draftId, worldId, baseRevision: base.revision, document, |
| draftId | const | 602 | no | const draftId = payload[&quot;draftId&quot;]; |
| draft | const | 606 | no | const draft = this.#store.getDraft(draftId); |
| expectedDraftRevision | const | 611 | no | const expectedDraftRevision = payload[&quot;expectedDraftRevision&quot;]; |
| operations | const | 623 | no | const operations = payload[&quot;operations&quot;]; |
| candidate | variable | 628 | no | let candidate: UiDocument; |
| document | const | 634 | no | const document = this.#acceptDocument(candidate); |
| updated | const | 636 | no | const updated = this.#store.updateDraft({ draftId, expectedDraftRevision, document, actorId }); |
| current | const | 637 | no | const current = this.#requireCurrent(updated.worldId); |
| expected | const | 653 | no | const expected = requireExpectedRevision(expectedRevision); |
| draftId | const | 654 | no | const draftId = payload[&quot;draftId&quot;]; |
| draft | const | 658 | no | const draft = this.#store.getDraft(draftId); |
| document | const | 663 | no | const document = this.#acceptDocument(draft.document); |
| contentHash | const | 664 | no | const contentHash = this.#world.hash(document); |
| revision | const | 665 | no | const revision = this.#store.publish({ worldId: draft.worldId, draftId, document, contentHash, |
| draftDiscarded | variable | 676 | no | let draftDiscarded = false; |
| draftId | const | 693 | no | const draftId = payload[&quot;draftId&quot;]; |
| draft | const | 697 | no | const draft = this.#store.getDraft(draftId); |
| current | const | 701 | no | const current = this.#requireCurrent(draft.worldId); |
| expected | const | 725 | no | const expected = requireExpectedRevision(expectedRevision); |
| input | const | 726 | no | const input = payload[&quot;document&quot;]; |
| document | const | 730 | no | const document = this.#acceptDocument(input); |
| worldId | const | 731 | no | const worldId = document.world.id; |
| contentHash | const | 732 | no | const contentHash = this.#world.hash(document); |
| revision | const | 733 | no | const revision = this.#store.publish({ worldId, document, contentHash, expectedRevision: expected, actorId }); |
| expected | const | 754 | no | const expected = requireExpectedRevision(expectedRevision); |
| worldId | const | 755 | no | const worldId = payload[&quot;worldId&quot;]; |
| targetRevision | const | 759 | no | const targetRevision = payload[&quot;targetRevision&quot;]; |
| revision | const | 767 | no | const revision = this.#store.rollback({ worldId, targetRevision, expectedRevision: expected, actorId }); |
| writer | const | 785 | no | const writer = this.#writer; |
| path | const | 789 | no | const path = payload[&quot;path&quot;]; |
| value | const | 793 | no | const value = payload[&quot;value&quot;]; |
| worldId | const | 798 | no | const worldId = this.#stateWorldId(payload[&quot;worldId&quot;]); |
| current | const | 799 | no | const current = this.#requireCurrent(worldId); |
| written | const | 801 | no | const written = writer.set(path, value); |
| worlds | const | 828 | no | const worlds = this.#store.listWorlds(); |
| home | const | 829 | no | const home = worlds.find((world) =&gt; world.kind === &quot;home&quot;); |
| only | const | 831 | no | const only = worlds[0]; |
| current | const | 840 | no | const current = this.#store.currentRevision(worldId); |
| diagnostics | const | 849 | no | const diagnostics = this.#world.validate(input); |
| errors | const | 850 | no | const errors = diagnostics.filter((diagnostic) =&gt; diagnostic.severity === &quot;error&quot;); |
| shaped | const | 864 | no | const shaped = worldErrorShape(error); |
| path | const | 866 | no | const path = shaped.path.length &gt; 0 ? shaped.path : &quot;/&quot;; |
| failure | const | 907 | no | const failure = this.#documentFailure(error); |
| code | const | 911 | no | const code = error[&quot;code&quot;]; |
| message | const | 916 | no | const message = error instanceof Error ? error.message : String(error); |
| mapStoreCode | function | 932 | no | function mapStoreCode(code: UiStoreError[&quot;code&quot;]): UiErrorCode { |
| mapStoreFailure | function | 950 | no | function mapStoreFailure(error: UiStoreError): MappedFailure { |
| mapped | const | 951 | no | const mapped: MappedFailure = { |
| refuse | function | 959 | no | function refuse&lt;T&gt;(code: UiErrorCode, message: string, currentRevision?: number): UiResult&lt;T&gt; { |
| isStoredResult | function | 966 | no | function isStoredResult(value: unknown): value is { ok: true; value: UiRevision } { |
| revision | const | 968 | no | const revision = value[&quot;value&quot;]; |
| requireExpectedRevision | function | 978 | no | function requireExpectedRevision(value: unknown): number { |
| projectionWriter | function | 985 | no | function projectionWriter(projection: UiStateProjection): UiStateWriter { |
| message | const | 995 | no | const message = error instanceof Error ? error.message : String(error); |
| collectStateValues | function | 1002 | no | function collectStateValues( input: Readonly&lt;Record&lt;string, unknown&gt;&gt;, prefix: string, target: Map&lt;string, UiScalar&gt;, ): void { |
| path | const | 1008 | no | const path = normalizeStatePath(key.startsWith(&quot;/&quot;) ? key : `${prefix}/${key}`); |
| normalizeStatePath | function | 1024 | no | function normalizeStatePath(path: string): string \| null { |
| segments | const | 1026 | no | const segments = path.slice(1).split(&quot;/&quot;); |
| stripLeadingSlash | function | 1034 | no | function stripLeadingSlash(path: string): string { |
| formatDiagnostics | function | 1038 | no | function formatDiagnostics(diagnostics: readonly UiDocumentDiagnostic[]): string { |
| worldErrorShape | function | 1045 | no | function worldErrorShape(error: unknown): { code: string; path: string; message: string } \| null { |
| code | const | 1047 | no | const code = error[&quot;code&quot;]; |
| path | const | 1048 | no | const path = error[&quot;path&quot;]; |
| message | const | 1049 | no | const message = error[&quot;message&quot;]; |
| isCommandKind | function | 1054 | no | function isCommandKind(value: unknown): value is UiCommandKind { |
| isNonEmptyString | function | 1058 | no | function isNonEmptyString(value: unknown): value is string { |
| isInteger | function | 1062 | no | function isInteger(value: unknown, min: number): value is number { |
| isScalar | function | 1066 | no | function isScalar(value: unknown): value is UiScalar { |
| isRecord | function | 1079 | no | function isRecord(value: unknown): value is Record&lt;string, unknown&gt; { |
| describeValue | function | 1083 | no | function describeValue(value: unknown): string { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 25 | external |
| ./hash.ts | import | 26 | [packages/tierflow/src/ui/hash.ts](./hash.ts.md) |
| ./store.ts | import | 27 | [packages/tierflow/src/ui/store.ts](./store.ts.md) |
| ./store.ts | import | 28 | [packages/tierflow/src/ui/store.ts](./store.ts.md) |
| ./world.ts | import | 29 | [packages/tierflow/src/ui/world.ts](./world.ts.md) |
| ./world.ts | import | 37 | [packages/tierflow/src/ui/world.ts](./world.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/tests/ui-commands.test.ts](../../tests/ui-commands.test.ts.md) | ../src/ui/commands.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * The UI core command handler.
 *
 * Every external surface — an HTTP route, a mobile gesture, a studio canvas, a
 * future host — is reduced to one `UiCommand`. This module is the only place a
 * command becomes an authoritative change: it validates the envelope, enforces
 * idempotency, applies the world document rules and commits through the durable
 * store under compare-and-swap.
 *
 * Three properties are load-bearing:
 *
 * - a command is accepted or refused as a whole, and every refusal is a typed
 *   `UiResult` failure rather than a thrown error;
 * - the same `commandId` with the same payload replays its original result, so a
 *   retry after a lost response never publishes twice;
 * - the revision feed fires only after a commit, so an adapter never observes a
 *   revision the store does not hold.
 *
 * The world document implementation is injected, so command logic is independent
 * of one schema build and a test can stub it. Storage is always the sibling
 * durable store. The core imports no adapter, no tier, no provider and no
 * transport.
 */

import { randomUUID } from "node:crypto";
import { commandEnvelopeHash } from "./hash.ts";
import { UiStoreError } from "./store.ts";
import type { UiStore } from "./store.ts";
import {
  UiWorldError,
  applyUiOperations,
  defaultUiDocument,
  parseUiDocument,
  uiDocumentHash,
  validateUiDocument,
} from "./world.ts";
import type { UiDocumentDiagnostic, UiOperation } from "./world.ts";
import type {
  UiCommand,
  UiCommandKind,
  UiCommandPort,
  UiDocument,
  UiDraft,
  UiErrorCode,
  UiRevision,
  UiRevisionFeed,
  UiResult,
  UiScalar,
} from "./types.ts";

/** Closed set of command kinds, mirrored from `UiCommandKind` for runtime checks. */
const COMMAND_KINDS: readonly UiCommandKind[] = [
  "ui.world.create",
  "ui.draft.create",
  "ui.draft.edit",
  "ui.draft.commit",
  "ui.draft.discard",
  "ui.publish",
  "ui.rollback",
  "ui.state.set",
];

/** Store codes that reach the command layer unchanged from `UiStoreError`. */
const STORE_ERROR_CODES: ReadonlySet<string> = new Set<string>([
  "NOT_FOUND",
  "REVISION_CONFLICT",
  "STORE_LOCKED",
  "UNSUPPORTED_VERSION",
  "STORE_ERROR",
]);

/**
 * The world document functions the core depends on.
 *
 * Injection keeps the handler independent of one document implementation, so a
 * test can supply a stub and a future schema can be swapped in without editing
 * command logic. The built-in module is the sibling `./world.ts`.
 */
export interface UiWorldModule {
  readonly parse: typeof parseUiDocument;
```

_First 80 of 1089 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
