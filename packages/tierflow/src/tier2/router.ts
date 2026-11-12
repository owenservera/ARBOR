/**
 * TIER 2 — orchestrator.
 *
 * Receives a normalized `Intent` from Tier 1, decides *policy* (which
 * hot-swappable program owns it), produces a `Plan`, dispatches to Tier 3,
 * reconciles results and narrates back. It holds no execution logic and no
 * conversational state: both belong to the neighbouring tiers.
 *
 * Reprogrammability contract: if a program in `runtime/programs/` matches the
 * intent, that program wins over every builtin. The builtins below are only
 * the floor — the system's behaviour is data on disk.
 */

import {
  PROTOCOL_VERSION,
  nextId,
  type BusEventType,
  type Intent,
  type JobSpec,
  type Level,
  type Plan,
  type RunMeta,
} from "../protocol.ts";
import type { EventBus } from "../bus.ts";
import { DENIED_EXEC, type CapabilityGate, type Executor } from "../tier3/executor.ts";
import type { ProgramRegistry } from "../registry.ts";
import type { ConfigLike } from "../config.ts";
import type { TraceStore } from "../observability.ts";
import type { Capability } from "../security.ts";

export interface RouterDeps {
  bus: EventBus;
  executor: Executor;
  registry: ProgramRegistry;
  config: ConfigLike;
  traces: TraceStore;
  sessionId: string;
  workRoot: string;
}

export interface TurnResult {
  readonly plan: Plan;
  readonly reply: string;
  readonly results: readonly RunMeta[];
}

const MAX_STEPS = 8;

export class Router {
  #deps: RouterDeps;
  #designed = 0;

  constructor(deps: RouterDeps) {
    this.#deps = deps;
  }

  async handle(intent: Intent, capabilities?: ReadonlySet<Capability>): Promise<TurnResult> {
    const { bus, registry, traces } = this.#deps;
    traces.mark(intent.traceId, "routed");
    bus.emit({
      tier: 2,
      type: "intent.routed",
      sessionId: intent.sessionId,
      text: `${intent.mode}: ${truncate(intent.text, 120)}`,
      data: { mode: intent.mode, chars: intent.text.length },
    });

    // 1. Explicit program override: "!use build ..." or a trigger match.
    const explicit = /^!use\s+([a-z0-9._-]+)\s*(.*)$/is.exec(intent.text);
    const program = explicit
      ? registry.find(explicit[1] ?? "")
      : registry.match(intent.text);

    const required: readonly Capability[] = program
      ? ["exec"]
      : intent.mode === "design"
        ? ["exec", "program.write"]
        : intent.mode === "run" || intent.mode === "maintain" || intent.mode === "inspect" || intent.mode === "simulate"
          ? ["exec"]
          : [];
    for (const capability of required) {
      if (capabilities && !capabilities.has(capability)) {
        return this.#deniedPlan(intent, capability);
      }
    }

    const gate: CapabilityGate | undefined = capabilities
      ? (capability) => capabilities.has(capability)
      : undefined;

    if (program) {
      const effective: Intent = explicit
        ? { ...intent, text: (explicit[2] ?? "").trim() || intent.text }
        : intent;
      const { steps, error } = await registry.run(program, effective);
      if (error) {
        return this.#failedPlan(intent, `program ${program.info.name} threw: ${error}`);
      }
      return this.#dispatch(
        intent,
        {
          rationale: `program ${program.info.name}@${program.info.version} (${program.info.hash})`,
          steps,
        },
        gate,
      );
    }

