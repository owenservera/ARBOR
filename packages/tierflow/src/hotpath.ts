/**
 * Hot-path bridge: TypeScript emits, Rust aggregates.
 *
 * Every event goes to the sidecar as one NDJSON line. The sidecar returns
 * coalesced `Frame`s (~20/s) carrying counts and latency percentiles, so the
 * websocket never has to forward raw firehose traffic to render a chart.
 *
 * If the Rust binary is absent or dies, the same frames are produced by a
 * TypeScript fallback. The UI cannot tell the difference except by the badge —
 * that is deliberate: optimization target, not correctness target.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { BusEvent, Frame } from "./protocol.ts";
import type { EventBus } from "./bus.ts";
import type { ConfigStore } from "./config.ts";

export type FrameSink = (frame: Frame) => void;

export function coreBinary(root: string): string {
  const name = process.platform === "win32" ? "tierflow-core.exe" : "tierflow-core";
  return join(root, "core", "target", "release", name);
}

export class HotPath {
  #root: string;
  #config: ConfigStore;
  #bus: EventBus;
  #sink: FrameSink;
  #child: ReturnType<typeof Bun.spawn> | null = null;
  #mode: "rust" | "ts-fallback" = "ts-fallback";
  #seq = 0;
  #drops = 0;
  #timer: ReturnType<typeof setInterval> | null = null;
  #window: BusEvent[] = [];
  #gaps: number[] = [];
  #lastTs = 0;
  #unsubscribe: (() => void) | null = null;

  constructor(input: { root: string; config: ConfigStore; bus: EventBus; onFrame: FrameSink }) {
    this.#root = input.root;
    this.#config = input.config;
    this.#bus = input.bus;
    this.#sink = input.onFrame;
  }

  get mode(): "rust" | "ts-fallback" {
    return this.#mode;
  }

  start(): "rust" | "ts-fallback" {
    const config = this.#config.get();
    const binary = coreBinary(this.#root);
    if (config.hotpathEnabled && existsSync(binary)) {
      try {
        const child = Bun.spawn({
          cmd: [binary, "stream", "--tick-ms", String(config.frameTickMs)],
          stdin: "pipe",
          stdout: "pipe",
          stderr: "pipe",
          windowsHide: true,
        });
        this.#child = child;
        this.#mode = "rust";
        void this.#readFrames(child);
        this.#bus.emit({
          tier: 2,
          type: "system.note",
          sessionId: "system",
          text: `hot path: rust sidecar pid ${child.pid}`,
          data: { hotpath: "rust", tickMs: config.frameTickMs },
        });
      } catch (error) {
        this.#mode = "ts-fallback";
        this.#bus.emit({
          tier: 2,
          type: "system.error",
          sessionId: "system",
          level: "warn",
          text: `hot path sidecar failed: ${(error as Error).message}`,
        });
      }
    }

    // Always tap the bus: rust needs the feed, fallback needs the window.
    this.#unsubscribe = this.#bus.subscribe((event) => this.#push(event));
    if (this.#mode === "ts-fallback") this.#startFallback();
    return this.#mode;
  }

  #push(event: BusEvent): void {
    if (this.#mode === "rust") {
      const child = this.#child;
      const stdin = child?.stdin;
      if (!stdin || typeof stdin === "number") return;
      const now = event.ts;
      if (this.#lastTs > 0) this.#gaps.push(now - this.#lastTs);
      this.#lastTs = now;
      try {
        stdin.write(`${JSON.stringify(event)}\n`);
        stdin.flush?.();
      } catch {
        this.#drops += 1;
      }
      return;
    }

    const now = event.ts;
    if (this.#lastTs > 0) {
      this.#gaps.push(now - this.#lastTs);
      if (this.#gaps.length > 512) this.#gaps.shift();
    }
    this.#lastTs = now;
    this.#window.push(event);
    if (this.#window.length > 20_000) {
      this.#drops += this.#window.length - 20_000;
      this.#window.splice(0, this.#window.length - 20_000);
    }
  }

  async #readFrames(child: ReturnType<typeof Bun.spawn>): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      for await (const chunk of child.stdout as ReadableStream<Uint8Array>) {
        buffer += decoder.decode(chunk, { stream: true });
        let newline = buffer.indexOf("\n");
        while (newline !== -1) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (line.length > 0) this.#deliver(line);
          newline = buffer.indexOf("\n");
        }
      }
    } catch {
      // Falls through to the exit handler.
    }
    this.#child = null;
    this.#mode = "ts-fallback";
    this.#startFallback();
    this.#bus.emit({
      tier: 2,
      type: "system.error",
      sessionId: "system",
      level: "warn",
      text: "hot path sidecar exited; switched to ts fallback",
    });
  }

  #deliver(line: string): void {
    try {
      const parsed = JSON.parse(line) as Partial<Frame>;
      if (parsed.kind !== "frame") return;
      this.#sink({
        kind: "frame",
        seq: Number(parsed.seq ?? 0),
        ts: Number(parsed.ts ?? Date.now()),
        windowMs: Number(parsed.windowMs ?? this.#config.get().frameTickMs),
        events: Number(parsed.events ?? 0),
        rate: Number(parsed.rate ?? 0),
        errors: Number(parsed.errors ?? 0),
        byTier: (parsed.byTier ?? {}) as Record<string, number>,
        byType: (parsed.byType ?? {}) as Record<string, number>,
        byRun: (parsed.byRun ?? {}) as Record<string, number>,
        p95GapUs: Number(parsed.p95GapUs ?? 0),
        drops: Number(parsed.drops ?? 0),
      });
    } catch {
      this.#drops += 1;
    }
  }

  #startFallback(): void {
    if (this.#timer) return;
    const config = this.#config.get();
    this.#timer = setInterval(() => {
      if (this.#mode !== "ts-fallback") return;
      const window = this.#window;
      this.#window = [];
      this.#seq += 1;
      const byTier: Record<string, number> = {};
      const byType: Record<string, number> = {};
      const byRun: Record<string, number> = {};
      let errors = 0;
      for (const event of window) {
        byTier[String(event.tier)] = (byTier[String(event.tier)] ?? 0) + 1;
        byType[event.type] = (byType[event.type] ?? 0) + 1;
        if (event.runId) byRun[event.runId] = (byRun[event.runId] ?? 0) + 1;
        if (event.level === "error") errors += 1;
      }
      const gaps = [...this.#gaps].sort((a, b) => a - b);
      const p95 = gaps.length > 0 ? (gaps[Math.floor(gaps.length * 0.95)] ?? 0) : 0;
      const windowMs = Date.now() % 1000 === 0 ? config.frameTickMs : config.frameTickMs;
      this.#sink({
        kind: "frame",
        seq: this.#seq,
        ts: Date.now(),
        windowMs,
        events: window.length,
        rate: Math.round((window.length * 1000) / Math.max(1, windowMs)),
        errors,
        byTier,
        byType,
        byRun,
        p95GapUs: Math.round(p95 * 1000),
        drops: this.#drops,
      });
    }, config.frameTickMs);
  }

  stop(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = null;
    try {
      this.#child?.stdin && typeof this.#child.stdin !== "number" && this.#child.stdin.end();
    } catch {
      // Deno-like behaviour differences: ignore.
    }
    try {
      this.#child?.kill();
    } catch {
      // Already gone.
    }
    this.#child = null;
  }
}
