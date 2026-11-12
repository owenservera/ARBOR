import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { recordArtifact, report } from '../../src/provenance/ledger.mjs';

const MARKER = 'PROVENANCE_SAMPLE_MARKER_DO_NOT_LEAK';
const sha = text => createHash('sha256').update(text, 'utf8').digest('hex');

async function setup(t) {
  const base = await mkdtemp(join(tmpdir(), 'prov-test-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const env = {
    root: join(base, 'web-harness'),
    journalDir: join(base, 'journal'),
    ledgerPath: join(base, 'catalog', 'provenance', 'ledger.jsonl'),
  };
  await mkdir(env.root, { recursive: true });
  await mkdir(env.journalDir, { recursive: true });
  return env;
}

async function writeJournal(env, requestId, patch = {}) {
  const rec = { requestId, provider: 'claude', submitted: 'yes', state: 'observed', replyDigest: 'abc', ...patch };
  await writeFile(join(env.journalDir, `${requestId}.json`), JSON.stringify(rec));
}

async function writeRepoFile(env, rel, text) {
  const abs = join(env.root, rel);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, text);
}

function recordFor(env, requestId, filePath) {
  return recordArtifact({
    ledgerPath: env.ledgerPath,
    journalDir: env.journalDir,
    requestId,
    filePath,
    root: env.root,
  });
}

function reportFor(env, scope) {
  return report({ ledgerPath: env.ledgerPath, root: env.root, scope });
}

async function expectCode(promise, code) {
  await assert.rejects(promise, err => err.code === code);
}

test('recordArtifact accepts a verified observed journal and writes metadata only', async t => {
  const env = await setup(t);
  await writeJournal(env, 'req-ok', { submitted: 'yes', state: 'observed', replyDigest: 'abc' });
  const text = `const x = "${MARKER}";\nline two\n`;
  await writeRepoFile(env, 'src/a.js', text);

  const rec = await recordFor(env, 'req-ok', 'src/a.js');

  assert.equal(rec.requestId, 'req-ok');
  assert.equal(rec.provider, 'claude');
  assert.equal(rec.replyDigest, 'abc');
  assert.equal(rec.path, 'src/a.js');
  assert.equal(rec.sha256, sha(text));
  assert.equal(rec.lines, 2);
  assert.equal(typeof rec.at, 'string');

  const ledger = await readFile(env.ledgerPath, 'utf8');
  const lines = ledger.split('\n').filter(Boolean);
  assert.equal(lines.length, 1);
  const parsed = JSON.parse(lines[0]);
  assert.equal(parsed.sha256, sha(text));
  assert.equal(parsed.lines, 2);
  assert.equal(parsed.path, 'src/a.js');
  assert.equal(parsed.replyDigest, 'abc');
  assert.ok(!ledger.includes(MARKER), 'ledger must not contain file text');
});

test('recordArtifact accepts state complete and counts lines correctly without trailing newline', async t => {
  const env = await setup(t);
  await writeJournal(env, 'req-complete', { state: 'complete' });
  await writeRepoFile(env, 'b.txt', 'a\nb');
  const rec = await recordFor(env, 'req-complete', 'b.txt');
  assert.equal(rec.lines, 2);

  await writeRepoFile(env, 'empty.txt', '');
  await writeJournal(env, 'req-empty', { state: 'observed' });
  const empty = await recordFor(env, 'req-empty', 'empty.txt');
  assert.equal(empty.lines, 0);
});

for (const [label, patch] of [
  ['submitted no', { submitted: 'no' }],
  ['submitted unknown', { submitted: 'unknown' }],
  ['state uncertain', { state: 'uncertain' }],
  ['replyDigest null', { replyDigest: null }],
  ['replyDigest empty', { replyDigest: '' }],
]) {
  test(`recordArtifact rejects unverified journal (${label})`, async t => {
    const env = await setup(t);
    await writeJournal(env, 'req-bad', patch);
    await writeRepoFile(env, 'a.txt', 'x\n');
    await expectCode(recordFor(env, 'req-bad', 'a.txt'), 'PROVENANCE_JOURNAL_UNVERIFIED');
    await assert.rejects(readFile(env.ledgerPath, 'utf8'), err => err.code === 'ENOENT');
  });
}

test('recordArtifact rejects a missing journal file', async t => {
  const env = await setup(t);
  await writeRepoFile(env, 'a.txt', 'x\n');
  await expectCode(recordFor(env, 'req-none', 'a.txt'), 'PROVENANCE_JOURNAL_UNVERIFIED');
});

