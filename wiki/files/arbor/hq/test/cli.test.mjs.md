# File: hq/test/cli.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/cli.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 996 B |
| Lines | 23 |
| Hash | 2e4bcba33ce1 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 13 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;); |
| CLI | const | 14 | no | const CLI = join(ROOT, &#39;hq&#39;, &#39;bin&#39;, &#39;hq.mjs&#39;); |
| pkg | const | 17 | no | const pkg = JSON.parse(readFileSync(join(ROOT, &#39;package.json&#39;), &#39;utf8&#39;)); |
| out | const | 18 | no | const out = execFileSync(process.execPath, [CLI, &#39;--version&#39;], { encoding: &#39;utf8&#39;, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;ignore&#39;], }).trim(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 6 | external |
| node:assert/strict | import | 7 | external |
| node:child_process | import | 8 | external |
| node:fs | import | 9 | external |
| node:path | import | 10 | external |
| node:url | import | 11 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/cli.test.mjs — the command surface reports the manifest it ships with.
//
// The runtime used to print a hardcoded "hq 1.0.0" regardless of the bundle it
// was installed from, so an installed consumer could not tell which version it
// was running.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = join(ROOT, 'hq', 'bin', 'hq.mjs');

test('hq --version reports the manifest version, not a literal', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const out = execFileSync(process.execPath, [CLI, '--version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
  assert.equal(out, `hq ${pkg.version}`);
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
