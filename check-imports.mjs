const fs = require("fs");
const path = require("path");

const VERIFICATION_SCRIPTS = [
  "integration/scripts/pwa-run-now.mjs",
  "scripts/batch-evidence/A02.mjs",
  "scripts/batch-evidence/CHAT-BOX-BASELINE.mjs",
  "scripts/batch-evidence/RDCB-BASELINE.mjs",
  "scripts/batch-evidence/RDCB-REUSE.mjs",
  "scripts/batch-evidence/WIKI-BASELINE.mjs",
  "scripts/feedback-loop/compile.mjs",
  "scripts/feedback-loop/compiler.mjs",
  "scripts/lib/test-manifest.mjs",
  "scripts/roadmap/a05-cycle.mjs",
  "scripts/test-gate.mjs",
];

const REPO_ROOT = "C:/0-BlackBoxProject-0/ARBOR";

const CUSTOMER_ENTRY_POINTS = [
  "apps/vivim-host/server.mjs",
  "apps/vivim-host/direct-phone.mjs",
  "apps/vivim-host/chat/rust-context.mjs",
  "apps/vivim-host/chat/provider-projection.mjs",
  "apps/vivim-host/onboarding/service.mjs",
  "apps/vivim-host/media/playback.mjs",
  "apps/vivim-host/media/library-summary.mjs",
  "apps/vivim-host/media/stream-guard.mjs",
  "apps/mobile-relay/app.js",
  "apps/mobile-relay/control-client.mjs",
  "apps/mobile-relay/build-canvas.mjs",
  "apps/mobile-relay/build-composer.mjs",
  "apps/mobile-relay/sw.js",
  "apps/mobile-relay/vec/compiler.mjs",
  "apps/mobile-relay/vec/ui-adapter.mjs",
  "apps/mobile-relay/ux/render.mjs",
  "apps/mobile-relay/ux/readiness.mjs",
  "apps/mobile-relay/ux/launcher.mjs",
  "apps/mobile-relay/ux/launcher-ui.mjs",
  "apps/mobile-relay/ux/local-notes.mjs",
  "apps/mobile-relay/ux/local-notes-ui.mjs",
  "apps/mobile-relay/ux/voice-capture.mjs",
  "apps/mobile-relay/ux/local-dictation.mjs",
  "apps/mobile-relay/generative-ui/host-revision-guard.mjs",
];

function importSpecifiers(source) {
  const specs = [];
  for (const m of source.matchAll(/(?:from\s+|\s*)["']([^"']+)["']/g)) {
    specs.push(m[1]);
  }
  return specs;
}

function resolveSpecifier(entryPoint, specifier) {
  const base = path.resolve(REPO_ROOT, path.dirname(entryPoint));
  for (const ext of ["", ".mjs", ".js", ".cjs"]) {
    const abs = path.resolve(base, specifier + ext);
    if (abs === REPO_ROOT || abs.startsWith(REPO_ROOT + path.sep)) {
      try {
        fs.readFileSync(abs, "utf8");
        return abs.replace(REPO_ROOT, "").replace(/\\/g, "/");
      } catch { continue; }
    }
  }
  return null;
}

let foundAny = false;
for (const entry of CUSTOMER_ENTRY_POINTS) {
  if (!fs.existsSync(entry)) { console.log(entry + " does not exist"); continue; }
  const source = fs.readFileSync(entry, "utf8");
  const specs = importSpecifiers(source);
  for (const spec of specs) {
    const resolved = resolveSpecifier(entry, spec);
    if (resolved && VERIFICATION_SCRIPTS.includes(resolved)) {
      console.log("VIOLATION: " + entry + " imports " + resolved + " via " + spec);
      foundAny = true;
    }
  }
}
if (!foundAny) {
  console.log("No violations found - customer runtime does not import verification scripts");
}