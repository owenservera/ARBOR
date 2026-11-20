# File: studio/bin/commands/setup.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/setup.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6478 B |
| Lines | 126 |
| Hash | 0c61fd78813e |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| resolveManifestFile | function | 15 | no | const resolveManifestFile = (env = process.env) =&gt; { |
| explicit | const | 16 | no | const explicit = workspaceManifestFile(env); |
| ask | function | 24 | no | const ask = (rl, prompt) =&gt; new Promise((resolve) =&gt; { rl.question(prompt + &#39; &#39;, (answer) =&gt; resolve(answer.trim() \|\| undefined)); rl.once(&#39;close&#39;, () =&gt; resolve(undefined)); }); |
| assertAbsolute | function | 29 | no | const assertAbsolute = (label, value) =&gt; { |
| assertPort | function | 33 | no | const assertPort = (label, value) =&gt; { |
| n | const | 34 | no | const n = Number(value); |
| manifestFile | const | 62 | no | const manifestFile = resolveManifestFile(); |
| rl | const | 63 | no | const rl = createInterface({ input: process.stdin, output: process.stdout }); |
| promptFor | function | 65 | no | const promptFor = async (label, value, validate) =&gt; { |
| answer | const | 68 | no | const answer = await ask(rl, `&gt; ${label}:`); |
| workspaceRoot | const | 74 | no | const workspaceRoot = await promptFor(&#39;Workspace root&#39;, flags[&#39;workspace-root&#39;], assertAbsolute); |
| chromeExe | const | 75 | no | const chromeExe = await promptFor(&#39;Chrome executable&#39;, flags[&#39;chrome-exe&#39;], assertAbsolute); |
| chromeProfile | const | 76 | no | const chromeProfile = await promptFor(&#39;Chrome profile directory&#39;, flags[&#39;chrome-profile&#39;], assertAbsolute); |
| cdpPort | const | 77 | no | const cdpPort = await promptFor(&#39;CDP port&#39;, flags[&#39;cdp-port&#39;] !== undefined ? String(flags[&#39;cdp-port&#39;]) : &#39;38702&#39;, assertPort); |
| relay | variable | 79 | no | let relay = { enabled: false }; |
| manifest | const | 91 | no | const manifest = buildManifest({ workspaceRoot, chrome: { executable: chromeExe, profileDir: chromeProfile, port: cdpPort }, relay, setupComplete: false, |
| confirm | const | 114 | no | const confirm = await ask(rl, &#39;&gt; &#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 5 | external |
| node:readline | import | 6 | external |
| node:fs | import | 7 | external |
| ../lib/registry.mjs | import | 8 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 9 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../../src/workspace-manifest.mjs | import | 10 | [studio/src/workspace-manifest.mjs](../../src/workspace-manifest.mjs.md) |
| ../../src/config.mjs | import | 13 | [studio/src/config.mjs](../../src/config.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/setup.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 127 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
