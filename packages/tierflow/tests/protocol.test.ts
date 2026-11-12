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
    expect(isBusEvent({ ...validEvent(), ts: "1700000000000" })).toBe(false);
  });

  test("nextId is unique and carries its prefix", () => {
    const a = nextId("evt");
    const b = nextId("evt");
    expect(a).not.toBe(b);
    expect(a.startsWith("evt_")).toBe(true);
    expect(b.startsWith("evt_")).toBe(true);
  });

  test("the event vocabulary carries the three counter-carrying types", () => {
    expect(BUS_EVENT_TYPES).toContain("intent.received");
    expect(BUS_EVENT_TYPES).toContain("plan.created");
    expect(BUS_EVENT_TYPES).toContain("job.started");
    expect(new Set(BUS_EVENT_TYPES).size).toBe(BUS_EVENT_TYPES.length);
  });
});
