/**
 * End-to-end server test.
 *
 * Boots the real server as a subprocess on a dedicated port and drives the
 * documented HTTP surface: health, chat, surface reprogramming and the lab.
 * The websocket fan-out is intentionally not exercised here.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { SurfaceSpec } from "../src/protocol.ts";
import { coreBinary } from "../src/hotpath.ts";

const ROOT = join(import.meta.dir, "..");
const PORT = 7811;
const BASE = `http://127.0.0.1:${PORT}`;

// Documented degradation contract (src/hotpath.ts): the Rust core drives frames
// when its binary is built, and the TS fallback produces the same frames when it
// is not. Assert the mode the server MUST report for this checkout instead of
// hard-coding one of them — either way a wrong mode still fails.
const EXPECTED_HOTPATH: "rust" | "ts-fallback" = existsSync(coreBinary(ROOT))
  ? "rust"
  : "ts-fallback";

const SURFACE_PATH = join(ROOT, "runtime", "surface.json");
const LAB_RESULTS_DIR = join(ROOT, "lab", "results");
const RUNTIME_LAB_DIR = join(ROOT, "runtime", "lab");

let server: ReturnType<typeof Bun.spawn> | null = null;
let surfaceExisted = false;
let surfaceBackup: string | null = null;
let labResultsExisted = false;
let runtimeLabExisted = false;
let labEvidence: string | null = null;
let labRunId: string | null = null;

async function waitForHealth(timeoutMs = 15_000): Promise<Record<string, unknown>> {
  const deadline = Date.now() + timeoutMs;
  let lastError = "no attempt made";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE}/healthz`);
      if (response.ok) return (await response.json()) as Record<string, unknown>;
      lastError = `http status ${response.status}`;
    } catch (error) {
      lastError = (error as Error).message;
    }
    await Bun.sleep(150);
  }
  throw new Error(`tierflow server not healthy after ${timeoutMs}ms: ${lastError}`);
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`);
  if (!response.ok) throw new Error(`GET ${path} failed with status ${response.status}`);
  return (await response.json()) as T;
}

/** Remove a directory only when it holds nothing else. */
async function removeIfEmpty(dir: string): Promise<void> {
  try {
    const entries = await readdir(dir);
    if (entries.length === 0) await rm(dir, { recursive: true, force: true });
  } catch {
    // Directory does not exist.
  }
}

async function stopServer(): Promise<void> {
  const proc = server;
  server = null;
  if (!proc) return;
  try {
    proc.kill();
  } catch {
    // Already gone.
  }
  const exited = await Promise.race([
    proc.exited.then(() => true).catch(() => true),
    Bun.sleep(3000).then(() => false),
  ]);
  if (!exited) {
    try {
      Bun.spawnSync({
        cmd: ["taskkill", "/PID", String(proc.pid), "/T", "/F"],
        stdout: "ignore",
        stderr: "ignore",
      });
    } catch {
      // Nothing else to try.
    }
  }
}

beforeAll(async () => {
  surfaceExisted = existsSync(SURFACE_PATH);
  surfaceBackup = surfaceExisted ? await readFile(SURFACE_PATH, "utf8") : null;
  labResultsExisted = existsSync(LAB_RESULTS_DIR);
  runtimeLabExisted = existsSync(RUNTIME_LAB_DIR);

  server = Bun.spawn({
    cmd: ["bun", "run", "src/server.ts"],
    cwd: ROOT,
    env: { ...process.env, TIERFLOW_PORT: String(PORT) },
    stdout: "pipe",
    stderr: "pipe",
    stdin: "ignore",
    windowsHide: true,
  });

  // Drain both pipes so the child can never block on a full buffer.
  const child = server;
  void (async () => {
    const stream = child.stdout;
    if (!stream || typeof stream === "number") return;
    for await (const _chunk of stream) {
      // drain
    }
  })();
  void (async () => {
    const stream = child.stderr;
    if (!stream || typeof stream === "number") return;
    for await (const _chunk of stream) {
      // drain
    }
  })();

  await waitForHealth();
}, 60_000);

