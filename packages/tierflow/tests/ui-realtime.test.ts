/**
 * Realtime resume contract tests.
 *
 * The failure this guards against is silent: `EventBus.since` returns an empty
 * array both for a caught-up client and for a cursor that has fallen out of the
 * ring. A resume cursor therefore has to carry a process epoch and a gap must be
 * reported explicitly, otherwise a reconnecting browser quietly renders stale
 * state forever.
 */

import { describe, expect, test } from "bun:test";
import { EventBus } from "../src/bus.ts";
import { parseCursor, RealtimeSession, ResumeEpoch } from "../src/ui/realtime.ts";

function fill(bus: EventBus, count: number): void {
  for (let i = 0; i < count; i += 1) {
    bus.emit({ tier: 1, type: "system.note", sessionId: "s" });
  }
}

function seqs(events: readonly { seq: number }[]): number[] {
  return events.map((event) => event.seq);
}

describe("ResumeEpoch", () => {
  test("honours a supplied id and generates a distinct one otherwise", () => {
    expect(new ResumeEpoch("proc-a").id).toBe("proc-a");

    const generated = new ResumeEpoch();
    expect(generated.id.length).toBeGreaterThan(0);
    expect(new ResumeEpoch().id).not.toBe(generated.id);

    expect(new ResumeEpoch("").id.length).toBeGreaterThan(0);
  });

  test("matches only its own epoch", () => {
    const epoch = new ResumeEpoch("proc-a");
    expect(epoch.matches({ epoch: "proc-a" })).toBe(true);
    expect(epoch.matches({ epoch: "proc-b" })).toBe(false);
  });
});

