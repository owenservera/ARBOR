# File: studio/scripts/local-verify.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/local-verify.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5605 B |
| Lines | 112 |
| Hash | d66318212a2d |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 10 | no | const root = fileURLToPath(new URL(&#39;../&#39;, import.meta.url)); |
| METRICS | const | 11 | no | const METRICS = Object.freeze([&#39;tests&#39;, &#39;pass&#39;, &#39;fail&#39;, &#39;cancelled&#39;, &#39;skipped&#39;, &#39;todo&#39;]); |
| parseTapSummary | function | 13 | yes | export function parseTapSummary(output) { |
| summary | const | 14 | no | const summary = {}; |
| complete | const | 21 | no | const complete = METRICS.every(key =&gt; Number.isSafeInteger(summary[key])); |
| verifyCliArgs | function | 25 | yes | export function verifyCliArgs(argv) { |
| args | const | 26 | no | const args = { fast: false, receipt: null }; |
| git | function | 36 | no | function git(args) { |
| res | const | 37 | no | const res = spawnSync(&#39;git&#39;, args, { cwd: root, encoding: &#39;utf8&#39;, timeout: 10000 }); |
| runStep | function | 41 | no | async function runStep(name, command, args) { |
| start | const | 42 | no | const start = Date.now(); |
| tail | variable | 44 | no | let tail = &#39;&#39;; |
| result | const | 45 | no | const result = await new Promise(resolve =&gt; { const child = spawn(command, args, { cwd: root, shell: false, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;pipe&#39;] }); const collect = (stream, out) =&gt; stream.on(&#39;data&#39;, ch… |
| child | const | 46 | no | const child = spawn(command, args, { cwd: root, shell: false, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;pipe&#39;] }); |
| collect | function | 47 | no | const collect = (stream, out) =&gt; stream.on(&#39;data&#39;, chunk =&gt; { const text = String(chunk); out.write(text); if (stream === child.stdout) tail = (tail + text).slice(-32000); }); |
| text | const | 48 | no | const text = String(chunk); |
| main | function | 62 | no | async function main(argv) { |
| args | const | 63 | no | const args = verifyCliArgs(argv); |
| startedAt | const | 64 | no | const startedAt = new Date().toISOString(); |
| revision | const | 65 | no | const revision = git([&#39;rev-parse&#39;, &#39;HEAD&#39;]); |
| porcelain | const | 66 | no | const porcelain = git([&#39;status&#39;, &#39;--porcelain&#39;]); |
| receipt | const | 67 | no | const receipt = { |
| allSucceeded | const | 83 | no | const allSucceeded = receipt.steps.every(step =&gt; step.exitCode === 0 &amp;&amp; !step.error); |
| suite | const | 84 | no | const suite = receipt.steps.find(step =&gt; step.name === &#39;full-unit-suite&#39;); |
| fullSuiteConfirmed | const | 85 | no | const fullSuiteConfirmed = Boolean(suite &amp;&amp; suite.tap.complete &amp;&amp; suite.tap.fail === 0 &amp;&amp; suite.tap.cancelled === 0 &amp;&amp; suite.tap.tests === suite.tap.pass + suite.tap.skipped + suite.tap.todo); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 5 | external |
| node:fs | import | 6 | external |
| node:path | import | 7 | external |
| node:url | import | 8 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Local-only verification, not CI: prints every test result and optionally writes a small
// privacy-safe receipt with the actual tested revision and TAP counters.
// No browser, network, provider send or external automation is started by this script.
import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const METRICS = Object.freeze(['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']);

export function parseTapSummary(output) {
  const summary = {};
  // Node's final TAP report contains one "# metric N" line for each counter.
  // Find the last occurrence of every metric, not an individual test's text.
  for (const line of String(output).split(/\r?\n/)) {
    const match = /^\s*#\s+(tests|pass|fail|cancelled|skipped|todo)\s+(\d+)\s*$/.exec(line);
    if (match) summary[match[1]] = Number(match[2]);
  }
  const complete = METRICS.every(key => Number.isSafeInteger(summary[key]));
  return { ...summary, complete };
}

export function verifyCliArgs(argv) {
  const args = { fast: false, receipt: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--fast') args.fast = true;
    else if (argv[i] === '--receipt' && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      args.receipt = path.resolve(argv[++i]);
    } else throw new Error('Usage: node scripts/local-verify.mjs [--fast] [--receipt <new-local-json-path>]');
  }
  return args;
}

function git(args) {
  const res = spawnSync('git', args, { cwd: root, encoding: 'utf8', timeout: 10000 });
  return res.status === 0 ? res.stdout.trim() : null;
}

async function runStep(name, command, args) {
  const start = Date.now();
  console.log('\nLOCAL VERIFY — ' + name + ': ' + [command, ...args].join(' '));
  let tail = '';
  const result = await new Promise(resolve => {
    const child = spawn(command, args, { cwd: root, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    const collect = (stream, out) => stream.on('data', chunk => {
      const text = String(chunk);
      out.write(text);
      if (stream === child.stdout) tail = (tail + text).slice(-32000);
    });
    collect(child.stdout, process.stdout);
    collect(child.stderr, process.stderr);
    child.once('error', error => resolve({ code: null, signal: null, error: error.code || error.message }));
    child.once('close', (code, signal) => resolve({ code, signal, error: null }));
  });
  return { name, command: [command, ...args], exitCode: result.code, signal: result.signal,
    error: result.error, elapsedMs: Date.now() - start, ...(name === 'full-unit-suite'
      ? { tap: parseTapSummary(tail) } : {}) };
}

async function main(argv) {
  const args = verifyCliArgs(argv);
  const startedAt = new Date().toISOString();
  const revision = git(['rev-parse', 'HEAD']);
  const porcelain = git(['status', '--porcelain']);
  const receipt = {
    schema: 'vivim.local-verification/1',
    startedAt, sourceRevision: revision,
    workingTreeDirtyAtStart: porcelain === null ? null : Boolean(porcelain),
    host: { platform: process.platform, node: process.version },
    mode: args.fast ? 'fast: full-unit-suite-skipped' : 'complete-local-gate',
    steps: [], status: 'RUNNING', providerLiveVerification: 'not-attempted',
    claim: 'Local process exit and TAP output only, never a live provider receipt',
  };
  try {
    receipt.steps.push(await runStep('architecture-parity-smoke', process.execPath,
      ['scripts/gate.mjs', '--fast']));
    if (receipt.steps.at(-1).exitCode === 0 && !args.fast) {
      receipt.steps.push(await runStep('full-unit-suite', process.platform === 'win32' ? 'bun.exe' : 'bun',
```

_First 80 of 113 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
