/**
 * Architecture boundaries of the UI core.
 *
 * The UI core (`src/ui/**`) owns the document, revisions, drafts and revision
 * feed. It must stay independent of every external host: interaction surfaces,
 * chat and agent tiers, VIVIM/HQ coordination, provider adapters, and the
 * legacy wire protocol.
 *
 * Fixed layering:
 *   src/ui/**          core, depends on nothing external
 *   src/surfaces/**    interaction surfaces (chat, HTTP/WebSocket), may use core
 *   src/adapters/**    provider adapters, independent of core and surfaces
 *   src/tier1|2|3/**   legacy agent tiers, must not use core in this release
 *   src/server.ts      may use core and surfaces, never providers directly
 *
 * This test makes that rule executable. It walks the source tree at test time,
 * so files added later are covered without editing this file.
 *
 * Robustness note: other agents may be writing `src/ui/**` concurrently. Any
 * file that cannot be read in full is skipped rather than failed, and missing
 * directories are treated as empty.
 */

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, normalize, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");

const UI_DIR = "src/ui";
const SURFACES_DIR = "src/surfaces";
const ADAPTERS_DIR = "src/adapters";
const COORDINATION_DIR = "src/coordination";
const TYPES_FILE = "src/ui/types.ts";
const SERVER_FILE = "src/server.ts";
const TIER_DIRS = ["src/tier1", "src/tier2", "src/tier3"];

/** Host-facing directories the core must never import. */
const CORE_FORBIDDEN_DIRS = [
  "src/coordination",
  "src/adapters",
  "src/tier1",
  "src/tier2",
  "src/tier3",
];

/** Legacy entry points and the legacy wire protocol the core must never import. */
const CORE_FORBIDDEN_FILES = [
  "src/server.ts",
  "src/cli.ts",
  "src/lab.ts",
  "src/protocol.ts",
].map(stripTs);

/** Runtime modules only the persistence file of the core may touch. */
const HOST_MODULES = ["bun:sqlite", "node:fs", "node:child_process", "node:net"];
const HOST_MODULE_EXCEPTION = "src/ui/store.ts";

/** Names of directories that are derived, vendored, or otherwise not source. */
const SKIP_DIRS = new Set(["node_modules", ".git", ".hq", ".hq-tool", "target", "dist", "coverage"]);

const SOURCE_EXT = /\.(ts|tsx|mts|cts)$/;

/**
 * Import specifier forms used in this repository: `from "..."` (static import
 * and re-export), `import("...")` (dynamic), and side-effect `import "..."`.
 * Each is matched per line so a violation can be reported with its line number.
 */
const IMPORT_PATTERNS = [
  /\bfrom\s*["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  /^\s*import\s*["']([^"']+)["']/g,
];

/** The chat concept is an adapter concern, never a core concern. */
const CHAT_PATTERNS = [
  { re: /from\s+["'][^"']*chat/, label: 'import source containing "chat"' },
  { re: /\bchat\(/, label: 'call target "chat("' },
  { re: /\bChat\b/, label: 'identifier "Chat"' },
];

const EXPORT_PATTERN = /\bexport\s+(?:interface|type|class|const|function)\s+([A-Za-z_$][\w$]*)/g;

interface SourceFile {
  readonly path: string;
  readonly rel: string;
  readonly content: string;
  readonly lines: readonly string[];
}

interface ImportRef {
  readonly spec: string;
  readonly line: number;
  readonly source: string;
}

function stripTs(path: string): string {
  return path.replace(/\.(ts|tsx|mts|cts)$/, "");
}

function relPath(absolute: string): string {
  return relative(ROOT, absolute)
    .split("\\")
    .join("/");
}

function isUnder(path: string, dir: string): boolean {
  const base = stripTs(dir);
  return path === base || path.startsWith(`${base}/`);
}

function walkSources(dir: string): string[] {
  const found: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        found.push(...walkSources(full));
        continue;
      }
      if (entry.isFile() && SOURCE_EXT.test(entry.name)) found.push(full);
    }
  } catch {
    // Missing or unreadable directory: nothing to inspect.
    return found;
  }
  return found.sort();
}

/**
 * Reads one file. Returns null when it cannot be read or when it looks
 * binary/partially written, which is how concurrent writes are tolerated.
 */
function readSource(absolute: string): SourceFile | null {
  let content: string;
  try {
    content = readFileSync(absolute, "utf8");
  } catch {
    return null;
  }
  if (content.includes("\u0000")) return null;
  return {
    path: absolute,
    rel: relPath(absolute),
    content,
    lines: content.split(/\r?\n/),
  };
}

