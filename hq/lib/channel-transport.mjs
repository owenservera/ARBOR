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

  // spawnSync kills the CLI at its deadline, but the remote/model side may
  // already have accepted the turn. Its outcome is therefore UNKNOWN, not
  // refused. NEVER restart the same prompt: that can duplicate paid/model
  // effects and create two answers for a single wake journal ID.
  // A later transcript/owner reconciliation is the only safe recovery.
  if (r.error && /** @type {any} */ (r.error).code === 'ETIMEDOUT') {
    return {
      accepted: false, pending: true, uncertain: true, replyFile: outFile,
      transport: 'cli:--resume -p',
      detail: `the session turn exceeded ${Math.round(timeoutMs / 1000)}s; outcome uncertain, no replay performed — inspect the original session transcript`,
    };
  }

  const reply = readFileSync(outFile, 'utf8').trim();
  const stderr = readFileSync(errFile, 'utf8').trim();
  if (r.status !== 0) {
    return { accepted: false, pending: false, replyFile: outFile, detail: (stderr || reply || `exit ${r.status}`).split(/\r?\n/).pop() };
  }
  if (!reply) return { accepted: false, pending: false, replyFile: outFile, detail: 'the session answered with nothing' };
  return { accepted: true, pending: false, transport: 'cli:--resume -p', reply, replyFile: outFile, detail: 'the session ran one turn and answered' };
}

/** The reply of a wake that outran its wait, if the turn has since finished. */
export function lateReply(replyFile) {
  if (!replyFile || !existsSync(replyFile)) return null;
  try {
    const text = readFileSync(replyFile, 'utf8').trim();
    return text || null;
  } catch {
    return null;
  }
}

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// sessions.mjs pretty-prints with --json, so the whole payload is parsed first;
// the line scan is only a fallback for a banner printed ahead of the JSON.
function lastJson(stdout) {
  const text = String(stdout ?? '').trim();
  if (!text) return null;
  try { return JSON.parse(text); } catch { /* not one document */ }
  const lines = text.split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try { return JSON.parse(lines[i]); } catch { /* keep walking back */ }
  }
  return null;
}

/**
 * Read-only liveness for one session. sqlite path: no ACP, no spawn of the
 * bridge. Returns `{ ageMinutes, title }` or null when the session is not there.
 */
export function readLiveness(sessionId) {
  return readLivenessMap().get(sessionId) ?? null;
}

/**
 * Stable code for "the liveness reader failed". A caller must be able to name
 * this defect without matching prose, because a broken reader and an empty
 * session store otherwise look identical.
 */
export const LIVENESS_UNREADABLE = 'LIVENESS_UNREADABLE';

/** Every session's liveness in one read, so listing seats costs one spawn. */
export function readLivenessMap() {
  const r = spawnSync(nodeBin(), [sessionsTool(), '--json', 'list', '--limit', '5000'], {
    encoding: 'utf8',
    timeout: 60000,
    // Measured 479 KB at 1268 sessions. The 1 MB default would silently
    // truncate near 2.7k sessions; 64 MB keeps ~130x headroom.
    maxBuffer: 64 * 1024 * 1024,
  });
  // First 300 characters of stderr, flattened so the caller's line stays one line.
  const stderr = String(r.stderr ?? '').slice(0, 300).replace(/\s*\r?\n\s*/g, ' | ').trim();
  const unreadable = (reason) => {
    const error = new Error(`liveness read failed: sessions tool ${reason}; exit=${r.status ?? 'none'}${stderr ? `; stderr=${stderr}` : ''}`);
    /** @type {any} */ (error).code = LIVENESS_UNREADABLE;
    return error;
  };
  if (r.error) {
    throw unreadable(`could not start (${/** @type {any} */ (r.error).code ?? r.error.message})`);
  }
  if (r.status !== 0) throw unreadable('exited non-zero');
  const doc = lastJson(r.stdout);
  if (!doc || !Array.isArray(doc.sessions)) throw unreadable('printed a payload that is not the expected JSON');
  const map = new Map();
  for (const s of doc.sessions) map.set(s.id, { ageMinutes: s.ageMinutes, title: s.title, updated: s.updated, directory: s.directory });
  return map;
}

// ------------------------------------------------------------------ worker ----
// Runs as its own process: initialize, then session/prompt. It writes one JSON
// line per event to its log, because the caller needs evidence while the turn
// is still running and the turn can outlive the caller.

function logEvent(logPath, event) {
  try {
    mkdirSync(dirname(logPath), { recursive: true });
    appendFileSync(logPath, `${JSON.stringify({ at: new Date().toISOString(), ...event })}\n`);
  } catch { /* a missing log must not kill the turn */ }
}

