#!/usr/bin/env node
// A01 — reproducible, isolated Host product loop. No signed-in provider or device calls.
// Usage: node scripts/acceleration/live-host-check.mjs
// Uses temporary Host dataRoot, never the owner's persistent profile.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { createHostServer } from '../../apps/vivim-host/server.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const execFile = promisify(execFileCallback);

export async function runHostLoopCheck() {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'arbor-acceleration-A01-'));
  const checks = [];
  let server;
  let base = '';
  const start = async () => {
    server = createHostServer({ dataRoot, autoPump: false });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    base = 'http://127.0.0.1:' + server.address().port;
  };
  const close = async () => {
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    server = null;
  };
  const get = async (url) => {
    const res = await fetch(base + url, { signal: AbortSignal.timeout(5000) });
    return { status: res.status, contentType: res.headers.get('content-type'), text: await res.text() };
  };
  const post = async (body, headers = {}) => {
    const res = await fetch(base + '/api/mutate', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body), signal: AbortSignal.timeout(5000)
    });
    return { status: res.status, body: await res.text() };
  };
  const check = (name, assertion) => {
    assertion(); checks.push({ name, passed: true });
  };
  const git = spawnSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: ROOT, encoding: 'utf8', timeout: 5000 });
  const receipt = {
    schema: 'arbor.acceleration-host-check/1',
    lane: 'A01', source: 'isolated-host-live-runner',
    sha: git.status === 0 ? git.stdout.trim() : 'UNKNOWN',
    platform: process.platform, arch: process.arch, node: process.version,
    command: 'node scripts/acceleration/live-host-check.mjs',
    tests: checks, startedAt: new Date().toISOString(),
    dataIsolation: 'temporary data root', realProviderEffects: false, realPhoneActions: false
  };
  try {
    await start();
    for (const [url, type] of [
      ['/chat', /text\/html/], ['/wiki', /text\/html/], ['/demo', /text\/html/],
      ['/chat.js', /javascript/], ['/wiki.js', /javascript/],
      ['/chat.css', /text\/css/], ['/wiki.css', /text\/css/],
      ['/api/state', /application\/json/], ['/api/wiki', /application\/json/],
      ['/api/journal', /application\/json/], ['/api/roadmap', /application\/json/],
      ['/api/file-surface', /application\/json/]
    ]) {
      const out = await get(url);
      check('GET ' + url, () => {
        assert.equal(out.status, 200);
        assert.match(out.contentType || '', type);
      });
    }

    const before = JSON.parse((await get('/api/wiki')).text);
    const initialJournal = JSON.parse((await get('/api/journal')).text);
    check('isolated journal initially empty', () => assert.deepEqual(initialJournal, []));

    const chat = await post({
      kind: 'chat-send', schemaVersion: 1, actor: 'owner-browser', text: 'open the wiki'
    });
    check('typed chat append and interpreter', () => {
      assert.equal(chat.status, 200, chat.body);
      assert.equal(JSON.parse(chat.body).kind, 'chat-send');
    });
    const state = JSON.parse((await get('/api/state')).text);
    check('chat is projected', () => {
      assert.ok(state.chat.some(m => m.text === 'open the wiki'));
      assert.ok(Number.isInteger(state.revision) && state.revision > 0);
    });

    const edit = {
      kind: 'wiki-edit', schemaVersion: 1, actor: 'owner-browser',
      expectedRevision: before.revision,
      edit: { action: 'set-section', page: 'Main', section: 'HowTo',
        content: 'A01 isolated replay checkpoint' }
    };
    const headers = { origin: base, 'x-vivim-control': '1' };
    const forged = await post(edit, { ...headers, origin: 'https://untrusted.invalid' });
    check('cross-origin editor cannot write', () => assert.equal(forged.status, 403));
    const saved = await post(edit, headers);
    check('same-origin bounded edit acknowledged', () => {
      assert.equal(saved.status, 200, saved.body);
      assert.equal(JSON.parse(saved.body).wikiRevision, before.revision + 1);
    });
    const stale = await post(edit, headers);
    check('stale revision refused', () => assert.equal(stale.status, 409));
    const current = JSON.parse((await get('/api/wiki')).text);
    check('Wiki reflects approved local workbench edit', () => {
      assert.equal(current.pages.Main.sections.HowTo, edit.edit.content);
      assert.equal(current.revision, before.revision + 1);
    });
    const currentState = JSON.parse((await get('/api/state')).text);
    check('chat and Wiki share revision', () => assert.equal(currentState.wikiRevision, current.revision));
    const journal = JSON.parse((await get('/api/journal')).text);
    check('one writer and no failed edit append', () => assert.deepEqual(journal.map(x => x.kind), ['chat-send', 'wiki-edit']));
    const raw = await get('/demo/journal.jsonl');
    check('demo aliases same live journal', () => {
      assert.equal(raw.status, 200);
      assert.equal(raw.text.trim().split('\n').length, journal.length);
    });
    await close();
    await start();
    const after = JSON.parse((await get('/api/wiki')).text);
    const afterChat = JSON.parse((await get('/api/state')).text);
    check('restart replays durable chat and Wiki', () => {
      assert.equal(after.pages.Main.sections.HowTo, edit.edit.content);
      assert.ok(afterChat.chat.some(m => m.text === 'open the wiki'));
      assert.equal(afterChat.wikiRevision, after.revision);
    });
    // Run the independent-format Wiki evidence script against this isolated
    // ephemeral Host. It must never touch a developer's real data directory.
    const evidence = await execFile(process.execPath,
      [path.join(ROOT, 'scripts', 'batch-evidence', 'WIKI-BASELINE.mjs'), '--live'], {
        cwd: ROOT, timeout: 20000, maxBuffer: 1024 * 1024,
        env: {
          ...process.env,
          ARBOR_WIKI_EVIDENCE_ISOLATED: '1',
          ARBOR_WIKI_EVIDENCE_BASE_URL: base
        }
      });
    const wikiReceipt = JSON.parse(evidence.stdout);
    check('A00 Wiki source/API evidence on isolated Host', () => {
      assert.equal(wikiReceipt.ok, true, JSON.stringify(wikiReceipt.checks?.filter(x => !x.pass)));
      assert.equal(wikiReceipt.browserDom, 'UNRUN');
    });
    receipt.wikiEvidence = { scope: wikiReceipt.scope, passedChecks: wikiReceipt.checks.length,
      independentKeeperAcceptance: wikiReceipt.independentKeeperAcceptance,
      exitCode: 0 };
    receipt.ok = true;
    receipt.exitCode = 0;
  } catch (error) {
    receipt.ok = false;
    receipt.exitCode = 1;
    receipt.failure = String(error?.stack || error);
  } finally {
    await close();
    rmSync(dataRoot, { recursive: true, force: true });
  }
  receipt.completedAt = new Date().toISOString();
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runHostLoopCheck();
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exitCode = result.exitCode;
}
