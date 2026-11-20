# File: harness/test/dev/workspace.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/dev/workspace.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4023 B |
| Lines | 54 |
| Hash | 41a2a7c26ca6 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sha | function | 9 | no | const sha = s =&gt; createHash(&#39;sha256&#39;).update(s).digest(&#39;hex&#39;); |
| fixture | function | 10 | no | async function fixture(fn) { |
| root | const | 11 | no | const root = await mkdtemp(join(tmpdir(), &#39;vivim-dev-&#39;)); |
| roots | const | 29 | no | const roots = await w.list(); assert(roots.entries.length &gt;= 4); |
| tree | const | 30 | no | const tree = await w.list({path:&#39;harness/src&#39;}); assert(tree.entries.some(e =&gt; e.path===&#39;harness/src/demo.mjs&#39;)); |
| r | const | 31 | no | const r = await w.read(&#39;harness/src/demo.mjs&#39;); |
| search | const | 34 | no | const search = await w.search({ query:&#39;answer&#39;,path:&#39;harness/src/&#39; }); |
| r | const | 40 | no | const r = await w.edit({path:&#39;harness/src/demo.mjs&#39;,expectedSha256:sha(&#39;export const answer = 1;\\n&#39;),find:&#39;answer = 1&#39;,replace:&#39;answer = 2&#39;}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:crypto | import | 6 | external |
| ../../src/dev/workspace.mjs | import | 7 | [harness/src/dev/workspace.mjs](../../src/dev/workspace.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createWorkspace, safePath } from '../../src/dev/workspace.mjs';

const sha = s => createHash('sha256').update(s).digest('hex');
async function fixture(fn) {
  const root = await mkdtemp(join(tmpdir(), 'vivim-dev-'));
  try {
    await mkdir(join(root, 'harness/src'), { recursive: true });
    await mkdir(join(root, 'harness/test'), { recursive: true });
    await mkdir(join(root, 'studio/src'), { recursive: true });
    await writeFile(join(root, 'harness/src/demo.mjs'), 'export const answer = 1;\n');
    await writeFile(join(root, 'studio/src/sample.mjs'), 'export const studio = 1;\n');
    await writeFile(join(root, 'harness/src/send.mjs'), 'export const send = 1;\n');
    await fn(root, createWorkspace({ root }));
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('path policy refuses traversal, hidden state, runtime, secrets, protected files and dev self-modification', () => {
  for (const p of ['/tmp/a.mjs','../harness/src/a.mjs','harness/../studio/src/a.mjs','harness/src/.env','runtime/key.mjs', 'harness/src/x\\file.mjs', 'harness/src/a.txt', 'harness/src/node_modules/b.mjs']) assert.throws(() => safePath(p), /Path|Unsafe/);
  for (const p of ['harness/src/core/send.mjs','harness/src/interface/approval.mjs','harness/src/dev/agent.mjs']) assert.throws(() => safePath(p, { write: true }), /Protected/);
  assert.equal(safePath('apps/mobile-relay/app.js',{write:true}),'apps/mobile-relay/app.js');
});
test('list/read/search expose scoped data with hash and line numbers', async () => fixture(async (_root, w) => {
  const roots = await w.list(); assert(roots.entries.length >= 4);
  const tree = await w.list({path:'harness/src'}); assert(tree.entries.some(e => e.path==='harness/src/demo.mjs'));
  const r = await w.read('harness/src/demo.mjs');
  assert.equal(r.sha256, sha('export const answer = 1;\n'));
  assert.equal(r.lines[0].line, 1); assert.match(r.lines[0].text,/answer/);
  const search = await w.search({ query:'answer',path:'harness/src/' });
  assert.equal(search.matches[0].path,'harness/src/demo.mjs');
  await assert.rejects(w.search({query:'const',path:'runtime/'}),/approved/);
}));
test('edit is exact-occurrence and SHA-pinned; create never overwrites', async () => fixture(async (root, w) => {
  await assert.rejects(w.edit({path:'harness/src/demo.mjs',expectedSha256:sha('wrong'),find:'answer',replace:'new'}),/changed/);
  const r = await w.edit({path:'harness/src/demo.mjs',expectedSha256:sha('export const answer = 1;\n'),find:'answer = 1',replace:'answer = 2'});
  assert.equal(r.afterSha256,sha('export const answer = 2;\n'));
  assert.equal(await readFile(join(root,'harness/src/demo.mjs'),'utf8'),'export const answer = 2;\n');
  await assert.rejects(w.edit({path:'harness/src/demo.mjs',expectedSha256:r.afterSha256,find:'e',replace:'x'}),/exactly once/);
  await w.create({path:'harness/test/new.test.mjs',content:'import assert from "node:assert/strict";\n'});
  await assert.rejects(w.create({path:'harness/test/new.test.mjs',content:'bad'}),/EEXIST/);
}));
test('symlinked files and directories blocked', async (t) => fixture(async (root,w) => {
  // Creating symlinks on Windows needs Developer Mode or elevation. Skip with a reason rather than fail.
  try { await symlink(join(root,'harness/src/demo.mjs'),join(root,'harness/src/link.mjs')); }
  catch (e) { if (e.code === 'EPERM') return t.skip('symlink creation needs Windows Developer Mode or elevation (EPERM)'); throw e; }
  await assert.rejects(w.read('harness/src/link.mjs'),/Symlinks/);
  await symlink(join(root,'studio/src'),join(root,'harness/src/linked'),'dir');
  await assert.rejects(w.read('harness/src/linked/sample.mjs'),/Symlinks/);
}));
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
