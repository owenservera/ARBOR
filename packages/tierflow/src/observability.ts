/**
 * End-to-end observability.
 *
 * One trace per Tier-1 intent, with phase timestamps taken in a single clock
 * domain (`nowMs` = epoch ms + sub-millisecond fraction). That is what makes
 * later e2e optimization possible: you can attribute a regression to routing,
 * planning, spawn, first output, completion or browser render without guessing.
 *
 * Kept dependency-free and bounded in memory so it can run forever in the
 * experiment without becoming its own cost centre.
 */

export const PHASES = ["intent", "routed", "planned", "started", "firstOutput", "completed"] as const;
export type Phase = (typeof PHASES)[number];

export interface Trace {
  traceId: string;
  sessionId: string;
  intentId: string;
  planId: string | null;
  startedAt: number;
  endedAt: number | null;
  status: "live" | "ok" | "error";
  phases: Partial<Record<Phase, number>>;
  runs: string[];
}

export type TraceSnapshot = Trace & {
  /** Phase-to-phase deltas in ms, plus intent→completed total. */
  deltas: Partial<Record<Phase, number>>;
  totalMs: number | null;
};

/** Fractional epoch milliseconds: one clock for every tier and the trace. */
export function nowMs(): number {
  return performance.timeOrigin + performance.now();
}

export function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index] ?? 0;
}

export class TraceStore {
  #traces = new Map<string, Trace>();
  #capacity: number;
  #counters = { started: 0, completed: 0, errors: 0 };

  constructor(capacity = 500) {
    this.#capacity = capacity;
  }

  get counters() {
    return { ...this.#counters };
  }

  begin(input: { traceId: string; sessionId: string; intentId: string }): Trace {
    this.#counters.started += 1;
    const trace: Trace = {
      traceId: input.traceId,
      sessionId: input.sessionId,
      intentId: input.intentId,
      planId: null,
      startedAt: nowMs(),
      endedAt: null,
      status: "live",
      phases: { intent: nowMs() },
      runs: [],
    };
    this.#traces.set(trace.traceId, trace);
    this.#trim();
    return trace;
  }

  mark(traceId: string, phase: Phase): Trace | null {
    const trace = this.#traces.get(traceId);
    if (!trace) return null;
    if (trace.phases[phase] === undefined) trace.phases[phase] = nowMs();
    return trace;
  }

  attachPlan(traceId: string, planId: string, runIds: readonly string[]): Trace | null {
    const trace = this.#traces.get(traceId);
    if (!trace) return null;
    trace.planId = planId;
    for (const runId of runIds) if (!trace.runs.includes(runId)) trace.runs.push(runId);
    return trace;
  }

  end(traceId: string, status: "ok" | "error"): TraceSnapshot | null {
    const trace = this.#traces.get(traceId);
    if (!trace) return null;
    if (trace.phases.completed === undefined) trace.phases.completed = nowMs();
    trace.endedAt = trace.phases.completed;
    trace.status = status;
    if (status === "ok") this.#counters.completed += 1;
    else this.#counters.errors += 1;
    return toSnapshot(trace);
  }

  get(traceId: string): TraceSnapshot | null {
    const trace = this.#traces.get(traceId);
    return trace ? toSnapshot(trace) : null;
  }

  recent(limit = 100): TraceSnapshot[] {
    return [...this.#traces.values()].slice(-limit).map(toSnapshot);
  }

  /** Per-phase p50/p95/p99 over completed traces. Feeds `/metrics`. */
  stats(): Record<string, { p50: number; p95: number; p99: number; n: number }> {
    const buckets = new Map<string, number[]>();
    for (const trace of this.#traces.values()) {
      const snapshot = toSnapshot(trace);
      for (const [phase, delta] of Object.entries(snapshot.deltas)) {
        if (typeof delta !== "number") continue;
        const list = buckets.get(phase) ?? [];
        list.push(delta);
        buckets.set(phase, list);
      }
      if (snapshot.totalMs !== null) {
        const list = buckets.get("e2e") ?? [];
        list.push(snapshot.totalMs);
        buckets.set("e2e", list);
      }
    }
    const out: Record<string, { p50: number; p95: number; p99: number; n: number }> = {};
    for (const [phase, list] of buckets) {
      const sorted = [...list].sort((a, b) => a - b);
      out[phase] = {
        p50: round(percentile(sorted, 50)),
        p95: round(percentile(sorted, 95)),
        p99: round(percentile(sorted, 99)),
        n: sorted.length,
      };
    }
    return out;
  }

  #trim(): void {
    while (this.#traces.size > this.#capacity) {
      const oldest = this.#traces.keys().next().value;
      if (oldest === undefined) break;
      this.#traces.delete(oldest);
    }
  }
}

export function toSnapshot(trace: Trace): TraceSnapshot {
  const ordered = PHASES.filter((phase) => trace.phases[phase] !== undefined).map(
    (phase) => [phase, trace.phases[phase] as number] as const,
  );
  const deltas: Partial<Record<Phase, number>> = {};
  for (let i = 1; i < ordered.length; i += 1) {
    const previous = ordered[i - 1];
    const current = ordered[i];
    if (!previous || !current) continue;
    deltas[current[0]] = round(current[1] - previous[1]);
  }
  const first = trace.phases.intent;
  const last = trace.phases.completed;
  return {
    ...trace,
    deltas,
    totalMs: first !== undefined && last !== undefined ? round(last - first) : null,
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/* ------------------------------------------------------------------ */
/* Counters + Prometheus text exposition                               */
/* ------------------------------------------------------------------ */

export class Metrics {
  #counters = new Map<string, number>();
  #gauges = new Map<string, number>();

  inc(name: string, by = 1): void {
    this.#counters.set(name, (this.#counters.get(name) ?? 0) + by);
  }

  gauge(name: string, value: number): void {
    this.#gauges.set(name, value);
  }

  render(traces: TraceStore): string {
    const lines: string[] = [
      "# HELP tierflow_phase_ms Phase-to-phase latency in milliseconds.",
      "# TYPE tierflow_phase_ms gauge",
    ];
    for (const [phase, stat] of Object.entries(traces.stats())) {
      for (const q of ["p50", "p95", "p99"] as const) {
        lines.push(`tierflow_phase_ms{phase="${phase}",quantile="${q}"} ${stat[q]}`);
      }
      lines.push(`tierflow_phase_n{phase="${phase}"} ${stat.n}`);
    }
    lines.push("# TYPE tierflow_counter counter");
    for (const [name, value] of this.#counters) {
      lines.push(`tierflow_counter{name="${name}"} ${value}`);
    }
    lines.push("# TYPE tierflow_gauge gauge");
    for (const [name, value] of this.#gauges) {
      lines.push(`tierflow_gauge{name="${name}"} ${value}`);
    }
    return `${lines.join("\n")}\n`;
  }
}
