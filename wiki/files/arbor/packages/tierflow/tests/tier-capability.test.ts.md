# File: packages/tierflow/tests/tier-capability.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/tier-capability.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 4902 B |
| Lines | 140 |
| Hash | d90f48311cd7 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | variable | 23 | no | let root = &quot;&quot;; |
| programsDir | variable | 24 | no | let programsDir = &quot;&quot;; |
| registry | variable | 25 | no | let registry: ProgramRegistry; |
| executor | variable | 26 | no | let executor: Executor; |
| router | variable | 27 | no | let router: Router; |
| config | variable | 28 | no | let config: TierflowConfig; |
| makeIntent | function | 30 | no | function makeIntent(text: string, mode: IntentMode): Intent { |
| caps | function | 42 | no | function caps(...allowed: Capability[]): ReadonlySet&lt;Capability&gt; { |
| bus | const | 50 | no | const bus = new EventBus(2000); |
| traces | const | 51 | no | const traces = new TraceStore(100); |
| result | const | 82 | no | const result = await router.handle(makeIntent(&quot;!run bun --version&quot;, &quot;run&quot;)); |
| result | const | 88 | no | const result = await router.handle(makeIntent(&quot;!run bun --version&quot;, &quot;run&quot;), caps(&quot;read&quot;)); |
| result | const | 95 | no | const result = await router.handle( makeIntent(&quot;!design gated :: bun --version&quot;, &quot;design&quot;), caps(&quot;read&quot;, &quot;exec&quot;), ); |
| result | const | 105 | no | const result = await router.handle( makeIntent(&quot;!design allowed :: bun --version&quot;, &quot;design&quot;), caps(&quot;read&quot;, &quot;exec&quot;, &quot;program.write&quot;), ); |
| result | const | 115 | no | const result = await router.handle(makeIntent(&quot;hello&quot;, &quot;chat&quot;), caps(&quot;read&quot;)); |
| result | const | 121 | no | const result = await router.handle(makeIntent(&quot;allowed&quot;, &quot;chat&quot;), caps(&quot;read&quot;)); |
| guardedDir | const | 129 | no | const guardedDir = join(root, &quot;guarded-programs&quot;); |
| bus | const | 130 | no | const bus = new EventBus(100); |
| guarded | const | 131 | no | const guarded = new ProgramRegistry(guardedDir, bus, &quot;capability-test&quot;, () =&gt; false); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 9 | external |
| node:fs | import | 10 | external |
| node:fs/promises | import | 11 | external |
| node:os | import | 12 | external |
| node:path | import | 13 | external |
| ../src/bus.ts | import | 14 | [packages/tierflow/src/bus.ts](../src/bus.ts.md) |
| ../src/tier3/executor.ts | import | 15 | [packages/tierflow/src/tier3/executor.ts](../src/tier3/executor.ts.md) |
| ../src/tier2/router.ts | import | 16 | [packages/tierflow/src/tier2/router.ts](../src/tier2/router.ts.md) |
| ../src/registry.ts | import | 17 | [packages/tierflow/src/registry.ts](../src/registry.ts.md) |
| ../src/observability.ts | import | 18 | [packages/tierflow/src/observability.ts](../src/observability.ts.md) |
| ../src/config.ts | import | 19 | [packages/tierflow/src/config.ts](../src/config.ts.md) |
| ../src/protocol.ts | import | 20 | [packages/tierflow/src/protocol.ts](../src/protocol.ts.md) |
| ../src/security.ts | import | 21 | [packages/tierflow/src/security.ts](../src/security.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 141 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
