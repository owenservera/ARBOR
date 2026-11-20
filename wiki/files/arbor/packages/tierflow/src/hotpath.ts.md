# File: packages/tierflow/src/hotpath.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/hotpath.ts |
| Language | TypeScript |
| Kind | source |
| Size | 7536 B |
| Lines | 229 |
| Hash | 02502b60443d |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FrameSink | type | 19 | yes | export type FrameSink = (frame: Frame) =&gt; void; |
| coreBinary | function | 21 | yes | export function coreBinary(root: string): string { |
| name | const | 22 | no | const name = process.platform === &quot;win32&quot; ? &quot;tierflow-core.exe&quot; : &quot;tierflow-core&quot;; |
| HotPath | class | 26 | yes | export class HotPath { |
| constructor | method | 41 | yes | constructor(input: { root: string; config: ConfigStore; bus: EventBus; onFrame: FrameSink }) { |
| start | method | 52 | yes | start(): &quot;rust&quot; \| &quot;ts-fallback&quot; { |
| config | const | 53 | no | const config = this.#config.get(); |
| binary | const | 54 | no | const binary = coreBinary(this.#root); |
| child | const | 57 | no | const child = Bun.spawn({ cmd: [binary, &quot;stream&quot;, &quot;--tick-ms&quot;, String(config.frameTickMs)], stdin: &quot;pipe&quot;, stdout: &quot;pipe&quot;, stderr: &quot;pipe&quot;, |
| child | const | 94 | no | const child = this.#child; |
| stdin | const | 95 | no | const stdin = child?.stdin; |
| now | const | 97 | no | const now = event.ts; |
| now | const | 109 | no | const now = event.ts; |
| decoder | const | 123 | no | const decoder = new TextDecoder(); |
| buffer | variable | 124 | no | let buffer = &quot;&quot;; |
| newline | variable | 128 | no | let newline = buffer.indexOf(&quot;\\n&quot;); |
| line | const | 130 | no | const line = buffer.slice(0, newline).trim(); |
| parsed | const | 153 | no | const parsed = JSON.parse(line) as Partial&lt;Frame&gt;; |
| config | const | 176 | no | const config = this.#config.get(); |
| window | const | 179 | no | const window = this.#window; |
| byTier | const | 182 | no | const byTier: Record&lt;string, number&gt; = {}; |
| byType | const | 183 | no | const byType: Record&lt;string, number&gt; = {}; |
| byRun | const | 184 | no | const byRun: Record&lt;string, number&gt; = {}; |
| errors | variable | 185 | no | let errors = 0; |
| gaps | const | 192 | no | const gaps = [...this.#gaps].sort((a, b) =&gt; a - b); |
| p95 | const | 193 | no | const p95 = gaps.length &gt; 0 ? (gaps[Math.floor(gaps.length * 0.95)] ?? 0) : 0; |
| windowMs | const | 194 | no | const windowMs = Date.now() % 1000 === 0 ? config.frameTickMs : config.frameTickMs; |
| stop | method | 212 | yes | stop(): void { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 13 | external |
| node:path | import | 14 | external |
| ./protocol.ts | import | 15 | [packages/tierflow/src/protocol.ts](./protocol.ts.md) |
| ./bus.ts | import | 16 | [packages/tierflow/src/bus.ts](./bus.ts.md) |
| ./config.ts | import | 17 | [packages/tierflow/src/config.ts](./config.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/server.ts](./server.ts.md) | ./hotpath.ts |
| [packages/tierflow/tests/e2e.test.ts](../tests/e2e.test.ts.md) | ../src/hotpath.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 230 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
