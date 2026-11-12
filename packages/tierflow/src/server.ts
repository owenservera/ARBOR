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

type Client = { send: (data: string) => void; id: string };
type ClientData = { clientId: string; capabilities: ReadonlySet<Capability> };

const clients = new Map<string, Client>();
let pending: WireMessage[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let dropped = 0;

function broadcast(message: WireMessage): void {
  if (clients.size === 0) return;
  const cfg = config.get();
  if (cfg.wsFlushMs <= 0) {
    const payload = JSON.stringify(message);
    for (const client of clients.values()) client.send(payload);
    return;
  }
  pending.push(message);
  if (pending.length > cfg.wsMaxBatch * 8) {
    dropped += pending.length - cfg.wsMaxBatch * 8;
    pending = pending.slice(-cfg.wsMaxBatch * 8);
  }
  if (flushTimer) return;
  flushTimer = setTimeout(flush, cfg.wsFlushMs);
}

function flush(): void {
  flushTimer = null;
  if (pending.length === 0) return;
  const cfg = config.get();
  let batch = pending;
  if (batch.length > cfg.wsMaxBatch) {
    dropped += batch.length - cfg.wsMaxBatch;
    batch = batch.slice(-cfg.wsMaxBatch);
  }
  pending = [];
  const payloads = batch.map((message) => JSON.stringify(message));
  for (const client of clients.values()) {
    for (const payload of payloads) client.send(payload);
  }
}

/* Meta coalescing: a fast run must not flood the socket with identical states. */
const metaTimers = new Map<string, ReturnType<typeof setTimeout>>();
function scheduleMeta(runId: string): void {
  if (metaTimers.has(runId)) return;
  metaTimers.set(
    runId,
    setTimeout(() => {
      metaTimers.delete(runId);
      const meta = executor.state(runId);
      if (meta) {
        broadcast({ kind: "run", run: meta });
        if (meta.state !== "queued" && meta.state !== "running") metaTimers.delete(runId);
      }
    }, 100),
  );
}

bus.subscribe((event) => {
  broadcast({ kind: "event", event });
  metrics.inc(`event.${event.type}`);
});

/* ------------------------------------------------------------------ */
/* Hot path (Rust aggregator, TS fallback)                             */
/* ------------------------------------------------------------------ */

const hotpath = new HotPath({
  root: ROOT,
  config,
  bus,
  onFrame: (frame) => {
    metrics.gauge("frame.rate", frame.rate);
    metrics.gauge("frame.p95GapUs", frame.p95GapUs);
    broadcast({ kind: "frame", frame });
  },
});
const hotpathMode = hotpath.start();

surface.onSurface((spec) => broadcast({ kind: "surface", surface: spec }));
registry.onPrograms((programs) => broadcast({ kind: "programs", programs }));
config.onChange((cfg, source) => {
  bus.emit({
    tier: 2,
    type: "system.note",
    sessionId: SESSION,
    text: `config reloaded (${source}): heartbeat ${cfg.heartbeatMs}ms · frame ${cfg.frameTickMs}ms · flush ${cfg.wsFlushMs}ms`,
    data: { heartbeatMs: cfg.heartbeatMs, frameTickMs: cfg.frameTickMs, wsFlushMs: cfg.wsFlushMs },
  });
});

/* ------------------------------------------------------------------ */
/* Snapshot                                                            */
/* ------------------------------------------------------------------ */

function snapshot(): Snapshot {
  return {
    protocol: PROTOCOL,
    pid: process.pid,
    startedAt: STARTED_AT,
    sessionId: SESSION,
    runs: executor.list(),
    recent: bus.recent(200),
    hotpath: hotpathMode,
    counters: bus.counters,
    surface: surface.current,
    programs: registry.list(),
  };
}

/* ------------------------------------------------------------------ */
/* HTTP                                                                */
/* ------------------------------------------------------------------ */

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

const server = Bun.serve<ClientData>({
  hostname: exposure.config.hostname,
  port: PORT,
  idleTimeout: 30,
  async fetch(request, srv) {
    const url = new URL(request.url);
    const path = url.pathname;

    /** Gate a route on a capability. */
    function requireCapability(capability: Capability): Response | null {
      if (exposure.authorize(request, capability)) return null;
      return json({ error: "unauthorized", code: "FORBIDDEN", capability }, 403);
    }

    if (path === "/ws") {
      // Authenticate before the upgrade so an unauthenticated socket never
      // receives a snapshot. The granted capabilities ride with the socket.
      const capabilities = exposure.capabilitiesFor(request);
      if (!capabilities.has("read")) {
        return json({ error: "unauthorized", code: "AUTH_REQUIRED" }, 401);
      }
      const clientId = nextId("client");
      const upgraded = srv.upgrade(request, { data: { clientId, capabilities } });
      return upgraded ? undefined : new Response("upgrade failed", { status: 400 });
    }

    if (path === "/healthz") {
      const detailed = {
        ok: true,
        protocol: PROTOCOL,
        pid: process.pid,
        uptimeMs: Math.round(performance.now()),
        hotpath: hotpathMode,
        programs: registry.size,
        liveRuns: executor.activeCount,
        clients: clients.size,
      };
      return json(exposure.healthPayload(detailed));
    }

    if (path === "/metrics") {
      const denied = requireCapability("read");
      if (denied) return denied;
      return new Response(metrics.render(traces), {
        headers: { "content-type": "text/plain; version=0.0.4; charset=utf-8" },
      });
    }

    if (path === "/api/state" && request.method === "GET") {
      const denied = requireCapability("read");
      if (denied) return denied;
      return json(snapshot());
    }
    if (path === "/api/lab/scenarios") return json(Object.values(SCENARIOS));
    if (path === "/api/lab/results") return json(lab.reports);
    if (path === "/api/traces" && request.method === "GET") {
      const denied = requireCapability("read");
      if (denied) return denied;
      return json(traces.recent(100));
    }
    if (path === "/api/runs" && request.method === "GET") {
      const denied = requireCapability("read");
      if (denied) return denied;
      return json(executor.list());
    }
    if (path === "/api/programs" && request.method === "GET") {
      const denied = requireCapability("read");
      if (denied) return denied;
      return json(registry.list());
    }
    if (path === "/api/surface" && request.method === "GET") {
      const denied = requireCapability("read");
      if (denied) return denied;
      return json(surface.current);
    }
    if (path === "/api/config" && request.method === "GET") {
      const denied = requireCapability("read");
      if (denied) return denied;
      return json(config.get());
    }

    if (path === "/api/chat" && request.method === "POST") {
      const denied = requireCapability("exec");
      if (denied) return denied;
      const body = (await request.json().catch(() => ({}))) as { text?: string; message?: string };
      const text = (body.text ?? body.message ?? "").toString();
      if (text.trim().length === 0) return json({ error: "empty text" }, 400);
      const turn = await agent.chat(text, { capabilities: exposure.capabilitiesFor(request) });
      const traceSnapshot = traces.get(turn.traceId);
      if (traceSnapshot) broadcast({ kind: "trace", trace: traceSnapshot });
      metrics.inc("turn.completed");
      return json({ turn, trace: traceSnapshot });
    }

    if (path === "/api/lab/run" && request.method === "POST") {
      const denied = requireCapability("exec");
      if (denied) return denied;
      const body = (await request.json().catch(() => ({}))) as Partial<LabExperiment>;
      if (!body.scenario || !body.a || !body.b) {
        return json({ error: "expected { name?, scenario, a:{name,config?,programs?}, b:{...}, repeat? }" }, 400);
      }
      const { report, path: saved } = await lab.runAndPersist({
        name: body.name ?? "experiment",
        scenario: body.scenario,
        a: body.a,
        b: body.b,
        repeat: body.repeat ?? 3,
      });
      broadcast({ kind: "note", text: `lab ${report.id}: ${report.verdict}` });
      return json({ report, evidence: saved });
    }

    if (path === "/api/maintain" && request.method === "POST") {
      const denied = requireCapability("exec");
      if (denied) return denied;
      const report = await executor.maintain();
      return json(report);
    }

    if (path.startsWith("/api/runs/") && path.endsWith("/stop") && request.method === "POST") {
      const denied = requireCapability("exec");
      if (denied) return denied;
      const runId = path.slice("/api/runs/".length, -"/stop".length);
      const meta = await executor.stop(runId, "api");
      return json(meta);
    }

    if (path.startsWith("/api/programs/") && request.method === "PUT") {
      const denied = requireCapability("program.write");
      if (denied) return denied;
      const name = decodeURIComponent(path.slice("/api/programs/".length));
      const body = (await request.json().catch(() => ({}))) as { source?: string };
      if (typeof body.source !== "string" || body.source.trim().length === 0) {
        return json({ error: "expected { source: string }" }, 400);
      }
      try {
        const info = await registry.write(name, body.source);
        return json({ program: info });
      } catch (error) {
        return json({ error: (error as Error).message }, 400);
      }
    }

    if (path === "/api/surface" && request.method === "PUT") {
      const denied = requireCapability("surface.write");
      if (denied) return denied;
      try {
        const spec = await surface.write(await request.json());
        return json(spec);
      } catch (error) {
        return json({ error: (error as Error).message }, 400);
      }
    }

    if (path === "/api/config" && request.method === "PUT") {
      const denied = requireCapability("surface.write");
      if (denied) return denied;
      const patch = await request.json().catch(() => ({}));
      const next = await config.write(patch);
      return json(next);
    }

    // Static webapp. Normalize first so `..` cannot escape WEB_ROOT.
    if (request.method === "GET" || request.method === "HEAD") {
      const relative = path === "/" ? "index.html" : path.replace(/^\/+/, "");
      const resolved = normalize(join(WEB_ROOT, relative));
      if (!resolved.startsWith(normalize(WEB_ROOT))) return new Response("forbidden", { status: 403 });
      try {
        const file = await readFile(resolved);
        const type = MIME[extname(resolved).toLowerCase()] ?? "application/octet-stream";
        return new Response(file, { headers: { "content-type": type, "cache-control": "no-store" } });
      } catch {
        if (!path.startsWith("/api")) {
          try {
            return new Response(await readFile(join(WEB_ROOT, "index.html")), {
              headers: { "content-type": MIME[".html"] as string, "cache-control": "no-store" },
            });
          } catch {
            return new Response("webapp not built", { status: 404 });
          }
        }
      }
      return json({ error: "not found", path }, 404);
    }

    return json({ error: "not found", path }, 404);
  },
  websocket: {
    open(ws) {
      const clientId = ws.data.clientId;
      clients.set(clientId, { id: clientId, send: (data) => ws.send(data) });
      ws.send(JSON.stringify({ kind: "hello", snapshot: snapshot() } satisfies WireMessage));
      ws.send(JSON.stringify({ kind: "programs", programs: registry.list() } satisfies WireMessage));
      ws.send(JSON.stringify({ kind: "surface", surface: surface.current } satisfies WireMessage));
      metrics.inc("ws.connected");
      metrics.gauge("ws.clients", clients.size);
    },
    async message(ws, raw) {
      let message: Record<string, unknown>;
      try {
        message = JSON.parse(String(raw)) as Record<string, unknown>;
      } catch {
        return;
      }
      const op = message["op"];
      const capabilities = ws.data.capabilities;

      /** Deny an op the connection is not allowed to perform. */
      function denied(capability: Capability): boolean {
        if (capabilities.has(capability)) return false;
        ws.send(
          JSON.stringify({
            kind: "note",
            text: `denied: ${capability} capability required`,
          } satisfies WireMessage),
        );
        return true;
      }

      if (op === "ping") {
        ws.send(
          JSON.stringify({
            kind: "pong",
            clientTs: Number(message["ts"] ?? 0),
            serverTs: Date.now(),
          } satisfies WireMessage),
        );
        return;
      }

      if (op === "chat") {
        const text = String(message["text"] ?? "").trim();
        if (text.length === 0) return;
        if (text === "!help" || text === "/help") {
          ws.send(JSON.stringify({ kind: "note", text: HELP_TEXT } satisfies WireMessage));
          return;
        }
        if (denied("exec")) return;
        const turn = await agent.chat(text, { capabilities });
        const trace = traces.get(turn.traceId);
        if (trace) ws.send(JSON.stringify({ kind: "trace", trace } satisfies WireMessage));
        return;
      }

      if (op === "stop") {
        if (denied("exec")) return;
        const runId = String(message["runId"] ?? "");
        if (runId) await executor.stop(runId, "ws");
        return;
      }

      if (op === "maintain") {
        if (denied("exec")) return;
        const report = await executor.maintain();
        ws.send(
          JSON.stringify({
            kind: "note",
            text: `maintenance: ${report.checked} checked · ${report.stalled} stalled · ${report.actions.length} actions`,
          } satisfies WireMessage),
        );
        return;
      }

      if (op === "sim") {
        if (denied("exec")) return;
        const rate = Number(message["rate"] ?? 2000);
        const seconds = Number(message["seconds"] ?? 5);
        const turn = await agent.chat(`!sim ${rate} ${seconds}`, { capabilities });
        const trace = traces.get(turn.traceId);
        if (trace) ws.send(JSON.stringify({ kind: "trace", trace } satisfies WireMessage));
        return;
      }
    },
    close(ws) {
      clients.delete(ws.data.clientId);
      metrics.gauge("ws.clients", clients.size);
    },
  },
});

metrics.gauge("ws.clients", 0);
metrics.gauge("runs.live", executor.activeCount);

console.log(
  [
    `tierflow up  http://localhost:${server.port}`,
    `  protocol ${PROTOCOL} · hotpath ${hotpathMode}`,
    `  programs ${registry.size} · surface rev ${surface.current.revision}`,
    `  config heartbeat=${config.get().heartbeatMs}ms frame=${config.get().frameTickMs}ms flush=${config.get().wsFlushMs}ms`,
  ].join("\n"),
);

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\ntierflow shutting down (${signal})`);
  await executor.stopAll(signal);
  hotpath.stop();
  registry.close();
  surface.close();
  config.close();
  server.stop(true);
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
