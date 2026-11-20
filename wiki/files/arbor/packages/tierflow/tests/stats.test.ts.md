# File: packages/tierflow/tests/stats.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/stats.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 4023 B |
| Lines | 110 |
| Hash | 78686503718a |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| summary | const | 14 | no | const summary = summarize(&quot;x&quot;, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); |
| ordered | const | 28 | no | const ordered = summarize(&quot;x&quot;, [1, 2, 3, 4, 5]); |
| shuffled | const | 29 | no | const shuffled = summarize(&quot;x&quot;, [3, 1, 5, 2, 4]); |
| summary | const | 36 | no | const summary = summarize(&quot;empty&quot;, []); |
| result | const | 47 | no | const result = compare( { name: &quot;a&quot;, values: [100, 102, 98, 101, 99] }, { name: &quot;b&quot;, values: [50, 52, 48, 51, 49] }, ); |
| result | const | 61 | no | const result = compare( { name: &quot;a&quot;, values: [50, 52, 48, 51, 49] }, { name: &quot;b&quot;, values: [100, 102, 98, 101, 99] }, ); |
| values | const | 71 | no | const values = [10, 12, 14, 11, 13]; |
| result | const | 72 | no | const result = compare({ name: &quot;a&quot;, values }, { name: &quot;b&quot;, values: [...values] }); |
| result | const | 80 | no | const result = compare( { name: &quot;a&quot;, values: [100, 101, 99, 100, 100] }, { name: &quot;b&quot;, values: [100, 101, 99, 100, 100.5] }, ); |
| result | const | 99 | no | const result = welch(summarize(&quot;a&quot;, [1]), summarize(&quot;b&quot;, [2])); |
| a | const | 106 | no | const a = summarize(&quot;a&quot;, [100, 102, 98, 101, 99]); |
| b | const | 107 | no | const b = summarize(&quot;b&quot;, [50, 52, 48, 51, 49]); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 9 | external |
| ../src/stats.ts | import | 10 | [packages/tierflow/src/stats.ts](../src/stats.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 111 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