test('recordArtifact rejects a requestId containing a slash', async t => {
  const env = await setup(t);
  await writeRepoFile(env, 'a.txt', 'x\n');
  await expectCode(recordFor(env, 'a/b', 'a.txt'), 'PROVENANCE_BAD_REQUEST_ID');
});

test('recordArtifact rejects a path outside root', async t => {
  const env = await setup(t);
  await writeJournal(env, 'req-esc');
  await writeFile(join(dirname(env.root), 'x'), 'outside\n');
  await expectCode(recordFor(env, 'req-esc', '../x'), 'PROVENANCE_PATH_OUTSIDE_ROOT');
});

test('recordArtifact rejects a missing file', async t => {
  const env = await setup(t);
  await writeJournal(env, 'req-missing');
  await expectCode(recordFor(env, 'req-missing', 'nope.txt'), 'PROVENANCE_FILE_MISSING');
});

test('report marks unchanged file attributed', async t => {
  const env = await setup(t);
  await writeJournal(env, 'req-1', { provider: 'chatgpt' });
  await writeRepoFile(env, 'a.txt', 'one\ntwo\n');
  await recordFor(env, 'req-1', 'a.txt');

  const r = await reportFor(env, ['a.txt']);
  assert.equal(r.files[0].status, 'attributed');
  assert.equal(r.files[0].provider, 'chatgpt');
  assert.equal(r.files[0].requestId, 'req-1');
  assert.equal(r.attributedFiles, 1);
  assert.equal(r.attributedLines, 2);
  assert.equal(r.totalFiles, 1);
  assert.equal(r.totalLines, 2);
});

test('report marks file modified after recording as modified, not attributed', async t => {
  const env = await setup(t);
  await writeJournal(env, 'req-2');
  await writeRepoFile(env, 'a.txt', 'one\n');
  await recordFor(env, 'req-2', 'a.txt');
  await writeRepoFile(env, 'a.txt', 'one\nedited\n');

  const r = await reportFor(env, ['a.txt']);
  assert.equal(r.files[0].status, 'modified');
  assert.equal(r.modifiedFiles, 1);
  assert.equal(r.attributedFiles, 0);
  assert.equal(r.attributedLines, 0);
});

test('report marks in-scope file without record as unattributed', async t => {
  const env = await setup(t);
  await writeRepoFile(env, 'c.txt', 'hand written\n');

  const r = await reportFor(env, ['c.txt']);
  assert.equal(r.files[0].status, 'unattributed');
  assert.equal(r.files[0].provider, null);
  assert.equal(r.unattributedFiles, 1);
});

test('report marks scope path absent from disk as missing with zero lines', async t => {
  const env = await setup(t);
  const r = await reportFor(env, ['gone.txt']);
  assert.equal(r.files[0].status, 'missing');
  assert.equal(r.files[0].lines, 0);
  assert.equal(r.totalLines, 0);
});

test('report percentAttributed is attributedLines / totalLines * 100 rounded to 1 decimal', async t => {
  const env = await setup(t);
  await writeJournal(env, 'req-p1');
  await writeRepoFile(env, 'a.txt', 'l1\nl2\n');
  await recordFor(env, 'req-p1', 'a.txt');
  await writeRepoFile(env, 'b.txt', 'only\n');

  const r = await reportFor(env, ['a.txt', 'b.txt']);
  assert.equal(r.attributedLines, 2);
  assert.equal(r.totalLines, 3);
  assert.equal(r.percentAttributed, Math.round((r.attributedLines / r.totalLines) * 100 * 10) / 10);
  assert.equal(r.percentAttributed, 66.7);
});

test('report with empty scope returns zero percent without dividing by zero', async t => {
  const env = await setup(t);
  const r = await reportFor(env, []);
  assert.equal(r.totalFiles, 0);
  assert.equal(r.totalLines, 0);
  assert.equal(r.percentAttributed, 0);
  assert.deepEqual(r.files, []);
});

test('report output never contains file text', async t => {
  const env = await setup(t);
  await writeJournal(env, 'req-leak');
  await writeRepoFile(env, 'secret.js', `const v = "${MARKER}";\n`);
  await recordFor(env, 'req-leak', 'secret.js');
  await writeRepoFile(env, 'other.js', `// ${MARKER}\n`);

  const r = await reportFor(env, ['secret.js', 'other.js']);
  assert.ok(!JSON.stringify(r).includes(MARKER));
});
