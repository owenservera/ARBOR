import { expect, test } from "bun:test";
import { sum } from "../src/sum.ts";

test("sum adds two positive numbers", () => {
  expect(sum(2, 3)).toBe(5);
});

test("sum handles negatives and zero", () => {
  expect(sum(-4, 4)).toBe(0);
  expect(sum(0, 0)).toBe(0);
});
