# File: studio/bin/studio.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/bin/studio.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4839 B |
| Lines | 105 |
| Hash | b625eb6cda84 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| handled | const | 58 | no | const handled = process.emit(&#39;SIGINT&#39;); |
| main | function | 66 | no | async function main(argv) { |
| hasFlag | function | 67 | no | const hasFlag = (...names) =&gt; { const end = argv.indexOf(&#39;--&#39;); return argv.slice(0, end &lt; 0 ? undefined : end).some((a) =&gt; names.includes(a)); }; |
| words | const | 68 | no | const words = leadingWords(argv, GLOBAL_FLAGS, 2); |
| dataDir | function | 69 | no | const dataDir = (() =&gt; { const i = argv.findIndex((a) =&gt; a === &#39;--data-dir&#39; \|\| a.startsWith(&#39;--data-dir=&#39;)); if (i &lt; 0) return defaultDataDir(); return path.resolve(argv[i].includes(&#39;=&#39;) ? argv[i].sp… |
| i | const | 70 | no | const i = argv.findIndex((a) =&gt; a === &#39;--data-dir&#39; \|\| a.startsWith(&#39;--data-dir=&#39;)); |
| spec | const | 89 | no | const spec = { ...GLOBAL_FLAGS, ...def.flags }; |
| ctx | const | 93 | no | const ctx = buildContext({ def, flags, args: positional.slice(consumed), argv }); |
| out | const | 103 | no | const out = createOutput({ json: process.argv.includes(&#39;--json&#39;) }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 10 | external |
| ../src/config.mjs | import | 11 | [studio/src/config.mjs](../src/config.mjs.md) |
| ./lib/registry.mjs | import | 12 | [studio/bin/lib/registry.mjs](./lib/registry.mjs.md) |
| ./lib/args.mjs | import | 13 | [studio/bin/lib/args.mjs](./lib/args.mjs.md) |
| ./lib/context.mjs | import | 14 | [studio/bin/lib/context.mjs](./lib/context.mjs.md) |
| ./lib/ui.mjs | import | 15 | [studio/bin/lib/ui.mjs](./lib/ui.mjs.md) |
| ./commands/system.mjs | import | 17 | [studio/bin/commands/system.mjs](./commands/system.mjs.md) |
| ./commands/capture.mjs | import | 18 | [studio/bin/commands/capture.mjs](./commands/capture.mjs.md) |
| ./commands/sessions.mjs | import | 19 | [studio/bin/commands/sessions.mjs](./commands/sessions.mjs.md) |
| ./commands/replay.mjs | import | 20 | [studio/bin/commands/replay.mjs](./commands/replay.mjs.md) |
| ./commands/mirror.mjs | import | 21 | [studio/bin/commands/mirror.mjs](./commands/mirror.mjs.md) |
| ./commands/export.mjs | import | 22 | [studio/bin/commands/export.mjs](./commands/export.mjs.md) |
| ./commands/knowledge.mjs | import | 23 | [studio/bin/commands/knowledge.mjs](./commands/knowledge.mjs.md) |
| ./commands/platform.mjs | import | 24 | [studio/bin/commands/platform.mjs](./commands/platform.mjs.md) |
| ./commands/selftest.mjs | import | 25 | [studio/bin/commands/selftest.mjs](./commands/selftest.mjs.md) |
| ./commands/learn.mjs | import | 26 | [studio/bin/commands/learn.mjs](./commands/learn.mjs.md) |
| ./commands/profiles.mjs | import | 27 | [studio/bin/commands/profiles.mjs](./commands/profiles.mjs.md) |
| ./commands/drive.mjs | import | 28 | [studio/bin/commands/drive.mjs](./commands/drive.mjs.md) |
| ./commands/chat.mjs | import | 29 | [studio/bin/commands/chat.mjs](./commands/chat.mjs.md) |
| ./commands/atoms.mjs | import | 30 | [studio/bin/commands/atoms.mjs](./commands/atoms.mjs.md) |
| ./commands/state.mjs | import | 31 | [studio/bin/commands/state.mjs](./commands/state.mjs.md) |
| ./commands/wrap.mjs | import | 32 | [studio/bin/commands/wrap.mjs](./commands/wrap.mjs.md) |
| ./commands/run.mjs | import | 33 | [studio/bin/commands/run.mjs](./commands/run.mjs.md) |
| ./commands/library.mjs | import | 34 | [studio/bin/commands/library.mjs](./commands/library.mjs.md) |
| ./commands/campaign.mjs | import | 35 | [studio/bin/commands/campaign.mjs](./commands/campaign.mjs.md) |
| ./commands/tools.mjs | import | 36 | [studio/bin/commands/tools.mjs](./commands/tools.mjs.md) |
| ./commands/personal-agent.mjs | import | 37 | [studio/bin/commands/personal-agent.mjs](./commands/personal-agent.mjs.md) |
| ./commands/bridge.mjs | import | 38 | [studio/bin/commands/bridge.mjs](./commands/bridge.mjs.md) |
| ./commands/relay.mjs | import | 39 | [studio/bin/commands/relay.mjs](./commands/relay.mjs.md) |
| ./commands/companion.mjs | import | 40 | [studio/bin/commands/companion.mjs](./commands/companion.mjs.md) |
| ./commands/recipes.mjs | import | 41 | [studio/bin/commands/recipes.mjs](./commands/recipes.mjs.md) |
| ./commands/ask.mjs | import | 42 | [studio/bin/commands/ask.mjs](./commands/ask.mjs.md) |
| ./commands/providers.mjs | import | 43 | [studio/bin/commands/providers.mjs](./commands/providers.mjs.md) |
| ./commands/setup.mjs | import | 44 | [studio/bin/commands/setup.mjs](./commands/setup.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Capture Studio command line. Every command is a thin layer over the same engine the UI uses.
//
//   bin/studio.mjs                 entry point: parse, resolve, run, report errors with stable exit codes
//   bin/lib/args.mjs               strict zero-dependency argument parser
//   bin/lib/registry.mjs           command registry, help, shell completion
//   bin/lib/context.mjs            data paths, settings, stores, session references
//   bin/lib/ui.mjs                 human / --json output, tables, errors
//   bin/commands/*.mjs             commands by area (system, capture, sessions, replay, export, knowledge, learn, profiles)
import path from 'node:path';
import { VERSION, collectorSourceSha, defaultDataDir, EXIT } from '../src/config.mjs';
import { GLOBAL_FLAGS, resolveCommand, renderRootHelp, renderCommandHelp, renderGroupHelp } from './lib/registry.mjs';
import { parseArgv, leadingWords } from './lib/args.mjs';
import { buildContext } from './lib/context.mjs';
import { createOutput, reportError } from './lib/ui.mjs';

import './commands/system.mjs';
import './commands/capture.mjs';
import './commands/sessions.mjs';
import './commands/replay.mjs';
import './commands/mirror.mjs';
import './commands/export.mjs';
import './commands/knowledge.mjs';
import './commands/platform.mjs';
import './commands/selftest.mjs';
import './commands/learn.mjs';
import './commands/profiles.mjs';
import './commands/drive.mjs';
import './commands/chat.mjs';
import './commands/atoms.mjs';
import './commands/state.mjs';
import './commands/wrap.mjs';
import './commands/run.mjs';
import './commands/library.mjs';
import './commands/campaign.mjs';
import './commands/tools.mjs';
import './commands/personal-agent.mjs';
import './commands/bridge.mjs';
import './commands/relay.mjs';
import './commands/companion.mjs';
import './commands/recipes.mjs';
import './commands/ask.mjs';
import './commands/providers.mjs';
import './commands/setup.mjs';

// A closed pipe (studio … | head) is a normal way to finish, not an error.
process.stdout.on('error', (e) => { if (e.code === 'EPIPE') process.exit(0); });

// Supervisor IPC stop (scripts/always-on.mjs sends { type: 'stop' }).
// Windows cannot deliver a catchable SIGINT to a child: process.kill() terminates it outright,
// which is what used to leave session.json at "recording" with an unfinalized raw segment. So the
// supervisor asks over the IPC channel instead, and the request is re-emitted as the very same
// SIGINT event the Ctrl+C path uses (bin/commands/capture.mjs:185 -> runRecording finalize), so
// the save/derive/exit logic exists once. Nothing else in this file may stop a recording.
if (process.channel) {
  process.on('message', (m) => {
    if (m !== 'stop' && m?.type !== 'stop') return;
    const handled = process.emit('SIGINT');
    // No recording is listening (e.g. a command that never attaches a handler): nothing to save.
    if (!handled) process.exit(0);
    // Safety net only: the graceful path exits by itself once the session is finalized.
    setTimeout(() => process.exit(0), 25_000).unref();
  });
}

async function main(argv) {
  const hasFlag = (...names) => { const end = argv.indexOf('--'); return argv.slice(0, end < 0 ? undefined : end).some((a) => names.includes(a)); };
  const words = leadingWords(argv, GLOBAL_FLAGS, 2);
  const dataDir = (() => {
    const i = argv.findIndex((a) => a === '--data-dir' || a.startsWith('--data-dir='));
    if (i < 0) return defaultDataDir();
    return path.resolve(argv[i].includes('=') ? argv[i].split('=').slice(1).join('=') : (argv[i + 1] ?? '.'));
  })();

  if (!words.length) {
    if (hasFlag('--version', '-V')) { console.log(`${VERSION} ${collectorSourceSha()}`); return; }
    console.log(renderRootHelp({ version: VERSION, dataDir }));
    return;
  }
```

_First 80 of 106 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
