# File: studio/scripts/core-local-handoff.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/core-local-handoff.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12261 B |
| Lines | 216 |
| Hash | bfff8632da58 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 12 | no | const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;..&#39;); |
| round | const | 13 | no | const round = String(process.argv[2] \|\| &#39;l0&#39;).toLowerCase(); |
| flag | const | 14 | no | const flag = process.argv.indexOf(&#39;--out&#39;); |
| runId | const | 19 | no | const runId = &#39;core-&#39; + new Date().toISOString().replace(/\\W/g, &#39;&#39;).slice(0, 15) + &#39;-&#39; + randomUUID().slice(0, 8); |
| out | const | 20 | no | const out = path.resolve(flag &gt;= 0 ? process.argv[flag + 1] : path.join(defaultDataDir(), &#39;integration-runs&#39;, runId, &#39;round-&#39; + round.toUpperCase())); |
| repositoryRoot | function | 22 | no | function repositoryRoot(start) { |
| repoRoot | const | 28 | no | const repoRoot = repositoryRoot(root); |
| rel | const | 29 | no | const rel = path.relative(repoRoot, out); |
| priv | const | 34 | no | const priv = path.join(out, &#39;private&#39;), shareable = path.join(out, &#39;shareable&#39;); |
| env | const | 37 | no | const env = { ...process.env, CAPTURE_STUDIO_HOME: path.join(priv, &#39;diagnostic-home&#39;), |
| begun | const | 39 | no | const begun = new Date().toISOString(), steps = [], failures = []; |
| metrics | const | 40 | no | const metrics = { passed: 0, failed: 0, skipped: 0, partial: 0, uiHttpStatus: null, apiHttpStatus: null, |
| sha | variable | 43 | no | let sha = null, dirtyCount = null, collectorSha = null; |
| now | function | 44 | no | const now = () =&gt; new Date().toISOString(); |
| maybeJson | function | 45 | no | const maybeJson = (s) =&gt; { try { return JSON.parse(s.trim()); } catch { return null; } }; |
| step | function | 47 | no | function step(id, action, status, started, durationMs, facts = {}) { |
| field | const | 48 | no | const field = { PASS: &#39;passed&#39;, FAIL: &#39;failed&#39;, SKIP: &#39;skipped&#39;, PARTIAL: &#39;partial&#39; }[status]; |
| evidence | const | 50 | no | const evidence = runId + &#39;/&#39; + round.toUpperCase() + &#39;/&#39; + id; |
| run | function | 60 | no | function run(program, args, id, timeoutMs = 60000) { |
| start | const | 61 | no | const start = Date.now(); |
| stdout | variable | 63 | no | let stdout = &#39;&#39;, stderr = &#39;&#39;, complete = false, child, timer; |
| stdoutFd | const | 66 | no | const stdoutFd = fs.openSync(path.join(priv, id + &#39;.stdout.txt&#39;), &#39;w&#39;); |
| stderrFd | const | 67 | no | const stderrFd = fs.openSync(path.join(priv, id + &#39;.stderr.txt&#39;), &#39;w&#39;); |
| capture | function | 68 | no | const capture = (fd, chunk, channel) =&gt; { |
| value | const | 70 | no | const value = chunk.toString(&#39;utf8&#39;); |
| finish | function | 74 | no | const finish = (exitCode, reason = null) =&gt; { |
| check | function | 92 | no | async function check(id, action, program, args, statusOf = (r) =&gt; r.code === 0 ? &#39;PASS&#39; : &#39;FAIL&#39;, timeout) { |
| started | const | 93 | no | const started = now(), r = await run(program, args, id, timeout); |
| gitInfo | function | 98 | no | async function gitInfo() { |
| r | const | 99 | no | const r = await check(&#39;git-head&#39;, &#39;git rev-parse HEAD&#39;, &#39;git&#39;, [&#39;rev-parse&#39;, &#39;HEAD&#39;]); |
| status | const | 101 | no | const status = await check(&#39;git-dirty&#39;, &#39;git status --porcelain&#39;, &#39;git&#39;, [&#39;status&#39;, &#39;--porcelain&#39;]); |
| probeLoopback | function | 104 | no | async function probeLoopback() { |
| started | const | 105 | no | const started = now(), start = Date.now(); |
| child | variable | 106 | no | let child, stdout = &#39;&#39;, stderr = &#39;&#39;, stopped = false, ui = null, api = null; |
| info | variable | 114 | no | let info = null; |
| deadline | const | 115 | no | const deadline = Date.now() + 20000; |
| base | const | 122 | no | const base = &#39;http://127.0.0.1:&#39; + info.port; |
| get | function | 123 | no | const get = async (url) =&gt; { const r = await fetch(base + url, { signal: AbortSignal.timeout(7000) }); await r.arrayBuffer(); return r.status; }; |
| l0 | function | 140 | no | async function l0() { |
| version | const | 143 | no | const version = await check(&#39;cli-version&#39;, &#39;node bin/studio.mjs version --json&#39;, process.execPath, [&#39;bin/studio.mjs&#39;, &#39;version&#39;, &#39;--json&#39;]); |
| doctor | const | 148 | no | const doctor = await check(&#39;doctor&#39;, &#39;studio doctor --json [isolated]&#39;, process.execPath, [&#39;bin/studio.mjs&#39;, &#39;doctor&#39;, &#39;--json&#39;], (r) =&gt; { const result = maybeJson(r.stdout); if (!Array.isArray(resul… |
| result | const | 150 | no | const result = maybeJson(r.stdout); |
| fails | const | 152 | no | const fails = result.checks.filter((c) =&gt; c.level === &#39;fail&#39; &amp;&amp; c.name !== &#39;chrome&#39;); |
| chrome | const | 153 | no | const chrome = result.checks.find((c) =&gt; c.name === &#39;chrome&#39;); |
| l1 | function | 161 | no | async function l1() { |
| started | const | 163 | no | const started = now(); |
| r | const | 164 | no | const r = await run(process.execPath, [&#39;scripts/live-e2e.mjs&#39;, &#39;--keep&#39;], &#39;synthetic-e2e&#39;, 900000); |
| fixture | variable | 166 | no | let fixture = null; |
| result | const | 177 | no | const result = [&#39;PASS&#39;, &#39;FAIL&#39;, &#39;SKIP&#39;].includes(s.status) ? s.status : &#39;PARTIAL&#39;; |
| overall | const | 190 | no | const overall = metrics.failed ? &#39;FAIL&#39; : (metrics.partial \|\| metrics.skipped) ? &#39;PARTIAL&#39; : &#39;PASS&#39;; |
| runInfo | const | 191 | no | const runInfo = { |
| jsonl | function | 199 | no | const jsonl = (items) =&gt; items.map((x) =&gt; JSON.stringify(x)).join(&#39;\\n&#39;) + (items.length ? &#39;\\n&#39; : &#39;&#39;); |
| summary | const | 200 | no | const summary = &#39;# CORE &#39; + round.toUpperCase() + &#39; integration run\\n\\n**Status:** &#39; + overall + |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 5 | external |
| node:crypto | import | 6 | external |
| node:fs | import | 7 | external |
| node:path | import | 8 | external |
| node:url | import | 9 | external |
| ../src/config.mjs | import | 10 | [studio/src/config.mjs](../src/config.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// CORE L0/L1 Windows integration probe. Local evidence only, zero dependencies.
// L0: isolated CLI, doctor and loopback UI/API. L1: existing synthetic live-e2e.
// No real provider sends, no owner's Chrome profile, no automatic GitHub upload.
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultDataDir } from '../src/config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const round = String(process.argv[2] || 'l0').toLowerCase();
const flag = process.argv.indexOf('--out');
if (!['l0', 'l1'].includes(round) || (flag >= 0 && !process.argv[flag + 1])) {
  console.error('Usage: node scripts/core-local-handoff.mjs l0|l1 [--out DIR]');
  process.exit(2);
}
const runId = 'core-' + new Date().toISOString().replace(/\W/g, '').slice(0, 15) + '-' + randomUUID().slice(0, 8);
const out = path.resolve(flag >= 0 ? process.argv[flag + 1]
  : path.join(defaultDataDir(), 'integration-runs', runId, 'round-' + round.toUpperCase()));
function repositoryRoot(start) {
  for (let dir = start; ; dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    if (path.dirname(dir) === dir) return start;
  }
}
const repoRoot = repositoryRoot(root);
const rel = path.relative(repoRoot, out);
if (rel === '' || !(rel === '..' || rel.startsWith('..' + path.sep))) {
  console.error('Use an evidence directory outside the Git repository (not just outside Capture Studio).');
  process.exit(2);
}
const priv = path.join(out, 'private'), shareable = path.join(out, 'shareable');
fs.mkdirSync(priv, { recursive: true });
fs.mkdirSync(shareable, { recursive: true });
const env = { ...process.env, CAPTURE_STUDIO_HOME: path.join(priv, 'diagnostic-home'),
  CAPTURE_STUDIO_ACCESS_MODE: 'local', CAPTURE_STUDIO_CAPTURE_MODE: 'local-raw', NO_COLOR: '1' };
const begun = new Date().toISOString(), steps = [], failures = [];
const metrics = { passed: 0, failed: 0, skipped: 0, partial: 0, uiHttpStatus: null, apiHttpStatus: null,
  synthetic: null, externalSendAttempts: 0, provenExternalSends: 0,
  cpuMs: null, peakRssBytes: null };
let sha = null, dirtyCount = null, collectorSha = null;
const now = () => new Date().toISOString();
const maybeJson = (s) => { try { return JSON.parse(s.trim()); } catch { return null; } };

function step(id, action, status, started, durationMs, facts = {}) {
  const field = { PASS: 'passed', FAIL: 'failed', SKIP: 'skipped', PARTIAL: 'partial' }[status];
  metrics[field]++;
  const evidence = runId + '/' + round.toUpperCase() + '/' + id;
  steps.push({ step_id: id, action, started_at: started, ended_at: now(), result: status,
    evidence_ref: evidence, effect_class: round === 'l0' ? 'local-read-only' : 'synthetic-only',
    known: status === 'PASS' || status === 'FAIL', duration_ms: durationMs, ...facts });
  if (status === 'FAIL') failures.push({ signature: round.toUpperCase() + ':' + id,
    component: id, expected: 'PASS', observed: status, minimal_repro: action,
    suspected_owner: 'CORE (untriaged)', confidence: 'unknown', source_sha: sha,
    evidence_refs: [evidence] });
}

function run(program, args, id, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve) => {
    let stdout = '', stderr = '', complete = false, child, timer;
    // Full byte streams land locally; only the parser's in-memory tail is
    // bounded. Never silently truncate diagnostic evidence on disk.
    const stdoutFd = fs.openSync(path.join(priv, id + '.stdout.txt'), 'w');
    const stderrFd = fs.openSync(path.join(priv, id + '.stderr.txt'), 'w');
    const capture = (fd, chunk, channel) => {
      fs.writeSync(fd, chunk);
      const value = chunk.toString('utf8');
      if (channel === 'stdout') stdout = (stdout + value).slice(-1048576);
      else stderr = (stderr + value).slice(-1048576);
    };
    const finish = (exitCode, reason = null) => {
      if (complete) return;
      complete = true;
      clearTimeout(timer);
      fs.closeSync(stdoutFd);
      fs.closeSync(stderrFd);
      resolve({ code: exitCode, stdout, stderr, reason, durationMs: Date.now() - start });
```

_First 80 of 217 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
