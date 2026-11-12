#!/usr/bin/env node
// @ts-check
/**
 * @hq:context The spawn CLI: start a new ZCode conversation headless, in plan mode when it is a manager, and
 *   record it in the spawn ledger. Reads the tree and the list back. Refuses with a stable code, never with
 *   a fake session id.
 * @hq:owner agent-platform-ceo
 * @hq:task spawn-conversations
 * @hq:invariant the policy is planSpawn's. This file measures depth, children and time, and writes the row;
 *   it never decides on its own who may write.
 * @hq:invariant the ledger row is written only after a sessionId was captured. A refused or failed spawn
 *   leaves the ledger byte-identical, so the ledger is evidence and not an intent log.
 * @hq:invariant the stdout contract is one line: the session id, and nothing else. A caller pipes it into the
 *   next spawn's --parent.
 * @hq:invariant the runner seam (--runner, HQ_SPAWN_RUNNER) is the only difference between a test and a real
 *   spawn. Tests never reach a provider.
 * @hq:why the real spawn reuses zcodeCli() and nodeBin() from channel-transport: one CLI path on this machine,
 *   not a second one that drifts.
 * @hq:see hq/lib/spawn.mjs · hq/lib/channel-transport.mjs · hq/test/spawn.test.mjs
 */
import { existsSync, mkdirSync, openSync, closeSync, readFileSync, writeFileSync, appendFileSync, statSync } from 'node:fs';
import { spawn as spawnProcess, spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { buildModelInventorySnapshot } from '../lib/model-inventory.mjs';
import {
  SPAWN_CODES,
  SPAWN_LEDGER,
  planSpawn,
  buildBrief,
  appendSpawn,
  readTree,
  renderTree,
} from '../lib/spawn.mjs';
import { nodeBin, zcodeCli } from '../lib/channel-transport.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = fileURLToPath(import.meta.url);

/** Distinct exit codes, so a shell can tell a depth cap from a bad role without parsing text. */
const EXIT = Object.freeze({
  USAGE: 2,
  [SPAWN_CODES.DEPTH_EXCEEDED]: 3,
  [SPAWN_CODES.FANOUT_EXCEEDED]: 4,
  [SPAWN_CODES.BAD_ROLE]: 5,
  [SPAWN_CODES.BAD_PARENT]: 6,
  [SPAWN_CODES.EMPTY_BRIEF]: 7,
  [SPAWN_CODES.BAD_CWD]: 8,
  RUNNER_FAILED: 9,
  MODEL_CONTEXT_UNAVAILABLE: 10,
});

const USAGE = `spawn — one conversation that delegates instead of coding

  new --brief "<text>" --role manager|worker [--parent <sess>] [--cwd <dir>] [--depth n]
      [--acceptance "<cmd>"] [--ledger <path>] [--runner <path>] [--detach]
      Start a new conversation. A manager runs --mode plan with Write and Edit disallowed and cannot edit
      code; a worker runs --mode yolo and can. Prints the new session id on stdout and appends one ledger row.
      --detach launches it detached from this process and prints a launch id instead: the child outlives the
      caller, so a conversation longer than any timeout is not killed mid-work. Read it back with 'status'.

  resume --session <sess> [--brief "<text>"] [--cwd <dir>]
      Detached continuation of an existing conversation. Same launcher; writes no ledger row of its own.

  status [--launch <id>]                     One line per detached launch: RUNNING/EXITED, pid, session id.
                                             A launch whose log names its session id is added to the ledger once.

  tree [--root <sess>] [--ledger <path>]     Render the spawn tree from the ledger.
  list [--ledger <path>]                     One line per recorded session.

Environment:
  HQ_SPAWN_LEDGER   ledger path (default ${SPAWN_LEDGER} under the repo root)
  HQ_SPAWN_RUNNER   runner script, the test seam: node <runner> <request.json>, prints {"sessionId":"sess_..."}
  HQ_SPAWN_TIMEOUT  milliseconds to wait for a real spawn (default 300000); ignored by --detach
  HQ_ZCODE_CLI      the ZCode CLI path, already honoured by channel-transport
`;

/** @param {string[]} argv */
function parseArgs(argv) {
  /** @type {{_: string[], [k: string]: any}} */
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

/** The ledger path, resolved against the repo root, overridable for tests. */
function ledgerPath(args) {
  const given = typeof args.ledger === 'string' ? args.ledger : process.env.HQ_SPAWN_LEDGER;
  return given ? resolve(given) : join(REPO_ROOT, SPAWN_LEDGER);
}

/** @param {string} path */
function readLedger(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

/** @param {string} text */
function ledgerRows(text) {
  /** @type {any[]} */
  const rows = [];
  for (const line of String(text ?? '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (row && typeof row.sessionId === 'string') rows.push(row);
    } catch { /* skipped: a corrupt row must not block a new spawn */ }
  }
  return rows;
}

/**
 * The last JSON object printed by a CLI or a runner. The real CLI may print
 * progress before its payload, so scanning from the end is the reliable read.
 * @param {string} text
 */
function lastJsonObject(text) {
  const s = String(text ?? '');
  try { return JSON.parse(s.trim()); } catch { /* not the whole payload */ }
  const lines = s.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line.startsWith('{')) continue;
    try { return JSON.parse(line); } catch { /* keep scanning */ }
  }
  // Last resort: brace matching from the last closing brace backwards.
  const end = s.lastIndexOf('}');
  const start = s.lastIndexOf('{', end);
  if (end > -1 && start > -1 && start < end) {
    try { return JSON.parse(s.slice(start, end + 1)); } catch { /* give up */ }
  }
  return null;
}

/**
 * Run one spawn and return the session id, or a failure detail. Two paths, one
 * contract: an injected runner (tests) and the real ZCode CLI.
 *
 * @param {any} request
 * @param {string|null} runner
 * @returns {{ok: true, sessionId: string} | {ok: false, detail: string}}
 */
function runSpawn(request, runner) {
  if (runner) {
    const reqFile = join(process.env.TEMP || tmpdir(), `hq-spawn-req-${Date.now()}-${process.pid}.json`);
    writeFileSync(reqFile, JSON.stringify(request), 'utf8');
    const node = process.env.HQ_SPAWN_NODE || process.execPath;
    const r = spawnSync(node, [runner, reqFile], { encoding: 'utf8', timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
    if (r.error) return { ok: false, detail: `runner could not start: ${/** @type {any} */ (r.error).message}` };
    const payload = lastJsonObject(r.stdout);
    const id = payload && typeof payload.sessionId === 'string' ? payload.sessionId : null;
    if (r.status !== 0) {
      const why = String(r.stderr ?? '').trim().split(/\r?\n/).pop() || `exit ${r.status}`;
      return { ok: false, detail: `runner exited ${r.status}: ${why}` };
    }
    if (!id || !id.startsWith('sess_')) return { ok: false, detail: 'runner printed no sess_ session id' };
    return { ok: true, sessionId: id };
  }

  const cli = zcodeCli();
  if (!cli) return { ok: false, detail: 'the ZCode CLI was not found; set HQ_ZCODE_CLI' };
  const args = [cli, '-p', request.brief, '--json', '--mode', request.mode, '--cwd', request.cwd];
  if (request.disallowedTools.length > 0) args.push('--disallowed-tools', ...request.disallowedTools);

  const timeout = Number(process.env.HQ_SPAWN_TIMEOUT || 300000);
  const r = spawnSync(nodeBin(), args, { encoding: 'utf8', timeout, maxBuffer: 64 * 1024 * 1024, windowsHide: true });
  if (r.error) return { ok: false, detail: `the CLI could not start: ${/** @type {any} */ (r.error).message}` };
  const payload = lastJsonObject(r.stdout);
  const id = payload && typeof payload.sessionId === 'string' ? payload.sessionId : null;
  if (r.status !== 0) {
    const why = String(r.stderr ?? '').trim().split(/\r?\n/).pop() || `exit ${r.status}`;
    return { ok: false, detail: `the CLI exited ${r.status}: ${why}` };
  }
  if (!id || !id.startsWith('sess_')) return { ok: false, detail: 'the CLI printed no sess_ session id' };
  return { ok: true, sessionId: id };
}

/** Where a detached launch keeps its intent row and its stdout log. HQ_SPAWN_RUNS keeps tests out of the live dir. */
function runsDir() {
  const dir = process.env.HQ_SPAWN_RUNS ? resolve(process.env.HQ_SPAWN_RUNS) : join(REPO_ROOT, 'hq', 'work', 'runs');
  return { dir, runsLedger: join(dir, 'runs.jsonl') };
}

/**
 * Launch the CLI as a detached child and return at once.
 *
 * @hq:why this exists. runSpawn used spawnSync with a timeout, so a conversation that outlived the
 *   timeout was KILLED mid-turn and its work was lost while the caller reported a failed spawn.
 *   Measured 2026-11-04: seven real conversations ran 2-6 turns each, wrote nothing, and died at
 *   the timeout. A detached child outlives the caller by construction; the session id is recovered
 *   from its log afterwards instead of being awaited.
 * @param {any} request
 * @returns {{ok: true, launchId: string, pid: number|null, logPath: string} | {ok: false, detail: string}}
 */
function runSpawnDetached(request) {
  const cli = zcodeCli();
  if (!cli) return { ok: false, detail: 'the ZCode CLI was not found; set HQ_ZCODE_CLI' };
  // A detached spawn of `node <missing file>` still "succeeds" from the caller's side, so the path is
  // checked here: a launch id must never be printed for a CLI that cannot run.
  if (!existsSync(cli)) return { ok: false, detail: `the ZCode CLI path does not exist: ${cli}` };
  const args = [cli, '-p', request.brief, '--json', '--mode', request.mode, '--cwd', request.cwd];
  if (request.disallowedTools && request.disallowedTools.length > 0) args.push('--disallowed-tools', ...request.disallowedTools);
  if (request.resume) args.push('--resume', request.resume);

  const { dir, runsLedger } = runsDir();
  mkdirSync(dir, { recursive: true });
  const launchId = `launch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const logPath = join(dir, `${launchId}.log`);
  const fd = openSync(logPath, 'a');
  let child;
  try {
    child = spawnProcess(nodeBin(), args, { detached: true, stdio: ['ignore', fd, fd], windowsHide: true });
  } catch (err) {
    closeSync(fd);
    return { ok: false, detail: `the CLI could not start: ${/** @type {any} */ (err).message}` };
  }
  child.unref();
  closeSync(fd);

  const goal = String(request.brief || '').split(/\r?\n/).map((l) => l.trim()).find((l) => l && !l.startsWith('#'))?.slice(0, 120) ?? '';
  appendFileSync(runsLedger, JSON.stringify({
    at: new Date().toISOString(),
    launchId,
    pid: child.pid ?? null,
    log: logPath,
    resume: request.resume ?? null,
    parent: request.parent ?? null,
    depth: request.depth ?? null,
    role: request.role ?? 'worker',
    mode: request.mode,
    cwd: request.cwd,
    goal,
  }) + '\n', 'utf8');
  return { ok: true, launchId, pid: child.pid ?? null, logPath };
}

/** A pid is alive if signal 0 is accepted; EPERM still means the process exists. */
function pidAlive(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; }
  catch (err) { return /** @type {any} */ (err).code === 'EPERM'; }
}

/** Append the ledger row for a detached launch once its log names the session id. Idempotent by session id. */
function recordLaunch(row, sessionId) {
  const path = ledgerPath({});
  const existing = readLedger(path);
  if (ledgerRows(existing).some((r) => r.sessionId === sessionId)) return false;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, appendSpawn(existing, {
    at: new Date().toISOString(),
    sessionId,
    parent: row.parent ?? null,
    depth: typeof row.depth === 'number' ? row.depth : 0,
    role: row.role ?? 'worker',
    goal: row.goal ?? '',
    mode: row.mode ?? 'yolo',
    cwd: row.cwd ?? REPO_ROOT,
  }), 'utf8');
  return true;
}

/** @param {string[]} argv */
function cmdStatus(argv) {
  const args = parseArgs(argv);
  const { runsLedger } = runsDir();
  if (!existsSync(runsLedger)) {
    process.stdout.write('spawn status: no detached launches yet\n');
    return;
  }
  const rows = readFileSync(runsLedger, 'utf8').split(/\r?\n/).filter(Boolean).flatMap((line) => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
  const target = typeof args.launch === 'string' ? args.launch : null;
  let shown = 0;
  for (const row of rows) {
    if (target && row.launchId !== target) continue;
    shown += 1;
    const text = existsSync(row.log) ? readFileSync(row.log, 'utf8') : '';
    const payload = lastJsonObject(text);
    const sessionId = payload && typeof payload.sessionId === 'string' ? payload.sessionId : null;
    const recorded = sessionId ? recordLaunch(row, sessionId) : false;
    const state = pidAlive(row.pid) ? 'RUNNING' : 'EXITED';
    process.stdout.write(`${row.launchId} ${state} pid=${row.pid ?? '-'} session=${sessionId ?? '-'}${recorded ? ' (ledgered)' : ''} ${row.goal ?? ''}\n`);
  }
  if (shown === 0) process.stdout.write(`spawn status: no launch ${target}\n`);
}

/** @param {string[]} argv */
function cmdResume(argv) {
  const args = parseArgs(argv);
  const session = typeof args.session === 'string' ? args.session : '';
  if (!/^sess_[A-Za-z0-9._-]+$/.test(session)) {
    process.stderr.write('spawn resume: --session must be a sess_ id\n');
    process.exitCode = EXIT.USAGE;
    return;
  }
  const brief = typeof args.brief === 'string'
    ? args.brief
    : 'Continue the task you were given in this conversation and finish it. Write the files, run the acceptance command, and end with DONE or BLOCKED.';
  const launched = runSpawnDetached({
    brief,
    mode: 'yolo',
    disallowedTools: [],
    depth: null,
    parent: null,
    role: 'resume',
    cwd: typeof args.cwd === 'string' ? args.cwd : REPO_ROOT,
    resume: session,
  });
  if (launched.ok === false) {
    process.stderr.write(`spawn failed: ${launched.detail}\n`);
    process.exitCode = EXIT.RUNNER_FAILED;
    return;
  }
  process.stdout.write(`${launched.launchId}\nlog: ${launched.logPath}\n`);
}

// Only these read-only inputs are admitted; never serialize config, usage rows, or raw evidence into a brief.
const MODEL_CONTEXT_MAX_CHARS = 4096;
const MODEL_CONTEXT_MAX_PROVIDERS = 12;
const MODEL_CONTEXT_MAX_MODELS = 24;
const MODEL_CONTEXT_WINDOW_MS = 5 * 60 * 60 * 1000;
const MODEL_CONTEXT_STALE_MS = 60 * 60 * 1000;

/** Single-line identifier, not arbitrary provider-controlled prose or an instruction. */
function safeModelLabel(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_.:/+-]{1,90}$/.test(value) ? value : '[redacted]';
}

/** @param {any} snapshot */
function renderModelContext(snapshot) {
  const lines = [
    '## Read-only provider/model budget snapshot',
    `Generated at: ${snapshot.generatedAt}. Historical usage is not a live quota check; UNKNOWN means remaining capacity is unverified.`,
  ];
  let modelCount = 0;
  const providers = snapshot.providers.slice(0, MODEL_CONTEXT_MAX_PROVIDERS);
  for (const provider of providers) {
    const providerName = safeModelLabel(provider.providerId);
    const configState = provider.configEvidence?.stale ? 'STALE' : 'current';
    const quota = provider.remainingQuota;
    const providerQuota = quota?.state === 'KNOWN' && !quota.evidence?.stale
      ? `${quota.value} ${safeModelLabel(quota.unit)}` : 'UNKNOWN';
    lines.push(`Provider ${providerName}: config=${configState}; remaining=${providerQuota}; observed=${provider.configEvidence?.observedAt ?? 'UNKNOWN'}`);
    for (const model of provider.models) {
      if (modelCount >= MODEL_CONTEXT_MAX_MODELS) break;
      modelCount++;
      const usage = model.usage?.evidence;
      const history = usage?.stale ? 'STALE' : 'current';
      const budget = usage?.stale || provider.configEvidence?.stale ? 'UNKNOWN' :
        ['blocked', 'warn', 'funded', 'unverified'].includes(model.budgetState) ? model.budgetState : 'UNKNOWN';
      const remaining = model.remainingQuota?.state === 'KNOWN' && !model.remainingQuota.evidence?.stale
        ? `${model.remainingQuota.value} ${safeModelLabel(model.remainingQuota.unit)}` : 'UNKNOWN';
      lines.push(`  ${safeModelLabel(model.modelId)}: budget=${budget}; history=${history}; observed=${usage?.observedAt ?? 'UNKNOWN'}; remaining=${remaining}`);
    }
    if (modelCount >= MODEL_CONTEXT_MAX_MODELS) break;
  }
  if (snapshot.providers.length > providers.length || snapshot.modelCount > modelCount) {
    lines.push(`Additional providers/models omitted (limit ${MODEL_CONTEXT_MAX_PROVIDERS} providers, ${MODEL_CONTEXT_MAX_MODELS} models).`);
  }
  // Fixed line count and byte ceiling, even if an upstream identifier is unusually long.
  return lines.join('\n').slice(0, MODEL_CONTEXT_MAX_CHARS);
}

/**
 * Acquire already existing local facts only. Failure is an explicit spawn blocker, never an empty snapshot.
 * Override paths are for offline tests; no network calls, provider probes, or config writes.
 */
function acquireModelContext() {
  const home = process.env.USERPROFILE || process.env.HOME || homedir();
  const configPath = process.env.HQ_SPAWN_PROVIDER_CONFIG || join(home, '.zcode', 'v2', 'provider_config.json');
  const usagePath = process.env.HQ_SPAWN_USAGE_DB || join(home, '.zcode', 'cli', 'db', 'db.sqlite');
  const catalogPath = process.env.HQ_SPAWN_DEPOT_CATALOG || join(home, '.zcode', 'provider-depot', 'catalog.json');
  try {
    const now = Date.now();
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    const configObservedAt = statSync(configPath).mtimeMs;
    const rules = config?.config?.providerConfigRules?.providerRules;
    if (!Array.isArray(rules) || !rules.some((r) => r?.enabled === true && typeof r.providerId === 'string')) throw new Error('no enabled provider rules');
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
    if (!catalog || typeof catalog !== 'object' || !catalog.sources) throw new Error('depot catalog is unavailable');
    let db;
    let usageRows;
    try {
      db = new DatabaseSync(usagePath, { readOnly: true });
      usageRows = db.prepare('SELECT provider_id, model_id, status, started_at, duration_ms, input_tokens, output_tokens, error_type, error_code, error_message FROM model_usage WHERE started_at >= ?').all(now - MODEL_CONTEXT_WINDOW_MS);
    } finally { db?.close(); }
    const snapshot = buildModelInventorySnapshot({
      providerConfig: config, configObservedAt, depotCatalog: catalog, usageRows, now,
      staleAfterMs: MODEL_CONTEXT_STALE_MS,
    });
    if (snapshot.modelCount === 0) throw new Error('no configured models');
    return { ok: true, context: renderModelContext(snapshot) };
  } catch {
    // Never include paths, DB errors, raw config or credentials in a refusal.
    return { ok: false, detail: 'MODEL_CONTEXT_UNAVAILABLE — local provider config, depot catalog, or usage database is missing/invalid; no agent started' };
  }
}

/** @param {string[]} argv */
function cmdNew(argv) {
  const args = parseArgs(argv);
  const path = ledgerPath(args);
  const existing = readLedger(path);
  const rows = ledgerRows(existing);

  const parent = typeof args.parent === 'string' ? args.parent : null;
  const parentRow = parent ? rows.find((r) => r.sessionId === parent) : null;
  const brief = typeof args.brief === 'string' ? args.brief : '';
  const role = typeof args.role === 'string' ? args.role : 'manager';
  const cwd = typeof args.cwd === 'string' ? args.cwd : REPO_ROOT;  // Zero-based generation: a root is depth 0. A parent that is not in the ledger was itself a root
  // (a conversation the owner started by hand), so its first child is depth 1.
  const parentDepth = parent ? (Number.isInteger(parentRow?.depth) ? Number(parentRow.depth) : 0) : -1;
  const depth = args.depth === undefined ? parentDepth + 1 : Number(args.depth);
  // Fanout is a cap on delegation, not on how many conversations the owner may start.
  const children = parent ? rows.filter((r) => r.parent === parent).length : 0;

  const plan = planSpawn({ role, parent, depth, children, brief, cwd });
  if (plan.ok === false) {
    process.stderr.write(`spawn refused: ${plan.code} — ${plan.detail}\n`);
    process.exitCode = /** @type {any} */ (EXIT)[plan.code] ?? EXIT.USAGE;
    return;
  }

  const modelContext = acquireModelContext();
  if (modelContext.ok === false) {
    process.stderr.write(`spawn refused: ${modelContext.detail}\n`);
    process.exitCode = EXIT.MODEL_CONTEXT_UNAVAILABLE;
    return;
  }
  const acceptance = typeof args.acceptance === 'string' ? args.acceptance : 'bun test';
  const text = `${buildBrief({ role, goal: brief, parent, acceptance })}\n\n${modelContext.context}`;
  const request = {
    role,
    mode: plan.mode,
    disallowedTools: plan.disallowedTools,
    depth: plan.depth,
    parent,
    cwd,
    acceptance,
    brief: text,
  };

  if (args.detach === true) {
    const launched = runSpawnDetached(request);
    if (launched.ok === false) {
      process.stderr.write(`spawn failed: ${launched.detail}\n`);
      process.exitCode = EXIT.RUNNER_FAILED;
      return;
    }
    process.stdout.write(`${launched.launchId}\nlog: ${launched.logPath}\n`);
    return;
  }

  const runner = typeof args.runner === 'string' ? args.runner : process.env.HQ_SPAWN_RUNNER || null;
  const result = runSpawn(request, runner);
  if (result.ok === false) {
    process.stderr.write(`spawn failed: ${result.detail}\n`);
    process.exitCode = EXIT.RUNNER_FAILED;
    return;
  }

  const goal = String(brief).split(/\r?\n/).map((l) => l.trim()).find(Boolean)?.slice(0, 120) ?? '';
  const row = {
    at: new Date().toISOString(),
    sessionId: result.sessionId,
    parent,
    depth: plan.depth,
    role,
    goal,
    mode: plan.mode,
    cwd,
  };
  // Only now does anything touch disk: a failed spawn never creates the ledger.
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, appendSpawn(existing, row), 'utf8');

  process.stdout.write(`${result.sessionId}\n`);
}

/** @param {string[]} argv */
function cmdTree(argv) {
  const args = parseArgs(argv);
  const path = ledgerPath(args);
  const text = readLedger(path);
  const tree = readTree(text, typeof args.root === 'string' ? args.root : undefined);
  if (tree.nodes.length === 0) {
    if (typeof args.root === 'string') {
      process.stdout.write(`spawn ledger: ${args.root} is not in ${path}\n`);
      process.exitCode = EXIT.BAD_PARENT;
      return;
    }
    process.stdout.write(`spawn ledger: no rows yet (${path})\n`);
    return;
  }
  process.stdout.write(`${renderTree(tree)}\n`);
  process.stdout.write(`\n${tree.nodes.length} session(s) from ${path}\n`);
}

/** @param {string[]} argv */
function cmdList(argv) {
  const args = parseArgs(argv);
  const path = ledgerPath(args);
  const rows = ledgerRows(readLedger(path));
  if (rows.length === 0) {
    process.stdout.write(`spawn ledger: no rows yet (${path})\n`);
    return;
  }
  for (const r of rows) {
    process.stdout.write(`${r.sessionId} ${r.role ?? '?'} d${r.depth ?? '?'} parent=${r.parent ?? '-'} mode=${r.mode ?? '?'} ${r.goal ?? ''}\n`);
  }
}

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    process.stdout.write(USAGE);
    return;
  }
  if (command === 'new') return cmdNew(argv.slice(1));
  if (command === 'resume') return cmdResume(argv.slice(1));
  if (command === 'status') return cmdStatus(argv.slice(1));
  if (command === 'tree') return cmdTree(argv.slice(1));
  if (command === 'list') return cmdList(argv.slice(1));
  process.stderr.write(`spawn: unknown command ${JSON.stringify(command)}\n\n${USAGE}`);
  process.exitCode = EXIT.USAGE;
}

if (process.argv[1] && resolve(process.argv[1]) === CLI) main();
