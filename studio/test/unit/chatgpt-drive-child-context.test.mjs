import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { createDriveTransport } from '../../bin/commands/chat.mjs';

const ROOT = path.join(os.tmpdir(), 'vivim signed-in studio root');
const THREAD = 'chatgpt-c:11111111-2222-3333-4444-555555555555';
const deadline = () => new Date(Date.now() + 30000);

test('isolated ChatGPT drive inherits exact Studio data root and CDP port, not defaults', async () => {
  let calls = 0;
  const transport = createDriveTransport({
    binPath: path.join(ROOT, 'studio.mjs'), dataDir: ROOT, port: 38702,
    isolatedThreads: true,
    exec: (exe, args) => {
      calls++;
      assert.equal(args[args.indexOf('--data-dir') + 1], ROOT);
      assert.equal(args[args.indexOf('--port') + 1], '38702');
      assert.equal(args.includes('--reuse-tab'), false);
      assert.ok(args.includes('--no-record'));
      assert.ok(args.includes('--json'));
      assert.equal(args[args.indexOf('drive') + 1], 'chatgpt');
      return {stdout: 'progress line\\n' + JSON.stringify({
        ok: true, threadRef: THREAD, reply: 'probe passed'
      })};
    }
  });
  const actual = await transport.send({threadId: 'chatgpt-new-tab', prompt: 'ping',
    requestId: 'request-1', deadline: deadline()});
  assert.equal(calls, 1);
  assert.deepEqual(actual, {effect: 'OK', threadId: THREAD,
    reply: 'probe passed', journalKey: 'request-1'});
});

test('pinned continuation retains browser target and explicit CDP settings', async () => {
  const transport = createDriveTransport({
    binPath: path.join(ROOT, 'studio.mjs'), dataDir: ROOT, port: 38702,
    isolatedThreads: true,
    exec: (exe, args) => {
      assert.equal(args[args.indexOf('drive') + 1],
        'https://chatgpt.com/c/11111111-2222-3333-4444-555555555555');
      assert.equal(args[args.indexOf('--data-dir') + 1], ROOT);
      assert.equal(args[args.indexOf('--port') + 1], '38702');
      return {stdout: JSON.stringify({ok: true, threadRef: THREAD, reply: 'second turn'})};
    }
  });
  const actual = await transport.send({threadId: THREAD, prompt: 'continue',
    requestId: 'request-2', deadline: deadline()});
  assert.equal(actual.effect, 'OK');
});

test('unverified child data root or port fails before spawning the browser driver', async () => {
  let calls = 0;
  for (const config of [{dataDir: ROOT}, {port: 38702},
    {dataDir: ROOT, port: 0}, {dataDir: 'relative', port: 38702}]) {
    const transport = createDriveTransport({binPath: 'studio.mjs',
      isolatedThreads: true, ...config, exec: () => { calls++; throw Error('must not dispatch'); }});
    const actual = await transport.send({threadId: 'chatgpt-new-tab', prompt: 'ping',
      requestId: 'request-3', deadline: deadline()});
    assert.equal(actual.effect, 'FAILED');
    assert.equal(actual.reason, 'STUDIO_DRIVE_CONTEXT_UNVERIFIED');
  }
  assert.equal(calls, 0);
});
