# File: hq/catalogue-identity/crosswalk.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/catalogue-identity/crosswalk.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18391 B |
| Lines | 294 |
| Hash | 93cc7ec06e3b |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SCHEMA | const | 14 | yes | export const SCHEMA = &#39;hq.catalogue-crosswalk/1&#39;; |
| RECORD_TYPES | const | 15 | yes | export const RECORD_TYPES = Object.freeze([ &#39;capability&#39;, &#39;tracker&#39;, &#39;implementation&#39;, &#39;file&#39;, &#39;consumer&#39;, &#39;algorithm&#39;, &#39;test&#39;, &#39;research&#39;, &#39;release&#39;, &#39;deployment&#39;, &#39;schema&#39;, &#39;catalogue&#39;, ]); |
| LINK_TYPES | const | 19 | yes | export const LINK_TYPES = Object.freeze([ &#39;implements&#39;, &#39;tracks&#39;, &#39;consumes&#39;, &#39;tests&#39;, &#39;researches&#39;, &#39;releases&#39;, &#39;deploys&#39;, &#39;depends_on&#39;, &#39;documents&#39;, &#39;references&#39;, &#39;equivalent_candidate&#39;, ]); |
| EVIDENCE_TYPES | const | 23 | yes | export const EVIDENCE_TYPES = Object.freeze([ &#39;source_record&#39;, &#39;source_file&#39;, &#39;test_result&#39;, &#39;research&#39;, &#39;release&#39;, &#39;deployment&#39;, &#39;runtime_receipt&#39;, &#39;owner_decision&#39;, ]); |
| COMPARE | function | 27 | no | const COMPARE = (a, b) =&gt; a &lt; b ? -1 : a &gt; b ? 1 : 0; |
| SORT | function | 28 | no | const SORT = (a, b) =&gt; COMPARE(a.id, b.id); |
| KEY_PATTERN | const | 29 | no | const KEY_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9:._@/+#-]{0,239}$/; |
| CANON_PATTERN | const | 30 | no | const CANON_PATTERN = /^(?:cap:[a-z0-9][a-z0-9.-]*\|[a-z0-9][a-z0-9._-]*@\\d+(?:\\.\\d+)*)$/; |
| SECRET | const | 31 | no | const SECRET = /(^\|[/\\\\])(?:\\.env[^/\\\\]*\|[^/\\\\]+\\.env\|[^/\\\\]+\\.(?:keystore\|pem\|p12)\|session\\.json\|storage-state\\.json\|release-profile\\.json\|cookies\|login data)(?:[/\\\\]\|$)/i; |
| BAD | const | 32 | no | const BAD = new Set([&#39;secret&#39;, &#39;restricted&#39;, &#39;credential&#39;]); |
| STOP | const | 33 | no | const STOP = new Set(&#39;the a an and or of to in for with by on from into new old one existing current future system feature capability tool ability proposed actual journey&#39;.split(&#39; &#39;)); |
| SEMANTIC_TYPES | const | 34 | no | const SEMANTIC_TYPES = new Set([&#39;capability&#39;,&#39;tracker&#39;,&#39;implementation&#39;,&#39;consumer&#39;,&#39;algorithm&#39;,&#39;research&#39;,&#39;schema&#39;]); |
| MAX_RECORDS | const | 35 | no | const MAX_RECORDS = 100000; |
| MAX_PAIRS | const | 36 | no | const MAX_PAIRS = 15000; |
| MAX_DUPLICATES | const | 37 | no | const MAX_DUPLICATES = 10000; |
| sha | function | 39 | no | const sha = (x) =&gt; createHash(&#39;sha256&#39;).update(x).digest(&#39;hex&#39;); |
| digest | function | 40 | no | const digest = (x) =&gt; sha(JSON.stringify(stable(x))); |
| stable | function | 41 | no | function stable(x) { |
| text | function | 46 | no | function text(x, field, limit = 1000) { |
| key | function | 50 | no | function key(x, field) { const v = text(x, field, 240); if (!KEY_PATTERN.test(v)) throw new Error(`invalid_${field}`); return v; } |
| safeRef | function | 51 | no | function safeRef(x, field) { |
| v | const | 52 | no | const v = text(x, field, 2048); |
| sourceKey | function | 56 | no | function sourceKey(sourceId, sourceItemId) { return `row:${sha(`${sourceId}\\0${sourceItemId}`).slice(0, 32)}`; } |
| stableRecordId | const | 57 | yes | export const stableRecordId = sourceKey; |
| normalized | function | 58 | no | const normalized = x =&gt; String(x).normalize(&#39;NFKC&#39;).toLowerCase().replace(/[^\\p{L}\\p{N}]+/gu, &#39; &#39;).trim().replace(/\\s+/g, &#39; &#39;); |
| tokens | function | 59 | no | const tokens = x =&gt; new Set(normalized(x).split(&#39; &#39;).filter(t =&gt; t.length &gt; 2 &amp;&amp; !STOP.has(t))); |
| intersection | function | 60 | no | function intersection(a, b) { let n = 0; for (const t of a) if (b.has(t)) n++; return n; } |
| pairId | function | 61 | no | const pairId = (a, b) =&gt; `pair:${sha([a,b].sort(COMPARE).join(&#39;\\0&#39;)).slice(0,32)}`; |
| date | function | 62 | no | function date(x, field) { const v = text(x, field, 40); if (!/^\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d(?:\\.\\d{1,3})?Z$/.test(v) \|\| !Number.isFinite(Date.parse(v))) throw new Error(`invalid_${field}`); return … |
| evidenceRow | function | 63 | no | function evidenceRow(ev, owner, revision) { |
| ref | const | 65 | no | const ref = safeRef(ev.ref, &#39;evidence_ref&#39;); |
| id | const | 66 | no | const id = `ev:${sha(`${owner}\\0${ev.kind}\\0${ref}\\0${revision}`).slice(0,32)}`; |
| unique | function | 69 | no | function unique(items, field) { |
| map | const | 70 | no | const map = new Map(); |
| old | const | 72 | no | const old = map.get(item.id); |
| readSources | function | 78 | no | function readSources(input) { |
| sources | const | 79 | no | const sources = (input.sources ?? []).map(raw =&gt; { const id = key(raw.id, &#39;source_id&#39;); const revision = text(raw.revision, &#39;source_revision&#39;, 60); if (!/^[a-f0-9]{40}$/.test(revision)) throw new Err… |
| id | const | 80 | no | const id = key(raw.id, &#39;source_id&#39;); |
| revision | const | 81 | no | const revision = text(raw.revision, &#39;source_revision&#39;, 60); |
| completeness | const | 83 | no | const completeness = raw.completeness ?? &#39;partial&#39;; |
| readRecord | function | 91 | no | function readRecord(raw, source) { |
| source_item_id | const | 92 | no | const source_item_id = key(raw.source_item_id, &#39;source_item_id&#39;); |
| id | const | 93 | no | const id = sourceKey(source.id, source_item_id); |
| canonical_id | const | 95 | no | const canonical_id = raw.canonical_id == null ? null : text(raw.canonical_id, &#39;canonical_id&#39;, 240); |
| evidence | const | 99 | no | const evidence = (raw.evidence ?? []).map(e =&gt; evidenceRow(e, id, source.revision)); |
| links | const | 100 | no | const links = (raw.links ?? []).map(l =&gt; { const target_source_id = key(l.target_source_id, &#39;target_source_id&#39;); const target_item_id = key(l.target_item_id, &#39;target_item_id&#39;); if (!LINK_TYPES.includ… |
| target_source_id | const | 101 | no | const target_source_id = key(l.target_source_id, &#39;target_source_id&#39;); |
| target_item_id | const | 102 | no | const target_item_id = key(l.target_item_id, &#39;target_item_id&#39;); |
| tombstone | variable | 108 | no | let tombstone = null; |
| readDecisions | function | 124 | no | function readDecisions(items, known) { |
| left | const | 127 | no | const left = key(x.left, &#39;decision_left&#39;), right = key(x.right, &#39;decision_right&#39;); |
| id | const | 129 | no | const id = pairId(left,right); |
| reviewer | const | 130 | no | const reviewer = safeRef(x.reviewer, &#39;reviewer&#39;); |
| evidence_ref | const | 131 | no | const evidence_ref = safeRef(x.evidence_ref,&#39;decision_evidence&#39;); |
| candidates | function | 137 | no | function candidates(records, decisions) { |
| groups | const | 138 | no | const groups = new Map(), candidateMap = new Map(); |
| usable | const | 139 | no | const usable = records.filter(r =&gt; !r.tombstone &amp;&amp; r.visibility === &#39;observed&#39;); |
| k | const | 141 | no | const k = `${r.type}\\0${normalized(r.name)}`; |
| truncatedDuplicates | variable | 145 | no | let truncatedDuplicates = false; |
| add | function | 146 | no | const add = (a,b,kind,score,reason) =&gt; { |
| id | const | 149 | no | const id = pairId(a.id,b.id), old=candidateMap.get(id); |
| index | const | 157 | no | const index=new Map(); let budget=MAX_PAIRS; |
| ts | const | 160 | no | const ts=tokens(r.name); if (ts.size&lt;2) continue; |
| seen | const | 161 | no | const seen=new Set(); |
| ps | const | 167 | no | const ps=tokens(prior.name), overlap=intersection(ts,ps); |
| score | const | 168 | no | const score=overlap / (ts.size+ps.size-overlap); |
| lookup | const | 173 | no | const lookup=new Map(decisions.map(d=&gt;[d.id,d])); |
| result | const | 174 | no | const result=[...candidateMap.values()].sort(SORT).map(c=&gt;({ ...c, decision:lookup.get(c.id)??null, disposition:lookup.has(c.id) ? lookup.get(c.id).decision : &#39;review_required&#39;, })); |
| findings | function | 180 | no | function findings(records, links, sources, at) { |
| map | const | 181 | no | const map=new Map(records.map(r=&gt;[r.id,r])); |
| children | const | 182 | no | const children=new Map(); |
| out | const | 189 | no | const out=[]; |
| add | function | 190 | no | const add=(kind,row,reason,certainty=&#39;candidate&#39;,extra={}) =&gt; out.push({ id:`finding:${sha(`${kind}\\0${row.id}\\0${reason}`).slice(0,32)}`,kind,record_id:row.id, certainty,reason,source_revision:row.s… |
| complete | const | 193 | no | const complete=new Map(sources.map(s=&gt;[s.id,s.completeness===&#39;complete&#39;])); |
| peers | const | 197 | no | const peers=[...(children.get(r.id)??[])].map(id=&gt;map.get(id)); |
| linkedType | function | 198 | no | const linkedType=(...types)=&gt;peers.some(p=&gt;types.includes(p.type) &amp;&amp; !p.tombstone &amp;&amp; p.visibility===&#39;observed&#39;); |
| certainty | const | 199 | no | const certainty=complete.get(r.source_id) ? &#39;candidate&#39; : &#39;unknown&#39;; |
| row | const | 207 | no | const row=map.get(e.from); |
| buildCrosswalk | function | 216 | yes | export function buildCrosswalk(input) { |
| as_of | const | 219 | no | const as_of=date(input.as_of,&#39;as_of&#39;); |
| sources | const | 220 | no | const sources=readSources(input), bySource=new Map(sources.map(s=&gt;[s.id,s])); |
| current | const | 221 | no | const current=unique(input.records.map(raw=&gt;{ const sid=key(raw.source_id,&#39;record_source_id&#39;), source=bySource.get(sid); if (!source \|\| source.completeness===&#39;missing&#39;) throw new Error(&#39;record_source… |
| sid | const | 222 | no | const sid=key(raw.source_id,&#39;record_source_id&#39;), source=bySource.get(sid); |
| recordMap | const | 226 | no | const recordMap=new Map(current.map(r=&gt;[r.id,r])); |
| previous | const | 227 | no | const previous=input.previous?.schema===SCHEMA ? input.previous : null; |
| sourceSet | const | 234 | no | const sourceSet=new Map(sources.map(s=&gt;[s.id,s])); |
| retained | const | 235 | no | const retained=[];const missing=[]; |
| source | const | 238 | no | const source=sourceSet.get(old.source_id); |
| visibility | const | 240 | no | const visibility=source?.completeness===&#39;missing&#39;\|\|!source ? &#39;source_unavailable&#39; : &#39;unobserved&#39;; |
| row | const | 241 | no | const row={...old,visibility}; |
| records | const | 245 | no | const records=unique([...current,...retained], &#39;record&#39;); |
| known | const | 246 | no | const known=new Set(records.map(r=&gt;r.id)); |
| decisions | const | 247 | no | const decisions=readDecisions(input.decisions??[],known); |
| evidence | const | 248 | no | const evidence=unique(records.flatMap(r=&gt;r.evidence??[]),&#39;evidence&#39;); |
| edges | const | 249 | no | const edges=unique(records.flatMap(r=&gt;r.links??[]),&#39;edge&#39;); |
| entityLinks | const | 250 | no | const entityLinks=records.filter(r=&gt;r.canonical_id).map(r=&gt;({ id:`edge:${sha(`${r.id}\\0${r.canonical_id}`).slice(0,32)}`, from:r.id,to:r.canonical_id,relation:&#39;identifies&#39;,confidence:1,origin:&#39;source… |
| allEdges | const | 254 | no | const allEdges=unique([...edges,...entityLinks],&#39;edge&#39;); |
| duplicate | const | 255 | no | const duplicate=candidates(records,decisions); |
| conflicts | const | 256 | no | const conflicts=[];const byCanonical=new Map(); |
| orphanFindings | const | 266 | no | const orphanFindings=findings(records,edges,sources,as_of); |
| previousMap | const | 267 | no | const previousMap=new Map((previous?.records??[]).map(r=&gt;[r.id,r])); |
| delta | const | 268 | no | const delta={added:[],changed:[],unchanged:[],retained_unobserved:[],tombstoned:[]}; |
| old | const | 272 | no | const old=previousMap.get(r.id); |
| counts | const | 277 | no | const counts={source_count:sources.length,source_missing:sources.filter(s=&gt;s.completeness===&#39;missing&#39;).length, |
| body | const | 285 | no | const body={schema:SCHEMA,as_of,sources,records,edges:allEdges,evidence,decisions, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 12 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/catalogue-identity/cli.mjs](./cli.mjs.md) | ./crosswalk.mjs |
| [hq/catalogue-identity/labs-adapter.mjs](./labs-adapter.mjs.md) | ./crosswalk.mjs |
| [hq/catalogue-identity/observer-export.mjs](./observer-export.mjs.md) | ./crosswalk.mjs |
| [hq/catalogue-identity/test/benchmark.mjs](./test/benchmark.mjs.md) | ../crosswalk.mjs |
| [hq/catalogue-identity/test/crosswalk.test.mjs](./test/crosswalk.test.mjs.md) | ../crosswalk.mjs |
| [hq/version-intelligence/identity/legacy-adapters.mjs](../version-intelligence/identity/legacy-adapters.mjs.md) | ../../catalogue-identity/crosswalk.mjs |
| [hq/version-intelligence/identity/test/identity.test.mjs](../version-intelligence/identity/test/identity.test.mjs.md) | ../../../catalogue-identity/crosswalk.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Lane C4-B deterministic, read-only catalogue identity and orphan projection. |
| 4 | owner | repos-hq | — | repos-hq |
| 5 | task | — | — | VIVIM-WAVE-C4-LANE-B |
| 6 | invariant | — | — | Source IDs, owner authority, and tombstones are never invented or auto-promoted. |
| 7 | invariant | — | — | A candidate duplicate is not a merged entity; missing sources cannot delete facts. |
| 8 | invariant | — | — | No files, network, database, browser, provider API or Host effects. |
| 9 | see | — | hq/lib/semantic-registry.mjs | hq/lib/semantic-registry.mjs |
| 10 | see | — | research/agentic-knowledge-graph/HQKG-INTEGRATION.md | research/agentic-knowledge-graph/HQKG-INTEGRATION.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Lane C4-B deterministic, read-only catalogue identity and orphan projection.
 * @hq:owner repos-hq
 * @hq:task VIVIM-WAVE-C4-LANE-B
 * @hq:invariant Source IDs, owner authority, and tombstones are never invented or auto-promoted.
 * @hq:invariant A candidate duplicate is not a merged entity; missing sources cannot delete facts.
 * @hq:invariant No files, network, database, browser, provider API or Host effects.
 * @hq:see hq/lib/semantic-registry.mjs
 * @hq:see research/agentic-knowledge-graph/HQKG-INTEGRATION.md
 */
import { createHash } from 'node:crypto';

export const SCHEMA = 'hq.catalogue-crosswalk/1';
export const RECORD_TYPES = Object.freeze([
  'capability', 'tracker', 'implementation', 'file', 'consumer', 'algorithm',
  'test', 'research', 'release', 'deployment', 'schema', 'catalogue',
]);
export const LINK_TYPES = Object.freeze([
  'implements', 'tracks', 'consumes', 'tests', 'researches', 'releases',
  'deploys', 'depends_on', 'documents', 'references', 'equivalent_candidate',
]);
export const EVIDENCE_TYPES = Object.freeze([
  'source_record', 'source_file', 'test_result', 'research', 'release',
  'deployment', 'runtime_receipt', 'owner_decision',
]);
const COMPARE = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const SORT = (a, b) => COMPARE(a.id, b.id);
const KEY_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9:._@/+#-]{0,239}$/;
const CANON_PATTERN = /^(?:cap:[a-z0-9][a-z0-9.-]*|[a-z0-9][a-z0-9._-]*@\d+(?:\.\d+)*)$/;
const SECRET = /(^|[/\\])(?:\.env[^/\\]*|[^/\\]+\.env|[^/\\]+\.(?:keystore|pem|p12)|session\.json|storage-state\.json|release-profile\.json|cookies|login data)(?:[/\\]|$)/i;
const BAD = new Set(['secret', 'restricted', 'credential']);
const STOP = new Set('the a an and or of to in for with by on from into new old one existing current future system feature capability tool ability proposed actual journey'.split(' '));
const SEMANTIC_TYPES = new Set(['capability','tracker','implementation','consumer','algorithm','research','schema']);
const MAX_RECORDS = 100000;
const MAX_PAIRS = 15000;
const MAX_DUPLICATES = 10000;

const sha = (x) => createHash('sha256').update(x).digest('hex');
const digest = (x) => sha(JSON.stringify(stable(x)));
function stable(x) {
  if (Array.isArray(x)) return x.map(stable);
  if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort(COMPARE).map(k => [k, stable(x[k])]));
  return x;
}
function text(x, field, limit = 1000) {
  if (typeof x !== 'string' || !x.trim() || x.length > limit || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(x)) throw new Error(`invalid_${field}`);
  return x.trim();
}
function key(x, field) { const v = text(x, field, 240); if (!KEY_PATTERN.test(v)) throw new Error(`invalid_${field}`); return v; }
function safeRef(x, field) {
  const v = text(x, field, 2048);
  if (SECRET.test(v) || v.includes('..\\') || v.includes('../') || /(?:token|password|authorization|api[_-]?key)=/i.test(v)) throw new Error(`unsafe_${field}`);
  return v;
}
function sourceKey(sourceId, sourceItemId) { return `row:${sha(`${sourceId}\0${sourceItemId}`).slice(0, 32)}`; }
export const stableRecordId = sourceKey;
const normalized = x => String(x).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
const tokens = x => new Set(normalized(x).split(' ').filter(t => t.length > 2 && !STOP.has(t)));
function intersection(a, b) { let n = 0; for (const t of a) if (b.has(t)) n++; return n; }
const pairId = (a, b) => `pair:${sha([a,b].sort(COMPARE).join('\0')).slice(0,32)}`;
function date(x, field) { const v = text(x, field, 40); if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(v) || !Number.isFinite(Date.parse(v))) throw new Error(`invalid_${field}`); return v; }
function evidenceRow(ev, owner, revision) {
  if (!ev || !EVIDENCE_TYPES.includes(ev.kind)) throw new Error('invalid_evidence_kind');
  const ref = safeRef(ev.ref, 'evidence_ref');
  const id = `ev:${sha(`${owner}\0${ev.kind}\0${ref}\0${revision}`).slice(0,32)}`;
  return { id, kind: ev.kind, ref, source_revision: revision, status: ev.status ?? 'observed', source_record: owner };
}
function unique(items, field) {
  const map = new Map();
  for (const item of items) {
    const old = map.get(item.id);
    if (old && digest(old) !== digest(item)) throw new Error(`conflicting_${field}_id:${item.id}`);
    map.set(item.id, item);
  }
  return [...map.values()].sort(SORT);
}
function readSources(input) {
  const sources = (input.sources ?? []).map(raw => {
    const id = key(raw.id, 'source_id');
```

_First 80 of 295 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
