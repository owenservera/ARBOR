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

  get size(): number {
    return this.#programs.size;
  }

  list(): ProgramInfo[] {
    return [...this.#programs.values()]
      .map((p) => p.info)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  onPrograms(listener: ProgramListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  find(name: string): LoadedProgram | null {
    return this.#programs.get(name) ?? null;
  }

  /**
   * Deterministic routing: a program owns the intent if one of its triggers
   * matches.
   *
   * Triggers match on token boundaries, case-insensitively: the trigger words
   * must appear as consecutive words of the intent. A substring test would
   * let `sla` capture `island` and hijack a `!run` intent, so the comparison
   * is word-wise. Multi-word triggers are allowed; the longest trigger wins.
   */
  match(text: string): LoadedProgram | null {
    const haystack = words(text);
    let best: LoadedProgram | null = null;
    let bestWords = 0;
    let bestLength = -1;
    for (const program of this.#programs.values()) {
      for (const trigger of program.info.triggers) {
        const needle = words(trigger);
        if (needle.length === 0) continue;
        if (!containsSequence(haystack, needle)) continue;
        const length = trigger.trim().length;
        if (needle.length > bestWords || (needle.length === bestWords && length > bestLength)) {
          best = program;
          bestWords = needle.length;
          bestLength = length;
        }
      }
    }
    return best;
  }

  async loadAll(): Promise<ProgramInfo[]> {
    await mkdir(this.#dir, { recursive: true });
    const entries = await readdir(this.#dir);
    for (const entry of entries) {
      if (!entry.endsWith(SOURCE_SUFFIX)) continue;
      await this.reload(basename(entry, SOURCE_SUFFIX), "boot");
    }
    this.#watch();
    this.#notify();
    return this.list();
  }

  async reload(name: string, reason: "boot" | "watch" | "api" = "watch"): Promise<ProgramInfo | null> {
    const file = join(this.#dir, `${name}${SOURCE_SUFFIX}`);
    let source: string;
    try {
      source = await readFile(file, "utf8");
    } catch {
      if (this.#programs.delete(name)) this.#notify();
      return null;
    }

    const hash = createHash("sha256").update(source).digest("hex").slice(0, 12);
    const previous = this.#programs.get(name);

    try {
      // Cache-bust by content hash: Bun treats each hash as a distinct module.
      const url = `${pathToFileURL(file).href}?v=${hash}`;
      const mod = (await import(url)) as { default?: unknown; meta?: unknown };
      const fn = mod.default;
      if (typeof fn !== "function") {
        throw new Error("default export must be a function (ctx) => JobSpec[]");
      }
      const meta = (mod.meta ?? {}) as Partial<ProgramInfo>;
      const triggers = Array.isArray(meta.triggers)
        ? meta.triggers.filter((t): t is string => typeof t === "string")
        : [name];

      const info: ProgramInfo = {
        name,
        label: typeof meta.label === "string" ? meta.label : name,
        version: (previous?.info.version ?? 0) + 1,
        hash,
        updatedAt: Date.now(),
        triggers,
        error: null,
      };
      this.#programs.set(name, { info, fn: fn as ProgramFn });
      this.#emit(previous ? "program.reloaded" : "program.loaded", reason, info);
      this.#notify();
      return info;
    } catch (error) {
      const info: ProgramInfo = {
        name,
        label: previous?.info.label ?? name,
        version: previous?.info.version ?? 0,
        hash,
        updatedAt: Date.now(),
        triggers: previous?.info.triggers ?? [name],
        error: (error as Error).message,
      };
      if (previous) {
        // Keep serving the last good module: a broken edit must not take the tier down.
        this.#programs.set(name, { info: { ...info, version: previous.info.version }, fn: previous.fn });
      }
      this.#emit("program.rejected", reason, info.error ?? "unknown error", {
        program: name,
        level: "error",
      });
      this.#notify();
      return info;
    }
  }

  /** Instant reprogramming entrypoint used by `PUT /api/programs/:name`. */
  async write(name: string, source: string): Promise<ProgramInfo | null> {
    if (!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(name)) {
      throw new Error(`invalid program name: ${name}`);
    }
    if (!this.#canWrite()) {
      throw new Error("program write denied: program.write capability required");
    }
    await mkdir(this.#dir, { recursive: true });
    await writeFile(join(this.#dir, `${name}${SOURCE_SUFFIX}`), source, "utf8");
    return this.reload(name, "api");
  }

  /** Build a plan for an intent by invoking a program. Errors are contained. */
  async run(program: LoadedProgram, intent: Intent): Promise<{ steps: JobSpec[]; error: string | null }> {
    let jobIndex = 0;
    const ctx = {
      intent,
      text: intent.text,
      sessionId: intent.sessionId,
      now: Date.now(),
      job: (spec: {
        kind: JobSpec["kind"];
        label: string;
        argv: readonly string[];
        cwd?: string;
        timeoutMs?: number;
        restart?: boolean;
        maxRestarts?: number;
        env?: Readonly<Record<string, string>>;
      }): JobSpec => {
        jobIndex += 1;
        return {
          id: nextId(`job${jobIndex}`),
          kind: spec.kind,
          label: spec.label,
          argv: [...spec.argv],
          cwd: spec.cwd,
          timeoutMs: spec.timeoutMs ?? 120_000,
          restart: spec.restart ?? false,
          maxRestarts: spec.maxRestarts ?? 1,
          env: spec.env,
        };
      },
    };

    try {
      const steps = await program.fn(ctx);
      if (!Array.isArray(steps)) throw new Error("program must return an array of JobSpec");
      return { steps: steps as JobSpec[], error: null };
    } catch (error) {
      return { steps: [], error: (error as Error).message };
    }
  }

  #watch(): void {
    if (this.#watcher) return;
    try {
      this.#watcher = watch(this.#dir, { persistent: false }, (_event, filename) => {
        if (!filename || !filename.endsWith(SOURCE_SUFFIX)) return;
        this.#pending.add(basename(filename, SOURCE_SUFFIX));
        if (this.#reloadTimer) clearTimeout(this.#reloadTimer);
        // Debounce editor write storms; 80ms is below human perception.
        this.#reloadTimer = setTimeout(() => {
          const names = [...this.#pending];
          this.#pending.clear();
          for (const name of names) void this.reload(name, "watch");
        }, 80);
      });
    } catch (error) {
      this.#emit("system.error", "watch", `program watch unavailable: ${(error as Error).message}`, {
        level: "warn",
      });
    }
  }

  close(): void {
    this.#watcher?.close();
    this.#watcher = null;
    if (this.#reloadTimer) clearTimeout(this.#reloadTimer);
  }

  #notify(): void {
    const list = this.list();
    for (const listener of this.#listeners) {
      try {
        listener(list);
      } catch {
        // Subscriber isolation.
      }
    }
  }

  #emit(
    type: "program.loaded" | "program.reloaded" | "program.rejected" | "system.error",
    reason: string,
    infoOrText: ProgramInfo | string,
    data?: Record<string, string | number | boolean | null>,
  ): void {
    const text = typeof infoOrText === "string" ? infoOrText : `${infoOrText.name}@${infoOrText.version}`;
    this.#bus.emit({
      tier: 2,
      type,
      sessionId: this.#sessionId,
      text,
      data: {
        reason,
        ...(typeof infoOrText === "string"
          ? {}
          : { program: infoOrText.name, version: infoOrText.version, hash: infoOrText.hash }),
        ...(data ?? {}),
      },
    });
  }
}

export function programDir(root: string): string {
  return join(root, "runtime", "programs");
}

export function programScaffold(name: string): string {
  return `// ${name}.program.ts — hot-swappable Tier-2 policy.
// Saved edits apply to the NEXT intent. No restart, no rebuild.
export const meta = {
  label: "${name}",
  triggers: ["${name}"],
};

export default ({ text, job }) => [
  job({
    kind: "exec",
    label: "${name}",
    argv: ["bun", "--version"],
    timeoutMs: 10_000,
  }),
];
`;
}

export const PROTOCOL_MARKER = PROTOCOL_VERSION;
