// scripts/batch-evidence/D05-E01-w01g-optional.test.mjs
// Unit VERIFY:D05-E01 "reproducible packaging" — owned paths:
//   integration/scripts/w01g-r001-windows.ps1
//   .github/workflows/w01g-reproducibility.yml
//
// Acceptance (INVERTED, from the ledger): optional developer validation; the
// product must still start without it. The test proves the absence is harmless
// and does not make the product depend on either w01g artifact.
//
//   AT-D0D7C8C05B02  integration/scripts/w01g-r001-windows.ps1
//     "Keep w01g r001 windows verification/coordination script separate from
//      customer runtime; no artificial product gate."
//   AT-1509A983D318  .github/workflows/w01g-reproducibility.yml
//     "Trace build/install/runtime entry points, reproducibility and dependencies."
//
// Both artifacts are CI/developer verification only: neither is imported by the
// customer runtime, neither is staged into the packaged Host runtime, and the
// Host runtime import closure does not reference them. Nothing here fakes a pass
// — every assertion is structural and against real, existing files.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STAGED_DIRS, STAGED_TOP_FILES, PACKAGED_BINARIES,
  runtimeImportClosure, stagedCoverage,
} from '../../tools/packaging/prepare-host-runtime.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const read = (p) => readFileSync(join(REPO_ROOT, p), 'utf8');
const toPosix = (abs) => abs.split(sep).join('/');

// The two w01g artifacts owned by this unit. Each ledger row requires them to
// stay separate from customer runtime: no artificial product gate.
const W01G_ARTIFACTS = [
  'integration/scripts/w01g-r001-windows.ps1',
  '.github/workflows/w01g-reproducibility.yml',
];

// Customer runtime entry points whose import closure the packaged Host must
// satisfy. If any of these depended on a w01g artifact, the product could not
// start without optional developer validation. Sourced from D05-E03's real
// entry-point list so the check is never vacuous.
const CUSTOMER_ENTRY_POINTS = [
  'apps/vivim-host/server.mjs',
  'apps/vivim-host/direct-phone.mjs',
  'apps/vivim-host/chat/rust-context.mjs',
  'apps/vivim-host/chat/provider-projection.mjs',
  'apps/vivim-host/onboarding/service.mjs',
  'apps/vivim-host/media/playback.mjs',
  'apps/vivim-host/media/library-summary.mjs',
  'apps/vivim-host/media/stream-guard.mjs',
  'apps/mobile-relay/app.js',
  'apps/mobile-relay/control-client.mjs',
  'apps/mobile-relay/build-canvas.mjs',
  'apps/mobile-relay/build-composer.mjs',
  'apps/mobile-relay/sw.js',
  'apps/mobile-relay/vec/compiler.mjs',
  'apps/mobile-relay/vec/ui-adapter.mjs',
  'apps/mobile-relay/ux/render.mjs',
  'apps/mobile-relay/ux/readiness.mjs',
  'apps/mobile-relay/ux/launcher.mjs',
  'apps/mobile-relay/ux/launcher-ui.mjs',
  'apps/mobile-relay/ux/local-notes.mjs',
  'apps/mobile-relay/ux/local-notes-ui.mjs',
  'apps/mobile-relay/ux/voice-capture.mjs',
  'apps/mobile-relay/ux/local-dictation.mjs',
  'apps/mobile-relay/generative-ui/host-revision-guard.mjs',
];

function importSpecifiers(source) {
  const specs = [];
  for (const m of source.matchAll(/(?:from\s+|\(\s*)['"]([^'"]+)['"]/g)) specs.push(m[1]);
  return specs;
}

function resolveSpecifier(entryPoint, specifier) {
  const base = resolve(REPO_ROOT, dirname(entryPoint));
  for (const ext of ['', '.mjs', '.js', '.cjs']) {
    const abs = resolve(base, specifier + ext);
    if (abs === REPO_ROOT || abs.startsWith(REPO_ROOT + sep)) {
      try { readFileSync(abs, 'utf8'); return toPosix(abs); } catch { continue; }
    }
  }
  return null;
}

test('D05-E01: w01g artifacts are present (the check is not vacuous)', () => {
  for (const a of W01G_ARTIFACTS) assert.doesNotThrow(() => read(a), a + ' must exist');
});

test('D05-E01: customer runtime entry points are present (the check is not vacuous)', () => {
  for (const e of CUSTOMER_ENTRY_POINTS) assert.doesNotThrow(() => read(e), e + ' must exist');
});

test('D05-E01: no customer runtime entry point depends on a w01g artifact', () => {
  const violations = [];
  for (const entry of CUSTOMER_ENTRY_POINTS) {
    const source = read(entry);
    for (const spec of importSpecifiers(source)) {
      const resolved = resolveSpecifier(entry, spec);
      if (resolved && W01G_ARTIFACTS.includes(resolved)) {
        violations.push(`${entry} depends on ${resolved} via ${spec}`);
      }
    }
  }
  assert.deepEqual(
    violations, [],
    'no artificial product gate: a customer entry point must not depend on optional developer validation:\n' +
      violations.join('\n'),
  );
});

test('D05-E01: no w01g artifact is staged into the packaged runtime', () => {
  const staged = [
    ...STAGED_DIRS,
    ...STAGED_TOP_FILES,
    ...PACKAGED_BINARIES.map((name) => 'native/bin/' + name + '.exe'),
  ];
  for (const a of W01G_ARTIFACTS) {
    assert.ok(!staged.includes(a), a + ' must not be staged into the packaged runtime');
    assert.ok(!stagedCoverage(a), a + ' must not be covered by the staged payload');
  }
});

test('D05-E01: the Host runtime import closure does not include a w01g artifact', () => {
  const closure = runtimeImportClosure();
  for (const a of W01G_ARTIFACTS) {
    assert.ok(!closure.includes(a), a + ' must not be in the Host runtime import closure');
  }
});

test('D05-E01: the product starts without w01g developer validation (absence is harmless)', () => {
  let dependent = false;
  for (const entry of CUSTOMER_ENTRY_POINTS) {
    const source = read(entry);
    if (
      importSpecifiers(source).some((spec) => {
        const r = resolveSpecifier(entry, spec);
        return r !== null && W01G_ARTIFACTS.includes(r);
      })
    ) {
      dependent = true;
      break;
    }
  }
  assert.equal(
    dependent,
    false,
    'no customer entry point depends on a w01g artifact, so the product starts without optional developer validation',
  );
});
