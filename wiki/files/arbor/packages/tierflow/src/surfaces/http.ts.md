# File: packages/tierflow/src/surfaces/http.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/surfaces/http.ts |
| Language | TypeScript |
| Kind | source |
| Size | 31801 B |
| Lines | 887 |
| Hash | 9b2af78faa22 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| UiWorldSummary | interface | 37 | yes | export interface UiWorldSummary { |
| UiSurfaceCore | interface | 55 | yes | export interface UiSurfaceCore extends UiCommandPort { |
| UiHttpOptions | interface | 100 | yes | export interface UiHttpOptions { |
| UiWireMessage | type | 118 | yes | export type UiWireMessage = |
| UiWireCore | type | 143 | yes | export type UiWireCore = UiCommandPort &amp; Partial&lt;Pick&lt;UiSurfaceCore, &quot;worlds&quot;&gt;&gt;; |
| JsonWriter | type | 145 | no | type JsonWriter = (data: unknown, status?: number) =&gt; Response; |
| UiFailure | type | 148 | no | type UiFailure = { |
| UiRouteMatch | type | 155 | no | type UiRouteMatch = |
| UiCommandEnvelope | interface | 171 | no | interface UiCommandEnvelope { |
| STATUS_BY_CODE | const | 177 | no | const STATUS_BY_CODE: Readonly&lt;Record&lt;UiErrorCode, number&gt;&gt; = { |
| READ_METHODS | const | 187 | no | const READ_METHODS: readonly string[] = [&quot;GET&quot;]; |
| WRITE_METHODS | const | 188 | no | const WRITE_METHODS: readonly string[] = [&quot;POST&quot;]; |
| READ_WRITE_METHODS | const | 189 | no | const READ_WRITE_METHODS: readonly string[] = [&quot;GET&quot;, &quot;POST&quot;]; |
| DRAFT_METHODS | const | 190 | no | const DRAFT_METHODS: readonly string[] = [&quot;GET&quot;, &quot;DELETE&quot;]; |
| handleUiHttpRequest | function | 199 | yes | export async function handleUiHttpRequest( request: Request, options: UiHttpOptions, ): Promise&lt;Response \| null&gt; { |
| url | const | 203 | no | const url = new URL(request.url); |
| respond | const | 207 | no | const respond: JsonWriter = options.json ?? jsonResponse; |
| authorize | const | 208 | no | const authorize = options.authorize ?? allowAll; |
| uiWireMessages | function | 232 | yes | export function uiWireMessages( core: UiWireCore, revision: UiRevision, worldId: string, ): UiWireMessage[] { |
| frames | const | 237 | no | const frames: UiWireMessage[] = [{ kind: &quot;ui.document&quot;, worldId, revision }]; |
| listWorlds | const | 238 | no | const listWorlds = core.worlds; |
| dispatch | function | 245 | no | async function dispatch( url: URL, request: Request, match: UiRouteMatch, core: UiSurfaceCore, |
| worldId | const | 259 | no | const worldId = match.worldId; |
| current | const | 260 | no | const current = core.current(worldId); |
| limit | const | 277 | no | const limit = readLimit(url.searchParams); |
| worldId | const | 280 | no | const worldId = match.worldId; |
| history | const | 281 | no | const history = historyOf(core, worldId, limit.value); |
| draftId | const | 298 | no | const draftId = match.draftId; |
| draft | const | 300 | no | const draft = lookupDraft(core, draftId); |
| body | const | 305 | no | const body = await readJsonBody(request); |
| envelope | const | 307 | no | const envelope = readEnvelope(body.value); |
| result | const | 310 | no | const result = await core.submit({ commandId: envelope.value.commandId, kind: &quot;ui.draft.discard&quot;, actorId: envelope.value.actorId, payload: { draftId }, |
| body | const | 321 | no | const body = await readJsonBody(request); |
| envelope | const | 323 | no | const envelope = readEnvelope(body.value); |
| expectedDraftRevision | const | 326 | no | const expectedDraftRevision = body.value[&quot;expectedDraftRevision&quot;]; |
| operations | const | 330 | no | const operations = body.value[&quot;operations&quot;]; |
| draftId | const | 335 | no | const draftId = match.draftId; |
| result | const | 336 | no | const result = await core.submit({ commandId: envelope.value.commandId, kind: &quot;ui.draft.edit&quot;, actorId: envelope.value.actorId, payload: { draftId, expectedDraftRevision, operations }, |
| draft | const | 344 | no | const draft = lookupDraft(core, draftId); |
| body | const | 350 | no | const body = await readJsonBody(request); |
| actorId | const | 352 | no | const actorId = body.value[&quot;actorId&quot;]; |
| draftId | const | 357 | no | const draftId = match.draftId; |
| draft | const | 358 | no | const draft = lookupDraft(core, draftId); |
| candidate | const | 361 | no | const candidate = normalizePreview(core.preview(draftId)); |
| payload | const | 363 | no | const payload = candidate.value; |
| body | const | 373 | no | const body = await readJsonBody(request); |
| envelope | const | 375 | no | const envelope = readEnvelope(body.value); |
| expectedRevision | const | 378 | no | const expectedRevision = body.value[&quot;expectedRevision&quot;]; |
| worldId | const | 382 | no | const worldId = body.value[&quot;worldId&quot;]; |
| draftId | const | 387 | no | const draftId = body.value[&quot;draftId&quot;]; |
| document | const | 388 | no | const document = body.value[&quot;document&quot;]; |
| command | const | 402 | no | const command: UiCommand = |
| result | const | 419 | no | const result = await core.submit(command); |
| body | const | 425 | no | const body = await readJsonBody(request); |
| envelope | const | 427 | no | const envelope = readEnvelope(body.value); |
| expectedRevision | const | 430 | no | const expectedRevision = body.value[&quot;expectedRevision&quot;]; |
| worldId | const | 434 | no | const worldId = body.value[&quot;worldId&quot;]; |
| targetRevision | const | 438 | no | const targetRevision = body.value[&quot;targetRevision&quot;]; |
| result | const | 443 | no | const result = await core.submit({ commandId: envelope.value.commandId, kind: &quot;ui.rollback&quot;, actorId: envelope.value.actorId, expectedRevision, |
| projection | const | 456 | no | const projection = core.projection; |
| body | const | 460 | no | const body = await readJsonBody(request); |
| envelope | const | 462 | no | const envelope = readEnvelope(body.value); |
| path | const | 465 | no | const path = body.value[&quot;path&quot;]; |
| value | const | 472 | no | const value = body.value[&quot;value&quot;]; |
| requestedWorldId | const | 474 | no | const requestedWorldId = body.value[&quot;worldId&quot;]; |
| worldId | const | 481 | no | const worldId = requestedWorldId ?? defaultStateWorld(core); |
| result | const | 483 | no | const result = await core.submit({ commandId: envelope.value.commandId, kind: &quot;ui.state.set&quot;, actorId: envelope.value.actorId, payload: { path, value, ...(worldId === undefined ? {} : { worldId }) }, |
| createWorld | function | 495 | no | async function createWorld( request: Request, core: UiSurfaceCore, respond: JsonWriter, ): Promise&lt;Response&gt; { |
| body | const | 500 | no | const body = await readJsonBody(request); |
| envelope | const | 502 | no | const envelope = readEnvelope(body.value); |
| worldId | const | 505 | no | const worldId = body.value[&quot;worldId&quot;]; |
| title | const | 509 | no | const title = body.value[&quot;title&quot;]; |
| accent | const | 513 | no | const accent = body.value[&quot;accent&quot;]; |
| command | const | 518 | no | const command: UiCommand = { |
| result | const | 529 | no | const result = await core.submit(command); |
| createDraft | function | 534 | no | async function createDraft( request: Request, core: UiSurfaceCore, respond: JsonWriter, ): Promise&lt;Response&gt; { |
| body | const | 539 | no | const body = await readJsonBody(request); |
| envelope | const | 541 | no | const envelope = readEnvelope(body.value); |
| worldId | const | 544 | no | const worldId = body.value[&quot;worldId&quot;]; |
| baseRevision | const | 548 | no | const baseRevision = body.value[&quot;baseRevision&quot;]; |
| filter | const | 553 | no | const filter = { worldId, actorId: envelope.value.actorId }; |
| known | const | 554 | no | const known = new Set(core.drafts(filter).map((draft) =&gt; draft.draftId)); |
| command | const | 555 | no | const command: UiCommand = { |
| result | const | 563 | no | const result = await core.submit(command); |
| draft | const | 566 | no | const draft = recoverDraft(core, filter, known); |
| recoverDraft | function | 580 | no | function recoverDraft( core: UiSurfaceCore, filter: { worldId: string; actorId: string }, known: ReadonlySet&lt;string&gt;, ): UiDraft \| null { |
| visible | const | 585 | no | const visible = core.drafts(filter); |
| fresh | const | 586 | no | const fresh = visible.filter((draft) =&gt; !known.has(draft.draftId)); |
| listDrafts | function | 597 | no | function listDrafts(core: UiSurfaceCore, params: URLSearchParams): UiDraft[] { |
| worldId | const | 598 | no | const worldId = params.get(&quot;worldId&quot;) ?? undefined; |
| actorId | const | 599 | no | const actorId = params.get(&quot;actorId&quot;) ?? undefined; |
| filter | const | 600 | no | const filter: { worldId?: string; actorId?: string } = {}; |
| lookupDraft | function | 606 | no | function lookupDraft(core: UiSurfaceCore, draftId: string): UiDraft \| null { |
| direct | const | 607 | no | const direct = core.draft; |
| found | const | 609 | no | const found = direct.call(core, draftId); |
| normalizePreview | function | 623 | no | function normalizePreview(candidate: unknown): UiResult&lt;Record&lt;string, unknown&gt;&gt; { |
| code | const | 627 | no | const code = candidate[&quot;code&quot;]; |
| message | const | 628 | no | const message = candidate[&quot;message&quot;]; |
| defaultStateWorld | function | 653 | no | function defaultStateWorld(core: UiSurfaceCore): string \| undefined { |
| worlds | const | 654 | no | const worlds = core.worlds(); |
| home | const | 655 | no | const home = worlds.find((world) =&gt; world.kind === &quot;home&quot;); |
| newestDraft | function | 660 | no | function newestDraft(drafts: readonly UiDraft[]): UiDraft \| null { |
| newest | variable | 661 | no | let newest: UiDraft \| null = null; |
| historyOf | function | 674 | no | function historyOf( core: UiSurfaceCore, worldId: string, limit: number \| undefined, ): readonly UiRevision[] { |
| listed | const | 679 | no | const listed = core.revisions; |
| history | const | 680 | no | const history = listed === undefined ? fallbackHistory(core.current(worldId)) : listed.call(core, worldId, limit); |
| fallbackHistory | function | 685 | no | function fallbackHistory(current: UiRevision \| null): readonly UiRevision[] { |
| readLimit | function | 696 | no | function readLimit(params: URLSearchParams): UiResult&lt;number \| undefined&gt; { |
| raw | const | 697 | no | const raw = params.get(&quot;limit&quot;); |
| parsed | const | 702 | no | const parsed = Number(raw); |
| matchUiRoute | function | 716 | no | function matchUiRoute(pathname: string): UiRouteMatch \| null { |
| segments | const | 717 | no | const segments = pathname |
| worldId | const | 744 | no | const worldId = decodeSegment(worldSegment); |
| draftId | const | 757 | no | const draftId = decodeSegment(draftSegment); |
| action | const | 762 | no | const action = suffix[0]; |
| decodeSegment | function | 768 | no | function decodeSegment(segment: string): string \| null { |
| decoded | const | 770 | no | const decoded = decodeURIComponent(segment); |
| readJsonBody | function | 777 | no | async function readJsonBody(request: Request): Promise&lt;UiResult&lt;Record&lt;string, unknown&gt;&gt;&gt; { |
| parsed | variable | 778 | no | let parsed: unknown; |
| readEnvelope | function | 790 | no | function readEnvelope(body: Record&lt;string, unknown&gt;): UiResult&lt;UiCommandEnvelope&gt; { |
| commandId | const | 791 | no | const commandId = body[&quot;commandId&quot;]; |
| actorId | const | 799 | no | const actorId = body[&quot;actorId&quot;]; |
| commandFailure | function | 810 | no | function commandFailure(respond: JsonWriter, failure: UiFailure): Response { |
| invalid | function | 814 | no | function invalid(respond: JsonWriter, message: string): Response { |
| unreadableResult | function | 818 | no | function unreadableResult(respond: JsonWriter, action: string): Response { |
| draftNotFound | function | 828 | no | function draftNotFound(draftId: string): UiFailure { |
| failureBody | function | 832 | no | function failureBody(failure: UiFailure): Record&lt;string, unknown&gt; { |
| methodNotAllowed | function | 840 | no | function methodNotAllowed( respond: JsonWriter, method: string, allowed: readonly string[], pathname: string, |
| response | const | 846 | no | const response = respond( { error: `${method} is not allowed on ${pathname}.`, code: &quot;METHOD_NOT_ALLOWED&quot; }, 405, ); |
| headers | const | 850 | no | const headers = new Headers(response.headers); |
| jsonResponse | function | 859 | no | function jsonResponse(data: unknown, status = 200): Response { |
| allowAll | function | 869 | no | function allowAll(): boolean { |
| errorMessage | function | 873 | no | function errorMessage(error: unknown): string { |
| isRevisionNumber | function | 877 | no | function isRevisionNumber(value: unknown): value is number { |
| isUiErrorCode | function | 881 | no | function isUiErrorCode(value: unknown): value is UiErrorCode { |
| isRecord | function | 885 | no | function isRecord(value: unknown): value is Record&lt;string, unknown&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../ui/types.ts | import | 20 | [packages/tierflow/src/ui/types.ts](../ui/types.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/tests/ui-http-surface.test.ts](../../tests/ui-http-surface.test.ts.md) | ../src/surfaces/http.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * HTTP interaction surface for the UI core.
 *
 * This module is an adapter: it turns HTTP requests into `UiCommand`s and reads
 * back worlds, drafts, revisions and the state projection. It imports core
 * types only, and the core never imports it. Nothing here knows about chat,
 * provider coordination or the legacy wire protocol, so any host can mount
 * these routes.
 *
 * The baseline surface is an infinite 3D canvas described by world documents.
 * One world has one revision series, so every published read and every
 * compare-and-swap command names a `worldId`.
 *
 * Every request either produces a response or returns `null`, which tells the
 * host server that the path is not a UI route and routing should continue.
 * Combined with `authorize`, the surface stays transport-agnostic: a Bun
 * server, a test harness and a future browser host all drive it the same way.
 */

import type {
  UiCommand,
  UiCommandPort,
  UiDraft,
  UiErrorCode,
  UiEvent,
  UiRevision,
  UiResult,
} from "../ui/types.ts";

/**
 * One row of the world list.
 *
 * `revision` is the current published revision number for that world and is
 * `0` before the world's first publish; `createdAt` is the world creation time
 * in milliseconds since the epoch.
 */
export interface UiWorldSummary {
  readonly worldId: string;
  readonly kind: "home" | "custom";
  readonly title: string;
  readonly accent: string;
  readonly revision: number;
  readonly createdAt: number;
}

/**
 * Core operations this surface needs beyond the command port.
 *
 * `submit` remains the only mutation path; every read method is a view the core
 * already owns. `revisions`, `projection` and `draft` are optional so a core
 * that keeps less state still serves the routes it can answer. Each optional
 * member documents its degradation, and the surface never throws when one is
 * absent.
 */
export interface UiSurfaceCore extends UiCommandPort {
  /** The published revision of `worldId`, or null when that world has none. */
  current(worldId: string): UiRevision | null;
  /**
   * Every world the installation knows, home world included.
   *
   * The list is the navigation model of the canvas: a client renders it to
   * move between worlds, and the surface republishes it after a commit.
   */
  worlds(): Array<{
    worldId: string;
    kind: "home" | "custom";
    title: string;
    accent: string;
    revision: number;
    createdAt: number;
  }>;
  /**
   * Drafts visible to the caller.
   *
   * `filter` narrows by world and by draft owner; either field may be omitted,
   * and an empty filter returns every draft the core will disclose.
   */
  drafts(filter?: { worldId?: string; actorId?: string }): UiDraft[];
  /**
   * Validates a draft without mutating anything and returns candidate render
```

_First 80 of 888 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
