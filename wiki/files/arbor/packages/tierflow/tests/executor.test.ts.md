# File: packages/tierflow/tests/executor.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/executor.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 4280 B |
| Lines | 136 |
| Hash | 10f94c2aa8af |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| makeExecutor | function | 15 | no | function makeExecutor(): Executor { |
| config | const | 16 | no | const config = parseConfig({ ...DEFAULT_CONFIG, heartbeatMs: 100 }); |
| bus | const | 17 | no | const bus = new EventBus(5000); |
| executor | const | 28 | no | const executor = makeExecutor(); |
| spec | const | 29 | no | const spec: JobSpec = { |
| handle | const | 37 | no | const handle = executor.start(spec); |
| meta | const | 40 | no | const meta = await handle.done; |
| executor | const | 52 | no | const executor = makeExecutor(); |
| spec | const | 53 | no | const spec: JobSpec = { |
| meta | const | 61 | no | const meta = await executor.start(spec).done; |
| executor | const | 67 | no | const executor = makeExecutor(); |
| spec | const | 68 | no | const spec: JobSpec = { |
| meta | const | 77 | no | const meta = await executor.start(spec).done; |
| executor | const | 84 | no | const executor = makeExecutor(); |
| spec | const | 85 | no | const spec: JobSpec = { |
| meta | const | 93 | no | const meta = await executor.start(spec).done; |
| executor | const | 99 | no | const executor = makeExecutor(); |
| spec | const | 100 | no | const spec: JobSpec = { |
| handle | const | 108 | no | const handle = executor.start(spec); |
| stopped | const | 111 | no | const stopped = await handle.stop(); |
| meta | const | 114 | no | const meta = await handle.done; |
| executor | const | 120 | no | const executor = makeExecutor(); |
| spec | const | 121 | no | const spec: JobSpec = { |
| stopped | const | 131 | no | const stopped = await executor.stopAll(&quot;test-end&quot;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 9 | external |
| ../src/bus.ts | import | 10 | [packages/tierflow/src/bus.ts](../src/bus.ts.md) |
| ../src/tier3/executor.ts | import | 11 | [packages/tierflow/src/tier3/executor.ts](../src/tier3/executor.ts.md) |
| ../src/config.ts | import | 12 | [packages/tierflow/src/config.ts](../src/config.ts.md) |
| ../src/protocol.ts | import | 13 | [packages/tierflow/src/protocol.ts](../src/protocol.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Tier 3 executor contract tests.
 *
 * These run real processes: the executor must spawn without a shell, stream
 * stdout and stderr as lines, enforce timeouts, honour cancellation and keep
 * synthetic runs in-process.
 */

import { describe, expect, test } from "bun:test";
import { EventBus } from "../src/bus.ts";
import { Executor } from "../src/tier3/executor.ts";
import { DEFAULT_CONFIG, parseConfig, type TierflowConfig } from "../src/config.ts";
import type { JobSpec } from "../src/protocol.ts";

function makeExecutor(): Executor {
  const config = parseConfig({ ...DEFAULT_CONFIG, heartbeatMs: 100 });
  const bus = new EventBus(5000);
  return new Executor({
    bus,
    sessionId: "executor-test",
    workRoot: process.cwd(),
    config: { get: (): TierflowConfig => config },
  });
}

describe("Executor", () => {
  test("runs a real subprocess and captures stdout and stderr", async () => {
    const executor = makeExecutor();
    const spec: JobSpec = {
      id: "job-exec",
      kind: "exec",
      label: "out",
      argv: ["bun", "-e", "console.log('out'); console.error('err')"],
      timeoutMs: 20_000,
    };

    const handle = executor.start(spec);
    expect(handle.meta.state).toBe("queued");

    const meta = await handle.done;
    expect(meta.state).toBe("succeeded");
    expect(meta.exitCode).toBe(0);
    expect(meta.stdoutLines).toBeGreaterThanOrEqual(1);
    expect(meta.stderrLines).toBeGreaterThanOrEqual(1);
    expect(meta.kind).toBe("exec");
    expect(meta.argv).toEqual(["bun", "-e", "console.log('out'); console.error('err')"]);
    expect(meta.endedAt).not.toBeNull();
    expect(meta.restarts).toBe(0);
  }, 30_000);

  test("a failed subprocess ends in the failed state", async () => {
    const executor = makeExecutor();
    const spec: JobSpec = {
      id: "job-fail",
      kind: "exec",
      label: "fail",
      argv: ["bun", "-e", "process.exit(3)"],
      timeoutMs: 20_000,
    };

    const meta = await executor.start(spec).done;
    expect(meta.state).toBe("failed");
    expect(meta.exitCode).toBe(3);
  }, 30_000);

  test("a sim job runs in process and succeeds", async () => {
    const executor = makeExecutor();
    const spec: JobSpec = {
      id: "job-sim",
      kind: "sim",
      label: "sim",
      argv: ["tierflow-sim", "200", "0.3"],
      timeoutMs: 10_000,
      env: { rate: "200", seconds: "0.3" },
    };

    const meta = await executor.start(spec).done;
    expect(meta.state).toBe("succeeded");
    expect(meta.exitCode).toBe(0);
    expect(meta.kind).toBe("sim");
```

_First 80 of 137 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
