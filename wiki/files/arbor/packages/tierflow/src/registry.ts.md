# File: packages/tierflow/src/registry.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/registry.ts |
| Language | TypeScript |
| Kind | source |
| Size | 11293 B |
| Lines | 344 |
| Hash | 4f4e5c96ba81 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LoadedProgram | interface | 30 | yes | export interface LoadedProgram { |
| ProgramListener | type | 35 | yes | export type ProgramListener = (programs: readonly ProgramInfo[]) =&gt; void; |
| SOURCE_SUFFIX | const | 37 | no | const SOURCE_SUFFIX = &quot;.program.ts&quot;; |
| words | function | 43 | yes | export function words(text: string): string[] { |
| containsSequence | function | 48 | no | function containsSequence(haystack: readonly string[], needle: readonly string[]): boolean { |
| last | const | 50 | no | const last = haystack.length - needle.length; |
| hit | variable | 52 | no | let hit = true; |
| ProgramRegistry | class | 64 | yes | export class ProgramRegistry { |
| constructor | method | 75 | yes | constructor(dir: string, bus: EventBus, sessionId: string, canWrite?: () =&gt; boolean) { |
| list | method | 86 | yes | list(): ProgramInfo[] { |
| onPrograms | method | 92 | yes | onPrograms(listener: ProgramListener): () =&gt; void { |
| find | method | 97 | yes | find(name: string): LoadedProgram \| null { |
| haystack | const | 111 | no | const haystack = words(text); |
| best | variable | 112 | no | let best: LoadedProgram \| null = null; |
| bestWords | variable | 113 | no | let bestWords = 0; |
| bestLength | variable | 114 | no | let bestLength = -1; |
| needle | const | 117 | no | const needle = words(trigger); |
| length | const | 120 | no | const length = trigger.trim().length; |
| loadAll | method | 131 | yes | async loadAll(): Promise&lt;ProgramInfo[]&gt; { |
| entries | const | 133 | no | const entries = await readdir(this.#dir); |
| reload | method | 143 | yes | async reload(name: string, reason: &quot;boot&quot; \| &quot;watch&quot; \| &quot;api&quot; = &quot;watch&quot;): Promise&lt;ProgramInfo \| null&gt; { |
| file | const | 144 | no | const file = join(this.#dir, `${name}${SOURCE_SUFFIX}`); |
| source | variable | 145 | no | let source: string; |
| hash | const | 153 | no | const hash = createHash(&quot;sha256&quot;).update(source).digest(&quot;hex&quot;).slice(0, 12); |
| previous | const | 154 | no | const previous = this.#programs.get(name); |
| url | const | 158 | no | const url = `${pathToFileURL(file).href}?v=${hash}`; |
| mod | const | 159 | no | const mod = (await import(url)) as { default?: unknown; meta?: unknown }; |
| meta | const | 164 | no | const meta = (mod.meta ?? {}) as Partial&lt;ProgramInfo&gt;; |
| triggers | const | 165 | no | const triggers = Array.isArray(meta.triggers) |
| info | const | 169 | no | const info: ProgramInfo = { |
| info | const | 183 | no | const info: ProgramInfo = { |
| write | method | 206 | yes | async write(name: string, source: string): Promise&lt;ProgramInfo \| null&gt; { |
| run | method | 219 | yes | async run(program: LoadedProgram, intent: Intent): Promise&lt;{ steps: JobSpec[]; error: string \| null }&gt; { |
| jobIndex | variable | 220 | no | let jobIndex = 0; |
| ctx | const | 221 | no | const ctx = { |
| steps | const | 252 | no | const steps = await program.fn(ctx); |
| names | const | 269 | no | const names = [...this.#pending]; |
| close | method | 281 | yes | close(): void { |
| list | const | 288 | no | const list = this.list(); |
| text | const | 304 | no | const text = typeof infoOrText === &quot;string&quot; ? infoOrText : `${infoOrText.name}@${infoOrText.version}`; |
| programDir | function | 321 | yes | export function programDir(root: string): string { |
| programScaffold | function | 325 | yes | export function programScaffold(name: string): string { |
| meta | const | 328 | yes | export const meta = { |
| PROTOCOL_MARKER | const | 344 | yes | export const PROTOCOL_MARKER = PROTOCOL_VERSION; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 15 | external |
| node:fs/promises | import | 16 | external |
| node:fs | import | 17 | external |
| node:path | import | 18 | external |
| node:url | import | 19 | external |
| ./protocol.ts | import | 20 | [packages/tierflow/src/protocol.ts](./protocol.ts.md) |
| ./bus.ts | import | 28 | [packages/tierflow/src/bus.ts](./bus.ts.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/cli.ts](./cli.ts.md) | ./registry.ts |
| [packages/tierflow/src/lab.ts](./lab.ts.md) | ./registry.ts |
| [packages/tierflow/src/server.ts](./server.ts.md) | ./registry.ts |
| [packages/tierflow/src/tier2/router.ts](./tier2/router.ts.md) | ../registry.ts |
| [packages/tierflow/tests/router.test.ts](../tests/router.test.ts.md) | ../src/registry.ts |
| [packages/tierflow/tests/tier-capability.test.ts](../tests/tier-capability.test.ts.md) | ../src/registry.ts |

## Annotations

_No annotations._

## Excerpt

```typescript
/**
 * Hot-swappable Tier-2 policy programs.
 *
 * A program is a tiny ESM module in `runtime/programs/*.program.ts`:
 *
 *   export default ({ text, job }) => [ job({ kind: "exec", label: "...", argv: [...] }) ];
 *
 * Why files instead of a hardcoded if/else chain: the backend must be
 * *instantly reprogrammable*. Editing a file (or PUTting to
 * `/api/programs/:name`) takes effect on the next intent — no restart, no
 * rebuild, no lost in-flight runs. Every swapped module is cache-busted by
 * content hash so Bun never serves a stale evaluation.
 */

import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { watch, type FSWatcher } from "node:fs";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  PROTOCOL_VERSION,
  nextId,
  type Intent,
  type JobSpec,
  type ProgramFn,
  type ProgramInfo,
} from "./protocol.ts";
import type { EventBus } from "./bus.ts";

export interface LoadedProgram {
  readonly info: ProgramInfo;
  readonly fn: ProgramFn;
}

export type ProgramListener = (programs: readonly ProgramInfo[]) => void;

const SOURCE_SUFFIX = ".program.ts";

/**
 * Split text into lowercase word tokens (alphanumeric runs). Used for
 * trigger matching so a trigger only fires on a real word boundary.
 */
export function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** True when `needle` appears as consecutive words inside `haystack`. */
function containsSequence(haystack: readonly string[], needle: readonly string[]): boolean {
  if (needle.length === 0 || needle.length > haystack.length) return false;
  const last = haystack.length - needle.length;
  for (let start = 0; start <= last; start += 1) {
    let hit = true;
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (haystack[start + offset] !== needle[offset]) {
        hit = false;
        break;
      }
    }
    if (hit) return true;
  }
  return false;
}

export class ProgramRegistry {
  #dir: string;
  #bus: EventBus;
  #sessionId: string;
  #programs = new Map<string, LoadedProgram>();
  #listeners = new Set<ProgramListener>();
  #watcher: FSWatcher | null = null;
  #reloadTimer: ReturnType<typeof setTimeout> | null = null;
  #pending = new Set<string>();
  #canWrite: () => boolean;

  constructor(dir: string, bus: EventBus, sessionId: string, canWrite?: () => boolean) {
    this.#dir = dir;
    this.#bus = bus;
    this.#sessionId = sessionId;
    this.#canWrite = canWrite ?? (() => true);
  }
```

_First 80 of 345 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
