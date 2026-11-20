import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// scripts/batch-evidence/D05-E03-verification-separation.test.mjs
// Unit NEXT:D05-E03-test-discovery — closure classes TEST/PROOF, FURTHER TRACE,
// EXISTING BOUNDARY.
//
// Acceptance (from the ledger): "Runs as optional developer validation; product
// can start without it." Every work row in this unit says "Keep <verification
// script> separate from customer runtime; no artificial product gate."
//
// This test proves the absence is harmless: no customer runtime entry point
// imports or requires any of the unit's verification/coordination scripts, so
// the product startup path never loads optional developer validation.
//
// It is intentionally source-only: it boots nothing, spins up no server, and
// makes no product dependency on these scripts.

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const read = (p) => readFileSync(join(REPO_ROOT, p), 'utf8');
const toPosix = (abs) => abs.split(sep).join('/');

// Verification / coordination scripts owned by this unit. Each corresponding
// ledger row requires them to stay separate from customer runtime.
const VERIFICATION_SCRIPTS = [
  'integration/scripts/pwa-run-now.mjs',
  'scripts/batch-evidence/A02.mjs',
  'scripts/batch-evidence/CHAT-BOX-BASELINE.mjs',
  'scripts/batch-evidence/RDCB-BASELINE.mjs',
  'scripts/batch-evidence/RDCB-REUSE.mjs',
  'scripts/batch-evidence/WIKI-BASELINE.mjs',
  'scripts/feedback-loop/compile.mjs',
  'scripts/feedback-loop/compiler.mjs',
  'scripts/lib/test-manifest.mjs',
  'scripts/roadmap/a05-cycle.mjs',
  'scripts/test-gate.mjs',
];

// Customer runtime entry points: the pwa-main.yml syntax-check step plus the
// sources enumerated by integration/scripts/pwa-run-now.mjs. If any of these
// imported a verification script, the product would depend on optional
// developer validation and could not start without it.
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

// Capture import / require specifiers from a source file. Approximation is
// deliberate: a false positive only makes this gate stricter; the assertion is
// about the absence of real dependencies on verification scripts.
function importSpecifiers(source) {
  const specs = [];
  for (const m of source.matchAll(/(?:from\s+|\(\s*)['"]([^'"]+)['"]/g)) {
    specs.push(m[1]);
  }
  return specs;
}

// Resolve a relative specifier against an entry point's directory to a
// repo-relative POSIX path, or null when it does not point at an existing repo
// file. Existence is required so the check is never vacuous.
function resolveSpecifier(entryPoint, specifier) {
  const base = resolve(REPO_ROOT, dirname(entryPoint));
  for (const ext of ['', '.mjs', '.js', '.cjs']) {
    const abs = resolve(base, specifier + ext);
    if (abs === REPO_ROOT || abs.startsWith(REPO_ROOT + sep)) {
      try {
        readFileSync(abs, 'utf8');
        return toPosix(abs);
      } catch { continue; }
    }
  }
  return null;
}

test('verification scripts are present (the check is not vacuous)', () => {
  for (const s of VERIFICATION_SCRIPTS) {
    assert.doesNotThrow(() => read(s), s + ' must exist');
  }
});

test('customer runtime entry points are present (the check is not vacuous)', () => {
  for (const e of CUSTOMER_ENTRY_POINTS) {
    assert.doesNotThrow(() => read(e), e + ' must exist');
  }
});

test('no customer runtime entry point imports a verification script', () => {
  const violations = [];
  for (const entry of CUSTOMER_ENTRY_POINTS) {
    const source = read(entry);
    for (const spec of importSpecifiers(source)) {
      const resolved = resolveSpecifier(entry, spec);
      if (resolved && VERIFICATION_SCRIPTS.includes(resolved)) {
        violations.push(`${entry} imports ${resolved} via ${spec}`);
      }
    }
  }
  assert.deepEqual(
    violations,
    [],
    'customer runtime must not import verification scripts (no artificial product gate):\n' +
      violations.join('\n'),
  );
});

test('product can start without verification scripts (absence is harmless)', () => {
  let dependent = false;
  let dependentOn = '';
  for (const entry of CUSTOMER_ENTRY_POINTS) {
    const source = read(entry);
    for (const s of VERIFICATION_SCRIPTS) {
      if (
        importSpecifiers(source).some((spec) => {
          const r = resolveSpecifier(entry, spec);
          return r !== null && r === s;
        })
      ) {
        dependent = true;
        dependentOn = entry + ' -> ' + s;
        break;
      }
    }
    if (dependent) break;
  }
  assert.equal(
    dependent,
    false,
    'no customer entry point depends on a verification script, so the product ' +
      'starts without optional developer validation' +
      (dependentOn ? ' (violation: ' + dependentOn + ')' : ''),
  );
});
