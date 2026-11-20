# File: packages/tierflow/tests/bus.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/bus.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 4701 B |
| Lines | 135 |
| Hash | 9bc397934bbd |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| bus | const | 14 | no | const bus = new EventBus(); |
| seqs | const | 15 | no | const seqs: number[] = []; |
| bus | const | 24 | no | const bus = new EventBus(4); |
| recent | const | 29 | no | const recent = bus.recent(100); |
| bus | const | 36 | no | const bus = new EventBus(100); |
| bus | const | 47 | no | const bus = new EventBus(50); |
| newer | const | 51 | no | const newer = bus.since(12); |
| bus | const | 57 | no | const bus = new EventBus(100); |
| bus | const | 71 | no | const bus = new EventBus(100); |
| bus | const | 81 | no | const bus = new EventBus(10); |
| seen | const | 82 | no | const seen: number[] = []; |
| event | const | 90 | no | const event = bus.emit({ tier: 1, type: &quot;system.note&quot;, sessionId: &quot;s&quot; }); |
| bus | const | 100 | no | const bus = new EventBus(10); |
| seen | const | 101 | no | const seen: number[] = []; |
| off | const | 102 | no | const off = bus.subscribe((event) =&gt; { seen.push(event.seq); }); |
| bus | const | 112 | no | const bus = new EventBus(10); |
| event | const | 113 | no | const event = bus.emit({ tier: 3, type: &quot;job.stdout&quot;, sessionId: &quot;sess&quot;, level: &quot;warn&quot;, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 9 | external |
| ../src/bus.ts | import | 10 | [packages/tierflow/src/bus.ts](../src/bus.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * EventBus contract tests.
 *
 * The bus is the single source of truth for ordering (monotonic `seq`),
 * replay (`since`) and liveness (bounded ring buffer) that the UI depends on.
 * A listener that throws must never take down the emitting tier.
 */

import { describe, expect, test } from "bun:test";
import { EventBus } from "../src/bus.ts";

describe("EventBus", () => {
  test("assigns a monotonic seq starting at 1", () => {
    const bus = new EventBus();
    const seqs: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      seqs.push(bus.emit({ tier: 1, type: "system.note", sessionId: "s" }).seq);
    }
    expect(seqs).toEqual([1, 2, 3, 4, 5]);
    expect(bus.seq).toBe(5);
  });

  test("bounds the ring buffer to its configured size", () => {
    const bus = new EventBus(4);
    for (let i = 0; i < 10; i += 1) {
      bus.emit({ tier: 1, type: "system.note", sessionId: "s" });
    }
    expect(bus.seq).toBe(10);
    const recent = bus.recent(100);
    expect(recent.length).toBe(4);
    expect(recent.map((event) => event.seq)).toEqual([7, 8, 9, 10]);
    expect(bus.recent(2).map((event) => event.seq)).toEqual([9, 10]);
  });

  test("since(n) returns only events newer than n", () => {
    const bus = new EventBus(100);
    for (let i = 0; i < 10; i += 1) {
      bus.emit({ tier: 1, type: "system.note", sessionId: "s" });
    }
    expect(bus.since(5).map((event) => event.seq)).toEqual([6, 7, 8, 9, 10]);
    expect(bus.since(0).length).toBe(10);
    expect(bus.since(10)).toEqual([]);
    expect(bus.since(99)).toEqual([]);
  });

  test("since(n) never returns an event at or below n", () => {
    const bus = new EventBus(50);
    for (let i = 0; i < 25; i += 1) {
      bus.emit({ tier: 2, type: "plan.finished", sessionId: "s" });
    }
    const newer = bus.since(12);
    expect(newer.length).toBe(13);
    expect(newer.every((event) => event.seq > 12)).toBe(true);
  });

  test("counters move on intent.received, plan.created and job.started", () => {
    const bus = new EventBus(100);
    expect(bus.counters).toEqual({ intents: 0, plans: 0, runs: 0, events: 0 });

    bus.emit({ tier: 1, type: "intent.received", sessionId: "s" });
    bus.emit({ tier: 2, type: "plan.created", sessionId: "s" });
    bus.emit({ tier: 3, type: "job.started", sessionId: "s" });

    expect(bus.counters.intents).toBe(1);
    expect(bus.counters.plans).toBe(1);
    expect(bus.counters.runs).toBe(1);
    expect(bus.counters.events).toBe(3);
  });

  test("counters ignore unrelated event types but still count events", () => {
    const bus = new EventBus(100);
    bus.emit({ tier: 2, type: "intent.routed", sessionId: "s" });
    bus.emit({ tier: 3, type: "job.stdout", sessionId: "s" });
    expect(bus.counters.intents).toBe(0);
    expect(bus.counters.plans).toBe(0);
    expect(bus.counters.runs).toBe(0);
    expect(bus.counters.events).toBe(2);
  });

  test("a throwing listener does not break emit", () => {
```

_First 80 of 136 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
