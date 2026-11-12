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
    ...['.mjs', '.js', '.cjs', '.ts', '.tsx', '.json'].map((ext) => base + ext),
    ...['index.mjs', 'index.js', 'index.ts'].map((name) => join(base, name)),
  ];
  return probes.find((candidate) => {
    try {
      return existsSync(candidate) && statSync(candidate).isFile();
    } catch {
      return false;
    }
  }) ?? null;
}

// Direct repo-internal dependencies of one file.
export function readImports(absolutePath) {
  let source;
  try {
    source = readFileSync(absolutePath, 'utf8');
  } catch {
    return [];
  }
  const found = new Set();
  for (const pattern of IMPORT_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      const resolved = resolveSpecifier(absolutePath, match[1]);
      if (resolved) found.add(resolved);
    }
  }
  return [...found];
}

const closureMemo = new Map();

// Transitive dependency closure of an absolute file path, as absolute paths.
export function closureOf(absolutePath, visiting = new Set()) {
  if (closureMemo.has(absolutePath)) return closureMemo.get(absolutePath);
  if (visiting.has(absolutePath)) return new Set([absolutePath]);
  visiting.add(absolutePath);
  const deps = new Set([absolutePath]);
  for (const child of readImports(absolutePath)) {
    for (const next of closureOf(child, visiting)) deps.add(next);
  }
  visiting.delete(absolutePath);
  closureMemo.set(absolutePath, deps);
  return deps;
}

// Dependency closure of a manifest test: the test file plus every module it
// transitively imports, as repo-relative POSIX paths.
export function dependencyClosure(test) {
  const absolute = join(REPO_ROOT, test.path);
  return [...closureOf(absolute)].map(rel).sort();
}

// True when `file` (repo-relative POSIX path) is covered by a test's closure.
export function testCoversFile(test, file) {
  if (file === test.path) return true;
  return dependencyClosure(test).includes(file);
}
