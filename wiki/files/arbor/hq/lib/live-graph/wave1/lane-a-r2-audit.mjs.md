# File: hq/lib/live-graph/wave1/lane-a-r2-audit.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | hq/lib/live-graph/wave1/lane-a-r2-audit.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13217 B |
| Lines | 184 |
| Hash | 3e790383a598 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AUDIT_SCHEMA | const | 11 | yes | export const AUDIT_SCHEMA = &#39;vivim.wave1.lane-a.r2-audit/1&#39;; |
| INPUT_SCHEMA | const | 12 | yes | export const INPUT_SCHEMA = &#39;vivim.wave1.code-observations/1&#39;; |
| DIGEST | const | 13 | no | const DIGEST = /^[a-f0-9]{64}$/i; |
| COMMIT | const | 14 | no | const COMMIT = /^[a-f0-9]{40}$/i; |
| SECRET | const | 15 | no | const SECRET = /^(?:\\.env[^/]*\|[^/]*\\.env\|[^/]*\\.(?:pem\|p12\|keystore)\|session\\.json\|storage-state\\.json\|release-profile\\.json\|cookies\|login data)$/i; |
| DECISIONS | const | 16 | no | const DECISIONS = new Set([&#39;eligible&#39;, &#39;excluded&#39;, &#39;unsupported&#39;, &#39;unknown&#39;]); |
| hash | function | 17 | no | const hash = bytes =&gt; createHash(&#39;sha256&#39;).update(bytes).digest(&#39;hex&#39;); |
| isObj | function | 18 | no | const isObj = x =&gt; x !== null &amp;&amp; typeof x === &#39;object&#39; &amp;&amp; !Array.isArray(x); |
| sortBy | function | 19 | no | const sortBy = (items, key) =&gt; [...items].sort((a, b) =&gt; String(key(a)).localeCompare(String(key(b)), &#39;en&#39;)); |
| canonical | function | 20 | no | function canonical(value) { |
| fingerprint | function | 25 | no | const fingerprint = value =&gt; hash(JSON.stringify(canonical(value))); |
| safeRelativePath | function | 27 | yes | export function safeRelativePath(path) { |
| parts | const | 29 | no | const parts = path.split(&#39;/&#39;); |
| classifyRelativePath | function | 32 | yes | export function classifyRelativePath(path) { |
| enclosed | function | 37 | no | const enclosed = (base, file) =&gt; { |
| diff | const | 38 | no | const diff = relative(base, file); |
| ensureNoSymlink | function | 41 | no | function ensureNoSymlink(root, rel, fs = { lstatSync, realpathSync, statSync, readFileSync }) { |
| rootCanonical | const | 42 | no | const rootCanonical = fs.realpathSync(root); |
| cur | variable | 44 | no | let cur = rootCanonical; |
| canonical | const | 49 | no | const canonical = fs.realpathSync(cur); |
| verifySourceBytes | function | 55 | yes | export function verifySourceBytes(file, rootPaths, fs) { |
| root | const | 57 | no | const root = rootPaths?.[file.rootId]; |
| path | const | 60 | no | const path = ensureNoSymlink(resolve(root), file.path, fs); |
| bytes | const | 61 | no | const bytes = (fs?.readFileSync ?? readFileSync)(path); |
| digest | const | 63 | no | const digest = hash(bytes); |
| code | const | 68 | no | const code = String(e?.message \|\| &#39;&#39;).match(/^(ROOT_SYMLINK\|SOURCE_SYMLINK\|SOURCE_OUTSIDE_ROOT\|SOURCE_NOT_FILE)$/)?.[1] \|\| &#39;SOURCE_READ_FAILED&#39;; |
| add | function | 72 | no | function add(diagnostics, code, ref, severity = &#39;error&#39;) { |
| rootRow | function | 75 | no | function rootRow(rootId) { |
| auditLaneASources | function | 87 | yes | export function auditLaneASources(observations, opts = {}) { |
| diagnostics | const | 91 | no | const diagnostics = [], roots = new Map(), seenFiles = new Map(), seenFileById = new Map(), seenIDs = new Set(), inventory = new Map(); |
| hasInventory | const | 96 | no | const hasInventory = Array.isArray(opts.inventory); |
| key | const | 103 | no | const key = item.rootId + &#39;\\0&#39; + item.path; |
| rr | const | 106 | no | const rr = roots.get(item.rootId); rr.discovered++; rr[item.decision]++; |
| fileChecks | const | 109 | no | const fileChecks = [], checkById = new Map(); |
| rr | const | 112 | no | const rr = roots.get(f.rootId), key = f.rootId + &#39;\\0&#39; + f.path; |
| check | const | 117 | no | const check = verifySourceBytes(f, opts.rootPaths, opts.fs); |
| fileCheck | const | 119 | no | const fileCheck = { fileId: f.id, rootId: f.rootId, path: f.path, code: check.code, hash: check.digest ?? null, lineCount: check.lineCount ?? null }; |
| walkAnchors | function | 126 | no | function walkAnchors(items, kind) { |
| id | const | 130 | no | const id = kind === &#39;import&#39; ? it.from : it.fileId; |
| file | const | 131 | no | const file = seenFileById.get(id); |
| rr | const | 133 | no | const rr = roots.get(file.rootId); rr[kind === &#39;symbol&#39; ? &#39;symbols&#39; : kind === &#39;import&#39; ? &#39;imports&#39; : &#39;annotations&#39;]++; |
| checkedFile | const | 135 | no | const checkedFile = checkById.get(id); |
| sorted | const | 152 | no | const sorted = sortBy(diagnostics, d =&gt; d.code + &#39;\\0&#39; + d.ref), rootResults = sortBy([...roots.values()], x =&gt; x.rootId); |
| status | const | 153 | no | const status = sorted.length ? &#39;BLOCKED&#39; : hasInventory ? &#39;AUDIT_CONSISTENT_NOT_INTEGRATED&#39; : &#39;BLOCKED&#39;; |
| result | const | 154 | no | const result = { |
| assessLaneECompatibility | function | 165 | yes | export function assessLaneECompatibility(observations, scope) { |
| issues | const | 167 | no | const issues = []; |
| er | const | 172 | no | const er = new Map((Array.isArray(scope?.roots) ? scope.roots : []).map(r =&gt; [r.id, r])); |
| e | const | 174 | no | const e = er.get(root.id); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 7 | external |
| node:fs | import | 8 | external |
| node:path | import | 9 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/live-graph/wave1/lane-a-r2-discovery.mjs](./lane-a-r2-discovery.mjs.md) | ./lane-a-r2-audit.mjs |
| [hq/test/live-graph-wave1-a-r2-audit.test.mjs](../../../test/live-graph-wave1-a-r2-audit.test.mjs.md) | ../lib/live-graph/wave1/lane-a-r2-audit.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Wave 1 Lane A Round 2: isolated source-evidence and coverage auditor. |
| 3 | invariant | — | — | Read-only. No SQLite, registry, Rust journal, Host effects, or old index reset. |
| 4 | invariant | — | — | A source comment is a declaration, never a permission grant. |
| 5 | invariant | — | — | Output is a diagnostic projection only, NOT Lane E source-records/1. |

## Excerpt

```javascript
/**
 * @hq:context Wave 1 Lane A Round 2: isolated source-evidence and coverage auditor.
 * @hq:invariant Read-only. No SQLite, registry, Rust journal, Host effects, or old index reset.
 * @hq:invariant A source comment is a declaration, never a permission grant.
 * @hq:invariant Output is a diagnostic projection only, NOT Lane E source-records/1.
 */
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

export const AUDIT_SCHEMA = 'vivim.wave1.lane-a.r2-audit/1';
export const INPUT_SCHEMA = 'vivim.wave1.code-observations/1';
const DIGEST = /^[a-f0-9]{64}$/i;
const COMMIT = /^[a-f0-9]{40}$/i;
const SECRET = /^(?:\.env[^/]*|[^/]*\.env|[^/]*\.(?:pem|p12|keystore)|session\.json|storage-state\.json|release-profile\.json|cookies|login data)$/i;
const DECISIONS = new Set(['eligible', 'excluded', 'unsupported', 'unknown']);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const isObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const sortBy = (items, key) => [...items].sort((a, b) => String(key(a)).localeCompare(String(key(b)), 'en'));
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (isObj(value)) return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
const fingerprint = value => hash(JSON.stringify(canonical(value)));

export function safeRelativePath(path) {
  if (typeof path !== 'string' || path.length === 0 || path.length > 1024 || path.includes('\\') || path.startsWith('/') || path.includes(':') || /[\u0000-\u001f]/.test(path)) return false;
  const parts = path.split('/');
  return parts.every(x => x.length && x !== '.' && x !== '..' && !SECRET.test(x));
}
export function classifyRelativePath(path) {
  if (typeof path !== 'string' || !path.trim()) return 'invalid';
  if (/\b(?:passwords?|secrets?|tokens?|cookies?|authorization|private.?key)\b/i.test(path)) return 'sensitive-name-review';
  return safeRelativePath(path) ? 'allowed' : 'unsafe';
}
const enclosed = (base, file) => {
  const diff = relative(base, file);
  return diff === '' || (diff !== '..' && !diff.startsWith('..' + sep) && !isAbsolute(diff));
};
function ensureNoSymlink(root, rel, fs = { lstatSync, realpathSync, statSync, readFileSync }) {
  const rootCanonical = fs.realpathSync(root);
  if (fs.lstatSync(root).isSymbolicLink()) throw Error('ROOT_SYMLINK');
  let cur = rootCanonical;
  for (const component of rel.split('/')) {
    cur = join(cur, component);
    if (fs.lstatSync(cur).isSymbolicLink()) throw Error('SOURCE_SYMLINK');
  }
  const canonical = fs.realpathSync(cur);
  if (!enclosed(rootCanonical, canonical)) throw Error('SOURCE_OUTSIDE_ROOT');
  if (!fs.statSync(canonical).isFile()) throw Error('SOURCE_NOT_FILE');
  return canonical;
}
/** Exact current byte check; caller supplies a private path map, never exported. */
export function verifySourceBytes(file, rootPaths, fs) {
  if (!isObj(file) || !safeRelativePath(file.path) || !DIGEST.test(file.sourceHash ?? '')) return { code: 'SOURCE_METADATA_INVALID' };
  const root = rootPaths?.[file.rootId];
  if (typeof root !== 'string' || !isAbsolute(root)) return { code: 'ROOT_NOT_MOUNTED' };
  try {
    const path = ensureNoSymlink(resolve(root), file.path, fs);
    const bytes = (fs?.readFileSync ?? readFileSync)(path);
    if (!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) return { code: 'SOURCE_BYTES_NOT_BINARY' };
    const digest = hash(bytes);
    if (digest.toLowerCase() !== file.sourceHash.toLowerCase()) return { code: 'SOURCE_HASH_MISMATCH' };
    if (file.size !== undefined && Number.isSafeInteger(file.size) && file.size !== bytes.length) return { code: 'SOURCE_SIZE_MISMATCH' };
    return { code: 'SOURCE_VERIFIED', digest, size: bytes.length, lineCount: (Buffer.from(bytes).toString('utf8').match(/\n/g) || []).length + 1 };
  } catch (e) {
    const code = String(e?.message || '').match(/^(ROOT_SYMLINK|SOURCE_SYMLINK|SOURCE_OUTSIDE_ROOT|SOURCE_NOT_FILE)$/)?.[1] || 'SOURCE_READ_FAILED';
    return { code };
  }
}
function add(diagnostics, code, ref, severity = 'error') {
  diagnostics.push({ code, ref: String(ref ?? ''), severity });
}
function rootRow(rootId) {
  return { rootId, declared: 1, discovered: 0, eligible: 0, excluded: 0, unsupported: 0, unknown: 0, verified: 0, indexed: 0, missing: 0, errors: 0, symbols: 0, imports: 0, annotations: 0, coverage: null };
}
/**
 * Audits the unchanged v1 A envelope against a separately generated discovery
 * inventory. Does not assert the inventory is genuine: reports its provenance.
```

_First 80 of 185 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