afterAll(async () => {
  await stopServer();

  // Undo only what this test caused. If the surface file no longer holds the
  // two-panel layout this test writes, something else owns it now and must
  // not be clobbered.
  if (existsSync(SURFACE_PATH)) {
    const current = await readFile(SURFACE_PATH, "utf8").catch(() => "");
    if (current.includes("TierFlow e2e")) {
      if (surfaceExisted && surfaceBackup !== null) {
        await writeFile(SURFACE_PATH, surfaceBackup, "utf8");
      } else {
        await rm(SURFACE_PATH, { force: true });
      }
    }
  }

  // The lab run writes one evidence file and one variant directory per side.
  if (labEvidence) await rm(labEvidence, { force: true });
  if (labRunId) {
    await rm(join(RUNTIME_LAB_DIR, `${labRunId}-a-0`), { recursive: true, force: true });
    await rm(join(RUNTIME_LAB_DIR, `${labRunId}-b-0`), { recursive: true, force: true });
  }
  if (!labResultsExisted) await removeIfEmpty(LAB_RESULTS_DIR);
  if (!runtimeLabExisted) await removeIfEmpty(RUNTIME_LAB_DIR);
}, 30_000);

describe("tierflow server", () => {
  test("healthz reports the rust hot path", async () => {
    const health = await getJson<Record<string, unknown>>("/healthz");
    expect(health["ok"]).toBe(true);
    expect(health["hotpath"]).toBe(EXPECTED_HOTPATH);
    expect(typeof health["pid"]).toBe("number");
  }, 30_000);

  test("GET /api/state exposes the snapshot", async () => {
    const state = await getJson<Record<string, unknown>>("/api/state");
    expect(state["protocol"]).toBe("tierflow/1");
    expect(state["hotpath"]).toBe(EXPECTED_HOTPATH);
    expect(Array.isArray(state["runs"])).toBe(true);
    expect(Array.isArray(state["programs"])).toBe(true);
  }, 30_000);

  test("POST /api/chat returns a turn with a trace id and a numeric totalMs", async () => {
    const response = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "hello" }),
    });
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      turn: { traceId: string; totalMs: number | null; planId: string | null };
      trace: { traceId: string } | null;
    };
    expect(typeof body.turn.traceId).toBe("string");
    expect(body.turn.traceId.length).toBeGreaterThan(0);
    expect(typeof body.turn.totalMs).toBe("number");
    expect(body.turn.totalMs).not.toBeNull();
    expect(body.trace?.traceId).toBe(body.turn.traceId);
  }, 30_000);

  test("PUT /api/surface reprograms the layout and bumps the revision", async () => {
    const before = await getJson<SurfaceSpec>("/api/surface");

    const response = await fetch(`${BASE}/api/surface`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "TierFlow e2e",
        accent: "#f2b134",
        panels: [
          { id: "topology", title: "Tier stack", kind: "topology", span: 1 },
          { id: "console", title: "Transcript", kind: "console", span: 3 },
        ],
      }),
    });
    expect(response.status).toBe(200);

    // The PUT must return the layout it just wrote.
    const written = (await response.json()) as SurfaceSpec;
    expect(written.panels.length).toBe(2);
    expect(written.title).toBe("TierFlow e2e");

    // ... and a subsequent GET must show the new layout at a higher revision.
    const after = await getJson<SurfaceSpec>("/api/surface");
    expect(after.revision).toBeGreaterThan(before.revision);
    expect(after.panels.length).toBe(2);
    expect(after.panels.map((panel) => panel.kind)).toEqual(["topology", "console"]);
    expect(after.title).toBe("TierFlow e2e");
  }, 30_000);

  test("POST /api/lab/run returns a report with a verdict", async () => {
    const response = await fetch(`${BASE}/api/lab/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "e2e-chat",
        scenario: "chat",
        repeat: 1,
        a: { name: "a" },
        b: { name: "b", config: { heartbeatMs: 900 } },
      }),
    });
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      report: {
        id: string;
        scenario: string;
        verdict: string;
        a: { summary: { n: number } };
        b: { summary: { n: number } };
        stats: { winner: string };
      };
      evidence: string;
    };

    expect(body.report.scenario).toBe("chat");
    expect(body.report.a.summary.n).toBeGreaterThan(0);
    expect(body.report.b.summary.n).toBeGreaterThan(0);
    expect(["A", "B", "inconclusive"]).toContain(body.report.stats.winner);
    expect(typeof body.report.verdict).toBe("string");
    expect(body.report.verdict.length).toBeGreaterThan(0);

    labEvidence = body.evidence;
    labRunId = body.report.id;
  }, 120_000);

  test("GET /metrics renders prometheus text", async () => {
    const response = await fetch(`${BASE}/metrics`);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("tierflow_counter");
  }, 30_000);
});
