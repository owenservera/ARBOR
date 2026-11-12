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
}

function betaIncomplete(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;
  // Lentz continued fraction.
  let f = 1;
  let c = 1;
  let d = 0;
  for (let i = 0; i <= 200; i += 1) {
    const m = Math.floor(i / 2);
    let numerator: number;
    if (i === 0) numerator = 1;
    else if (i % 2 === 0) numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    else numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 + numerator * d;
    if (Math.abs(d) < 1e-12) d = 1e-12;
    d = 1 / d;
    c = 1 + numerator / c;
    if (Math.abs(c) < 1e-12) c = 1e-12;
    const cd = c * d;
    f *= cd;
    if (Math.abs(1 - cd) < 1e-10) break;
  }
  const result = front * (f - 1);
  return a + 0.5 > 0 && x > (a + 1) / (a + b + 2)
    ? 1 - betaIncomplete(b, a, 1 - x)
    : clamp01(result);
}

function logGamma(z: number): number {
  const coefficients = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  const zz = z - 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < coefficients.length; i += 1) x += (coefficients[i] as number) / (zz + i + 1);
  const t = zz + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (zz + 0.5) * Math.log(t) - t + Math.log(x);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Percentile bootstrap CI on the difference of means. Deterministic seed. */
export function bootstrapDelta(a: number[], b: number[], iterations = 2000): [number, number] {
  if (a.length === 0 || b.length === 0) return [0, 0];
  let seed = 0x9e3779b9;
  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) % 1_000_000) / 1_000_000;
  };
  const deltas: number[] = [];
  for (let i = 0; i < iterations; i += 1) {
    const sampleA = resample(a, random);
    const sampleB = resample(b, random);
    deltas.push(mean(sampleB) - mean(sampleA));
  }
  deltas.sort((x, y) => x - y);
  return [
    deltas[Math.floor(iterations * 0.025)] ?? 0,
    deltas[Math.floor(iterations * 0.975) - 1] ?? 0,
  ];
}

function resample(values: number[], random: () => number): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i += 1) {
    out.push(values[Math.floor(random() * values.length)] as number);
  }
  return out;
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((s, v) => s + v, 0) / values.length;
}

export function compare(aInput: VariantSamples, bInput: VariantSamples): AbResult {
  const a = summarize(aInput.name, aInput.values);
  const b = summarize(bInput.name, bInput.values);
  const { t, df, pValue } = welch(a, b);
  const deltaPct = a.mean === 0 ? 0 : ((b.mean - a.mean) / a.mean) * 100;
  const ci95 = bootstrapDelta(aInput.values, bInput.values);

  let wins = 0;
  const paired = Math.min(aInput.values.length, bInput.values.length);
  for (let i = 0; i < paired; i += 1) {
    if ((bInput.values[i] as number) < (aInput.values[i] as number)) wins += 1;
  }
  const winRateB = paired === 0 ? 0 : wins / paired;

  const practicallyDifferent = Math.abs(deltaPct) >= 3;
  const significant = pValue < 0.05;
  const winner: AbResult["winner"] =
    significant && practicallyDifferent ? (deltaPct < 0 ? "B" : "A") : "inconclusive";

  const verdict =
    winner === "inconclusive"
      ? `inconclusive: Δ${deltaPct.toFixed(1)}% · p=${pValue.toFixed(3)} · win-rate B ${(winRateB * 100).toFixed(0)}%`
      : `${winner} wins by ${Math.abs(deltaPct).toFixed(1)}% · p=${pValue.toFixed(3)} · CI95 [${ci95[0].toFixed(2)}, ${ci95[1].toFixed(2)}] · win-rate B ${(winRateB * 100).toFixed(0)}%`;

  return { a, b, deltaPct, t, df, pValue, ci95, winRateB, winner, verdict };
}
