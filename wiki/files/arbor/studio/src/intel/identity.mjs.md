# File: studio/src/intel/identity.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/identity.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18851 B |
| Lines | 277 |
| Hash | b9707faed461 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| isScalar | function | 12 | no | const isScalar = (v) =&gt; v !== null &amp;&amp; v !== undefined &amp;&amp; typeof v !== &#39;object&#39;; |
| sha | function | 13 | no | const sha = (x) =&gt; createHash(&#39;sha1&#39;).update(x).digest(&#39;hex&#39;).slice(0, 12); |
| usableIdentityKey | function | 14 | yes | export const usableIdentityKey = (v) =&gt; typeof v === &#39;number&#39; ? Number.isFinite(v) |
| instanceSig | function | 19 | yes | export function instanceSig(i) { return `${stableStringify(i.obj)}\|${i.prov.session ?? &#39;&#39;}\|${i.prov.sid ?? &#39;&#39;}\|${i.prov.seq ?? &#39;&#39;}\|${i.prov.domId ?? &#39;&#39;}\|${i.prov.t ?? &#39;&#39;}`; } |
| scopeOf | function | 22 | yes | export function scopeOf(prov) { |
| g | const | 24 | no | const g = String(prov.group ?? &#39;&#39;).split(&#39; :: &#39;)[0].replace(/^[A-Z]+ /, &#39;&#39;); |
| norm | function | 27 | no | const norm = (v) =&gt; (typeof v === &#39;string&#39; ? v.trim().toLowerCase().replace(/\\s+/g, &#39; &#39;) : v); |
| shingles | function | 29 | yes | export function shingles(text, k = 3) { |
| w | const | 30 | no | const w = String(text ?? &#39;&#39;).toLowerCase().split(/[^\\p{L}\\p{N}]+/u).filter(Boolean); |
| s | const | 32 | no | const s = new Set(); |
| containment | function | 36 | yes | export function containment(a, b) { if (!a.size) return 0; let i = 0; for (const x of a) if (b.has(x)) i++; return i / a.size; } |
| agree | function | 38 | no | function agree(a, b) { |
| x | const | 41 | no | const x = norm(a), y = norm(b); |
| s1 | const | 45 | no | const s1 = shingles(x), s2 = shingles(y); |
| diffFields | function | 51 | no | function diffFields(a, b) { const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]); return [...keys].filter((k) =&gt; stableStringify(a?.[k]) !== stableStringify(b?.[k])); } |
| buildEntities | function | 57 | no | function buildEntities(type, clusters, method, basis, confidences = new Map()) { |
| entities | const | 58 | no | const entities = []; |
| inst | const | 60 | no | const inst = idxs.map((i) =&gt; type.instances[i]).sort((x, y) =&gt; (x.prov.t ?? 0) - (y.prov.t ?? 0) \|\| (x.prov.seq ?? 0) - (y.prov.seq ?? 0) \|\| (instanceSig(x) &lt; instanceSig(y) ? -1 : 1)); |
| revisions | const | 61 | no | const revisions = []; |
| state | variable | 62 | no | let state = {}, prev = null; |
| changed | const | 64 | no | const changed = prev ? diffFields(prev, i.obj).filter((k) =&gt; k in i.obj) : Object.keys(i.obj); |
| values | const | 66 | no | const values = Object.fromEntries(changed.map((k) =&gt; [k, i.obj[k]])); |
| keyVal | const | 72 | no | const keyVal = type.key &amp;&amp; method === &#39;key&#39; ? String(inst[0].obj[type.key.field]) : null; |
| scope | const | 73 | no | const scope = scopeOf(inst[0].prov); |
| first | const | 76 | no | const first = inst[0]; |
| anchorOf | function | 77 | no | const anchorOf = (i) =&gt; `${instanceSig(i)}\|${i.prov.index ?? &#39;&#39;}\|${i.prov.mapKey ?? &#39;&#39;}\|${i.prov.snapshot ?? &#39;&#39;}`; |
| keyType | const | 79 | no | const keyType = method === &#39;key&#39; ? typeof inst[0].obj[type.key.field] : null; |
| keyAnchor | const | 80 | no | const keyAnchor = `${scope}\|${keyVal}`; |
| eid | const | 81 | no | const eid = method === &#39;key&#39; ? `${type.id}:k:${keyType === &#39;number&#39; ? &#39;n:&#39; : &#39;&#39;}${sha(keyAnchor)}` : method === &#39;provisional&#39; ? `${type.id}:p:${sha(`${anchorOf(first)}\|${label}`)}` : `${type.id}:e:${… |
| anchor | const | 82 | no | const anchor = { session: first.prov.session ?? null, sid: first.prov.sid ?? null, seq: first.prov.seq ?? null, domId: first.prov.domId ?? null, t: first.prov.t ?? null }; |
| conf | const | 83 | no | const conf = method === &#39;provisional&#39; ? { value: null, basis: &#39;identity key unavailable&#39; } : confidences.get(label) ?? (method === &#39;key&#39; ? { value: +Math.min(1, type.key?.score ?? 0.5).toFixed(3), ba… |
| times | const | 84 | no | const times = inst.map((i) =&gt; i.prov.t).filter(Number.isFinite); |
| resolveType | function | 96 | yes | export function resolveType(type, opts = {}) { |
| inst | const | 97 | no | const inst = type.instances; |
| by | const | 99 | no | const by = new Map(); |
| absent | const | 100 | no | const absent = new Map(), repeat = new Map(); |
| v | const | 102 | no | const v = i.obj[type.key.field]; |
| sig | const | 104 | no | const sig = [instanceSig(i), i.prov.index ?? null, i.prov.mapKey ?? null, i.prov.snapshot ?? null].join(&#39;\|&#39;); |
| ordinal | const | 105 | no | const ordinal = repeat.get(sig) ?? 0; |
| k | const | 109 | no | const k = JSON.stringify([scopeOf(i.prov), typeof v, String(v)]); |
| valid | const | 114 | no | const valid = buildEntities(type, by, &#39;key&#39;, { field: type.key.field, keyScore: type.key.score, scopedBy: &#39;site&#39; }); |
| provisional | const | 115 | no | const provisional = buildEntities(type, absent, &#39;provisional&#39;, { field: type.key.field, reason: &#39;missing-or-invalid-key&#39; }); |
| isLong | function | 132 | no | const isLong = (v) =&gt; typeof v === &#39;string&#39; &amp;&amp; v.length &gt; 24; |
| level | function | 133 | no | function level(a, b) { |
| x | const | 136 | no | const x = norm(a), y = norm(b); |
| s1 | const | 138 | no | const s1 = shingles(x), s2 = shingles(y); |
| c | const | 139 | no | const c = Math.max(containment(s1, s2), containment(s2, s1)); |
| levelsOf | function | 144 | no | const levelsOf = (f, inst) =&gt; (inst.some((i) =&gt; isLong(i.obj[f])) ? 4 : 2); |
| hash32 | function | 146 | no | function hash32(str) { let h = 2166136261; for (let i = 0; i &lt; str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h &gt;&gt;&gt; 0; } |
| minhashKeys | function | 147 | no | function minhashKeys(text, k = 3) { return [...shingles(norm(text))].map((sh) =&gt; [hash32(sh), sh]).sort((a, b) =&gt; a[0] - b[0]).slice(0, k).map((x) =&gt; x[1]); } |
| snapshotKey | function | 149 | yes | export function snapshotKey(prov) { |
| linkage | function | 156 | yes | export function linkage(type, { sample = 4000, maxBlock = 400, window = 25, emIters = 25, minPosterior = 0.8 } = {}) { |
| perm | const | 160 | no | const perm = type.instances.map((_, i) =&gt; i).sort((a, b) =&gt; instanceSig(type.instances[a]).localeCompare(instanceSig(type.instances[b]))); |
| inst | const | 161 | no | const inst = perm.map((i) =&gt; type.instances[i]); |
| n | const | 162 | no | const n = inst.length; |
| back | function | 163 | no | const back = (localIdxs) =&gt; localIdxs.map((j) =&gt; perm[j]); |
| fields | const | 164 | no | const fields = type.fields.filter((f) =&gt; [&#39;string&#39;, &#39;integer&#39;, &#39;number&#39;, &#39;boolean&#39;].includes(f.type) &amp;&amp; (f.presence ?? 1) &gt;= 0.5).map((f) =&gt; f.name); |
| L | const | 166 | no | const L = Object.fromEntries(fields.map((f) =&gt; [f, levelsOf(f, inst)])); |
| tf | const | 168 | no | const tf = Object.fromEntries(fields.map((f) =&gt; { const c = new Map(); let tot = 0; for (const i of inst) { const v = i.obj[f]; if (v === undefined \|\| v === null) continue; const k = typedValueKey(no… |
| tfOf | function | 169 | no | const tfOf = (f, v) =&gt; { const t = tf[f]; return t.tot ? (t.c.get(typedValueKey(norm(v))) ?? 0) / t.tot : 0; }; |
| rnd | const | 171 | no | const rnd = mulberry(1234); |
| u | const | 172 | no | const u = {}; |
| cnt | const | 174 | no | const cnt = Array(L[f]).fill(1); |
| tot | const | 176 | no | const tot = cnt.reduce((x, y) =&gt; x + y, 0); |
| discr | const | 182 | no | const discr = [...fields].sort((a, b) =&gt; u[a][u[a].length - 1] - u[b][u[b].length - 1] \|\| (a &lt; b ? -1 : 1)).slice(0, 3); |
| pairs | const | 183 | no | const pairs = new Set(); |
| addPair | function | 184 | no | const addPair = (a, b) =&gt; { if (a !== b) pairs.add(a &lt; b ? `${a}\|${b}` : `${b}\|${a}`); }; |
| blocks | const | 186 | no | const blocks = new Map(); |
| v | const | 188 | no | const v = i.obj[f]; |
| keys | const | 190 | no | const keys = isLong(v) ? [...minhashKeys(v, 4), `pre:${String(norm(v)).split(&#39; &#39;).slice(0, 5).join(&#39; &#39;)}`] : [String(norm(v)).slice(0, 16)]; |
| other | const | 195 | no | const other = fields.find((g) =&gt; g !== f) ?? f; |
| sorted | const | 196 | no | const sorted = idxs.slice().sort((a, b) =&gt; { const va = String(norm(inst[a].obj[other] ?? &#39;&#39;)), vb = String(norm(inst[b].obj[other] ?? &#39;&#39;)); return va &lt; vb ? -1 : va &gt; vb ? 1 : a - b; }); |
| cand | const | 200 | no | const cand = [...pairs].sort().map((k) =&gt; { const [a, b] = k.split(&#39;\|&#39;).map(Number); return { a, b, g: Object.fromEntries(fields.map((f) =&gt; [f, level(inst[a].obj[f], inst[b].obj[f])])) }; }); |
| m | const | 202 | no | const m = Object.fromEntries(fields.map((f) =&gt; [f, L[f] === 4 ? [0.05, 0.1, 0.25, 0.6] : [0.1, 0.9]])); |
| p | variable | 203 | no | let p = 0.2; |
| top | function | 204 | no | const top = (f) =&gt; L[f] - 1; |
| logBF | function | 205 | no | const logBF = (c) =&gt; fields.reduce((acc, f) =&gt; { const l = c.g[f]; if (l === null) return acc; let uu = u[f][l]; if (l === top(f)) uu = Math.max(uu, Math.min(0.5, tfOf(f, inst[c.a].obj[f]))); |
| l | const | 206 | no | const l = c.g[f]; |
| uu | variable | 208 | no | let uu = u[f][l]; |
| acc | const | 213 | no | const acc = Object.fromEntries(fields.map((f) =&gt; [f, Array(L[f]).fill(0.01)])); |
| gs | variable | 214 | no | let gs = 0; |
| g | const | 216 | no | const g = 1 / (1 + Math.pow(2, -(Math.log2(p / (1 - p)) + logBF(c)))); |
| snap | const | 225 | no | const snap = inst.map((i) =&gt; snapshotKey(i.prov)); |
| node | const | 226 | no | const node = inst.map((i) =&gt; i.prov.domId ?? null); |
| sess | const | 227 | no | const sess = inst.map((i) =&gt; i.prov.session ?? null); |
| scopes | const | 228 | no | const scopes = inst.map((i) =&gt; scopeOf(i.prov)); |
| cluster | const | 229 | no | const cluster = inst.map((_, i) =&gt; i); |
| members | const | 230 | no | const members = new Map(inst.map((_, i) =&gt; [i, [i]])); |
| weakest | const | 231 | no | const weakest = new Map(inst.map((_, i) =&gt; [i, 1])); |
| pairW | const | 232 | no | const pairW = new Map(cand.map((c) =&gt; [`${c.a}\|${c.b}`, c.w])); |
| cannotLink | function | 233 | no | const cannotLink = (A, B) =&gt; { |
| key | const | 238 | no | const key = x &lt; y ? `${x}\|${y}` : `${y}\|${x}`; |
| w | variable | 239 | no | let w = pairW.get(key); |
| g | const | 241 | no | const g = Object.fromEntries(fields.map((f) =&gt; [f, level(inst[x].obj[f], inst[y].obj[f])])); |
| linked | variable | 250 | no | let linked = 0, blocked = 0; |
| ra | const | 252 | no | const ra = cluster[c.a], rb = cluster[c.b]; |
| A | const | 254 | no | const A = members.get(ra), B = members.get(rb); |
| bestPost | const | 263 | no | const bestPost = new Map(); |
| clusters | const | 265 | no | const clusters = new Map(), confs = new Map(); |
| mulberry | function | 275 | no | function mulberry(a) { return () =&gt; { a \|= 0; a = (a + 0x6D2B79F5) \| 0; let t = Math.imul(a ^ (a &gt;&gt;&gt; 15), 1 \| a); t = (t + Math.imul(t ^ (t &gt;&gt;&gt; 7), 61 \| t)) ^ t; return ((t ^ (t &gt;&gt;&gt; 14)) &gt;&gt;&gt; 0) / 429… |
| resolveModel | function | 277 | yes | export function resolveModel(model, opts) { return model.types.map((t) =&gt; resolveType(t, opts)); } |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 9 | external |
| ./similarity.mjs | import | 10 | [studio/src/intel/similarity.mjs](./similarity.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/eval/run.mjs](../../eval/run.mjs.md) | ../src/intel/identity.mjs |
| [studio/src/intel/correlate.mjs](./correlate.mjs.md) | ./identity.mjs |
| [studio/src/intel/discover.mjs](./discover.mjs.md) | ./identity.mjs |
| [studio/src/replay/derive.mjs](../replay/derive.mjs.md) | ../intel/identity.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Identity resolution: which observations are the same real-world entity?
//
//   keyed     group by the inferred identity key; ordered revisions with field-level diffs.
//   keyless   Fellegi–Sunter style record linkage: per-field agreement weights log2(m/u), where
//             u is estimated from random pairs in the data and m from a prior (or from keyed
//             pairs when a keyed sibling type exists), blocking on the most discriminating
//             field, union-find clustering above a data-derived threshold.
// Works for updates, rerenders (new DOM node, same content), pagination overlaps and sessions.
import { createHash } from 'node:crypto';
import { stableStringify, typedValueKey } from './similarity.mjs';

const isScalar = (v) => v !== null && v !== undefined && typeof v !== 'object';
const sha = (x) => createHash('sha1').update(x).digest('hex').slice(0, 12);
export const usableIdentityKey = (v) => typeof v === 'number' ? Number.isFinite(v)
  : typeof v === 'string' && v.trim().length > 0
    && !['undefined', 'null', 'nan'].includes(v.trim().toLowerCase());

// Order-independent instance signature (content + provenance, never array position).
export function instanceSig(i) { return `${stableStringify(i.obj)}|${i.prov.session ?? ''}|${i.prov.sid ?? ''}|${i.prov.seq ?? ''}|${i.prov.domId ?? ''}|${i.prov.t ?? ''}`; }

// Identity scope: keys only collide within one site (provenance site, else endpoint host).
export function scopeOf(prov) {
  if (prov.site) return String(prov.site);
  const g = String(prov.group ?? '').split(' :: ')[0].replace(/^[A-Z]+ /, '');
  return g ? g.split('/')[0] : '';
}
const norm = (v) => (typeof v === 'string' ? v.trim().toLowerCase().replace(/\s+/g, ' ') : v);

export function shingles(text, k = 3) {
  const w = String(text ?? '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (w.length < k) return new Set(w.length ? [w.join(' ')] : []);
  const s = new Set();
  for (let i = 0; i + k <= w.length; i++) s.add(w.slice(i, i + k).join(' '));
  return s;
}
export function containment(a, b) { if (!a.size) return 0; let i = 0; for (const x of a) if (b.has(x)) i++; return i / a.size; }

function agree(a, b) {
  if (!isScalar(a) || !isScalar(b)) return a === b ? 1 : 0;
  if (typeof a === 'number' && typeof b === 'number') return a === b || Math.abs(a - b) <= Math.max(1e-9, Math.abs(a) * 0.005) ? 1 : 0;
  const x = norm(a), y = norm(b);
  if (x === y) return 1;
  if (typeof x === 'string' && typeof y === 'string' && (x.length > 24 || y.length > 24)) {
    // Long text: shingle overlap tolerates streaming growth and small edits.
    const s1 = shingles(x), s2 = shingles(y);
    return Math.max(containment(s1, s2), containment(s2, s1)) >= 0.8 ? 1 : 0;
  }
  return 0;
}

function diffFields(a, b) { const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]); return [...keys].filter((k) => stableStringify(a?.[k]) !== stableStringify(b?.[k])); }

// clusters: Map<label, instanceIndex[]> (indices into type.instances). Entity ids are derived
// from content (keyed: scope+key; keyless: smallest member signature), so they do not depend on
// observation order. State is FOLDED across revisions so partial updates never lose fields,
// and every revision carries the values it changed (enough to reconstruct past states).
function buildEntities(type, clusters, method, basis, confidences = new Map()) {
  const entities = [];
  for (const [label, idxs] of clusters) {
    const inst = idxs.map((i) => type.instances[i]).sort((x, y) => (x.prov.t ?? 0) - (y.prov.t ?? 0) || (x.prov.seq ?? 0) - (y.prov.seq ?? 0) || (instanceSig(x) < instanceSig(y) ? -1 : 1));
    const revisions = [];
    let state = {}, prev = null;
    for (const i of inst) {
      const changed = prev ? diffFields(prev, i.obj).filter((k) => k in i.obj) : Object.keys(i.obj);
      if (prev && !changed.length) continue; // identical (or subset) re-observation: duplicate, not a revision
      const values = Object.fromEntries(changed.map((k) => [k, i.obj[k]]));
      state = { ...state, ...i.obj };
      revisions.push({ t: i.prov.t ?? null, seq: i.prov.seq ?? null, sid: i.prov.sid, domId: i.prov.domId, session: i.prov.session,
        path: i.prov.path, location: i.prov.location, index: i.prov.index, mapKey: i.prov.mapKey, changed, values });
      prev = { ...state };
    }
    const keyVal = type.key && method === 'key' ? String(inst[0].obj[type.key.field]) : null;
    const scope = scopeOf(inst[0].prov);
    // Keyless ids anchor on the EARLIEST observation (members are sorted by t, seq, signature), so
    // appending later evidence never renames an entity; only genuinely earlier evidence can.
    const first = inst[0];
    const anchorOf = (i) => `${instanceSig(i)}|${i.prov.index ?? ''}|${i.prov.mapKey ?? ''}|${i.prov.snapshot ?? ''}`;
    // Keep existing string-key IDs stable; typed numeric keys must not alias string keys.
    const keyType = method === 'key' ? typeof inst[0].obj[type.key.field] : null;
    const keyAnchor = `${scope}|${keyVal}`;
```

_First 80 of 278 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
