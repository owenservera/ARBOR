#!/usr/bin/env node
// scripts/roadmap/release-truth-separation.test.mjs
//
// Lane NEXT:D05-E04 (pwa-release-truth), acceptance (INVERTED): the release-truth
// and verification artifacts are optional developer validation; the product must
// start without them and must not depend on them.
//
// Owned artifacts:
//   src-tauri/resources/vivim-release.manifest.json
//   src-tauri/tauri.conf.json
//   demo/host-legacy/poll-round.mjs
//   integration/beta-gates.json
//   integration/scripts/w01g-r001-source-closure.mjs
//   scripts/batch-evidence/A00.mjs
//   scripts/roadmap/evidence-truth.mjs
//
// Read-only assertions (no Host, no mutation, no network):
//   1. No customer-runtime module (apps/, src-tauri/) statically imports any of
//      the five coordination/verification scripts/ledgers — none is an artificial
//      product gate, and the product can start without them (traced references are
//      demo/demo-baseline data, test fixtures, or child-process spawns only).
//   2. src-tauri/tauri.conf.json still bundles vivim-release.manifest.json under
//      bundle.resources (required by the owning Tauri build / cargo check) while
//      the staged manifest is the non-release placeholder
//      (schema vivim.apk-release-manifest-placeholder/1, manifestOnly: true) —
//      build-required, fails closed at runtime (src-tauri/src/main.rs resolves it
//      only in RuntimeMode::Packaged; the Host rejects any schema other than
//      vivim.apk-release/1), no service port anywhere.

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, sep, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const COORDINATION_ARTIFACTS = [
  'integration/beta-gates.json',
  'integration/scripts/w01g-r001-source-closure.mjs',
  'scripts/batch-evidence/A00.mjs',
  'scripts/roadmap/evidence-truth.mjs',
  'demo/host-legacy/poll-round.mjs',
];

// Customer-runtime roots: the shipped Host web surface and the Tauri shell.
// scripts/, integration/, demo/host-legacy/ are verification/demo, not runtime.
const PRODUCTION_ROOTS = ['apps', 'src-tauri'];

const IMPORT_PATTERNS = [
  /(?:^|\n)\s*import\s+(?:[\s\S]*?\s+from\s+)?['"](\.[^'"]+)['"]/g,
  /(?:^|\n)\s*export\s+[\s\S]*?\s+from\s+['"](\.[^'"]+)['"]/g,
  /\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g,
];

function toPosix(value) { return String(value).split(sep).join('/'); }
function repoRel(absolute) { return toPosix(relative(ROOT, absolute)); }
function isProduction(absolute) {
  const r = repoRel(absolute);
  return PRODUCTION_ROOTS.some((root) => r === root || r.startsWith(root + '/'));
}

function resolveSpecifier(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier);
  const probes = [
    base,
    ...['.mjs', '.js', '.cjs', '.ts', '.tsx', '.jsx', '.json'].map((ext) => base + ext),
  ];
  return probes.find((p) => {
    try { return existsSync(p) && statSync(p).isFile(); } catch { return false; }
  }) ?? null;
}

function readImports(absolutePath) {
  let source;
  try { source = readFileSync(absolutePath, 'utf8'); } catch { return []; }
  const found = new Set();
  for (const pattern of IMPORT_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      const resolved = resolveSpecifier(absolutePath, match[1]);
      if (resolved) found.add(resolved);
    }
  }
  return [...found];
}

function productionModules() {
  const out = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'target' ||
            entry.name === '.next' || entry.name === 'dist' || entry.name === 'coverage') continue;
        walk(p);
        continue;
      }
      if (entry.isFile()) out.push(p);
    }
  }
  for (const root of PRODUCTION_ROOTS) {
    const dir = join(ROOT, root);
    if (existsSync(dir)) walk(dir);
  }
  return out;
}

const ARTIFACT_SET = new Set(COORDINATION_ARTIFACTS);

test('no customer-runtime module imports a release-truth verification artifact', () => {
  const hits = [];
  for (const module of productionModules()) {
    for (const imported of readImports(module)) {
      const rel = repoRel(imported);
      if (ARTIFACT_SET.has(rel)) {
        hits.push(`${repoRel(module)} imports ${rel}`);
      }
    }
  }
  assert.deepEqual(hits, [],
    'customer runtime must not depend on verification artifacts: ' + hits.join('; '));
});

test('tauri.conf.json bundles the release manifest for the build and declares no service port', () => {
  const conf = JSON.parse(readFileSync(join(ROOT, 'src-tauri/tauri.conf.json'), 'utf8'));
  const resources = conf.bundle?.resources || {};
  assert.equal(resources['resources/vivim-release.manifest.json'], 'vivim-release.manifest.json',
    'tauri.conf.json must bundle resources/vivim-release.manifest.json for the Tauri build');
  assert.equal(Object.prototype.hasOwnProperty.call(conf, 'port'), false,
    'tauri.conf.json must not declare a service port');
  assert.equal(Object.prototype.hasOwnProperty.call(conf, 'services'), false,
    'tauri.conf.json must not declare a service block');
});

test('staged release manifest is a fails-closed placeholder, not production truth', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'src-tauri/resources/vivim-release.manifest.json'), 'utf8'));
  assert.equal(manifest.schema, 'vivim.apk-release-manifest-placeholder/1');
  assert.equal(manifest.manifestOnly, true);
  assert.equal(manifest.releaseId, null);
  assert.equal(manifest.artifact, null);
  assert.equal(Object.prototype.hasOwnProperty.call(manifest, 'port'), false,
    'release manifest must not declare a service port');
});
