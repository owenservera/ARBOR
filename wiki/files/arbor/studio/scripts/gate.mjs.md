# File: studio/scripts/gate.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/gate.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3179 B |
| Lines | 70 |
| Hash | e314734b9761 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 11 | no | const root = fileURLToPath(new URL(&#39;../&#39;, import.meta.url)); |
| fast | const | 12 | no | const fast = process.argv.includes(&#39;--fast&#39;); |
| MINUTE | const | 13 | no | const MINUTE = 60_000; |
| suiteFiles | function | 17 | no | function suiteFiles(dir = &#39;test/unit&#39;, found = []) { |
| rel | const | 19 | no | const rel = `${dir}/${entry.name}`; |
| steps | const | 27 | no | const steps = [ |
| files | variable | 33 | no | let files = []; |
| seconds | function | 47 | no | const seconds = (ms) =&gt; `${(ms / 1000).toFixed(1)}s`; |
| started | const | 48 | no | const started = Date.now(); |
| at | const | 54 | no | const at = Date.now(); |
| result | const | 55 | no | const result = spawnSync(process.execPath, step.args, { cwd: root, stdio: &#39;inherit&#39;, timeout: step.timeout }); |
| why | const | 57 | no | const why = result.error.code === &#39;ETIMEDOUT&#39; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 6 | external |
| node:fs | import | 7 | external |
| node:path | import | 8 | external |
| node:url | import | 9 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// One command for the whole portability gate, identical on Windows and Ubuntu.
// The rows of docs/PORTABILITY.md run in order, and the first failure stops the gate so a broken
// tree never reaches the expensive suite. `--fast` skips the suite and says so out loud: a fast
// pass is a development loop, not a parity claim.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const fast = process.argv.includes('--fast');
const MINUTE = 60_000;

// `node --test` exits 0 when a glob matches nothing, so a moved or renamed suite would let the
// gate pass with zero tests run. The suite is resolved here instead and an empty match is fatal.
function suiteFiles(dir = 'test/unit', found = []) {
  for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) suiteFiles(rel, found);
    else if (entry.isFile() && entry.name.endsWith('.test.mjs')) found.push(rel);
  }
  return found.sort();
}

// Every step carries a timeout: a hung child must fail the gate by name instead of waiting forever.
const steps = [
  { name: 'architecture', args: ['scripts/architecture-inventory.mjs', '--check'], timeout: 5 * MINUTE },
  { name: 'parity', args: ['--test', 'test/unit/platform-parity.test.mjs', 'test/unit/platform-boundary.test.mjs'], timeout: 5 * MINUTE },
  { name: 'smoke', args: ['scripts/platform-smoke.mjs'], timeout: 10 * MINUTE },
];
if (!fast) {
  let files = [];
  try {
    files = suiteFiles();
  } catch (error) {
    console.error(`\ngate FAILED at suite: cannot read test/unit (${error.message})`);
    process.exit(1);
  }
  if (!files.length) {
    console.error('\ngate FAILED at suite: test/unit/**/*.test.mjs matched no files');
    process.exit(1);
  }
  steps.push({ name: 'suite', args: ['--test', ...files], timeout: 30 * MINUTE });
}

const seconds = (ms) => `${(ms / 1000).toFixed(1)}s`;
const started = Date.now();

console.log(`gate: ${steps.map((step) => step.name).join(' -> ')}  (${process.platform} ${process.version})`);
if (fast) console.log('gate: FAST — the full suite is skipped, so this is not a parity claim.');

for (const step of steps) {
  const at = Date.now();
  const result = spawnSync(process.execPath, step.args, { cwd: root, stdio: 'inherit', timeout: step.timeout });
  if (result.error) {
    const why = result.error.code === 'ETIMEDOUT'
      ? `timed out after ${seconds(step.timeout)}`
      : result.error.message;
    console.error(`\ngate FAILED at ${step.name}: ${why}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\ngate FAILED at ${step.name} (exit ${result.status}, ${seconds(Date.now() - at)})`);
    process.exit(result.status ?? 1);
  }
  console.log(`gate: ${step.name} ok (${seconds(Date.now() - at)})`);
}

console.log(`gate OK — ${steps.length} steps in ${seconds(Date.now() - started)}${fast ? ' (FAST: suite not run)' : ''}`);
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
