/**
 * TIER 3 — realtime program execution, design and maintenance.
 *
 * Responsibilities:
 *  - spawn a `JobSpec` without a shell (argv only),
 *  - stream stdout/stderr as line events in realtime,
 *  - heartbeat every run so the UI can tell "working" from "hung",
 *  - enforce timeouts and honour cancellation (process tree on Windows),
 *  - apply the maintenance policy Tier 2 attaches to a job (restart budget),
 *  - sweep health on demand and repair what is repairable.
 *
 * Nothing here knows about intent text or plans. Tier 3 is a runtime, not an agent.
 */

import { nextId, type BusEventType, type JobSpec, type Level, type RunMeta, type RunState } from "../protocol.ts";
import type { EventBus } from "../bus.ts";
import type { ConfigLike } from "../config.ts";
import type { Capability } from "../security.ts";

const KILL_GRACE_MS = 1500;
const MAX_LINE = 8_192;

export const DENIED_EXEC = "denied: exec capability required";

/** Capability gate: true when the caller may use `capability`. */
export type CapabilityGate = (capability: Capability) => boolean;

const ALLOW_ALL: CapabilityGate = () => true;

export interface RunHandle {
  readonly meta: RunMeta;
  readonly done: Promise<RunMeta>;
  readonly stop: (reason?: string) => Promise<RunMeta>;
}

export interface ExecutorOptions {
  readonly bus: EventBus;
  readonly sessionId: string;
  /** Root where script jobs are written; created on demand. */
  readonly workRoot: string;
  /** Latency knobs (heartbeat, timeouts, injected delay) are read per operation. */
  readonly config: ConfigLike;
  readonly onMeta?: (meta: RunMeta) => void;
  /** Final backstop before any spawn. Default: allow every capability. */
  readonly authorize?: CapabilityGate;
}

type ActiveRun = {
  handle: RunHandle;
  child: ReturnType<typeof Bun.spawn> | null;
  spec: JobSpec;
  timedOut: boolean;
  cancelled: boolean;
  restarts: number;
  resolve: (meta: RunMeta) => void;
  lastLineAt: number;
  timer: ReturnType<typeof setInterval> | null;
  timeoutTimer: ReturnType<typeof setTimeout> | null;
};

export class Executor {
  #bus: EventBus;
  #sessionId: string;
  #config: ConfigLike;
  #onMeta: ExecutorOptions["onMeta"];
  #authorize: CapabilityGate;
  #runs = new Map<string, ActiveRun>();
  #finished = new Map<string, RunMeta>();
  #counter = 0;

  constructor(options: ExecutorOptions) {
    this.#bus = options.bus;
    this.#sessionId = options.sessionId;
    this.#config = options.config;
    this.#onMeta = options.onMeta;
    this.#authorize = options.authorize ?? ALLOW_ALL;
  }

  get activeCount(): number {
    return this.#runs.size;
  }

  list(): RunMeta[] {
    const live = [...this.#runs.values()].map((run) => run.handle.meta);
    const done = [...this.#finished.values()];
    return [...live, ...done].sort((a, b) => b.startedAt - a.startedAt);
  }

  state(runId: string): RunMeta | null {
    return this.#runs.get(runId)?.handle.meta ?? this.#finished.get(runId) ?? null;
  }

  /** Start a job. Returns immediately with a handle whose `done` settles later. */
  start(spec: JobSpec, authorize?: CapabilityGate): RunHandle {
    const gate = authorize ?? this.#authorize;
    if (!gate("exec")) return this.#deny(spec);

    this.#counter += 1;
    const runId = nextId(`run${this.#counter}`);
    const config = this.#config.get();
    const effective: JobSpec =
      spec.timeoutMs > 0 ? spec : { ...spec, timeoutMs: config.defaultTimeoutMs };

    let resolveDone: (meta: RunMeta) => void = () => {};
    const done = new Promise<RunMeta>((resolve) => {
      resolveDone = resolve;
    });

    const meta: RunMeta = {
      runId,
      jobId: effective.id,
      planId: "",
      sessionId: this.#sessionId,
      label: effective.label,
      kind: effective.kind,
      argv: [...effective.argv],
      state: "queued",
      startedAt: Date.now(),
      endedAt: null,
      exitCode: null,
      stdoutLines: 0,
      stderrLines: 0,
      restarts: 0,
      lastOutputAt: null,
    };

    const active: ActiveRun = {
      handle: { meta, done, stop: async () => this.#stop(runId, "operator") },
      child: null,
      spec: effective,
      timedOut: false,
      cancelled: false,
      restarts: 0,
      resolve: resolveDone,
      lastLineAt: Date.now(),
      timer: null,
      timeoutTimer: null,
    };
    this.#runs.set(runId, active);

    this.#emit("job.queued", runId, `queued ${effective.label}`, {
      argv: effective.argv.join(" "),
      kind: effective.kind,
    });

    if (this.#runs.size > config.maxConcurrentRuns) {
      this.#emit("system.error", runId, `concurrency cap ${config.maxConcurrentRuns} reached`, {
        level: "warn",
        live: this.#runs.size,
      });
      this.#finish(active, "cancelled", null);
      return active.handle;
    }

