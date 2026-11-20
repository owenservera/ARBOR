# File: studio/src/intel/discover.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/discover.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 32000 B |
| Lines | 480 |
| Hash | 92d51429681a |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| h | function | 13 | no | const h = (s) =&gt; createHash(&#39;sha1&#39;).update(s).digest(&#39;hex&#39;).slice(0, 10); |
| isObj | function | 14 | no | const isObj = (v) =&gt; v &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); |
| VAL_CAP | const | 15 | no | const VAL_CAP = 5000; |
| looksDynamicKeys | function | 21 | no | function looksDynamicKeys(o) { |
| ks | const | 22 | no | const ks = Object.keys(o); |
| collectInstances | function | 26 | no | function collectInstances(value, path, out, prov, depth = 0) { |
| list | const | 31 | no | const list = out.get(path) ?? []; |
| provenance | const | 32 | no | const provenance = { ...prov, path, location: prov.location ?? path }; |
| sh | const | 39 | no | const sh = shapeKey(value); |
| isEnvelope | function | 48 | no | function isEnvelope(schema) { |
| f | const | 49 | no | const f = schema.fields ?? {}; |
| names | const | 50 | no | const names = Object.keys(f); |
| objectChildren | const | 52 | no | const objectChildren = names.filter((n) =&gt; f[n].type === &#39;object&#39; \|\| f[n].type === &#39;map&#39; \|\| f[n].type === &#39;array&#39;); |
| scalars | const | 53 | no | const scalars = names.filter((n) =&gt; !objectChildren.includes(n)); |
| discoverModel | function | 60 | yes | export function discoverModel(corpus, { learner = new ScopedLearner(), ctx = {}, families = [], patchGroups = new Set() } = {}) { |
| t0 | const | 61 | no | const t0 = Date.now(); |
| groups | const | 62 | no | const groups = new Map(); |
| candidates | const | 65 | no | const candidates = []; |
| positions | const | 68 | no | const positions = new Map(); |
| schemaNode | const | 71 | no | const schemaNode = new SchemaNode(); |
| schema | const | 73 | no | const schema = schemaNode.describe(p); |
| nFields | const | 75 | no | const nFields = Object.keys(schema.fields).length; |
| types | const | 83 | no | const types = candidates.map((c) =&gt; buildType(c, learner, ctx)); |
| kept | const | 86 | no | const kept = types.filter((t) =&gt; t.path.endsWith(&#39;[*]&#39;) \|\| t.path === &#39;$&#39; \|\| t.key \|\| t.fields.length &gt;= 4); |
| merged | const | 90 | no | const merged = mergeTypes(kept, learner, ctx); |
| relationships | const | 96 | no | const relationships = [...composition(merged), ...references(merged)]; |
| modelled | const | 102 | no | const modelled = new Set(merged.flatMap((t) =&gt; t.groups)); |
| unmodelled | const | 103 | no | const unmodelled = [...groups.keys()].filter((g) =&gt; !modelled.has(g) &amp;&amp; !patchGroups.has(g)).map((g) =&gt; ({ group: g, samples: groups.get(g).length, reason: &#39;no repeated multi-field object found (scal… |
| buildType | function | 108 | no | function buildType(c, learner, ctx) { |
| typeKey | const | 110 | no | const typeKey = `${c.group}\|${c.path}`; |
| fields | const | 111 | no | const fields = Object.entries(schema.fields).map(([name, d]) =&gt; { const pr = learner.predict(name, d, { ...ctx, typeKey, inArray: c.path.endsWith(&#39;[*]&#39;) }); return { name, path: `$.${name}`, type: d.… |
| pr | const | 112 | no | const pr = learner.predict(name, d, { ...ctx, typeKey, inArray: c.path.endsWith(&#39;[*]&#39;) }); |
| key | const | 115 | no | const key = inferKey(fields, instances); |
| name | const | 117 | no | const name = suggestName(c, fields); |
| support | const | 118 | no | const support = instances.length; |
| consistency | const | 119 | no | const consistency = fields.reduce((a, f) =&gt; a + (f.presence ?? 1), 0) / Math.max(1, fields.length); |
| roleCertainty | const | 120 | no | const roleCertainty = fields.reduce((a, f) =&gt; a + f.roleConfidence, 0) / Math.max(1, fields.length); |
| confidence | const | 121 | no | const confidence = +(0.3 * Math.min(1, Math.log2(1 + support) / 5) + 0.25 * (key ? key.score : 0.3) + 0.25 * consistency + 0.2 * roleCertainty).toFixed(3); |
| CODE_LIKE | const | 135 | no | const CODE_LIKE = /^[A-Za-z0-9][A-Za-z0-9_.:\\-/#]{0,63}$/; |
| valueShape | function | 137 | no | function valueShape(f, vals) { |
| strs | const | 141 | no | const strs = vals.filter((v) =&gt; typeof v === &#39;string&#39;); |
| code | const | 143 | no | const code = strs.filter((v) =&gt; CODE_LIKE.test(v)).length / strs.length; |
| avgLen | const | 144 | no | const avgLen = strs.reduce((a, v) =&gt; a + v.length, 0) / strs.length; |
| inferKey | function | 149 | yes | export function inferKey(fields, instances) { |
| N | const | 150 | no | const N = instances.length; |
| parentOf | function | 151 | no | const parentOf = (i) =&gt; `${i.prov.sid ?? &#39;&#39;}\|${i.prov.seq ?? &#39;&#39;}\|${i.prov.t ?? &#39;&#39;}\|${i.prov.session ?? &#39;&#39;}`; |
| parents | const | 152 | no | const parents = new Map(); |
| cands | const | 154 | no | const cands = []; |
| contentFields | const | 156 | no | const contentFields = fields.filter((f) =&gt; f.type === &#39;string&#39; &amp;&amp; (f.schema?.string?.avgLen ?? 0) &gt;= 40 &amp;&amp; ((f.dist?.text ?? 0) &gt;= 0.3 \|\| (f.schema?.string?.avgLen ?? 0) &gt;= 60)).map((f) =&gt; f.name); |
| vals | const | 160 | no | const vals = instances.map((i) =&gt; i.obj[f.name]); |
| present | const | 161 | no | const present = vals.filter((v) =&gt; v !== undefined &amp;&amp; v !== null &amp;&amp; v !== &#39;&#39;); |
| groups | const | 163 | no | const groups = new Map(); |
| G | const | 165 | no | const G = groups.size; |
| multi | variable | 167 | no | let multi = 0, uniqueIn = 0; |
| byVal | const | 172 | no | const byVal = new Map(); |
| intraUnique | const | 176 | no | const intraUnique = multi ? uniqueIn / multi : 1; |
| recurring | variable | 178 | no | let recurring = 0, recurringChanged = 0; |
| stability | const | 184 | no | const stability = recurring ? recurringChanged / recurring : 0; |
| partition | variable | 186 | no | let partition; |
| shape | const | 190 | no | const shape = valueShape(f, present); |
| d | const | 191 | no | const d = f.dist ?? {}; |
| idish | const | 192 | no | const idish = (d.id ?? 0) + 0.6 * (d.reference ?? 0) + 0.35 * (d.title ?? 0); |
| antiKey | const | 193 | no | const antiKey = (d.measure ?? 0) + (d.timestamp ?? 0) + (d.text ?? 0) + 0.5 * (d.count ?? 0) + 0.5 * (d.flag ?? 0) + 0.3 * (d.url ?? 0) + (f.enum ? 0.3 * (d.category ?? 0) : 0); |
| enumLike | const | 194 | no | const enumLike = f.enum &amp;&amp; G &lt;= 3 &amp;&amp; G &lt; N ? 0.12 : 0; |
| coherence | const | 195 | no | const coherence = contentCoherence(groups, instances, contentFields); |
| incoherent | const | 196 | no | const incoherent = coherence === null ? 0 : 0.35 * Math.max(0, 1 - coherence / 0.5); |
| score | const | 197 | no | const score = +(0.28 * Math.min(1, idish) + 0.22 * shape + 0.25 * partition + 0.15 * intraUnique + 0.1 * (f.presence ?? 1) - 0.35 * Math.min(1, antiKey) - enumLike - incoherent - (intraUnique &lt; 1 ? 0… |
| best | const | 201 | no | const best = cands[0]; |
| margin | const | 203 | no | const margin = cands[1] ? +(best.score - cands[1].score).toFixed(3) : best.score; |
| out | const | 204 | no | const out = { ...best, margin, alternatives: cands.slice(1, 3).map((c) =&gt; ({ field: c.field, score: c.score })) }; |
| contentCoherence | function | 211 | no | function contentCoherence(groups, instances, contentFields) { |
| pairs | variable | 213 | no | let pairs = 0, cont = 0; |
| ord | const | 216 | no | const ord = idxs.slice().sort((a, b) =&gt; (instances[a].prov.t ?? 0) - (instances[b].prov.t ?? 0) \|\| a - b); |
| x | const | 219 | no | const x = instances[ord[k - 1]].obj[cf], y = instances[ord[k]].obj[cf]; |
| a | const | 223 | no | const a = shingles(x), b = shingles(y); |
| resolveForeignKeys | function | 235 | no | function resolveForeignKeys(types) { |
| vals | const | 236 | no | const vals = new Map(types.map((t) =&gt; [t, t.key &amp;&amp; !t.key.weak ? new Set(t.instances.map((i) =&gt; i.obj[t.key.field]).filter((v) =&gt; v !== undefined &amp;&amp; v !== null).map(typedValueKey)) : null])); |
| contained | function | 237 | no | const contained = (a, b) =&gt; { const A = vals.get(a), B = vals.get(b); if (!A \|\| !B \|\| !A.size) return false; let i = 0; for (const v of A) if (B.has(v)) i++; return i / A.size &gt;= 0.8; }; |
| primaryLikelihood | function | 238 | no | const primaryLikelihood = (t, other) =&gt; { |
| k | const | 239 | no | const k = t.key, toks = tokens(k.field), own = tokens(t.name), oth = tokens(other.name); |
| bare | const | 240 | no | const bare = /^(id\|uuid\|guid\|key\|_id\|pk)$/i.test(k.field); |
| compoundRef | const | 241 | no | const compoundRef = !bare &amp;&amp; toks.length &gt; 1 &amp;&amp; /^(id\|uuid\|guid\|key\|ref\|no\|number)$/.test(toks[toks.length - 1]); |
| demote | const | 244 | no | const demote = new Map(); |
| sorted | const | 245 | no | const sorted = [...types].sort((a, b) =&gt; (a.id &lt; b.id ? -1 : 1)); |
| mutual | const | 249 | no | const mutual = contained(u, t); |
| alt | const | 255 | no | const alt = (t.key.alternatives ?? []).find((a) =&gt; a.score &gt;= 0.45); |
| note | const | 256 | no | const note = `values of ${t.key.field} are keys of ${target.name}: foreign key, not identity`; |
| uniqueNames | function | 261 | no | function uniqueNames(types) { |
| seen | const | 262 | no | const seen = new Map(); |
| n | const | 264 | no | const n = seen.get(t.name) ?? 0; |
| markWeakEntities | function | 272 | no | function markWeakEntities(types) { |
| b | const | 275 | no | const b = t.key.basis; |
| parent | const | 277 | no | const parent = types.find((p) =&gt; p !== t &amp;&amp; p.groups[0] === t.groups[0] &amp;&amp; t.path.startsWith(p.path) &amp;&amp; p.path !== t.path &amp;&amp; p.key &amp;&amp; !p.key.weak &amp;&amp; p.key.basis.revisionStability &gt; 0); |
| singular | function | 282 | no | function singular(w) { return w.replace(/ies$/, &#39;y&#39;).replace(/(ss\|us)$/, &#39;$1&#39;).replace(/([^s])s$/, &#39;$1&#39;); } |
| WRAPPERS | const | 284 | no | const WRAPPERS = /^(data\|items\|results\|nodes\|node\|edges\|list\|payload\|response\|records\|rows\|entries\|hits\|docs\|collection\|v)$/i; |
| CONTENTISH | const | 285 | no | const CONTENTISH = /^(content\|value\|body\|meta\|metadata\|attributes\|attrs\|props\|properties\|details\|info)$/i; |
| suggestName | function | 286 | no | function suggestName(c, fields) { |
| segs | const | 287 | no | const segs = c.path.split(/[.[\\]*]+/).filter(Boolean).filter((s) =&gt; s !== &#39;$&#39;); |
| seg | const | 289 | no | const seg = segs[i]; |
| disc | const | 294 | no | const disc = String(c.group).split(&#39; :: &#39;)[1]; |
| ep | const | 296 | no | const ep = String(c.group).split(&#39; :: &#39;)[0].replace(/^[A-Z]+ /, &#39;&#39;).split(&#39;/&#39;).filter((x) =&gt; x &amp;&amp; x !== &#39;{id}&#39; &amp;&amp; !x.includes(&#39;.&#39;) &amp;&amp; !/^(api\|v\\d+\|backend\|graphql)$/i.test(x)); |
| t | const | 298 | no | const t = fields.find((f) =&gt; f.role === &#39;category&#39; &amp;&amp; f.enum?.length === 1); |
| keyValues | function | 306 | no | function keyValues(t) { if (!t.key) return new Set(); return new Set(t.instances.map((i) =&gt; i.obj[t.key.field]).filter((v) =&gt; v !== undefined &amp;&amp; v !== null).map(typedValueKey)); } |
| mergeEvidence | function | 308 | no | function mergeEvidence(o, t) { |
| sim | const | 309 | no | const sim = schemaSimilarity(o.schema, t.schema); |
| kv | const | 310 | no | const kv = keyValues(o), tv = keyValues(t); |
| overlap | variable | 311 | no | let overlap = 0; for (const v of tv) if (kv.has(v)) overlap++; |
| keyOverlap | const | 312 | no | const keyOverlap = tv.size &amp;&amp; kv.size ? overlap / Math.min(tv.size, kv.size) : 0; |
| sameKeyName | const | 313 | no | const sameKeyName = !!(o.key &amp;&amp; t.key &amp;&amp; nameSimilarity(o.key.field, t.key.field) &gt; 0.8); |
| ok | const | 314 | no | const ok = (sim &gt;= 0.8 &amp;&amp; (sameKeyName \|\| (!o.key &amp;&amp; !t.key))) \|\| (sim &gt;= 0.55 &amp;&amp; keyOverlap &gt;= 0.3); |
| mergeTypes | function | 321 | no | function mergeTypes(types, learner, ctx) { |
| items | const | 322 | no | const items = [...types].sort((a, b) =&gt; (a.id &lt; b.id ? -1 : 1)); |
| ev | const | 323 | no | const ev = new Map(); |
| get | function | 325 | no | const get = (i, j) =&gt; ev.get(i &lt; j ? `${i}\|${j}` : `${j}\|${i}`); |
| clusters | variable | 326 | no | let clusters = items.map((_, i) =&gt; [i]); |
| best | variable | 328 | no | let best = null; |
| pairs | const | 330 | no | const pairs = []; for (const i of clusters[a]) for (const j of clusters[b]) pairs.push(get(i, j)); |
| avg | const | 332 | no | const avg = pairs.reduce((s, p) =&gt; s + p.score, 0) / pairs.length; |
| members | const | 341 | no | const members = idxs.map((i) =&gt; items[i]).sort((x, y) =&gt; y.support - x.support \|\| (x.id &lt; y.id ? -1 : 1)); |
| target | const | 342 | no | const target = { ...members[0], mergedFrom: [] }; |
| why | const | 344 | no | const why = mergeEvidence(members[0], t); |
| have | const | 350 | no | const have = new Set(target.fields.map((f) =&gt; f.name)); |
| allInstances | const | 356 | no | const allInstances = members.flatMap((member) =&gt; member.instances); |
| schemaNode | const | 360 | no | const schemaNode = new SchemaNode(); |
| schema | const | 362 | no | const schema = schemaNode.describe(target.path); |
| rebuilt | const | 364 | no | const rebuilt = buildType({ group: target.groups[0], path: target.path, source: target.source, schema, instances: target.instances }, learner, ctx); |
| composition | function | 377 | no | function composition(types) { |
| rels | const | 378 | no | const rels = []; |
| rest | const | 383 | no | const rest = cp.path.slice(pp.path.length); |
| references | function | 392 | no | function references(types) { |
| rels | const | 393 | no | const rels = []; |
| keyed | const | 394 | no | const keyed = types.filter((t) =&gt; t.key &amp;&amp; !t.key.weak).map((t) =&gt; ({ t, vals: keyValues(t) })).filter((x) =&gt; x.vals.size &gt;= 1); |
| vals | const | 399 | no | const vals = new Set(a.instances.map((i) =&gt; i.obj[f.name]).filter((v) =&gt; v !== undefined &amp;&amp; v !== null &amp;&amp; v !== &#39;&#39;).map(typedValueKey)); |
| matched | variable | 401 | no | let matched = false; |
| inter | variable | 404 | no | let inter = 0; for (const v of vals) if (b.vals.has(v)) inter++; |
| containment | const | 405 | no | const containment = inter / vals.size; |
| nameHint | const | 407 | no | const nameHint = tokens(f.name).some((tk) =&gt; tokens(b.t.name).includes(tk) \|\| nameSimilarity(tk, b.t.name) &gt; 0.8) ? 0.15 : 0; |
| idLike | const | 408 | no | const idLike = (f.dist?.reference ?? 0) + (f.dist?.id ?? 0); |
| support | const | 409 | no | const support = Math.min(1, Math.log2(1 + inter) / 4); |
| confidence | const | 412 | no | const confidence = +Math.min(1, 0.45 * containment + 0.2 * support + 0.2 * idLike + nameHint).toFixed(3); |
| owners | const | 415 | no | const owners = new Map(), targets = new Map(); let completeOwners = !!(a.key &amp;&amp; !a.key.weak); |
| value | const | 417 | no | const value = instance.obj[f.name], owner = instance.obj[a.key.field]; |
| vk | const | 420 | no | const vk = typedValueKey(value), ok = typedValueKey(owner); |
| oneToOne | const | 424 | no | const oneToOne = completeOwners &amp;&amp; owners.size &gt; 0 &amp;&amp; [...owners.values(), ...targets.values()].every((set) =&gt; set.size === 1); |
| idNamed | const | 427 | no | const idNamed = /(_id\|Id\|_uuid\|Uuid\|_ref\|Ref\|_key)$/.test(f.name), idFormat = f.formats.some((x) =&gt; [&#39;uuid&#39;, &#39;hex_id&#39;, &#39;token_id&#39;].includes(x)); |
| dedupeRels | function | 436 | no | function dedupeRels(rels) { const m = new Map(); for (const r of rels) if (!m.has(r.id) \|\| m.get(r.id).confidence &lt; r.confidence) m.set(r.id, r); return [...m.values()]; } |
| familyMatches | function | 439 | no | function familyMatches(t, families) { |
| out | const | 440 | no | const out = []; |
| pseudo | const | 442 | no | const pseudo = { fields: Object.fromEntries(Object.entries(espec.fields ?? {}).map(([fname, fs]) =&gt; [fname, pseudoField(fs)])) }; |
| flat | const | 445 | no | const flat = flatLeaves(t); |
| al | const | 446 | no | const al = alignFields(pseudo, { fields: flat }, { minScore: 0.5 }); |
| req | const | 447 | no | const req = Object.entries(espec.fields ?? {}).filter(([, fs]) =&gt; fs.required).map(([n]) =&gt; n); |
| hit | const | 448 | no | const hit = new Set(al.pairs.map((p) =&gt; p.a)); |
| reqCover | const | 449 | no | const reqCover = req.length ? req.filter((r) =&gt; hit.has(r)).length / req.length : 0.5; |
| score | const | 450 | no | const score = +(0.6 * reqCover + 0.4 * (al.pairs.reduce((a, p) =&gt; a + p.score, 0) / Math.max(1, Object.keys(pseudo.fields).length))).toFixed(3); |
| flatLeaves | function | 456 | no | function flatLeaves(t) { |
| out | const | 457 | no | const out = {}; |
| walk | function | 458 | no | const walk = (d, prefix, depth) =&gt; { |
| p | const | 460 | no | const p = prefix ? `${prefix}.${k}` : k; |
| pseudoField | function | 471 | no | function pseudoField(fs) { |
| d | const | 472 | no | const d = { type: fs.type === &#39;id&#39; \|\| fs.type === &#39;enum&#39; \|\| fs.type === &#39;text&#39; \|\| fs.type === &#39;url&#39; \|\| fs.type === &#39;time&#39; ? &#39;string&#39; : fs.type === &#39;number&#39; ? &#39;number&#39; : &#39;string&#39; }; |
| modelSummary | function | 478 | yes | export function modelSummary(m) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 7 | external |
| ./schema.mjs | import | 8 | [studio/src/intel/schema.mjs](./schema.mjs.md) |
| ./learn.mjs | import | 9 | [studio/src/intel/learn.mjs](./learn.mjs.md) |
| ./identity.mjs | import | 10 | [studio/src/intel/identity.mjs](./identity.mjs.md) |
| ./similarity.mjs | import | 11 | [studio/src/intel/similarity.mjs](./similarity.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/eval/run.mjs](../../eval/run.mjs.md) | ../src/intel/discover.mjs |
| [studio/src/replay/derive.mjs](../replay/derive.mjs.md) | ../intel/discover.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Generic model discovery for a website never seen before.
//
// Input: an observation corpus — samples { value, source: { kind, group, endpoint, sid, seq, t, domId } }.
// Output: a candidate data model — record types (schema, key, field roles), relationships
// (composition, references, dangling references), merged types, family alignments — every item
// with confidence and the evidence it rests on. Nothing here knows any specific website.
import { createHash } from 'node:crypto';
import { SchemaNode, schemaSimilarity, alignFields, nameSimilarity, tokens, sampleIndices, shapeKey } from './schema.mjs';
import { ScopedLearner, argmax } from './learn.mjs';
import { shingles, containment } from './identity.mjs';
import { stableStringify, typedValueKey } from './similarity.mjs';

const h = (s) => createHash('sha1').update(s).digest('hex').slice(0, 10);
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const VAL_CAP = 5000;

// ---------------------------------------------------------------------------------------------
// 1. Locate record-bearing positions and gather instances (objects) with provenance.
//    Positions: group roots, array items, dynamic-map values. Paths use [*] for both.
// ---------------------------------------------------------------------------------------------
function looksDynamicKeys(o) {
  const ks = Object.keys(o);
  return ks.length >= 3 && ks.filter((k) => /^\d+(\.\d+)*$/.test(k) || /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(k) || /^[0-9a-f]{16,}$/i.test(k) || (/^[A-Za-z0-9_-]{16,}$/.test(k) && /\d/.test(k))).length / ks.length >= 0.8;
}

function collectInstances(value, path, out, prov, depth = 0) {
  if (depth > 12) return;
  if (Array.isArray(value)) { for (const i of sampleIndices(value.length, (i) => shapeKey(value[i]), { head: 400, stride: 400 })) collectInstances(value[i], `${path}[*]`, out, { ...prov, index: i, location: `${prov.location ?? path}[${i}]` }, depth + 1); return; }
  if (!isObj(value)) return;
  if (looksDynamicKeys(value)) { const ents = Object.entries(value); for (const i of sampleIndices(ents.length, (i) => shapeKey(ents[i][1]), { head: 400, stride: 400 })) collectInstances(ents[i][1], `${path}[*]`, out, { ...prov, mapKey: ents[i][0], location: `${prov.location ?? path}[${JSON.stringify(ents[i][0])}]` }, depth + 1); return; }
  const list = out.get(path) ?? [];
  const provenance = { ...prov, path, location: prov.location ?? path };
  if (list.length < VAL_CAP) list.push({ obj: value, prov: provenance });
  else {
    // Past the cap (deterministic): a new shape is always kept; otherwise a stride replacement
    // keeps the sample spread over the whole stream instead of only its head.
    list._seen = (list._seen ?? VAL_CAP) + 1;
    list._shapes ??= new Set(list.map((x) => shapeKey(x.obj)));
    const sh = shapeKey(value);
    if (!list._shapes.has(sh)) { list._shapes.add(sh); list.push({ obj: value, prov: provenance }); }
    else if (list._seen % 7 === 0) { const j = (list._seen * 7919) % VAL_CAP; if (shapeKey(list[j].obj) === sh) list[j] = { obj: value, prov: provenance }; }
  }
  out.set(path, list);
  for (const [k, v] of Object.entries(value)) if (v && typeof v === 'object') collectInstances(v, `${path}.${k}`, out, { ...prov, location: `${prov.location ?? path}[${JSON.stringify(k)}]` }, depth + 1);
}

// Envelope: a small wrapper whose meaning is "there is a payload inside" (type + data, v, o/p).
function isEnvelope(schema) {
  const f = schema.fields ?? {};
  const names = Object.keys(f);
  if (names.length > 4) return false;
  const objectChildren = names.filter((n) => f[n].type === 'object' || f[n].type === 'map' || f[n].type === 'array');
  const scalars = names.filter((n) => !objectChildren.includes(n));
  return objectChildren.length === 1 && scalars.every((n) => f[n].string?.enum || f[n].type === 'integer' || /^(type|event|kind|op|o|p|v|seq|id|version|channel|topic)$/.test(n));
}

// ---------------------------------------------------------------------------------------------
// 2. Discovery
// ---------------------------------------------------------------------------------------------
export function discoverModel(corpus, { learner = new ScopedLearner(), ctx = {}, families = [], patchGroups = new Set() } = {}) {
  const t0 = Date.now();
  const groups = new Map();
  for (const s of corpus) { const g = s.source.group; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(s); }

  const candidates = [];
  for (const [group, samples] of groups) {
    if (patchGroups.has(group)) continue; // patch streams are protocol; their assembled docs are the data
    const positions = new Map();
    for (const s of samples) collectInstances(s.value, '$', positions, s.source);
    for (const [p, inst] of positions) {
      const schemaNode = new SchemaNode();
      for (const i of inst) schemaNode.observe(i.obj);
      const schema = schemaNode.describe(p);
      if (schema.type !== 'object') continue;
      const nFields = Object.keys(schema.fields).length;
      if (nFields < 2 || inst.length < 2) continue;
      if (isEnvelope(schema) && p === '$') continue;
      candidates.push({ group, path: p, schema, instances: inst, source: samples[0].source });
    }
  }
```

_First 80 of 481 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
