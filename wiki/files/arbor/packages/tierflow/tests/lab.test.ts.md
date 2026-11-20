# File: packages/tierflow/tests/lab.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/lab.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 3165 B |
| Lines | 96 |
| Hash | ce9a689be4ab |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | variable | 15 | no | let root = &quot;&quot;; |
| lab | variable | 16 | no | let lab: Lab; |
| report | const | 39 | no | const report = await lab.run({ name: &quot;t&quot;, scenario: &quot;chat&quot;, repeat: 1, a: { name: &quot;a&quot; }, |
| report | const | 62 | no | const report = await lab.run({ name: &quot;isolation&quot;, scenario: &quot;chat&quot;, repeat: 1, a: { name: &quot;a&quot; }, |
| saved | const | 87 | no | const saved = JSON.parse(await readFile(path, &quot;utf8&quot;)) as { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 8 | external |
| node:fs | import | 9 | external |
| node:fs/promises | import | 10 | external |
| node:os | import | 11 | external |
| node:path | import | 12 | external |
| ../src/lab.ts | import | 13 | [packages/tierflow/src/lab.ts](../src/lab.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Lab contract tests.
 *
 * The lab is the experimentation seam: each variant gets an isolated stack, so
 * a result is reproducible and the evidence is persisted to disk.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Lab, SCENARIOS } from "../src/lab.ts";

let root = "";
let lab: Lab;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "tierflow-lab-"));
  lab = new Lab({ root, baseProgramDir: join(root, "programs") });
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("SCENARIOS", () => {
  test("covers the documented workloads", () => {
    for (const name of ["chat", "exec", "inspect", "sim", "design"]) {
      expect(SCENARIOS[name]).toBeDefined();
      expect(SCENARIOS[name]?.intents.length).toBeGreaterThan(0);
      expect(SCENARIOS[name]?.metric).toBeDefined();
    }
  });
});

describe("Lab", () => {
  test("runs a chat experiment and samples both variants", async () => {
    const report = await lab.run({
      name: "t",
      scenario: "chat",
      repeat: 1,
      a: { name: "a" },
      b: { name: "b", config: { heartbeatMs: 900 } },
    });

    expect(report.experiment).toBe("t");
    expect(report.scenario).toBe("chat");
    expect(report.repeat).toBe(1);
    expect(report.a.summary.n).toBeGreaterThan(0);
    expect(report.b.summary.n).toBeGreaterThan(0);
    expect(report.a.error).toBeNull();
    expect(report.b.error).toBeNull();
    expect(typeof report.verdict).toBe("string");
    expect(report.verdict.length).toBeGreaterThan(0);
    expect(report.stats.winner === "A" || report.stats.winner === "B" || report.stats.winner === "inconclusive").toBe(true);
    expect(report.a.events).toBeGreaterThan(0);
    expect(report.b.events).toBeGreaterThan(0);
  }, 60_000);

  test("keeps the two variants isolated from each other", async () => {
    const report = await lab.run({
      name: "isolation",
      scenario: "chat",
      repeat: 1,
      a: { name: "a" },
      b: { name: "b" },
    });
    expect(report.a.variant).toBe("a");
    expect(report.b.variant).toBe("b");
    expect(report.a.samples.length).toBe(report.a.summary.n);
    expect(report.b.samples.length).toBe(report.b.summary.n);
  }, 60_000);

  test("runAndPersist writes evidence under lab/results", async () => {
    const { report, path } = await lab.runAndPersist({
      name: "t-persist",
      scenario: "chat",
      repeat: 1,
      a: { name: "a" },
```

_First 80 of 97 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
