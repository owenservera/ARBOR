# File: packages/tierflow/src/cli.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/cli.ts |
| Language | TypeScript |
| Kind | source |
| Size | 3339 B |
| Lines | 91 |
| Hash | fa46618680e1 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 19 | no | const ROOT = import.meta.dir.replace(/[\\\\/]src$/, &quot;&quot;); |
| SESSION | const | 20 | no | const SESSION = `repl_${Date.now().toString(36)}`; |
| config | const | 22 | no | const config = new ConfigStore(ROOT); |
| bus | const | 25 | no | const bus = new EventBus(2000); |
| traces | const | 26 | no | const traces = new TraceStore(200); |
| registry | const | 27 | no | const registry = new ProgramRegistry(programDir(ROOT), bus, SESSION); |
| executor | const | 28 | no | const executor = new Executor({ bus, sessionId: SESSION, workRoot: ROOT, config }); |
| router | const | 29 | no | const router = new Router({ bus, executor, registry, config, traces, sessionId: SESSION, workRoot: ROOT }); |
| agent | const | 30 | no | const agent = new Agent({ bus, router, traces, sessionId: SESSION }); |
| COLORS | const | 33 | no | const COLORS = { |
| rl | const | 58 | no | const rl = createInterface({ input: stdin, output: stdout }); |
| closing | variable | 59 | no | let closing = false; |
| line | const | 72 | no | const line = await rl.question(`${COLORS.amber}tier1&gt;${COLORS.reset} `).catch(() =&gt; null); |
| text | const | 74 | no | const text = line.trim(); |
| started | const | 82 | no | const started = performance.now(); |
| turn | const | 83 | no | const turn = await agent.chat(text); |
| took | const | 84 | no | const took = performance.now() - started; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:readline/promises | import | 9 | external |
| node:process | import | 10 | external |
| ./bus.ts | import | 11 | [packages/tierflow/src/bus.ts](./bus.ts.md) |
| ./config.ts | import | 12 | [packages/tierflow/src/config.ts](./config.ts.md) |
| ./registry.ts | import | 13 | [packages/tierflow/src/registry.ts](./registry.ts.md) |
| ./tier3/executor.ts | import | 14 | [packages/tierflow/src/tier3/executor.ts](./tier3/executor.ts.md) |
| ./tier2/router.ts | import | 15 | [packages/tierflow/src/tier2/router.ts](./tier2/router.ts.md) |
| ./tier1/agent.ts | import | 16 | [packages/tierflow/src/tier1/agent.ts](./tier1/agent.ts.md) |
| ./observability.ts | import | 17 | [packages/tierflow/src/observability.ts](./observability.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 92 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
