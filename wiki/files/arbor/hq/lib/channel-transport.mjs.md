# File: hq/lib/channel-transport.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/channel-transport.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18720 B |
| Lines | 414 |
| Hash | 47853c1b9172 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| nodeBin | function | 21 | yes | export function nodeBin() { |
| sessionsTool | function | 25 | yes | export function sessionsTool() { |
| acpServerEntry | function | 30 | yes | export function acpServerEntry() { |
| bundled | const | 32 | no | const bundled = join(process.env.APPDATA \|\| join(homedir(), &#39;AppData&#39;, &#39;Roaming&#39;), &#39;npm&#39;, &#39;node_modules&#39;, &#39;zcode-acp-server&#39;, &#39;dist&#39;, &#39;cli.js&#39;); |
| zcodeCli | function | 42 | yes | export function zcodeCli() { |
| bundled | const | 44 | no | const bundled = join(process.env.ProgramFiles \|\| &#39;C:\\\\Program Files&#39;, &#39;ZCode&#39;, &#39;resources&#39;, &#39;glm&#39;, &#39;zcode.cjs&#39;); |
| resumeSession | function | 61 | yes | export function resumeSession(sessionId, text, { timeoutMs = 180000, cwd, replyFile } = {}) { |
| cli | const | 62 | no | const cli = zcodeCli(); |
| args | const | 64 | no | const args = [cli, &#39;--resume&#39;, sessionId, &#39;-p&#39;, text]; |
| outFile | const | 67 | no | const outFile = replyFile \|\| join(process.env.TEMP \|\| tmpdir(), `hq-seat-${String(sessionId).slice(-8)}-${Date.now()}.out`); |
| errFile | const | 68 | no | const errFile = `${outFile}.err`; |
| outFd | const | 69 | no | const outFd = openSync(outFile, &#39;w&#39;); |
| errFd | const | 70 | no | const errFd = openSync(errFile, &#39;w&#39;); |
| r | variable | 71 | no | let r; |
| outAppend | const | 83 | no | const outAppend = openSync(outFile, &#39;a&#39;); |
| errAppend | const | 84 | no | const errAppend = openSync(errFile, &#39;a&#39;); |
| reply | const | 97 | no | const reply = readFileSync(outFile, &#39;utf8&#39;).trim(); |
| stderr | const | 98 | no | const stderr = readFileSync(errFile, &#39;utf8&#39;).trim(); |
| lateReply | function | 107 | yes | export function lateReply(replyFile) { |
| text | const | 110 | no | const text = readFileSync(replyFile, &#39;utf8&#39;).trim(); |
| sleepMs | function | 117 | no | function sleepMs(ms) { |
| lastJson | function | 123 | no | function lastJson(stdout) { |
| text | const | 124 | no | const text = String(stdout ?? &#39;&#39;).trim(); |
| lines | const | 127 | no | const lines = text.split(/\\r?\\n/).filter(Boolean); |
| readLiveness | function | 138 | yes | export function readLiveness(sessionId) { |
| LIVENESS_UNREADABLE | const | 147 | yes | export const LIVENESS_UNREADABLE = &#39;LIVENESS_UNREADABLE&#39;; |
| readLivenessMap | function | 150 | yes | export function readLivenessMap() { |
| r | const | 151 | no | const r = spawnSync(nodeBin(), [sessionsTool(), &#39;--json&#39;, &#39;list&#39;, &#39;--limit&#39;, &#39;5000&#39;], { encoding: &#39;utf8&#39;, timeout: 60000, // Measured 479 KB at 1268 sessions. The 1 MB default would silently // trunc… |
| stderr | const | 159 | no | const stderr = String(r.stderr ?? &#39;&#39;).slice(0, 300).replace(/\\s*\\r?\\n\\s*/g, &#39; \| &#39;).trim(); |
| unreadable | function | 160 | no | const unreadable = (reason) =&gt; { |
| error | const | 161 | no | const error = new Error(`liveness read failed: sessions tool ${reason}; exit=${r.status ?? &#39;none&#39;}${stderr ? `; stderr=${stderr}` : &#39;&#39;}`); |
| doc | const | 169 | no | const doc = lastJson(r.stdout); |
| map | const | 171 | no | const map = new Map(); |
| logEvent | function | 181 | no | function logEvent(logPath, event) { |
| acpWorker | function | 188 | no | function acpWorker({ sessionId, text, logPath, cwd }) { |
| entry | const | 189 | no | const entry = acpServerEntry(); |
| child | const | 195 | no | const child = entry |
| stderr | variable | 199 | no | let stderr = &#39;&#39;; |
| next | variable | 202 | no | let next = 1; |
| pending | const | 203 | no | const pending = new Map(); |
| request | function | 206 | no | const request = (method, params, timeoutMs = 45000) =&gt; new Promise((resolve, reject) =&gt; { const id = next++; const timer = setTimeout(() =&gt; { if (!pending.has(id)) return; pending.delete(id); |
| id | const | 207 | no | const id = next++; |
| timer | const | 208 | no | const timer = setTimeout(() =&gt; { if (!pending.has(id)) return; pending.delete(id); reject(new Error(`${method}: no answer in ${Math.round(timeoutMs / 1000)}s`)); }, timeoutMs); |
| buffer | variable | 221 | no | let buffer = &#39;&#39;; |
| nl | variable | 224 | no | let nl; |
| line | const | 226 | no | const line = buffer.slice(0, nl).trim(); |
| msg | variable | 229 | no | let msg; |
| p | const | 232 | no | const p = pending.get(msg.id); |
| done | variable | 244 | no | let done = false; |
| finish | function | 245 | no | const finish = (event, code = 0) =&gt; { |
| submit | function | 269 | no | const submit = () =&gt; request(&#39;session/prompt&#39;, { sessionId, prompt: [{ type: &#39;text&#39;, text }] }, 600000); |
| attempt | const | 271 | no | const attempt = await submit().then( (r) =&gt; ({ ok: true, stopReason: String(r?.stopReason ?? &#39;unknown&#39;) }), (e) =&gt; ({ ok: false, error: String(e.message) }), ); |
| r | const | 287 | no | const r = await submit(); |
| acpSend | function | 318 | yes | export function acpSend(sessionId, text, { waitMs = 45000, logPath, cwd } = {}) { |
| log | const | 319 | no | const log = logPath \|\| join(process.env.TEMP \|\| homedir(), `hq-acp-${Date.now()}.log`); |
| self | const | 320 | no | const self = fileURLToPath(import.meta.url); |
| payload | const | 321 | no | const payload = Buffer.from(text, &#39;utf8&#39;).toString(&#39;base64&#39;); |
| args | const | 322 | no | const args = [self, &#39;--worker&#39;, sessionId, payload, log, cwd \|\| &#39;&#39;]; |
| child | const | 324 | no | const child = spawn(process.execPath, args, { detached: true, stdio: &#39;ignore&#39;, windowsHide: true }); |
| spawnError | variable | 325 | no | let spawnError = null; |
| deadline | const | 329 | no | const deadline = Date.now() + waitMs; |
| last | variable | 330 | no | let last = { event: &#39;start&#39; }; |
| events | const | 333 | no | const events = readEvents(log); |
| failed | const | 335 | no | const failed = events.find((e) =&gt; String(e.event).startsWith(&#39;error&#39;) \|\| String(e.event).startsWith(&#39;exit_before&#39;)); |
| readEvents | function | 356 | no | function readEvents(logPath) { |
| sleep | function | 368 | no | function sleep(ms) { |
| confirmWake | function | 378 | yes | export function confirmWake(sessionId, wakeId, { messages = 6 } = {}) { |
| r | const | 382 | no | const r = spawnSync(nodeBin(), [sessionsTool(), &#39;show&#39;, sessionId, &#39;--messages&#39;, String(messages)], { encoding: &#39;utf8&#39;, timeout: 60000, }); |
| text | const | 387 | no | const text = String(r.stdout ?? &#39;&#39;); |
| needle | const | 389 | no | const needle = `MANAGER-WAKE ${wakeId}`; |
| at | const | 390 | no | const at = text.indexOf(needle); |
| before | const | 394 | no | const before = text.slice(0, at); |
| lastRole | const | 395 | no | const lastRole = before.lastIndexOf(&#39;[user]&#39;) &gt; before.lastIndexOf(&#39;[assistant]&#39;) ? &#39;user&#39; : &#39;assistant&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 14 | external |
| node:fs | import | 15 | external |
| node:os | import | 16 | external |
| node:path | import | 17 | external |
| node:url | import | 18 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/autonomy.mjs](../bin/autonomy.mjs.md) | ../lib/channel-transport.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/channel-transport.mjs |
| [hq/bin/spawn.mjs](../bin/spawn.mjs.md) | ../lib/channel-transport.mjs |
| [hq/lib/mcp-team-tools.mjs](./mcp-team-tools.mjs.md) | ./channel-transport.mjs |
| [hq/lib/mcp-team-tools.mjs](./mcp-team-tools.mjs.md) | ./channel-transport.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | The only place that touches a live ZCode session: read-only liveness from the session store, and a wake that runs the real ACP method (session/prompt) in a detached worker with evidence instead of an… |
| 4 | owner | channel-manager | — | channel-manager |
| 5 | task | — | — | channel-wake |
| 6 | invariant | — | — | the session store is read through the playbook tool, which opens it read-only |
| 7 | invariant | — | — | a wake that outlives its wait is reported PENDING, never ACCEPTED |
| 8 | invariant | — | — | proof comes from the transcript or the bridge&#39;s own turn events, never from &quot;request written&quot; |
| 9 | why | — | — | zcode-acp-server 0.65.1 does NOT implement session/send (-32601). The live method is |
| 12 | see | — | doc:docs/integration/STREAM-BOUNDARIES.md | doc:docs/integration/STREAM-BOUNDARIES.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context The only place that touches a live ZCode session: read-only liveness from the session store, and a wake that runs the real ACP method (session/prompt) in a detached worker with evidence instead of an acknowledgement
 * @hq:owner channel-manager
 * @hq:task channel-wake
 * @hq:invariant the session store is read through the playbook tool, which opens it read-only
 * @hq:invariant a wake that outlives its wait is reported PENDING, never ACCEPTED
 * @hq:invariant proof comes from the transcript or the bridge's own turn events, never from "request written"
 * @hq:why zcode-acp-server 0.65.1 does NOT implement session/send (-32601). The live method is
 *   session/prompt with ACP ContentBlock[]; it starts a real turn and returns when that turn ends,
 *   so the caller must not block on the response.
 * @hq:see doc:docs/integration/STREAM-BOUNDARIES.md
 */
import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The playbook tool that owns read-only session access. One wrapper, not a second one. */
export function nodeBin() {
  return process.env.HQ_NODE || 'node';
}

export function sessionsTool() {
  return process.env.HQ_SESSIONS_TOOL || join(homedir(), '.agents', 'skills', 'agent-bootstrap', 'sessions.mjs');
}

/** The ACP bridge entry point. `shell:true` was needed for the .cmd shim; the file path is not. */
export function acpServerEntry() {
  if (process.env.HQ_ACP_SERVER) return process.env.HQ_ACP_SERVER;
  const bundled = join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'npm', 'node_modules', 'zcode-acp-server', 'dist', 'cli.js');
  return existsSync(bundled) ? bundled : null;
}

/**
 * The ZCode CLI that the app itself runs. `--resume <sess_id> -p "<text>"`
 * runs one real turn inside a persisted session and prints the answer: that is
 * a wake, and it needs no bridge. Proven 2026-11-04 on sess_6da8eebe (gemini):
 * the seat answered WAKE-OK and moved to ACTIVE in the session store.
 */
export function zcodeCli() {
  if (process.env.HQ_ZCODE_CLI) return process.env.HQ_ZCODE_CLI;
  const bundled = join(process.env.ProgramFiles || 'C:\\Program Files', 'ZCode', 'resources', 'glm', 'zcode.cjs');
  return existsSync(bundled) ? bundled : null;
}

/**
 * Wake a session through the CLI. This is the delivery path: it resumes the
 * persisted session, runs the prompt as one turn, and returns that turn's answer.
 *
 * The turn's stdout goes to a file, not a pipe, because a turn can outlive the
 * wait. That was the defect: `spawnSync(...timeout)` killed the child, so the
 * seat answered and the journal still said `reply: null` forever. Now the child
 * keeps running, and the reply lands in `replyFile` whenever the turn ends.
 *
 * @param {string} sessionId
 * @param {string} text
 * @param {{timeoutMs?: number, cwd?: string, replyFile?: string}} [opts]
 */
export function resumeSession(sessionId, text, { timeoutMs = 180000, cwd, replyFile } = {}) {
  const cli = zcodeCli();
  if (!cli) return { accepted: false, pending: false, detail: 'the ZCode CLI was not found; set HQ_ZCODE_CLI' };
  const args = [cli, '--resume', sessionId, '-p', text];
  if (cwd) args.push('--cwd', cwd);

  const outFile = replyFile || join(process.env.TEMP || tmpdir(), `hq-seat-${String(sessionId).slice(-8)}-${Date.now()}.out`);
  const errFile = `${outFile}.err`;
  const outFd = openSync(outFile, 'w');
  const errFd = openSync(errFile, 'w');
  let r;
  try {
    r = spawnSync(nodeBin(), args, { stdio: ['ignore', outFd, errFd], timeout: timeoutMs, windowsHide: true });
  } finally {
    closeSync(outFd);
    closeSync(errFd);
  }

  // A synchronous wait that hits its timeout kills the turn. Start it again
  // detached, writing to the same file, so the answer is not thrown away: that
```

_First 80 of 415 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
