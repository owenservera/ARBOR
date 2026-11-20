# File: packages/tierflow/src/tier3/executor.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/tier3/executor.ts |
| Language | TypeScript |
| Kind | source |
| Size | 17503 B |
| Lines | 502 |
| Hash | 8fcd60bc18b3 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KILL_GRACE_MS | const | 20 | no | const KILL_GRACE_MS = 1500; |
| MAX_LINE | const | 21 | no | const MAX_LINE = 8_192; |
| DENIED_EXEC | const | 23 | yes | export const DENIED_EXEC = &quot;denied: exec capability required&quot;; |
| CapabilityGate | type | 26 | yes | export type CapabilityGate = (capability: Capability) =&gt; boolean; |
| ALLOW_ALL | function | 28 | no | const ALLOW_ALL: CapabilityGate = () =&gt; true; |
| RunHandle | interface | 30 | yes | export interface RunHandle { |
| ExecutorOptions | interface | 36 | yes | export interface ExecutorOptions { |
| ActiveRun | type | 48 | no | type ActiveRun = { |
| Executor | class | 61 | yes | export class Executor { |
| constructor | method | 71 | yes | constructor(options: ExecutorOptions) { |
| list | method | 83 | yes | list(): RunMeta[] { |
| live | const | 84 | no | const live = [...this.#runs.values()].map((run) =&gt; run.handle.meta); |
| done | const | 85 | no | const done = [...this.#finished.values()]; |
| state | method | 89 | yes | state(runId: string): RunMeta \| null { |
| start | method | 94 | yes | start(spec: JobSpec, authorize?: CapabilityGate): RunHandle { |
| gate | const | 95 | no | const gate = authorize ?? this.#authorize; |
| runId | const | 99 | no | const runId = nextId(`run${this.#counter}`); |
| config | const | 100 | no | const config = this.#config.get(); |
| effective | const | 101 | no | const effective: JobSpec = |
| resolveDone | variable | 104 | no | let resolveDone: (meta: RunMeta) =&gt; void = () =&gt; {}; |
| done | const | 105 | no | const done = new Promise&lt;RunMeta&gt;((resolve) =&gt; { resolveDone = resolve; }); |
| meta | const | 109 | no | const meta: RunMeta = { |
| active | const | 127 | no | const active: ActiveRun = { |
| runId | const | 163 | no | const runId = nextId(`run${this.#counter}`); |
| meta | const | 164 | no | const meta: RunMeta = { |
| config | const | 190 | no | const config = this.#config.get(); |
| child | variable | 206 | no | let child: ReturnType&lt;typeof Bun.spawn&gt;; |
| stdoutTask | const | 236 | no | const stdoutTask = this.#pump(child.stdout as ReadableStream&lt;Uint8Array&gt;, active, &quot;job.stdout&quot;); |
| stderrTask | const | 237 | no | const stderrTask = this.#pump(child.stderr as ReadableStream&lt;Uint8Array&gt;, active, &quot;job.stderr&quot;); |
| exitCode | variable | 239 | no | let exitCode: number \| null = null; |
| state | const | 250 | no | const state: RunState = active.cancelled |
| canRestart | const | 265 | no | const canRestart = |
| rawRate | const | 288 | no | const rawRate = Number(active.spec.env?.[&quot;rate&quot;] ?? 200); |
| rawSeconds | const | 289 | no | const rawSeconds = Number(active.spec.env?.[&quot;seconds&quot;] ?? 5); |
| rate | const | 290 | no | const rate = Math.min(100_000, Math.max(1, Number.isFinite(rawRate) ? rawRate : 200)); |
| seconds | const | 291 | no | const seconds = Math.min(120, Math.max(0.2, Number.isFinite(rawSeconds) ? rawSeconds : 5)); |
| durationMs | const | 292 | no | const durationMs = seconds * 1000; |
| config | const | 293 | no | const config = this.#config.get(); |
| tickMs | const | 294 | no | const tickMs = config.simTickMs; |
| perTick | const | 295 | no | const perTick = Math.max(1, Math.round((rate * tickMs) / 1000)); |
| started | const | 296 | no | const started = Date.now(); |
| roll | const | 303 | no | const roll = Math.random(); |
| line | const | 304 | no | const line = `sim +${Date.now() - started}ms n=${i} v=${(Math.random() * 1000).toFixed(2)}`; |
| decoder | const | 328 | no | const decoder = new TextDecoder(); |
| buffer | variable | 329 | no | let buffer = &quot;&quot;; |
| injected | const | 330 | no | const injected = this.#config.get().injectLatency.firstOutputMs; |
| newline | variable | 335 | no | let newline = buffer.indexOf(&quot;\\n&quot;); |
| line | const | 337 | no | const line = buffer.slice(0, newline).replace(/\\r$/, &quot;&quot;); |
| isErr | const | 357 | no | const isErr = type === &quot;job.stderr&quot;; |
| idleMs | const | 371 | no | const idleMs = Date.now() - active.lastLineAt; |
| meta | const | 386 | no | const meta = active.handle.meta; |
| oldest | const | 397 | no | const oldest = [...this.#finished.values()].sort((a, b) =&gt; a.startedAt - b.startedAt)[0]; |
| child | const | 409 | no | const child = active.child; |
| pid | const | 411 | no | const pid = child.pid; |
| active | const | 425 | no | const active = this.#runs.get(runId); |
| stop | method | 434 | yes | stop(runId: string, reason = &quot;operator&quot;): Promise&lt;RunMeta&gt; { |
| stopAll | method | 438 | yes | stopAll(reason = &quot;shutdown&quot;): Promise&lt;RunMeta[]&gt; { |
| maintain | method | 446 | yes | async maintain(): Promise&lt;{ checked: number; stalled: number; actions: string[] }&gt; { |
| now | const | 447 | no | const now = Date.now(); |
| actions | const | 448 | no | const actions: string[] = []; |
| stalled | variable | 449 | no | let stalled = 0; |
| idleMs | const | 452 | no | const idleMs = now - active.lastLineAt; |
| ageMs | const | 453 | no | const ageMs = now - active.handle.meta.startedAt; |
| level | const | 487 | no | const level = (data?.[&quot;level&quot;] as Level \| undefined) ?? undefined; |
| clean | const | 488 | no | const clean: Record&lt;string, string \| number \| boolean \| null&gt; = {}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../protocol.ts | import | 15 | [packages/tierflow/src/protocol.ts](../protocol.ts.md) |
| ../bus.ts | import | 16 | [packages/tierflow/src/bus.ts](../bus.ts.md) |
| ../config.ts | import | 17 | [packages/tierflow/src/config.ts](../config.ts.md) |
| ../security.ts | import | 18 | [packages/tierflow/src/security.ts](../security.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/cli.ts](../cli.ts.md) | ./tier3/executor.ts |
| [packages/tierflow/src/lab.ts](../lab.ts.md) | ./tier3/executor.ts |
| [packages/tierflow/src/server.ts](../server.ts.md) | ./tier3/executor.ts |
| [packages/tierflow/src/tier2/router.ts](../tier2/router.ts.md) | ../tier3/executor.ts |
| [packages/tierflow/tests/executor.test.ts](../../tests/executor.test.ts.md) | ../src/tier3/executor.ts |
| [packages/tierflow/tests/router.test.ts](../../tests/router.test.ts.md) | ../src/tier3/executor.ts |
| [packages/tierflow/tests/tier-capability.test.ts](../../tests/tier-capability.test.ts.md) | ../src/tier3/executor.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 503 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
