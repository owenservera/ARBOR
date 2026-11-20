# File: studio/src/store/raw-index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/store/raw-index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12031 B |
| Lines | 261 |
| Hash | 4d390a543993 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SEG_RE | const | 11 | no | const SEG_RE = /^\\d{6}\\.jsonl$/; |
| indexFileOf | function | 12 | yes | export const indexFileOf = (segFile) =&gt; segFile.replace(/\\.jsonl$/, &#39;.idx.jsonl&#39;); |
| readManifest | function | 14 | yes | export function readManifest(rawDir) { |
| p | const | 15 | no | const p = path.join(rawDir, &#39;manifest.json&#39;); |
| segmentFiles | function | 20 | yes | export function segmentFiles(rawDir) { |
| readSegmentIndex | function | 25 | yes | export function readSegmentIndex(rawDir, segFile) { |
| p | const | 26 | no | const p = path.join(rawDir, indexFileOf(segFile)); |
| out | const | 28 | no | const out = []; |
| e | const | 32 | no | const e = JSON.parse(line); |
| readStreamIndex | function | 40 | yes | export function readStreamIndex(rawDir) { |
| p | const | 41 | no | const p = path.join(rawDir, &#39;streams.json&#39;); |
| j | const | 44 | no | const j = JSON.parse(readFileSync(p, &#39;utf8&#39;)); |
| byId | const | 45 | no | const byId = new Map((j.streams ?? []).map((s) =&gt; [s.sid, s])); |
| loadRawIndex | function | 51 | yes | export function loadRawIndex(rawDir) { |
| manifest | const | 52 | no | const manifest = readManifest(rawDir); |
| bySeg | const | 53 | no | const bySeg = new Map((manifest.segments ?? []).map((s) =&gt; [s.file, s])); |
| segments | const | 54 | no | const segments = segmentFiles(rawDir).map((file) =&gt; { const p = path.join(rawDir, file); const bytes = existsSync(p) ? statSync(p).size : 0; const m = bySeg.get(file) ?? null; const entries = readSeg… |
| p | const | 55 | no | const p = path.join(rawDir, file); |
| bytes | const | 56 | no | const bytes = existsSync(p) ? statSync(p).size : 0; |
| m | const | 57 | no | const m = bySeg.get(file) ?? null; |
| entries | const | 58 | no | const entries = readSegmentIndex(rawDir, file); |
| nonEmpty | const | 67 | no | const nonEmpty = segments.filter((s) =&gt; s.bytes &gt; 0); |
| seekOffset | function | 80 | yes | export function seekOffset(entries, { fromSeq = 0 } = {}) { |
| off | variable | 84 | no | let off = 0; |
| iterateSegment | function | 92 | no | async function* iterateSegment(rawDir, file, start = 0) { |
| p | const | 93 | no | const p = path.join(rawDir, file); |
| rl | const | 95 | no | const rl = readline.createInterface({ input: createReadStream(p, start ? { start } : {}), crlfDelay: Infinity }); |
| r | variable | 98 | no | let r; |
| iterateRaw | function | 110 | yes | export async function* iterateRaw(rawDir, { fromSeq = 0, toSeq = Infinity, fromT = null, toT = null, kinds = null, sids = null, useIndex = true, includeCorrupt = true, } = {}) { |
| kindSet | const | 114 | no | const kindSet = kinds ? (kinds instanceof Set ? kinds : new Set(kinds)) : null; |
| sidSet | const | 115 | no | const sidSet = sids ? (sids instanceof Set ? sids : new Set(sids)) : null; |
| manifest | const | 116 | no | const manifest = readManifest(rawDir); |
| bySeg | const | 117 | no | const bySeg = new Map((manifest.segments ?? []).map((s) =&gt; [s.file, s])); |
| m | const | 119 | no | const m = bySeg.get(file); |
| manifestCurrent | const | 123 | no | const manifestCurrent = m &amp;&amp; Number.isSafeInteger(m.bytes) |
| start | variable | 127 | no | let start = 0; |
| entries | const | 129 | no | const entries = readSegmentIndex(rawDir, file); |
| proposed | const | 131 | no | const proposed = seekOffset(entries, { fromSeq }); |
| marker | const | 135 | no | const marker = entries.find((entry) =&gt; entry.o === proposed); |
| probe | const | 136 | no | const probe = iterateSegment(rawDir, file, proposed); |
| first | const | 138 | no | const first = await probe.next(); |
| iterateStreamRecords | function | 161 | yes | export async function* iterateStreamRecords(rawDir, sid, opts = {}) { |
| si | const | 162 | no | const si = readStreamIndex(rawDir); |
| e | const | 163 | no | const e = si?.byId?.get(sid); |
| base | const | 164 | no | const base = { ...opts, sids: [sid] }; |
| segmentLines | function | 175 | no | async function* segmentLines(file) { |
| offset | variable | 176 | no | let offset = 0; |
| rest | variable | 177 | no | let rest = Buffer.alloc(0); |
| data | const | 179 | no | const data = rest.length ? Buffer.concat([rest, chunk]) : chunk; |
| cursor | variable | 180 | no | let cursor = 0, end; |
| buildRawIndex | function | 192 | yes | export async function buildRawIndex(rawDir, { strideBytes = 64 * 1024, write = true } = {}) { |
| manifest | const | 193 | no | const manifest = readManifest(rawDir); |
| bySeg | const | 194 | no | const bySeg = new Map((manifest.segments ?? []).map((s) =&gt; [s.file, s])); |
| streams | const | 195 | no | const streams = new Map(); |
| result | const | 196 | no | const result = { segments: [], entries: 0, records: 0, streams: 0, written: write }; |
| p | const | 198 | no | const p = path.join(rawDir, file); |
| entries | const | 199 | no | const entries = []; |
| off | variable | 200 | no | let off = 0, nextAt = 0, records = 0, firstSeq = null, lastSeq = null; |
| r | variable | 203 | no | let r = null; |
| e | variable | 210 | no | let e = streams.get(r.sid); |
| ip | const | 217 | no | const ip = path.join(rawDir, indexFileOf(file)); |
| m | const | 220 | no | const m = bySeg.get(file); |
| mp | const | 229 | no | const mp = path.join(rawDir, &#39;manifest.json&#39;); |
| sp | const | 232 | no | const sp = path.join(rawDir, &#39;streams.json&#39;); |
| payload | const | 233 | no | const payload = { |
| rawStats | function | 246 | yes | export function rawStats(rawDir) { |
| idx | const | 247 | no | const idx = loadRawIndex(rawDir); |
| manifest | const | 248 | no | const manifest = readManifest(rawDir); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 7 | external |
| node:readline | import | 8 | external |
| node:path | import | 9 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/scripts/categorization-scoreboard.mjs](../../scripts/categorization-scoreboard.mjs.md) | ../src/store/raw-index.mjs |
| [studio/scripts/fidelity-survey.mjs](../../scripts/fidelity-survey.mjs.md) | ../src/store/raw-index.mjs |
| [studio/scripts/induce-vs-handmap.mjs](../../scripts/induce-vs-handmap.mjs.md) | ../src/store/raw-index.mjs |
| [studio/scripts/proto-field-search.mjs](../../scripts/proto-field-search.mjs.md) | ../src/store/raw-index.mjs |
| [studio/src/store/compact.mjs](./compact.mjs.md) | ./raw-index.mjs |
| [studio/src/store/session.mjs](./session.mjs.md) | ./raw-index.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Readers for the append-only raw log and its derived index.
//
// The index is never trusted blindly: a seek only ever starts at a record boundary recorded by
// the writer, every yielded record is still parsed from the segment itself, and a missing or
// stale index degrades to a full ordered scan. Index files can be rebuilt at any time from the
// segments (buildRawIndex), which is also how sessions recorded before indexing gain one.
import { createReadStream, existsSync, readFileSync, readdirSync, statSync, writeFileSync, renameSync } from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';

const SEG_RE = /^\d{6}\.jsonl$/;
export const indexFileOf = (segFile) => segFile.replace(/\.jsonl$/, '.idx.jsonl');

export function readManifest(rawDir) {
  const p = path.join(rawDir, 'manifest.json');
  if (!existsSync(p)) return { format: 'aion-capture-raw/1', segments: [] };
  try { const m = JSON.parse(readFileSync(p, 'utf8')); m.segments ??= []; return m; } catch { return { format: 'unknown', segments: [], unreadableManifest: true }; }
}

export function segmentFiles(rawDir) {
  if (!existsSync(rawDir)) return [];
  return readdirSync(rawDir).filter((f) => SEG_RE.test(f)).sort();
}

export function readSegmentIndex(rawDir, segFile) {
  const p = path.join(rawDir, indexFileOf(segFile));
  if (!existsSync(p)) return null;
  const out = [];
  try {
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      const e = JSON.parse(line);
      if (Number.isSafeInteger(e.s) && e.s > 0 && Number.isSafeInteger(e.o) && e.o >= 0) out.push(e);
    }
  } catch { return null; } // A torn index cannot justify skipping raw evidence.
  out.sort((a, b) => a.s - b.s);
  return out;
}

export function readStreamIndex(rawDir) {
  const p = path.join(rawDir, 'streams.json');
  if (!existsSync(p)) return null;
  try {
    const j = JSON.parse(readFileSync(p, 'utf8'));
    const byId = new Map((j.streams ?? []).map((s) => [s.sid, s]));
    return { ...j, byId };
  } catch { return null; }
}

// Full picture of what exists on disk, index included.
export function loadRawIndex(rawDir) {
  const manifest = readManifest(rawDir);
  const bySeg = new Map((manifest.segments ?? []).map((s) => [s.file, s]));
  const segments = segmentFiles(rawDir).map((file) => {
    const p = path.join(rawDir, file);
    const bytes = existsSync(p) ? statSync(p).size : 0;
    const m = bySeg.get(file) ?? null;
    const entries = readSegmentIndex(rawDir, file);
    return {
      file, bytes, inManifest: !!m, records: m?.records ?? null,
      firstSeq: m?.firstSeq ?? entries?.[0]?.s ?? null, lastSeq: m?.lastSeq ?? null,
      entries: entries ?? [], indexed: !!entries?.length,
    };
  });
  // An empty trailing segment (written when a log is closed on a boundary) carries no index
  // entries and must not make the session look unindexed.
  const nonEmpty = segments.filter((s) => s.bytes > 0);
  return {
    format: manifest.format, dir: rawDir, segments,
    indexed: nonEmpty.length > 0 && nonEmpty.every((s) => s.indexed),
    partiallyIndexed: segments.some((s) => s.indexed),
    streams: readStreamIndex(rawDir),
    totalBytes: segments.reduce((a, s) => a + s.bytes, 0),
    firstSeq: nonEmpty.map((s) => s.firstSeq).filter((x) => typeof x === 'number').sort((a, b) => a - b)[0] ?? null,
    lastSeq: nonEmpty.map((s) => s.lastSeq).filter((x) => typeof x === 'number').sort((a, b) => b - a)[0] ?? null,
  };
}

// Largest index entry whose seq/time is still at or before the requested start.
export function seekOffset(entries, { fromSeq = 0 } = {}) {
```

_First 80 of 262 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
