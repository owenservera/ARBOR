# File: packages/tierflow/src/config.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/config.ts |
| Language | TypeScript |
| Kind | source |
| Size | 6831 B |
| Lines | 183 |
| Hash | 53b04ebd8bbb |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TierflowConfig | interface | 15 | yes | export interface TierflowConfig { |
| DEFAULT_CONFIG | const | 55 | yes | export const DEFAULT_CONFIG: TierflowConfig = { |
| ConfigListener | type | 71 | yes | export type ConfigListener = (config: TierflowConfig, source: &quot;boot&quot; \| &quot;watch&quot; \| &quot;api&quot;) =&gt; void; |
| ConfigLike | interface | 74 | yes | export interface ConfigLike { |
| num | function | 78 | no | function num(value: unknown, fallback: number, min: number, max: number): number { |
| parseConfig | function | 83 | yes | export function parseConfig(input: unknown): TierflowConfig { |
| raw | const | 85 | no | const raw = input as Record&lt;string, unknown&gt;; |
| inject | const | 86 | no | const inject = (raw[&quot;injectLatency&quot;] ?? {}) as Record&lt;string, unknown&gt;; |
| ConfigStore | class | 108 | yes | export class ConfigStore { |
| constructor | method | 115 | yes | constructor(root: string) { |
| get | method | 124 | yes | get(): TierflowConfig { |
| onChange | method | 128 | yes | onChange(listener: ConfigListener): () =&gt; void { |
| load | method | 133 | yes | async load(): Promise&lt;TierflowConfig&gt; { |
| text | const | 135 | no | const text = await readFile(this.#file, &quot;utf8&quot;); |
| write | method | 146 | yes | async write(patch: unknown): Promise&lt;TierflowConfig&gt; { |
| merged | const | 147 | no | const merged = parseConfig({ ...this.#config, ...(patch as object) }); |
| close | method | 178 | yes | close(): void { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 11 | external |
| node:fs | import | 12 | external |
| node:path | import | 13 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/cli.ts](./cli.ts.md) | ./config.ts |
| [packages/tierflow/src/hotpath.ts](./hotpath.ts.md) | ./config.ts |
| [packages/tierflow/src/lab.ts](./lab.ts.md) | ./config.ts |
| [packages/tierflow/src/server.ts](./server.ts.md) | ./config.ts |
| [packages/tierflow/src/tier2/router.ts](./tier2/router.ts.md) | ../config.ts |
| [packages/tierflow/src/tier3/executor.ts](./tier3/executor.ts.md) | ../config.ts |
| [packages/tierflow/tests/executor.test.ts](../tests/executor.test.ts.md) | ../src/config.ts |
| [packages/tierflow/tests/router.test.ts](../tests/router.test.ts.md) | ../src/config.ts |
| [packages/tierflow/tests/tier-capability.test.ts](../tests/tier-capability.test.ts.md) | ../src/config.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Runtime configuration — every latency-bearing knob in one hot-reloaded file.
 *
 * Rationale: a system you intend to optimize e2e must expose its own overheads
 * as data. Heartbeat cadence, aggregation window, watch debounce, websocket
 * batching, default timeouts and even deliberately injected delay all live in
 * `runtime/config.json` and are re-read on change. Nothing here requires a
 * restart, which is the same rule the orchestrator and surface follow.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { watch, type FSWatcher } from "node:fs";
import { dirname, join } from "node:path";

export interface TierflowConfig {
  /** Tier-3 heartbeat cadence (ms). Lower = finer stall detection, more events. */
  heartbeatMs: number;
  /** Rust hot-path aggregation window (ms). Lower = smoother UI, more CPU. */
  frameTickMs: number;
  /** Debounce for program + surface file watches (ms). */
  reloadDebounceMs: number;
  /** Websocket coalescing window (ms). 0 = send every message immediately. */
  wsFlushMs: number;
  /** Max messages per websocket flush. */
  wsMaxBatch: number;
  /** Default job timeout when a program does not specify one (ms). */
  defaultTimeoutMs: number;
  /** Synthetic run tick (ms). */
  simTickMs: number;
  /** Hard cap on concurrently running jobs. */
  maxConcurrentRuns: number;
  /** In-memory trace ring size. */
  traceCapacity: number;
  /** 0..1. Fraction of intents that get a full trace. */
  traceSampleRate: number;
  /** Finished-run retention per executor. */
  runRetention: number;
  /** Use the Rust sidecar when its binary exists. */
  hotpathEnabled: boolean;
  /**
   * Deliberate latency injection for experiments. All zero by default.
   * These exist so an optimization can be measured against a known budget,
   * and so the visualization can be driven into each failure mode on purpose.
   */
  injectLatency: {
    /** Sleep before Tier 2 dispatches (ms). */
    dispatchMs: number;
    /** Sleep before Tier 3 spawns (ms). */
    spawnMs: number;
    /** Sleep before the first stdout line is published (ms). */
    firstOutputMs: number;
  };
}

export const DEFAULT_CONFIG: TierflowConfig = {
  heartbeatMs: 400,
  frameTickMs: 50,
  reloadDebounceMs: 80,
  wsFlushMs: 16,
  wsMaxBatch: 256,
  defaultTimeoutMs: 120_000,
  simTickMs: 50,
  maxConcurrentRuns: 24,
  traceCapacity: 500,
  traceSampleRate: 1,
  runRetention: 200,
  hotpathEnabled: true,
  injectLatency: { dispatchMs: 0, spawnMs: 0, firstOutputMs: 0 },
};

export type ConfigListener = (config: TierflowConfig, source: "boot" | "watch" | "api") => void;

/** Minimal read contract: hot store, static override, or lab variant. */
export interface ConfigLike {
  get(): TierflowConfig;
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
```

_First 80 of 184 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
