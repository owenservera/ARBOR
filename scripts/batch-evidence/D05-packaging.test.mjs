// scripts/batch-evidence/D05-packaging.test.mjs
// Acceptance tests for unit D05-E01 "reproducible packaging".
//
//   AT-CE1EAA2642DA  tools/packaging/prepare-host-runtime.mjs
//     "Currently stages four native binaries; extend only proven production
//      ports. Freeze manifest and verify clean installed runtime."
//     Acceptance: the installed runtime launches every required binary without
//     Cargo/Bun/Git and never falls back to a debug build.
//
//   AT-7AE45AD102EA  package.json
//     "Check package is required by owning build and production closure; no
//      service port." The pinned defect was scripts["test:studio"] pointing at
//      studio/test/unit/**/*.test.mjs, which matches zero files and still exits 0.
//
// These are executed checks, not source-reading prose: the first half drives the
// exported gate functions against a synthetic staged tree, the second half
// asserts the production call sites that make hqkg-import a proven port, and the
// last one re-runs the empty-suite guard that the stale script escaped.
//
// No Cargo, Bun or device is required: the packaging build itself stays a
// release-only, fail-closed gate that this suite never invokes.

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  PACKAGED_BINARIES, CARGO_BUILDS, cargoArgs, STAGED_DIRS, STAGED_TOP_FILES,
  RUNTIME_MANIFEST_NAME, verifyStagedRuntime, writeFrozenManifest, activateFrozenRuntime
} from '../../tools/packaging/prepare-host-runtime.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const rel = p => path.relative(REPO_ROOT, p).split(path.sep).join('/');
const read = p => readFileSync(path.join(REPO_ROOT, p), 'utf8');

