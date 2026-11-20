# File: packages/tierflow/src/bus.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/bus.ts |
| Language | TypeScript |
| Kind | source |
| Size | 5121 B |
| Lines | 151 |
| Hash | 089847318bf7 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| EventInput | type | 16 | yes | export type EventInput = { |
| Listener | type | 27 | yes | export type Listener = (event: BusEvent) =&gt; void; |
| EventBus | class | 29 | yes | export class EventBus { |
| constructor | method | 44 | yes | constructor(ringSize = 2000) { |
| emit | method | 67 | yes | emit(input: EventInput): BusEvent { |
| event | const | 74 | no | const event: BusEvent = { |
| subscribe | method | 102 | yes | subscribe(listener: Listener): () =&gt; void { |
| size | const | 114 | no | const size = this.#ringSize; |
| physical | const | 115 | no | const physical = (this.#head - this.#count + start + size) % size; |
| first | const | 116 | no | const first = Math.min(length, size - physical); |
| head | const | 117 | no | const head = this.#slots.slice(physical, physical + first).filter((event): event is BusEvent =&gt; event !== undefined); |
| oldest | const | 128 | no | const oldest = this.#slots[(this.#head - this.#count + this.#ringSize) % this.#ringSize]; |
| recent | method | 132 | yes | recent(limit = 200): BusEvent[] { |
| take | const | 133 | no | const take = Math.min(Math.max(0, limit), this.#count); |
| since | method | 137 | yes | since(seq: number): BusEvent[] { |
| ordered | const | 139 | no | const ordered = this.#window(0, this.#count); |
| lo | variable | 141 | no | let lo = 0; |
| hi | variable | 142 | no | let hi = ordered.length; |
| mid | const | 144 | no | const mid = (lo + hi) &gt;&gt; 1; |
| current | const | 145 | no | const current = ordered[mid]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./protocol.ts | import | 14 | [packages/tierflow/src/protocol.ts](./protocol.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/cli.ts](./cli.ts.md) | ./bus.ts |
| [packages/tierflow/src/hotpath.ts](./hotpath.ts.md) | ./bus.ts |
| [packages/tierflow/src/lab.ts](./lab.ts.md) | ./bus.ts |
| [packages/tierflow/src/registry.ts](./registry.ts.md) | ./bus.ts |
| [packages/tierflow/src/server.ts](./server.ts.md) | ./bus.ts |
| [packages/tierflow/src/surface.ts](./surface.ts.md) | ./bus.ts |
| [packages/tierflow/src/tier1/agent.ts](./tier1/agent.ts.md) | ../bus.ts |
| [packages/tierflow/src/tier2/router.ts](./tier2/router.ts.md) | ../bus.ts |
| [packages/tierflow/src/tier3/executor.ts](./tier3/executor.ts.md) | ../bus.ts |
| [packages/tierflow/tests/bus.test.ts](../tests/bus.test.ts.md) | ../src/bus.ts |
| [packages/tierflow/tests/executor.test.ts](../tests/executor.test.ts.md) | ../src/bus.ts |
| [packages/tierflow/tests/router.test.ts](../tests/router.test.ts.md) | ../src/bus.ts |
| [packages/tierflow/tests/tier-capability.test.ts](../tests/tier-capability.test.ts.md) | ../src/bus.ts |
| [packages/tierflow/tests/ui-realtime.test.ts](../tests/ui-realtime.test.ts.md) | ../src/bus.ts |
| [packages/tierflow/tests/ui-websocket-surface.test.ts](../tests/ui-websocket-surface.test.ts.md) | ../src/bus.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 152 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
