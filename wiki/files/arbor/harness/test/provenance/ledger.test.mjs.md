# File: harness/test/provenance/ledger.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/provenance/ledger.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8262 B |
| Lines | 215 |
| Hash | 02bec3eac764 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MARKER | const | 9 | no | const MARKER = &#39;PROVENANCE_SAMPLE_MARKER_DO_NOT_LEAK&#39;; |
| sha | function | 10 | no | const sha = text =&gt; createHash(&#39;sha256&#39;).update(text, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| setup | function | 12 | no | async function setup(t) { |
| base | const | 13 | no | const base = await mkdtemp(join(tmpdir(), &#39;prov-test-&#39;)); |
| env | const | 15 | no | const env = { |
| writeJournal | function | 25 | no | async function writeJournal(env, requestId, patch = {}) { |
| rec | const | 26 | no | const rec = { requestId, provider: &#39;claude&#39;, submitted: &#39;yes&#39;, state: &#39;observed&#39;, replyDigest: &#39;abc&#39;, ...patch }; |
| writeRepoFile | function | 30 | no | async function writeRepoFile(env, rel, text) { |
| abs | const | 31 | no | const abs = join(env.root, rel); |
| recordFor | function | 36 | no | function recordFor(env, requestId, filePath) { |
| reportFor | function | 46 | no | function reportFor(env, scope) { |
| expectCode | function | 50 | no | async function expectCode(promise, code) { |
| env | const | 55 | no | const env = await setup(t); |
| text | const | 57 | no | const text = `const x = &quot;${MARKER}&quot;;\\nline two\\n`; |
| rec | const | 60 | no | const rec = await recordFor(env, &#39;req-ok&#39;, &#39;src/a.js&#39;); |
| ledger | const | 70 | no | const ledger = await readFile(env.ledgerPath, &#39;utf8&#39;); |
| lines | const | 71 | no | const lines = ledger.split(&#39;\\n&#39;).filter(Boolean); |
| parsed | const | 73 | no | const parsed = JSON.parse(lines[0]); |
| env | const | 82 | no | const env = await setup(t); |
| rec | const | 85 | no | const rec = await recordFor(env, &#39;req-complete&#39;, &#39;b.txt&#39;); |
| empty | const | 90 | no | const empty = await recordFor(env, &#39;req-empty&#39;, &#39;empty.txt&#39;); |
| env | const | 102 | no | const env = await setup(t); |
| env | const | 111 | no | const env = await setup(t); |
| env | const | 117 | no | const env = await setup(t); |
| env | const | 123 | no | const env = await setup(t); |
| env | const | 130 | no | const env = await setup(t); |
| env | const | 136 | no | const env = await setup(t); |
| r | const | 141 | no | const r = await reportFor(env, [&#39;a.txt&#39;]); |
| env | const | 152 | no | const env = await setup(t); |
| r | const | 158 | no | const r = await reportFor(env, [&#39;a.txt&#39;]); |
| env | const | 166 | no | const env = await setup(t); |
| r | const | 169 | no | const r = await reportFor(env, [&#39;c.txt&#39;]); |
| env | const | 176 | no | const env = await setup(t); |
| r | const | 177 | no | const r = await reportFor(env, [&#39;gone.txt&#39;]); |
| env | const | 184 | no | const env = await setup(t); |
| r | const | 190 | no | const r = await reportFor(env, [&#39;a.txt&#39;, &#39;b.txt&#39;]); |
| env | const | 198 | no | const env = await setup(t); |
| r | const | 199 | no | const r = await reportFor(env, []); |
| env | const | 207 | no | const env = await setup(t); |
| r | const | 213 | no | const r = await reportFor(env, [&#39;secret.js&#39;, &#39;other.js&#39;]); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:crypto | import | 3 | external |
| node:fs/promises | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| ../../src/provenance/ledger.mjs | import | 7 | [harness/src/provenance/ledger.mjs](../../src/provenance/ledger.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 216 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
