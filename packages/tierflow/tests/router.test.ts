/**
 * Tier 2 router contract tests.
 *
 * The router owns two things worth pinning: the argv tokenizer (never a shell
 * string) and the dispatch of the builtin modes. `!design` is the interesting
 * one — it writes a Tier-2 policy module to disk, hot-loads it and executes it
 * in the same turn, with no restart.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EventBus } from "../src/bus.ts";
import { Executor } from "../src/tier3/executor.ts";
import { Router, tokenize, truncate } from "../src/tier2/router.ts";
import { ProgramRegistry } from "../src/registry.ts";
import { TraceStore } from "../src/observability.ts";
import { DEFAULT_CONFIG, parseConfig, type TierflowConfig } from "../src/config.ts";
import { PROTOCOL_VERSION, nextId, type Intent, type IntentMode } from "../src/protocol.ts";

let root = "";
let programsDir = "";
let registry: ProgramRegistry;
let router: Router;
let executor: Executor;

function makeIntent(text: string, mode: IntentMode): Intent {
  return {
    version: PROTOCOL_VERSION,
    id: nextId("intent"),
    sessionId: "router-test",
    text,
    mode,
    at: Date.now(),
    traceId: nextId("trace"),
  };
}

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "tierflow-router-"));
  programsDir = join(root, "programs");
  const config = parseConfig({ ...DEFAULT_CONFIG });
  const bus = new EventBus(2000);
  const traces = new TraceStore(100);

  registry = new ProgramRegistry(programsDir, bus, "router-test");
  await registry.loadAll();

  executor = new Executor({
    bus,
    sessionId: "router-test",
    workRoot: root,
    config: { get: (): TierflowConfig => config },
  });

  router = new Router({
    bus,
    executor,
    registry,
    config: { get: (): TierflowConfig => config },
    traces,
    sessionId: "router-test",
    workRoot: root,
  });
});

afterAll(async () => {
  await executor.stopAll("router-test-end");
  registry.close();
  await rm(root, { recursive: true, force: true });
});

describe("tokenize", () => {
  test("keeps a quoted argument as one token", () => {
    expect(tokenize('git commit -m "hello world"')).toEqual(["git", "commit", "-m", "hello world"]);
  });

  test("handles single quotes and empty quoted arguments", () => {
    expect(tokenize("echo 'a b'")).toEqual(["echo", "a b"]);
    expect(tokenize('echo ""')).toEqual(["echo", ""]);
  });

  test("collapses repeated whitespace and drops empty input", () => {
    expect(tokenize("  bun   --version  ")).toEqual(["bun", "--version"]);
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   ")).toEqual([]);
  });

  test("does not perform shell expansion", () => {
    expect(tokenize("echo $HOME")).toEqual(["echo", "$HOME"]);
    expect(tokenize("echo *")).toEqual(["echo", "*"]);
  });
});

describe("truncate", () => {
  test("collapses whitespace", () => {
    expect(truncate("a   b\n c", 48)).toBe("a b c");
  });

  test("cuts long values with an ellipsis and keeps the requested width", () => {
    const cut = truncate("x".repeat(60), 10);
    expect(cut.length).toBe(10);
    expect(cut.endsWith("…")).toBe(true);
  });

  test("leaves short values untouched", () => {
    expect(truncate("short", 48)).toBe("short");
  });
});

describe("Router", () => {
  test("!run produces a single-step plan that succeeds", async () => {
    const result = await router.handle(makeIntent("!run bun --version", "run"));

    expect(result.plan.steps.length).toBe(1);
    expect(result.plan.steps[0]?.argv).toEqual(["bun", "--version"]);
    expect(result.plan.steps[0]?.kind).toBe("exec");
    expect(result.results.length).toBe(1);
    expect(result.results[0]?.state).toBe("succeeded");
    expect(result.results[0]?.exitCode).toBe(0);
    expect(result.plan.rationale).toContain("bun");
  }, 30_000);

  test("!design writes a program file and runs it, naming it in the rationale", async () => {
    const name = "demo-prog";
    const result = await router.handle(makeIntent(`!design ${name} :: bun --version`, "design"));

    expect(result.plan.rationale).toContain(name);
    expect(existsSync(join(programsDir, `${name}.program.ts`))).toBe(true);

    const loaded = registry.find(name);
    expect(loaded).not.toBeNull();
    expect(loaded?.info.version).toBeGreaterThanOrEqual(1);
    expect(loaded?.info.triggers).toContain(name);

    expect(result.plan.steps.length).toBe(1);
    expect(result.plan.steps[0]?.argv).toEqual(["bun", "--version"]);
    expect(result.results[0]?.state).toBe("succeeded");
    expect(result.reply).toContain(name);
  }, 30_000);

  test("a chat intent produces an empty-step plan with a reply", async () => {
    const result = await router.handle(makeIntent("hello", "chat"));
    expect(result.plan.steps.length).toBe(0);
    expect(result.results.length).toBe(0);
    expect(result.reply.length).toBeGreaterThan(0);
    expect(result.plan.rationale).toBe("builtin chat");
  }, 30_000);

  test("!maintain sweeps the executor without failing the turn", async () => {
    const result = await router.handle(makeIntent("!maintain", "maintain"));
    expect(result.plan.steps.length).toBe(0);
    expect(result.reply.length).toBeGreaterThan(0);
  }, 30_000);

  test("!sim builds a synthetic job with the requested rate and duration", async () => {
    const result = await router.handle(makeIntent("!sim 200 1", "simulate"));
    expect(result.plan.steps.length).toBe(1);
    expect(result.plan.steps[0]?.kind).toBe("sim");
    expect(result.plan.steps[0]?.env?.["rate"]).toBe("200");
    expect(result.plan.steps[0]?.env?.["seconds"]).toBe("1");
    expect(result.plan.steps[0]?.argv).toEqual(["tierflow-sim", "200", "1"]);
    expect(result.results[0]?.state).toBe("succeeded");
  }, 30_000);
});
