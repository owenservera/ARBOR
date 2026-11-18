// One command to exercise real Node PWA and Host tests in the current checkout.
// No branch, PR, provider key, download, installation or background service.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const suites = [
  ['Mobile UI, pairing, deterministic Build and offline shell', [
    'apps/mobile-relay/test/ux-surfaces.test.mjs',
    'apps/mobile-relay/test/control-tab-navigation.test.mjs',
    'apps/mobile-relay/test/vec-ui-compiler.test.mjs',
    'apps/mobile-relay/test/build-vec-routing.test.mjs',
    'apps/mobile-relay/test/build-composer.test.mjs',
    'apps/mobile-relay/test/component-presentation.test.mjs',
    'apps/mobile-relay/test/shell-presentation.test.mjs',
    'apps/mobile-relay/test/tierflow-build.test.mjs',
    'apps/mobile-relay/test/host-build-consumer.test.mjs',
    'apps/mobile-relay/test/browser-enrollment-flow.test.mjs',
    'apps/mobile-relay/test/service-worker.test.mjs',
    'apps/mobile-relay/test/host-static-allowlist-contract.test.mjs',
    'apps/mobile-relay/test/pwa-activation-readiness.test.mjs',
    'apps/mobile-relay/test/pwa-local-notes.test.mjs',
    'apps/vivim-host/test/wiki-capture.test.mjs',
    'apps/mobile-relay/test/pwa-preflight-ui.test.mjs',
    'apps/mobile-relay/test/pwa-asset-graph.test.mjs',
    'apps/mobile-relay/test/chat-universal-controller.test.mjs',
    'apps/mobile-relay/test/pwa-voice-capture.test.mjs'
  ]],
  ['Host entry, authorization and Direct phone HTTP', [
    'apps/vivim-host/test/mobile-first-entry.test.mjs',
    'apps/vivim-host/test/control-browser-session.test.mjs',
    'apps/vivim-host/test/control-http.test.mjs',
    'apps/vivim-host/test/direct-phone.test.mjs',
    'apps/vivim-host/test/chat-rust-context.test.mjs',
    'apps/vivim-host/test/chat-provider-projection.test.mjs'
  ]],
  ['HQ media mapping, streaming and revocation', [
    'apps/vivim-host/test/media-library-summary.test.mjs',
    'apps/vivim-host/test/media-playback.test.mjs',
    'apps/vivim-host/test/media-stream-guard.test.mjs',
    'apps/vivim-host/test/media-stream-http.test.mjs'
  ]]
];
const sources = [
  'apps/vivim-host/server.mjs',
  'apps/vivim-host/direct-phone.mjs',
  'apps/vivim-host/chat/rust-context.mjs',
  'apps/vivim-host/chat/provider-projection.mjs',
  'apps/vivim-host/onboarding/service.mjs',
  'apps/vivim-host/media/playback.mjs',
  'apps/vivim-host/media/stream-guard.mjs',
  'apps/vivim-host/media/library-summary.mjs',
  'apps/mobile-relay/app.js',
  'apps/mobile-relay/ux/render.mjs',
  'apps/mobile-relay/ux/readiness.mjs',
  'apps/mobile-relay/ux/launcher.mjs',
  'apps/mobile-relay/ux/launcher-ui.mjs',
  'apps/mobile-relay/ux/local-notes.mjs',
  'apps/mobile-relay/ux/local-notes-ui.mjs',
  'apps/mobile-relay/ux/voice-capture.mjs',
  'apps/mobile-relay/generative-ui/host-revision-guard.mjs',
  'apps/mobile-relay/sw.js',
  'apps/mobile-relay/vec/compiler.mjs',
  'apps/mobile-relay/vec/ui-adapter.mjs'
];
const results = [];
function run(name, args) {
  process.stdout.write('\n=== ' + name + ' ===\n');
  const p = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  const exitCode = p.error ? null : p.status;
  results.push({ name, exitCode, signal: p.signal ?? null,
    error: p.error ? String(p.error.message) : null });
  if (p.error) process.stderr.write(p.error.message + '\n');
}
for (const file of sources) run('Syntax ' + file, ['--check', file]);
for (const [name, files] of suites) run(name, ['--test', ...files]);
const failed = results.filter(r => r.exitCode !== 0);
process.stdout.write('\nPWA actual Node results\n' + JSON.stringify({
  schema: 'arbor.pwa-node-test-result/1',
  runtime: process.version, platform: process.platform, arch: process.arch,
  passed: results.length - failed.length, failed: failed.length, results
}, null, 2) + '\n');
if (failed.length) process.exitCode = 1;
