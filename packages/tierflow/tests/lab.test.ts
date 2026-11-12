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
      b: { name: "b" },
    });

    expect(path.startsWith(join(root, "lab", "results"))).toBe(true);
    expect(existsSync(path)).toBe(true);

    const saved = JSON.parse(await readFile(path, "utf8")) as {
      id: string;
      scenario: string;
      verdict: string;
    };
    expect(saved.id).toBe(report.id);
    expect(saved.scenario).toBe("chat");
    expect(typeof saved.verdict).toBe("string");
  }, 60_000);
});
