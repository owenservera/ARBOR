/**
 * Capability gating contract.
 *
 * The gates must live at the authority, not only at the HTTP route: a caller
 * that reaches `Router` or `ProgramRegistry` directly must still be refused
 * when it lacks the capability.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EventBus } from "../src/bus.ts";
import { Executor } from "../src/tier3/executor.ts";
import { Router } from "../src/tier2/router.ts";
import { ProgramRegistry } from "../src/registry.ts";
import { TraceStore } from "../src/observability.ts";
import { DEFAULT_CONFIG, parseConfig, type TierflowConfig } from "../src/config.ts";
import { PROTOCOL_VERSION, nextId, type Intent, type IntentMode } from "../src/protocol.ts";
import type { Capability } from "../src/security.ts";

let root = "";
let programsDir = "";
let registry: ProgramRegistry;
let executor: Executor;
let router: Router;
let config: TierflowConfig;

function makeIntent(text: string, mode: IntentMode): Intent {
  return {
    version: PROTOCOL_VERSION,
    id: nextId("intent"),
    sessionId: "capability-test",
    text,
    mode,
    at: Date.now(),
    traceId: nextId("trace"),
  };
}

function caps(...allowed: Capability[]): ReadonlySet<Capability> {
  return new Set(allowed);
}

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "tierflow-capability-"));
  programsDir = join(root, "programs");
  config = parseConfig({ ...DEFAULT_CONFIG });
  const bus = new EventBus(2000);
  const traces = new TraceStore(100);

  registry = new ProgramRegistry(programsDir, bus, "capability-test");
  await registry.loadAll();

  executor = new Executor({
    bus,
    sessionId: "capability-test",
    workRoot: root,
    config: { get: (): TierflowConfig => config },
  });

  router = new Router({
    bus,
    executor,
    registry,
    config: { get: (): TierflowConfig => config },
    traces,
    sessionId: "capability-test",
    workRoot: root,
  });
});

afterAll(async () => {
  await executor.stopAll("capability-test-end");
  registry.close();
  await rm(root, { recursive: true, force: true });
});

describe("router capability gating", () => {
  test("no capability set keeps local callers trusted", async () => {
    const result = await router.handle(makeIntent("!run bun --version", "run"));
    expect(result.plan.steps.length).toBe(1);
    expect(result.results[0]?.state).toBe("succeeded");
  }, 30_000);

  test("read-only capability refuses !run and spawns nothing", async () => {
    const result = await router.handle(makeIntent("!run bun --version", "run"), caps("read"));
    expect(result.plan.steps.length).toBe(0);
    expect(result.results.length).toBe(0);
    expect(result.reply).toContain("exec");
  }, 30_000);

  test("!design needs program.write as well as exec", async () => {
    const result = await router.handle(
      makeIntent("!design gated :: bun --version", "design"),
      caps("read", "exec"),
    );
    expect(result.plan.steps.length).toBe(0);
    expect(result.reply).toContain("program.write");
    expect(existsSync(join(programsDir, "gated.program.ts"))).toBe(false);
  }, 30_000);

  test("!design runs when both capabilities are present", async () => {
    const result = await router.handle(
      makeIntent("!design allowed :: bun --version", "design"),
      caps("read", "exec", "program.write"),
    );
    expect(result.plan.steps.length).toBe(1);
    expect(result.results[0]?.state).toBe("succeeded");
    expect(existsSync(join(programsDir, "allowed.program.ts"))).toBe(true);
  }, 30_000);

  test("plain chat needs no capability", async () => {
    const result = await router.handle(makeIntent("hello", "chat"), caps("read"));
    expect(result.plan.steps.length).toBe(0);
    expect(result.reply.length).toBeGreaterThan(0);
  }, 30_000);

  test("a matched program requires exec", async () => {
    const result = await router.handle(makeIntent("allowed", "chat"), caps("read"));
    expect(result.plan.steps.length).toBe(0);
    expect(result.reply).toContain("exec");
  }, 30_000);
});

describe("registry write guard", () => {
  test("a refused write leaves the program directory untouched", async () => {
    const guardedDir = join(root, "guarded-programs");
    const bus = new EventBus(100);
    const guarded = new ProgramRegistry(guardedDir, bus, "capability-test", () => false);
    await guarded.loadAll();

    await expect(guarded.write("nope", "export default () => [];")).rejects.toThrow(
      /program write denied/,
    );
    expect(existsSync(join(guardedDir, "nope.program.ts"))).toBe(false);
    guarded.close();
  });
});
