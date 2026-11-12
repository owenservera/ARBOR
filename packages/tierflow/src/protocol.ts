/**
 * TierFlow protocol — the only contract shared by all three tiers and the webapp.
 *
 * Tier 1 (interactive agent) speaks `Intent` / `Turn`.
 * Tier 2 (orchestrator) converts `Intent` into a `Plan` of `JobSpec`s.
 * Tier 3 (executor) turns each `JobSpec` into a `RunMeta` plus a stream of `BusEvent`s.
 * The webapp consumes `WireMessage` only, so the UI never imports tier internals.
 */

export const PROTOCOL_VERSION = 1 as const;
export const PROTOCOL = "tierflow/1" as const;

export type Tier = 1 | 2 | 3;
export type Level = "debug" | "info" | "warn" | "error";

/** What the human asked for, normalized by Tier 1. */
export type IntentMode = "chat" | "run" | "design" | "maintain" | "inspect" | "simulate";

export interface Intent {
  readonly version: typeof PROTOCOL_VERSION;
  readonly id: string;
  readonly sessionId: string;
  readonly text: string;
  readonly mode: IntentMode;
  readonly at: number;
  /** Joins Tier-1 request, Tier-2 plan and Tier-3 runs into one e2e trace. */
  readonly traceId: string;
}

export type JobKind = "exec" | "script" | "probe" | "sim";

export interface JobSpec {
  readonly id: string;
  readonly kind: JobKind;
  readonly label: string;
  /** Fully resolved argv. Never a shell string: the executor spawns without a shell. */
  readonly argv: readonly string[];
  readonly cwd?: string;
  readonly timeoutMs: number;
  /** Maintenance policy owned by Tier 2, enforced by Tier 3. */
  readonly restart?: boolean;
  readonly maxRestarts?: number;
  readonly env?: Readonly<Record<string, string>>;
}

export interface Plan {
  readonly version: typeof PROTOCOL_VERSION;
  readonly id: string;
  readonly intentId: string;
  readonly sessionId: string;
  readonly rationale: string;
  readonly steps: readonly JobSpec[];
  readonly createdAt: number;
}

export type RunState = "queued" | "running" | "succeeded" | "failed" | "cancelled" | "timed_out";

export interface RunMeta {
  readonly runId: string;
  readonly jobId: string;
  readonly planId: string;
  readonly sessionId: string;
  readonly label: string;
  readonly kind: JobKind;
  readonly argv: readonly string[];
  readonly state: RunState;
  readonly startedAt: number;
  readonly endedAt: number | null;
  readonly exitCode: number | null;
  readonly stdoutLines: number;
  readonly stderrLines: number;
  readonly restarts: number;
  readonly lastOutputAt: number | null;
}

/**
 * One flat shape for every live event. Flat on purpose: the Rust hot path
 * (`core/`) parses these lines and must not walk nested structures.
 */
export interface BusEvent {
  readonly version: typeof PROTOCOL_VERSION;
  /** Monotonic per process. */
  readonly seq: number;
  readonly id: string;
  readonly ts: number;
  readonly tier: Tier;
  readonly type: BusEventType;
  readonly level: Level;
  readonly sessionId: string;
  readonly runId?: string;
  readonly planId?: string;
  readonly text?: string;
  /** Scalar-only bag: never nest objects here. */
  readonly data?: Readonly<Record<string, string | number | boolean | null>>;
}

export const BUS_EVENT_TYPES = [
  "tier.ready",
  "intent.received",
  "intent.routed",
  "plan.created",
  "plan.finished",
  "job.queued",
  "job.started",
  "job.stdout",
  "job.stderr",
  "job.heartbeat",
  "job.exit",
  "job.cancelled",
  "job.restart",
  "job.timeout",
  "run.state",
  "maintenance.check",
  "maintenance.action",
  "program.loaded",
  "program.reloaded",
  "program.rejected",
  "surface.updated",
  "system.note",
  "system.error",
] as const;

export type BusEventType = (typeof BUS_EVENT_TYPES)[number];

const EVENT_TYPE_SET: ReadonlySet<string> = new Set(BUS_EVENT_TYPES);

export function isBusEvent(value: unknown): value is BusEvent {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    e["version"] === PROTOCOL_VERSION &&
    typeof e["seq"] === "number" &&
    typeof e["id"] === "string" &&
    typeof e["ts"] === "number" &&
    (e["tier"] === 1 || e["tier"] === 2 || e["tier"] === 3) &&
    typeof e["type"] === "string" &&
    EVENT_TYPE_SET.has(e["type"]) &&
    typeof e["sessionId"] === "string"
  );
}

