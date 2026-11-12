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
    this.#epoch = options.epoch;
    this.#revisionOf = options.revisionOf;
  }

  /** Epoch string every outgoing cursor from this session must carry. */
  get epoch(): string {
    return this.#epoch.id;
  }

  /** Highest sequence number emitted so far in this process. */
  get latestSeq(): number {
    return this.#bus.seq;
  }

  /** Oldest sequence number still retained in the bus ring. */
  get oldestSeq(): number {
    return this.#bus.oldestSeq;
  }

  /**
   * Resolve a reconnecting client against the retained window.
   *
   * - No cursor: the client is new or chose not to resume, so it receives the
   *   recent window and `gap: false`.
   * - Cursor from another epoch: the process restarted, so sequence numbers no
   *   longer refer to the same stream. `gap: true`, no events, resnapshot.
   * - Cursor below `oldestSeq - 1`: at least one event after the cursor has
   *   already been evicted, so a replay would silently lose it. `gap: true`,
   *   no events, resnapshot.
   * - Otherwise the cursor is contiguous with the ring: replay `since(seq)`.
   */
  resume(cursor: UiCursor | null | undefined): UiResync & { events: readonly UiEvent[] } {
    const revision = this.#revisionOf?.() ?? 0;
    const replay = this.#replay(cursor);
    return {
      ...this.#bounds(),
      gap: replay.gap,
      revision,
      events: replay.events,
    };
  }

  /** Cursor a client should keep after applying the event with this seq. */
  cursorOf(seq: number): UiCursor {
    return { epoch: this.#epoch.id, seq };
  }

  /**
   * Live replay without the revision field, for callers that only need the
   * event window. Applies the same gap rules as {@link resume}.
   */
  eventsSince(cursor: UiCursor | null): { gap: boolean; events: readonly UiEvent[] } {
    return this.#replay(cursor);
  }

  /** Snapshot of the fields every response must echo back. */
  #bounds(): { epoch: string; oldestSeq: number; latestSeq: number } {
    return {
      epoch: this.#epoch.id,
      oldestSeq: this.#bus.oldestSeq,
      latestSeq: this.#bus.seq,
    };
  }

  /**
   * True when the next event after `seq` (that is, `seq + 1`) is older than the
   * retained window, so a replay would skip at least one event. A cursor at
   * exactly `oldestSeq - 1` is still contiguous and resumes cleanly.
   */
  #belowWindow(seq: number): boolean {
    return seq < this.#bus.oldestSeq - 1;
  }

  #replay(cursor: UiCursor | null | undefined): { gap: boolean; events: readonly UiEvent[] } {
    if (cursor === null || cursor === undefined) {
      return { gap: false, events: this.#bus.recent(RECENT_LIMIT) };
    }
    if (!this.#epoch.matches(cursor)) {
      return { gap: true, events: [] };
    }
    if (this.#belowWindow(cursor.seq)) {
      return { gap: true, events: [] };
    }
    return { gap: false, events: this.#bus.since(cursor.seq) };
  }
}

/**
 * Validate a cursor received as untrusted JSON.
 *
 * Accepts any object with a non-empty string `epoch` and a finite non-negative
 * integer `seq`; additional properties are ignored. Returns null for everything
 * else, including negative, fractional, `NaN` and infinite sequences, and never
 * throws: a hostile object with a throwing getter is treated as invalid.
 */
export function parseCursor(input: unknown): UiCursor | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return null;
  try {
    const epoch: unknown = (input as { epoch?: unknown }).epoch;
    const seq: unknown = (input as { seq?: unknown }).seq;
    if (typeof epoch !== "string" || epoch.length === 0) return null;
    if (typeof seq !== "number" || !Number.isInteger(seq) || seq < 0) return null;
    return { epoch, seq };
  } catch {
    return null;
  }
}
