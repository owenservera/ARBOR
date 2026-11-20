# File: studio/src/store/session.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/store/session.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18913 B |
| Lines | 343 |
| Hash | f3245e0999e2 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KeyValueStore | class | 18 | yes | export class KeyValueStore { |
| constructor | method | 19 | yes | constructor(dir) { this.dir = dir; mkdirSync(dir, { recursive: true }); this._chains = new Map(); } |
| _p | method | 20 | yes | _p(key) { |
| set | method | 24 | yes | set(key, value) { |
| p | const | 25 | no | const p = this._p(key); |
| data | const | 26 | no | const data = typeof value === &#39;string&#39; \|\| Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2); |
| setAsync | method | 35 | yes | setAsync(key, value) { |
| p | const | 36 | no | const p = this._p(key); |
| data | const | 37 | no | const data = typeof value === &#39;string&#39; \|\| Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2); |
| tmp | const | 38 | no | const tmp = `${p}.${randomBytes(4).toString(&#39;hex&#39;)}.tmp`; |
| prev | const | 39 | no | const prev = this._chains.get(p) ?? null; |
| run | function | 40 | no | const run = (async () =&gt; { if (prev) await prev; try { await fsp.writeFile(tmp, data); await fsp.rename(tmp, p); } catch (e) { await fsp.rm(tmp, { force: true }).catch(() =&gt; {}); throw e; } })(); |
| tail | const | 45 | no | const tail = run.then(() =&gt; {}, () =&gt; {}).then(() =&gt; { if (this._chains.get(p) === tail) this._chains.delete(p); }); |
| drain | method | 50 | yes | async drain() { while (this._chains.size) await Promise.all([...this._chains.values()]); } |
| get | method | 51 | yes | get(key, fallback = undefined) { |
| p | const | 52 | no | const p = this._p(key); |
| raw | const | 54 | no | const raw = readFileSync(p, &#39;utf8&#39;); |
| has | method | 57 | yes | has(key) { return existsSync(this._p(key)); } |
| remove | method | 58 | yes | remove(key) { const p = this._p(key); if (existsSync(p)) { rmSync(p); return true; } return false; } |
| stat | method | 59 | yes | stat(key) { const p = this._p(key); return existsSync(p) ? { key, bytes: statSync(p).size, modified: statSync(p).mtimeMs } : null; } |
| keys | method | 60 | yes | keys() { return readdirSync(this.dir).filter((f) =&gt; !f.endsWith(&#39;.tmp&#39;)); } |
| DATASET_FLUSH_BYTES | const | 68 | no | const DATASET_FLUSH_BYTES = 256 * 1024; |
| DATASET_FLUSH_MS | const | 69 | no | const DATASET_FLUSH_MS = 250; |
| pendingDatasets | const | 70 | no | const pendingDatasets = new Set(); |
| exitHookInstalled | variable | 71 | no | let exitHookInstalled = false; |
| flushPendingDatasets | function | 73 | yes | export function flushPendingDatasets(match = null) { |
| Dataset | class | 77 | yes | export class Dataset { |
| constructor | method | 78 | yes | constructor(file, { buffered = false, flushBytes = DATASET_FLUSH_BYTES, flushMs = DATASET_FLUSH_MS } = {}) { |
| push | method | 85 | yes | push(items) { |
| arr | const | 86 | no | const arr = Array.isArray(items) ? items : [items]; |
| text | const | 88 | no | const text = arr.map((i) =&gt; JSON.stringify(i)).join(&#39;\\n&#39;) + &#39;\\n&#39;; |
| flush | method | 98 | yes | flush() { |
| text | const | 101 | no | const text = this._buf.length === 1 ? this._buf[0] : this._buf.join(&#39;&#39;); |
| close | method | 106 | yes | close() { this.flush(); } |
| reset | method | 107 | yes | reset() { this._buf = []; this._bufBytes = 0; pendingDatasets.delete(this); if (this._timer) { clearTimeout(this._timer); this._timer = null; } if (existsSync(this.file)) rmSync(this.file); this.coun… |
| exists | method | 108 | yes | exists() { this.flush(); return existsSync(this.file); } |
| bytes | method | 109 | yes | bytes() { this.flush(); return existsSync(this.file) ? statSync(this.file).size : 0; } |
| rl | const | 113 | no | const rl = readline.createInterface({ input: createReadStream(this.file), crlfDelay: Infinity }); |
| i | variable | 114 | no | let i = 0, yielded = 0; |
| v | variable | 118 | no | let v; try { v = JSON.parse(line); } catch { continue; } |
| toArray | method | 124 | yes | async toArray(limit = Infinity) { const out = []; for await (const i of this.iterate()) { out.push(i); if (out.length &gt;= limit) break; } return out; } |
| size | method | 125 | yes | async size() { let n = 0; for await (const _ of this.iterate()) n++; return n; } // eslint-disable-line no-unused-vars |
| tail | method | 127 | yes | async tail(n = 50) { |
| ring | const | 129 | no | const ring = new Array(n); |
| i | variable | 130 | no | let i = 0; |
| newSessionId | function | 137 | yes | export function newSessionId(site = &#39;site&#39;) { |
| d | const | 138 | no | const d = new Date(); |
| ts | const | 139 | no | const ts = d.toISOString().replace(/[-:]/g, &#39;&#39;).replace(&#39;T&#39;, &#39;-&#39;).slice(0, 15); |
| slug | const | 140 | no | const slug = String(site).toLowerCase().replace(/[^a-z0-9]+/g, &#39;-&#39;).replace(/^-\|-$/g, &#39;&#39;).slice(0, 40) \|\| &#39;site&#39;; |
| Session | class | 144 | yes | export class Session { |
| create | method | 145 | yes | static create(sessionsDir, { site, meta = {}, rawOptions = {} } = {}) { |
| id | const | 146 | no | const id = newSessionId(site); |
| dir | const | 147 | no | const dir = path.join(sessionsDir, id); |
| s | const | 149 | no | const s = new Session(dir); |
| open | method | 156 | yes | static open(sessionsDir, idOrPrefix) { |
| dir | const | 157 | no | const dir = resolveSessionDir(sessionsDir, idOrPrefix); |
| constructor | method | 161 | yes | constructor(dir) { |
| mp | const | 164 | no | const mp = path.join(dir, &#39;session.json&#39;); |
| dataset | method | 171 | yes | dataset(name) { return new Dataset(path.join(this.dir, &#39;datasets&#39;, `${name}.jsonl`), { buffered: name === &#39;events&#39; }); } |
| flushDatasets | method | 173 | yes | flushDatasets() { const prefix = path.join(this.dir, &#39;datasets&#39;); flushPendingDatasets((f) =&gt; f.startsWith(prefix)); } |
| datasets | method | 174 | yes | datasets() { |
| d | const | 176 | no | const d = path.join(this.dir, &#39;datasets&#39;); |
| saveMeta | method | 180 | yes | saveMeta() { this.flushDatasets(); const p = path.join(this.dir, &#39;session.json&#39;); writeFileSync(p + &#39;.tmp&#39;, JSON.stringify(this.meta, null, 2)); renameSync(p + &#39;.tmp&#39;, p); } |
| rawIndex | method | 197 | yes | rawIndex() { return loadRawIndex(this.rawDir); } |
| rawStats | method | 198 | yes | rawStats() { return rawStats(this.rawDir); } |
| streamIndex | method | 199 | yes | streamIndex() { return readStreamIndex(this.rawDir); } |
| manifest | method | 200 | yes | manifest() { return readManifest(this.rawDir); } |
| segments | method | 201 | yes | segments() { return segmentFiles(this.rawDir); } |
| reindex | method | 202 | yes | async reindex(opts = {}) { return buildRawIndex(this.rawDir, { write: true, ...opts }); } |
| ensureIndex | method | 203 | yes | async ensureIndex(opts = {}) { |
| idx | const | 204 | no | const idx = loadRawIndex(this.rawDir); |
| compact | method | 210 | yes | async compact(opts = {}) { return compactSession(this, opts); } |
| compactionEstimate | method | 211 | yes | async compactionEstimate(opts = {}) { return estimateCompaction(this, opts); } |
| bytes | method | 213 | yes | bytes() { |
| verify | method | 225 | yes | async verify() { |
| rawDir | const | 227 | no | const rawDir = this.rawDir; |
| manifestPath | const | 228 | no | const manifestPath = path.join(rawDir, &#39;manifest.json&#39;); |
| hasManifest | const | 229 | no | const hasManifest = existsSync(manifestPath); |
| manifest | const | 230 | no | const manifest = hasManifest ? JSON.parse(readFileSync(manifestPath, &#39;utf8&#39;)) : { segments: [] }; |
| bySeg | const | 231 | no | const bySeg = new Map((manifest.segments ?? []).map((s) =&gt; [s.file, s])); |
| files | const | 232 | no | const files = existsSync(rawDir) ? readdirSync(rawDir).filter((f) =&gt; /^\\d{6}\\.jsonl$/.test(f)).sort() : []; |
| report | const | 233 | no | const report = { segments: [], ok: hasManifest &amp;&amp; Array.isArray(manifest.segments), seqGaps: [], gapRecords: 0, droppedRecords: 0, records: 0, mergedRecords: 0, compacted: !!manifest.compacted }; |
| present | const | 234 | no | const present = new Set(files); |
| lastSeq | variable | 239 | no | let lastSeq = 0; |
| p | const | 241 | no | const p = path.join(rawDir, f); |
| buf | const | 242 | no | const buf = readFileSync(p); |
| sha | const | 243 | no | const sha = createHash(&#39;sha256&#39;).update(buf).digest(&#39;hex&#39;); |
| m | const | 244 | no | const m = bySeg.get(f); |
| entry | const | 245 | no | const entry = { file: f, bytes: buf.length, inManifest: !!m, shaMatches: m ? m.sha256 === sha : null, torn: buf.length &gt; 0 &amp;&amp; buf[buf.length - 1] !== 0x0a }; |
| ranges | const | 250 | no | const ranges = []; |
| unexplained | const | 265 | no | const unexplained = report.seqGaps.filter((g) =&gt; !ranges.some(([a, b]) =&gt; a &lt;= g.from &amp;&amp; g.to &lt;= b)); |
| SESSION_LIST_CACHE_MAX | const | 275 | no | const SESSION_LIST_CACHE_MAX = 2000; |
| sessionListCache | const | 276 | no | const sessionListCache = new Map(); |
| sessionListHits | variable | 277 | no | let sessionListHits = 0; |
| sessionListMisses | variable | 278 | no | let sessionListMisses = 0; |
| sessionListCacheStats | function | 281 | yes | export function sessionListCacheStats() { |
| rememberSessionMeta | function | 285 | no | function rememberSessionMeta(key, stat, meta) { |
| oldest | const | 290 | no | const oldest = sessionListCache.keys().next().value; |
| listSessions | function | 296 | yes | export function listSessions(sessionsDir, { includeRawBytes = true } = {}) { |
| out | const | 298 | no | const out = []; |
| metaPath | const | 301 | no | const metaPath = path.join(sessionsDir, d.name, &#39;session.json&#39;); |
| stat | variable | 302 | no | let stat = null; |
| key | const | 306 | no | const key = path.resolve(metaPath); |
| cached | const | 307 | no | const cached = stat ? sessionListCache.get(key) : null; |
| meta | variable | 308 | no | let meta; |
| item | const | 319 | no | const item = meta &amp;&amp; typeof meta === &#39;object&#39; ? { ...meta } : meta; |
| bytes | variable | 320 | no | let bytes = 0; |
| raw | const | 321 | no | const raw = path.join(sessionsDir, d.name, &#39;raw&#39;); |
| resolveSessionDir | function | 330 | yes | export function resolveSessionDir(sessionsDir, idOrPrefix) { |
| all | const | 332 | no | const all = listSessions(sessionsDir); |
| direct | const | 336 | no | const direct = path.join(sessionsDir, idOrPrefix); |
| hits | const | 338 | no | const hits = existsSync(sessionsDir) ? readdirSync(sessionsDir).filter((d) =&gt; d.startsWith(idOrPrefix) \|\| d.endsWith(idOrPrefix)) : []; |
| buildRawIndex | export | 343 | yes | export { buildRawIndex, loadRawIndex, iterateRaw, compactSession, estimateCompaction } |
| compactSession | export | 343 | yes | export { buildRawIndex, loadRawIndex, iterateRaw, compactSession, estimateCompaction } |
| estimateCompaction | export | 343 | yes | export { buildRawIndex, loadRawIndex, iterateRaw, compactSession, estimateCompaction } |
| iterateRaw | export | 343 | yes | export { buildRawIndex, loadRawIndex, iterateRaw, compactSession, estimateCompaction } |
| loadRawIndex | export | 343 | yes | export { buildRawIndex, loadRawIndex, iterateRaw, compactSession, estimateCompaction } |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 9 | external |
| node:crypto | import | 10 | external |
| node:fs | import | 11 | external |
| node:readline | import | 12 | external |
| node:path | import | 13 | external |
| ./raw-log.mjs | import | 14 | [studio/src/store/raw-log.mjs](./raw-log.mjs.md) |
| ./raw-index.mjs | import | 15 | [studio/src/store/raw-index.mjs](./raw-index.mjs.md) |
| ./compact.mjs | import | 16 | [studio/src/store/compact.mjs](./compact.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/capture.mjs](../../bin/commands/capture.mjs.md) | ../../src/store/session.mjs |
| [studio/bin/commands/knowledge.mjs](../../bin/commands/knowledge.mjs.md) | ../../src/store/session.mjs |
| [studio/bin/commands/learn.mjs](../../bin/commands/learn.mjs.md) | ../../src/store/session.mjs |
| [studio/bin/commands/profiles.mjs](../../bin/commands/profiles.mjs.md) | ../../src/store/session.mjs |
| [studio/bin/commands/replay.mjs](../../bin/commands/replay.mjs.md) | ../../src/store/session.mjs |
| [studio/bin/commands/sessions.mjs](../../bin/commands/sessions.mjs.md) | ../../src/store/session.mjs |
| [studio/bin/lib/context.mjs](../../bin/lib/context.mjs.md) | ../../src/store/session.mjs |
| [studio/scripts/live-e2e.mjs](../../scripts/live-e2e.mjs.md) | ../src/store/session.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/store/session.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/store/session.mjs |
| [studio/scripts/shape-atlas.mjs](../../scripts/shape-atlas.mjs.md) | ../src/store/session.mjs |
| [studio/src/capture/campaign.mjs](../capture/campaign.mjs.md) | ../store/session.mjs |
| [studio/src/capture/conversation-browser-adapter.mjs](../capture/conversation-browser-adapter.mjs.md) | ../store/session.mjs |
| [studio/src/capture/conversation-runtime.mjs](../capture/conversation-runtime.mjs.md) | ../store/session.mjs |
| [studio/src/capture/recorder.mjs](../capture/recorder.mjs.md) | ../store/session.mjs |
| [studio/src/families/build.mjs](../families/build.mjs.md) | ../store/session.mjs |
| [studio/src/intel/continuity.mjs](../intel/continuity.mjs.md) | ../store/session.mjs |
| [studio/src/intel/platform.mjs](../intel/platform.mjs.md) | ../store/session.mjs |
| [studio/src/mcp/resources.mjs](../mcp/resources.mjs.md) | ../store/session.mjs |
| [studio/src/mirror/catalog.mjs](../mirror/catalog.mjs.md) | ../store/session.mjs |
| [studio/src/studio/adapter-learning-pipeline.mjs](../studio/adapter-learning-pipeline.mjs.md) | ../store/session.mjs |
| [studio/src/studio/integration-hub.mjs](../studio/integration-hub.mjs.md) | ../store/session.mjs |
| [studio/src/studio/platform-x.mjs](../studio/platform-x.mjs.md) | ../store/session.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../store/session.mjs |
| [studio/src/studio/world-service.mjs](../studio/world-service.mjs.md) | ../store/session.mjs |
| [studio/test/unit/consolidate-studio-src.test.mjs](../../test/unit/consolidate-studio-src.test.mjs.md) | ../../src/store/session.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Session storage, modelled on Apify's storage triad:
//   raw/       append-only source of truth (RawLog) + derived seek index   ~ request/response archive
//   datasets/  append-only structured records (JSONL)                      ~ Apify Dataset
//   kv/        named JSON/blob values (INPUT, STATE, ...)                  ~ Apify Key-Value Store
// plus session.json with run metadata, status and stats.
//
// Reads go through store/raw-index.mjs, which seeks with the sparse index when one exists and
// falls back to a full ordered scan when it does not. The index is always rebuildable.
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, appendFileSync, renameSync, createReadStream, statSync, rmSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { promises as fsp } from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';
import { RawLog } from './raw-log.mjs';
import { iterateRaw, iterateStreamRecords, loadRawIndex, buildRawIndex, rawStats, readStreamIndex, readManifest, segmentFiles } from './raw-index.mjs';
import { compactSession, estimateCompaction, dirBytes } from './compact.mjs';

export class KeyValueStore {
  constructor(dir) { this.dir = dir; mkdirSync(dir, { recursive: true }); this._chains = new Map(); }
  _p(key) {
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(key)) throw new Error(`invalid key: ${key}`);
    return path.join(this.dir, key.includes('.') ? key : `${key}.json`);
  }
  set(key, value) {
    const p = this._p(key);
    const data = typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2);
    writeFileSync(p + '.tmp', data); renameSync(p + '.tmp', p);
  }
  // Asynchronous set for periodic snapshots. The value is serialized here, synchronously, with the
  // same bytes set() would write, so the snapshot is fixed at call time. The file write itself runs
  // off the event loop: a uniquely named temp file, then rename over the key (the same atomic replace
  // as set()). Writes to one key are chained in call order, so a later snapshot always lands last.
  // The returned promise rejects on failure; the caller owns that rejection. A synchronous set() of
  // the same key must not overlap an unsettled setAsync() of it: callers await drain() first.
  setAsync(key, value) {
    const p = this._p(key);
    const data = typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2);
    const tmp = `${p}.${randomBytes(4).toString('hex')}.tmp`;
    const prev = this._chains.get(p) ?? null;
    const run = (async () => {
      if (prev) await prev;
      try { await fsp.writeFile(tmp, data); await fsp.rename(tmp, p); }
      catch (e) { await fsp.rm(tmp, { force: true }).catch(() => {}); throw e; }
    })();
    const tail = run.then(() => {}, () => {}).then(() => { if (this._chains.get(p) === tail) this._chains.delete(p); });
    this._chains.set(p, tail);
    return run;
  }
  // Resolves once every setAsync() issued so far has settled (written or failed). Never rejects.
  async drain() { while (this._chains.size) await Promise.all([...this._chains.values()]); }
  get(key, fallback = undefined) {
    const p = this._p(key);
    if (!existsSync(p)) return fallback;
    const raw = readFileSync(p, 'utf8');
    return p.endsWith('.json') ? JSON.parse(raw) : raw;
  }
  has(key) { return existsSync(this._p(key)); }
  remove(key) { const p = this._p(key); if (existsSync(p)) { rmSync(p); return true; } return false; }
  stat(key) { const p = this._p(key); return existsSync(p) ? { key, bytes: statSync(p).size, modified: statSync(p).mtimeMs } : null; }
  keys() { return readdirSync(this.dir).filter((f) => !f.endsWith('.tmp')); }
}

// Datasets with a chunked writer ({ buffered: true }) accumulate pushed JSONL in memory and append
// it in one write when FLUSH_BYTES is reached, FLUSH_MS elapsed (unref'd timer), or anything could
// observe the file: every Dataset method that touches the file, constructing another Dataset for
// the same file (session.dataset() builds a fresh instance per call), Session.verify / saveMeta /
// bytes / datasets, and process exit. Bytes on disk are identical to unbuffered appends, in order.
const DATASET_FLUSH_BYTES = 256 * 1024;
const DATASET_FLUSH_MS = 250;
const pendingDatasets = new Set();
let exitHookInstalled = false;

export function flushPendingDatasets(match = null) {
  for (const ds of [...pendingDatasets]) if (!match || match(ds.file)) ds.flush();
}

export class Dataset {
  constructor(file, { buffered = false, flushBytes = DATASET_FLUSH_BYTES, flushMs = DATASET_FLUSH_MS } = {}) {
    // Another instance may hold unwritten lines for this very file; make them visible first.
    if (pendingDatasets.size) flushPendingDatasets((f) => f === file);
```

_First 80 of 344 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
