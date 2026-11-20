# File: studio/bin/commands/system.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/system.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12562 B |
| Lines | 199 |
| Hash | a7f437f6e8d5 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| words | const | 18 | no | const words = ctx.args; |
| data | const | 34 | no | const data = { version: VERSION, collectorSourceSha: collectorSourceSha(), node: process.version, platform: `${process.platform}-${process.arch}` }; |
| checks | const | 46 | no | const checks = []; |
| add | function | 47 | no | const add = (name, level, detail, fix = &#39;&#39;) =&gt; checks.push({ name, level, detail, fix }); |
| major | const | 49 | no | const major = Number(process.versions.node.split(&#39;.&#39;)[0]); |
| chrome | variable | 52 | no | let chrome = null; try { chrome = findChrome(); } catch { /* reported below */ } |
| doctorManifestFile | const | 56 | no | const doctorManifestFile = workspaceManifestFile() ?? path.join(paths.root, MANIFEST_FILE); |
| probePort | variable | 57 | no | let probePort = port; |
| up | const | 59 | no | const up = await isReachable({ port: probePort }); |
| browser | variable | 60 | no | let browser = null; if (up) { try { browser = (await browserVersion({ port: probePort })).Browser; } catch { /* raced */ } } |
| writable | variable | 63 | no | let writable = true; try { accessSync(paths.root, constants.W_OK); } catch { writable = false; } |
| sessions | const | 66 | no | const sessions = ctx.listSessions(); |
| bytes | const | 67 | no | const bytes = sessions.reduce((a, s) =&gt; a + (s.rawBytes ?? 0), 0); |
| incomplete | const | 68 | no | const incomplete = sessions.filter((s) =&gt; s.status === &#39;recording&#39;); |
| names | const | 73 | no | const names = ctx.profiles().names(); |
| errors | variable | 74 | no | let errors = 0, warns = 0; |
| l | const | 80 | no | const l = ctx.learner(); |
| manifestFile | const | 88 | no | const manifestFile = workspaceManifestFile() ?? path.join(paths.root, MANIFEST_FILE); |
| w | const | 92 | no | const w = diagnoseWorkspace(manifestFile); |
| failed | const | 93 | no | const failed = w.checks.filter((c) =&gt; c.status === &#39;fail&#39;); |
| failed | const | 97 | no | const failed = checks.some((c) =&gt; c.level === &#39;fail&#39;); |
| nextSteps | const | 98 | no | const nextSteps = [ |
| mark | const | 104 | no | const mark = { ok: o.c.green(&#39;ok &#39;), warn: o.c.yellow(&#39;warn&#39;), fail: o.c.red(&#39;FIX &#39;) }; |
| data | const | 120 | no | const data = { ...ctx.paths }; |
| rows | const | 131 | no | const rows = Object.entries(SETTINGS_SCHEMA).map(([key, spec]) =&gt; ({ key, value: ctx.settings[key], source: ctx.sources[key], env: spec.env, description: spec.desc })); |
| value | const | 155 | no | const value = parseSetting(key, rest.join(&#39; &#39;)); |
| had | const | 170 | no | const had = key in values; |
| shell | const | 187 | no | const shell = ctx.args[0]; |
| rows | const | 196 | no | const rows = allCommands().filter((c) =&gt; !c.hidden).map((c) =&gt; ({ command: c.name, section: c.section, summary: c.summary, usage: c.usage, flags: Object.keys(c.flags) })); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 2 | external |
| node:fs | import | 3 | external |
| ../../src/config.mjs | import | 4 | [studio/src/config.mjs](../../src/config.mjs.md) |
| ../../src/workspace-manifest.mjs | import | 5 | [studio/src/workspace-manifest.mjs](../../src/workspace-manifest.mjs.md) |
| ../../src/chrome/launch.mjs | import | 6 | [studio/src/chrome/launch.mjs](../../src/chrome/launch.mjs.md) |
| ../../src/cdp/discovery.mjs | import | 7 | [studio/src/cdp/discovery.mjs](../../src/cdp/discovery.mjs.md) |
| ../../src/profiles/manage.mjs | import | 8 | [studio/src/profiles/manage.mjs](../../src/profiles/manage.mjs.md) |
| ../lib/registry.mjs | import | 9 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 10 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/system.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// help, version, doctor, paths, config, completion
import path from 'node:path';
import { accessSync, constants, existsSync } from 'node:fs';
import { VERSION, collectorSourceSha, SETTINGS_SCHEMA, parseSetting, loadUserConfig, saveUserConfig, EXIT, workspaceManifestFile } from '../../src/config.mjs';
import { diagnoseWorkspace, readManifest, MANIFEST_FILE } from '../../src/workspace-manifest.mjs';
import { findChrome } from '../../src/chrome/launch.mjs';
import { isReachable, browserVersion } from '../../src/cdp/discovery.mjs';
import { lintProfile } from '../../src/profiles/manage.mjs';
import { define, defineGroup, allGroups, renderRootHelp, renderCommandHelp, renderGroupHelp, resolveCommand, completionScript, allCommands } from '../lib/registry.mjs';
import { usageError, fmtBytes } from '../lib/ui.mjs';

// ---------------------------------------------------------------------------------------------
define({
  name: 'help', section: 'Get started', usage: '[command]', summary: 'Show help for a command',
  description: 'Show the command list, or the options and examples for one command (e.g. "studio help export dataset").',
  noData: true,
  async run(ctx) {
    const words = ctx.args;
    const { out } = ctx;
    if (!words.length) {
      out.raw(`${renderRootHelp({ version: VERSION, dataDir: ctx.paths.root })}\n`);
      out.raw('Windows: double-click scripts/windows/VIVIM.cmd to open your local World.\nVIVIM uses your own AI website accounts, not API keys. Sign in yourself in the dedicated VIVIM browser; never share your password with VIVIM.\n');
      return;
    }
    if (allGroups().has(words[0]) && !words[1]) { out.raw(`${renderGroupHelp(words[0])}\n`); return; }
    const { def } = resolveCommand(words);
    out.raw(`${renderCommandHelp(def)}\n`);
  },
});

define({
  name: 'version', section: 'System', summary: 'Print the version and collector source hash', noData: true,
  async run(ctx) {
    const data = { version: VERSION, collectorSourceSha: collectorSourceSha(), node: process.version, platform: `${process.platform}-${process.arch}` };
    ctx.out.emit(data, (o) => o.result(`${VERSION} ${data.collectorSourceSha}`));
  },
});

// ---------------------------------------------------------------------------------------------
define({
  name: 'doctor', section: 'Get started', summary: 'Check whether your computer and VIVIM browser are ready',
  description: 'Runs environment and data-health checks. Exits 5 when something required is missing, 0 otherwise (a stopped capture browser is only a warning).',
  flags: { fix: { type: 'boolean', desc: 'Print the suggested fix for every non-ok check' } },
  async run(ctx) {
    const { out, paths, port } = ctx;
    const checks = [];
    const add = (name, level, detail, fix = '') => checks.push({ name, level, detail, fix });

    const major = Number(process.versions.node.split('.')[0]);
    add('node', major >= 22 ? 'ok' : 'fail', process.version, major >= 22 ? '' : 'Install Node 22 or newer (built-in WebSocket is required).');

    let chrome = null; try { chrome = findChrome(); } catch { /* reported below */ }
    add('chrome', chrome ? 'ok' : 'fail', chrome ?? 'not found', chrome ? '' : 'Install Google Chrome (or Edge) or set CHROME_PATH.');

    // The owner's complete workspace manifest names the Studio CDP port; probe that, not the generic default.
    const doctorManifestFile = workspaceManifestFile() ?? path.join(paths.root, MANIFEST_FILE);
    let probePort = port;
    try { const { manifest } = readManifest(doctorManifestFile); if (manifest?.setupComplete === true && Number.isInteger(manifest.chrome?.port)) probePort = manifest.chrome.port; } catch { /* no manifest: default port */ }
    const up = await isReachable({ port: probePort });
    let browser = null; if (up) { try { browser = (await browserVersion({ port: probePort })).Browser; } catch { /* raced */ } }
    add('devtools', up ? 'ok' : 'warn', up ? `VIVIM browser connection available at 127.0.0.1:${probePort} (${browser ?? 'unknown'}); profile and sign-in not checked` : `VIVIM browser is not available at 127.0.0.1:${probePort}`, up ? '' : 'On Windows, double-click scripts/windows/VIVIM.cmd. It checks for an existing VIVIM before opening the dedicated browser. Keep your normal browser open.');

    let writable = true; try { accessSync(paths.root, constants.W_OK); } catch { writable = false; }
    add('data-dir', writable ? 'ok' : 'fail', paths.root, writable ? '' : 'Choose a writable --data-dir.');

    const sessions = ctx.listSessions();
    const bytes = sessions.reduce((a, s) => a + (s.rawBytes ?? 0), 0);
    const incomplete = sessions.filter((s) => s.status === 'recording');
    add('sessions', incomplete.length ? 'warn' : 'ok', `${sessions.length} saved, ${fmtBytes(bytes)} raw${incomplete.length ? `, ${incomplete.length} still marked "recording" (crashed or running)` : ''}`,
      incomplete.length ? 'Run "studio verify <id>" then "studio derive <id>" on interrupted sessions.' : '');

    try {
      const names = ctx.profiles().names();
      let errors = 0, warns = 0;
      for (const n of names) for (const i of lintProfile(ctx.profiles().load(n))) i.level === 'error' ? errors++ : warns++;
      add('profiles', errors ? 'fail' : warns ? 'warn' : 'ok', `${names.length} profiles${errors || warns ? `, ${errors} error(s), ${warns} warning(s)` : ''}`, errors || warns ? 'Run "studio profile lint --all".' : '');
    } catch (e) { add('profiles', 'fail', e.message, 'Check the profiles folder.'); }

    try {
      const l = ctx.learner();
```

_First 80 of 200 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