    // 2. Builtins — the floor behaviour when no program claims the intent.
    switch (intent.mode) {
      case "run":
        return this.#runBuiltin(intent, gate);
      case "design":
        return this.#designBuiltin(intent, gate);
      case "maintain":
        return this.#maintainBuiltin(intent);
      case "inspect":
        return this.#inspectBuiltin(intent, gate);
      case "simulate":
        return this.#simulateBuiltin(intent, gate);
      case "chat":
        return this.#chatBuiltin(intent);
    }
  }

  /* ------------------------------ builtins ------------------------------ */

  async #runBuiltin(intent: Intent, gate?: CapabilityGate): Promise<TurnResult> {
    const command = intent.text.replace(/^(!run|run)\s+/i, "").trim();
    if (command.length === 0) {
      return this.#textPlan(intent, "Nothing to run. Try `!run git status --short`.");
    }
    const argv = tokenize(command);
    if (argv.length === 0) return this.#textPlan(intent, "Could not parse that command.");
    return this.#dispatch(
      intent,
      {
        rationale: `builtin run · ${argv[0]}`,
        steps: [
          {
            id: nextId("job"),
            kind: "exec",
            label: truncate(command, 48),
            argv,
            timeoutMs: this.#deps.config.get().defaultTimeoutMs,
            restart: false,
            maxRestarts: 1,
          },
        ],
      },
      gate,
    );
  }

  /**
   * Design mode is the reprogrammability demo: Tier 1 text becomes a Tier-2
   * policy module on disk, the registry hot-loads it, and the freshly written
   * program immediately executes. No restart, no rebuild.
   */
  async #designBuiltin(intent: Intent, gate?: CapabilityGate): Promise<TurnResult> {
    const { registry, bus } = this.#deps;
    this.#designed += 1;
    const body = intent.text.replace(/^!design\s*/i, "").trim();
    const split = /^([a-z0-9._-]+)\s*::\s*(.+)$/is.exec(body);

    const name = split?.[1] ?? `designed-${this.#designed}`;
    const commandText = (split?.[2] ?? body) || "bun --version";
    const argv = tokenize(commandText);

    const source = `// ${name}.program.ts — generated by Tier 1 design mode at ${new Date().toISOString()}.
// Hot-swappable Tier-2 policy: edits apply to the next intent, no restart.
export const meta = {
  label: ${JSON.stringify(name)},
  triggers: [${JSON.stringify(name)}],
};

export default ({ job }) => [
  job({
    kind: "exec",
    label: ${JSON.stringify(truncate(commandText, 40))},
    argv: ${JSON.stringify(argv)},
    timeoutMs: 60000,
    restart: true,
    maxRestarts: 2,
  }),
];
`;
    const info = await registry.write(name, source);
    if (!info || info.error) {
      return this.#failedPlan(intent, `design rejected: ${info?.error ?? "unknown error"}`);
    }
    bus.emit({
      tier: 2,
      type: "program.loaded",
      sessionId: intent.sessionId,
      text: `${name}@${info.version} designed`,
      data: { program: name, version: info.version, hash: info.hash, designed: true },
    });

    const loaded = registry.find(name);
    if (!loaded) return this.#failedPlan(intent, `program ${name} disappeared after write`);
    const { steps, error } = await registry.run(loaded, { ...intent, text: commandText });
    if (error) return this.#failedPlan(intent, `designed program threw: ${error}`);

    const result = await this.#dispatch(
      intent,
      {
        rationale: `designed ${name}@${info.version} then executed it`,
        steps,
      },
      gate,
    );
    return { ...result, reply: `[designed ${name}@${info.version}] ${result.reply}` };
  }

  async #maintainBuiltin(intent: Intent): Promise<TurnResult> {
    const report = await this.#deps.executor.maintain();
    const reply =
      report.actions.length === 0
        ? `maintenance sweep clean · ${report.checked} runs checked · ${report.stalled} stalled`
        : `maintenance acted · ${report.actions.join(", ")}`;
    return this.#textPlan(intent, reply, "builtin maintenance sweep");
  }

  async #inspectBuiltin(intent: Intent, gate?: CapabilityGate): Promise<TurnResult> {
    const jobs: JobSpec[] = [
      ["bun", ["bun", "--version"]],
      ["node", ["node", "--version"]],
      ["cargo", ["cargo", "--version"]],
      ["git", ["git", "status", "--short"]],
    ].map(([label, argv]) => ({
      id: nextId("job"),
      kind: "probe" as const,
      label: String(label),
      argv: argv as string[],
      cwd: this.#deps.workRoot,
      timeoutMs: 15_000,
      restart: false,
      maxRestarts: 0,
    }));
    return this.#dispatch(intent, { rationale: "builtin inspect · 4 concurrent probes", steps: jobs }, gate);
  }

  async #simulateBuiltin(intent: Intent, gate?: CapabilityGate): Promise<TurnResult> {
    const numbers = intent.text.match(/\d+/g) ?? [];
    const rate = Number(numbers[0] ?? 2000);
    const seconds = Number(numbers[1] ?? 5);
    const spec: JobSpec = {
      id: nextId("job"),
      kind: "sim",
      label: `synthetic ${rate}/s × ${seconds}s`,
      argv: ["tierflow-sim", String(rate), String(seconds)],
      timeoutMs: (seconds + 5) * 1000,
      env: { rate: String(rate), seconds: String(seconds) },
    };
    return this.#dispatch(intent, { rationale: `builtin simulate · ${rate}/s for ${seconds}s`, steps: [spec] }, gate);
  }

  async #chatBuiltin(intent: Intent): Promise<TurnResult> {
    const { executor, registry } = this.#deps;
    const runs = executor.list();
    const live = runs.filter((r) => r.state === "running").length;
    const reply = [
      `Tier 2 ready. ${registry.size} programs loaded, ${live} live runs, ${runs.length} known.`,
      "`!run <cmd>` executes, `!design <name> :: <cmd>` rewrites orchestration and runs it,",
      "`!inspect` probes the host, `!maintain` sweeps runs, `!sim <rate> <seconds>` drives synthetic load.",
      "Edit `runtime/programs/*.program.ts` or `runtime/surface.json` and the change lands mid-session.",
    ].join(" ");
    return this.#textPlan(intent, reply, "builtin chat");
  }

  /* ------------------------------ plumbing ------------------------------ */

  #textPlan(intent: Intent, reply: string, rationale = "no-op"): TurnResult {
    const plan: Plan = {
      version: PROTOCOL_VERSION,
      id: nextId("plan"),
      intentId: intent.id,
      sessionId: intent.sessionId,
      rationale,
      steps: [],
      createdAt: Date.now(),
    };
    this.#emit("plan.created", plan, intent);
    this.#deps.traces.mark(intent.traceId, "planned");
    this.#deps.traces.mark(intent.traceId, "completed");
    this.#emit("plan.finished", plan, intent, reply);
    return { plan, reply, results: [] };
  }

  #failedPlan(intent: Intent, reason: string): TurnResult {
    this.#deps.bus.emit({
      tier: 2,
      type: "system.error",
      sessionId: intent.sessionId,
      level: "error",
      text: reason,
    });
    return this.#textPlan(intent, reason, "failed");
  }

  #deniedPlan(intent: Intent, capability: Capability): TurnResult {
    const reason = `denied: ${capability} capability required`;
    this.#deps.bus.emit({
      tier: 2,
      type: "system.error",
      sessionId: intent.sessionId,
      level: "error",
      text: reason,
      data: { capability },
    });
    return this.#textPlan(intent, reason, "denied");
  }

  async #dispatch(
    intent: Intent,
    input: { rationale: string; steps: readonly JobSpec[] },
    gate?: CapabilityGate,
  ): Promise<TurnResult> {
    const steps = input.steps.slice(0, MAX_STEPS);
    const plan: Plan = {
      version: PROTOCOL_VERSION,
      id: nextId("plan"),
      intentId: intent.id,
      sessionId: intent.sessionId,
      rationale: input.rationale,
      steps,
      createdAt: Date.now(),
    };
    this.#emit("plan.created", plan, intent, `${steps.length} step(s): ${input.rationale}`);
    this.#deps.traces.mark(intent.traceId, "planned");

    const inject = this.#deps.config.get().injectLatency.dispatchMs;
    if (inject > 0) await Bun.sleep(inject);

    const started = steps.map((step) => this.#deps.executor.start(step, gate));
    // Attach plan id to the live runs so the UI can group and trace them.
    for (const handle of started) {
      Object.assign(handle.meta, { planId: plan.id });
    }
    this.#deps.traces.attachPlan(
      intent.traceId,
      plan.id,
      started.map((handle) => handle.meta.runId),
    );
    this.#deps.traces.mark(intent.traceId, "started");

    const runIds = new Set(started.map((handle) => handle.meta.runId));
    let sawFirstOutput = false;
    const unsubscribe = this.#deps.bus.subscribe((event) => {
      if (sawFirstOutput) return;
      if (event.runId && runIds.has(event.runId) && event.type === "job.stdout") {
        sawFirstOutput = true;
        this.#deps.traces.mark(intent.traceId, "firstOutput");
      }
    });

    const results = await Promise.all(started.map((handle) => handle.done));
    unsubscribe();
    this.#deps.traces.mark(intent.traceId, "completed");
    const summary = results
      .map((run) => `${run.label}: ${run.state}${run.exitCode === null ? "" : ` (${run.exitCode})`}`)
      .join(" · ");
    this.#emit("plan.finished", plan, intent, summary || "plan finished", {
      ok: results.filter((r) => r.state === "succeeded").length,
      failed: results.filter((r) => r.state === "failed").length,
      cancelled: results.filter((r) => r.state === "cancelled").length,
    });
    return { plan, reply: summary || "plan finished with no steps", results };
  }

  #emit(
    type: BusEventType,
    plan: Plan,
    intent: Intent,
    text?: string,
    data?: Record<string, string | number | boolean | null>,
    level: Level = "info",
  ): void {
    this.#deps.bus.emit({
      tier: 2,
      type,
      sessionId: intent.sessionId,
      planId: plan.id,
      level,
      ...(text === undefined ? {} : { text }),
      data: { steps: plan.steps.length, rationale: plan.rationale, ...(data ?? {}) },
    });
  }
}

/* ------------------------------ utilities ------------------------------ */

/** Minimal argv tokenizer: honours single/double quotes, no shell expansion. */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let has = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i] as string;
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      has = true;
      continue;
    }
    if (/\s/.test(char)) {
      if (has || current.length > 0) {
        tokens.push(current);
        current = "";
        has = false;
      }
      continue;
    }
    current += char;
    has = true;
  }
  if (has || current.length > 0) tokens.push(current);
  return tokens;
}

export function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, Math.max(0, max - 1))}…`;
}
