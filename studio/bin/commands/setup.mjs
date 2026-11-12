// START01/START02: `studio setup` — interactive workspace setup wizard.
// Writes the workspace manifest (vivim-workspace.json) that `vivim start` resolves
// via resolveStartConfig. No secret values are ever stored inline; secret references
// are file paths only. Prompts for any value not supplied via flags.
import path from 'node:path';
import { createInterface } from 'node:readline';
import { existsSync, mkdirSync } from 'node:fs';
import { define } from '../lib/registry.mjs';
import { usageError } from '../lib/ui.mjs';
import {
  buildManifest, writeManifest, validateManifest, DENIED_CDP_PORTS, MANIFEST_FILE,
} from '../../src/workspace-manifest.mjs';
import { workspaceManifestFile } from '../../src/config.mjs';

const resolveManifestFile = (env = process.env) => {
  const explicit = workspaceManifestFile(env);
  if (explicit) return explicit;
  if (env.CAPTURE_STUDIO_HOME) return path.join(env.CAPTURE_STUDIO_HOME, MANIFEST_FILE);
  if (env.LOCALAPPDATA) return path.join(env.LOCALAPPDATA, 'VIVIM', MANIFEST_FILE);
  return path.join(env.HOME || env.USERPROFILE || '.', 'vivim-workspace.json');
};

// One line of interactive input; returns undefined on EOF (Ctrl+D).
const ask = (rl, prompt) => new Promise((resolve) => {
  rl.question(prompt + ' ', (answer) => resolve(answer.trim() || undefined));
  rl.once('close', () => resolve(undefined));
});

const assertAbsolute = (label, value) => {
  if (!value || !path.isAbsolute(value)) throw usageError(`${label} must be an absolute path, got "${value}".`);
  return value;
};
const assertPort = (label, value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1024 || n > 65535 || DENIED_CDP_PORTS.has(n)) {
    throw usageError(`${label} must be an integer 1024–65535 (excluding ${[...DENIED_CDP_PORTS].join(', ')}), got "${value}".`);
  }
  return n;
};

define({
  name: 'setup', section: 'Get started', summary: 'Run the workspace setup wizard',
  description: 'Creates vivim-workspace.json naming your data root, signed-in Chrome profile and CDP port. '
    + 'Run once before `studio start`/`studio stop`. Secrets are never stored inline — reference them by file path.',
  usage: '[--workspace-root DIR] [--chrome-exe PATH] [--chrome-profile DIR] [--cdp-port N] [--relay-url URL] [--relay-secret-file PATH] [--yes]',
  flags: {
    'workspace-root': { type: 'string', valueName: 'DIR', desc: 'Owner data root (default CAPTURE_STUDIO_HOME / C:\\VIVIM)' },
    'chrome-exe': { type: 'string', valueName: 'PATH', desc: 'Absolute path to Chrome or Edge executable' },
    'chrome-profile': { type: 'string', valueName: 'DIR', desc: 'Absolute path to the signed-in Chrome profile folder' },
    'cdp-port': { type: 'number', valueName: 'N', desc: 'Chrome DevTools port (default 38702)' },
    'relay-url': { type: 'string', valueName: 'URL', desc: 'Optional https origin of the mobile relay' },
    'relay-secret-file': { type: 'string', valueName: 'PATH', desc: 'Host secret file path when relay is enabled' },
    yes: { type: 'boolean', desc: 'Skip confirmation; write the manifest immediately' },
  },
  examples: [
    'studio setup --workspace-root C:\\VIVIM --chrome-exe "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --chrome-profile C:\\VIVIM\\chrome-profile --cdp-port 38702',
    'studio setup --yes --workspace-root C:\\VIVIM --chrome-exe ... --chrome-profile ... --cdp-port 38702',
  ],
  noData: true,
  async run(ctx) {
    const { flags, out } = ctx;
    const manifestFile = resolveManifestFile();
    const rl = createInterface({ input: process.stdin, output: process.stdout });

    const promptFor = async (label, value, validate) => {
      if (value !== undefined && value !== null && value !== '') return validate(label, value);
      out.line(`\n${label}`);
      const answer = await ask(rl, `> ${label}:`);
      rl.close();
      if (!answer) throw usageError(`${label} is required. Run "studio setup --help".`);
      return validate(label, answer);
    };

    const workspaceRoot = await promptFor('Workspace root', flags['workspace-root'], assertAbsolute);
    const chromeExe = await promptFor('Chrome executable', flags['chrome-exe'], assertAbsolute);
    const chromeProfile = await promptFor('Chrome profile directory', flags['chrome-profile'], assertAbsolute);
    const cdpPort = await promptFor('CDP port', flags['cdp-port'] !== undefined ? String(flags['cdp-port']) : '38702', assertPort);

    let relay = { enabled: false };
    if (flags['relay-url'] || flags['relay-secret-file']) {
      if (!flags['relay-url'] || !flags['relay-secret-file']) {
        throw usageError('--relay-url and --relay-secret-file must both be provided when enabling relay.');
      }
      relay = {
        enabled: true,
        origin: assertAbsolute('Relay URL', flags['relay-url']),
        hostSecretFile: assertAbsolute('Relay secret file', flags['relay-secret-file']),
      };
    }

    const manifest = buildManifest({
      workspaceRoot,
      chrome: { executable: chromeExe, profileDir: chromeProfile, port: cdpPort },
      relay,
      setupComplete: false,
    });

    const { ok, problems } = validateManifest(manifest, { exists: existsSync });
    if (!ok) {
      out.line('\nValidation problems:');
      for (const p of problems) out.line(`  - ${p.field}: ${p.message}`);
      throw usageError('Refusing to write an invalid manifest. Fix the values above.');
    }

    out.line(`\nManifest file: ${manifestFile}`);
    out.line(`  workspaceRoot: ${workspaceRoot}`);
    out.line(`  chrome.exe: ${chromeExe}`);
    out.line(`  chrome.profileDir: ${chromeProfile}`);
    out.line(`  chrome.port: ${cdpPort}`);
    out.line(`  relay.enabled: ${relay.enabled}`);

    if (!flags.yes) {
      out.line('\nType YES to write this manifest and mark setup complete:');
      const confirm = await ask(rl, '> ');
      rl.close();
      if (confirm !== 'YES') { out.line('Setup cancelled. Nothing was written.'); return; }
    } else {
      rl.close();
    }

    mkdirSync(path.dirname(manifestFile), { recursive: true });
    writeManifest(manifestFile, { ...manifest, setupComplete: true }, { exists: existsSync });
    out.line(`\nWorkspace setup complete: ${manifestFile}`);
    out.line('Next: run "studio start" to open your World, or double-click scripts/windows/VIVIM.cmd on Windows.');
  },
});
