/**
 * Backend-owned UI surface.
 *
 * The frontend does not decide its own layout. It receives a `SurfaceSpec`
 * over the websocket and renders the panels the backend declares. Editing
 * `runtime/surface.json` (or `PUT /api/surface`) reconfigures the live UI in
 * one frame — this is the backend→frontend half of "instantly reprogrammable".
 *
 * Panels are a closed vocabulary: the UI owns how each kind renders, the
 * backend owns which kinds exist, their order, titles and weight.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { watch, type FSWatcher } from "node:fs";
import { dirname, join } from "node:path";
import { PROTOCOL_VERSION, type PanelKind, type PanelSpec, type SurfaceSpec } from "./protocol.ts";
import type { EventBus } from "./bus.ts";

export const PANEL_KINDS: readonly PanelKind[] = ["topology", "timeline", "runs", "console", "programs", "metrics"];

const PANEL_KIND_SET: ReadonlySet<string> = new Set(PANEL_KINDS);

export function defaultSurface(): SurfaceSpec {
  return {
    version: PROTOCOL_VERSION,
    revision: 1,
    title: "TierFlow",
    accent: "#f2b134",
    panels: [
      { id: "topology", title: "Tier stack", kind: "topology", span: 1 },
      { id: "timeline", title: "Execution timeline", kind: "timeline", span: 2 },
      { id: "runs", title: "Runs", kind: "runs", span: 1 },
      { id: "console", title: "Transcript", kind: "console", span: 3 },
      { id: "programs", title: "Programs", kind: "programs", span: 1 },
      { id: "metrics", title: "Hot path", kind: "metrics", span: 2 },
    ],
    updatedAt: Date.now(),
    source: "default",
  };
}

export function parseSurface(input: unknown, revision: number): SurfaceSpec | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  if (!Array.isArray(raw["panels"])) return null;

  const panels: PanelSpec[] = [];
  for (const entry of raw["panels"]) {
    if (typeof entry !== "object" || entry === null) continue;
    const panel = entry as Record<string, unknown>;
    const kind = panel["kind"];
    if (typeof kind !== "string" || !PANEL_KIND_SET.has(kind)) continue;
    const id = typeof panel["id"] === "string" ? panel["id"] : `${kind}-${panels.length}`;
    const title = typeof panel["title"] === "string" ? panel["title"] : kind;
    const spanRaw = typeof panel["span"] === "number" ? panel["span"] : 1;
    panels.push({
      id,
      title,
      kind: kind as PanelKind,
      span: Math.min(4, Math.max(1, Math.round(spanRaw))),
      collapsed: panel["collapsed"] === true,
    });
  }
  if (panels.length === 0) return null;

  return {
    version: PROTOCOL_VERSION,
    revision,
    title: typeof raw["title"] === "string" ? raw["title"] : "TierFlow",
    accent: typeof raw["accent"] === "string" ? raw["accent"] : "#f2b134",
    panels,
    updatedAt: Date.now(),
    source: "file",
  };
}

export type SurfaceListener = (surface: SurfaceSpec) => void;

export class SurfaceStore {
  #file: string;
  #bus: EventBus;
  #sessionId: string;
  #surface: SurfaceSpec = defaultSurface();
  #revision = 1;
  #listeners = new Set<SurfaceListener>();
  #watcher: FSWatcher | null = null;
  #timer: ReturnType<typeof setTimeout> | null = null;

  constructor(file: string, bus: EventBus, sessionId: string) {
    this.#file = file;
    this.#bus = bus;
    this.#sessionId = sessionId;
  }

  get current(): SurfaceSpec {
    return this.#surface;
  }

  onSurface(listener: SurfaceListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  async load(): Promise<SurfaceSpec> {
    try {
      const text = await readFile(this.#file, "utf8");
      const parsed = parseSurface(JSON.parse(text), this.#nextRevision());
      if (parsed) this.#commit(parsed, "boot");
    } catch {
      // Missing or invalid file: the default surface is the safe fallback.
      this.#commit({ ...defaultSurface(), revision: this.#nextRevision() }, "boot");
    }
    this.#watch();
    return this.#surface;
  }

  async write(input: unknown): Promise<SurfaceSpec> {
    const parsed = parseSurface(input, this.#nextRevision());
    if (!parsed) throw new Error("invalid surface: expected { title?, accent?, panels:[{kind,title,id?,span?}] }");
    await mkdir(dirname(this.#file), { recursive: true });
    await writeFile(this.#file, JSON.stringify({ title: parsed.title, accent: parsed.accent, panels: parsed.panels }, null, 2), "utf8");
    this.#commit(parsed, "api");
    return parsed;
  }

  #nextRevision(): number {
    this.#revision += 1;
    return this.#revision;
  }

  #commit(surface: SurfaceSpec, reason: "boot" | "watch" | "api"): void {
    this.#surface = surface;
    this.#bus.emit({
      tier: 2,
      type: "surface.updated",
      sessionId: this.#sessionId,
      text: `${surface.title} · ${surface.panels.length} panels · rev ${surface.revision}`,
      data: { reason, panels: surface.panels.length, revision: surface.revision, source: surface.source },
    });
    for (const listener of this.#listeners) {
      try {
        listener(surface);
      } catch {
        // Subscriber isolation.
      }
    }
  }

  #watch(): void {
    if (this.#watcher) return;
    try {
      this.#watcher = watch(dirname(this.#file), { persistent: false }, (_event, filename) => {
        if (!filename || !filename.endsWith("surface.json")) return;
        if (this.#timer) clearTimeout(this.#timer);
        this.#timer = setTimeout(() => {
          void this.load();
        }, 80);
      });
    } catch {
      // Non-fatal: API writes still reprogram the surface.
    }
  }

  close(): void {
    this.#watcher?.close();
    this.#watcher = null;
    if (this.#timer) clearTimeout(this.#timer);
  }
}

export function surfaceFile(root: string): string {
  return join(root, "runtime", "surface.json");
}
