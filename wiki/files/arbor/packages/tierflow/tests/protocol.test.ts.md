# File: packages/tierflow/tests/protocol.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/protocol.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 3356 B |
| Lines | 98 |
| Hash | a70d3521f8b5 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| validEvent | function | 19 | no | function validEvent(): BusEvent { |
| broken | const | 73 | no | const broken = { ...validEvent() } as unknown as Record&lt;string, unknown&gt;; |
| a | const | 85 | no | const a = nextId(&quot;evt&quot;); |
| b | const | 86 | no | const b = nextId(&quot;evt&quot;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 10 | external |
| ../src/protocol.ts | import | 11 | [packages/tierflow/src/protocol.ts](../src/protocol.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Protocol contract tests.
 *
 * The protocol is the only thing every tier, the webapp and the Rust hot path
 * agree on. If `isBusEvent` accepts a malformed event, a bad line reaches the
 * sidecar and the UI silently loses a frame. These tests pin the accept rule
 * and every documented reject case.
 */

import { describe, expect, test } from "bun:test";
import {
  BUS_EVENT_TYPES,
  PROTOCOL_VERSION,
  isBusEvent,
  nextId,
  type BusEvent,
} from "../src/protocol.ts";

function validEvent(): BusEvent {
  return {
    version: PROTOCOL_VERSION,
    seq: 1,
    id: nextId("evt"),
    ts: Date.now(),
    tier: 2,
    type: "plan.created",
    level: "info",
    sessionId: "sess_test",
  };
}

describe("protocol", () => {
  test("accepts a valid bus event", () => {
    expect(isBusEvent(validEvent())).toBe(true);
  });

  test("accepts every documented tier and level combination", () => {
    for (const tier of [1, 2, 3] as const) {
      for (const level of ["debug", "info", "warn", "error"] as const) {
        expect(isBusEvent({ ...validEvent(), tier, level })).toBe(true);
      }
    }
  });

  test("rejects a wrong protocol version", () => {
    expect(isBusEvent({ ...validEvent(), version: 2 })).toBe(false);
    expect(isBusEvent({ ...validEvent(), version: 0 })).toBe(false);
    expect(isBusEvent({ ...validEvent(), version: "1" })).toBe(false);
    expect(isBusEvent({ ...validEvent(), version: undefined })).toBe(false);
  });

  test("rejects an unknown event type", () => {
    expect(isBusEvent({ ...validEvent(), type: "not.a.type" })).toBe(false);
    expect(isBusEvent({ ...validEvent(), type: "plan.created.v2" })).toBe(false);
    expect(isBusEvent({ ...validEvent(), type: "" })).toBe(false);
    expect(isBusEvent({ ...validEvent(), type: 42 })).toBe(false);
  });

  test("rejects a bad tier", () => {
    for (const tier of [0, 4, -1, 2.5, "2", null, undefined, {}]) {
      expect(isBusEvent({ ...validEvent(), tier })).toBe(false);
    }
  });

  test("rejects non-objects", () => {
    for (const value of [null, undefined, "event", 42, true, [], () => {}]) {
      expect(isBusEvent(value)).toBe(false);
    }
  });

  test("rejects events missing a required scalar field", () => {
    for (const key of ["seq", "id", "ts", "type", "sessionId", "tier"]) {
      const broken = { ...validEvent() } as unknown as Record<string, unknown>;
      delete broken[key];
      expect(isBusEvent(broken)).toBe(false);
    }
  });

  test("rejects a non-numeric seq and a non-numeric ts", () => {
    expect(isBusEvent({ ...validEvent(), seq: "1" })).toBe(false);
```

_First 80 of 99 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
