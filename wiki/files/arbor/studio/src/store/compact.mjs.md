# File: studio/src/store/compact.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/store/compact.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10881 B |
| Lines | 214 |
| Hash | d2c89d8a6ba0 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SegmentWriter | class | 20 | no | class SegmentWriter { |
| constructor | method | 21 | yes | constructor(dir, { segmentBytes = 64 * 1024 * 1024 } = {}) { |
| _open | method | 31 | yes | _open() { |
| _close | method | 38 | yes | _close() { |
| write | method | 45 | yes | write(rec) { |
| line | const | 46 | no | const line = JSON.stringify(rec) + &#39;\\n&#39;; |
| buf | const | 47 | no | const buf = Buffer.from(line); |
| finish | method | 56 | yes | finish(extra = {}) { |
| manifest | const | 58 | no | const manifest = { format: RAW_FORMAT, compacted: true, segments: this.segments, ...extra }; |
| p | const | 59 | no | const p = path.join(this.dir, &#39;manifest.json&#39;); |
| MERGEABLE | const | 66 | no | const MERGEABLE = new Set([&#39;chunk&#39;]); |
| compactRaw | function | 68 | yes | export async function compactRaw(srcDir, outDir, { dropKinds = [], dropBodies = false, mergeChunks = true, maxMergedBytes = 4 * 1024 * 1024, segmentBytes = 64 * 1024 * 1024, onlySids = null, dropSids… |
| dropSet | const | 72 | no | const dropSet = new Set(dropKinds); |
| onlySet | const | 73 | no | const onlySet = onlySids ? new Set(onlySids) : null; |
| dropSidSet | const | 74 | no | const dropSidSet = dropSids ? new Set(dropSids) : null; |
| w | const | 75 | no | const w = new SegmentWriter(outDir, { segmentBytes }); |
| stats | const | 76 | no | const stats = { |
| pending | variable | 80 | no | let pending = null; // { rec, parts:[Buffer], bytes, firstSeq, lastSeq, tEnd, count } |
| flush | function | 82 | no | const flush = () =&gt; { |
| merged | const | 86 | no | const merged = Buffer.concat(parts); |
| out | const | 87 | no | const out = { ...rec }; |
| mergeable | const | 104 | no | const mergeable = mergeChunks &amp;&amp; MERGEABLE.has(rec.k) &amp;&amp; rec.sid &amp;&amp; !rec.redactions?.length &amp;&amp; !rec.pre &amp;&amp; !rec.bodyDropped; |
| buf | const | 106 | no | const buf = Buffer.from(rec.b64 ?? &#39;&#39;, &#39;base64&#39;); |
| out | const | 116 | no | const out = { ...rec }; |
| srcManifest | const | 125 | no | const srcManifest = readManifest(srcDir); |
| manifest | const | 126 | no | const manifest = w.finish({ compaction: { at: new Date().toISOString(), source: path.basename(srcDir), sourceSegments: (srcManifest.segments ?? []).length, options: { dropKinds, dropBodies, mergeChun… |
| receipt | const | 135 | no | const receipt = { |
| compactSession | function | 148 | yes | export async function compactSession(session, { out = &#39;raw-compact&#39;, replace = false, ...opts } = {}) { |
| srcDir | const | 149 | no | const srcDir = path.join(session.dir, &#39;raw&#39;); |
| outDir | const | 151 | no | const outDir = path.resolve(session.dir, out); |
| sessionDir | const | 154 | no | const sessionDir = path.resolve(session.dir); |
| srcResolved | const | 155 | no | const srcResolved = path.resolve(srcDir); |
| contains | function | 156 | no | const contains = (parent, child) =&gt; { |
| rel | const | 157 | no | const rel = path.relative(parent, child); |
| receipt | const | 165 | no | const receipt = await compactRaw(srcDir, outDir, opts); |
| keep | const | 167 | no | const keep = path.join(session.dir, `raw.pre-compact-${Date.now()}`); |
| estimateCompaction | function | 183 | yes | export async function estimateCompaction(session, { dropKinds = [], mergeChunks = true } = {}) { |
| srcDir | const | 184 | no | const srcDir = path.join(session.dir, &#39;raw&#39;); |
| dropSet | const | 185 | no | const dropSet = new Set(dropKinds); |
| est | const | 186 | no | const est = { records: 0, bytes: 0, mergeableRuns: 0, mergeableRecords: 0, droppable: 0, droppableBytes: 0, byKind: {} }; |
| prevSid | variable | 187 | no | let prevSid = null, run = 0; |
| size | const | 190 | no | const size = Buffer.byteLength(JSON.stringify(rec)) + 1; |
| dirBytes | function | 207 | yes | export function dirBytes(dir) { |
| n | variable | 209 | no | let n = 0; |
| segmentFiles | export | 214 | yes | export { segmentFiles } |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 14 | external |
| node:crypto | import | 15 | external |
| node:path | import | 16 | external |
| ./raw-index.mjs | import | 17 | [studio/src/store/raw-index.mjs](./raw-index.mjs.md) |
| ./raw-log.mjs | import | 18 | [studio/src/store/raw-log.mjs](./raw-log.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/store/session.mjs](./session.mjs.md) | ./compact.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Raw-log compaction.
//
// Compaction never edits the original log in place. It writes a NEW segment set and a
// compaction.json receipt describing exactly what was changed, so the result stays auditable:
//
//   * runs of consecutive `chunk` records for the same stream are merged into one record
//     (`merged`, `seqTo`, `tEnd` keep the original seq range and timing envelope),
//   * selected record kinds can be dropped (`dropKinds`), counted in the receipt,
//   * bodies can be stripped to byte counts (`dropBodies`) for long-term metadata-only archives.
//
// Only globally adjacent records are merged, so output seq order is still strictly increasing and
// every merged record explains the seq range it stands for. Session.verify() understands `seqTo`,
// so a compacted log still verifies.
import { mkdirSync, openSync, writeSync, closeSync, fsyncSync, writeFileSync, renameSync, existsSync, statSync, readdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { iterateRaw, readManifest, buildRawIndex, segmentFiles } from './raw-index.mjs';
import { RAW_FORMAT, segmentName } from './raw-log.mjs';

class SegmentWriter {
  constructor(dir, { segmentBytes = 64 * 1024 * 1024 } = {}) {
    this.dir = dir;
    this.segmentBytes = segmentBytes;
    mkdirSync(dir, { recursive: true });
    this.segments = [];
    this.n = 0;
    this.bytes = 0;
    this.records = 0;
    this._open();
  }
  _open() {
    this.n++;
    this.file = segmentName(this.n);
    this.fd = openSync(path.join(this.dir, this.file), 'a');
    this.hash = createHash('sha256');
    this.segBytes = 0; this.segRecords = 0; this.firstSeq = null; this.lastSeq = null;
  }
  _close() {
    if (this.fd === undefined) return;
    try { fsyncSync(this.fd); } catch { /* ignore */ }
    closeSync(this.fd);
    this.fd = undefined;
    if (this.segRecords) this.segments.push({ file: this.file, bytes: this.segBytes, records: this.segRecords, firstSeq: this.firstSeq, lastSeq: this.lastSeq, sha256: this.hash.digest('hex') });
  }
  write(rec) {
    const line = JSON.stringify(rec) + '\n';
    const buf = Buffer.from(line);
    writeSync(this.fd, buf);
    this.hash.update(buf);
    this.segBytes += buf.length; this.segRecords++;
    this.bytes += buf.length; this.records++;
    if (this.firstSeq === null) this.firstSeq = rec.seq;
    this.lastSeq = rec.seqTo ?? rec.seq;
    if (this.segBytes >= this.segmentBytes) { this._close(); this._open(); }
  }
  finish(extra = {}) {
    this._close();
    const manifest = { format: RAW_FORMAT, compacted: true, segments: this.segments, ...extra };
    const p = path.join(this.dir, 'manifest.json');
    writeFileSync(p + '.tmp', JSON.stringify(manifest, null, 2));
    renameSync(p + '.tmp', p);
    return manifest;
  }
}

const MERGEABLE = new Set(['chunk']);

export async function compactRaw(srcDir, outDir, {
  dropKinds = [], dropBodies = false, mergeChunks = true, maxMergedBytes = 4 * 1024 * 1024,
  segmentBytes = 64 * 1024 * 1024, onlySids = null, dropSids = null, buildIndex = true,
} = {}) {
  const dropSet = new Set(dropKinds);
  const onlySet = onlySids ? new Set(onlySids) : null;
  const dropSidSet = dropSids ? new Set(dropSids) : null;
  const w = new SegmentWriter(outDir, { segmentBytes });
  const stats = {
    recordsIn: 0, recordsOut: 0, merged: 0, mergedRuns: 0, droppedByKind: {}, droppedBySid: 0,
    bodiesStripped: 0, bytesIn: 0, bytesOut: 0, corrupt: 0, kindsOut: {},
  };
  let pending = null; // { rec, parts:[Buffer], bytes, firstSeq, lastSeq, tEnd, count }
```

_First 80 of 215 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
