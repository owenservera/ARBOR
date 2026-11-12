/**
 * Typed event bus with a bounded ring buffer.
 *
 * The bus is the single source of truth for what the UI sees. Every tier
 * publishes here; the websocket layer fans out; the Rust hot path tap reads
 * the same stream. Ordering is guaranteed by a monotonic `seq` assigned here,
 * so the UI can detect gaps after a reconnect.
 *
 * The ring is a fixed-size slot array with a head index, never a growing
 * array: an emit on a full ring is O(1). `recent()` and `since()` rebuild the
 * ordered view from the two contiguous physical chunks.
 */

import { nextId, PROTOCOL_VERSION, type BusEvent, type BusEventType, type Level, type Tier } from "./protocol.ts";

export type EventInput = {
  tier: Tier;
  type: BusEventType;
  sessionId: string;
  level?: Level;
  runId?: string;
  planId?: string;
  text?: string;
  data?: Record<string, string | number | boolean | null>;
};

export type Listener = (event: BusEvent) => void;

export class EventBus {
  #seq = 0;
  /**
   * Fixed-size slot array. The ring never grows: an emit writes one slot and
   * advances the head, so a full ring costs O(1) instead of an O(n) splice.
   */
  #slots: Array<BusEvent | undefined>;
  #ringSize: number;
  /** Index of the next slot to write. */
  #head = 0;
  /** Number of live events currently held (never above `#ringSize`). */
  #count = 0;
  #listeners = new Set<Listener>();
  #counters = { intents: 0, plans: 0, runs: 0, events: 0 };

  constructor(ringSize = 2000) {
    this.#ringSize = Math.max(1, Math.floor(ringSize));
    this.#slots = new Array<BusEvent | undefined>(this.#ringSize);
  }

  get counters() {
    return { ...this.#counters };
  }

  get seq(): number {
    return this.#seq;
  }

  /** Fixed slot count. The backing array never grows. */
  get capacity(): number {
    return this.#ringSize;
  }

  /** Live events currently held by the ring. */
  get stored(): number {
    return this.#count;
  }

  emit(input: EventInput): BusEvent {
    this.#seq += 1;
    if (input.type === "intent.received") this.#counters.intents += 1;
    if (input.type === "plan.created") this.#counters.plans += 1;
    if (input.type === "job.started") this.#counters.runs += 1;
    this.#counters.events = this.#seq;

    const event: BusEvent = {
      version: PROTOCOL_VERSION,
      seq: this.#seq,
      id: nextId("evt"),
      ts: Date.now(),
      tier: input.tier,
      type: input.type,
      level: input.level ?? "info",
      sessionId: input.sessionId,
      ...(input.runId === undefined ? {} : { runId: input.runId }),
      ...(input.planId === undefined ? {} : { planId: input.planId }),
      ...(input.text === undefined ? {} : { text: input.text }),
      ...(input.data === undefined ? {} : { data: input.data }),
    };

    this.#slots[this.#head] = event;
    this.#head = (this.#head + 1) % this.#ringSize;
    if (this.#count < this.#ringSize) this.#count += 1;
    for (const listener of this.#listeners) {
      try {
        listener(event);
      } catch {
        // A dead subscriber must never break the emitting tier.
      }
    }
    return event;
  }

  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /**
   * Live events in seq order, oldest first. The ring is physically split in
   * two contiguous chunks (`[head..end]` then `[0..head)`), so it is rebuilt
   * with two slices instead of a copy per element.
   */
  #window(start: number, length: number): BusEvent[] {
    if (length <= 0) return [];
    const size = this.#ringSize;
    const physical = (this.#head - this.#count + start + size) % size;
    const first = Math.min(length, size - physical);
    const head = this.#slots.slice(physical, physical + first).filter((event): event is BusEvent => event !== undefined);
    if (first >= length) return head;
    return head.concat(this.#slots.slice(0, length - first).filter((event): event is BusEvent => event !== undefined));
  }

  /**
   * Oldest sequence number still retained in the ring. A resume cursor below
   * this value can no longer be replayed and the client must resnapshot.
   */
  get oldestSeq(): number {
    if (this.#count === 0) return this.#seq;
    const oldest = this.#slots[(this.#head - this.#count + this.#ringSize) % this.#ringSize];
    return oldest?.seq ?? this.#seq;
  }

  recent(limit = 200): BusEvent[] {
    const take = Math.min(Math.max(0, limit), this.#count);
    return this.#window(this.#count - take, take);
  }

  since(seq: number): BusEvent[] {
    if (!Number.isFinite(seq)) return [];
    const ordered = this.#window(0, this.#count);
    // Ordered by seq: binary search keeps reconnect replay cheap.
    let lo = 0;
    let hi = ordered.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const current = ordered[mid];
      if (current !== undefined && current.seq <= seq) lo = mid + 1;
      else hi = mid;
    }
    return ordered.slice(lo);
  }
}
