# File: packages/tierflow/src/ui/realtime.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/ui/realtime.ts |
| Language | TypeScript |
| Kind | source |
| Size | 6895 B |
| Lines | 187 |
| Hash | 21b18edd6248 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RECENT_LIMIT | const | 19 | no | const RECENT_LIMIT = 200; |
| ResumeEpoch | class | 28 | yes | export class ResumeEpoch { |
| constructor | method | 37 | yes | constructor(id?: string) { |
| matches | method | 46 | yes | matches(other: { epoch: string }): boolean { |
| RealtimeSessionOptions | interface | 57 | yes | export interface RealtimeSessionOptions { |
| RealtimeSession | class | 74 | yes | export class RealtimeSession { |
| constructor | method | 79 | yes | constructor(options: RealtimeSessionOptions) { |
| resume | method | 112 | yes | resume(cursor: UiCursor \| null \| undefined): UiResync &amp; { events: readonly UiEvent[] } { |
| revision | const | 113 | no | const revision = this.#revisionOf?.() ?? 0; |
| replay | const | 114 | no | const replay = this.#replay(cursor); |
| cursorOf | method | 124 | yes | cursorOf(seq: number): UiCursor { |
| eventsSince | method | 132 | yes | eventsSince(cursor: UiCursor \| null): { gap: boolean; events: readonly UiEvent[] } { |
| parseCursor | function | 176 | yes | export function parseCursor(input: unknown): UiCursor \| null { |
| epoch | const | 179 | no | const epoch: unknown = (input as { epoch?: unknown }).epoch; |
| seq | const | 180 | no | const seq: unknown = (input as { seq?: unknown }).seq; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 15 | external |
| ./types.ts | import | 16 | [packages/tierflow/src/ui/types.ts](./types.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/surfaces/websocket.ts](../surfaces/websocket.ts.md) | ../ui/realtime.ts |
| [packages/tierflow/tests/ui-realtime.test.ts](../../tests/ui-realtime.test.ts.md) | ../src/ui/realtime.ts |
| [packages/tierflow/tests/ui-websocket-surface.test.ts](../../tests/ui-websocket-surface.test.ts.md) | ../src/ui/realtime.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Realtime resume semantics for the UI transport.
 *
 * A cursor is only meaningful inside the process that issued it: `EventBus`
 * sequence numbers restart at 0 on every start, and `since(seq)` returns an
 * empty array both when a client is already caught up and when its cursor has
 * fallen out of the bounded ring buffer. Those two cases demand different
 * client behaviour, so this module tags every cursor with a per-process epoch
 * and reports an unreplayable cursor as an explicit `gap`, which tells the
 * client to resnapshot instead of assuming it is current.
 *
 * Pure in-memory logic over an `EventBus`: no transport, no I/O, no adapters.
 */

import { randomUUID } from "node:crypto";
import type { UiCursor, UiEvent, UiEventSource, UiResync } from "./types.ts";

/** Recent-window size returned when a client reconnects without a cursor. */
const RECENT_LIMIT = 200;

/**
 * Identity of one process run.
 *
 * Every cursor carries this value so a server can tell a cursor issued by the
 * current process from one issued before a restart. Both runs use sequence
 * numbers starting at 0, so the sequence number alone cannot distinguish them.
 */
export class ResumeEpoch {
  /** Opaque epoch identifier. Stable for the lifetime of the process. */
  readonly id: string;

  /**
   * @param id Epoch string chosen by the process owner. When omitted, an empty
   * string, or a non-string, a random UUID is generated so that two runs never
   * share an epoch by accident.
   */
  constructor(id?: string) {
    this.id = typeof id === "string" && id.length > 0 ? id : randomUUID();
  }

  /**
   * True when the given cursor or payload was issued by this epoch. Any object
   * carrying an `epoch` string can be tested, so callers need not narrow the
   * value to `UiCursor` first.
   */
  matches(other: { epoch: string }): boolean {
    return other.epoch === this.id;
  }
}

/**
 * Construction inputs for a {@link RealtimeSession}.
 *
 * `revisionOf` is read on every `resume` call rather than captured once, so a
 * later document publication is reflected in the next resync payload.
 */
export interface RealtimeSessionOptions {
  /** Event stream whose retained window defines what can be replayed. */
  bus: UiEventSource;
  /** Identity of the current process run. */
  epoch: ResumeEpoch;
  /** Current published document revision. Defaults to 0 when absent. */
  revisionOf?: () => number;
}

/**
 * Resume semantics for one server process.
 *
 * The session owns the decision "replay or resnapshot" for reconnecting
 * clients. It never mutates the bus and never trusts a cursor beyond its shape:
 * an epoch mismatch or a cursor below the retained window both produce
 * `gap: true` with no events.
 */
export class RealtimeSession {
  readonly #bus: UiEventSource;
  readonly #epoch: ResumeEpoch;
  readonly #revisionOf: (() => number) | undefined;

  constructor(options: RealtimeSessionOptions) {
    this.#bus = options.bus;
```

_First 80 of 188 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