function loadSources(files: readonly string[]): SourceFile[] {
  const loaded: SourceFile[] = [];
  for (const file of files) {
    const source = readSource(file);
    if (source) loaded.push(source);
  }
  return loaded;
}

function importsOf(file: SourceFile): ImportRef[] {
  const refs: ImportRef[] = [];
  for (let index = 0; index < file.lines.length; index++) {
    const line = file.lines[index] ?? "";
    for (const pattern of IMPORT_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(line)) !== null) {
        const spec = match[1];
        if (spec) refs.push({ spec, line: index + 1, source: line.trim() });
      }
    }
  }
  return refs;
}

/** Resolves a relative specifier to a repo-relative path. Bare modules return null. */
function importTarget(file: SourceFile, spec: string): string | null {
  if (!spec.startsWith(".")) return null;
  const clean = spec.split(/[?#]/)[0] ?? spec;
  const resolved = normalize(join(dirname(file.path), clean));
  return relPath(resolved);
}

function describeViolation(
  file: SourceFile,
  line: number,
  rule: string,
  detail: string,
  source: string,
): string {
  return `${file.rel}:${line} [${rule}] ${detail} | source: ${source}`;
}

function failureMessage(rule: string, violations: readonly string[]): string {
  return `${rule}: ${violations.length} violation(s)\n${violations.join("\n")}`;
}

function uiSources(): SourceFile[] {
  return loadSources(walkSources(join(ROOT, UI_DIR)));
}

function tierSources(): SourceFile[] {
  return TIER_DIRS.flatMap((dir) => loadSources(walkSources(join(ROOT, dir))));
}

function surfaceSources(): SourceFile[] {
  return loadSources(walkSources(join(ROOT, SURFACES_DIR)));
}

function adapterSources(): SourceFile[] {
  return loadSources(walkSources(join(ROOT, ADAPTERS_DIR)));
}

function exportNames(content: string): string[] {
  const names: string[] = [];
  EXPORT_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = EXPORT_PATTERN.exec(content)) !== null) {
    const name = match[1];
    if (name) names.push(name);
  }
  return names;
}

