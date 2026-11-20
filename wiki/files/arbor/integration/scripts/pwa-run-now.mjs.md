# File: integration/scripts/pwa-run-now.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | integration/scripts/pwa-run-now.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4480 B |
| Lines | 91 |
| Hash | 2b6b7f685501 |
| Test | no |
| Generated | no |
| Component | integration |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 7 | no | const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;../..&#39;); |
| suites | const | 8 | no | const suites = [ |
| sources | const | 51 | no | const sources = [ |
| results | const | 74 | no | const results = []; |
| run | function | 75 | no | function run(name, args) { |
| p | const | 77 | no | const p = spawnSync(process.execPath, args, { cwd: root, stdio: &#39;inherit&#39; }); |
| exitCode | const | 78 | no | const exitCode = p.error ? null : p.status; |
| failed | const | 85 | no | const failed = results.filter(r =&gt; r.exitCode !== 0); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 3 | external |
| node:url | import | 4 | external |
| node:path | import | 5 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
    'apps/vivim-host/test/native-program.test.mjs',
    'apps/vivim-host/test/native-capture-wiring.test.mjs',
    'apps/vivim-host/test/development-read-port.test.mjs',
    'apps/mobile-relay/test/workspace-template-wiring.test.mjs',
    'apps/mobile-relay/test/workspace-live-data.test.mjs',
    'apps/mobile-relay/test/pwa-preflight-ui.test.mjs',
    'apps/mobile-relay/test/pwa-asset-graph.test.mjs',
    'apps/mobile-relay/test/chat-universal-controller.test.mjs',
    'apps/mobile-relay/test/pwa-voice-capture.test.mjs',
    'apps/mobile-relay/test/local-dictation.test.mjs'
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
  'apps/mobile-relay/ux/local-dictation.mjs',
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
```

_First 80 of 92 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
