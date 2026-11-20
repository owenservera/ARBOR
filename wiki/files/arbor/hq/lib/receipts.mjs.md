# File: hq/lib/receipts.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/receipts.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4033 B |
| Lines | 123 |
| Hash | 5954f8e7832a |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| clampLimit | function | 9 | no | function clampLimit(value, fallback) { |
| n | const | 10 | no | const n = Number(value); |
| normalizeSources | function | 15 | no | function normalizeSources(sources) { |
| out | const | 17 | no | const out = []; |
| receiptId | function | 28 | no | function receiptId(kind, task, digest) { |
| mapReceipt | function | 32 | no | function mapReceipt(row) { |
| sources | const | 34 | no | const sources = safeJsonParse(row.sources, []); |
| getRow | function | 49 | no | function getRow(db, id) { |
| recordReceipt | function | 62 | yes | export function recordReceipt(db, receipt = {}) { |
| kind | const | 63 | no | const kind = String(receipt.kind ?? &#39;&#39;).trim(); |
| task | const | 65 | no | const task = String(receipt.task ?? &#39;&#39;); |
| project | const | 66 | no | const project = receipt.project == null ? null : String(receipt.project); |
| digest | const | 67 | no | const digest = String(receipt.digest ?? &#39;&#39;); |
| bytes | const | 68 | no | const bytes = Math.max(0, Math.trunc(Number(receipt.bytes) \|\| 0)); |
| sources | const | 69 | no | const sources = normalizeSources(receipt.sources); |
| id | const | 70 | no | const id = receiptId(kind, task, digest); |
| createdAt | const | 71 | no | const createdAt = nowISO(); |
| listReceipts | function | 98 | yes | export function listReceipts(db, options = {}) { |
| kind | const | 99 | no | const kind = options.kind == null \|\| options.kind === &#39;&#39; ? null : String(options.kind); |
| limit | const | 100 | no | const limit = clampLimit(options.limit, 20); |
| params | const | 103 | no | const params = kind ? [kind] : []; |
| rows | const | 104 | no | const rows = db.prepare(` SELECT * FROM receipts ${where} ORDER BY created_at DESC, id ASC LIMIT ?`).all(...params, limit); |
| getReceipt | function | 119 | yes | export function getReceipt(db, options = {}) { |
| id | const | 120 | no | const id = options.id == null ? &#39;&#39; : String(options.id); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./util.mjs | import | 7 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-046-prove-feature.mjs](../aii/fixtures/HQ-046-prove-feature.mjs.md) | ../../lib/receipts.mjs |
| [hq/aii/fixtures/HQ-047-completion-claims.mjs](../aii/fixtures/HQ-047-completion-claims.mjs.md) | ../../lib/receipts.mjs |
| [hq/aii/fixtures/HQ-053-fixture-evidence.mjs](../aii/fixtures/HQ-053-fixture-evidence.mjs.md) | ../../lib/receipts.mjs |
| [hq/aii/fixtures/HQ-060-tests-pass-runtime-fails.mjs](../aii/fixtures/HQ-060-tests-pass-runtime-fails.mjs.md) | ../../lib/receipts.mjs |
| [hq/aii/fixtures/HQ-118-harvesting-provenance.mjs](../aii/fixtures/HQ-118-harvesting-provenance.mjs.md) | ../../lib/receipts.mjs |
| [hq/aii/fixtures/harness.mjs](../aii/fixtures/harness.mjs.md) | ../../lib/receipts.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/receipts.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/receipts.mjs |
| [hq/lib/aii/runner.mjs](./aii/runner.mjs.md) | ../receipts.mjs |
| [hq/lib/mcp.mjs](./mcp.mjs.md) | ./receipts.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/receipts.mjs — the evidence ledger.
//
// Every context bundle, ask or brief that reads the local index records what it
// read and the digest of what it produced. A receipt id is derived from
// kind + task + digest only, so recording the same evidence twice is a no-op
// and created_at never changes an identity.
import { canonical, nowISO, safeJsonParse, sha256 } from './util.mjs';

function clampLimit(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(10_000, Math.max(0, Math.trunc(n)));
}

function normalizeSources(sources) {
  if (!Array.isArray(sources)) return [];
  const out = [];
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    out.push({
      ref: String(source.ref ?? ''),
      sha256: String(source.sha256 ?? ''),
    });
  }
  return out;
}

function receiptId(kind, task, digest) {
  return 'rcpt_' + sha256(String(kind ?? '') + '\0' + String(task ?? '') + '\0' + String(digest ?? '')).slice(0, 24);
}

function mapReceipt(row) {
  if (!row) return null;
  const sources = safeJsonParse(row.sources, []);
  return {
    id: row.id,
    kind: row.kind,
    task: row.task ?? '',
    project: row.project ?? null,
    sources: Array.isArray(sources) ? sources : [],
    digest: row.digest,
    bytes: Number(row.bytes ?? 0),
    created_at: row.created_at,
    // The CLI renders receipts with the camelCase alias; both are the same value.
    createdAt: row.created_at,
  };
}

function getRow(db, id) {
  return db.prepare('SELECT * FROM receipts WHERE id = ?').get(String(id));
}

/**
 * recordReceipt — append one evidence row, idempotently.
 *
 * @param {import('node:sqlite').DatabaseSync} db open HQ index
 * @param {{kind: string, task?: string, project?: string|null,
 *          sources?: Array<{ref: string, sha256: string}>, digest?: string,
 *          bytes?: number}} receipt
 * @returns {object} stored receipt
 */
export function recordReceipt(db, receipt = {}) {
  const kind = String(receipt.kind ?? '').trim();
  if (!kind) throw new Error('hq receipts: kind is required');
  const task = String(receipt.task ?? '');
  const project = receipt.project == null ? null : String(receipt.project);
  const digest = String(receipt.digest ?? '');
  const bytes = Math.max(0, Math.trunc(Number(receipt.bytes) || 0));
  const sources = normalizeSources(receipt.sources);
  const id = receiptId(kind, task, digest);
  const createdAt = nowISO();

  db.prepare(`
    INSERT INTO receipts(id, kind, task, project, sources, digest, bytes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `).run(
    id,
    kind,
    task,
```

_First 80 of 124 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
