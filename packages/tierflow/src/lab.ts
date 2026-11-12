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
  readonly traces: readonly TraceSnapshot[];
  readonly events: number;
  readonly runs: readonly { label: string; state: string; exitCode: number | null }[];
  readonly error: string | null;
}

export interface LabReport {
  readonly id: string;
  readonly experiment: string;
  readonly scenario: string;
  readonly metric: string;
  readonly repeat: number;
  readonly startedAt: number;
  readonly wallMs: number;
  readonly a: VariantRun;
  readonly b: VariantRun;
  readonly stats: AbResult;
  readonly verdict: string;
}

export interface LabExperiment {
  readonly name: string;
  readonly scenario: keyof typeof SCENARIOS | LabScenario;
  readonly a: LabVariant;
  readonly b: LabVariant;
  /** Repeats of the whole workload per variant. */
  readonly repeat?: number;
}

export class Lab {
  #root: string;
  #baseProgramDir: string;
  #reports: LabReport[] = [];

  constructor(input: { root: string; baseProgramDir: string }) {
    this.#root = input.root;
    this.#baseProgramDir = input.baseProgramDir;
  }

  get reports(): readonly LabReport[] {
    return this.#reports;
  }

  async run(experiment: LabExperiment): Promise<LabReport> {
    const scenario =
      typeof experiment.scenario === "string" ? SCENARIOS[experiment.scenario] : experiment.scenario;
    if (!scenario) throw new Error(`unknown scenario: ${String(experiment.scenario)}`);
    const repeat = Math.min(20, Math.max(1, experiment.repeat ?? 3));
    const id = nextId("lab");
    const startedAt = Date.now();

    // Interleave A/B per repeat: drift in machine state hits both variants.
    const aSamples: number[] = [];
    const bSamples: number[] = [];
    const runsA: VariantRun[] = [];
    const runsB: VariantRun[] = [];

    for (let i = 0; i < repeat; i += 1) {
      runsA.push(await this.#runVariant(experiment.a, scenario, `${id}-a-${i}`));
      runsB.push(await this.#runVariant(experiment.b, scenario, `${id}-b-${i}`));
      const lastA = runsA[runsA.length - 1];
      const lastB = runsB[runsB.length - 1];
      if (lastA) aSamples.push(...lastA.samples);
      if (lastB) bSamples.push(...lastB.samples);
    }

    const mergedA = this.#merge(experiment.a.name, runsA);
    const mergedB = this.#merge(experiment.b.name, runsB);
    const stats = compare(
      { name: experiment.a.name, values: aSamples },
      { name: experiment.b.name, values: bSamples },
    );

    const report: LabReport = {
      id,
      experiment: experiment.name,
      scenario: scenario.name,
      metric: scenario.metric,
      repeat,
      startedAt,
      wallMs: Date.now() - startedAt,
      a: mergedA,
      b: mergedB,
      stats,
      verdict: stats.verdict,
    };
    this.#reports.push(report);
    if (this.#reports.length > 25) this.#reports.shift();
    return report;
  }

  #merge(name: string, runs: VariantRun[]): VariantRun {
    const samples = runs.flatMap((run) => [...run.samples]);
    const traces = runs.flatMap((run) => [...run.traces]);
    return {
      variant: name,
      wallMs: runs.reduce((sum, run) => sum + run.wallMs, 0),
      samples,
      summary: summarize(name, samples),
      traces,
      events: runs.reduce((sum, run) => sum + run.events, 0),
      runs: runs.flatMap((run) => [...run.runs]),
      error: runs.find((run) => run.error)?.error ?? null,
    };
  }

  async #runVariant(variant: LabVariant, scenario: LabScenario, runId: string): Promise<VariantRun> {
    const dir = join(this.#root, "runtime", "lab", runId);
    const programDir = join(dir, "programs");
    await mkdir(programDir, { recursive: true });
    await this.#seedPrograms(programDir, variant.programs);

    const config = parseConfig({ ...DEFAULT_CONFIG, ...(variant.config ?? {}) });
    const staticConfig = { get: () => config };
    const bus = new EventBus(20_000);
    const traces = new TraceStore(100);
    const registry = new ProgramRegistry(programDir, bus, `lab_${runId}`);
    const executor = new Executor({
      bus,
      sessionId: `lab_${runId}`,
      workRoot: dir,
      config: staticConfig,
    });
    const router = new Router({
      bus,
      executor,
      registry,
      config: staticConfig,
      traces,
      sessionId: `lab_${runId}`,
      workRoot: dir,
    });
    const agent = new Agent({ bus, router, traces, sessionId: `lab_${runId}` });

    const wallStart = nowMs();
    const samples: number[] = [];
    let error: string | null = null;
    let events = 0;

    try {
      await registry.loadAll();
      for (const intent of scenario.intents) {
        const turn = await agent.chat(intent);
        if (turn.totalMs !== null) {
          samples.push(scenario.metric === "throughput" ? this.#throughput(turn) : turn.totalMs);
        }
      }
      events = bus.counters.events;
    } catch (caught) {
      error = (caught as Error).message;
    } finally {
      await executor.stopAll("lab-end");
      registry.close();
    }

    const wallMs = nowMs() - wallStart;
    return {
      variant: variant.name,
      wallMs,
      samples,
      summary: summarize(variant.name, samples),
      traces: traces.recent(50),
      events,
      runs: executor.list().map((run) => ({ label: run.label, state: run.state, exitCode: run.exitCode })),
      error,
    };
  }

  #throughput(turn: { totalMs: number | null }): number {
    // Synthetic runs: events/s over the traced wall time.
    const ms = Math.max(1, turn.totalMs ?? 1);
    return (2000 * 1000) / ms;
  }

  async #seedPrograms(target: string, overrides?: Readonly<Record<string, string>>): Promise<void> {
    try {
      await cp(this.#baseProgramDir, target, { recursive: true, force: true });
    } catch {
      // Base dir may be empty on a cold start.
    }
    for (const [name, source] of Object.entries(overrides ?? {})) {
      await writeFile(join(target, `${name}.program.ts`), source, "utf8");
    }
  }

  /** Read the base program dir so a lab CLI can show what will be inherited. */
  async basePrograms(): Promise<string[]> {
    try {
      return (await readdir(this.#baseProgramDir)).filter((entry) => entry.endsWith(".program.ts"));
    } catch {
      return [];
    }
  }

  /** Convenience for subagents: run, persist JSON evidence, return path. */
  async runAndPersist(experiment: LabExperiment): Promise<{ report: LabReport; path: string }> {
    const report = await this.run(experiment);
    const dir = join(this.#root, "lab", "results");
    await mkdir(dir, { recursive: true });
    const path = join(dir, `${report.id}-${report.scenario}.json`);
    await writeFile(
      path,
      JSON.stringify(
        {
          ...report,
          a: { ...report.a, traces: report.a.traces.slice(-10) },
          b: { ...report.b, traces: report.b.traces.slice(-10) },
        },
        null,
        2,
      ),
      "utf8",
    );
    return { report, path };
  }
}

/** Default A/B pair used to prove the lab works: coarse vs fine heartbeat. */
export function defaultExperiment(): LabExperiment {
  return {
    name: "heartbeat-cadence",
    scenario: "exec",
    repeat: 3,
    a: { name: "a-fast-heartbeat", config: { heartbeatMs: 100, wsFlushMs: 0 } },
    b: { name: "b-slow-heartbeat", config: { heartbeatMs: 900, wsFlushMs: 32 } },
  };
}

export async function readProgramSources(dir: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  try {
    const entries = await readdir(dir);
    for (const entry of entries) {
      if (!entry.endsWith(".program.ts")) continue;
      out[entry.replace(/\.program\.ts$/, "")] = await readFile(join(dir, entry), "utf8");
    }
  } catch {
    // Empty dir is valid.
  }
  return out;
}
