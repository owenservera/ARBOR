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
}

export function parseConfig(input: unknown): TierflowConfig {
  if (typeof input !== "object" || input === null) return { ...DEFAULT_CONFIG };
  const raw = input as Record<string, unknown>;
  const inject = (raw["injectLatency"] ?? {}) as Record<string, unknown>;
  return {
    heartbeatMs: num(raw["heartbeatMs"], DEFAULT_CONFIG.heartbeatMs, 50, 10_000),
    frameTickMs: num(raw["frameTickMs"], DEFAULT_CONFIG.frameTickMs, 16, 2_000),
    reloadDebounceMs: num(raw["reloadDebounceMs"], DEFAULT_CONFIG.reloadDebounceMs, 0, 5_000),
    wsFlushMs: num(raw["wsFlushMs"], DEFAULT_CONFIG.wsFlushMs, 0, 1_000),
    wsMaxBatch: num(raw["wsMaxBatch"], DEFAULT_CONFIG.wsMaxBatch, 1, 4_096),
    defaultTimeoutMs: num(raw["defaultTimeoutMs"], DEFAULT_CONFIG.defaultTimeoutMs, 100, 3_600_000),
    simTickMs: num(raw["simTickMs"], DEFAULT_CONFIG.simTickMs, 5, 1_000),
    maxConcurrentRuns: num(raw["maxConcurrentRuns"], DEFAULT_CONFIG.maxConcurrentRuns, 1, 256),
    traceCapacity: num(raw["traceCapacity"], DEFAULT_CONFIG.traceCapacity, 10, 10_000),
    traceSampleRate: num(raw["traceSampleRate"], DEFAULT_CONFIG.traceSampleRate, 0, 1),
    runRetention: num(raw["runRetention"], DEFAULT_CONFIG.runRetention, 10, 5_000),
    hotpathEnabled: raw["hotpathEnabled"] !== false,
    injectLatency: {
      dispatchMs: num(inject["dispatchMs"], 0, 0, 30_000),
      spawnMs: num(inject["spawnMs"], 0, 0, 30_000),
      firstOutputMs: num(inject["firstOutputMs"], 0, 0, 30_000),
    },
  };
}

export class ConfigStore {
  #file: string;
  #config: TierflowConfig = { ...DEFAULT_CONFIG };
  #listeners = new Set<ConfigListener>();
  #watcher: FSWatcher | null = null;
  #timer: ReturnType<typeof setTimeout> | null = null;

  constructor(root: string) {
    this.#file = join(root, "runtime", "config.json");
  }

  get path(): string {
    return this.#file;
  }

  /** Read at call time so edits apply to the very next operation. */
  get(): TierflowConfig {
    return this.#config;
  }

  onChange(listener: ConfigListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  async load(): Promise<TierflowConfig> {
    try {
      const text = await readFile(this.#file, "utf8");
      this.#commit(parseConfig(JSON.parse(text)), "boot");
    } catch {
      await mkdir(dirname(this.#file), { recursive: true });
      await writeFile(this.#file, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf8");
      this.#commit({ ...DEFAULT_CONFIG }, "boot");
    }
    this.#watch();
    return this.#config;
  }

  async write(patch: unknown): Promise<TierflowConfig> {
    const merged = parseConfig({ ...this.#config, ...(patch as object) });
    await mkdir(dirname(this.#file), { recursive: true });
    await writeFile(this.#file, JSON.stringify(merged, null, 2), "utf8");
    this.#commit(merged, "api");
    return merged;
  }

  #commit(config: TierflowConfig, source: "boot" | "watch" | "api"): void {
    this.#config = config;
    for (const listener of this.#listeners) {
      try {
        listener(config, source);
      } catch {
        // Subscriber isolation.
      }
    }
  }

  #watch(): void {
    if (this.#watcher) return;
    try {
      this.#watcher = watch(dirname(this.#file), { persistent: false }, (_event, filename) => {
        if (!filename || !filename.endsWith("config.json")) return;
        if (this.#timer) clearTimeout(this.#timer);
        this.#timer = setTimeout(() => void this.load(), 60);
      });
    } catch {
      // Non-fatal: API writes still apply.
    }
  }

  close(): void {
    this.#watcher?.close();
    this.#watcher = null;
    if (this.#timer) clearTimeout(this.#timer);
  }
}
