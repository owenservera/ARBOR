# File: packages/tierflow/src/server.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/server.ts |
| Language | TypeScript |
| Kind | source |
| Size | 19681 B |
| Lines | 523 |
| Hash | 9a98f3e9b846 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 38 | no | const ROOT = import.meta.dir.replace(/[\\\\/]src$/, &quot;&quot;); |
| WEB_ROOT | const | 39 | no | const WEB_ROOT = join(ROOT, &quot;web&quot;); |
| PORT | const | 40 | no | const PORT = Number(process.env[&quot;TIERFLOW_PORT&quot;] ?? 7717); |
| exposure | const | 46 | no | const exposure = exposureFromEnv(process.env); |
| SESSION | const | 47 | no | const SESSION = `sess_${Date.now().toString(36)}`; |
| STARTED_AT | const | 49 | no | const STARTED_AT = Date.now(); |
| bus | const | 51 | no | const bus = new EventBus(4000); |
| config | const | 52 | no | const config = new ConfigStore(ROOT); |
| traces | const | 53 | no | const traces = new TraceStore(500); |
| metrics | const | 54 | no | const metrics = new Metrics(); |
| surface | const | 58 | no | const surface = new SurfaceStore(surfaceFile(ROOT), bus, SESSION); |
| registry | const | 61 | no | const registry = new ProgramRegistry(programDir(ROOT), bus, SESSION, () =&gt; exposure.config.capabilities.has(&quot;program.write&quot;), ); |
| executor | const | 64 | no | const executor = new Executor({ bus, sessionId: SESSION, workRoot: ROOT, config, |
| router | const | 72 | no | const router = new Router({ bus, executor, registry, config, traces, sessionId: SESSION, workRoot: ROOT }); |
| lab | const | 73 | no | const lab = new Lab({ root: ROOT, baseProgramDir: programDir(ROOT) }); |
| agent | const | 74 | no | const agent = new Agent({ bus, router, traces, sessionId: SESSION }); |
| Client | type | 82 | no | type Client = { send: (data: string) =&gt; void; id: string }; |
| ClientData | type | 83 | no | type ClientData = { clientId: string; capabilities: ReadonlySet&lt;Capability&gt; }; |
| clients | const | 85 | no | const clients = new Map&lt;string, Client&gt;(); |
| pending | variable | 86 | no | let pending: WireMessage[] = []; |
| flushTimer | variable | 87 | no | let flushTimer: ReturnType&lt;typeof setTimeout&gt; \| null = null; |
| dropped | variable | 88 | no | let dropped = 0; |
| broadcast | function | 90 | no | function broadcast(message: WireMessage): void { |
| cfg | const | 92 | no | const cfg = config.get(); |
| payload | const | 94 | no | const payload = JSON.stringify(message); |
| flush | function | 107 | no | function flush(): void { |
| cfg | const | 110 | no | const cfg = config.get(); |
| batch | variable | 111 | no | let batch = pending; |
| payloads | const | 117 | no | const payloads = batch.map((message) =&gt; JSON.stringify(message)); |
| metaTimers | const | 124 | no | const metaTimers = new Map&lt;string, ReturnType&lt;typeof setTimeout&gt;&gt;(); |
| scheduleMeta | function | 125 | no | function scheduleMeta(runId: string): void { |
| meta | const | 131 | no | const meta = executor.state(runId); |
| hotpath | const | 149 | no | const hotpath = new HotPath({ root: ROOT, config, bus, onFrame: (frame) =&gt; { |
| hotpathMode | const | 159 | no | const hotpathMode = hotpath.start(); |
| snapshot | function | 177 | no | function snapshot(): Snapshot { |
| MIME | const | 196 | no | const MIME: Record&lt;string, string&gt; = { |
| json | function | 209 | no | function json(data: unknown, status = 200): Response { |
| server | const | 216 | no | const server = Bun.serve&lt;ClientData&gt;({ hostname: exposure.config.hostname, port: PORT, idleTimeout: 30, async fetch(request, srv) { |
| url | const | 221 | no | const url = new URL(request.url); |
| path | const | 222 | no | const path = url.pathname; |
| requireCapability | function | 225 | no | function requireCapability(capability: Capability): Response \| null { |
| capabilities | const | 233 | no | const capabilities = exposure.capabilitiesFor(request); |
| clientId | const | 237 | no | const clientId = nextId(&quot;client&quot;); |
| upgraded | const | 238 | no | const upgraded = srv.upgrade(request, { data: { clientId, capabilities } }); |
| detailed | const | 243 | no | const detailed = { |
| denied | const | 257 | no | const denied = requireCapability(&quot;read&quot;); |
| denied | const | 265 | no | const denied = requireCapability(&quot;read&quot;); |
| denied | const | 272 | no | const denied = requireCapability(&quot;read&quot;); |
| denied | const | 277 | no | const denied = requireCapability(&quot;read&quot;); |
| denied | const | 282 | no | const denied = requireCapability(&quot;read&quot;); |
| denied | const | 287 | no | const denied = requireCapability(&quot;read&quot;); |
| denied | const | 292 | no | const denied = requireCapability(&quot;read&quot;); |
| denied | const | 298 | no | const denied = requireCapability(&quot;exec&quot;); |
| body | const | 300 | no | const body = (await request.json().catch(() =&gt; ({}))) as { text?: string; message?: string }; |
| text | const | 301 | no | const text = (body.text ?? body.message ?? &quot;&quot;).toString(); |
| turn | const | 303 | no | const turn = await agent.chat(text, { capabilities: exposure.capabilitiesFor(request) }); |
| traceSnapshot | const | 304 | no | const traceSnapshot = traces.get(turn.traceId); |
| denied | const | 311 | no | const denied = requireCapability(&quot;exec&quot;); |
| body | const | 313 | no | const body = (await request.json().catch(() =&gt; ({}))) as Partial&lt;LabExperiment&gt;; |
| denied | const | 329 | no | const denied = requireCapability(&quot;exec&quot;); |
| report | const | 331 | no | const report = await executor.maintain(); |
| denied | const | 336 | no | const denied = requireCapability(&quot;exec&quot;); |
| runId | const | 338 | no | const runId = path.slice(&quot;/api/runs/&quot;.length, -&quot;/stop&quot;.length); |
| meta | const | 339 | no | const meta = await executor.stop(runId, &quot;api&quot;); |
| denied | const | 344 | no | const denied = requireCapability(&quot;program.write&quot;); |
| name | const | 346 | no | const name = decodeURIComponent(path.slice(&quot;/api/programs/&quot;.length)); |
| body | const | 347 | no | const body = (await request.json().catch(() =&gt; ({}))) as { source?: string }; |
| info | const | 352 | no | const info = await registry.write(name, body.source); |
| denied | const | 360 | no | const denied = requireCapability(&quot;surface.write&quot;); |
| spec | const | 363 | no | const spec = await surface.write(await request.json()); |
| denied | const | 371 | no | const denied = requireCapability(&quot;surface.write&quot;); |
| patch | const | 373 | no | const patch = await request.json().catch(() =&gt; ({})); |
| next | const | 374 | no | const next = await config.write(patch); |
| relative | const | 380 | no | const relative = path === &quot;/&quot; ? &quot;index.html&quot; : path.replace(/^\\/+/, &quot;&quot;); |
| resolved | const | 381 | no | const resolved = normalize(join(WEB_ROOT, relative)); |
| file | const | 384 | no | const file = await readFile(resolved); |
| clientId | const | 405 | no | const clientId = ws.data.clientId; |
| message | variable | 414 | no | let message: Record&lt;string, unknown&gt;; |
| op | const | 420 | no | const op = message[&quot;op&quot;]; |
| capabilities | const | 421 | no | const capabilities = ws.data.capabilities; |
| denied | function | 424 | no | function denied(capability: Capability): boolean { |
| text | const | 447 | no | const text = String(message[&quot;text&quot;] ?? &quot;&quot;).trim(); |
| turn | const | 454 | no | const turn = await agent.chat(text, { capabilities }); |
| trace | const | 455 | no | const trace = traces.get(turn.traceId); |
| runId | const | 462 | no | const runId = String(message[&quot;runId&quot;] ?? &quot;&quot;); |
| report | const | 469 | no | const report = await executor.maintain(); |
| rate | const | 481 | no | const rate = Number(message[&quot;rate&quot;] ?? 2000); |
| seconds | const | 482 | no | const seconds = Number(message[&quot;seconds&quot;] ?? 5); |
| turn | const | 483 | no | const turn = await agent.chat(`!sim ${rate} ${seconds}`, { capabilities }); |
| trace | const | 484 | no | const trace = traces.get(turn.traceId); |
| shuttingDown | variable | 508 | no | let shuttingDown = false; |
| shutdown | function | 509 | no | async function shutdown(signal: string): Promise&lt;void&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 23 | external |
| node:fs/promises | import | 24 | external |
| ./protocol.ts | import | 25 | [packages/tierflow/src/protocol.ts](./protocol.ts.md) |
| ./bus.ts | import | 26 | [packages/tierflow/src/bus.ts](./bus.ts.md) |
| ./config.ts | import | 27 | [packages/tierflow/src/config.ts](./config.ts.md) |
| ./surface.ts | import | 28 | [packages/tierflow/src/surface.ts](./surface.ts.md) |
| ./registry.ts | import | 29 | [packages/tierflow/src/registry.ts](./registry.ts.md) |
| ./tier3/executor.ts | import | 30 | [packages/tierflow/src/tier3/executor.ts](./tier3/executor.ts.md) |
| ./tier2/router.ts | import | 31 | [packages/tierflow/src/tier2/router.ts](./tier2/router.ts.md) |
| ./tier1/agent.ts | import | 32 | [packages/tierflow/src/tier1/agent.ts](./tier1/agent.ts.md) |
| ./observability.ts | import | 33 | [packages/tierflow/src/observability.ts](./observability.ts.md) |
| ./hotpath.ts | import | 34 | [packages/tierflow/src/hotpath.ts](./hotpath.ts.md) |
| ./lab.ts | import | 35 | [packages/tierflow/src/lab.ts](./lab.ts.md) |
| ./security.ts | import | 36 | [packages/tierflow/src/security.ts](./security.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * TierFlow server — the only process.
 *
 * HTTP surface:
 *   GET  /                    visualization webapp
 *   GET  /healthz             liveness + hot path mode
 *   GET  /api/state           full snapshot (runs, programs, surface, recent events)
 *   POST /api/chat            { text } -> full turn (intent -> plan -> runs)
 *   GET  /api/runs            run metadata
 *   POST /api/runs/:id/stop   cancel a run
 *   POST /api/maintain        maintenance sweep
 *   GET  /api/programs        hot-swappable Tier-2 programs
 *   PUT  /api/programs/:name  write + hot-load a program (instant reprogramming)
 *   GET  /api/surface         backend-owned UI surface
 *   PUT  /api/surface         reprogram the live UI layout
 *   GET  /api/config          latency knobs
 *   PUT  /api/config          patch latency knobs (hot)
 *   GET  /api/traces          e2e traces with phase deltas
 *   GET  /metrics             Prometheus text
 *   WS   /ws                  live event/plan/run/frame/trace stream
 */

import { join, normalize, extname } from "node:path";
import { readFile } from "node:fs/promises";
import { PROTOCOL, nextId, type Snapshot, type WireMessage } from "./protocol.ts";
import { EventBus } from "./bus.ts";
import { ConfigStore } from "./config.ts";
import { SurfaceStore, surfaceFile } from "./surface.ts";
import { ProgramRegistry, programDir } from "./registry.ts";
import { Executor } from "./tier3/executor.ts";
import { Router } from "./tier2/router.ts";
import { Agent, HELP_TEXT } from "./tier1/agent.ts";
import { Metrics, TraceStore } from "./observability.ts";
import { HotPath } from "./hotpath.ts";
import { Lab, SCENARIOS, type LabExperiment } from "./lab.ts";
import { exposureFromEnv, type Capability } from "./security.ts";

const ROOT = import.meta.dir.replace(/[\\/]src$/, "");
const WEB_ROOT = join(ROOT, "web");
const PORT = Number(process.env["TIERFLOW_PORT"] ?? 7717);
/**
 * Exposure policy. Loopback by default; a non-loopback bind requires an
 * explicit token or the process refuses to start. Tailscale reachability is
 * transport, not authorization, so the token is the application credential.
 */
const exposure = exposureFromEnv(process.env);
const SESSION = `sess_${Date.now().toString(36)}`;
/** Process start, captured once: the snapshot's `startedAt` must not drift per call. */
const STARTED_AT = Date.now();

const bus = new EventBus(4000);
const config = new ConfigStore(ROOT);
const traces = new TraceStore(500);
const metrics = new Metrics();

await config.load();

const surface = new SurfaceStore(surfaceFile(ROOT), bus, SESSION);
await surface.load();

const registry = new ProgramRegistry(programDir(ROOT), bus, SESSION, () =>
  exposure.config.capabilities.has("program.write"),
);
const executor = new Executor({
  bus,
  sessionId: SESSION,
  workRoot: ROOT,
  config,
  onMeta: (meta) => scheduleMeta(meta.runId),
});

const router = new Router({ bus, executor, registry, config, traces, sessionId: SESSION, workRoot: ROOT });
const lab = new Lab({ root: ROOT, baseProgramDir: programDir(ROOT) });
const agent = new Agent({ bus, router, traces, sessionId: SESSION });

await registry.loadAll();

/* ------------------------------------------------------------------ */
/* WebSocket fan-out with bounded coalescing                           */
/* ------------------------------------------------------------------ */
```

_First 80 of 524 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
