# File: packages/tierflow/tests/e2e.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/e2e.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 9564 B |
| Lines | 269 |
| Hash | 6908c13bf206 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 16 | no | const ROOT = join(import.meta.dir, &quot;..&quot;); |
| PORT | const | 17 | no | const PORT = 7811; |
| BASE | const | 18 | no | const BASE = `http://127.0.0.1:${PORT}`; |
| EXPECTED_HOTPATH | const | 24 | no | const EXPECTED_HOTPATH: &quot;rust&quot; \| &quot;ts-fallback&quot; = existsSync(coreBinary(ROOT)) |
| SURFACE_PATH | const | 28 | no | const SURFACE_PATH = join(ROOT, &quot;runtime&quot;, &quot;surface.json&quot;); |
| LAB_RESULTS_DIR | const | 29 | no | const LAB_RESULTS_DIR = join(ROOT, &quot;lab&quot;, &quot;results&quot;); |
| RUNTIME_LAB_DIR | const | 30 | no | const RUNTIME_LAB_DIR = join(ROOT, &quot;runtime&quot;, &quot;lab&quot;); |
| server | variable | 32 | no | let server: ReturnType&lt;typeof Bun.spawn&gt; \| null = null; |
| surfaceExisted | variable | 33 | no | let surfaceExisted = false; |
| surfaceBackup | variable | 34 | no | let surfaceBackup: string \| null = null; |
| labResultsExisted | variable | 35 | no | let labResultsExisted = false; |
| runtimeLabExisted | variable | 36 | no | let runtimeLabExisted = false; |
| labEvidence | variable | 37 | no | let labEvidence: string \| null = null; |
| labRunId | variable | 38 | no | let labRunId: string \| null = null; |
| waitForHealth | function | 40 | no | async function waitForHealth(timeoutMs = 15_000): Promise&lt;Record&lt;string, unknown&gt;&gt; { |
| deadline | const | 41 | no | const deadline = Date.now() + timeoutMs; |
| lastError | variable | 42 | no | let lastError = &quot;no attempt made&quot;; |
| response | const | 45 | no | const response = await fetch(`${BASE}/healthz`); |
| getJson | function | 56 | no | async function getJson&lt;T&gt;(path: string): Promise&lt;T&gt; { |
| response | const | 57 | no | const response = await fetch(`${BASE}${path}`); |
| removeIfEmpty | function | 63 | no | async function removeIfEmpty(dir: string): Promise&lt;void&gt; { |
| entries | const | 65 | no | const entries = await readdir(dir); |
| stopServer | function | 72 | no | async function stopServer(): Promise&lt;void&gt; { |
| proc | const | 73 | no | const proc = server; |
| exited | const | 81 | no | const exited = await Promise.race([ proc.exited.then(() =&gt; true).catch(() =&gt; true), Bun.sleep(3000).then(() =&gt; false), ]); |
| child | const | 115 | no | const child = server; |
| stream | const | 117 | no | const stream = child.stdout; |
| stream | const | 124 | no | const stream = child.stderr; |
| current | const | 141 | no | const current = await readFile(SURFACE_PATH, &quot;utf8&quot;).catch(() =&gt; &quot;&quot;); |
| health | const | 163 | no | const health = await getJson&lt;Record&lt;string, unknown&gt;&gt;(&quot;/healthz&quot;); |
| state | const | 170 | no | const state = await getJson&lt;Record&lt;string, unknown&gt;&gt;(&quot;/api/state&quot;); |
| response | const | 178 | no | const response = await fetch(`${BASE}/api/chat`, { method: &quot;POST&quot;, headers: { &quot;content-type&quot;: &quot;application/json&quot; }, body: JSON.stringify({ text: &quot;hello&quot; }), }); |
| body | const | 185 | no | const body = (await response.json()) as { |
| before | const | 197 | no | const before = await getJson&lt;SurfaceSpec&gt;(&quot;/api/surface&quot;); |
| response | const | 199 | no | const response = await fetch(`${BASE}/api/surface`, { method: &quot;PUT&quot;, headers: { &quot;content-type&quot;: &quot;application/json&quot; }, body: JSON.stringify({ title: &quot;TierFlow e2e&quot;, |
| written | const | 214 | no | const written = (await response.json()) as SurfaceSpec; |
| after | const | 219 | no | const after = await getJson&lt;SurfaceSpec&gt;(&quot;/api/surface&quot;); |
| response | const | 227 | no | const response = await fetch(`${BASE}/api/lab/run`, { method: &quot;POST&quot;, headers: { &quot;content-type&quot;: &quot;application/json&quot; }, body: JSON.stringify({ name: &quot;e2e-chat&quot;, |
| body | const | 240 | no | const body = (await response.json()) as { |
| response | const | 264 | no | const response = await fetch(`${BASE}/metrics`); |
| text | const | 266 | no | const text = await response.text(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 9 | external |
| node:fs | import | 10 | external |
| node:fs/promises | import | 11 | external |
| node:path | import | 12 | external |
| ../src/protocol.ts | import | 13 | [packages/tierflow/src/protocol.ts](../src/protocol.ts.md) |
| ../src/hotpath.ts | import | 14 | [packages/tierflow/src/hotpath.ts](../src/hotpath.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 270 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
