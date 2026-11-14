#!/usr/bin/env node
// Acceleration R002 W1/B — real loopback Host acceptance, never a signed-in provider/device test.
// One command: node scripts/acceleration/live-host-check.mjs
// An ephemeral Host dataRoot is mandatory; no operator data directory is ever accepted.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile as execFileCallback, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EVIDENCE_PATH = path.join(ROOT, 'scripts', 'batch-evidence', 'WIKI-BASELINE.mjs');
const PUBLIC_DEMO_JOURNAL = path.join(ROOT, 'apps', 'vivim-host', 'public', 'demo', 'journal.jsonl');
const execFile = promisify(execFileCallback);
const excerpt = value => String(value ?? '').slice(-2400);
const digest = text => createHash('sha256').update(text).digest('hex');

function processProbe(file, args) {
  const p = spawnSync(file, args, { cwd: ROOT, encoding: 'utf8', timeout: 5000 });
  return { command: [file, ...args].join(' '), exitCode: p.status, signal: p.signal ?? null,
    stdoutExcerpt: excerpt(p.stdout), stderrExcerpt: excerpt(p.stderr || p.error?.message), timedOut: p.error?.code === 'ETIMEDOUT' };
}

async function evidenceSubprocess(base) {
  const args = [EVIDENCE_PATH, '--live'];
  const started = Date.now();
  const result = { command: [process.execPath, ...args].join(' '),
    timeoutMs: 25000, exitCode: null, timedOut: false, stdoutExcerpt: '', stderrExcerpt: '' };
  let stdout = '';
  try {
    const output = await execFile(process.execPath, args, {
      cwd: ROOT, timeout: result.timeoutMs, maxBuffer: 2 * 1024 * 1024,
      env: { ...process.env, ARBOR_WIKI_EVIDENCE_ISOLATED: '1',
        ARBOR_WIKI_EVIDENCE_BASE_URL: base }
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
  const demoJournalBefore = existsSync(PUBLIC_DEMO_JOURNAL)
    ? digest(readFileSync(PUBLIC_DEMO_JOURNAL)) : null;
  const checks = [];
  const requests = [];
  const receipt = {
    schema: 'arbor.acceleration-host-check/1',
    lane: 'A01', parallelLane: 'W1-B', source: 'actual-isolated-host-http',
    sha: git.exitCode === 0 && /^[0-9a-f]{40}$/.test(git.stdoutExcerpt.trim())
      ? git.stdoutExcerpt.trim() : null,
    sourceProbe: git,
    command,
    platform: process.platform, arch: process.arch, node: process.version,
    environment: { osType: os.type(), osRelease: os.release(),
      nodeVersions: process.versions, bun: bun.exitCode === 0 ? bun.stdoutExcerpt.trim() : 'UNAVAILABLE',
      nodeModulesPresent: existsSync(path.join(ROOT, 'node_modules')),
      bunLockPresent: existsSync(path.join(ROOT, 'bun.lock')) },
    startedAt: new Date(startTime).toISOString(),
    dataIsolation: {
      strategy: 'mkdtemp in system temp; Host receives dataRoot explicitly',
      basename: path.basename(actualDataRoot),
      ownedTemporaryDirectory: actualDataRoot.startsWith(tempParent + path.sep) &&
        lstatSync(actualDataRoot).isDirectory(),
      journalRelativePath: 'product-state/journal.jsonl', deletedAfterRun: false
    },
    realProviderEffects: false, realPhoneActions: false,
    browserDom: 'UNRUN', physicalDevice: 'UNRUN', independentKeeperAcceptance: 'UNRUN',
    tests: checks, requests, subprocesses: []
  };
  let server = null;
  let base = null;
  const check = (name, fn, observation) => {
    try {
      fn();
      checks.push({ name, pass: true, ...(observation === undefined ? {} : { observation }) });
    } catch (error) {
      checks.push({ name, pass: false, error: String(error.message || error) });
      throw error;
    }
  };
  const start = async createHostServer => {
    server = createHostServer({ dataRoot: actualDataRoot, autoPump: false });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    base = 'http://127.0.0.1:' + server.address().port;
  };
  const close = async () => {
    if (server?.listening) await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()));
    server = null;
  };
  const request = async (method, route, payload, headers = {}) => {
    const at = Date.now();
    const res = await fetch(base + route, {
      method, headers: { ...(payload === undefined ? {} : { 'content-type': 'application/json' }), ...headers },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
      signal: AbortSignal.timeout(5000)
    });
    const body = await res.text();
    requests.push({ method, route, status: res.status,
      contentType: res.headers.get('content-type'), durationMs: Date.now() - at });
    return { status: res.status, contentType: res.headers.get('content-type'), text: body };
  };
  const get = route => request('GET', route);
  const post = (payload, headers) => request('POST', '/api/mutate', payload, headers);
  const readJson = async route => {
    const r = await get(route);
    assert.equal(r.status, 200, route + ': ' + excerpt(r.text));
    return JSON.parse(r.text);
  };
  try {
    check('Node 24 runtime required for acceptance', () => {
      assert.equal(Number(process.versions.node.split('.')[0]), 24, 'Observed ' + process.version + '; Node24 required');
    });
    check('real checked-out Git commit is pinned', () => {
      assert.equal(git.exitCode, 0, git.stderrExcerpt);
      assert.match(receipt.sha || '', /^[0-9a-f]{40}$/);
    }, receipt.sha);
    check('data root is isolated beneath system temporary directory', () => {
      assert.ok(receipt.dataIsolation.ownedTemporaryDirectory);
      assert.ok(path.basename(actualDataRoot).startsWith('arbor-accel-r002-w1-b-'));
      assert.equal(existsSync(privateJournal), false);
    });
    // Delay import: missing dependency/source closure becomes a JSON failure receipt.
    const { createHostServer } = await import('../../apps/vivim-host/server.mjs');
    await start(createHostServer);
    receipt.boundHost = { bindAddress: '127.0.0.1', ephemeralPort: true };
    for (const [route, type] of [
      ['/chat', /text\/html/], ['/wiki', /text\/html/], ['/demo', /text\/html/],
      ['/chat.js', /javascript/], ['/wiki.js', /javascript/],
      ['/chat.css', /text\/css/], ['/wiki.css', /text\/css/],
      ['/api/state', /application\/json/], ['/api/wiki', /application\/json/],
      ['/api/journal', /application\/json/], ['/api/roadmap', /application\/json/],
      ['/api/file-surface', /application\/json/]
    ]) {
      const response = await get(route);
      check('GET ' + route, () => {
        assert.equal(response.status, 200, excerpt(response.text));
        assert.match(response.contentType || '', type);
      }, { status: response.status, contentType: response.contentType });
    }
    const initialState = await readJson('/api/state');
    const before = await readJson('/api/wiki');
    const roadmap = await readJson('/api/roadmap');
    const surface = await readJson('/api/file-surface');
    check('typed source-backed reads', () => {
      assert.ok(Array.isArray(initialState.chat));
      assert.ok(Number.isSafeInteger(before.revision));
      assert.ok(Array.isArray(roadmap.buildQueue));
      assert.ok(surface && typeof surface === 'object');
    }, { wikiRevision: before.revision, buildQueueCount: roadmap.buildQueue.length });
    const initialJournal = await readJson('/api/journal');
    check('fresh private journal is empty', () => assert.deepEqual(initialJournal, []));
    // This read intentionally happens before any writes, proving no owner history was loaded.
    const chatPayload = { kind: 'chat-send', schemaVersion: 1,
      actor: 'owner-browser', text: 'open the wiki' };
    const badOrigin = await post(chatPayload, { origin: 'https://untrusted.invalid' });
    check('cross-origin chat rejected', () => assert.equal(badOrigin.status, 403));
    const badEnvelope = await post({ ...chatPayload, schemaVersion: 999 });
    check('invalid typed envelope rejected', () => assert.equal(badEnvelope.status, 400));
    const badKind = await post({ kind: 'invoke-provider', schemaVersion: 1, actor: 'owner-browser' });
    check('unknown provider-effect mutation refused', () => assert.equal(badKind.status, 400));
    const chat = await post(chatPayload);
    check('real chat append with interpreted intent', () => {
      assert.equal(chat.status, 200, chat.text);
      assert.equal(JSON.parse(chat.text).kind, 'chat-send');
      assert.equal(typeof JSON.parse(chat.text).receivedAt, 'string');
    });
    const afterChat = await readJson('/api/state');
    check('chat durable state projection', () => {
      assert.ok(afterChat.chat.some(m => m.text === chatPayload.text));
      assert.equal(afterChat.revision, initialState.revision + 1);
    }, { revision: afterChat.revision });
    const edit = { kind: 'wiki-edit', schemaVersion: 1, actor: 'owner-browser',
      expectedRevision: before.revision, edit: { action: 'set-section', page: 'Main',
        section: 'HowTo', content: 'R002 W1-B isolated revision checkpoint' } };
    const headers = { origin: base, 'x-vivim-control': '1' };
    const unauthorized = await post(edit);
    check('Wiki edit without origin/control refused', () => assert.equal(unauthorized.status, 403));
    const missingControl = await post(edit, { origin: base });
    check('Wiki edit without CSRF control refused', () => assert.equal(missingControl.status, 403));
    const forged = await post(edit, { ...headers, origin: 'https://untrusted.invalid' });
    check('cross-origin Wiki edit refused', () => assert.equal(forged.status, 403));
    const saved = await post(edit, headers);
    check('same-origin bounded Wiki edit acknowledged', () => {
      assert.equal(saved.status, 200, saved.text);
      assert.equal(JSON.parse(saved.text).wikiRevision, before.revision + 1);
    }, { wikiRevision: before.revision + 1 });
    const stale = await post(edit, headers);
    check('stale Wiki revision refused', () => assert.equal(stale.status, 409));
    const missingRevision = await post({ ...edit, expectedRevision: undefined }, headers);
    check('missing Wiki revision refused', () => assert.equal(missingRevision.status, 428));
    const invalidTarget = await post({ ...edit, expectedRevision: before.revision + 1,
      edit: { ...edit.edit, page: '../owner-data' } }, headers);
    check('Wiki path traversal target refused', () => assert.equal(invalidTarget.status, 400));
    const wiki = await readJson('/api/wiki');
    const state = await readJson('/api/state');
    check('Wiki and chat share deterministic revisions', () => {
      assert.equal(wiki.pages.Main.sections.HowTo, edit.edit.content);
      assert.equal(wiki.revision, before.revision + 1);
      assert.equal(state.wikiRevision, wiki.revision);
      assert.equal(state.revision, afterChat.revision + 1);
    }, { wikiRevision: wiki.revision, productRevision: state.revision });
    const journal = await readJson('/api/journal');
    const raw = await get('/demo/journal.jsonl');
    check('read-through API and demo alias match exact private JSONL bytes', () => {
      assert.deepEqual(journal.map(x => x.kind), ['chat-send', 'wiki-edit']);
      assert.equal(raw.status, 200);
      assert.deepEqual(jsonl(raw.text), journal);
      assert.ok(existsSync(privateJournal));
      assert.equal(readFileSync(privateJournal, 'utf8'), raw.text);
    }, { entries: journal.length, sha256: digest(raw.text) });
    receipt.dataIsolation.privateJournalSha256 = digest(raw.text);
    const unknown = await get('/api/not-a-route');
    check('unknown typed route returns 404', () => assert.equal(unknown.status, 404));
    const invalidMethod = await request('POST', '/api/state');
    check('read-only state route rejects POST', () => assert.equal(invalidMethod.status, 405));
    await close();
    await start(createHostServer);
    const replay = await readJson('/api/wiki');
    const replayState = await readJson('/api/state');
    const replayJournal = await readJson('/api/journal');
    check('fresh Host restart replays same private journal and state', () => {
      assert.deepEqual(replayJournal, journal);
      assert.equal(replay.pages.Main.sections.HowTo, edit.edit.content);
      assert.equal(replay.revision, wiki.revision);
      assert.deepEqual(replayState.chat, state.chat);
      assert.equal(replayState.wikiRevision, wiki.revision);
      assert.equal(readFileSync(privateJournal, 'utf8'), raw.text);
    }, { sameJournalSha256: digest(readFileSync(privateJournal)) });
    const evidence = await evidenceSubprocess(base);
    receipt.subprocesses.push(evidence);
    receipt.wikiEvidence = { scope: evidence.verdict?.scope ?? null,
      passedChecks: evidence.verdict?.checks?.filter(x => x.pass).length ?? 0,
      independentKeeperAcceptance: evidence.verdict?.independentKeeperAcceptance ?? 'UNRUN',
      exitCode: evidence.exitCode, timedOut: evidence.timedOut };
    check('independent-format Wiki source/API evidence subprocess', () => {
      assert.equal(evidence.exitCode, 0, evidence.stderrExcerpt || evidence.error);
      assert.equal(evidence.verdict?.ok, true, JSON.stringify(evidence.verdict?.checks?.filter(x => !x.pass)));
      assert.equal(evidence.verdict?.browserDom, 'UNRUN');
      assert.equal(evidence.verdict?.independentKeeperAcceptance, 'UNRUN');
    }, { exitCode: evidence.exitCode, checkCount: evidence.verdict?.checks?.length });
    const evidenceJournal = await readJson('/api/journal');
    check('evidence writer appended exactly one bounded Wiki edit', () => {
      assert.equal(evidenceJournal.length, journal.length + 1);
      assert.deepEqual(evidenceJournal.slice(0, journal.length), journal);
      assert.equal(evidenceJournal.at(-1).kind, 'wiki-edit');
      assert.equal(evidenceJournal.at(-1).actor, 'ai');
    }, { entries: evidenceJournal.length });
    receipt.ok = true;
    receipt.exitCode = 0;
  } catch (error) {
    receipt.ok = false;
    receipt.exitCode = 1;
    receipt.failure = String(error?.stack || error);
  } finally {
    try { await close(); }
    catch (error) { receipt.cleanupFailure = 'Server close: ' + String(error); receipt.ok = false; receipt.exitCode = 1; }
    try { rmSync(actualDataRoot, { recursive: true, force: true }); }
    catch (error) { receipt.cleanupFailure = 'Temporary root removal: ' + String(error); receipt.ok = false; receipt.exitCode = 1; }
    receipt.dataIsolation.deletedAfterRun = !existsSync(actualDataRoot);
    if (!receipt.dataIsolation.deletedAfterRun) { receipt.ok = false; receipt.exitCode = 1; }
    const demoJournalAfter = existsSync(PUBLIC_DEMO_JOURNAL)
      ? digest(readFileSync(PUBLIC_DEMO_JOURNAL)) : null;
    receipt.dataIsolation.publicDemoJournalBeforeSha256 = demoJournalBefore;
    receipt.dataIsolation.publicDemoJournalAfterSha256 = demoJournalAfter;
    receipt.dataIsolation.publicDemoJournalUnchanged = demoJournalAfter === demoJournalBefore;
    if (!receipt.dataIsolation.publicDemoJournalUnchanged) {
      receipt.ok = false; receipt.exitCode = 1; receipt.failure = 'Committed demo journal unexpectedly changed';
    }
    receipt.passedChecks = checks.filter(c => c.pass).length;
    receipt.failedChecks = checks.filter(c => !c.pass).length;
    receipt.durationMs = Date.now() - startTime;
    receipt.completedAt = new Date().toISOString();
  }
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const receipt = await runHostLoopCheck();
  process.stdout.write(JSON.stringify(receipt, null, 2) + '\n');
  process.exitCode = receipt.exitCode;
}
