import { expect, test } from "bun:test";
import { sum } from "../src/sum.ts";

// Deliberately wrong on purpose: this file exists so the executor can prove
// that a failing suite propagates as a non-zero exit code and a "failed"
// run state instead of being swallowed. It is never part of the default
// (green) suite: `bun run test:fail` targets it explicitly.
test("deliberate failure proves failure propagation", () => {
  expect(sum(2, 3)).toBe(6);
});
