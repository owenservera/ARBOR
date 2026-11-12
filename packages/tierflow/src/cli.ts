/**
 * Tier-1 REPL — talk to the same Agent the webapp talks to.
 *
 * Usage: bun run src/cli.ts
 * Every keystroke is a full trip through all three tiers, so this is the
 * cheapest way to feel the real latency the webapp will show.
 */

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { EventBus } from "./bus.ts";
import { ConfigStore } from "./config.ts";
import { ProgramRegistry, programDir } from "./registry.ts";
import { Executor } from "./tier3/executor.ts";
import { Router } from "./tier2/router.ts";
import { Agent, HELP_TEXT } from "./tier1/agent.ts";
import { TraceStore } from "./observability.ts";

const ROOT = import.meta.dir.replace(/[\\/]src$/, "");
const SESSION = `repl_${Date.now().toString(36)}`;

const config = new ConfigStore(ROOT);
await config.load();

const bus = new EventBus(2000);
const traces = new TraceStore(200);
const registry = new ProgramRegistry(programDir(ROOT), bus, SESSION);
const executor = new Executor({ bus, sessionId: SESSION, workRoot: ROOT, config });
const router = new Router({ bus, executor, registry, config, traces, sessionId: SESSION, workRoot: ROOT });
const agent = new Agent({ bus, router, traces, sessionId: SESSION });
await registry.loadAll();

const COLORS = {
  dim: "\x1b[2m",
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  amber: "\x1b[33m",
  red: "\x1b[31m",
  green: "\x1b[32m",
};

// Live stream: show output lines as they arrive, prefixed by run label.
bus.subscribe((event) => {
  if (event.type === "job.stdout") {
    stdout.write(`${COLORS.dim}  │ ${event.text?.slice(0, 200) ?? ""}${COLORS.reset}\n`);
  } else if (event.type === "job.stderr") {
    stdout.write(`${COLORS.red}  │ ${event.text?.slice(0, 200) ?? ""}${COLORS.reset}\n`);
  } else if (event.type === "system.error") {
    stdout.write(`${COLORS.red}  ! ${event.text ?? ""}${COLORS.reset}\n`);
  } else if (event.type === "program.reloaded" || event.type === "program.loaded") {
    stdout.write(`${COLORS.green}  ↻ program ${event.text ?? ""}${COLORS.reset}\n`);
  }
});

stdout.write(`${COLORS.cyan}TIERFLOW${COLORS.reset} · 3-tier agentic workflow · session ${SESSION}\n`);
stdout.write(`${COLORS.dim}${HELP_TEXT}${COLORS.reset}\n\n`);

const rl = createInterface({ input: stdin, output: stdout });
let closing = false;

rl.on("SIGINT", () => {
  if (closing) return;
  closing = true;
  stdout.write("\n");
  void executor.stopAll("repl-exit").then(() => {
    rl.close();
    process.exit(0);
  });
});

while (!closing) {
  const line = await rl.question(`${COLORS.amber}tier1>${COLORS.reset} `).catch(() => null);
  if (line === null) break;
  const text = line.trim();
  if (text.length === 0) continue;
  if (text === "/quit" || text === "/exit") break;
  if (text === "/help") {
    stdout.write(`${HELP_TEXT}\n`);
    continue;
  }

  const started = performance.now();
  const turn = await agent.chat(text);
  const took = performance.now() - started;
  stdout.write(`\n${COLORS.cyan}T2/T3${COLORS.reset} ${turn.reply}\n`);
  stdout.write(`${COLORS.dim}     plan ${turn.planId ?? "-"} · trace ${turn.traceId} · ${took.toFixed(1)}ms${COLORS.reset}\n\n`);
}

await executor.stopAll("repl-exit");
rl.close();
process.exit(0);
