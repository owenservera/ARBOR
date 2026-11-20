# File: studio/src/store/raw-log.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/store/raw-log.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11310 B |
| Lines | 233 |
| Hash | acc7d33fc483 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| pad | function | 22 | no | const pad = (n) =&gt; String(n).padStart(6, &#39;0&#39;); |
| RAW_FORMAT | const | 23 | yes | export const RAW_FORMAT = &#39;aion-capture-raw/2&#39;; |
| segmentName | function | 24 | yes | export const segmentName = (n) =&gt; `${pad(n)}.jsonl`; |
| indexName | function | 25 | yes | export const indexName = (segFile) =&gt; segFile.replace(/\\.jsonl$/, &#39;.idx.jsonl&#39;); |
| RawLog | class | 27 | yes | export class RawLog extends EventEmitter { |
| constructor | method | 28 | yes | constructor(dir, { segmentBytes = 64 * 1024 * 1024, maxQueueBytes = 128 * 1024 * 1024, flushIntervalMs = 50, fsyncIntervalMs = 1000, writeDelayMs = 0, index = true, indexStrideBytes = 64 * 1024, maxI… |
| _loadManifest | method | 57 | yes | _loadManifest() { |
| p | const | 58 | no | const p = path.join(this.dir, &#39;manifest.json&#39;); |
| m | const | 60 | no | const m = JSON.parse(readFileSync(p, &#39;utf8&#39;)); |
| _saveManifest | method | 68 | yes | _saveManifest() { |
| p | const | 69 | no | const p = path.join(this.dir, &#39;manifest.json&#39;); |
| _saveStreamIndex | method | 76 | yes | _saveStreamIndex() { |
| p | const | 78 | no | const p = path.join(this.dir, &#39;streams.json&#39;); |
| payload | const | 79 | no | const payload = { |
| _openSegment | method | 87 | yes | _openSegment(n) { |
| _closeSegment | method | 103 | yes | _closeSegment(final = false) { |
| entry | const | 110 | no | const entry = { |
| _indexRecord | method | 121 | yes | _indexRecord(r, off) { |
| e | variable | 124 | no | let e = this.streamIndex.get(r.sid); |
| append | method | 141 | yes | append(rec) { |
| seq | const | 143 | no | const seq = ++this.seq; |
| t | const | 144 | no | const t = Date.now(); |
| line | const | 146 | no | const line = JSON.stringify({ ...rec, seq, t }) + &#39;\\n&#39;; |
| bytes | const | 147 | no | const bytes = Buffer.byteLength(line); |
| _emitGapIfAny | method | 165 | yes | _emitGapIfAny() { |
| d | const | 167 | no | const d = this.dropped; |
| flush | method | 173 | yes | flush() { |
| limit | const | 182 | no | const limit = this.writeDelayMs &amp;&amp; !this.closing ? 16 * 1024 : 4 * 1024 * 1024; |
| batch | variable | 184 | no | let batch = [], batchBytes = 0; |
| buf | const | 187 | no | const buf = Buffer.from(batch.map((r) =&gt; r.line).join(&#39;&#39;)); |
| off | variable | 190 | no | let off = this.segBytes; |
| _fsync | method | 206 | yes | _fsync() { if (this.fd !== undefined) { try { fsyncSync(this.fd); } catch { /* ignore */ } } } |
| locate | method | 211 | yes | locate(sid) { const e = this.streamIndex.get(sid); return e ? { ...e, segments: [...e.segments] } : null; } |
| locators | method | 212 | yes | locators() { return [...this.streamIndex.values()].map((e) =&gt; ({ ...e, segments: [...e.segments] })); } |
| close | method | 214 | yes | async close() { |
| _gapLine | method | 227 | yes | _gapLine(d) { |
| seq | const | 228 | no | const seq = ++this.seq; |
| t | const | 229 | no | const t = Date.now(); |
| line | const | 230 | no | const line = JSON.stringify({ seq, t, k: &#39;gap&#39;, reason: &#39;local_queue_overflow&#39;, droppedRecords: d.records, droppedBytes: d.bytes, droppedSeqFrom: d.firstSeq, droppedSeqTo: d.lastSeq, sids: [...d.sids… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 17 | external |
| node:fs | import | 18 | external |
| node:events | import | 19 | external |
| node:path | import | 20 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/store/compact.mjs](./compact.mjs.md) | ./raw-log.mjs |
| [studio/src/store/session.mjs](./session.mjs.md) | ./raw-log.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Append-only, segmented raw event log with bounded memory, explicit gap records and a
// side-car index that makes later reads seekable.
//
// Chrome cannot be slowed down by us, so true backpressure is impossible at the source.
// Instead: records are queued in memory up to `maxQueueBytes`; if the disk falls behind,
// further records are DROPPED and a `gap` record (with counts, bytes and affected stream ids)
// is written as soon as space frees. Nothing is ever silently lost or silently truncated.
//
// Durable layout under <session>/raw/:
//   manifest.json      segments with byte counts, seq ranges and sha256
//   NNNNNN.jsonl       append-only records, one JSON object per line
//   NNNNNN.idx.jsonl   sparse seek index: {s: seq, o: byteOffset, t: wallTime}
//   streams.json       per-stream locator: first/last seq, record counts, bytes, segments
//
// The index is strictly derived data: it can always be rebuilt from the segments
// (see store/raw-index.mjs buildIndex) and its absence never blocks a read.
import { createHash } from 'node:crypto';
import { mkdirSync, openSync, writeSync, fsyncSync, closeSync, writeFileSync, readFileSync, existsSync, renameSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import path from 'node:path';

const pad = (n) => String(n).padStart(6, '0');
export const RAW_FORMAT = 'aion-capture-raw/2';
export const segmentName = (n) => `${pad(n)}.jsonl`;
export const indexName = (segFile) => segFile.replace(/\.jsonl$/, '.idx.jsonl');

export class RawLog extends EventEmitter {
  constructor(dir, {
    segmentBytes = 64 * 1024 * 1024, maxQueueBytes = 128 * 1024 * 1024, flushIntervalMs = 50,
    fsyncIntervalMs = 1000, writeDelayMs = 0, index = true, indexStrideBytes = 64 * 1024,
    maxIndexedStreams = 50_000,
  } = {}) {
    super();
    this.dir = dir;
    mkdirSync(dir, { recursive: true });
    this.segmentBytes = segmentBytes;
    this.maxQueueBytes = maxQueueBytes;
    this.writeDelayMs = writeDelayMs; // test hook: simulate a slow disk
    this.indexEnabled = index !== false;
    this.indexStrideBytes = Math.max(1, indexStrideBytes);
    this.maxIndexedStreams = maxIndexedStreams;
    this.seq = 0;
    this.queue = [];
    this.queueBytes = 0;
    this.dropped = null; // { records, bytes, sids:Set, firstSeq, lastSeq, since }
    this.manifest = this._loadManifest();
    this.stats = { records: 0, bytes: 0, droppedRecords: 0, droppedBytes: 0, gaps: 0, maxQueueBytesSeen: 0, indexEntries: 0, kinds: {} };
    this.streamIndex = new Map();   // sid -> { sid, firstSeq, lastSeq, records, bytes, firstT, lastT, segments:[] }
    this.streamIndexTruncated = false;
    this.closed = false;
    this._openSegment(this.manifest.segments.length + 1);
    this.flushTimer = setInterval(() => this.flush(), flushIntervalMs);
    this.fsyncTimer = setInterval(() => this._fsync(), fsyncIntervalMs);
    this.flushTimer.unref?.(); this.fsyncTimer.unref?.();
  }

  _loadManifest() {
    const p = path.join(this.dir, 'manifest.json');
    if (existsSync(p)) {
      const m = JSON.parse(readFileSync(p, 'utf8'));
      m.format ??= RAW_FORMAT;
      m.segments ??= [];
      return m;
    }
    return { format: RAW_FORMAT, segments: [] };
  }

  _saveManifest() {
    const p = path.join(this.dir, 'manifest.json');
    this.manifest.format = RAW_FORMAT;
    this.manifest.index = { enabled: this.indexEnabled, strideBytes: this.indexStrideBytes, entries: this.stats.indexEntries };
    writeFileSync(p + '.tmp', JSON.stringify(this.manifest, null, 2));
    renameSync(p + '.tmp', p);
  }

  _saveStreamIndex() {
    if (!this.indexEnabled) return;
    const p = path.join(this.dir, 'streams.json');
    const payload = {
      format: 'aion-capture-raw-streams/1', savedAt: new Date().toISOString(),
```

_First 80 of 234 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
