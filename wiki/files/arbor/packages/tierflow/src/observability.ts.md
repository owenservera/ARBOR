# File: packages/tierflow/src/observability.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/observability.ts |
| Language | TypeScript |
| Kind | source |
| Size | 7093 B |
| Lines | 211 |
| Hash | 7ee5c6842938 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PHASES | const | 13 | yes | export const PHASES = [&quot;intent&quot;, &quot;routed&quot;, &quot;planned&quot;, &quot;started&quot;, &quot;firstOutput&quot;, &quot;completed&quot;] as const; |
| Phase | type | 14 | yes | export type Phase = (typeof PHASES)[number]; |
| Trace | interface | 16 | yes | export interface Trace { |
| TraceSnapshot | type | 28 | yes | export type TraceSnapshot = Trace &amp; { |
| nowMs | function | 35 | yes | export function nowMs(): number { |
| percentile | function | 39 | yes | export function percentile(sorted: readonly number[], p: number): number { |
| index | const | 41 | no | const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)); |
| TraceStore | class | 45 | yes | export class TraceStore { |
| constructor | method | 50 | yes | constructor(capacity = 500) { |
| trace | const | 60 | no | const trace: Trace = { |
| mark | method | 76 | yes | mark(traceId: string, phase: Phase): Trace \| null { |
| trace | const | 77 | no | const trace = this.#traces.get(traceId); |
| attachPlan | method | 83 | yes | attachPlan(traceId: string, planId: string, runIds: readonly string[]): Trace \| null { |
| trace | const | 84 | no | const trace = this.#traces.get(traceId); |
| trace | const | 92 | no | const trace = this.#traces.get(traceId); |
| get | method | 102 | yes | get(traceId: string): TraceSnapshot \| null { |
| trace | const | 103 | no | const trace = this.#traces.get(traceId); |
| recent | method | 107 | yes | recent(limit = 100): TraceSnapshot[] { |
| stats | method | 112 | yes | stats(): Record&lt;string, { p50: number; p95: number; p99: number; n: number }&gt; { |
| buckets | const | 113 | no | const buckets = new Map&lt;string, number[]&gt;(); |
| snapshot | const | 115 | no | const snapshot = toSnapshot(trace); |
| list | const | 118 | no | const list = buckets.get(phase) ?? []; |
| list | const | 123 | no | const list = buckets.get(&quot;e2e&quot;) ?? []; |
| out | const | 128 | no | const out: Record&lt;string, { p50: number; p95: number; p99: number; n: number }&gt; = {}; |
| sorted | const | 130 | no | const sorted = [...list].sort((a, b) =&gt; a - b); |
| oldest | const | 143 | no | const oldest = this.#traces.keys().next().value; |
| toSnapshot | function | 150 | yes | export function toSnapshot(trace: Trace): TraceSnapshot { |
| ordered | const | 151 | no | const ordered = PHASES.filter((phase) =&gt; trace.phases[phase] !== undefined).map( (phase) =&gt; [phase, trace.phases[phase] as number] as const, ); |
| deltas | const | 154 | no | const deltas: Partial&lt;Record&lt;Phase, number&gt;&gt; = {}; |
| previous | const | 156 | no | const previous = ordered[i - 1]; |
| current | const | 157 | no | const current = ordered[i]; |
| first | const | 161 | no | const first = trace.phases.intent; |
| last | const | 162 | no | const last = trace.phases.completed; |
| round | function | 170 | no | function round(value: number): number { |
| Metrics | class | 178 | yes | export class Metrics { |
| inc | method | 182 | yes | inc(name: string, by = 1): void { |
| gauge | method | 186 | yes | gauge(name: string, value: number): void { |
| render | method | 190 | yes | render(traces: TraceStore): string { |
| lines | const | 191 | no | const lines: string[] = [ |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/cli.ts](./cli.ts.md) | ./observability.ts |
| [packages/tierflow/src/lab.ts](./lab.ts.md) | ./observability.ts |
| [packages/tierflow/src/protocol.ts](./protocol.ts.md) | ./observability.ts |
| [packages/tierflow/src/server.ts](./server.ts.md) | ./observability.ts |
| [packages/tierflow/src/tier1/agent.ts](./tier1/agent.ts.md) | ../observability.ts |
| [packages/tierflow/src/tier2/router.ts](./tier2/router.ts.md) | ../observability.ts |
| [packages/tierflow/tests/router.test.ts](../tests/router.test.ts.md) | ../src/observability.ts |
| [packages/tierflow/tests/tier-capability.test.ts](../tests/tier-capability.test.ts.md) | ../src/observability.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 212 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
