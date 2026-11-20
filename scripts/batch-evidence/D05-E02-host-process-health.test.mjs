import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// The frozen packaging contract is the authority for which native binaries an
// installed runtime may ship. The native shell must report exactly this set.
import { PACKAGED_BINARIES } from '../../tools/packaging/prepare-host-runtime.mjs';

// ============================================================================
// scripts/batch-evidence/D05-E02-host-process-health.test.mjs
// Unit NEXT:D05-E02-host-process-health (ledger rows AT-2F5E0A90D419 and
// AT-0A6ABCF6F615 owned by src-tauri/src/main.rs; AT-8FE2BBFEBCDD owned by
// src-tauri/capabilities/default.json).
//
// Acceptance under test:
//   * host_is_running reports REAL child liveness (try_wait), never retained
//     handle presence — an exited Host must read as not running.
//   * a dead Host can be cleanly restarted through host_restart, which only
//     stops the child this shell owns.
//   * runtime origin distinguishes the packaged MSI bundle from the workspace
//     fallback and from a missing runtime.
//   * the shell discovers exactly the approved native binaries frozen by
//     tools/packaging/prepare-host-runtime.mjs.
//
// The behavioral assertions live in the Rust unit tests inside main.rs
// (#[cfg(test)]); this suite runs them with cargo and cross-checks the source
// contract. Nothing here fakes a pass: cargo must compile and every declared
// #[test] must pass.
// ============================================================================

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');
const MAIN_RS = join(REPO_ROOT, 'src-tauri', 'src', 'main.rs');
const SOURCE = readFileSync(MAIN_RS, 'utf8');
const DEFAULT_JSON = join(REPO_ROOT, 'src-tauri', 'capabilities', 'default.json');
const CAP = JSON.parse(readFileSync(DEFAULT_JSON, 'utf8'));

function functionBody(name) {
  const start = SOURCE.indexOf(`fn ${name}`);
  assert.notEqual(start, -1, `main.rs must declare fn ${name}`);
  const open = SOURCE.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < SOURCE.length; i += 1) {
    if (SOURCE[i] === '{') depth += 1;
    else if (SOURCE[i] === '}') {
      depth -= 1;
      if (depth === 0) return SOURCE.slice(open + 1, i);
    }
  }
  assert.fail(`unbalanced body for fn ${name}`);
}

