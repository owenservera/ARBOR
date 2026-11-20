# File: hq/aii/fixtures/HQ-032-running-version.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-032-running-version.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4120 B |
| Lines | 64 |
| Hash | da22243edf63 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| VERSION_RE | const | 18 | no | const VERSION_RE = /^\\d+\\.\\d+\\.\\d+$/; |
| findings | const | 33 | no | const findings = []; |
| running | const | 36 | no | const running = resolveExecutableVersion(process.execPath); |
| ghost | const | 43 | no | const ghost = resolveExecutableVersion(&#39;C:\\\\no-such-directory\\\\ghost.exe&#39;); |
| status | const | 50 | no | const status = runHq([&#39;status&#39;, &#39;--json&#39;], { timeoutMs: 180_000 }); |
| statusJson | variable | 52 | no | let statusJson; |
| versionKeys | const | 56 | no | const versionKeys = Object.keys(statusJson).filter((k) =&gt; /version/i.test(k)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 15 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/machine-probe.mjs | import | 16 | [hq/lib/machine-probe.mjs](../../lib/machine-probe.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// AII scenario HQ-032 (group D, P1): "Which executable version is currently running?"
// Engine: hq/lib/machine-probe.mjs resolveExecutableVersion (read-only --version query + file metadata,
// shared with HQ-031; per hq/aii/assessments/recheck-scope.json wave-1 overrule: HQ-032 is a gap).
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - `bun --version` -> v24.22.1 (exit 0), captured by resolveExecutableVersion(process.execPath)
//     — a read-only version query of the running bun executable this session.
//   - hq/bin/hq.mjs status --json carries no executable-version field (verified this session, exit 0):
//     top-level keys are db, lastIndexed, projects, root, schema, totals — explicit zero.
//   - An unreadable path degrades to version null with a reason, never guessed.
//
// run() re-derives every finding live: version query of the running bun executable (read-only spawn,
// exit 0 expected) and hq status --json via the harness runHq probe. No credentials, no session content.

import { defineFixture, finding, runHq } from './harness.mjs';
import { resolveExecutableVersion } from '../../lib/machine-probe.mjs';

const VERSION_RE = /^\d+\.\d+\.\d+$/;

export default defineFixture({
  id: 'HQ-032',
  provenance:
    'Locked 2026-11-11 (this session): resolveExecutableVersion(process.execPath) against the running bun ' +
    'executable returned version v24.22.1 via a read-only `--version` spawn (exit 0); `bun hq/bin/hq.mjs status --json` ' +
    'printed no executable-version field (top-level keys: db, lastIndexed, projects, root, schema, totals). ' +
    'run() re-derives both findings live; nothing is written.',
  expected: [
    { what: /version resolves for the running bun executable via read-only --version query: \d+\.\d+\.\d+$/, where: 'hq/lib/machine-probe.mjs resolveExecutableVersion' },
    { what: 'an unreadable executable path degrades to version null with a reason, never guessed', where: 'hq/lib/machine-probe.mjs resolveExecutableVersion' },
    { what: 'hq status --json carries no executable-version field today (explicit zero)', where: 'hq/bin/hq.mjs status --json' },
  ],
  run: async () => {
    const findings = [];

    // 1. Running executable version: the bun binary that is executing this fixture (read-only query).
    const running = resolveExecutableVersion(process.execPath);
    if (!running.resolvable || !VERSION_RE.test(String(running.version))) {
      throw new Error(`expected resolvable semver for ${process.execPath}, got ${JSON.stringify(running)}`);
    }
    findings.push(finding(`version resolves for the running bun executable via read-only --version query: ${running.version}`, 'hq/lib/machine-probe.mjs resolveExecutableVersion'));

    // 2. Unknown/unreadable path degrades, never guessed.
    const ghost = resolveExecutableVersion('C:\\no-such-directory\\ghost.exe');
    if (ghost.version !== null || ghost.resolvable !== false || !ghost.reason) {
      throw new Error(`expected unresolvable record with reason, got ${JSON.stringify(ghost)}`);
    }
    findings.push(finding('an unreadable executable path degrades to version null with a reason, never guessed', 'hq/lib/machine-probe.mjs resolveExecutableVersion'));

    // 3. Explicit zero: hq status --json has no executable-version field today.
    const status = runHq(['status', '--json'], { timeoutMs: 180_000 });
    if (status.exit !== 0) throw new Error(`hq status --json exited ${status.exit}: ${status.stderr.slice(0, 500)}`);
    let statusJson;
    try { statusJson = JSON.parse(status.stdout); } catch (err) {
      throw new Error(`hq status --json did not print JSON: ${err.message}`);
    }
    const versionKeys = Object.keys(statusJson).filter((k) => /version/i.test(k));
    if (versionKeys.length > 0) {
      throw new Error(`unexpected version field(s) in hq status --json: ${versionKeys.join(', ')}`);
    }
    findings.push(finding('hq status --json carries no executable-version field today (explicit zero)', 'hq/bin/hq.mjs status --json'));

    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
