# File: studio/eval/run.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/eval/run.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 19700 B |
| Lines | 263 |
| Hash | f796969f92da |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| here | const | 15 | no | const here = path.dirname(fileURLToPath(import.meta.url)); |
| args | const | 16 | no | const args = process.argv.slice(2); |
| split | const | 17 | no | const split = args.includes(&#39;--split&#39;) ? args[args.indexOf(&#39;--split&#39;) + 1] : &#39;all&#39;; |
| jac | function | 19 | no | const jac = (a, b) =&gt; { const A = new Set(a), B = new Set(b); let i = 0; for (const x of A) if (B.has(x)) i++; return i / (A.size + B.size - i \|\| 1); }; |
| typeEq | function | 20 | no | const typeEq = (gt, got) =&gt; gt === got \|\| (gt === &#39;number&#39; &amp;&amp; got === &#39;integer&#39;) \|\| (gt === &#39;integer&#39; &amp;&amp; got === &#39;number&#39;); |
| matchTypes | function | 23 | no | function matchTypes(gtTypes, types, extras = []) { |
| cands | const | 24 | no | const cands = []; |
| gU | const | 27 | no | const gU = new Set(), tU = new Set(), pairs = []; |
| neutral | const | 29 | no | const neutral = types.map((t, ti) =&gt; ti).filter((ti) =&gt; !tU.has(ti) &amp;&amp; extras.some((ex) =&gt; jac(ex, types[ti].fields.map((f) =&gt; f.name)) &gt;= 0.5)); |
| scoreModel | function | 33 | no | function scoreModel(gt, model, acc) { |
| nameOf | const | 36 | no | const nameOf = new Map(); |
| g | const | 38 | no | const g = gt.types[p.gi], t = model.types[p.ti]; |
| gotKey | const | 41 | no | const gotKey = t.key &amp;&amp; !t.key.weak ? t.key.field : null; |
| f | const | 44 | no | const f = t.fields.find((x) =&gt; x.name === fname); |
| ok | const | 49 | no | const ok = f.role === fg.role; if (ok) acc.roleOk++; else acc.roleMiss.push(`${g.name}.${fname}: ${fg.role} vs ${f.role}`); |
| gtRels | const | 56 | no | const gtRels = (gt.relationships ?? []).map((r) =&gt; `${r.from}.${r.field}-&gt;${r.to}`); |
| gotRels | const | 57 | no | const gotRels = model.relationships.filter((r) =&gt; r.kind === &#39;references&#39;).map((r) =&gt; `${nameOf.get(r.from) ?? &#39;?&#39;}.${r.field}-&gt;${nameOf.get(r.to) ?? &#39;?&#39;}`); |
| pairF1 | function | 63 | no | function pairF1(truth, clusters) { |
| pred | const | 65 | no | const pred = new Map(); clusters.forEach((c, ci) =&gt; c.forEach((i) =&gt; pred.set(i, ci))); |
| tp | variable | 66 | no | let tp = 0, fp = 0, fn = 0; |
| same | const | 68 | no | const same = truth[i] === truth[j], linked = pred.get(i) === pred.get(j); |
| p | const | 71 | no | const p = tp / (tp + fp \|\| 1), r = tp / (tp + fn \|\| 1); |
| fresh | function | 75 | no | const fresh = () =&gt; ({ typeTP: 0, typeFP: 0, typeFN: 0, keyOk: 0, keyTotal: 0, keyMiss: [], fieldTypeOk: 0, fieldTotal: 0, fieldMissing: 0, roleOk: 0, heuristicRoleOk: 0, roleTotal: 0, roleMiss: [], … |
| pr | function | 76 | no | const pr = (tp, fp, fn) =&gt; ({ precision: +(tp / (tp + fp \|\| 1)).toFixed(3), recall: +(tp / (tp + fn \|\| 1)).toFixed(3) }); |
| summarize | function | 78 | no | function summarize(acc) { |
| runEval | function | 93 | yes | export async function runEval({ which = split, learner } = {}) { |
| results | const | 94 | no | const results = { generatedAt: new Date().toISOString(), node: process.version, fixtures: {}, aggregate: {} }; |
| accs | const | 95 | no | const accs = { dev: fresh(), heldout: fresh() }; |
| perf | const | 96 | no | const perf = []; |
| L | const | 97 | no | const L = learner ?? new ScopedLearner(); |
| simple | const | 98 | no | const simple = [&#39;chatPathOps&#39;, &#39;dashboardTicks&#39;, &#39;feedPages&#39;, &#39;workspaceMixed&#39;, &#39;nestedHetero&#39;, &#39;multiPageWorkflow&#39;, &#39;unknownFormat&#39;, &#39;keylessRerender&#39;]; |
| fx | const | 100 | no | const fx = FIXTURES[key](); |
| mem0 | const | 102 | no | const mem0 = process.memoryUsage().heapUsed, t0 = performance.now(); |
| model | const | 103 | no | const model = discoverModel(fx.samples, { learner: L, patchGroups: fx.patchGroups }); |
| ms | const | 104 | no | const ms = performance.now() - t0; |
| local | const | 106 | no | const local = fresh(); |
| r | const | 108 | no | const r = { split: fx.split, discovered: model.types.map((t) =&gt; ({ name: t.name, gtMatch: nameOf.get(t.id) ?? null, key: t.key?.weak ? null : t.key?.field ?? null, fields: t.fields.length, confidence… |
| tid | const | 113 | no | const tid = [...nameOf].find(([, n]) =&gt; n === gname)?.[0]; |
| t | const | 114 | no | const t = model.types.find((x) =&gt; x.id === tid); |
| res | const | 115 | no | const res = t ? resolveType(t) : null; |
| t | const | 120 | no | const t = model.types[0]; |
| res | const | 121 | no | const res = t ? resolveType(t) : null; |
| idxOf | const | 122 | no | const idxOf = new Map(fx.samples.map((s, i) =&gt; [s.source.domId, i])); |
| clusters | const | 123 | no | const clusters = res ? res.entities.map((e) =&gt; e.revisions.map((rv) =&gt; idxOf.get(rv.domId)).concat(e.duplicates ? [] : [])) : []; |
| membership | const | 125 | no | const membership = res ? clusterMembership(t, res) : []; |
| subjects | const | 129 | no | const subjects = fx.gt.rendered.map((x) =&gt; ({ kind: &#39;stream&#39;, id: x.subject, text: x.text })); |
| hyps | const | 130 | no | const hyps = correlateRendered(subjects, fx.elements); |
| ok | variable | 131 | no | let ok = 0, likelyOk = 0, likely = 0; |
| fx | const | 140 | no | const fx = FIXTURES.dynamicSchema(); |
| d | const | 141 | no | const d = schemaDiff(induce(fx.v1), induce(fx.v2)); |
| got | const | 142 | no | const got = Object.fromEntries(d.repairs.map((x) =&gt; [x.from, x.to])); |
| exp | const | 143 | no | const exp = fx.gt.repairs; |
| two | const | 147 | no | const two = FIXTURES.twoSitesSameEntities(); |
| ma | const | 148 | no | const ma = discoverModel(two.siteA, { learner: L }), mb = discoverModel(two.siteB, { learner: L }); |
| accA | const | 149 | no | const accA = fresh(), accB = fresh(); |
| sa | const | 150 | no | const sa = scoreModel(two.gt.a, ma, accA), sb = scoreModel(two.gt.b, mb, accB); |
| ta | const | 152 | no | const ta = ma.types.find((t) =&gt; sa.nameOf.get(t.id) === &#39;task&#39;), tb = mb.types.find((t) =&gt; sb.nameOf.get(t.id) === &#39;task&#39;); |
| alignAcc | variable | 153 | no | let alignAcc = null, pairs = []; |
| modelSignature | function | 164 | yes | export function modelSignature(model) { |
| runEvalV2 | function | 169 | yes | export async function runEvalV2({ learner } = {}) { |
| L | const | 170 | no | const L = learner ?? new ScopedLearner(); |
| out | const | 171 | no | const out = { fixtures: {}, aggregate: null }; |
| acc | const | 172 | no | const acc = fresh(); |
| signatures | const | 173 | no | const signatures = {}; |
| fx | const | 175 | no | const fx = make(); |
| d | const | 177 | no | const d = schemaDiff(induce(fx.v1), induce(fx.v2)); |
| got | const | 178 | no | const got = Object.fromEntries(d.repairs.map((x) =&gt; [x.from, x.to])); |
| ma | const | 183 | no | const ma = discoverModel(fx.siteA, { learner: L }), mb = discoverModel(fx.siteB, { learner: L }); |
| sa | const | 184 | no | const sa = scoreModel(fx.gt.a, ma, acc), sb = scoreModel(fx.gt.b, mb, acc); |
| ta | const | 185 | no | const ta = ma.types.find((t) =&gt; sa.nameOf.get(t.id) === fx.gt.a.types[0].name), tb = mb.types.find((t) =&gt; sb.nameOf.get(t.id) === fx.gt.b.types[0].name); |
| pairs | const | 186 | no | const pairs = ta &amp;&amp; tb ? alignFields(ta.schema, tb.schema).pairs : []; |
| got | const | 187 | no | const got = Object.fromEntries(pairs.map((p) =&gt; [p.a, p.b])); |
| t0 | const | 191 | no | const t0 = performance.now(); |
| model | const | 192 | no | const model = discoverModel(fx.samples, { learner: L, patchGroups: fx.patchGroups }); |
| ms | const | 193 | no | const ms = performance.now() - t0; |
| local | const | 195 | no | const local = fresh(); |
| r | const | 198 | no | const r = { ms: +ms.toFixed(1), samples: fx.samples.length, discovered: model.types.map((t) =&gt; `${t.name}[${t.key &amp;&amp; !t.key.weak ? t.key.field : &#39;-&#39;}]`), metrics: summarize(local) }; |
| clusterMembership | function | 209 | no | function clusterMembership(type, res) { |
| out | const | 211 | no | const out = []; |
| idx | const | 214 | no | const idx = new Map(type.instances.map((inst, i) =&gt; [inst.prov.domId, i])); |
| seen | const | 216 | no | const seen = new Set(out.flat()); |
| toMarkdown | function | 221 | no | function toMarkdown(r) { |
| L | const | 222 | no | const L = [`# Capture Studio intelligence evaluation`, &#39;&#39;, `Generated ${r.generatedAt} on Node ${r.node}. Synthetic ground truth; held-out fixtures were not used for tuning.`, &#39;&#39;]; |
| m | const | 244 | no | const m = r.heldout2.aggregate; |
| r | const | 256 | no | const r = await runEval(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| node:url | import | 6 | external |
| ./fixtures.mjs | import | 7 | [studio/eval/fixtures.mjs](./fixtures.mjs.md) |
| ./fixtures-v2.mjs | import | 8 | [studio/eval/fixtures-v2.mjs](./fixtures-v2.mjs.md) |
| ../src/intel/discover.mjs | import | 9 | [studio/src/intel/discover.mjs](../src/intel/discover.mjs.md) |
| ../src/intel/identity.mjs | import | 10 | [studio/src/intel/identity.mjs](../src/intel/identity.mjs.md) |
| ../src/intel/correlate.mjs | import | 11 | [studio/src/intel/correlate.mjs](../src/intel/correlate.mjs.md) |
| ../src/intel/learn.mjs | import | 12 | [studio/src/intel/learn.mjs](../src/intel/learn.mjs.md) |
| ../src/intel/schema.mjs | import | 13 | [studio/src/intel/schema.mjs](../src/intel/schema.mjs.md) |
| ./learning.mjs | dynamic | 258 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Intelligence evaluation harness. Usage: node eval/run.mjs [--split dev|heldout|all] [--json]
// Reports measured numbers only; writes eval/results/latest.json (+ .md).
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIXTURES } from './fixtures.mjs';
import { FIXTURES_V2 } from './fixtures-v2.mjs';
import { discoverModel } from '../src/intel/discover.mjs';
import { resolveType } from '../src/intel/identity.mjs';
import { correlateRendered } from '../src/intel/correlate.mjs';
import { ScopedLearner, heuristicRole, expectedCalibrationError } from '../src/intel/learn.mjs';
import { induce, schemaDiff, alignFields } from '../src/intel/schema.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const split = args.includes('--split') ? args[args.indexOf('--split') + 1] : 'all';

const jac = (a, b) => { const A = new Set(a), B = new Set(b); let i = 0; for (const x of A) if (B.has(x)) i++; return i / (A.size + B.size - i || 1); };
const typeEq = (gt, got) => gt === got || (gt === 'number' && got === 'integer') || (gt === 'integer' && got === 'number');

// Match discovered types to GT types by top-level field-name overlap (one-to-one, greedy).
function matchTypes(gtTypes, types, extras = []) {
  const cands = [];
  gtTypes.forEach((g, gi) => types.forEach((t, ti) => { const s = jac(Object.keys(g.fields), t.fields.map((f) => f.name)); if (s >= 0.5) cands.push({ gi, ti, s }); }));
  cands.sort((a, b) => b.s - a.s);
  const gU = new Set(), tU = new Set(), pairs = [];
  for (const c of cands) { if (gU.has(c.gi) || tU.has(c.ti)) continue; gU.add(c.gi); tU.add(c.ti); pairs.push(c); }
  const neutral = types.map((t, ti) => ti).filter((ti) => !tU.has(ti) && extras.some((ex) => jac(ex, types[ti].fields.map((f) => f.name)) >= 0.5));
  return { pairs, unmatchedGt: gtTypes.map((_, i) => i).filter((i) => !gU.has(i)), falsePos: types.map((_, i) => i).filter((i) => !tU.has(i) && !neutral.includes(i)), neutral };
}

function scoreModel(gt, model, acc) {
  const { pairs, unmatchedGt, falsePos } = matchTypes(gt.types, model.types, gt.extras ?? []);
  acc.typeTP += pairs.length; acc.typeFN += unmatchedGt.length; acc.typeFP += falsePos.length;
  const nameOf = new Map();
  for (const p of pairs) {
    const g = gt.types[p.gi], t = model.types[p.ti];
    nameOf.set(t.id, g.name);
    acc.keyTotal++;
    const gotKey = t.key && !t.key.weak ? t.key.field : null;
    if (gotKey === g.key) acc.keyOk++; else acc.keyMiss.push(`${g.name}: expected ${g.key}, got ${gotKey}`);
    for (const [fname, fg] of Object.entries(g.fields)) {
      const f = t.fields.find((x) => x.name === fname);
      if (!f) { acc.fieldMissing++; continue; }
      acc.fieldTotal++; if (typeEq(fg.type, f.type)) acc.fieldTypeOk++;
      if (fg.role) {
        acc.roleTotal++;
        const ok = f.role === fg.role; if (ok) acc.roleOk++; else acc.roleMiss.push(`${g.name}.${fname}: ${fg.role} vs ${f.role}`);
        if (heuristicRole(fname, f.schema) === fg.role) acc.heuristicRoleOk++;
        acc.calib.push([f.roleConfidence, ok]);
      }
    }
    if (g.tag) { acc.tagTotal++; if (t.tagged?.field === g.tag) acc.tagOk++; }
  }
  const gtRels = (gt.relationships ?? []).map((r) => `${r.from}.${r.field}->${r.to}`);
  const gotRels = model.relationships.filter((r) => r.kind === 'references').map((r) => `${nameOf.get(r.from) ?? '?'}.${r.field}->${nameOf.get(r.to) ?? '?'}`);
  for (const r of gotRels) { if (gtRels.includes(r)) acc.relTP++; else acc.relFP++; }
  for (const r of gtRels) if (!gotRels.includes(r)) { acc.relFN++; acc.relMiss.push(r); }
  return { pairs, nameOf };
}

function pairF1(truth, clusters) {
  // truth: label per instance index; clusters: arrays of instance indices.
  const pred = new Map(); clusters.forEach((c, ci) => c.forEach((i) => pred.set(i, ci)));
  let tp = 0, fp = 0, fn = 0;
  for (let i = 0; i < truth.length; i++) for (let j = i + 1; j < truth.length; j++) {
    const same = truth[i] === truth[j], linked = pred.get(i) === pred.get(j);
    if (same && linked) tp++; else if (!same && linked) fp++; else if (same && !linked) fn++;
  }
  const p = tp / (tp + fp || 1), r = tp / (tp + fn || 1);
  return { precision: +p.toFixed(3), recall: +r.toFixed(3), f1: +(2 * p * r / (p + r || 1)).toFixed(3) };
}

const fresh = () => ({ typeTP: 0, typeFP: 0, typeFN: 0, keyOk: 0, keyTotal: 0, keyMiss: [], fieldTypeOk: 0, fieldTotal: 0, fieldMissing: 0, roleOk: 0, heuristicRoleOk: 0, roleTotal: 0, roleMiss: [], tagOk: 0, tagTotal: 0, relTP: 0, relFP: 0, relFN: 0, relMiss: [], calib: [] });
const pr = (tp, fp, fn) => ({ precision: +(tp / (tp + fp || 1)).toFixed(3), recall: +(tp / (tp + fn || 1)).toFixed(3) });

function summarize(acc) {
  return {
    typeDiscovery: pr(acc.typeTP, acc.typeFP, acc.typeFN),
```

_First 80 of 264 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
