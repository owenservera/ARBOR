# File: packages/tierflow/tests/router.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/router.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 6080 B |
| Lines | 167 |
| Hash | 3301301ddafc |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | variable | 23 | no | let root = &quot;&quot;; |
| programsDir | variable | 24 | no | let programsDir = &quot;&quot;; |
| registry | variable | 25 | no | let registry: ProgramRegistry; |
| router | variable | 26 | no | let router: Router; |
| executor | variable | 27 | no | let executor: Executor; |
| makeIntent | function | 29 | no | function makeIntent(text: string, mode: IntentMode): Intent { |
| config | const | 44 | no | const config = parseConfig({ ...DEFAULT_CONFIG }); |
| bus | const | 45 | no | const bus = new EventBus(2000); |
| traces | const | 46 | no | const traces = new TraceStore(100); |
| cut | const | 103 | no | const cut = truncate(&quot;x&quot;.repeat(60), 10); |
| result | const | 115 | no | const result = await router.handle(makeIntent(&quot;!run bun --version&quot;, &quot;run&quot;)); |
| name | const | 127 | no | const name = &quot;demo-prog&quot;; |
| result | const | 128 | no | const result = await router.handle(makeIntent(`!design ${name} :: bun --version`, &quot;design&quot;)); |
| loaded | const | 133 | no | const loaded = registry.find(name); |
| result | const | 145 | no | const result = await router.handle(makeIntent(&quot;hello&quot;, &quot;chat&quot;)); |
| result | const | 153 | no | const result = await router.handle(makeIntent(&quot;!maintain&quot;, &quot;maintain&quot;)); |
| result | const | 159 | no | const result = await router.handle(makeIntent(&quot;!sim 200 1&quot;, &quot;simulate&quot;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 10 | external |
| node:fs | import | 11 | external |
| node:fs/promises | import | 12 | external |
| node:os | import | 13 | external |
| node:path | import | 14 | external |
| ../src/bus.ts | import | 15 | [packages/tierflow/src/bus.ts](../src/bus.ts.md) |
| ../src/tier3/executor.ts | import | 16 | [packages/tierflow/src/tier3/executor.ts](../src/tier3/executor.ts.md) |
| ../src/tier2/router.ts | import | 17 | [packages/tierflow/src/tier2/router.ts](../src/tier2/router.ts.md) |
| ../src/registry.ts | import | 18 | [packages/tierflow/src/registry.ts](../src/registry.ts.md) |
| ../src/observability.ts | import | 19 | [packages/tierflow/src/observability.ts](../src/observability.ts.md) |
| ../src/config.ts | import | 20 | [packages/tierflow/src/config.ts](../src/config.ts.md) |
| ../src/protocol.ts | import | 21 | [packages/tierflow/src/protocol.ts](../src/protocol.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 168 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
