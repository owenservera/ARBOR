# File: hq/lib/wave1-kb-read.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/wave1-kb-read.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12464 B |
| Lines | 174 |
| Hash | c9e9cec046ce |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WAVE1_KB_SCHEMA | const | 9 | yes | export const WAVE1_KB_SCHEMA = &#39;vivim.wave1.kb-semantic/1&#39;; |
| MAX | const | 10 | no | const MAX = 500; |
| SECRET | const | 11 | no | const SECRET = /(^\|\\/)(?:\\.env[^/]*\|[^/]*\\.env\|[^/]*\\.(?:pem\|p12\|keystore)\|cookies\|login data\|session\\.json\|storage-state\\.json\|release-profile\\.json)(?:\\/\|$)/i; |
| VALID_ID | const | 12 | no | const VALID_ID = /^[a-z0-9][a-z0-9._-]*@\\d+(?:\\.\\d+)*$/; |
| cmp | function | 13 | no | const cmp = (a, b) =&gt; String(a).localeCompare(String(b), &#39;en&#39;); |
| pathOf | function | 14 | no | const pathOf = value =&gt; typeof value === &#39;string&#39; ? value.replaceAll(&#39;\\\\&#39;, &#39;/&#39;).replace(/^\\.\\//, &#39;&#39;) : &#39;&#39;; |
| goodPath | function | 15 | no | const goodPath = value =&gt; !!value &amp;&amp; !value.startsWith(&#39;/&#39;) &amp;&amp; !/^[a-z]:\\//i.test(value) &amp;&amp; !value.split(&#39;/&#39;).includes(&#39;..&#39;) &amp;&amp; !SECRET.test(value); |
| sha | function | 16 | no | const sha = value =&gt; typeof value === &#39;string&#39; &amp;&amp; /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase() : null; |
| parseArray | function | 17 | no | function parseArray(value) { try { const x = typeof value === &#39;string&#39; ? JSON.parse(value) : value; return Array.isArray(x) ? x : []; } catch { return []; } } |
| canonical | function | 18 | no | function canonical(value) { |
| digest | function | 23 | no | const digest = value =&gt; createHash(&#39;sha256&#39;).update(canonical(value)).digest(&#39;hex&#39;); |
| table | function | 24 | no | function table(db, name) { return !!db.prepare(&quot;SELECT 1 AS present FROM sqlite_master WHERE type=&#39;table&#39; AND name=?&quot;).get(name); } |
| rows | function | 25 | no | function rows(db, name, fields, where, values, cap) { |
| result | const | 27 | no | const result = db.prepare(`SELECT ${fields} FROM ${name} ${where} LIMIT ?`).all(...values, cap + 1); |
| refusal | function | 30 | no | function refusal(code, detail) { const error = new Error(`${code}: ${detail}`); error.code = code; throw error; } |
| exportWave1KbSemantic | function | 37 | yes | export function exportWave1KbSemantic(db, { projectId, projectName, rootId, sourceRevision, sourceManifest = [], limit = 200, } = {}) { |
| manifest | const | 47 | no | const manifest = new Map(); |
| path | const | 49 | no | const path = pathOf(entry?.path), hash = sha(entry?.sha256); |
| project | const | 54 | no | const project = { id: projectId, name: projectName, root: rootId, revision: sourceRevision.toLowerCase() }; |
| records | const | 55 | no | const records = [], links = [], unknowns = []; |
| seen | const | 56 | no | const seen = new Map(), docs = new Map(), bindings = [], anchorByPath = new Map(); |
| missingTables | const | 57 | no | const missingTables = [], truncatedTables = []; |
| read | function | 58 | no | const read = (name, fields, clause = &#39;&#39;, args = []) =&gt; { |
| result | const | 59 | no | const result = rows(db, name, fields, clause, args, limit); |
| add | function | 64 | no | const add = record =&gt; { |
| prior | const | 65 | no | const prior = seen.get(record.id); |
| encoded | const | 66 | no | const encoded = canonical(record); |
| edge | function | 70 | no | const edge = (from, to, relation, evidence) =&gt; links.push({ from, to, relation, evidence }); |
| locate | function | 71 | no | const locate = (p, expected) =&gt; { |
| descriptor | function | 76 | no | const descriptor = (type, id, label, state, authority, revision, source) =&gt; ({ id, type, label: String(label ?? &#39;&#39;).slice(0, 160), state: String(state ?? &#39;unknown&#39;), authority: String(authority ?? &#39;u… |
| path | const | 84 | no | const path = pathOf(row.path); |
| id | const | 86 | no | const id = `kb:doc:${rootId}:${encodeURIComponent(path)}`; |
| rec | const | 87 | no | const rec = descriptor(&#39;kb_document&#39;, id, row.title \|\| path, row.lifecycle, row.authority, sha(row.hash) \|\| &#39;unknown&#39;, { path, hash: sha(row.hash), evidence: &#39;hq.documents&#39; }); |
| target | const | 90 | no | const target = pathOf(b?.path), hash = sha(b?.sha256); |
| fields | const | 96 | no | const fields = tableName === &#39;decisions&#39; ? &#39;id,source_path,title,status,authority,hash,valid_from,valid_to,recorded_at,updated_at,evidence&#39; : &#39;id,source_path,term,status,authority,hash,valid_from,val… |
| path | const | 98 | no | const path = pathOf(row.source_path); |
| id | const | 100 | no | const id = `kb:${kind}:${rootId}:${encodeURIComponent(String(row.id))}`; |
| rec | const | 101 | no | const rec = descriptor(kind, id, row[labelField], row.status, row.authority, row.updated_at \|\| row.recorded_at \|\| row.valid_from \|\| sha(row.hash) \|\| &#39;unknown&#39;, { path, hash: sha(row.hash), validFrom:… |
| knownSourcePaths | const | 114 | no | const knownSourcePaths = new Set([...manifest.keys(), ...docs.keys(), ...bindings.map(b =&gt; b.path)]); |
| semanticLinks | const | 115 | no | const semanticLinks = read(&#39;semantic_link&#39;, &#39;id,semantic_id,path,line,symbol,content_hash,kind,status,observed_at&#39;, &#39;ORDER BY id&#39;); |
| eligible | const | 116 | no | const eligible = new Map(); |
| path | const | 118 | no | const path = pathOf(row.path), hash = sha(row.content_hash); |
| state | const | 121 | no | const state = locate(path, hash); |
| list | const | 124 | no | const list = eligible.get(row.semantic_id) ?? []; |
| existing | const | 127 | no | const existing = anchorByPath.get(path) ?? []; |
| ids | const | 131 | no | const ids = eligible.size ? read(&#39;semantic_id&#39;, &#39;id,kind,name,version,label,description,status,authority,provenance,created_at&#39;, &#39;ORDER BY id&#39;) : []; |
| found | const | 132 | no | const found = new Set(); |
| id | const | 136 | no | const id = `semantic:${row.id}`; |
| aliasRows | const | 144 | no | const aliasRows = found.size ? read(&#39;semantic_alias&#39;, &#39;alias,target_id,kind&#39;, &#39;ORDER BY alias,target_id&#39;) : []; |
| aliasTargets | const | 145 | no | const aliasTargets = new Map(); |
| alias | const | 148 | no | const alias = String(row.alias ?? &#39;&#39;).trim(); |
| targets | const | 150 | no | const targets = aliasTargets.get(alias) ?? new Set(); targets.add(row.target_id); aliasTargets.set(alias, targets); |
| id | const | 151 | no | const id = `semantic:alias:${rootId}:${encodeURIComponent(alias)}:${encodeURIComponent(row.target_id)}`; |
| state | const | 157 | no | const state = locate(b.path, b.hash); |
| payload | const | 167 | no | const payload = { schema: WAVE1_KB_SCHEMA, project, records, links, unknowns, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/wave1-kb-export.mjs](../bin/wave1-kb-export.mjs.md) | ../lib/wave1-kb-read.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Wave 1 Lane B: bounded, read-only KB/semantic identity export. |
| 3 | invariant | — | — | Never promotes, indexes, repairs, creates tables or writes to HQ SQLite. |
| 4 | invariant | — | — | No code/command edge without an exact path AND SHA-256 match to a source manifest. |
| 5 | invariant | — | — | Sessions, notes and content bodies are excluded from the DEV interchange. |

## Excerpt

```javascript
/**
 * @hq:context Wave 1 Lane B: bounded, read-only KB/semantic identity export.
 * @hq:invariant Never promotes, indexes, repairs, creates tables or writes to HQ SQLite.
 * @hq:invariant No code/command edge without an exact path AND SHA-256 match to a source manifest.
 * @hq:invariant Sessions, notes and content bodies are excluded from the DEV interchange.
 */
import { createHash } from 'node:crypto';

export const WAVE1_KB_SCHEMA = 'vivim.wave1.kb-semantic/1';
const MAX = 500;
const SECRET = /(^|\/)(?:\.env[^/]*|[^/]*\.env|[^/]*\.(?:pem|p12|keystore)|cookies|login data|session\.json|storage-state\.json|release-profile\.json)(?:\/|$)/i;
const VALID_ID = /^[a-z0-9][a-z0-9._-]*@\d+(?:\.\d+)*$/;
const cmp = (a, b) => String(a).localeCompare(String(b), 'en');
const pathOf = value => typeof value === 'string' ? value.replaceAll('\\', '/').replace(/^\.\//, '') : '';
const goodPath = value => !!value && !value.startsWith('/') && !/^[a-z]:\//i.test(value) && !value.split('/').includes('..') && !SECRET.test(value);
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase() : null;
function parseArray(value) { try { const x = typeof value === 'string' ? JSON.parse(value) : value; return Array.isArray(x) ? x : []; } catch { return []; } }
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort(cmp).map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
const digest = value => createHash('sha256').update(canonical(value)).digest('hex');
function table(db, name) { return !!db.prepare("SELECT 1 AS present FROM sqlite_master WHERE type='table' AND name=?").get(name); }
function rows(db, name, fields, where, values, cap) {
  if (!table(db, name)) return { missing: true, items: [], truncated: false };
  const result = db.prepare(`SELECT ${fields} FROM ${name} ${where} LIMIT ?`).all(...values, cap + 1);
  return { missing: false, items: result.slice(0, cap), truncated: result.length > cap };
}
function refusal(code, detail) { const error = new Error(`${code}: ${detail}`); error.code = code; throw error; }

/**
 * A sourceManifest entry is {path,sha256} where sha256 comes from read source bytes,
 * not Git's SHA-1 blob hash. Paths are scoped to one root and never guessed.
 * This returns data only: Lane E owns HQKGX1 import and the Rust journal.
 */
export function exportWave1KbSemantic(db, {
  projectId, projectName, rootId, sourceRevision, sourceManifest = [], limit = 200,
} = {}) {
  if (!db || typeof db.prepare !== 'function') refusal('INVALID_DB', 'read-only SQLite connection required');
  if (!Number.isSafeInteger(projectId) || projectId < 1) refusal('INVALID_SCOPE', 'numeric HQ projectId is required');
  if (typeof projectName !== 'string' || !projectName.trim() || typeof rootId !== 'string' || !rootId.trim()) refusal('INVALID_SCOPE', 'projectName and rootId required');
  if (!/^[a-f0-9]{40}$/i.test(sourceRevision ?? '')) refusal('INVALID_REVISION', '40-character git source revision required');
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX) refusal('INVALID_LIMIT', '1..500');
  if (!Array.isArray(sourceManifest) || sourceManifest.length > 20000) refusal('INVALID_MANIFEST', 'bounded source manifest required');

  const manifest = new Map();
  for (const entry of sourceManifest) {
    const path = pathOf(entry?.path), hash = sha(entry?.sha256);
    if (!goodPath(path) || !hash) refusal('INVALID_MANIFEST', 'invalid source path or SHA-256');
    if (manifest.has(path) && manifest.get(path) !== hash) refusal('SOURCE_COLLISION', path);
    manifest.set(path, hash);
  }
  const project = { id: projectId, name: projectName, root: rootId, revision: sourceRevision.toLowerCase() };
  const records = [], links = [], unknowns = [];
  const seen = new Map(), docs = new Map(), bindings = [], anchorByPath = new Map();
  const missingTables = [], truncatedTables = [];
  const read = (name, fields, clause = '', args = []) => {
    const result = rows(db, name, fields, clause, args, limit);
    if (result.missing) missingTables.push(name);
    if (result.truncated) truncatedTables.push(name);
    return result.items;
  };
  const add = record => {
    const prior = seen.get(record.id);
    const encoded = canonical(record);
    if (prior !== undefined && prior !== encoded) refusal('IDENTITY_COLLISION', record.id);
    if (prior === undefined) { seen.set(record.id, encoded); records.push(record); }
  };
  const edge = (from, to, relation, evidence) => links.push({ from, to, relation, evidence });
  const locate = (p, expected) => {
    if (!goodPath(p) || !sha(expected)) return 'missing_source_pin';
    if (!manifest.has(p)) return 'unverified_source';
    return manifest.get(p) === sha(expected) ? 'verified' : 'stale_source';
  };
  const descriptor = (type, id, label, state, authority, revision, source) => ({
    id, type, label: String(label ?? '').slice(0, 160), state: String(state ?? 'unknown'),
    authority: String(authority ?? 'unknown'), revision: String(revision ?? 'unknown'),
    source, writer: type.startsWith('semantic_') ? 'hq.semantic-registry/SQLite' : 'hq.kb/SQLite',
    verifiedRuntime: false,
```

_First 80 of 175 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