// A staged tree with the exact shape verifyStagedRuntime() demands: every
// staged dir/file, the bundled node.exe and one native/bin/<name>.exe per
// packaged binary. Contents are placeholders - the checks are structural.
function syntheticRuntime(t) {
  const base = mkdtempSync(path.join(os.tmpdir(), 'arbor-d05-runtime-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  for (const dir of STAGED_DIRS) mkdirSync(path.join(base, ...dir.split('/')), { recursive: true });
  for (const file of STAGED_TOP_FILES) {
    const target = path.join(base, ...file.split('/'));
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, '{}\n');
  }
  writeFileSync(path.join(base, 'node.exe'), 'synthetic-node\n');
  mkdirSync(path.join(base, 'native', 'bin'), { recursive: true });
  for (const name of PACKAGED_BINARIES) {
    writeFileSync(path.join(base, 'native', 'bin', name + '.exe'), 'synthetic-' + name + '\n');
  }
  return base;
}

// ---------------------------------------------------------------------------
// AT-CE1EAA2642DA - staging contract
// ---------------------------------------------------------------------------

test('D05: every packaged binary has a release cargo build plan behind it', () => {
  const built = CARGO_BUILDS.flatMap(plan => plan.bins);
  assert.deepEqual([...built].sort(), [...PACKAGED_BINARIES].sort(),
    'PACKAGED_BINARIES and CARGO_BUILDS[].bins must describe the same set');
  assert.equal(new Set(PACKAGED_BINARIES).size, PACKAGED_BINARIES.length, 'no duplicate staged binary');
  for (const plan of CARGO_BUILDS) {
    const args = cargoArgs(plan, path.join('C:', 'target'));
    assert.equal(args[0], 'build');
    assert.equal(args[1], '--release', 'a staged binary may only come from a release build');
    for (const bin of plan.bins) assert.ok(args.includes('--bin') && args.includes(bin), '--bin ' + bin);
    assert.deepEqual(args.slice(-2), ['--target-dir', path.join('C:', 'target')]);
  }
});

test('D05: hqkg-import is packaged and its cargo plan enables the importer feature', () => {
  assert.ok(PACKAGED_BINARIES.includes('hqkg-import'),
    'the native importer must ship, or hq kg sync regresses to a Cargo spawn');
  const plan = CARGO_BUILDS.find(p => p.bins.includes('hqkg-import'));
  assert.ok(plan, 'hqkg-import needs a build plan');
  assert.ok(plan.features.includes('importer'),
    'native/hqkg/Cargo.toml declares hqkg-import with required-features = ["importer"]');
  // Provenance: the importer is a real in-tree binary, not a guessed name.
  assert.ok(existsSync(path.join(REPO_ROOT, 'native/hqkg/src/bin/hqkg-import.rs')));
  assert.match(read('native/hqkg/Cargo.toml'), /name = "hqkg-import"[\s\S]*?required-features = \["importer"\]/);
});

test('D05: staged runtime verifies with all five packaged binaries', t => {
  const base = syntheticRuntime(t);
  const report = verifyStagedRuntime(base);
  assert.deepEqual(report.problems, [], 'clean staged tree must verify');
  assert.equal(report.ok, true);
  assert.equal(report.checks.packagedBinaries, PACKAGED_BINARIES.length);
  for (const name of PACKAGED_BINARIES) {
    assert.ok(existsSync(path.join(base, 'native', 'bin', name + '.exe')), name + '.exe staged');
  }
});

test('D05: a staged runtime missing the importer fails closed', t => {
  const base = syntheticRuntime(t);
  rmSync(path.join(base, 'native', 'bin', 'hqkg-import.exe'));
  const report = verifyStagedRuntime(base);
  assert.equal(report.ok, false);
  assert.ok(report.problems.includes('missing staged native binary: native/bin/hqkg-import.exe'),
    'the importer gap must be named, got: ' + report.problems.join('; '));
});

test('D05: a source-only PWA release cannot claim a working live-system without Rust', t => {
  assert.ok(PACKAGED_BINARIES.includes('vivim-product-pure'));
  const base=syntheticRuntime(t);
  rmSync(path.join(base,'native','bin','vivim-product-pure.exe'));
  const report=verifyStagedRuntime(base);
  assert.equal(report.ok,false);
  assert.ok(report.problems.includes(
    'missing staged native binary: native/bin/vivim-product-pure.exe'));
});

test('D05: a cargo target tree in the runtime is refused as a debug fallback', t => {
  const base = syntheticRuntime(t);
  mkdirSync(path.join(base, 'target', 'debug'), { recursive: true });
  const report = verifyStagedRuntime(base);
  assert.equal(report.ok, false);
  assert.ok(report.problems.some(p => /cargo target directory \(debug fallback\): target/.test(p)),
    'debug fallback must be reported, got: ' + report.problems.join('; '));
});

test('D05: the runtime cannot ship Cargo, Bun or Git', t => {
  for (const tool of ['cargo.exe', 'bun.exe', 'git.exe']) {
    const base = syntheticRuntime(t);
    writeFileSync(path.join(base, tool), 'synthetic tool\n');
    const report = verifyStagedRuntime(base);
    assert.equal(report.ok, false, tool + ' must not be packageable');
    assert.ok(report.problems.some(p => p === 'runtime ships a build tool: ' + tool),
      tool + ' must be named, got: ' + report.problems.join('; '));
  }
});

test('D05: the frozen manifest detects an edited installed file', t => {
  const base = syntheticRuntime(t);
  const manifest = writeFrozenManifest(base);
  const untouched = verifyStagedRuntime(base, { manifest });
  assert.equal(untouched.ok, true, 'untouched tree must verify against its manifest');
  assert.ok(untouched.checks.manifestFilesVerified > PACKAGED_BINARIES.length,
    'manifest must hash real payload files, verified ' + untouched.checks.manifestFilesVerified);

  const victim = path.join(base, 'native', 'bin', 'hqkg-personal.exe');
  // Keep the byte count unchanged so this actually proves the digest check,
  // not merely the earlier length fence.
  const original = readFileSync(victim, 'utf8');
  const altered = original.replace('synthetic', 'SYNTHETIC');
  assert.notEqual(altered, original);
  assert.equal(Buffer.byteLength(altered), Buffer.byteLength(original));
  writeFileSync(victim, altered);
  const tampered = verifyStagedRuntime(base, { manifest });
  assert.equal(tampered.ok, false);
  assert.ok(tampered.problems.includes('runtime file does not match the frozen manifest: native/bin/hqkg-personal.exe'),
    'tampering must be reported, got: ' + tampered.problems.join('; '));

  rmSync(path.join(base, 'node.exe'));
  const removed = verifyStagedRuntime(base, { manifest });
  assert.equal(removed.ok, false);
  assert.ok(removed.problems.some(p => p.includes('manifest file missing from runtime: node.exe')),
    'a deleted manifest entry must be reported, got: ' + removed.problems.join('; '));
});

test('D05: hqkg-import has a production port in the staged workspace', () => {
  // Staging is only justified by real callers inside the payload. Both call sites
  // currently shell out to Cargo; lane A swaps them for the bundled binary only
  // after this importer is staged.
  for (const caller of ['hq/bin/hq.mjs', 'hq/lib/refresh.mjs']) {
    const source = read(caller);
    assert.ok(source.includes('hqkg-import'), caller + ' must invoke hqkg-import');
    assert.ok(/spawnSync\('cargo'/.test(source), caller + ' still spawns cargo (lane A swaps it)');
  }
  assert.ok(STAGED_DIRS.includes('hq'), 'the importer callers must be inside the staged payload');
});

test('D05: a staged replacement retains the previous generation for manual rollback', t => {
  const base=mkdtempSync(path.join(os.tmpdir(), 'arbor-d05-rollback-'));
  t.after(()=>rmSync(base,{recursive:true,force:true}));
  const paths={runtime:path.join(base,'runtime'),stage:path.join(base,'candidate'),previous:path.join(base,'previous')};
  mkdirSync(paths.runtime);
  mkdirSync(paths.stage);
  writeFileSync(path.join(paths.runtime,'proof.txt'),'old-source\n');
  writeFileSync(path.join(paths.stage,'proof.txt'),'new-source\n');
  const activated=activateFrozenRuntime(paths);
  assert.equal(activated.rollbackRuntime,paths.previous);
  assert.equal(readFileSync(path.join(paths.runtime,'proof.txt'),'utf8'),'new-source\n');
  assert.equal(readFileSync(path.join(paths.previous,'proof.txt'),'utf8'),'old-source\n');
});

test('D05: an occupied rollback slot refuses replacement without touching either generation', t => {
  const base=mkdtempSync(path.join(os.tmpdir(), 'arbor-d05-occupied-'));
  t.after(()=>rmSync(base,{recursive:true,force:true}));
  const paths={runtime:path.join(base,'runtime'),stage:path.join(base,'candidate'),previous:path.join(base,'previous')};
  for(const name of ['runtime','stage','previous']){
    mkdirSync(paths[name]);
    writeFileSync(path.join(paths[name],'proof.txt'),name);
  }
  assert.throws(()=>activateFrozenRuntime(paths),/rollback slot is occupied/);
  for(const name of ['runtime','stage','previous'])
    assert.equal(readFileSync(path.join(paths[name],'proof.txt'),'utf8'),name);
});

test('D05: a missing candidate refuses activation and leaves the installed runtime untouched', t => {
  const base=mkdtempSync(path.join(os.tmpdir(), 'arbor-d05-no-candidate-'));
  t.after(()=>rmSync(base,{recursive:true,force:true}));
  const paths={runtime:path.join(base,'runtime'),stage:path.join(base,'missing'),previous:path.join(base,'previous')};
  mkdirSync(paths.runtime);
  writeFileSync(path.join(paths.runtime,'proof.txt'),'protected');
  assert.throws(()=>activateFrozenRuntime(paths),/missing verified runtime candidate/);
  assert.equal(readFileSync(path.join(paths.runtime,'proof.txt'),'utf8'),'protected');
  assert.equal(existsSync(paths.previous),false);
});

test('D05: first installation activates without pretending a rollback generation exists', t => {
  const base=mkdtempSync(path.join(os.tmpdir(), 'arbor-d05-first-install-'));
  t.after(()=>rmSync(base,{recursive:true,force:true}));
  const paths={runtime:path.join(base,'runtime'),stage:path.join(base,'candidate'),previous:path.join(base,'previous')};
  mkdirSync(paths.stage);
  writeFileSync(path.join(paths.stage,'proof.txt'),'new-only');
  assert.deepEqual(activateFrozenRuntime(paths),{runtime:paths.runtime,rollbackRuntime:null});
  assert.equal(readFileSync(path.join(paths.runtime,'proof.txt'),'utf8'),'new-only');
  assert.equal(existsSync(paths.previous),false);
});

// ---------------------------------------------------------------------------
// AT-7AE45AD102EA - package.json scripts must resolve to real files
// ---------------------------------------------------------------------------

function globToRegExp(pattern) {
  let out = '^';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '*') {
      if (pattern[i + 1] === '*') {
        if (pattern[i + 2] === '/') { out += '(?:[^/\\\\]+/)*'; i += 2; continue; }
        out += '[^/\\\\]*'; i++; continue;
      }
      out += '[^/\\\\]*';
    } else if (ch === '?') out += '[^/\\\\]';
    else out += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(out + '$');
}

function walkFiles(dir, base, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(abs, base, out);
    else out.push(path.relative(base, abs).split(path.sep).join('/'));
  }
  return out;
}