    queueMicrotask(() => {
      void this.#spawn(active);
    });
    return active.handle;
  }

  #deny(spec: JobSpec): RunHandle {
    this.#counter += 1;
    const runId = nextId(`run${this.#counter}`);
    const meta: RunMeta = {
      runId,
      jobId: spec.id,
      planId: "",
      sessionId: this.#sessionId,
      label: spec.label,
      kind: spec.kind,
      argv: [...spec.argv],
      state: "failed",
      startedAt: Date.now(),
      endedAt: Date.now(),
      exitCode: null,
      stdoutLines: 0,
      stderrLines: 0,
      restarts: 0,
      lastOutputAt: null,
    };
    Object.assign(meta, { error: DENIED_EXEC });
    this.#finished.set(runId, meta);
    this.#emit("system.error", runId, DENIED_EXEC, { level: "error", capability: "exec" });
    return { meta, done: Promise.resolve(meta), stop: async () => meta };
  }

  async #spawn(active: ActiveRun): Promise<void> {
    const { spec } = active;
    const { runId } = active.handle.meta;
    const config = this.#config.get();

    if (config.injectLatency.spawnMs > 0) await Bun.sleep(config.injectLatency.spawnMs);

    this.#patchMeta(active, { state: "running" });
    this.#emit("job.started", runId, spec.argv.join(" "), {
      cwd: spec.cwd ?? process.cwd(),
      restart: active.restarts,
      heartbeatMs: config.heartbeatMs,
    });

    if (spec.kind === "sim") {
      await this.#runSynthetic(active);
      return;
    }

    let child: ReturnType<typeof Bun.spawn>;
    try {
      child = Bun.spawn({
        cmd: [...spec.argv],
        cwd: spec.cwd ?? process.cwd(),
        env: { ...process.env, ...(spec.env ?? {}) },
        stdout: "pipe",
        stderr: "pipe",
        stdin: "ignore",
        windowsHide: true,
      });
    } catch (error) {
      this.#emit("system.error", runId, `spawn failed: ${(error as Error).message}`, { level: "error" });
      this.#finish(active, "failed", null);
      return;
    }

    active.child = child;
    active.lastLineAt = Date.now();

    active.timer = setInterval(() => this.#heartbeat(active), config.heartbeatMs);

    if (spec.timeoutMs > 0) {
      active.timeoutTimer = setTimeout(() => {
        active.timedOut = true;
        this.#emit("job.timeout", runId, `timeout after ${spec.timeoutMs}ms`, { timeoutMs: spec.timeoutMs });
        void this.#kill(active);
      }, spec.timeoutMs);
    }

    const stdoutTask = this.#pump(child.stdout as ReadableStream<Uint8Array>, active, "job.stdout");
    const stderrTask = this.#pump(child.stderr as ReadableStream<Uint8Array>, active, "job.stderr");

    let exitCode: number | null = null;
    try {
      exitCode = await child.exited;
    } catch {
      exitCode = null;
    }
    await Promise.allSettled([stdoutTask, stderrTask]);

    if (active.timer) clearInterval(active.timer);
    if (active.timeoutTimer) clearTimeout(active.timeoutTimer);

    const state: RunState = active.cancelled
      ? "cancelled"
      : active.timedOut
        ? "timed_out"
        : exitCode === 0
          ? "succeeded"
          : "failed";

    this.#emit("job.exit", runId, `exit=${exitCode ?? "?"} state=${state}`, {
      exitCode: exitCode ?? -1,
      state,
      level: state === "succeeded" ? "info" : "warn",
    });

    // Maintenance policy: restart budget is enforced here, not in Tier 2.
    const canRestart =
      state === "failed" && spec.restart === true && active.restarts < (spec.maxRestarts ?? 1);

    if (canRestart) {
      active.restarts += 1;
      this.#patchMeta(active, { state: "running", restarts: active.restarts });
      this.#emit("job.restart", runId, `restart ${active.restarts}/${spec.maxRestarts ?? 1}`, {
        attempt: active.restarts,
      });
      await new Promise((resolve) => setTimeout(resolve, 250));
      await this.#spawn(active);
      return;
    }

    this.#finish(active, state, exitCode);
  }

  /**
   * Synthetic run: a real Tier-3 run with real line/heartbeat/state events,
   * but generated in-process instead of spawned. It exists to stress the
   * event pipeline (and the Rust aggregator) without depending on external IO.
   */
  async #runSynthetic(active: ActiveRun): Promise<void> {
    const rawRate = Number(active.spec.env?.["rate"] ?? 200);
    const rawSeconds = Number(active.spec.env?.["seconds"] ?? 5);
    const rate = Math.min(100_000, Math.max(1, Number.isFinite(rawRate) ? rawRate : 200));
    const seconds = Math.min(120, Math.max(0.2, Number.isFinite(rawSeconds) ? rawSeconds : 5));
    const durationMs = seconds * 1000;
    const config = this.#config.get();
    const tickMs = config.simTickMs;
    const perTick = Math.max(1, Math.round((rate * tickMs) / 1000));
    const started = Date.now();
    const { runId } = active.handle.meta;

    active.timer = setInterval(() => this.#heartbeat(active), config.heartbeatMs);

    while (Date.now() - started < durationMs && !active.cancelled) {
      for (let i = 0; i < perTick; i += 1) {
        const roll = Math.random();
        const line = `sim +${Date.now() - started}ms n=${i} v=${(Math.random() * 1000).toFixed(2)}`;
        if (roll < 0.7) this.#line(active, "job.stdout", line);
        else if (roll < 0.82) this.#emit("intent.routed", runId, "synthetic route", { synthetic: 1 });
        else if (roll < 0.92) this.#emit("system.note", undefined, "synthetic note", { synthetic: 1 });
        else this.#emit("job.heartbeat", runId, null, { idleMs: 0, synthetic: 1 });
      }
      await Bun.sleep(tickMs);
    }

    if (active.timer) clearInterval(active.timer);
    this.#emit("job.exit", runId, `synthetic complete rate=${rate}/s`, {
      exitCode: 0,
      rate,
      seconds,
      state: "succeeded",
    });
    this.#finish(active, active.cancelled ? "cancelled" : "succeeded", 0);
  }

  async #pump(
    stream: ReadableStream<Uint8Array>,
    active: ActiveRun,
    type: "job.stdout" | "job.stderr",
  ): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = "";
    const injected = this.#config.get().injectLatency.firstOutputMs;
    if (type === "job.stdout" && injected > 0) await Bun.sleep(injected);
    try {
      for await (const chunk of stream) {
        buffer += decoder.decode(chunk, { stream: true });
        let newline = buffer.indexOf("\n");
        while (newline !== -1) {
          const line = buffer.slice(0, newline).replace(/\r$/, "");
          buffer = buffer.slice(newline + 1);
          this.#line(active, type, line);
          newline = buffer.indexOf("\n");
        }
        if (buffer.length > MAX_LINE) {
          this.#line(active, type, buffer.slice(0, MAX_LINE) + "…");
          buffer = "";
        }
      }
      if (buffer.length > 0) this.#line(active, type, buffer);
    } catch {
      // Stream closed underneath us (cancel/kill): the exit path owns the state.
    }
  }

  #line(active: ActiveRun, type: "job.stdout" | "job.stderr", line: string): void {
    if (line.length === 0) return;
    const { runId } = active.handle.meta;
    active.lastLineAt = Date.now();
    const isErr = type === "job.stderr";
    this.#patchMeta(active, {
      stdoutLines: active.handle.meta.stdoutLines + (isErr ? 0 : 1),
      stderrLines: active.handle.meta.stderrLines + (isErr ? 1 : 0),
      lastOutputAt: active.lastLineAt,
    });
    this.#emit(type, runId, line.slice(0, 2000), {
      line: line.slice(0, 2000),
      level: isErr ? "warn" : "info",
    });
  }

  #heartbeat(active: ActiveRun): void {
    const { runId } = active.handle.meta;
    const idleMs = Date.now() - active.lastLineAt;
    this.#emit("job.heartbeat", runId, null, {
      idleMs,
      runningMs: Date.now() - active.handle.meta.startedAt,
      pid: active.child?.pid ?? -1,
      stalled: idleMs > this.#config.get().heartbeatMs * 5,
    });
  }

  #patchMeta(active: ActiveRun, patch: Partial<RunMeta>): void {
    Object.assign(active.handle.meta, patch);
    this.#onMeta?.(active.handle.meta);
  }

  #finish(active: ActiveRun, state: RunState, exitCode: number | null): void {
    const meta = active.handle.meta;
    if (this.#runs.has(meta.runId)) this.#runs.delete(meta.runId);
    const final: RunMeta = {
      ...meta,
      state,
      exitCode: exitCode ?? null,
      endedAt: Date.now(),
    };
    Object.assign(meta, final);
    this.#finished.set(meta.runId, final);
    if (this.#finished.size > this.#config.get().runRetention) {
      const oldest = [...this.#finished.values()].sort((a, b) => a.startedAt - b.startedAt)[0];
      if (oldest) this.#finished.delete(oldest.runId);
    }
    this.#emit("run.state", meta.runId, `${meta.label} ${state}`, {
      state,
      exitCode: exitCode ?? -1,
      durationMs: (final.endedAt ?? Date.now()) - meta.startedAt,
    });
    active.resolve(final);
  }

  async #kill(active: ActiveRun): Promise<void> {
    const child = active.child;
    if (!child) return;
    const pid = child.pid;
    try {
      if (process.platform === "win32" && typeof pid === "number") {
        Bun.spawnSync({ cmd: ["taskkill", "/PID", String(pid), "/T", "/F"], stdout: "ignore", stderr: "ignore" });
      } else {
        child.kill("SIGTERM");
      }
    } catch {
      // Already gone.
    }
    await Promise.race([child.exited.catch(() => -1), new Promise((r) => setTimeout(r, KILL_GRACE_MS))]);
  }

  async #stop(runId: string, reason: string): Promise<RunMeta> {
    const active = this.#runs.get(runId);
    if (!active) return this.#finished.get(runId) ?? ({} as RunMeta);
    active.cancelled = true;
    this.#emit("job.cancelled", runId, `cancel requested (${reason})`);
    await this.#kill(active);
    this.#finish(active, "cancelled", null);
    return active.handle.meta;
  }

  stop(runId: string, reason = "operator"): Promise<RunMeta> {
    return this.#stop(runId, reason);
  }

  stopAll(reason = "shutdown"): Promise<RunMeta[]> {
    return Promise.all([...this.#runs.keys()].map((runId) => this.#stop(runId, reason)));
  }

  /**
   * Maintenance sweep: classify every run, repair what the policy allows.
   * Returns actionable findings; emits `maintenance.check` / `maintenance.action`.
   */
  async maintain(): Promise<{ checked: number; stalled: number; actions: string[] }> {
    const now = Date.now();
    const actions: string[] = [];
    let stalled = 0;

    for (const active of [...this.#runs.values()]) {
      const idleMs = now - active.lastLineAt;
      const ageMs = now - active.handle.meta.startedAt;
      if (idleMs > this.#config.get().heartbeatMs * 5) {
        stalled += 1;
        this.#emit("maintenance.check", active.handle.meta.runId, `stalled ${idleMs}ms`, {
          idleMs,
          ageMs,
          level: "warn",
        });
        actions.push(`stalled:${active.handle.meta.runId}`);
        if (idleMs > (active.spec.timeoutMs > 0 ? active.spec.timeoutMs : 30_000)) {
          await this.#stop(active.handle.meta.runId, "maintenance:stalled");
          actions.push(`stopped:${active.handle.meta.runId}`);
        }
      }
    }

    this.#emit("maintenance.check", undefined, `sweep: ${this.#runs.size} live, ${stalled} stalled`, {
      live: this.#runs.size,
      stalled,
      finished: this.#finished.size,
    });

    if (actions.length > 0) {
      this.#emit("maintenance.action", undefined, actions.join(","), { actions: actions.join(","), level: "warn" });
    }
    return { checked: this.#runs.size + this.#finished.size, stalled, actions };
  }

  #emit(
    type: BusEventType,
    runId: string | undefined,
    text: string | null,
    data?: Record<string, string | number | boolean | null>,
  ): void {
    const level = (data?.["level"] as Level | undefined) ?? undefined;
    const clean: Record<string, string | number | boolean | null> = {};
    for (const [key, value] of Object.entries(data ?? {})) {
      if (key !== "level" && value !== undefined) clean[key] = value as string | number | boolean | null;
    }
    this.#bus.emit({
      tier: 3,
      type,
      sessionId: this.#sessionId,
      ...(runId === undefined ? {} : { runId }),
      ...(level === undefined ? {} : { level }),
      ...(text === null ? {} : { text }),
      ...(Object.keys(clean).length === 0 ? {} : { data: clean }),
    });
  }
}
