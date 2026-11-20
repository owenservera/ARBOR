# File: studio/src/store/versioned.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/store/versioned.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 21074 B |
| Lines | 392 |
| Hash | 441711b034df |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STORE_MAX_VERSION | const | 23 | yes | export const STORE_MAX_VERSION = 9999; |
| STORE_LOCK_SCHEMA | const | 24 | yes | export const STORE_LOCK_SCHEMA = &#39;aion.versioned-store-lock/1&#39;; |
| I1_NAMESPACE_RE | const | 26 | yes | export const I1_NAMESPACE_RE = /^i1-[0-9a-f]{40}$/; |
| NAME_RE | const | 28 | no | const NAME_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/i; |
| DEVICE_RE | const | 29 | no | const DEVICE_RE = /^(con\|prn\|aux\|nul\|com[1-9]\|lpt[1-9])$/i; |
| VERSION_FILE_RE | const | 30 | no | const VERSION_FILE_RE = /^v(\\d{4})\\.json$/; |
| CURRENT_RE | const | 31 | no | const CURRENT_RE = /^[1-9][0-9]{0,3}$/; |
| TOKEN_RE | const | 32 | no | const TOKEN_RE = /^[0-9a-f]{32}$/; |
| TRANSIENT_FS | const | 33 | no | const TRANSIENT_FS = new Set([&#39;EPERM&#39;, &#39;EBUSY&#39;, &#39;EACCES&#39;]); // Windows sharing / delete-pending / antivirus races |
| IO_KEYS | const | 34 | no | const IO_KEYS = [&#39;openSync&#39;, &#39;writeFileSync&#39;, &#39;fsyncSync&#39;, &#39;closeSync&#39;, &#39;renameSync&#39;, &#39;unlinkSync&#39;, |
| DEFAULT_IO | const | 36 | no | const DEFAULT_IO = { openSync, writeFileSync, fsyncSync, closeSync, renameSync, unlinkSync, |
| pad | function | 39 | no | const pad = (n) =&gt; String(n).padStart(4, &#39;0&#39;); |
| coded | function | 40 | no | const coded = (code, message, extra = {}) =&gt; Object.assign(new Error(message ?? code), { code, ...extra }); |
| brief | function | 41 | no | const brief = (x) =&gt; { const s = typeof x === &#39;string&#39; ? x : JSON.stringify(x); return String(s).slice(0, 80); }; |
| sameFile | function | 42 | no | const sameFile = (a, b) =&gt; (process.platform === &#39;win32&#39; ? a.toLowerCase() === b.toLowerCase() : a === b); |
| sleepCell | const | 43 | no | const sleepCell = new Int32Array(new SharedArrayBuffer(4)); |
| sleep | function | 44 | no | const sleep = (ms) =&gt; { if (ms &gt; 0) Atomics.wait(sleepCell, 0, 0, ms); }; |
| errInfo | function | 45 | no | const errInfo = (e) =&gt; ({ code: e?.code ?? null, message: String(e?.message ?? e).slice(0, 160) }); |
| attach | function | 46 | no | const attach = (err, key, value) =&gt; { if (err &amp;&amp; typeof err === &#39;object&#39;) { try { err[key] = value; } catch { /* frozen */ } } }; |
| validateStoreName | function | 49 | yes | export function validateStoreName(name, kind = &#39;item&#39;) { |
| validateStoreVersion | function | 57 | yes | export function validateStoreVersion(version, kind = &#39;item&#39;) { |
| validateExpectedVersion | function | 65 | yes | export function validateExpectedVersion(expectedVersion, { allowNull }) { |
| ok | const | 66 | no | const ok = (allowNull &amp;&amp; expectedVersion === null) \|\| |
| VersionedStore | class | 75 | yes | export class VersionedStore { |
| constructor | method | 76 | yes | constructor(dir, { builtinDir, normalize = (x) =&gt; x, kind = &#39;item&#39;, io, lockWaitMs = 500, lockRetryMs = 5 } = {}) { |
| p | const | 87 | no | const p = JSON.parse(this.io.readFileSync(path.join(builtinDir, f), &#39;utf8&#39;)); |
| root | const | 99 | no | const root = path.resolve(this.dir); |
| d | const | 100 | no | const d = path.join(root, name); |
| st | variable | 102 | no | let st = null; |
| real | const | 106 | no | const real = this.io.realpathSync(d); |
| realRoot | const | 107 | no | const realRoot = this.io.realpathSync(root); |
| c | const | 121 | no | const c = path.join(d, &#39;CURRENT&#39;); |
| raw | const | 123 | no | const raw = String(this.io.readFileSync(c, &#39;utf8&#39;)).trim(); |
| v | const | 130 | no | const v = this.#readCurrent(d, name); |
| p | const | 138 | no | const p = this.#versionFile(d, version); |
| rec | variable | 140 | no | let rec; |
| names | method | 151 | yes | names() { |
| versions | method | 157 | yes | versions(name) { |
| d | const | 158 | no | const d = this.#dirFor(name); |
| p | const | 161 | no | const p = JSON.parse(this.io.readFileSync(this.#versionFile(d, version), &#39;utf8&#39;)); |
| current | method | 167 | yes | current(name) { |
| d | const | 168 | no | const d = this.#dirFor(name); |
| has | method | 172 | yes | has(name) { return this.current(name) !== null; } |
| load | method | 174 | yes | load(name, version) { |
| d | const | 175 | no | const d = this.#dirFor(name); |
| v | variable | 176 | no | let v; |
| lockPath | method | 187 | yes | lockPath(name) { |
| lock | const | 201 | no | const lock = this.lockPath(name); |
| lockDir | const | 202 | no | const lockDir = path.dirname(lock); |
| token | const | 205 | no | const token = randomBytes(16).toString(&#39;hex&#39;); |
| body | const | 206 | no | const body = JSON.stringify({ schema: STORE_LOCK_SCHEMA, token, pid: process.pid, name, op, at: new Date().toISOString() }); |
| deadline | const | 207 | no | const deadline = Date.now() + this.lockWaitMs; |
| attempts | variable | 208 | no | let attempts = 0; |
| fd | variable | 210 | no | let fd; |
| transient | const | 218 | no | const transient = TRANSIENT_FS.has(e?.code); |
| failure | variable | 234 | no | let failure; |
| closeErr | const | 236 | no | const closeErr = this.#closeOnce(fd); // ALWAYS close (once), even after a write/fsync failure |
| rec | variable | 248 | no | let rec; |
| h | const | 257 | no | const h = this.#acquire(name, op); |
| result | variable | 258 | no | let result; let threw = false; let primary; |
| released | const | 260 | no | const released = this.#release(h); |
| fd | variable | 274 | no | let fd; |
| failure | variable | 280 | no | let failure; |
| closeErr | const | 282 | no | const closeErr = this.#closeOnce(fd); // ALWAYS close (once), even after a write/fsync failure |
| tmp | const | 291 | no | const tmp = path.join(d, `CURRENT.${randomBytes(8).toString(&#39;hex&#39;)}.tmp`); |
| cur | const | 293 | no | const cur = path.join(d, &#39;CURRENT&#39;); |
| nums | const | 306 | no | const nums = this.#versionFileNumbers(d); |
| version | const | 307 | no | const version = (nums.at(-1) ?? 0) + 1; |
| rec | const | 309 | no | const rec = { ...this.normalize(value), name, version, savedAt: new Date().toISOString(), changeNote, ...extra }; |
| save | method | 317 | yes | save(name, value, changeNote = &#39;&#39;) { |
| d | const | 318 | no | const d = this.#dirFor(name); |
| compareAndSave | method | 323 | yes | compareAndSave(name, value, options) { |
| d | const | 325 | no | const d = this.#dirFor(name); |
| actual | const | 328 | no | const actual = this.#head(d, name); |
| rollback | method | 337 | yes | rollback(name, version) { |
| d | const | 338 | no | const d = this.#dirFor(name); |
| v | const | 339 | no | const v = validateStoreVersion(version, this.kind); |
| compareAndRollback | method | 348 | yes | compareAndRollback(name, version, options) { |
| d | const | 350 | no | const d = this.#dirFor(name); |
| target | const | 351 | no | const target = validateStoreVersion(version, this.kind); |
| actual | const | 354 | no | const actual = this.#head(d, name); |
| inspectLock | method | 365 | yes | inspectLock(name) { |
| lock | const | 366 | no | const lock = this.lockPath(name); |
| rec | variable | 368 | no | let rec = null; |
| wellFormed | const | 370 | no | const wellFormed = !!rec &amp;&amp; rec.schema === STORE_LOCK_SCHEMA &amp;&amp; typeof rec.token === &#39;string&#39; &amp;&amp; TOKEN_RE.test(rec.token); |
| pidAlive | variable | 371 | no | let pidAlive = null; |
| releaseStaleLock | method | 380 | yes | releaseStaleLock(name, options) { |
| lock | const | 381 | no | const lock = this.lockPath(name); |
| rec | variable | 384 | no | let rec = null; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 16 | external |
| node:crypto | import | 20 | external |
| node:path | import | 21 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/agents/dcb-definition-store.mjs](../agents/dcb-definition-store.mjs.md) | ../store/versioned.mjs |
| [studio/src/agents/personal-agent-service.mjs](../agents/personal-agent-service.mjs.md) | ../store/versioned.mjs |
| [studio/src/families/families.mjs](../families/families.mjs.md) | ../store/versioned.mjs |
| [studio/src/profiles/profiles.mjs](../profiles/profiles.mjs.md) | ../store/versioned.mjs |
| [studio/src/studio/adapter-factory-service.mjs](../studio/adapter-factory-service.mjs.md) | ../store/versioned.mjs |
| [studio/src/studio/integration-hub.mjs](../studio/integration-hub.mjs.md) | ../store/versioned.mjs |
| [studio/src/studio/personal-app-content.mjs](../studio/personal-app-content.mjs.md) | ../store/versioned.mjs |
| [studio/src/studio/personal-app-service.mjs](../studio/personal-app-service.mjs.md) | ../store/versioned.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../store/versioned.mjs |
| [studio/src/studio/world-service.mjs](../studio/world-service.mjs.md) | ../store/versioned.mjs |
| [studio/src/studio/world-transfer.mjs](../studio/world-transfer.mjs.md) | ../store/versioned.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Generic versioned JSON store: every save is a new immutable vNNNN.json, CURRENT points at the
// active version. Used by site profiles, provider families and the learned read-only adapters.
//
// This file is the SINGLE OWNER of persistence for every store built on it (issue #81 P0):
//   - name and version grammar are validated on EVERY method (read and write), with containment;
//   - every mutation takes one per-name cross-process lock under <dir>/.locks (never stolen);
//   - compareAndSave / compareAndRollback give strict expected-version semantics
//     (null = must not exist, integer = must equal CURRENT, anything else is rejected);
//   - CAS rollback APPENDS a restoring version, so CURRENT only moves forward (no ABA);
//   - the optional `io` seam (same pattern as conversation-service / thread-turn-journal) lets
//     tests inject deterministic write/fsync/close/rename/unlink faults into THIS code.
// Legacy save()/rollback() keep their old meaning for profiles and families (no migration), but
// are validated, locked and atomic too. Locks are never auto-cleared: a crashed holder fails
// closed (CAS_LOCKED) until an operator inspects it (inspectLock) and releases it by token
// (releaseStaleLock). Critical sections are synchronous.
import {
  openSync, writeFileSync, fsyncSync, closeSync, renameSync, unlinkSync,
  readFileSync, existsSync, readdirSync, mkdirSync, lstatSync, realpathSync,
} from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';

export const STORE_MAX_VERSION = 9999;
export const STORE_LOCK_SCHEMA = 'aion.versioned-store-lock/1';
/** Names owned by the I1 learning pipeline in the shared learned-adapter store (`i1-` + 40 hex). */
export const I1_NAMESPACE_RE = /^i1-[0-9a-f]{40}$/;

const NAME_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
const DEVICE_RE = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const VERSION_FILE_RE = /^v(\d{4})\.json$/;
const CURRENT_RE = /^[1-9][0-9]{0,3}$/;
const TOKEN_RE = /^[0-9a-f]{32}$/;
const TRANSIENT_FS = new Set(['EPERM', 'EBUSY', 'EACCES']); // Windows sharing / delete-pending / antivirus races
const IO_KEYS = ['openSync', 'writeFileSync', 'fsyncSync', 'closeSync', 'renameSync', 'unlinkSync',
  'readFileSync', 'existsSync', 'readdirSync', 'mkdirSync', 'lstatSync', 'realpathSync'];
const DEFAULT_IO = { openSync, writeFileSync, fsyncSync, closeSync, renameSync, unlinkSync,
  readFileSync, existsSync, readdirSync, mkdirSync, lstatSync, realpathSync };

const pad = (n) => String(n).padStart(4, '0');
const coded = (code, message, extra = {}) => Object.assign(new Error(message ?? code), { code, ...extra });
const brief = (x) => { const s = typeof x === 'string' ? x : JSON.stringify(x); return String(s).slice(0, 80); };
const sameFile = (a, b) => (process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b);
const sleepCell = new Int32Array(new SharedArrayBuffer(4));
const sleep = (ms) => { if (ms > 0) Atomics.wait(sleepCell, 0, 0, ms); };
const errInfo = (e) => ({ code: e?.code ?? null, message: String(e?.message ?? e).slice(0, 160) });
const attach = (err, key, value) => { if (err && typeof err === 'object') { try { err[key] = value; } catch { /* frozen */ } } };

/** Store-name grammar shared by every method that takes a name. */
export function validateStoreName(name, kind = 'item') {
  if (typeof name !== 'string' || !NAME_RE.test(name) || name.endsWith('.') || DEVICE_RE.test(name.split('.')[0])) {
    throw coded('STORE_NAME_INVALID', `invalid ${kind} name: ${brief(name)}`);
  }
  return name;
}

/** Versions are JS numbers that are integers in 1..9999 (strings, floats, NaN, 0, null are refused). */
export function validateStoreVersion(version, kind = 'item') {
  if (typeof version !== 'number' || !Number.isSafeInteger(version) || version < 1 || version > STORE_MAX_VERSION) {
    throw coded('STORE_VERSION_INVALID', `invalid ${kind} version: ${brief(version)}`);
  }
  return version;
}

/** The single expectedVersion rule: null (only when allowNull) = must not exist; integer 1..9999 = must equal CURRENT; everything else, including undefined, is refused. */
export function validateExpectedVersion(expectedVersion, { allowNull }) {
  const ok = (allowNull && expectedVersion === null) ||
    (typeof expectedVersion === 'number' && Number.isSafeInteger(expectedVersion) && expectedVersion >= 1 && expectedVersion <= STORE_MAX_VERSION);
  if (!ok) {
    throw coded('CAS_EXPECTED_VERSION_INVALID',
      `expectedVersion must be ${allowNull ? 'null (must not exist) or ' : ''}an integer 1..${STORE_MAX_VERSION}; got ${brief(expectedVersion === undefined ? 'undefined' : expectedVersion)}`);
  }
  return expectedVersion;
}

export class VersionedStore {
  constructor(dir, { builtinDir, normalize = (x) => x, kind = 'item', io, lockWaitMs = 500, lockRetryMs = 5 } = {}) {
    this.dir = dir;
    this.normalize = normalize;
    this.kind = kind;
    this.io = { ...DEFAULT_IO };
```

_First 80 of 393 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
