# File: packages/tierflow/src/protocol.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/protocol.ts |
| Language | TypeScript |
| Kind | source |
| Size | 8780 B |
| Lines | 262 |
| Hash | 8653ba5d2efb |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROTOCOL_VERSION | const | 10 | yes | export const PROTOCOL_VERSION = 1 as const; |
| PROTOCOL | const | 11 | yes | export const PROTOCOL = &quot;tierflow/1&quot; as const; |
| Tier | type | 13 | yes | export type Tier = 1 \| 2 \| 3; |
| Level | type | 14 | yes | export type Level = &quot;debug&quot; \| &quot;info&quot; \| &quot;warn&quot; \| &quot;error&quot;; |
| IntentMode | type | 17 | yes | export type IntentMode = &quot;chat&quot; \| &quot;run&quot; \| &quot;design&quot; \| &quot;maintain&quot; \| &quot;inspect&quot; \| &quot;simulate&quot;; |
| Intent | interface | 19 | yes | export interface Intent { |
| JobKind | type | 30 | yes | export type JobKind = &quot;exec&quot; \| &quot;script&quot; \| &quot;probe&quot; \| &quot;sim&quot;; |
| JobSpec | interface | 32 | yes | export interface JobSpec { |
| Plan | interface | 46 | yes | export interface Plan { |
| RunState | type | 56 | yes | export type RunState = &quot;queued&quot; \| &quot;running&quot; \| &quot;succeeded&quot; \| &quot;failed&quot; \| &quot;cancelled&quot; \| &quot;timed_out&quot;; |
| RunMeta | interface | 58 | yes | export interface RunMeta { |
| BusEvent | interface | 80 | yes | export interface BusEvent { |
| BUS_EVENT_TYPES | const | 97 | yes | export const BUS_EVENT_TYPES = [ |
| BusEventType | type | 123 | yes | export type BusEventType = (typeof BUS_EVENT_TYPES)[number]; |
| EVENT_TYPE_SET | const | 125 | no | const EVENT_TYPE_SET: ReadonlySet&lt;string&gt; = new Set(BUS_EVENT_TYPES); |
| isBusEvent | function | 127 | yes | export function isBusEvent(value: unknown): value is BusEvent { |
| e | const | 129 | no | const e = value as Record&lt;string, unknown&gt;; |
| Frame | interface | 143 | yes | export interface Frame { |
| ProgramInfo | interface | 168 | yes | export interface ProgramInfo { |
| ProgramContext | interface | 178 | yes | export interface ProgramContext { |
| ProgramFn | type | 196 | yes | export type ProgramFn = (ctx: ProgramContext) =&gt; readonly JobSpec[] \| Promise&lt;readonly JobSpec[]&gt;; |
| PanelKind | type | 202 | yes | export type PanelKind = &quot;topology&quot; \| &quot;timeline&quot; \| &quot;runs&quot; \| &quot;console&quot; \| &quot;programs&quot; \| &quot;metrics&quot;; |
| PanelSpec | interface | 204 | yes | export interface PanelSpec { |
| SurfaceSpec | interface | 213 | yes | export interface SurfaceSpec { |
| Snapshot | interface | 223 | yes | export interface Snapshot { |
| WireMessage | type | 236 | yes | export type WireMessage = |
| counter | variable | 252 | no | let counter = 0; |
| nextId | function | 254 | yes | export function nextId(prefix: string): string { |
| assertNever | function | 260 | yes | export function assertNever(value: never, where: string): never { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./observability.ts | dynamic | 244 | [packages/tierflow/src/observability.ts](./observability.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/bus.ts](./bus.ts.md) | ./protocol.ts |
| [packages/tierflow/src/hotpath.ts](./hotpath.ts.md) | ./protocol.ts |
| [packages/tierflow/src/lab.ts](./lab.ts.md) | ./protocol.ts |
| [packages/tierflow/src/registry.ts](./registry.ts.md) | ./protocol.ts |
| [packages/tierflow/src/server.ts](./server.ts.md) | ./protocol.ts |
| [packages/tierflow/src/surface.ts](./surface.ts.md) | ./protocol.ts |
| [packages/tierflow/src/tier1/agent.ts](./tier1/agent.ts.md) | ../protocol.ts |
| [packages/tierflow/src/tier2/router.ts](./tier2/router.ts.md) | ../protocol.ts |
| [packages/tierflow/src/tier3/executor.ts](./tier3/executor.ts.md) | ../protocol.ts |
| [packages/tierflow/tests/e2e.test.ts](../tests/e2e.test.ts.md) | ../src/protocol.ts |
| [packages/tierflow/tests/executor.test.ts](../tests/executor.test.ts.md) | ../src/protocol.ts |
| [packages/tierflow/tests/protocol.test.ts](../tests/protocol.test.ts.md) | ../src/protocol.ts |
| [packages/tierflow/tests/router.test.ts](../tests/router.test.ts.md) | ../src/protocol.ts |
| [packages/tierflow/tests/tier-capability.test.ts](../tests/tier-capability.test.ts.md) | ../src/protocol.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 263 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
