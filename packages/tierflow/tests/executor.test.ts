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
  }, 30_000);

  test("a job that overruns its timeout ends timed_out", async () => {
    const executor = makeExecutor();
    const spec: JobSpec = {
      id: "job-timeout",
      kind: "exec",
      label: "slow",
      argv: ["bun", "-e", "await Bun.sleep(5000)"],
      timeoutMs: 150,
    };

    const meta = await executor.start(spec).done;
    expect(meta.state).toBe("timed_out");
    expect(executor.activeCount).toBe(0);
  }, 30_000);

  test("stop() cancels a long running job", async () => {
    const executor = makeExecutor();
    const spec: JobSpec = {
      id: "job-cancel",
      kind: "exec",
      label: "long",
      argv: ["bun", "-e", "await Bun.sleep(5000)"],
      timeoutMs: 30_000,
    };

    const handle = executor.start(spec);
    await Bun.sleep(250);

    const stopped = await handle.stop();
    expect(stopped.state).toBe("cancelled");

    const meta = await handle.done;
    expect(meta.state).toBe("cancelled");
    expect(executor.activeCount).toBe(0);
  }, 30_000);

  test("stopAll cancels every live run", async () => {
    const executor = makeExecutor();
    const spec: JobSpec = {
      id: "job-stopall",
      kind: "exec",
      label: "long",
      argv: ["bun", "-e", "await Bun.sleep(5000)"],
      timeoutMs: 30_000,
    };

    executor.start(spec);
    await Bun.sleep(250);
    const stopped = await executor.stopAll("test-end");
    expect(stopped.length).toBeGreaterThanOrEqual(1);
    expect(stopped.every((meta) => meta.state === "cancelled")).toBe(true);
    expect(executor.activeCount).toBe(0);
  }, 30_000);
});