// Files matched by one `node --test` argument, resolved against the shell cwd.
function matchesTestTarget(target, cwd) {
  const abs = path.resolve(cwd, target);
  if (!target.includes('*') && !target.includes('?')) return existsSync(abs) ? [rel(abs)] : [];
  const staticDir = abs.slice(0, Math.min(...['*', '?'].map(c => abs.includes(c) ? abs.indexOf(c) : Infinity)));
  const rootDir = staticDir.endsWith(path.sep) ? staticDir : path.dirname(staticDir) + path.sep;
  if (!existsSync(rootDir)) return [];
  const re = globToRegExp(target);
  return walkFiles(rootDir, cwd).filter(f => re.test(f));
}

// Every root script that runs `node --test` must resolve to at least one real
// test file. This is the guard that the stale `test:studio` (zero matches, exit
// 0) escaped.
function resolveTestScript(script, base = REPO_ROOT) {
  const targets = [];
  let cwd = base;
  for (const rawPart of script.split('&&')) {
    const part = rawPart.trim();
    const cd = /^cd\s+(\S+)$/.exec(part);
    if (cd) { cwd = path.resolve(cwd, cd[1]); continue; }
    const run = /^node\s+--test\s+(.+)$/.exec(part);
    if (!run) continue;
    for (const target of run[1].split(/\s+/).filter(Boolean)) targets.push(...matchesTestTarget(target, cwd));
  }
  return targets;
}

