# File: packages/tierflow/src/surfaces/websocket.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/surfaces/websocket.ts |
| Language | TypeScript |
| Kind | source |
| Size | 15868 B |
| Lines | 458 |
| Hash | c1388296d9fb |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WRITE_CAPABILITY | const | 38 | no | const WRITE_CAPABILITY: Capability = &quot;surface.write&quot;; |
| COMMAND_KINDS | const | 41 | no | const COMMAND_KINDS: ReadonlySet&lt;string&gt; = new Set&lt;UiCommandKind&gt;([ &quot;ui.world.create&quot;, &quot;ui.draft.create&quot;, &quot;ui.draft.edit&quot;, &quot;ui.draft.commit&quot;, |
| UiSocketWorld | interface | 58 | yes | export interface UiSocketWorld { |
| UiSocketCore | interface | 75 | yes | export interface UiSocketCore extends UiCommandPort { |
| UiSocketOptions | interface | 97 | yes | export interface UiSocketOptions { |
| UiSocketFrame | type | 128 | yes | export type UiSocketFrame = |
| UiSocketSession | class | 156 | yes | export class UiSocketSession { |
| constructor | method | 163 | yes | constructor(options: UiSocketOptions) { |
| handleInbound | method | 189 | yes | handleInbound(raw: unknown): void { |
| sendInitial | method | 203 | yes | sendInitial(): void { |
| worlds | const | 204 | no | const worlds = this.#worlds(); |
| home | const | 206 | no | const home = worlds.find((world) =&gt; world.kind === &quot;home&quot;); |
| revision | const | 208 | no | const revision = this.#current(home.worldId); |
| sendResync | method | 219 | yes | sendResync(cursor: UiCursor \| null): void { |
| resync | const | 221 | no | const resync = this.#session.resume(cursor); |
| broadcastRevision | method | 242 | yes | broadcastRevision(revision: UiRevision): void { |
| worldId | const | 244 | no | const worldId = revision.document.world.id; |
| message | const | 252 | no | const message = decodeMessage(raw); |
| commandId | const | 255 | no | const commandId = readId(message[&quot;commandId&quot;]); |
| cursor | const | 272 | no | const cursor = cursorFromMessage(message); |
| raw | const | 281 | no | const raw = message[&quot;command&quot;]; |
| commandId | const | 287 | no | const commandId = readId(raw[&quot;commandId&quot;]) ?? envelopeCommandId; |
| kind | const | 293 | no | const kind = raw[&quot;kind&quot;]; |
| expectedRevision | const | 299 | no | const expectedRevision = raw[&quot;expectedRevision&quot;]; |
| payload | const | 305 | no | const payload = raw[&quot;payload&quot;]; |
| command | const | 320 | no | const command: UiCommand = { |
| result | const | 339 | no | const result: UiResult&lt;UiRevision&gt; = await this.#core.submit(command); |
| cursorFromMessage | function | 406 | yes | export function cursorFromMessage(message: unknown): UiCursor \| null { |
| direct | const | 408 | no | const direct = parseCursor(message); |
| decodeMessage | function | 424 | no | function decodeMessage(raw: unknown): Record&lt;string, unknown&gt; \| null { |
| parseJsonObject | function | 431 | no | function parseJsonObject(text: string): Record&lt;string, unknown&gt; \| null { |
| parsed | const | 433 | no | const parsed: unknown = JSON.parse(text); |
| readId | function | 440 | no | function readId(value: unknown): string \| null { |
| isCommandKind | function | 444 | no | function isCommandKind(value: unknown): value is UiCommandKind { |
| isRevisionNumber | function | 448 | no | function isRevisionNumber(value: unknown): value is number { |
| describeValue | function | 452 | no | function describeValue(value: unknown): string { |
| isRecord | function | 456 | no | function isRecord(value: unknown): value is Record&lt;string, unknown&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../security.ts | import | 23 | [packages/tierflow/src/security.ts](../security.ts.md) |
| ../ui/realtime.ts | import | 24 | [packages/tierflow/src/ui/realtime.ts](../ui/realtime.ts.md) |
| ../ui/types.ts | import | 25 | [packages/tierflow/src/ui/types.ts](../ui/types.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/tests/ui-websocket-surface.test.ts](../../tests/ui-websocket-surface.test.ts.md) | ../src/surfaces/websocket.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * WebSocket interaction surface for the UI core.
 *
 * This module is an adapter: it turns inbound socket messages into `UiCommand`s
 * and reads back published revisions, the world list, drafts and the resume
 * window. It imports core types only, and the core never imports it. Nothing
 * here knows about chat, provider coordination or the legacy wire protocol, so
 * any host can mount it.
 *
 * Two invariants shape the design:
 *
 * - The surface never mutates core state directly. `core.submit` is the only
 *   write path, so validation, idempotency and revision checks stay in the core.
 * - The surface never resolves data flows. It ships world documents; a client
 *   resolves bound values against the state projection it reads over HTTP.
 *
 * Resume is delegated to `RealtimeSession`, so a cursor that fell out of the
 * retained window arrives as an explicit `gap: true` frame instead of a
 * silently partial stream. Frame types are declared here rather than imported
 * from a host protocol module, because the core has no transport.
 */

import type { Capability } from "../security.ts";
import { parseCursor, type RealtimeSession } from "../ui/realtime.ts";
import type {
  UiCommand,
  UiCommandKind,
  UiCommandPort,
  UiCursor,
  UiDraft,
  UiErrorCode,
  UiEvent,
  UiRevision,
  UiResult,
} from "../ui/types.ts";

/** The only capability this surface exercises: mutating world state. */
const WRITE_CAPABILITY: Capability = "surface.write";

/** Every command kind a socket may carry, used by the untrusted-input guard. */
const COMMAND_KINDS: ReadonlySet<string> = new Set<UiCommandKind>([
  "ui.world.create",
  "ui.draft.create",
  "ui.draft.edit",
  "ui.draft.commit",
  "ui.draft.discard",
  "ui.publish",
  "ui.rollback",
  "ui.state.set",
]);

/**
 * One row of the world list as this surface publishes it.
 *
 * `revision` is `0` before a world's first publish, and `createdAt` is the
 * world creation time in milliseconds since the epoch.
 */
export interface UiSocketWorld {
  readonly worldId: string;
  readonly kind: "home" | "custom";
  readonly title: string;
  readonly accent: string;
  readonly revision: number;
  readonly createdAt: number;
}

/**
 * Core operations a socket needs beyond the command port.
 *
 * `submit` remains the only mutation path. Every other member is a view the
 * core already owns: the current revision of one world, the navigable world
 * list, and the drafts visible to this installation. `revisions` is optional so
 * a core that keeps less history still serves the socket.
 */
export interface UiSocketCore extends UiCommandPort {
  /** The published revision of `worldId`, or null when that world has none. */
  current(worldId: string): UiRevision | null;
  /** Every world the installation knows, home world included. */
  worlds(): Array<{
    worldId: string;
```

_First 80 of 459 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
