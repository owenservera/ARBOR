# File: scripts/acceleration/live-host-check.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/acceleration/live-host-check.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18943 B |
| Lines | 336 |
| Hash | a12fc4a4a323 |
| Test | no |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 14 | no | const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;../..&#39;); |
| EVIDENCE_PATH | const | 15 | no | const EVIDENCE_PATH = path.join(ROOT, &#39;scripts&#39;, &#39;batch-evidence&#39;, &#39;WIKI-BASELINE.mjs&#39;); |
| PUBLIC_DEMO_JOURNAL | const | 16 | no | const PUBLIC_DEMO_JOURNAL = path.join(ROOT, &#39;demo&#39;, &#39;host-legacy&#39;, &#39;journal.jsonl&#39;); |
| execFile | const | 17 | no | const execFile = promisify(execFileCallback); |
| excerpt | function | 18 | no | const excerpt = value =&gt; String(value ?? &#39;&#39;).slice(-2400); |
| digest | function | 19 | no | const digest = text =&gt; createHash(&#39;sha256&#39;).update(text).digest(&#39;hex&#39;); |
| processProbe | function | 21 | no | function processProbe(file, args) { |
| p | const | 22 | no | const p = spawnSync(file, args, { cwd: ROOT, encoding: &#39;utf8&#39;, timeout: 5000 }); |
| evidenceSubprocess | function | 27 | no | async function evidenceSubprocess(base, isolatedOwnerToken) { |
| args | const | 28 | no | const args = [EVIDENCE_PATH, &#39;--live&#39;]; |
| started | const | 29 | no | const started = Date.now(); |
| result | const | 30 | no | const result = { command: [process.execPath, ...args].join(&#39; &#39;), |
| stdout | variable | 32 | no | let stdout = &#39;&#39;; |
| output | const | 34 | no | const output = await execFile(process.execPath, args, { cwd: ROOT, timeout: result.timeoutMs, maxBuffer: 2 * 1024 * 1024, env: { ...process.env, ARBOR_WIKI_EVIDENCE_ISOLATED: &#39;1&#39;, ARBOR_WIKI_EVIDENCE… |
| jsonl | function | 59 | no | function jsonl(text) { |
| runHostLoopCheck | function | 63 | yes | export async function runHostLoopCheck({ command = &#39;node scripts/acceleration/live-host-check.mjs&#39; } = {}) { |
| startTime | const | 64 | no | const startTime = Date.now(); |
| git | const | 65 | no | const git = processProbe(&#39;git&#39;, [&#39;rev-parse&#39;, &#39;--verify&#39;, &#39;HEAD&#39;]); |
| bun | const | 66 | no | const bun = processProbe(&#39;bun&#39;, [&#39;--version&#39;]); |
| dataRoot | const | 67 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;arbor-accel-r002-w1-b-&#39;)); |
| tempParent | const | 68 | no | const tempParent = realpathSync(os.tmpdir()); |
| actualDataRoot | const | 69 | no | const actualDataRoot = realpathSync(dataRoot); |
| privateJournal | const | 70 | no | const privateJournal = path.join(actualDataRoot, &#39;product-state&#39;, &#39;journal.jsonl&#39;); |
| isolatedOwnerToken | const | 72 | no | const isolatedOwnerToken = randomBytes(32).toString(&#39;hex&#39;); |
| demoJournalBefore | const | 73 | no | const demoJournalBefore = existsSync(PUBLIC_DEMO_JOURNAL) |
| checks | const | 75 | no | const checks = []; |
| requests | const | 76 | no | const requests = []; |
| receipt | const | 77 | no | const receipt = { |
| server | variable | 101 | no | let server = null; |
| base | variable | 102 | no | let base = null; |
| check | function | 103 | no | const check = (name, fn, observation) =&gt; { |
| start | function | 112 | no | const start = async createHostServer =&gt; { |
| close | function | 121 | no | const close = async () =&gt; { |
| request | function | 126 | no | const request = async (method, route, payload, headers = {}) =&gt; { |
| at | const | 127 | no | const at = Date.now(); |
| res | const | 128 | no | const res = await fetch(base + route, { method, headers: { ...(payload === undefined ? {} : { &#39;content-type&#39;: &#39;application/json&#39; }), ...headers }, ...(payload === undefined ? {} : { body: JSON.string… |
| body | const | 133 | no | const body = await res.text(); |
| get | function | 138 | no | const get = route =&gt; request(&#39;GET&#39;, route); |
| post | function | 139 | no | const post = (payload, headers) =&gt; request(&#39;POST&#39;, &#39;/api/mutate&#39;, payload, headers); |
| readJson | function | 140 | no | const readJson = async route =&gt; { |
| r | const | 141 | no | const r = await get(route); |
| underBun | const | 152 | no | const underBun = Boolean(process.versions.bun); |
| nodeMajor | const | 153 | no | const nodeMajor = Number(process.versions.node.split(&#39;.&#39;)[0]); |
| response | const | 180 | no | const response = await get(route); |
| response | const | 187 | no | const response = await get(route); |
| initialState | const | 190 | no | const initialState = await readJson(&#39;/api/state&#39;); |
| before | const | 191 | no | const before = await readJson(&#39;/api/wiki&#39;); |
| surface | const | 192 | no | const surface = await readJson(&#39;/api/file-surface&#39;); |
| initialJournal | const | 198 | no | const initialJournal = await readJson(&#39;/api/journal&#39;); |
| chatPayload | const | 201 | no | const chatPayload = { kind: &#39;chat-send&#39;, schemaVersion: 1, |
| badOrigin | const | 203 | no | const badOrigin = await post(chatPayload, { origin: &#39;https://untrusted.invalid&#39; }); |
| badEnvelope | const | 205 | no | const badEnvelope = await post({ ...chatPayload, schemaVersion: 999 }); |
| badKind | const | 207 | no | const badKind = await post({ kind: &#39;invoke-provider&#39;, schemaVersion: 1, actor: &#39;owner-browser&#39; }); |
| chat | const | 209 | no | const chat = await post(chatPayload); |
| afterChat | const | 215 | no | const afterChat = await readJson(&#39;/api/state&#39;); |
| edit | const | 220 | no | const edit = { kind: &#39;wiki-edit&#39;, schemaVersion: 1, actor: &#39;owner-browser&#39;, |
| headers | const | 223 | no | const headers = { origin: base, &#39;x-vivim-control&#39;: &#39;1&#39;, |
| unauthorized | const | 225 | no | const unauthorized = await post(edit); |
| missingControl | const | 227 | no | const missingControl = await post(edit, { origin: base }); |
| forged | const | 229 | no | const forged = await post(edit, { ...headers, origin: &#39;https://untrusted.invalid&#39; }); |
| actorOnly | const | 231 | no | const actorOnly = await post(edit, { origin: base, &#39;x-vivim-control&#39;: &#39;1&#39; }); |
| saved | const | 233 | no | const saved = await post(edit, headers); |
| stale | const | 238 | no | const stale = await post(edit, headers); |
| missingRevision | const | 240 | no | const missingRevision = await post({ ...edit, expectedRevision: undefined }, headers); |
| invalidTarget | const | 242 | no | const invalidTarget = await post({ ...edit, expectedRevision: before.revision + 1, edit: { ...edit.edit, page: &#39;../owner-data&#39; } }, headers); |
| wiki | const | 245 | no | const wiki = await readJson(&#39;/api/wiki&#39;); |
| state | const | 246 | no | const state = await readJson(&#39;/api/state&#39;); |
| journal | const | 253 | no | const journal = await readJson(&#39;/api/journal&#39;); |
| raw | const | 254 | no | const raw = await get(&#39;/api/journal?format=jsonl&#39;); |
| unknown | const | 263 | no | const unknown = await get(&#39;/api/not-a-route&#39;); |
| invalidMethod | const | 265 | no | const invalidMethod = await request(&#39;POST&#39;, &#39;/api/state&#39;); |
| replay | const | 269 | no | const replay = await readJson(&#39;/api/wiki&#39;); |
| replayState | const | 270 | no | const replayState = await readJson(&#39;/api/state&#39;); |
| replayJournal | const | 271 | no | const replayJournal = await readJson(&#39;/api/journal&#39;); |
| evidence | const | 280 | no | const evidence = await evidenceSubprocess(base, isolatedOwnerToken); |
| evidenceJournal | const | 292 | no | const evidenceJournal = await readJson(&#39;/api/journal&#39;); |
| demoJournalAfter | const | 316 | no | const demoJournalAfter = existsSync(PUBLIC_DEMO_JOURNAL) |
| receipt | const | 333 | no | const receipt = await runHostLoopCheck(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:assert/strict | import | 5 | external |
| node:crypto | import | 6 | external |
| node:child_process | import | 7 | external |
| node:fs | import | 8 | external |
| node:os | import | 9 | external |
| node:path | import | 10 | external |
| node:url | import | 11 | external |
| node:util | import | 12 | external |
| ../../apps/vivim-host/server.mjs | dynamic | 169 | [apps/vivim-host/server.mjs](../../apps/vivim-host/server.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [scripts/acceleration/live-host-check.test.mjs](./live-host-check.test.mjs.md) | ./live-host-check.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Acceleration R002 W1/B — real loopback Host acceptance, never a signed-in provider/device test.
// One command: node scripts/acceleration/live-host-check.mjs
// An ephemeral Host dataRoot is mandatory; no operator data directory is ever accepted.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { execFile as execFileCallback, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EVIDENCE_PATH = path.join(ROOT, 'scripts', 'batch-evidence', 'WIKI-BASELINE.mjs');
const PUBLIC_DEMO_JOURNAL = path.join(ROOT, 'demo', 'host-legacy', 'journal.jsonl');
const execFile = promisify(execFileCallback);
const excerpt = value => String(value ?? '').slice(-2400);
const digest = text => createHash('sha256').update(text).digest('hex');

function processProbe(file, args) {
  const p = spawnSync(file, args, { cwd: ROOT, encoding: 'utf8', timeout: 5000 });
  return { command: [file, ...args].join(' '), exitCode: p.status, signal: p.signal ?? null,
    stdoutExcerpt: excerpt(p.stdout), stderrExcerpt: excerpt(p.stderr || p.error?.message), timedOut: p.error?.code === 'ETIMEDOUT' };
}

async function evidenceSubprocess(base, isolatedOwnerToken) {
  const args = [EVIDENCE_PATH, '--live'];
  const started = Date.now();
  const result = { command: [process.execPath, ...args].join(' '),
    timeoutMs: 25000, exitCode: null, timedOut: false, stdoutExcerpt: '', stderrExcerpt: '' };
  let stdout = '';
  try {
    const output = await execFile(process.execPath, args, {
      cwd: ROOT, timeout: result.timeoutMs, maxBuffer: 2 * 1024 * 1024,
      env: { ...process.env, ARBOR_WIKI_EVIDENCE_ISOLATED: '1',
        ARBOR_WIKI_EVIDENCE_BASE_URL: base,
        ARBOR_WIKI_EVIDENCE_OWNER_TOKEN: isolatedOwnerToken }
    });
    stdout = output.stdout;
    result.exitCode = 0;
    result.stdoutExcerpt = excerpt(output.stdout);
    result.stderrExcerpt = excerpt(output.stderr);
  } catch (error) {
    stdout = error.stdout || '';
    result.exitCode = Number.isInteger(error.code) ? error.code : null;
    result.signal = error.signal || null;
    result.timedOut = error.killed === true || error.code === 'ETIMEDOUT';
    result.error = String(error.message);
    result.stdoutExcerpt = excerpt(error.stdout);
    result.stderrExcerpt = excerpt(error.stderr);
  }
  result.durationMs = Date.now() - started;
  try { result.verdict = JSON.parse(stdout); }
  catch { result.parseError = 'Evidence stdout was not valid JSON'; }
  return result;
}

function jsonl(text) {
  return text.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
}

export async function runHostLoopCheck({ command = 'node scripts/acceleration/live-host-check.mjs' } = {}) {
  const startTime = Date.now();
  const git = processProbe('git', ['rev-parse', '--verify', 'HEAD']);
  const bun = processProbe('bun', ['--version']);
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'arbor-accel-r002-w1-b-'));
  const tempParent = realpathSync(os.tmpdir());
  const actualDataRoot = realpathSync(dataRoot);
  const privateJournal = path.join(actualDataRoot, 'product-state', 'journal.jsonl');
  // Ephemeral capability exists only in process memory for this isolated temp Host.
  const isolatedOwnerToken = randomBytes(32).toString('hex');
  const demoJournalBefore = existsSync(PUBLIC_DEMO_JOURNAL)
    ? digest(readFileSync(PUBLIC_DEMO_JOURNAL)) : null;
  const checks = [];
  const requests = [];
  const receipt = {
    schema: 'arbor.acceleration-host-check/1',
    lane: 'A01', parallelLane: 'W1-B', source: 'actual-isolated-host-http',
    sha: git.exitCode === 0 && /^[0-9a-f]{40}$/.test(git.stdoutExcerpt.trim())
```

_First 80 of 337 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
