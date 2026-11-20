# File: packages/tierflow/src/stats.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/stats.ts |
| Language | TypeScript |
| Kind | source |
| Size | 7080 B |
| Lines | 190 |
| Hash | 051aa2720252 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| VariantSamples | interface | 10 | yes | export interface VariantSamples { |
| VariantSummary | interface | 16 | yes | export interface VariantSummary { |
| AbResult | interface | 27 | yes | export interface AbResult { |
| summarize | function | 47 | yes | export function summarize(name: string, values: number[]): VariantSummary { |
| sorted | const | 48 | no | const sorted = [...values].sort((x, y) =&gt; x - y); |
| n | const | 49 | no | const n = sorted.length; |
| mean | const | 50 | no | const mean = n === 0 ? 0 : sorted.reduce((sum, value) =&gt; sum + value, 0) / n; |
| variance | const | 51 | no | const variance = |
| welch | function | 66 | yes | export function welch(a: VariantSummary, b: VariantSummary): { t: number; df: number; pValue: number } { |
| va | const | 68 | no | const va = a.stdev ** 2 / a.n; |
| vb | const | 69 | no | const vb = b.stdev ** 2 / b.n; |
| denom | const | 70 | no | const denom = Math.sqrt(va + vb); |
| t | const | 71 | no | const t = denom === 0 ? 0 : (b.mean - a.mean) / denom; |
| df | const | 72 | no | const df = va + vb === 0 ? 0 : (va + vb) ** 2 / (va ** 2 / (a.n - 1) + vb ** 2 / (b.n - 1)); |
| twoSidedT | function | 77 | yes | export function twoSidedT(t: number, df: number): number { |
| x | const | 79 | no | const x = df / (df + t * t); |
| betaIncomplete | function | 83 | no | function betaIncomplete(a: number, b: number, x: number): number { |
| lbeta | const | 86 | no | const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b); |
| front | const | 87 | no | const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a; |
| f | variable | 89 | no | let f = 1; |
| c | variable | 90 | no | let c = 1; |
| d | variable | 91 | no | let d = 0; |
| m | const | 93 | no | const m = Math.floor(i / 2); |
| numerator | variable | 94 | no | let numerator: number; |
| cd | const | 103 | no | const cd = c * d; |
| result | const | 107 | no | const result = front * (f - 1); |
| logGamma | function | 113 | no | function logGamma(z: number): number { |
| coefficients | const | 114 | no | const coefficients = [ |
| zz | const | 119 | no | const zz = z - 1; |
| x | variable | 120 | no | let x = 0.99999999999980993; |
| t | const | 122 | no | const t = zz + coefficients.length - 0.5; |
| clamp01 | function | 126 | no | function clamp01(value: number): number { |
| bootstrapDelta | function | 131 | yes | export function bootstrapDelta(a: number[], b: number[], iterations = 2000): [number, number] { |
| seed | variable | 133 | no | let seed = 0x9e3779b9; |
| random | function | 134 | no | const random = () =&gt; { |
| deltas | const | 140 | no | const deltas: number[] = []; |
| sampleA | const | 142 | no | const sampleA = resample(a, random); |
| sampleB | const | 143 | no | const sampleB = resample(b, random); |
| resample | function | 153 | no | function resample(values: number[], random: () =&gt; number): number[] { |
| out | const | 154 | no | const out: number[] = []; |
| mean | function | 161 | no | function mean(values: number[]): number { |
| compare | function | 165 | yes | export function compare(aInput: VariantSamples, bInput: VariantSamples): AbResult { |
| a | const | 166 | no | const a = summarize(aInput.name, aInput.values); |
| b | const | 167 | no | const b = summarize(bInput.name, bInput.values); |
| deltaPct | const | 169 | no | const deltaPct = a.mean === 0 ? 0 : ((b.mean - a.mean) / a.mean) * 100; |
| ci95 | const | 170 | no | const ci95 = bootstrapDelta(aInput.values, bInput.values); |
| wins | variable | 172 | no | let wins = 0; |
| paired | const | 173 | no | const paired = Math.min(aInput.values.length, bInput.values.length); |
| winRateB | const | 177 | no | const winRateB = paired === 0 ? 0 : wins / paired; |
| practicallyDifferent | const | 179 | no | const practicallyDifferent = Math.abs(deltaPct) &gt;= 3; |
| significant | const | 180 | no | const significant = pValue &lt; 0.05; |
| winner | const | 181 | no | const winner: AbResult[&quot;winner&quot;] = |
| verdict | const | 184 | no | const verdict = |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/lab.ts](./lab.ts.md) | ./stats.ts |
| [packages/tierflow/tests/stats.test.ts](../tests/stats.test.ts.md) | ../src/stats.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * A/B statistics without dependencies.
 *
 * The lab compares two variants of the same three-tier pipeline on identical
 * workloads. What matters is not the mean (a single slow sample moves it), but
 * whether the difference survives repeat runs: Welch's t on the sample means,
 * a bootstrap CI on the delta, and a per-sample win rate.
 */

export interface VariantSamples {
  name: string;
  /** Per-repeat metric values (ms, or events/sec — caller decides units). */
  values: number[];
}

export interface VariantSummary {
  name: string;
  n: number;
  mean: number;
  median: number;
  p95: number;
  min: number;
  max: number;
  stdev: number;
}

export interface AbResult {
  a: VariantSummary;
  b: VariantSummary;
  /** (B.mean - A.mean) / A.mean * 100. Negative means B is faster. */
  deltaPct: number;
  /** Welch t statistic (unpaired). */
  t: number;
  /** Welch–Satterthwaite degrees of freedom. */
  df: number;
  /** Two-sided p-value from Student's t survival function. */
  pValue: number;
  /** 95% bootstrap CI on the mean delta (B - A). */
  ci95: [number, number];
  /** Fraction of paired repeats where B beat A (lower is better). */
  winRateB: number;
  /** 'B' | 'A' | 'inconclusive' at alpha=0.05 with a 3% practical threshold. */
  winner: "A" | "B" | "inconclusive";
  verdict: string;
}

export function summarize(name: string, values: number[]): VariantSummary {
  const sorted = [...values].sort((x, y) => x - y);
  const n = sorted.length;
  const mean = n === 0 ? 0 : sorted.reduce((sum, value) => sum + value, 0) / n;
  const variance =
    n < 2 ? 0 : sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1);
  return {
    name,
    n,
    mean,
    median: n === 0 ? 0 : (sorted[Math.floor(n / 2)] as number),
    p95: n === 0 ? 0 : (sorted[Math.min(n - 1, Math.ceil(n * 0.95) - 1)] as number),
    min: n === 0 ? 0 : (sorted[0] as number),
    max: n === 0 ? 0 : (sorted[n - 1] as number),
    stdev: Math.sqrt(variance),
  };
}

/** Welch's t-test. */
export function welch(a: VariantSummary, b: VariantSummary): { t: number; df: number; pValue: number } {
  if (a.n < 2 || b.n < 2) return { t: 0, df: 0, pValue: 1 };
  const va = a.stdev ** 2 / a.n;
  const vb = b.stdev ** 2 / b.n;
  const denom = Math.sqrt(va + vb);
  const t = denom === 0 ? 0 : (b.mean - a.mean) / denom;
  const df = va + vb === 0 ? 0 : (va + vb) ** 2 / (va ** 2 / (a.n - 1) + vb ** 2 / (b.n - 1));
  return { t, df, pValue: df > 0 ? twoSidedT(t, df) : 1 };
}

/** Two-sided p-value via the regularized incomplete beta function. */
export function twoSidedT(t: number, df: number): number {
  if (!Number.isFinite(t) || df <= 0) return 1;
  const x = df / (df + t * t);
  return clamp01(betaIncomplete(df / 2, 0.5, x));
```

_First 80 of 191 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
