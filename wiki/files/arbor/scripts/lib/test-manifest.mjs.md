# File: scripts/lib/test-manifest.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/lib/test-manifest.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5320 B |
| Lines | 138 |
| Hash | 5591a1fbdc22 |
| Test | no |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REPO_ROOT | const | 16 | no | const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;); |
| MANIFEST_URL | const | 17 | no | const MANIFEST_URL = new URL(&#39;../test-manifest.json&#39;, import.meta.url); |
| toPosix | function | 19 | no | const toPosix = (value) =&gt; String(value).split(sep).join(&#39;/&#39;); |
| rel | function | 20 | no | const rel = (absolute) =&gt; toPosix(relative(REPO_ROOT, absolute)); |
| isInside | function | 21 | no | const isInside = (absolute) =&gt; |
| loadManifest | function | 24 | yes | export function loadManifest(manifestPath = MANIFEST_URL) { |
| allTests | const | 29 | yes | export const allTests = loadManifest(); |
| testPaths | const | 32 | yes | export const testPaths = allTests.map((entry) =&gt; entry.path); |
| discoverTests | function | 37 | yes | export function discoverTests({ roots, runtime, gate } = {}) { |
| rootSet | const | 38 | no | const rootSet = |
| byRoot | function | 48 | yes | export function byRoot(entries = allTests) { |
| counts | const | 49 | no | const counts = {}; |
| byRuntime | function | 54 | yes | export function byRuntime(entries = allTests) { |
| counts | const | 55 | no | const counts = {}; |
| byGate | function | 60 | yes | export function byGate(entries = allTests) { |
| counts | const | 61 | no | const counts = {}; |
| IMPORT_PATTERNS | const | 68 | no | const IMPORT_PATTERNS = [ |
| resolveSpecifier | function | 76 | no | function resolveSpecifier(fromFile, specifier) { |
| base | const | 77 | no | const base = resolve(dirname(fromFile), specifier); |
| probes | const | 79 | no | const probes = [ |
| readImports | function | 94 | yes | export function readImports(absolutePath) { |
| source | variable | 95 | no | let source; |
| found | const | 101 | no | const found = new Set(); |
| resolved | const | 104 | no | const resolved = resolveSpecifier(absolutePath, match[1]); |
| closureMemo | const | 111 | no | const closureMemo = new Map(); |
| closureOf | function | 114 | yes | export function closureOf(absolutePath, visiting = new Set()) { |
| deps | const | 118 | no | const deps = new Set([absolutePath]); |
| dependencyClosure | function | 129 | yes | export function dependencyClosure(test) { |
| absolute | const | 130 | no | const absolute = join(REPO_ROOT, test.path); |
| testCoversFile | function | 135 | yes | export function testCoversFile(test, file) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 1 | external |
| node:path | import | 2 | external |
| node:url | import | 3 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [scripts/batch-evidence/A05.test.mjs](../batch-evidence/A05.test.mjs.md) | ../lib/test-manifest.mjs |
| [scripts/roadmap/a05-cycle.mjs](../roadmap/a05-cycle.mjs.md) | ../lib/test-manifest.mjs |
| [scripts/roadmap/a05-cycle.test.mjs](../roadmap/a05-cycle.test.mjs.md) | ../lib/test-manifest.mjs |
| [scripts/test-gate.mjs](../test-gate.mjs.md) | ./lib/test-manifest.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Committed manifest of every test in ARBOR, mapped to runtime and gate.
// Entry shape (scripts/test-manifest.json): { path, root, runtime, gate }
//   path   : repo-relative POSIX path of the *.test.mjs file
//   root   : enumeration root the test was discovered under
//   runtime: 'bun' | 'node-strip-types' | 'node24-ajv'
//   gate   : CI gate the test runs under (or 'uncategorized')
//
// The dependency closure is a real static import graph, so impact selection can
// actually narrow: a change to a module a test imports selects that test, and a
// change to a module NO test imports fails closed to the full suite.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MANIFEST_URL = new URL('../test-manifest.json', import.meta.url);

const toPosix = (value) => String(value).split(sep).join('/');
const rel = (absolute) => toPosix(relative(REPO_ROOT, absolute));
const isInside = (absolute) =>
  absolute === REPO_ROOT || absolute.startsWith(REPO_ROOT + sep);

export function loadManifest(manifestPath = MANIFEST_URL) {
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

// Full list of every test entry in the manifest.
export const allTests = loadManifest();

// Repo-relative POSIX paths of every test in the manifest.
export const testPaths = allTests.map((entry) => entry.path);

// Filter manifest entries. Any combination of roots/runtime/gate may be given;
// omitted filters are not applied. `roots` matches entry.root exactly and may be
// a single root string or an array of root strings.
export function discoverTests({ roots, runtime, gate } = {}) {
  const rootSet =
    roots == null ? null : new Set(Array.isArray(roots) ? roots : [roots]);
  return allTests.filter((entry) => {
    if (rootSet && !rootSet.has(entry.root)) return false;
    if (runtime != null && entry.runtime !== runtime) return false;
    if (gate != null && entry.gate !== gate) return false;
    return true;
  });
}

export function byRoot(entries = allTests) {
  const counts = {};
  for (const entry of entries) counts[entry.root] = (counts[entry.root] || 0) + 1;
  return counts;
}

export function byRuntime(entries = allTests) {
  const counts = {};
  for (const entry of entries) counts[entry.runtime] = (counts[entry.runtime] || 0) + 1;
  return counts;
}

export function byGate(entries = allTests) {
  const counts = {};
  for (const entry of entries) counts[entry.gate] = (counts[entry.gate] || 0) + 1;
  return counts;
}

// Conservative static import graph. Only relative specifiers are followed:
// a bare package specifier is a dependency boundary, not a repo source file.
const IMPORT_PATTERNS = [
  /(?:^|\n)\s*import\s+(?:[\s\S]*?\s+from\s+)?['"](\.[^'"]+)['"]/g,
  /(?:^|\n)\s*export\s+[\s\S]*?\s+from\s+['"](\.[^'"]+)['"]/g,
  /\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g,
];

// Resolves a relative specifier to a real file inside the repo, or null.
function resolveSpecifier(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier);
  if (!isInside(base)) return null;
  const probes = [
    base,
```

_First 80 of 139 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