describe("UI core architecture boundaries", () => {
  test("src/ui/** imports no host, tier, or legacy wire modules", () => {
    const violations: string[] = [];
    for (const file of uiSources()) {
      for (const ref of importsOf(file)) {
        const target = importTarget(file, ref.spec);
        if (!target) continue;
        const base = stripTs(target);
        const forbiddenDir = CORE_FORBIDDEN_DIRS.find((dir) => isUnder(base, dir));
        const forbiddenFile = CORE_FORBIDDEN_FILES.find((candidate) => base === candidate);
        if (!forbiddenDir && !forbiddenFile) continue;
        const targetName = forbiddenDir ?? forbiddenFile ?? target;
        violations.push(
          describeViolation(
            file,
            ref.line,
            `rule 1: UI core must not import ${targetName}`,
            `import specifier "${ref.spec}"`,
            ref.source,
          ),
        );
      }
    }
    expect(violations, failureMessage("rule 1", violations)).toEqual([]);
  });

  test("only src/ui/store.ts imports host runtime modules", () => {
    const violations: string[] = [];
    for (const file of uiSources()) {
      for (const ref of importsOf(file)) {
        if (ref.spec.startsWith(".")) continue;
        const hostModule = HOST_MODULES.find(
          (module) => ref.spec === module || ref.spec.startsWith(`${module}/`),
        );
        if (!hostModule) continue;
        if (file.rel === HOST_MODULE_EXCEPTION) continue;
        violations.push(
          describeViolation(
            file,
            ref.line,
            `rule 2: only ${HOST_MODULE_EXCEPTION} may import ${hostModule}`,
            `import specifier "${ref.spec}"`,
            ref.source,
          ),
        );
      }
    }
    expect(violations, failureMessage("rule 2", violations)).toEqual([]);
  });

  test("src/ui/** contains no chat concept", () => {
    const violations: string[] = [];
    for (const file of uiSources()) {
      for (let index = 0; index < file.lines.length; index++) {
        const line = file.lines[index] ?? "";
        for (const { re, label } of CHAT_PATTERNS) {
          const match = re.exec(line);
          if (!match) continue;
          violations.push(
            describeViolation(
              file,
              index + 1,
              `rule 3: chat is an adapter surface, not a core concept (${label})`,
              `matched ${String(re)}`,
              line.trim(),
            ),
          );
        }
      }
    }
    expect(violations, failureMessage("rule 3", violations)).toEqual([]);
  });

  test("src/tier1|2|3 do not import the UI core", () => {
    const violations: string[] = [];
    for (const file of tierSources()) {
      for (const ref of importsOf(file)) {
        const target = importTarget(file, ref.spec);
        if (!target || !isUnder(stripTs(target), UI_DIR)) continue;
        violations.push(
          describeViolation(
            file,
            ref.line,
            `rule 4: tiers must not import ${UI_DIR} (tiers -> adapters -> core)`,
            `import specifier "${ref.spec}"`,
            ref.source,
          ),
        );
      }
    }
    expect(violations, failureMessage("rule 4", violations)).toEqual([]);
  });

  test("src/server.ts reaches coordination and providers only through adapters", () => {
    const violations: string[] = [];
    const server = readSource(join(ROOT, SERVER_FILE));
    if (!server) {
      // The server may be absent on a partial tree; nothing to violate then.
      expect(violations, failureMessage("rule 5", violations)).toEqual([]);
      return;
    }
    for (const ref of importsOf(server)) {
      const target = importTarget(server, ref.spec);
      if (!target) continue;
      const base = stripTs(target);
      const forbiddenDir = [COORDINATION_DIR, ADAPTERS_DIR].find((dir) => isUnder(base, dir));
      if (!forbiddenDir) continue;
      violations.push(
        describeViolation(
          server,
          ref.line,
          `rule 5: server.ts must not import ${forbiddenDir} directly`,
          `import specifier "${ref.spec}"`,
          ref.source,
        ),
      );
    }
    expect(violations, failureMessage("rule 5", violations)).toEqual([]);
  });

  test("src/surfaces/** imports no providers or coordination", () => {
    const violations: string[] = [];
    for (const file of surfaceSources()) {
      for (const ref of importsOf(file)) {
        const target = importTarget(file, ref.spec);
        if (!target) continue;
        const base = stripTs(target);
        const forbiddenDir = [COORDINATION_DIR, ADAPTERS_DIR].find((dir) => isUnder(base, dir));
        if (!forbiddenDir) continue;
        violations.push(
          describeViolation(
            file,
            ref.line,
            `rule 6: surfaces must not import ${forbiddenDir} (a surface talks to the core)`,
            `import specifier "${ref.spec}"`,
            ref.source,
          ),
        );
      }
    }
    expect(violations, failureMessage("rule 6", violations)).toEqual([]);
  });

  test("src/adapters/** stays independent of the UI core and surfaces", () => {
    const violations: string[] = [];
    for (const file of adapterSources()) {
      for (const ref of importsOf(file)) {
        const target = importTarget(file, ref.spec);
        if (!target) continue;
        const base = stripTs(target);
        const forbiddenDir = [UI_DIR, SURFACES_DIR].find((dir) => isUnder(base, dir));
        if (!forbiddenDir) continue;
        violations.push(
          describeViolation(
            file,
            ref.line,
            `rule 7: provider adapters must not import ${forbiddenDir}`,
            `import specifier "${ref.spec}"`,
            ref.source,
          ),
        );
      }
    }
    expect(violations, failureMessage("rule 7", violations)).toEqual([]);
  });

  test("src/ui/** does not import src/surfaces/**", () => {
    const violations: string[] = [];
    for (const file of uiSources()) {
      for (const ref of importsOf(file)) {
        const target = importTarget(file, ref.spec);
        if (!target || !isUnder(stripTs(target), SURFACES_DIR)) continue;
        violations.push(
          describeViolation(
            file,
            ref.line,
            `rule 8: UI core must not import ${SURFACES_DIR} (the dependency arrow points in)`,
            `import specifier "${ref.spec}"`,
            ref.source,
          ),
        );
      }
    }
    expect(violations, failureMessage("rule 8", violations)).toEqual([]);
  });

  test("src/ui/types.ts exports the adapter seam and no host concepts", () => {
    const file = readSource(join(ROOT, TYPES_FILE));
    if (!file) {
      throw new Error(`${TYPES_FILE} must exist and be readable; it defines the adapter seam`);
    }

    const names = exportNames(file.content);

    expect(
      names,
      `${TYPES_FILE} must export UiCommandPort and UiRevisionFeed so adapters have a seam; ` +
        `found: ${names.join(", ") || "(none)"}`,
    ).toContain("UiCommandPort");

    expect(
      names,
      `${TYPES_FILE} must export UiCommandPort and UiRevisionFeed so adapters have a seam; ` +
        `found: ${names.join(", ") || "(none)"}`,
    ).toContain("UiRevisionFeed");

    const banned = names.filter((name) => /chat|vivim/i.test(name));
    expect(
      banned,
      `${TYPES_FILE} exports host concepts that belong in adapters: ${banned.join(", ")}`,
    ).toEqual([]);
  });
});
