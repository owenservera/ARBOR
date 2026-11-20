# File: packages/tierflow/src/surface.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/surface.ts |
| Language | TypeScript |
| Kind | source |
| Size | 6079 B |
| Lines | 173 |
| Hash | 1d34e0246aa7 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PANEL_KINDS | const | 19 | yes | export const PANEL_KINDS: readonly PanelKind[] = [&quot;topology&quot;, &quot;timeline&quot;, &quot;runs&quot;, &quot;console&quot;, &quot;programs&quot;, &quot;metrics&quot;]; |
| PANEL_KIND_SET | const | 21 | no | const PANEL_KIND_SET: ReadonlySet&lt;string&gt; = new Set(PANEL_KINDS); |
| defaultSurface | function | 23 | yes | export function defaultSurface(): SurfaceSpec { |
| parseSurface | function | 42 | yes | export function parseSurface(input: unknown, revision: number): SurfaceSpec \| null { |
| raw | const | 44 | no | const raw = input as Record&lt;string, unknown&gt;; |
| panels | const | 47 | no | const panels: PanelSpec[] = []; |
| panel | const | 50 | no | const panel = entry as Record&lt;string, unknown&gt;; |
| kind | const | 51 | no | const kind = panel[&quot;kind&quot;]; |
| id | const | 53 | no | const id = typeof panel[&quot;id&quot;] === &quot;string&quot; ? panel[&quot;id&quot;] : `${kind}-${panels.length}`; |
| title | const | 54 | no | const title = typeof panel[&quot;title&quot;] === &quot;string&quot; ? panel[&quot;title&quot;] : kind; |
| spanRaw | const | 55 | no | const spanRaw = typeof panel[&quot;span&quot;] === &quot;number&quot; ? panel[&quot;span&quot;] : 1; |
| SurfaceListener | type | 77 | yes | export type SurfaceListener = (surface: SurfaceSpec) =&gt; void; |
| SurfaceStore | class | 79 | yes | export class SurfaceStore { |
| constructor | method | 89 | yes | constructor(file: string, bus: EventBus, sessionId: string) { |
| onSurface | method | 99 | yes | onSurface(listener: SurfaceListener): () =&gt; void { |
| load | method | 104 | yes | async load(): Promise&lt;SurfaceSpec&gt; { |
| text | const | 106 | no | const text = await readFile(this.#file, &quot;utf8&quot;); |
| parsed | const | 107 | no | const parsed = parseSurface(JSON.parse(text), this.#nextRevision()); |
| write | method | 117 | yes | async write(input: unknown): Promise&lt;SurfaceSpec&gt; { |
| parsed | const | 118 | no | const parsed = parseSurface(input, this.#nextRevision()); |
| close | method | 164 | yes | close(): void { |
| surfaceFile | function | 171 | yes | export function surfaceFile(root: string): string { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 13 | external |
| node:fs | import | 14 | external |
| node:path | import | 15 | external |
| ./protocol.ts | import | 16 | [packages/tierflow/src/protocol.ts](./protocol.ts.md) |
| ./bus.ts | import | 17 | [packages/tierflow/src/bus.ts](./bus.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/server.ts](./server.ts.md) | ./surface.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 174 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