/** Aggregate produced by the Rust hot path, not by TypeScript. */
export interface Frame {
  readonly kind: "frame";
  readonly seq: number;
  readonly ts: number;
  readonly windowMs: number;
  readonly events: number;
  readonly rate: number;
  readonly errors: number;
  readonly byTier: Readonly<Record<string, number>>;
  readonly byType: Readonly<Record<string, number>>;
  readonly byRun: Readonly<Record<string, number>>;
  /** Approximate p95 of event inter-arrival gap in microseconds. */
  readonly p95GapUs: number;
  readonly drops: number;
}

/* ------------------------------------------------------------------ */
/* Repogrammability: orchestration programs are data, not compiled code */
/* ------------------------------------------------------------------ */

/**
 * A program is a hot-swappable Tier-2 policy module:
 *   export default (ctx: ProgramContext) => JobSpec[] | Promise<JobSpec[]>
 * Editing the file changes routing behavior on the next intent, with no restart.
 */
export interface ProgramInfo {
  readonly name: string;
  readonly label: string;
  readonly version: number;
  readonly hash: string;
  readonly updatedAt: number;
  readonly triggers: readonly string[];
  readonly error: string | null;
}

export interface ProgramContext {
  readonly intent: Intent;
  readonly text: string;
  readonly sessionId: string;
  readonly now: number;
  /** Build a JobSpec with defaults applied; the only sanctioned job constructor. */
  readonly job: (spec: {
    kind: JobSpec["kind"];
    label: string;
    argv: readonly string[];
    cwd?: string;
    timeoutMs?: number;
    restart?: boolean;
    maxRestarts?: number;
    env?: Readonly<Record<string, string>>;
  }) => JobSpec;
}

export type ProgramFn = (ctx: ProgramContext) => readonly JobSpec[] | Promise<readonly JobSpec[]>;

/* ------------------------------------------------------------------ */
/* Backend-owned surface: the frontend renders this spec, not its own  */
/* ------------------------------------------------------------------ */

export type PanelKind = "topology" | "timeline" | "runs" | "console" | "programs" | "metrics";

export interface PanelSpec {
  readonly id: string;
  readonly title: string;
  readonly kind: PanelKind;
  /** Relative flex weight on desktop. */
  readonly span: number;
  readonly collapsed?: boolean;
}

export interface SurfaceSpec {
  readonly version: typeof PROTOCOL_VERSION;
  readonly revision: number;
  readonly title: string;
  readonly accent: string;
  readonly panels: readonly PanelSpec[];
  readonly updatedAt: number;
  readonly source: "file" | "default";
}

export interface Snapshot {
  readonly protocol: typeof PROTOCOL;
  readonly pid: number;
  readonly startedAt: number;
  readonly sessionId: string;
  readonly runs: readonly RunMeta[];
  readonly recent: readonly BusEvent[];
  readonly hotpath: "rust" | "ts-fallback";
  readonly counters: { intents: number; plans: number; runs: number; events: number };
  readonly surface: SurfaceSpec;
  readonly programs: readonly ProgramInfo[];
}

export type WireMessage =
  | { readonly kind: "hello"; readonly snapshot: Snapshot }
  | { readonly kind: "event"; readonly event: BusEvent }
  | { readonly kind: "plan"; readonly plan: Plan }
  | { readonly kind: "run"; readonly run: RunMeta }
  | { readonly kind: "frame"; readonly frame: Frame }
  | { readonly kind: "surface"; readonly surface: SurfaceSpec }
  | { readonly kind: "programs"; readonly programs: readonly ProgramInfo[] }
  | { readonly kind: "trace"; readonly trace: import("./observability.ts").TraceSnapshot }
  | { readonly kind: "pong"; readonly clientTs: number; readonly serverTs: number }
  | { readonly kind: "note"; readonly text: string };

/* ------------------------------------------------------------------ */
/* Identifier helpers                                                  */
/* ------------------------------------------------------------------ */

let counter = 0;

export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Type-level exhaustiveness helper used at tier boundaries. */
export function assertNever(value: never, where: string): never {
  throw new Error(`unhandled ${where}: ${JSON.stringify(value)}`);
}