test('D05: no root test script runs an empty suite', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['test:studio'], undefined,
    'the stale Studio script (studio/test/unit/**/*.test.mjs, zero files) must not come back');
  let checked = 0;
  for (const [name, script] of Object.entries(pkg.scripts)) {
    if (!/\bnode\s+--test\b/.test(script)) continue;
    checked++;
    const matched = resolveTestScript(script);
    assert.ok(matched.length > 0,
      `scripts["${name}"] resolves to zero test files: ${script}`);
  }
  assert.ok(checked >= 4, 'the guard must inspect the root node --test scripts, checked ' + checked);
});

test('D05: the empty-suite guard itself matches real files and rejects missing ones', t => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'arbor-d05-glob-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(path.join(dir, 'unit'), { recursive: true });
  writeFileSync(path.join(dir, 'unit', 'a.test.mjs'), '// test\n');
  assert.deepEqual(matchesTestTarget('unit/*.test.mjs', dir), ['unit/a.test.mjs']);
  assert.deepEqual(matchesTestTarget('unit/**/*.test.mjs', dir), ['unit/a.test.mjs']);
  assert.deepEqual(matchesTestTarget('unit/missing/*.test.mjs', dir), []);
  assert.deepEqual(resolveTestScript('node --test unit/missing/*.test.mjs', dir), []);
});