describe("RealtimeSession", () => {
  test("a fresh session reports its epoch and zero seq", () => {
    const session = new RealtimeSession({ bus: new EventBus(8), epoch: new ResumeEpoch("proc-a") });
    expect(session.epoch).toBe("proc-a");
    expect(session.latestSeq).toBe(0);
    expect(session.oldestSeq).toBe(0);
  });

  test("resume with a null cursor returns recent events and gap false", () => {
    const bus = new EventBus(50);
    fill(bus, 3);
    const session = new RealtimeSession({ bus, epoch: new ResumeEpoch("proc-a") });

    const resync = session.resume(null);
    expect(resync.gap).toBe(false);
    expect(resync.epoch).toBe("proc-a");
    expect(resync.oldestSeq).toBe(1);
    expect(resync.latestSeq).toBe(3);
    expect(resync.revision).toBe(0);
    expect(seqs(resync.events)).toEqual([1, 2, 3]);

    expect(seqs(session.resume(undefined).events)).toEqual([1, 2, 3]);
  });

  test("the no-cursor window is capped at 200 events", () => {
    const bus = new EventBus(500);
    fill(bus, 250);
    const session = new RealtimeSession({ bus, epoch: new ResumeEpoch("proc-a") });

    const resync = session.resume(null);
    expect(resync.events.length).toBe(200);
    expect(resync.events[0]?.seq).toBe(51);
    expect(resync.events.at(-1)?.seq).toBe(250);
    expect(resync.gap).toBe(false);
  });

  test("resume with a matching epoch replays only events after the cursor", () => {
    const bus = new EventBus(50);
    fill(bus, 5);
    const session = new RealtimeSession({ bus, epoch: new ResumeEpoch("proc-a") });

    const resync = session.resume({ epoch: "proc-a", seq: 2 });
    expect(resync.gap).toBe(false);
    expect(resync.epoch).toBe("proc-a");
    expect(resync.oldestSeq).toBe(1);
    expect(resync.latestSeq).toBe(5);
    expect(seqs(resync.events)).toEqual([3, 4, 5]);

    const caughtUp = session.resume({ epoch: "proc-a", seq: 5 });
    expect(caughtUp.gap).toBe(false);
    expect(caughtUp.events).toEqual([]);
  });

  test("resume from a cursor older than the retained window reports a gap", () => {
    const bus = new EventBus(4);
    fill(bus, 6);
    const session = new RealtimeSession({ bus, epoch: new ResumeEpoch("proc-a") });
    expect(bus.oldestSeq).toBe(3);

    const resync = session.resume({ epoch: "proc-a", seq: 1 });
    expect(resync.gap).toBe(true);
    expect(resync.events).toEqual([]);
    expect(resync.epoch).toBe("proc-a");
    expect(resync.oldestSeq).toBe(3);
    expect(resync.latestSeq).toBe(6);

    // Boundary: worst-case cursor that is still contiguous with the ring.
    const boundary = session.resume({ epoch: "proc-a", seq: 2 });
    expect(boundary.gap).toBe(false);
    expect(seqs(boundary.events)).toEqual([3, 4, 5, 6]);
  });

  test("resume with a different epoch reports a gap and no events", () => {
    const bus = new EventBus(50);
    fill(bus, 4);
    const session = new RealtimeSession({ bus, epoch: new ResumeEpoch("proc-b") });

    const resync = session.resume({ epoch: "proc-a", seq: 3 });
    expect(resync.gap).toBe(true);
    expect(resync.events).toEqual([]);
    expect(resync.epoch).toBe("proc-b");
    expect(resync.oldestSeq).toBe(1);
    expect(resync.latestSeq).toBe(4);
  });

  test("cursorOf produces a cursor whose epoch matches the session", () => {
    const session = new RealtimeSession({ bus: new EventBus(8), epoch: new ResumeEpoch("proc-a") });
    expect(session.cursorOf(7)).toEqual({ epoch: "proc-a", seq: 7 });
    expect(session.cursorOf(0).epoch).toBe(session.epoch);
  });

  test("revisionOf supplies the current revision on every resume", () => {
    let revision = 12;
    const session = new RealtimeSession({
      bus: new EventBus(8),
      epoch: new ResumeEpoch("proc-a"),
      revisionOf: () => revision,
    });
    expect(session.resume(null).revision).toBe(12);
    revision = 13;
    expect(session.resume({ epoch: "proc-a", seq: 0 }).revision).toBe(13);
  });

  test("eventsSince applies the same gap rules without a revision field", () => {
    const bus = new EventBus(4);
    fill(bus, 6);
    const session = new RealtimeSession({ bus, epoch: new ResumeEpoch("proc-a") });

    const fresh = session.eventsSince(null);
    expect(fresh.gap).toBe(false);
    expect(seqs(fresh.events)).toEqual([3, 4, 5, 6]);

    const resumed = session.eventsSince({ epoch: "proc-a", seq: 4 });
    expect(resumed.gap).toBe(false);
    expect(seqs(resumed.events)).toEqual([5, 6]);

    expect(session.eventsSince({ epoch: "proc-a", seq: 1 })).toEqual({ gap: true, events: [] });
    expect(session.eventsSince({ epoch: "proc-other", seq: 5 })).toEqual({ gap: true, events: [] });
  });
});

describe("parseCursor", () => {
  test("accepts a well-formed cursor", () => {
    expect(parseCursor({ epoch: "proc-a", seq: 0 })).toEqual({ epoch: "proc-a", seq: 0 });
    expect(parseCursor({ epoch: "proc-a", seq: 42 })).toEqual({ epoch: "proc-a", seq: 42 });
    // Extra properties are ignored, not rejected.
    expect(parseCursor({ epoch: "proc-a", seq: 7, gap: true })).toEqual({ epoch: "proc-a", seq: 7 });
  });

  test("returns null for every malformed cursor", () => {
    const rejected: unknown[] = [
      null,
      undefined,
      "cursor",
      42,
      {},
      { seq: 1 },
      { epoch: "proc-a" },
      { epoch: 7, seq: 1 },
      { epoch: "", seq: 1 },
      { epoch: "proc-a", seq: -1 },
      { epoch: "proc-a", seq: 1.5 },
      { epoch: "proc-a", seq: Number.NaN },
      { epoch: "proc-a", seq: Number.POSITIVE_INFINITY },
      { epoch: "proc-a", seq: "1" },
      { cursor: { epoch: "proc-a", seq: 1 } },
      [],
    ];
    for (const input of rejected) {
      expect(parseCursor(input)).toBeNull();
    }
  });

  test("never throws on hostile objects", () => {
    const hostile = {
      get epoch(): string {
        throw new Error("boom");
      },
      seq: 1,
    };
    expect(parseCursor(hostile)).toBeNull();
  });
});
