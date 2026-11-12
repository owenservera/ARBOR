/**
 * Statistics contract tests.
 *
 * The lab decides "is B better?" from these numbers, so the exact values
 * matter: a wrong percentile or a sign flip in the winner would silently
 * recommend the slower variant.
 */

import { describe, expect, test } from "bun:test";
import { compare, summarize, twoSidedT, welch } from "../src/stats.ts";

describe("stats", () => {
  test("summarize computes exact mean, median and p95 for a known array", () => {
    const summary = summarize("x", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(summary.n).toBe(10);
    expect(summary.mean).toBe(5.5);
    // Upper median for an even sample count, as implemented.
    expect(summary.median).toBe(6);
    expect(summary.p95).toBe(10);
    expect(summary.min).toBe(1);
    expect(summary.max).toBe(10);
    // Sample stdev of 1..10: sqrt(82.5 / 9).
    expect(summary.stdev).toBeCloseTo(3.02765, 4);
    expect(summary.name).toBe("x");
  });

  test("summarize is order independent", () => {
    const ordered = summarize("x", [1, 2, 3, 4, 5]);
    const shuffled = summarize("x", [3, 1, 5, 2, 4]);
    expect(shuffled.mean).toBe(ordered.mean);
    expect(shuffled.median).toBe(ordered.median);
    expect(shuffled.p95).toBe(ordered.p95);
  });

  test("summarize handles an empty sample set", () => {
    const summary = summarize("empty", []);
    expect(summary.n).toBe(0);
    expect(summary.mean).toBe(0);
    expect(summary.median).toBe(0);
    expect(summary.p95).toBe(0);
    expect(summary.min).toBe(0);
    expect(summary.max).toBe(0);
    expect(summary.stdev).toBe(0);
  });

  test("compare detects a large clear difference and names B the winner", () => {
    const result = compare(
      { name: "a", values: [100, 102, 98, 101, 99] },
      { name: "b", values: [50, 52, 48, 51, 49] },
    );
    expect(result.winner).toBe("B");
    expect(result.deltaPct).toBeCloseTo(-50, 6);
    expect(result.pValue).toBeLessThan(0.05);
    expect(result.winRateB).toBe(1);
    expect(result.verdict).toContain("B wins");
    expect(result.a.mean).toBe(100);
    expect(result.b.mean).toBe(50);
  });

  test("compare names A the winner when A is smaller", () => {
    const result = compare(
      { name: "a", values: [50, 52, 48, 51, 49] },
      { name: "b", values: [100, 102, 98, 101, 99] },
    );
    expect(result.winner).toBe("A");
    expect(result.deltaPct).toBeCloseTo(100, 6);
    expect(result.winRateB).toBe(0);
  });

  test("compare returns inconclusive for identical arrays", () => {
    const values = [10, 12, 14, 11, 13];
    const result = compare({ name: "a", values }, { name: "b", values: [...values] });
    expect(result.winner).toBe("inconclusive");
    expect(result.deltaPct).toBe(0);
    expect(result.pValue).toBe(1);
    expect(result.verdict).toContain("inconclusive");
  });

  test("compare returns inconclusive for a negligible difference", () => {
    const result = compare(
      { name: "a", values: [100, 101, 99, 100, 100] },
      { name: "b", values: [100, 101, 99, 100, 100.5] },
    );
    expect(result.winner).toBe("inconclusive");
  });

  test("twoSidedT(0, 10) is 1", () => {
    expect(twoSidedT(0, 10)).toBe(1);
    expect(twoSidedT(0, 10)).toBeCloseTo(1, 10);
  });

  test("twoSidedT falls back to 1 for degenerate input", () => {
    expect(twoSidedT(Number.NaN, 10)).toBe(1);
    expect(twoSidedT(2, 0)).toBe(1);
    expect(twoSidedT(2, -1)).toBe(1);
  });

  test("welch returns a zero t-statistic for single-sample variants", () => {
    const result = welch(summarize("a", [1]), summarize("b", [2]));
    expect(result.t).toBe(0);
    expect(result.df).toBe(0);
    expect(result.pValue).toBe(1);
  });

  test("welch produces a symmetric t-statistic for swapped variants", () => {
    const a = summarize("a", [100, 102, 98, 101, 99]);
    const b = summarize("b", [50, 52, 48, 51, 49]);
    expect(welch(a, b).t).toBeCloseTo(-welch(b, a).t, 10);
  });
});