function acpWorker({ sessionId, text, logPath, cwd }) {
  const entry = acpServerEntry();
  logEvent(logPath, { event: 'start', sessionId, entry: entry ? 'file' : 'path' });

  // windowsHide on both branches: the bridge spawns a backend CLI, and without
  // this each wake opens console windows on the owner's desktop. Observed
  // 2026-11-04: several zcode CLI windows per wake.
  const child = entry
    ? spawn(process.execPath, [entry], { stdio: ['pipe', 'pipe', 'pipe'], env: process.env, windowsHide: true })
    : spawn('zcode-acp-server', [], { stdio: ['pipe', 'pipe', 'pipe'], env: process.env, shell: true, windowsHide: true });

  let stderr = '';
  child.stderr.on('data', (d) => { stderr += d.toString(); });

  let next = 1;
  const pending = new Map();
  // Every request gets a deadline. A bridge that stops answering must surface
  // as an error the caller can act on, never as a worker that never ends.
  const request = (method, params, timeoutMs = 45000) => new Promise((resolve, reject) => {
    const id = next++;
    const timer = setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      reject(new Error(`${method}: no answer in ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);
    pending.set(id, {
      resolve: (v) => { clearTimeout(timer); resolve(v); },
      reject: (e) => { clearTimeout(timer); reject(e); },
      method,
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  });

  let buffer = '';
  child.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    let nl;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      let msg;
      try { msg = JSON.parse(line); } catch { continue; }
      if (msg.id !== undefined && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) p.reject(new Error(`${p.method}: ${JSON.stringify(msg.error)}`));
        else p.resolve(msg.result);
        continue;
      }
      if (msg.method === 'session/update') {
        logEvent(logPath, { event: 'turn_update', sessionId, update: msg.params?.update?.sessionUpdate ?? null });
      }
    }
  });

  let done = false;
  const finish = (event, code = 0) => {
    logEvent(logPath, { event, sessionId, stderr: stderr ? stderr.slice(-400) : undefined });
    try { child.kill(); } catch { /* already gone */ }
    process.exit(code);
  };

  child.on('error', (e) => finish(`error:${e.message}`, 1));
  child.on('exit', (code) => {
    if (!done) finish(`exit_before_answer:${code}`, 1);
  });

  (async () => {
    try {
      await request('initialize', {
        protocolVersion: 1,
        clientCapabilities: { fs: { readTextFile: true, writeTextFile: true } },
        clientInfo: { name: 'hq-channel-seat', version: '1.0.0' },
      });
      logEvent(logPath, { event: 'initialized', sessionId });
      // Prompt first. A session that is live in the app is already known to the
      // backend the bridge talks to; attaching is only needed for a session the
      // backend has never seen. resume/load also time out on a live session
      // (observed: "zcode resume failed: timeout" after 86s), so they are the
      // fallback, not the path.
      const submit = () => request('session/prompt', { sessionId, prompt: [{ type: 'text', text }] }, 600000);
      /** @type {{ok: boolean, stopReason?: string, error?: string}} */
      const attempt = await submit().then(
        (r) => ({ ok: true, stopReason: String(r?.stopReason ?? 'unknown') }),
        (e) => ({ ok: false, error: String(e.message) }),
      );

      if (!attempt.ok && /not found|notfound/i.test(attempt.error ?? '')) {
        for (const method of ['session/resume', 'session/load']) {
          try {
            await request(method, method === 'session/load' ? { sessionId, cwd, mcpServers: [] } : { sessionId, cwd }, 60000);
            logEvent(logPath, { event: `attached:${method}`, sessionId });
            break;
          } catch (e) {
            logEvent(logPath, { event: `attach_failed:${method}`, sessionId, detail: String(e.message).slice(0, 300) });
          }
        }
        try {
          const r = await submit();
          done = true;
          return finish(`done:${r?.stopReason ?? 'unknown'}`);
        } catch (e) {
          done = true;
          return finish(`error:${e.message}`, 1);
        }
      }

      done = true;
      return attempt.ok ? finish(`done:${attempt.stopReason}`) : finish(`error:${attempt.error}`, 1);
    } catch (e) {
      done = true;
      finish(`error:${e.message}`, 1);
    }
  })();
}
// ------------------------------------------------------------------- sender ----

/**
 * Wake one session.
 *
 * Spawns the worker detached so a turn that runs for minutes does not hold a
 * manager turn open, then watches the worker's log for a bounded time. What
 * counts as `accepted` is a turn event from the bridge — not the fact that a
 * request was written to a pipe.
 *
 * @param {string} sessionId
 * @param {string} text
 * @param {{waitMs?: number, logPath?: string, cwd?: string}} [opts]
 */
export function acpSend(sessionId, text, { waitMs = 45000, logPath, cwd } = {}) {
  const log = logPath || join(process.env.TEMP || homedir(), `hq-acp-${Date.now()}.log`);
  const self = fileURLToPath(import.meta.url);
  const payload = Buffer.from(text, 'utf8').toString('base64');
  const args = [self, '--worker', sessionId, payload, log, cwd || ''];

  const child = spawn(process.execPath, args, { detached: true, stdio: 'ignore', windowsHide: true });
  let spawnError = null;
  child.on('error', (e) => { spawnError = e; });
  child.unref();

  const deadline = Date.now() + waitMs;
  let last = { event: 'start' };
  while (Date.now() < deadline) {
    if (spawnError) return { accepted: false, pending: false, detail: `worker failed to spawn: ${spawnError.message}`, logPath: log };
    const events = readEvents(log);
    if (events.length) last = events[events.length - 1];
    const failed = events.find((e) => String(e.event).startsWith('error') || String(e.event).startsWith('exit_before'));
    if (failed) {
      return { accepted: false, pending: false, detail: String(failed.event), workerStderr: failed.stderr ?? null, logPath: log };
    }
    if (events.some((e) => String(e.event).startsWith('done'))) {
      return { accepted: true, pending: false, detail: 'the seat turn completed', logPath: log };
    }
    if (events.some((e) => e.event === 'turn_update')) {
      return { accepted: true, pending: false, detail: 'the bridge reported a turn event for this session', logPath: log };
    }
    sleep(250);
  }
  return {
    accepted: false,
    pending: true,
    detail: `no turn event within ${Math.round(waitMs / 1000)}s; the worker continues detached`,
    logPath: log,
    lastEvent: last.event ?? null,
  };
}

function readEvents(logPath) {
  try {
    return readFileSync(logPath, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => { try { return JSON.parse(line); } catch { return null; } })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Did the seat actually see the wake? Read its transcript for the marker.
 * Delivery and answer are different facts, so they are reported separately:
 * `delivered` means the user turn carrying the marker is in the session;
 * `answered` means the seat replied with the marker itself.
 */
export function confirmWake(sessionId, wakeId, { messages = 6 } = {}) {
  // Text mode on purpose: the tool's --json path for `show` fails on this
  // install ("query failed: unknown") while text mode reads the same session.
  // A verifier built on the broken path reports every wake unseen.
  const r = spawnSync(nodeBin(), [sessionsTool(), 'show', sessionId, '--messages', String(messages)], {
    encoding: 'utf8',
    timeout: 60000,
  });
  if (r.status !== 0) return { seen: false, delivered: false, answered: false, detail: (r.stderr || 'session unreadable').trim().split(/\r?\n/).pop() };
  const text = String(r.stdout ?? '');
  if (!text.trim()) return { seen: false, delivered: false, answered: false, detail: 'session transcript is empty or unreadable' };
  const needle = `MANAGER-WAKE ${wakeId}`;
  const at = text.indexOf(needle);
  if (at < 0) return { seen: false, delivered: false, answered: false, detail: `the last ${messages} turns do not contain "${needle}"` };
  // The turn that carries the marker is the user turn we sent; the seat's own
  // answer repeats the marker after an [assistant] label.
  const before = text.slice(0, at);
  const lastRole = before.lastIndexOf('[user]') > before.lastIndexOf('[assistant]') ? 'user' : 'assistant';
  return {
    seen: true,
    delivered: true,
    answered: lastRole === 'assistant',
    role: lastRole,
    detail: lastRole === 'assistant' ? 'the seat answered the wake marker' : 'the wake is in the session, no seat answer yet',
  };
}

// -------------------------------------------------------------- entry point ----
if (process.argv[1] && process.argv[1].endsWith('channel-transport.mjs')) {
  const [, , mode, sessionId, payload, logPath, cwd] = process.argv;
  if (mode === '--worker' && sessionId && payload) {
    acpWorker({ sessionId, text: Buffer.from(payload, 'base64').toString('utf8'), logPath: logPath || join(process.env.TEMP || homedir(), 'hq-acp-worker.log'), cwd: cwd || undefined });
  } else {
    process.stderr.write('usage: channel-transport.mjs --worker <sessionId> <base64-text> <logPath>\n');
    process.exit(2);
  }
}
