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
    const bus = new EventBus(10);
    const seen: number[] = [];
    bus.subscribe(() => {
      throw new Error("listener boom");
    });
    bus.subscribe((event) => {
      seen.push(event.seq);
    });

    const event = bus.emit({ tier: 1, type: "system.note", sessionId: "s" });
    expect(event.seq).toBe(1);
    expect(seen).toEqual([1]);

    bus.emit({ tier: 1, type: "system.note", sessionId: "s" });
    expect(seen).toEqual([1, 2]);
    expect(bus.seq).toBe(2);
  });

  test("unsubscribe stops delivery", () => {
    const bus = new EventBus(10);
    const seen: number[] = [];
    const off = bus.subscribe((event) => {
      seen.push(event.seq);
    });
    bus.emit({ tier: 1, type: "system.note", sessionId: "s" });
    off();
    bus.emit({ tier: 1, type: "system.note", sessionId: "s" });
    expect(seen).toEqual([1]);
  });

  test("emitted events carry the documented shape", () => {
    const bus = new EventBus(10);
    const event = bus.emit({
      tier: 3,
      type: "job.stdout",
      sessionId: "sess",
      level: "warn",
      runId: "run1",
      planId: "plan1",
      text: "hello",
      data: { line: "hello" },
    });
    expect(event.version).toBe(1);
    expect(event.tier).toBe(3);
    expect(event.type).toBe("job.stdout");
    expect(event.level).toBe("warn");
    expect(event.sessionId).toBe("sess");
    expect(event.runId).toBe("run1");
    expect(event.planId).toBe("plan1");
    expect(event.text).toBe("hello");
    expect(event.data).toEqual({ line: "hello" });
    expect(typeof event.id).toBe("string");
    expect(typeof event.ts).toBe("number");
  });
});