test('host_is_running probes the real child state, not handle presence', () => {
  const body = functionBody('host_is_running');
  assert.match(body, /probe_child\s*\(/, 'host_is_running must call probe_child');
  assert.match(body, /ChildState::Running/, 'host_is_running must compare against ChildState::Running');
  assert.doesNotMatch(body, /\.is_some\s*\(/, 'host_is_running must not report retained handle presence');
});

test('host_is_running is backed by an OS child probe', () => {
  const body = functionBody('probe_child');
  assert.match(body, /try_wait\s*\(/, 'probe_child must ask the OS about the child');
  assert.match(body, /Ok\(None\)\s*=>\s*ChildState::Running/, 'Ok(None) from try_wait means running');
  assert.match(body, /Ok\(Some\(/, 'Ok(Some(status)) from try_wait means exited');
  assert.match(body, /exit_code/, 'probe_child must record the real exit code');
});

test('exited Host can be cleanly restarted through an owned-child stop', () => {
  assert.match(SOURCE, /async fn host_restart\s*\(/,
    'host_restart must be async so a blocking restart never runs on the main thread');
  const restart = functionBody('host_restart');
  assert.match(restart, /spawn_blocking/, 'host_restart must run the blocking restart off the IPC thread');
  assert.match(restart, /restart_blocking/, 'host_restart must delegate to the blocking restart body');

  const blocking = functionBody('restart_blocking');
  assert.match(blocking, /stop_owned\s*\(/, 'restart_blocking must stop the owned child first');
  assert.match(blocking, /HostProcess::start/, 'restart_blocking must start a fresh Host');

  const stop = functionBody('stop_owned');
  assert.match(stop, /guard\.take\(\)/, 'stop_owned must take the owned child');
  assert.match(stop, /child\.kill\(\)/, 'stop_owned must terminate a live child');
  assert.match(stop, /child\.wait\(\)/, 'stop_owned must reap the terminated child');
  assert.doesNotMatch(stop, /Command::new/, 'stop_owned must never spawn another process');
});

test('host status and restart are registered for the webview', () => {
  const registration = SOURCE.match(/generate_handler!\[([\s\S]*?)\]/);
  assert.ok(registration, 'main.rs must register its command handler list');
  const handlers = registration[1].split(',').map((name) => name.trim()).filter(Boolean);
  for (const name of ['host_is_running', 'host_status', 'host_restart', 'app_version', 'validate_native_program']) {
    assert.ok(handlers.includes(name), `generate_handler must register ${name}`);
  }
  assert.ok(SOURCE.includes('fn host_status'), 'main.rs must declare host_status');
});

test('runtime origin distinguishes packaged, workspace and missing', () => {
  const modes = SOURCE.match(/enum RuntimeMode\s*\{([\s\S]*?)\}/);
  assert.ok(modes, 'main.rs must declare the RuntimeMode enum');
  for (const mode of ['Packaged', 'Workspace', 'Missing']) {
    assert.match(modes[1], new RegExp(`\\b${mode}\\b`), `RuntimeMode must distinguish ${mode}`);
  }
  const classify = functionBody('classify_runtime');
  assert.match(classify, /RuntimeMode::Missing/, 'a root without the Host entry point must be Missing');
  const packaged = functionBody('packaged_runtime');
  assert.match(packaged, /node\.exe/, 'a packaged runtime must require the staged node.exe');
  assert.match(packaged, /server\.mjs/, 'a packaged runtime must require the Host entry point');
});

test('the shell reports exactly the approved native binaries from the packaging contract', () => {
  const declaration = SOURCE.match(/const APPROVED_BINARIES[^=]*=\s*\[([\s\S]*?)\];/);
  assert.ok(declaration, 'main.rs must declare APPROVED_BINARIES');
  const declared = [...declaration[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(declared, PACKAGED_BINARIES,
    'native shell approved binaries must match tools/packaging/prepare-host-runtime.mjs PACKAGED_BINARIES');
});

test('health identity rejects an unrelated listener on the Host port', () => {
  assert.match(SOURCE, /const HOST_STATUS_SCHEMA: &str = "vivim\.host-status\/1"/,
    'the shell must know the Host status schema');
  const identity = functionBody('is_host_status');
  assert.match(identity, /HOST_STATUS_SCHEMA/, 'identity must check the Host status schema');
  assert.match(identity, /"online"/, 'identity must require an online host state');
});

test('default capability is required by the main-window build and production closure', () => {
  assert.equal(CAP.identifier, 'default', 'default capability must keep the identifier the build closure resolves');
  assert.deepEqual(CAP.windows, ['main'],
    'default capability must be bound to the main window, the window the Tauri build opens in dev and production');
  assert.equal(CAP.local !== false, true,
    'with no remote stanza the capability serves bundled local app resources only');
});

test('default capability carries only approved permissions', () => {
  assert.deepEqual(CAP.permissions, [
    'core:default',
    'core:window:allow-show',
    'core:window:allow-hide',
    'core:window:allow-set-focus',
    'core:window:allow-start-dragging',
    'core:window:allow-internal-toggle-maximize',
  ], 'no privileged or remote-origin permission beyond the approved set');
});

test('default capability has no remote/service-port grant', () => {
  assert.equal(Object.prototype.hasOwnProperty.call(CAP, 'remote'), false,
    'default capability must not declare remote origins — http://127.0.0.1:* was a service-port wildcard on localhost');
  assert.equal(CAP.remote?.urls, undefined, 'no remote.urls service-port entries may exist');
});

test('the Rust process-health suite compiles and every declared test passes', () => {
  const declaredTests = (SOURCE.match(/#\[test\]/g) || []).length;
  assert.ok(declaredTests >= 7, `expected at least 7 Rust tests, found ${declaredTests}`);

  const result = spawnSync('cargo', ['test', '-p', 'vivim-host', '--bin', 'vivim-host', '--locked'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: 600000,
    windowsHide: true,
  });
  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  assert.equal(result.error, undefined, `cargo test failed to launch: ${result.error}`);
  assert.equal(result.status, 0, `cargo test failed:\n${output.slice(-6000)}`);

  const summary = output.match(/test result: ok\. (\d+) passed; (\d+) failed/);
  assert.ok(summary, `cargo test produced no success summary:\n${output.slice(-4000)}`);
  const passed = Number(summary[1]);
  assert.equal(Number(summary[2]), 0, 'cargo test reported failures');
  assert.equal(passed, declaredTests,
    `every declared #[test] must run and pass (${declaredTests} declared, ${passed} passed)`);
});