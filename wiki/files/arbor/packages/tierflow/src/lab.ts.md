# File: packages/tierflow/src/lab.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/lab.ts |
| Language | TypeScript |
| Kind | source |
| Size | 11047 B |
| Lines | 321 |
| Hash | cdeb4399c5f1 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LabVariant | interface | 26 | yes | export interface LabVariant { |
| LabScenario | interface | 34 | yes | export interface LabScenario { |
| SCENARIOS | const | 43 | yes | export const SCENARIOS: Readonly&lt;Record&lt;string, LabScenario&gt;&gt; = { |
| VariantRun | interface | 76 | yes | export interface VariantRun { |
| LabReport | interface | 87 | yes | export interface LabReport { |
| LabExperiment | interface | 101 | yes | export interface LabExperiment { |
| Lab | class | 110 | yes | export class Lab { |
| constructor | method | 115 | yes | constructor(input: { root: string; baseProgramDir: string }) { |
| run | method | 124 | yes | async run(experiment: LabExperiment): Promise&lt;LabReport&gt; { |
| scenario | const | 125 | no | const scenario = |
| repeat | const | 128 | no | const repeat = Math.min(20, Math.max(1, experiment.repeat ?? 3)); |
| id | const | 129 | no | const id = nextId(&quot;lab&quot;); |
| startedAt | const | 130 | no | const startedAt = Date.now(); |
| aSamples | const | 133 | no | const aSamples: number[] = []; |
| bSamples | const | 134 | no | const bSamples: number[] = []; |
| runsA | const | 135 | no | const runsA: VariantRun[] = []; |
| runsB | const | 136 | no | const runsB: VariantRun[] = []; |
| lastA | const | 141 | no | const lastA = runsA[runsA.length - 1]; |
| lastB | const | 142 | no | const lastB = runsB[runsB.length - 1]; |
| mergedA | const | 147 | no | const mergedA = this.#merge(experiment.a.name, runsA); |
| mergedB | const | 148 | no | const mergedB = this.#merge(experiment.b.name, runsB); |
| stats | const | 149 | no | const stats = compare( { name: experiment.a.name, values: aSamples }, { name: experiment.b.name, values: bSamples }, ); |
| report | const | 154 | no | const report: LabReport = { |
| samples | const | 173 | no | const samples = runs.flatMap((run) =&gt; [...run.samples]); |
| traces | const | 174 | no | const traces = runs.flatMap((run) =&gt; [...run.traces]); |
| dir | const | 188 | no | const dir = join(this.#root, &quot;runtime&quot;, &quot;lab&quot;, runId); |
| programDir | const | 189 | no | const programDir = join(dir, &quot;programs&quot;); |
| config | const | 193 | no | const config = parseConfig({ ...DEFAULT_CONFIG, ...(variant.config ?? {}) }); |
| staticConfig | const | 194 | no | const staticConfig = { get: () =&gt; config }; |
| bus | const | 195 | no | const bus = new EventBus(20_000); |
| traces | const | 196 | no | const traces = new TraceStore(100); |
| registry | const | 197 | no | const registry = new ProgramRegistry(programDir, bus, `lab_${runId}`); |
| executor | const | 198 | no | const executor = new Executor({ bus, sessionId: `lab_${runId}`, workRoot: dir, config: staticConfig, |
| router | const | 204 | no | const router = new Router({ bus, executor, registry, config: staticConfig, |
| agent | const | 213 | no | const agent = new Agent({ bus, router, traces, sessionId: `lab_${runId}` }); |
| wallStart | const | 215 | no | const wallStart = nowMs(); |
| samples | const | 216 | no | const samples: number[] = []; |
| error | variable | 217 | no | let error: string \| null = null; |
| events | variable | 218 | no | let events = 0; |
| turn | const | 223 | no | const turn = await agent.chat(intent); |
| wallMs | const | 236 | no | const wallMs = nowMs() - wallStart; |
| ms | const | 251 | no | const ms = Math.max(1, turn.totalMs ?? 1); |
| basePrograms | method | 267 | yes | async basePrograms(): Promise&lt;string[]&gt; { |
| runAndPersist | method | 276 | yes | async runAndPersist(experiment: LabExperiment): Promise&lt;{ report: LabReport; path: string }&gt; { |
| report | const | 277 | no | const report = await this.run(experiment); |
| dir | const | 278 | no | const dir = join(this.#root, &quot;lab&quot;, &quot;results&quot;); |
| path | const | 280 | no | const path = join(dir, `${report.id}-${report.scenario}.json`); |
| defaultExperiment | function | 299 | yes | export function defaultExperiment(): LabExperiment { |
| readProgramSources | function | 309 | yes | export async function readProgramSources(dir: string): Promise&lt;Record&lt;string, string&gt;&gt; { |
| out | const | 310 | no | const out: Record&lt;string, string&gt; = {}; |
| entries | const | 312 | no | const entries = await readdir(dir); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 14 | external |
| node:path | import | 15 | external |
| ./bus.ts | import | 16 | [packages/tierflow/src/bus.ts](./bus.ts.md) |
| ./config.ts | import | 17 | [packages/tierflow/src/config.ts](./config.ts.md) |
| ./registry.ts | import | 18 | [packages/tierflow/src/registry.ts](./registry.ts.md) |
| ./tier3/executor.ts | import | 19 | [packages/tierflow/src/tier3/executor.ts](./tier3/executor.ts.md) |
| ./tier2/router.ts | import | 20 | [packages/tierflow/src/tier2/router.ts](./tier2/router.ts.md) |
| ./tier1/agent.ts | import | 21 | [packages/tierflow/src/tier1/agent.ts](./tier1/agent.ts.md) |
| ./observability.ts | import | 22 | [packages/tierflow/src/observability.ts](./observability.ts.md) |
| ./stats.ts | import | 23 | [packages/tierflow/src/stats.ts](./stats.ts.md) |
| ./protocol.ts | import | 24 | [packages/tierflow/src/protocol.ts](./protocol.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/server.ts](./server.ts.md) | ./lab.ts |
| [packages/tierflow/tests/lab.test.ts](../tests/lab.test.ts.md) | ../src/lab.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * A/B lab — full-tier experimentation without touching the live server.
 *
 * Each variant gets its own isolated stack: its own bus, traces, program
 * directory, executor and router, sharing only the process and the workload.
 * That means a variant can reprogram Tier 2 (program files), retune Tier 3
 * (heartbeat/timeouts/injected delay) and change Tier-1-visible latency — all
 * in the same run — without the two variants contaminating each other.
 *
 * The lab is the thing subagents drive: it exposes the same seams the server
 * does, so an agent can interact with all three tiers programmatically.
 */

import { mkdir, readdir, readFile, writeFile, cp } from "node:fs/promises";
import { join } from "node:path";
import { EventBus } from "./bus.ts";
import { DEFAULT_CONFIG, parseConfig, type TierflowConfig } from "./config.ts";
import { ProgramRegistry } from "./registry.ts";
import { Executor } from "./tier3/executor.ts";
import { Router } from "./tier2/router.ts";
import { Agent } from "./tier1/agent.ts";
import { TraceStore, nowMs, type TraceSnapshot } from "./observability.ts";
import { compare, summarize, type AbResult, type VariantSummary } from "./stats.ts";
import { nextId } from "./protocol.ts";

export interface LabVariant {
  readonly name: string;
  /** Partial config override, merged over defaults. */
  readonly config?: Partial<TierflowConfig>;
  /** Extra/overriding Tier-2 programs written before the variant starts. */
  readonly programs?: Readonly<Record<string, string>>;
}

export interface LabScenario {
  readonly name: string;
  readonly description: string;
  /** Intent texts sent through Tier 1, in order. */
  readonly intents: readonly string[];
  /** Which metric decides the winner. */
  readonly metric: "latencyMs" | "throughput";
}

export const SCENARIOS: Readonly<Record<string, LabScenario>> = {
  chat: {
    name: "chat",
    description: "Tier-1 -> Tier-2 routing with no Tier-3 jobs (pure orchestration overhead).",
    intents: ["hello", "status", "what can you do", "still there", "describe the tiers"],
    metric: "latencyMs",
  },
  exec: {
    name: "exec",
    description: "One real Tier-3 process per intent; measures spawn + stream + teardown.",
    intents: ["!run bun --version", "!run node --version", "!run bun --version"],
    metric: "latencyMs",
  },
  inspect: {
    name: "inspect",
    description: "Four concurrent Tier-3 probes; measures fan-out and join cost.",
    intents: ["!inspect"],
    metric: "latencyMs",
  },
  sim: {
    name: "sim",
    description: "Synthetic Tier-3 load; measures sustained event throughput.",
    intents: ["!sim 2000 1"],
    metric: "throughput",
  },
  design: {
    name: "design",
    description: "Tier-2 hot reprogram: write a program, load it, execute it.",
    intents: ["!design ab-1 :: bun --version", "!design ab-2 :: node --version"],
    metric: "latencyMs",
  },
};

export interface VariantRun {
  readonly variant: string;
  readonly wallMs: number;
  readonly samples: readonly number[];
  readonly summary: VariantSummary;
```

_First 80 of 322 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
