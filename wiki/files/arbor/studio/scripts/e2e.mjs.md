# File: studio/scripts/e2e.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/e2e.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2285 B |
| Lines | 54 |
| Hash | 07ba7f805d72 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 14 | no | const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;..&#39;); |
| dir | const | 15 | no | const dir = path.join(root, &#39;test&#39;, &#39;e2e&#39;); |
| suiteFiles | function | 17 | no | function suiteFiles(d) { |
| out | const | 18 | no | const out = []; |
| full | const | 20 | no | const full = path.join(d, entry.name); |
| files | variable | 27 | no | let files; |
| chrome | const | 39 | no | const chrome = process.env.CHROME_PATH; |
| extra | const | 48 | no | const extra = process.argv.slice(2); |
| run | const | 49 | no | const run = spawnSync(process.execPath, [&#39;--test&#39;, ...extra, ...files], { cwd: root, stdio: &#39;inherit&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 9 | external |
| node:path | import | 10 | external |
| node:child_process | import | 11 | external |
| node:url | import | 12 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// End-to-end runner that refuses to report success when nothing actually ran.
//
// Every file under test/e2e self-skips per test when CHROME_PATH is unset or does not exist
// (`hasChrome` in test/e2e/helpers.mjs). Running `node --test "test/e2e/**/*.test.mjs"` directly
// therefore exits 0 having executed nothing — a green result that proves nothing. This wrapper makes
// the prerequisite explicit: with no usable browser it exits 2 (NOT RUN, never PASS), and with a
// browser it forwards the real exit code.
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'test', 'e2e');

function suiteFiles(d) {
  const out = [];
  for (const entry of readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, entry.name);
    if (entry.isDirectory()) out.push(...suiteFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.test.mjs')) out.push(path.relative(root, full).split(path.sep).join('/'));
  }
  return out.sort();
}

let files;
try {
  files = suiteFiles(dir);
} catch (e) {
  console.error(`e2e: cannot read test/e2e (${e.code ?? e.message})`);
  process.exit(1);
}
if (files.length === 0) {
  console.error('e2e: test/e2e matched no *.test.mjs files');
  process.exit(1);
}

const chrome = process.env.CHROME_PATH;
if (!chrome || !existsSync(chrome)) {
  console.error(`e2e: NOT RUN — ${files.length} end-to-end file(s) require a real browser.`);
  console.error(`e2e: ${chrome ? 'CHROME_PATH does not exist: ' + chrome : 'CHROME_PATH is unset'}.`);
  console.error('e2e: every test would self-skip, so exiting 0 here would be a false pass.');
  console.error('e2e: set CHROME_PATH to a Chrome or Chromium binary to run them.');
  process.exit(2);
}

const extra = process.argv.slice(2);
const run = spawnSync(process.execPath, ['--test', ...extra, ...files], { cwd: root, stdio: 'inherit' });
if (run.error) {
  console.error(`e2e: failed to start the test runner (${run.error.message})`);
  process.exit(1);
}
process.exit(run.status ?? 1);
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
