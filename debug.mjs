const fs = require('fs');
const path = require('path');
const REPO_ROOT = 'C:\\0-BlackBoxProject-0\\ARBOR';

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

function importSpecifiers(source) {
  const specs = [];
  for (const m of source.matchAll(/(?:from\s+|\(\s*)['"]([^'"]+)['"]/g)) {
    specs.push(m[1]);
  }
  return specs;
}

function resolveSpecifier(entryPoint, specifier) {
  const base = path.resolve(REPO_ROOT, path.dirname(entryPoint));
  for (const ext of ['', '.mjs', '.js', '.cjs']) {
    const abs = path.resolve(base, specifier + ext);
    if (abs === REPO_ROOT || abs.startsWith(REPO_ROOT + path.sep)) {
      try {
        fs.readFileSync(abs, 'utf8');
        return abs.replace(/\\/g, '/');
      } catch { continue; }
    }
  }
  return null;
}

// Check first few entries
for (const entry of CUSTOMER_ENTRY_POINTS.slice(0, 5)) {
  console.log('Checking:', entry);
  try {
    const source = fs.readFileSync(path.join(REPO_ROOT, entry), 'utf8');
    const specs = importSpecifiers(source);
    console.log('  Specifiers found:', specs.length);
    for (const spec of specs) {
      const r = resolveSpecifier(entry, spec);
      if (r) {
        console.log('  Resolved:', spec, '->', r);
      }
    }
  } catch (e) {
    console.log('  Error:', e.message);
  }
}

// Now check all entries with all scripts
console.log('\n=== Full check ===');
let totalChecks = 0;
let foundAny = false;
for (const entry of CUSTOMER_ENTRY_POINTS) {
  try {
    const source = fs.readFileSync(path.join(REPO_ROOT, entry), 'utf8');
    const specs = importSpecifiers(source);
    for (const s of VERIFICATION_SCRIPTS) {
      totalChecks++;
      const r = resolveSpecifier(entry, s);
      if (r !== null) {
        // Check if it matches the script name
        if (VERIFICATION_SCRIPTS.includes(r)) {
          console.log('VIOLATION:', entry, '->', s, '(resolved to', r + ')');
          foundAny = true;
        }
      }
    }
  } catch (e) {
    console.log('Error reading', entry, ':', e.message);
  }
}
console.log('Total checks:', totalChecks);
console.log('Found any violations:', foundAny);