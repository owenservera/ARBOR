import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFiles, checkPath, runBuild, buildPrompt, prBody } from '../../src/build/build.mjs';

const reply = files => ['Summary line', ...files.flatMap(([p, c]) => [`=== FILE: ${p} ===`, 'javascript', c, '=== END FILE ===', ''])].join('\n');

test('parseFiles extracts marker blocks and strips rendered language labels', () => {
  const r = parseFiles(reply([['src/a.mjs', 'export const a = 1;'], ['test/a.test.mjs', 'x']]));
  assert.equal(r.error, null); assert.deepEqual(r.files, [{ path: 'src/a.mjs', content: 'export const a = 1;\n' }, { path: 'test/a.test.mjs', content: 'x\n' }]);
});
test('parseFiles rejects unterminated, empty, duplicate and unsafe output', () => {
  assert.equal(parseFiles('=== FILE: src/a.mjs ===\nx').error, 'UNTERMINATED_FILE');
  assert.equal(parseFiles('no files here').error, 'NO_FILES');
  assert.equal(parseFiles(reply([['src/a.mjs', '1'], ['src/a.mjs', '2']])).error, 'DUPLICATE_FILE');
  assert.match(parseFiles(reply([['../x.mjs', '1']])).error, /PATH_UNSAFE/);
});
test('checkPath keeps models out of safety gates, dotfiles and other dirs', () => {
  for (const p of ['src/core/send.mjs', 'src/interface/approval.mjs', 'src/build/build.mjs', 'harness/src/core/journal.mjs']) assert.equal(checkPath(p).reason, 'PATH_PROTECTED');
  for (const p of ['../runtime/x.json', '/etc/passwd', 'src/.env', 'src//a.mjs']) assert.equal(checkPath(p).reason, 'PATH_UNSAFE');
  assert.equal(checkPath('package.json').reason, 'PATH_NOT_ALLOWED');
  assert.equal(checkPath('src/a.sh').reason, 'PATH_TYPE');
  assert.deepEqual(checkPath('./src/core/tabs.mjs'), { ok: true, path: 'src/core/tabs.mjs' });
});

function fakeDeps(replies, testResults) {
  const calls = { asks: [], written: [], restores: 0, commits: [], prs: [] };
  return { calls, deps: {
    async ask(a) { calls.asks.push(a); const r = replies.shift(); return { requestId: `r${calls.asks.length}`, provider: 'claude', model: 'opus-5.5', threadUrl: 'https://claude.ai/chat/t1', ...r }; },
    async writeFiles(f) { calls.written.push(f.map(x => x.path)); }, async restore() { calls.restores++; },
    async runTests() { return testResults.shift(); }, async commit(c) { calls.commits.push(c); }, async openPr(p) { calls.prs.push(p); return 'https://pr/1'; },
  } };
}
const good = reply([['src/a.mjs', 'ok'], ['test/a.test.mjs', 't']]);

test('green on first send: commit + PR with provenance', async () => {
  const { calls, deps } = fakeDeps([{ status: 'complete', reply: good }], [{ ok: true, summary: '10/10 pass' }]);
  const r = await runBuild({ task: 'add a', deps });
  assert.equal(r.ok, true); assert.equal(calls.asks.length, 1); assert.equal(calls.asks[0].threadUrl, 'new'); assert.equal(calls.commits.length, 1);
  assert.match(calls.prs[0].body, /claude:opus-5\.5/); assert.match(calls.prs[0].body, /claude\.ai\/chat\/t1/); assert.match(calls.prs[0].body, /10\/10 pass/);
});
test('failing tests are fed back in the same thread, at most 3 sends, never kept', async () => {
  const { calls, deps } = fakeDeps([0, 1, 2].map(() => ({ status: 'complete', reply: good })), [0, 1, 2].map(() => ({ ok: false, output: 'not ok 1 - boom' })));
  const r = await runBuild({ task: 'add a', deps });
  assert.equal(r.ok, false); assert.equal(r.reason, 'RETRIES_EXHAUSTED'); assert.equal(calls.asks.length, 3); assert.equal(calls.commits.length, 0);
  assert.equal(calls.asks[1].threadUrl, 'https://claude.ai/chat/t1'); assert.match(calls.asks[1].prompt, /boom/); assert.equal(calls.asks[1].first, false);
});
test('uncertain send stops immediately with no resend', async () => {
  const { calls, deps } = fakeDeps([{ status: 'uncertain' }], []);
  const r = await runBuild({ task: 'x', deps }); assert.equal(r.reason, 'SEND_UNCERTAIN'); assert.equal(calls.asks.length, 1); assert.equal(calls.written.length, 0);
});
test('unparseable reply triggers a format retry, then success', async () => {
  const { calls, deps } = fakeDeps([{ status: 'complete', reply: 'sorry' }, { status: 'complete', reply: good }], [{ ok: true }]);
  const r = await runBuild({ task: 'x', deps }); assert.equal(r.ok, true); assert.match(calls.asks[1].prompt, /NO_FILES/);
});
test('prompt states the protocol and the protected files', () => {
  const p = buildPrompt({ task: 'T', context: [{ path: 'src/x.mjs', content: 'code' }] });
  assert.match(p, /=== FILE: /); assert.match(p, /src\/core\/send\.mjs/); assert.match(p, /existing file src\/x\.mjs/);
  assert.match(prBody({ task: 't', provider: 'p', model: 'm', threadUrl: 'u', sends: ['a'], files: [{ path: 'src/a.mjs', sha256: 'h', lines: 1 }] }), /`p:m`/);
});
test('readThreadReply reads one exact tab and never types or submits', async () => {
  const { readThreadReply } = await import('../../src/build/cli.mjs');
  const calls = []; const page = { evaluate: async () => ({ text: 'done', streaming: false, count: 1 }), insertText: async () => calls.push('type'), pressEnter: async () => calls.push('submit') };
  const browser = tabs => ({ targets: async () => tabs, attach: async id => { calls.push(`attach:${id}`); return page; } });
  const u = 'https://claude.ai/chat/x';
  const r = await readThreadReply({ providerId: 'claude', threadUrl: u, timeoutMs: 5000, connectFn: async () => browser([{ id: 'A', type: 'page', url: u }, { id: 'B', type: 'page', url: 'https://claude.ai/new' }]), target: { host: '127.0.0.1', port: 9234 } });
  assert.equal(r.text, 'done'); assert.equal(r.complete, true); assert.deepEqual(calls, ['attach:A']);
  await assert.rejects(readThreadReply({ providerId: 'claude', threadUrl: u, connectFn: async () => browser([]), target: {} }), /EXACT_TARGET_REQUIRED/);
});
test('failureSummary keeps failing tests and errors, drops the passing list', async () => {
  const { failureSummary } = await import('../../src/build/build.mjs');
  const out = ['✔ a passes', '✔ b passes', '✖ c fails (1ms)', "  AssertionError [ERR_ASSERTION]: Expected values", "  actual: 1", '✔ d passes'].join('\n');
  const s = failureSummary(out); assert.match(s, /c fails/); assert.match(s, /ERR_ASSERTION/); assert.doesNotMatch(s, /a passes/);
  assert.match(buildPrompt({ task: 'x' }), /inside the code block/);
});
test('build test runs do not inherit the live WH_* browser target', async () => {
  const { testEnv } = await import('../../src/build/cli.mjs');
  assert.deepEqual(testEnv({ PATH: '/bin', WH_CDP_PORT: '9234', WH_ATTACH_PROFILE: '/p', WH_DRIVER: 'x' }), { PATH: '/bin' });
});
