# File: packages/tierflow/tests/architecture-boundary.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/architecture-boundary.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 14830 B |
| Lines | 437 |
| Hash | 987f2b8eb3b8 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 28 | no | const ROOT = resolve(import.meta.dir, &quot;..&quot;); |
| UI_DIR | const | 30 | no | const UI_DIR = &quot;src/ui&quot;; |
| SURFACES_DIR | const | 31 | no | const SURFACES_DIR = &quot;src/surfaces&quot;; |
| ADAPTERS_DIR | const | 32 | no | const ADAPTERS_DIR = &quot;src/adapters&quot;; |
| COORDINATION_DIR | const | 33 | no | const COORDINATION_DIR = &quot;src/coordination&quot;; |
| TYPES_FILE | const | 34 | no | const TYPES_FILE = &quot;src/ui/types.ts&quot;; |
| SERVER_FILE | const | 35 | no | const SERVER_FILE = &quot;src/server.ts&quot;; |
| TIER_DIRS | const | 36 | no | const TIER_DIRS = [&quot;src/tier1&quot;, &quot;src/tier2&quot;, &quot;src/tier3&quot;]; |
| CORE_FORBIDDEN_DIRS | const | 39 | no | const CORE_FORBIDDEN_DIRS = [ |
| CORE_FORBIDDEN_FILES | const | 48 | no | const CORE_FORBIDDEN_FILES = [ |
| HOST_MODULES | const | 56 | no | const HOST_MODULES = [&quot;bun:sqlite&quot;, &quot;node:fs&quot;, &quot;node:child_process&quot;, &quot;node:net&quot;]; |
| HOST_MODULE_EXCEPTION | const | 57 | no | const HOST_MODULE_EXCEPTION = &quot;src/ui/store.ts&quot;; |
| SKIP_DIRS | const | 60 | no | const SKIP_DIRS = new Set([&quot;node_modules&quot;, &quot;.git&quot;, &quot;.hq&quot;, &quot;.hq-tool&quot;, &quot;target&quot;, &quot;dist&quot;, &quot;coverage&quot;]); |
| SOURCE_EXT | const | 62 | no | const SOURCE_EXT = /\\.(ts\|tsx\|mts\|cts)$/; |
| IMPORT_PATTERNS | const | 69 | no | const IMPORT_PATTERNS = [ |
| CHAT_PATTERNS | const | 76 | no | const CHAT_PATTERNS = [ |
| EXPORT_PATTERN | const | 82 | no | const EXPORT_PATTERN = /\\bexport\\s+(?:interface\|type\|class\|const\|function)\\s+([A-Za-z_$][\\w$]*)/g; |
| SourceFile | interface | 84 | no | interface SourceFile { |
| ImportRef | interface | 91 | no | interface ImportRef { |
| stripTs | function | 97 | no | function stripTs(path: string): string { |
| relPath | function | 101 | no | function relPath(absolute: string): string { |
| isUnder | function | 107 | no | function isUnder(path: string, dir: string): boolean { |
| base | const | 108 | no | const base = stripTs(dir); |
| walkSources | function | 112 | no | function walkSources(dir: string): string[] { |
| found | const | 113 | no | const found: string[] = []; |
| full | const | 116 | no | const full = join(dir, entry.name); |
| readSource | function | 135 | no | function readSource(absolute: string): SourceFile \| null { |
| content | variable | 136 | no | let content: string; |
| loadSources | function | 151 | no | function loadSources(files: readonly string[]): SourceFile[] { |
| loaded | const | 152 | no | const loaded: SourceFile[] = []; |
| source | const | 154 | no | const source = readSource(file); |
| importsOf | function | 160 | no | function importsOf(file: SourceFile): ImportRef[] { |
| refs | const | 161 | no | const refs: ImportRef[] = []; |
| line | const | 163 | no | const line = file.lines[index] ?? &quot;&quot;; |
| spec | const | 168 | no | const spec = match[1]; |
| importTarget | function | 177 | no | function importTarget(file: SourceFile, spec: string): string \| null { |
| clean | const | 179 | no | const clean = spec.split(/[?#]/)[0] ?? spec; |
| resolved | const | 180 | no | const resolved = normalize(join(dirname(file.path), clean)); |
| describeViolation | function | 184 | no | function describeViolation( file: SourceFile, line: number, rule: string, detail: string, |
| failureMessage | function | 194 | no | function failureMessage(rule: string, violations: readonly string[]): string { |
| uiSources | function | 198 | no | function uiSources(): SourceFile[] { |
| tierSources | function | 202 | no | function tierSources(): SourceFile[] { |
| surfaceSources | function | 206 | no | function surfaceSources(): SourceFile[] { |
| adapterSources | function | 210 | no | function adapterSources(): SourceFile[] { |
| exportNames | function | 214 | no | function exportNames(content: string): string[] { |
| names | const | 215 | no | const names: string[] = []; |
| name | const | 219 | no | const name = match[1]; |
| violations | const | 227 | no | const violations: string[] = []; |
| target | const | 230 | no | const target = importTarget(file, ref.spec); |
| base | const | 232 | no | const base = stripTs(target); |
| forbiddenDir | const | 233 | no | const forbiddenDir = CORE_FORBIDDEN_DIRS.find((dir) =&gt; isUnder(base, dir)); |
| forbiddenFile | const | 234 | no | const forbiddenFile = CORE_FORBIDDEN_FILES.find((candidate) =&gt; base === candidate); |
| targetName | const | 236 | no | const targetName = forbiddenDir ?? forbiddenFile ?? target; |
| violations | const | 252 | no | const violations: string[] = []; |
| hostModule | const | 256 | no | const hostModule = HOST_MODULES.find( (module) =&gt; ref.spec === module \|\| ref.spec.startsWith(`${module}/`), ); |
| violations | const | 276 | no | const violations: string[] = []; |
| line | const | 279 | no | const line = file.lines[index] ?? &quot;&quot;; |
| violations | const | 299 | no | const violations: string[] = []; |
| target | const | 302 | no | const target = importTarget(file, ref.spec); |
| violations | const | 319 | no | const violations: string[] = []; |
| server | const | 320 | no | const server = readSource(join(ROOT, SERVER_FILE)); |
| target | const | 327 | no | const target = importTarget(server, ref.spec); |
| base | const | 329 | no | const base = stripTs(target); |
| forbiddenDir | const | 330 | no | const forbiddenDir = [COORDINATION_DIR, ADAPTERS_DIR].find((dir) =&gt; isUnder(base, dir)); |
| violations | const | 346 | no | const violations: string[] = []; |
| target | const | 349 | no | const target = importTarget(file, ref.spec); |
| base | const | 351 | no | const base = stripTs(target); |
| forbiddenDir | const | 352 | no | const forbiddenDir = [COORDINATION_DIR, ADAPTERS_DIR].find((dir) =&gt; isUnder(base, dir)); |
| violations | const | 369 | no | const violations: string[] = []; |
| target | const | 372 | no | const target = importTarget(file, ref.spec); |
| base | const | 374 | no | const base = stripTs(target); |
| forbiddenDir | const | 375 | no | const forbiddenDir = [UI_DIR, SURFACES_DIR].find((dir) =&gt; isUnder(base, dir)); |
| violations | const | 392 | no | const violations: string[] = []; |
| target | const | 395 | no | const target = importTarget(file, ref.spec); |
| file | const | 412 | no | const file = readSource(join(ROOT, TYPES_FILE)); |
| names | const | 417 | no | const names = exportNames(file.content); |
| banned | const | 431 | no | const banned = names.filter((name) =&gt; /chat\|vivim/i.test(name)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 24 | external |
| node:fs | import | 25 | external |
| node:path | import | 26 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
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
```

_First 80 of 438 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
