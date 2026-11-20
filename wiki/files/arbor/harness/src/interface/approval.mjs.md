# File: harness/src/interface/approval.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/interface/approval.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2900 B |
| Lines | 46 |
| Hash | c7473e14f90a |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| createExclusive | function | 8 | no | async function createExclusive(file, body) { |
| temp | const | 9 | no | const temp = `${file}.${process.pid}.${randomUUID()}.tmp`; |
| createApprovals | function | 14 | yes | export function createApprovals({ dir, ttlMs = 600000, now = Date.now, print = console.log }) { |
| path | function | 15 | no | const path = (id, state) =&gt; { |
| read | function | 19 | no | const read = async (id, state) =&gt; { try { return JSON.parse(await readFile(path(id, state), &#39;utf8&#39;)); } catch (e) { if (e.code === &#39;ENOENT&#39;) return null; throw e; } }; |
| text | const | 23 | no | const text = String(preview); const record = { requestId, provider, threadUrl, payloadDigest, preview: text.slice(0, 200), charCount: text.length, expiresAt: now() + ttlMs }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 1 | external |
| node:crypto | import | 2 | external |
| node:path | import | 3 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bin/wh.mjs](../../bin/wh.mjs.md) | ../src/interface/approval.mjs |
| [harness/scripts/live-smoke.mjs](../../scripts/live-smoke.mjs.md) | ../src/interface/approval.mjs |
| [harness/src/interface/router.mjs](./router.mjs.md) | ./approval.mjs |
| [harness/test/interface/attach-target.test.mjs](../../test/interface/attach-target.test.mjs.md) | ../../src/interface/approval.mjs |
| [harness/test/interface/dev-auto-approve.test.mjs](../../test/interface/dev-auto-approve.test.mjs.md) | ../../src/interface/approval.mjs |
| [harness/test/interface/interface.test.mjs](../../test/interface/interface.test.mjs.md) | ../../src/interface/approval.mjs |
| [harness/test/interface/models-router.test.mjs](../../test/interface/models-router.test.mjs.md) | ../../src/interface/approval.mjs |
| [harness/test/interface/standing.test.mjs](../../test/interface/standing.test.mjs.md) | ../../src/interface/approval.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { mkdir, readFile, writeFile, rename, unlink, link } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

// Publish a file exclusively and with complete contents. The body is written to a private temp file,
// then hard-linked to the final name, which fails with EEXIST if the name exists. A concurrent reader
// therefore never sees a partially written approval (which previously surfaced as a failed send).
async function createExclusive(file, body) {
  const temp = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temp, body, { mode: 0o600 });
  try { await link(temp, file); } finally { await unlink(temp).catch(() => {}); }
}

export function createApprovals({ dir, ttlMs = 600000, now = Date.now, print = console.log }) {
  const path = (id, state) => {
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error('Invalid requestId');
    return join(dir, `${id}.${state}.json`);
  };
  const read = async (id, state) => { try { return JSON.parse(await readFile(path(id, state), 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
  return {
    async request({ requestId, provider, threadUrl, payloadDigest, preview }) {
      await mkdir(dir, { recursive: true });
      const text = String(preview); const record = { requestId, provider, threadUrl, payloadDigest, preview: text.slice(0, 200), charCount: text.length, expiresAt: now() + ttlMs };
      await createExclusive(path(requestId, 'pending'), JSON.stringify(record));
      print(`Provider: ${provider}\nThread: ${threadUrl}\nPreview: ${record.preview}\nCharacters: ${record.charCount}`);
      return record;
    },
    pending: id => read(id, 'pending'),
    async approve(id) {
      const record = await read(id, 'pending');
      if (!record || record.expiresAt <= now()) throw new Error('Approval missing or expired');
      // Exclusive creation prevents a second grant, including concurrent CLI processes.
      await createExclusive(path(id, 'approved'), JSON.stringify({ ...record, approved: true, approvedAt: now() }));
      await unlink(path(id, 'pending')).catch(() => {});
      return record;
    },
    async consume({ requestId, payloadDigest, threadUrl }) {
      const record = await read(requestId, 'approved');
      if (!record || record.expiresAt <= now() || record.payloadDigest !== payloadDigest || record.threadUrl !== threadUrl || record.requestId !== requestId) return null;
      // Rename is not exclusive on all platforms; exclusive claim is the synchronization point.
      try { await writeFile(path(requestId, 'used'), '', { flag: 'wx', mode: 0o600 }); } catch (e) { if (e.code === 'EEXIST') return null; throw e; }
      await rename(path(requestId, 'approved'), path(requestId, 'consumed'));
      return record;
    }
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
