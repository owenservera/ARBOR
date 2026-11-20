# File: hq/lib/semantic-registry.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/semantic-registry.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 21765 B |
| Lines | 473 |
| Hash | cf5e1ef05cda |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SEMANTIC_REGISTRY_SCHEMA | const | 23 | yes | export const SEMANTIC_REGISTRY_SCHEMA = &#39;hq.semantic-registry/1&#39;; |
| SEMANTIC_KINDS | const | 25 | yes | export const SEMANTIC_KINDS = Object.freeze([ &#39;type&#39;, &#39;capability&#39;, &#39;action&#39;, &#39;schema&#39;, &#39;effect&#39;, &#39;event&#39;, &#39;contract&#39;, ]); |
| SEMANTIC_STATUS | const | 29 | yes | export const SEMANTIC_STATUS = Object.freeze([&#39;proposed&#39;, &#39;current&#39;, &#39;deprecated&#39;]); |
| INDEXED_ANCHOR_KINDS | const | 30 | no | const INDEXED_ANCHOR_KINDS=[&#39;type&#39;,&#39;capability&#39;,&#39;contract&#39;,&#39;emits&#39;,&#39;consumes&#39;,&#39;action&#39;]; |
| indexedSemanticAnchors | function | 34 | yes | export function indexedSemanticAnchors(db,{fileId,project,path,hash}={}){ |
| rows | const | 37 | no | const rows=db.prepare(&#39;SELECT kind,ref,line FROM annotations WHERE file_id=? AND kind IN (&#39;+ INDEXED_ANCHOR_KINDS.map(()=&gt;&#39;?&#39;).join(&#39;,&#39;)+&#39;) AND ref IS NOT NULL ORDER BY kind,ref,line&#39;) |
| groups | const | 40 | no | const groups=new Map(); |
| annotationKind | const | 43 | no | const annotationKind=row.kind.slice(3); |
| key | const | 44 | no | const key=JSON.stringify([project,path,annotationKind,row.ref]); |
| anchorId | const | 49 | no | const anchorId=&#39;hq:file-anchor:&#39;+sha256(&#39;hq.indexed-anchor/1\\0&#39;+key); |
| indexedAnnotationEvidence | function | 57 | yes | export function indexedAnnotationEvidence(anchor,resolution,{live=false,stale=false}={}){ |
| conflict | const | 58 | no | const conflict=anchor?.state===&#39;ambiguous&#39;\|\|resolution===&#39;invalid_kind&#39;; |
| freshness | const | 59 | no | const freshness=stale?&#39;stale&#39;:live?&#39;current-at-read&#39;:&#39;indexed-not-live-checked&#39;; |
| annotationResolution | function | 65 | yes | export function annotationResolution(db,id,kind){ |
| entry | const | 66 | no | const entry=getSemanticId(db,id); |
| expected | const | 67 | no | const expected=[&#39;emits&#39;,&#39;consumes&#39;].includes(kind)?[&#39;event&#39;,&#39;type&#39;,&#39;schema&#39;]:[kind]; |
| semanticAnchorChanges | function | 81 | yes | export function semanticAnchorChanges(previous,current){ |
| anchors | function | 82 | no | const anchors=value=&gt;Array.isArray(value)?value.filter(a=&gt;a&amp;&amp;typeof a.anchorId===&#39;string&#39;&amp;&amp;a.anchorId):[]; |
| before | const | 83 | no | const before=new Map(anchors(previous).map(a=&gt;[a.anchorId,a])); |
| after | const | 84 | no | const after=new Map(anchors(current).map(a=&gt;[a.anchorId,a])); |
| old | const | 86 | no | const old=before.get(anchorId),next=after.get(anchorId); |
| NAME_RE | const | 96 | no | const NAME_RE = /^[a-z0-9][a-z0-9._-]*$/; |
| VERSION_RE | const | 97 | no | const VERSION_RE = /^\\d+(\\.\\d+)*$/; |
| SECRET_BASENAMES | const | 104 | no | const SECRET_BASENAMES = new Set([ &#39;session.json&#39;, &#39;storage-state.json&#39;, &#39;release-profile.json&#39;, &#39;cookies&#39;, &#39;login data&#39;, ]); |
| compare | function | 108 | no | const compare = (a, b) =&gt; (a === b ? 0 : a &lt; b ? -1 : 1); |
| str | function | 109 | no | const str = (value) =&gt; String(value ?? &#39;&#39;).trim(); |
| blank | function | 110 | no | const blank = (value) =&gt; str(value).length === 0; |
| hasDb | function | 112 | no | function hasDb(db) { |
| boundedLimit | function | 116 | no | function boundedLimit(value, fallback = 100, maximum = 1000) { |
| n | const | 117 | no | const n = Number(value); |
| parseId | function | 123 | no | function parseId(value) { |
| id | const | 124 | no | const id = str(value); |
| at | const | 125 | no | const at = id.indexOf(&#39;@&#39;); |
| name | const | 128 | no | const name = id.slice(0, at); |
| version | const | 129 | no | const version = id.slice(at + 1); |
| isSecretSegment | function | 134 | no | function isSecretSegment(segment) { |
| name | const | 135 | no | const name = String(segment ?? &#39;&#39;).trim().toLowerCase(); |
| isSecretPath | function | 144 | no | function isSecretPath(value) { |
| path | const | 145 | no | const path = toPosix(str(value)); |
| idRow | function | 150 | no | function idRow(row) { |
| linkRow | function | 166 | no | function linkRow(row) { |
| findIdRow | function | 181 | no | function findIdRow(db, id) { |
| registerSemanticId | function | 190 | yes | export function registerSemanticId(db, entry) { |
| input | const | 191 | no | const input = entry &amp;&amp; typeof entry === &#39;object&#39; ? entry : {}; |
| parsed | const | 192 | no | const parsed = parseId(input.id); |
| id | const | 194 | no | const id = parsed.id; |
| kind | const | 195 | no | const kind = str(input.kind); |
| requested | const | 197 | no | const requested = str(input.status) \|\| &#39;proposed&#39;; |
| label | const | 202 | no | const label = blank(input.label) ? null : str(input.label).slice(0, 300); |
| description | const | 203 | no | const description = blank(input.description) ? null : str(input.description).slice(0, 4000); |
| authority | const | 204 | no | const authority = blank(input.authority) ? &#39;project_observed&#39; : str(input.authority).slice(0, 120); |
| provenance | const | 205 | no | const provenance = blank(input.provenance) ? null : str(input.provenance).slice(0, 1000); |
| existing | const | 208 | no | const existing = findIdRow(db, id); |
| same | const | 210 | no | const same = existing.kind === kind |
| promoteSemanticId | function | 227 | yes | export function promoteSemanticId(db, id, options) { |
| target | const | 228 | no | const target = str(id); |
| ownerConfirmed | const | 229 | no | const ownerConfirmed = (options ?? {}).ownerConfirmed === true; |
| parsed | const | 231 | no | const parsed = parseId(target); |
| existing | const | 236 | no | const existing = findIdRow(db, target); |
| deprecateSemanticId | function | 248 | yes | export function deprecateSemanticId(db, id, options) { |
| target | const | 249 | no | const target = str(id); |
| ownerConfirmed | const | 250 | no | const ownerConfirmed = (options ?? {}).ownerConfirmed === true; |
| parsed | const | 252 | no | const parsed = parseId(target); |
| existing | const | 257 | no | const existing = findIdRow(db, target); |
| getSemanticId | function | 268 | yes | export function getSemanticId(db, id) { |
| target | const | 269 | no | const target = str(id); |
| listSemanticIds | function | 275 | yes | export function listSemanticIds(db, options) { |
| params | const | 279 | no | const params = []; |
| rows | const | 283 | no | const rows = db.prepare( `SELECT * FROM semantic_id ${where.length ? `WHERE ${where.join(&#39; AND &#39;)}` : &#39;&#39;}`, ).all(...params); |
| registerSemanticAlias | function | 293 | yes | export function registerSemanticAlias(db, entry) { |
| name | const | 295 | no | const name = str(alias); |
| target | const | 297 | no | const target = str(targetId); |
| label | const | 303 | no | const label = blank(kind) ? null : str(kind).slice(0, 120); |
| existing | const | 304 | no | const existing = db.prepare(&#39;SELECT * FROM semantic_alias WHERE alias = ? AND target_id = ?&#39;).get(name, target); |
| listSemanticAliases | function | 318 | yes | export function listSemanticAliases(db) { |
| resolveSemanticAlias | function | 333 | yes | export function resolveSemanticAlias(db, phrase, options) { |
| prefix | const | 334 | no | const prefix = (options ?? {}).prefix === true; |
| rows | variable | 335 | no | let rows = []; |
| aliases | const | 337 | no | const aliases = listSemanticAliases(db); |
| index | const | 342 | no | const index = { schema: &#39;hq.semantic-optimizers/1&#39;, rows }; |
| result | const | 343 | no | const result = resolveAlias(index, phrase, { prefix }); |
| linkSemanticSource | function | 348 | yes | export function linkSemanticSource(db, link) { |
| input | const | 349 | no | const input = link &amp;&amp; typeof link === &#39;object&#39; ? link : {}; |
| semanticId | const | 350 | no | const semanticId = str(input.semanticId); |
| path | const | 351 | no | const path = str(input.path); |
| id | const | 352 | no | const id = str(input.id) \|\| `${semanticId}::${path}`; |
| line | const | 359 | no | const line = Number.isSafeInteger(input.line) &amp;&amp; input.line &gt; 0 ? input.line : null; |
| symbol | const | 360 | no | const symbol = blank(input.symbol) ? null : str(input.symbol).slice(0, 300); |
| contentHash | const | 361 | no | const contentHash = blank(input.contentHash) ? null : str(input.contentHash); |
| kind | const | 362 | no | const kind = blank(input.kind) ? null : str(input.kind).slice(0, 120); |
| existing | const | 363 | no | const existing = db.prepare(&#39;SELECT * FROM semantic_link WHERE id = ?&#39;).get(id); |
| same | const | 365 | no | const same = (existing.line ?? null) === line |
| listSemanticLinks | function | 389 | yes | export function listSemanticLinks(db, options) { |
| rows | const | 393 | no | const rows = blank(semanticId) |
| detectSemanticDrift | function | 407 | yes | export function detectSemanticDrift(db, options) { |
| root | const | 408 | no | const root = (options ?? {}).root ?? null; |
| base | const | 409 | no | const base = root ? resolve(str(root)) : process.cwd(); |
| links | variable | 410 | no | let links = []; |
| records | const | 416 | no | const records = links.map((row) =&gt; { const raw = str(row.path); const abs = raw &amp;&amp; isAbsolute(raw) ? raw : resolve(base, raw); let exists = false; let actual = null; |
| raw | const | 417 | no | const raw = str(row.path); |
| abs | const | 418 | no | const abs = raw &amp;&amp; isAbsolute(raw) ? raw : resolve(base, raw); |
| exists | variable | 419 | no | let exists = false; |
| actual | variable | 420 | no | let actual = null; |
| result | const | 437 | no | const result = detectDrift(records); |
| enforcementPoints | function | 454 | yes | export function enforcementPoints(operation) { |
| op | const | 455 | no | const op = str(operation); |
| byOperation | const | 456 | no | const byOperation = { |
| points | const | 467 | no | const points = byOperation[op] ?? []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 17 | external |
| node:path | import | 18 | external |
| ./util.mjs | import | 19 | [hq/lib/util.mjs](./util.mjs.md) |
| ./annotation-v2.mjs | import | 20 | [hq/lib/annotation-v2.mjs](./annotation-v2.mjs.md) |
| ./semantic-optimizers.mjs | import | 21 | [hq/lib/semantic-optimizers.mjs](./semantic-optimizers.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-017-authorization-enforcement.mjs](../aii/fixtures/HQ-017-authorization-enforcement.mjs.md) | ../../lib/semantic-registry.mjs |
| [hq/aii/fixtures/HQ-057-authoritative-repo.mjs](../aii/fixtures/HQ-057-authoritative-repo.mjs.md) | ../../lib/semantic-registry.mjs |
| [hq/aii/fixtures/HQ-095-unknowns-investigation.mjs](../aii/fixtures/HQ-095-unknowns-investigation.mjs.md) | ../../lib/semantic-registry.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/semantic-registry.mjs |
| [hq/lib/arbor-service.mjs](./arbor-service.mjs.md) | ./semantic-registry.mjs |
| [hq/lib/comment-wiki-bridge.mjs](./comment-wiki-bridge.mjs.md) | ./semantic-registry.mjs |
| [hq/lib/indexer.mjs](./indexer.mjs.md) | ./semantic-registry.mjs |
| [hq/lib/search.mjs](./search.mjs.md) | ./semantic-registry.mjs |
| [hq/test/revision-cache-lifecycle.test.mjs](../test/revision-cache-lifecycle.test.mjs.md) | ../lib/semantic-registry.mjs |
| [hq/test/semantic-registry.test.mjs](../test/semantic-registry.test.mjs.md) | ../lib/semantic-registry.mjs |
| [hq/test/semantic-source-context.test.mjs](../test/semantic-source-context.test.mjs.md) | ../lib/semantic-registry.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Versioned stable semantic IDs (`name@version`) for types, |
| 6 | owner | hq | — | hq |
| 7 | task | — | — | semantic-registry-v1 |
| 8 | invariant | — | — | No network, no timers, no random source, no browser effects. |
| 9 | invariant | — | — | A record never grants execution authority. `proposed` becomes |
| 11 | invariant | — | — | Bad user input fails closed: every exported function returns |
| 13 | invariant | — | — | Deprecation and lookup retain rows. History is never deleted. |
| 14 | see | — | hq/lib/semantic-optimizers.mjs | hq/lib/semantic-optimizers.mjs |
| 15 | see | — | docs/research/semantic-language-kernel/CONTRACT-AND-ROADMAP.md | docs/research/semantic-language-kernel/CONTRACT-AND-ROADMAP.md |

## Excerpt

```javascript
/**
 * @hq:context Versioned stable semantic IDs (`name@version`) for types,
 *   capabilities, actions, schemas, effects, events and contracts, with
 *   aliases and source anchors. The upgradability backbone: a type can evolve
 *   without breaking references.
 * @hq:owner hq
 * @hq:task semantic-registry-v1
 * @hq:invariant No network, no timers, no random source, no browser effects.
 * @hq:invariant A record never grants execution authority. `proposed` becomes
 *   `current` only through an explicit owner confirmation; nothing auto-promotes.
 * @hq:invariant Bad user input fails closed: every exported function returns
 *   `{ ok: false, reason }` or a safe empty result, and never throws.
 * @hq:invariant Deprecation and lookup retain rows. History is never deleted.
 * @hq:see hq/lib/semantic-optimizers.mjs
 * @hq:see docs/research/semantic-language-kernel/CONTRACT-AND-ROADMAP.md
 */
import { statSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { nowISO, sha256, sha256File, toPosix } from './util.mjs';
import { isVersionedId } from './annotation-v2.mjs';
import { buildAliasIndex, detectDrift, resolveAlias } from './semantic-optimizers.mjs';

export const SEMANTIC_REGISTRY_SCHEMA = 'hq.semantic-registry/1';

export const SEMANTIC_KINDS = Object.freeze([
  'type', 'capability', 'action', 'schema', 'effect', 'event', 'contract',
]);

export const SEMANTIC_STATUS = Object.freeze(['proposed', 'current', 'deprecated']);
const INDEXED_ANCHOR_KINDS=['type','capability','contract','emits','consumes','action'];
// The v2 parser proves comment occurrences, not AST ownership. Identity is
// scoped to project/path/tag/semantic ID, not line, row ID or guessed symbol.
// A source move is removal plus addition. Repeated occurrences are ambiguous.
export function indexedSemanticAnchors(db,{fileId,project,path,hash}={}){
  if(!Number.isSafeInteger(fileId)||typeof project!=='string'||typeof path!=='string'||
      isSecretPath(path)||typeof hash!=='string'||!(/^[a-f0-9]{64}$/).test(hash))return [];
  const rows=db.prepare('SELECT kind,ref,line FROM annotations WHERE file_id=? AND kind IN ('+
    INDEXED_ANCHOR_KINDS.map(()=>'?').join(',')+') AND ref IS NOT NULL ORDER BY kind,ref,line')
    .all(fileId,...INDEXED_ANCHOR_KINDS.map(k=>'v2:'+k));
  const groups=new Map();
  for(const row of rows){
    if(!isVersionedId(row.ref))continue;
    const annotationKind=row.kind.slice(3);
    const key=JSON.stringify([project,path,annotationKind,row.ref]);
    if(!groups.has(key))groups.set(key,{semanticId:row.ref,annotationKind,lines:[]});
    groups.get(key).lines.push(row.line);
  }
  return [...groups].map(([key,group])=>{
    const anchorId='hq:file-anchor:'+sha256('hq.indexed-anchor/1\0'+key);
    return {anchorId,...group,granularity:'file-conservative',
      state:group.lines.length===1?'indexed':'ambiguous',
      fingerprint:sha256('hq.indexed-anchor-fingerprint/1\0'+JSON.stringify([anchorId,hash,group.lines])),
      contentHash:hash};
  }).sort((a,b)=>compare(a.anchorId,b.anchorId));
}
// Registration lifecycle is vocabulary governance, not evidence of behavior.
export function indexedAnnotationEvidence(anchor,resolution,{live=false,stale=false}={}){
  const conflict=anchor?.state==='ambiguous'||resolution==='invalid_kind';
  const freshness=stale?'stale':live?'current-at-read':'indexed-not-live-checked';
  return {origin:'extracted',assurance:conflict?'contradicted':live&&!stale&&anchor?.state==='indexed'?'verified':'proposed',
    claim:'annotation-occurrence',freshness,conflict,
    anchorId:anchor?.anchorId??null,fingerprint:anchor?.fingerprint??null,
    resolution,planningEligible:false};
}
export function annotationResolution(db,id,kind){
  const entry=getSemanticId(db,id);
  const expected=['emits','consumes'].includes(kind)?['event','type','schema']:[kind];
  return {entry,resolution:!entry?'unknown':!expected.includes(entry.kind)?'invalid_kind':entry.status};
}
/**
 * semanticAnchorChanges — diff two index-time anchor projections.
 *
 * Identity is the anchor's stable id; a change record carries the content
 * revision it was computed against (`contentHash`) and the one it replaces
 * (`previousContentHash`), so a revision-fenced consumer can pin a tombstone to
 * the bytes that were actually scanned instead of re-deriving them. Unchanged
 * anchors produce nothing, so only dependent outputs are invalidated.
 *
 * Malformed input fails closed as an empty delta; this never throws.
 */
```

_First 80 of 474 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
