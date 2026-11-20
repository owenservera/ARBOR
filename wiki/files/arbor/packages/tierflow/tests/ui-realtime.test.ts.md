# File: packages/tierflow/tests/ui-realtime.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/ui-realtime.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 7559 B |
| Lines | 205 |
| Hash | 003c39d6c9be |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fill | function | 15 | no | function fill(bus: EventBus, count: number): void { |
| seqs | function | 21 | no | function seqs(events: readonly { seq: number }[]): number[] { |
| generated | const | 29 | no | const generated = new ResumeEpoch(); |
| epoch | const | 37 | no | const epoch = new ResumeEpoch(&quot;proc-a&quot;); |
| session | const | 45 | no | const session = new RealtimeSession({ bus: new EventBus(8), epoch: new ResumeEpoch(&quot;proc-a&quot;) }); |
| bus | const | 52 | no | const bus = new EventBus(50); |
| session | const | 54 | no | const session = new RealtimeSession({ bus, epoch: new ResumeEpoch(&quot;proc-a&quot;) }); |
| resync | const | 56 | no | const resync = session.resume(null); |
| bus | const | 68 | no | const bus = new EventBus(500); |
| session | const | 70 | no | const session = new RealtimeSession({ bus, epoch: new ResumeEpoch(&quot;proc-a&quot;) }); |
| resync | const | 72 | no | const resync = session.resume(null); |
| bus | const | 80 | no | const bus = new EventBus(50); |
| session | const | 82 | no | const session = new RealtimeSession({ bus, epoch: new ResumeEpoch(&quot;proc-a&quot;) }); |
| resync | const | 84 | no | const resync = session.resume({ epoch: &quot;proc-a&quot;, seq: 2 }); |
| caughtUp | const | 91 | no | const caughtUp = session.resume({ epoch: &quot;proc-a&quot;, seq: 5 }); |
| bus | const | 97 | no | const bus = new EventBus(4); |
| session | const | 99 | no | const session = new RealtimeSession({ bus, epoch: new ResumeEpoch(&quot;proc-a&quot;) }); |
| resync | const | 102 | no | const resync = session.resume({ epoch: &quot;proc-a&quot;, seq: 1 }); |
| boundary | const | 110 | no | const boundary = session.resume({ epoch: &quot;proc-a&quot;, seq: 2 }); |
| bus | const | 116 | no | const bus = new EventBus(50); |
| session | const | 118 | no | const session = new RealtimeSession({ bus, epoch: new ResumeEpoch(&quot;proc-b&quot;) }); |
| resync | const | 120 | no | const resync = session.resume({ epoch: &quot;proc-a&quot;, seq: 3 }); |
| session | const | 129 | no | const session = new RealtimeSession({ bus: new EventBus(8), epoch: new ResumeEpoch(&quot;proc-a&quot;) }); |
| revision | variable | 135 | no | let revision = 12; |
| session | const | 136 | no | const session = new RealtimeSession({ bus: new EventBus(8), epoch: new ResumeEpoch(&quot;proc-a&quot;), revisionOf: () =&gt; revision, }); |
| bus | const | 147 | no | const bus = new EventBus(4); |
| session | const | 149 | no | const session = new RealtimeSession({ bus, epoch: new ResumeEpoch(&quot;proc-a&quot;) }); |
| fresh | const | 151 | no | const fresh = session.eventsSince(null); |
| resumed | const | 155 | no | const resumed = session.eventsSince({ epoch: &quot;proc-a&quot;, seq: 4 }); |
| rejected | const | 173 | no | const rejected: unknown[] = [ |
| hostile | const | 197 | no | const hostile = { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 11 | external |
| ../src/bus.ts | import | 12 | [packages/tierflow/src/bus.ts](../src/bus.ts.md) |
| ../src/ui/realtime.ts | import | 13 | [packages/tierflow/src/ui/realtime.ts](../src/ui/realtime.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 206 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
