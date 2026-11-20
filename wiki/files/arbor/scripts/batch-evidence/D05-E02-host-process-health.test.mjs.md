# File: scripts/batch-evidence/D05-E02-host-process-health.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/batch-evidence/D05-E02-host-process-health.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7732 B |
| Lines | 144 |
| Hash | 64e83ada4e99 |
| Test | yes |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HERE | const | 32 | no | const HERE = dirname(fileURLToPath(import.meta.url)); |
| REPO_ROOT | const | 33 | no | const REPO_ROOT = join(HERE, &#39;..&#39;, &#39;..&#39;); |
| MAIN_RS | const | 34 | no | const MAIN_RS = join(REPO_ROOT, &#39;src-tauri&#39;, &#39;src&#39;, &#39;main.rs&#39;); |
| SOURCE | const | 35 | no | const SOURCE = readFileSync(MAIN_RS, &#39;utf8&#39;); |
| functionBody | function | 37 | no | function functionBody(name) { |
| start | const | 38 | no | const start = SOURCE.indexOf(`fn ${name}`); |
| open | const | 40 | no | const open = SOURCE.indexOf(&#39;{&#39;, start); |
| depth | variable | 41 | no | let depth = 0; |
| body | const | 53 | no | const body = functionBody(&#39;host_is_running&#39;); |
| body | const | 60 | no | const body = functionBody(&#39;probe_child&#39;); |
| restart | const | 70 | no | const restart = functionBody(&#39;host_restart&#39;); |
| blocking | const | 74 | no | const blocking = functionBody(&#39;restart_blocking&#39;); |
| stop | const | 78 | no | const stop = functionBody(&#39;stop_owned&#39;); |
| registration | const | 86 | no | const registration = SOURCE.match(/generate_handler!\\[([\\s\\S]*?)\\]/); |
| handlers | const | 88 | no | const handlers = registration[1].split(&#39;,&#39;).map((name) =&gt; name.trim()).filter(Boolean); |
| modes | const | 96 | no | const modes = SOURCE.match(/enum RuntimeMode\\s*\\{([\\s\\S]*?)\\}/); |
| classify | const | 101 | no | const classify = functionBody(&#39;classify_runtime&#39;); |
| packaged | const | 103 | no | const packaged = functionBody(&#39;packaged_runtime&#39;); |
| declaration | const | 109 | no | const declaration = SOURCE.match(/const APPROVED_BINARIES[^=]*=\\s*\\[([\\s\\S]*?)\\];/); |
| declared | const | 111 | no | const declared = [...declaration[1].matchAll(/&quot;([^&quot;]+)&quot;/g)].map((match) =&gt; match[1]); |
| identity | const | 119 | no | const identity = functionBody(&#39;is_host_status&#39;); |
| declaredTests | const | 125 | no | const declaredTests = (SOURCE.match(/#\\[test\\]/g) \|\| []).length; |
| result | const | 128 | no | const result = spawnSync(&#39;cargo&#39;, [&#39;test&#39;, &#39;-p&#39;, &#39;vivim-host&#39;, &#39;--bin&#39;, &#39;vivim-host&#39;, &#39;--locked&#39;], { cwd: REPO_ROOT, encoding: &#39;utf8&#39;, timeout: 600000, windowsHide: true, |
| output | const | 134 | no | const output = `${result.stdout \|\| &#39;&#39;}\\n${result.stderr \|\| &#39;&#39;}`; |
| summary | const | 138 | no | const summary = output.match(/test result: ok\\. (\\d+) passed; (\\d+) failed/); |
| passed | const | 140 | no | const passed = Number(summary[1]); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:child_process | import | 4 | external |
| node:path | import | 5 | external |
| node:url | import | 6 | external |
| ../../tools/packaging/prepare-host-runtime.mjs | import | 9 | [tools/packaging/prepare-host-runtime.mjs](../../tools/packaging/prepare-host-runtime.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// The frozen packaging contract is the authority for which native binaries an
// installed runtime may ship. The native shell must report exactly this set.
import { PACKAGED_BINARIES } from '../../tools/packaging/prepare-host-runtime.mjs';

// ============================================================================
// scripts/batch-evidence/D05-E02-host-process-health.test.mjs
// Unit NEXT:D05-E02-host-process-health (ledger rows AT-2F5E0A90D419 and
// AT-0A6ABCF6F615, both owned by src-tauri/src/main.rs).
//
// Acceptance under test:
//   * host_is_running reports REAL child liveness (try_wait), never retained
//     handle presence — an exited Host must read as not running.
//   * a dead Host can be cleanly restarted through host_restart, which only
//     stops the child this shell owns.
//   * runtime origin distinguishes the packaged MSI bundle from the workspace
//     fallback and from a missing runtime.
//   * the shell discovers exactly the approved native binaries frozen by
//     tools/packaging/prepare-host-runtime.mjs.
//
// The behavioral assertions live in the Rust unit tests inside main.rs
// (#[cfg(test)]); this suite runs them with cargo and cross-checks the source
// contract. Nothing here fakes a pass: cargo must compile and every declared
// #[test] must pass.
// ============================================================================

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');
const MAIN_RS = join(REPO_ROOT, 'src-tauri', 'src', 'main.rs');
const SOURCE = readFileSync(MAIN_RS, 'utf8');

function functionBody(name) {
  const start = SOURCE.indexOf(`fn ${name}`);
  assert.notEqual(start, -1, `main.rs must declare fn ${name}`);
  const open = SOURCE.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < SOURCE.length; i += 1) {
    if (SOURCE[i] === '{') depth += 1;
    else if (SOURCE[i] === '}') {
      depth -= 1;
      if (depth === 0) return SOURCE.slice(open + 1, i);
    }
  }
  assert.fail(`unbalanced body for fn ${name}`);
}

test('host_is_running probes the real child state, not handle presence', () => {
  const body = functionBody('host_is_running');
  assert.match(body, /probe_child\s*\(/, 'host_is_running must call probe_child');
  assert.match(body, /ChildState::Running/, 'host_is_running must compare against ChildState::Running');
  assert.doesNotMatch(body, /\.is_some\s*\(/, 'host_is_running must not report retained handle presence');
});

test('host_is_running is backed by an OS child probe', () => {
  const body = functionBody('probe_child');
  assert.match(body, /try_wait\s*\(/, 'probe_child must ask the OS about the child');
  assert.match(body, /Ok\(None\)\s*=>\s*ChildState::Running/, 'Ok(None) from try_wait means running');
  assert.match(body, /Ok\(Some\(/, 'Ok(Some(status)) from try_wait means exited');
  assert.match(body, /exit_code/, 'probe_child must record the real exit code');
});

test('exited Host can be cleanly restarted through an owned-child stop', () => {
  assert.match(SOURCE, /async fn host_restart\s*\(/,
    'host_restart must be async so a blocking restart never runs on the main thread');
  const restart = functionBody('host_restart');
  assert.match(restart, /spawn_blocking/, 'host_restart must run the blocking restart off the IPC thread');
  assert.match(restart, /restart_blocking/, 'host_restart must delegate to the blocking restart body');

  const blocking = functionBody('restart_blocking');
  assert.match(blocking, /stop_owned\s*\(/, 'restart_blocking must stop the owned child first');
  assert.match(blocking, /HostProcess::start/, 'restart_blocking must start a fresh Host');

  const stop = functionBody('stop_owned');
  assert.match(stop, /guard\.take\(\)/, 'stop_owned must take the owned child');
  assert.match(stop, /child\.kill\(\)/, 'stop_owned must terminate a live child');
```

_First 80 of 144 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
