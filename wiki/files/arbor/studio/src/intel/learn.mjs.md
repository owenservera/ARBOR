# File: studio/src/intel/learn.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/learn.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 24707 B |
| Lines | 419 |
| Hash | 1b6d37f78d20 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROLES | export | 18 | yes | export { ROLES } |
| bucket | function | 20 | no | const bucket = (x, edges, labels) =&gt; { for (let i = 0; i &lt; edges.length; i++) if (x &lt;= edges[i]) return labels[i]; return labels[labels.length - 1]; }; |
| fieldFeatures | function | 23 | yes | export function fieldFeatures(name, d = {}, ctx = {}) { |
| f | const | 24 | no | const f = []; |
| toks | const | 25 | no | const toks = tokens(name); |
| kind | const | 29 | no | const kind = d.type === &#39;integer&#39; ? &#39;integer&#39; : d.type; |
| priorDescription | function | 53 | yes | export function priorDescription([name, kind, format, avgLen, uniq, extra = {}]) { |
| d | const | 54 | no | const d = { type: kind }; |
| RoleModel | class | 61 | yes | export class RoleModel { |
| constructor | method | 62 | yes | constructor(state) { |
| train | method | 70 | yes | train(features, role, weight = 1) { |
| trainBatch | method | 77 | yes | trainBatch(examples) { for (const e of examples) this.train(e.features, e.role, e.weight ?? 1); return this; } |
| decay | method | 78 | yes | decay(factor = 0.99) { |
| counts | const | 82 | no | const counts = this.featCounts[role]; |
| scaled | const | 85 | no | const scaled = counts[feature] * factor; |
| logScores | method | 92 | yes | logScores(features) { |
| V | const | 93 | no | const V = Math.max(1, this.vocab.size), total = Object.values(this.classCounts).reduce((a, b) =&gt; a + b, 0); |
| out | const | 94 | no | const out = {}; |
| s | variable | 96 | no | let s = Math.log((this.classCounts[r] + this.alpha) / (total + this.alpha * ROLES.length)); |
| predict | method | 103 | yes | predict(features) { return softmax(this.logScores(features)); } |
| explain | method | 104 | yes | explain(features, { limit = 12 } = {}) { |
| dist | const | 105 | no | const dist = this.predict(features), ranked = Object.entries(dist).sort((a, b) =&gt; b[1] - a[1]); |
| contributions | const | 107 | no | const contributions = [...new Set(features)].filter((f) =&gt; this.vocab.has(f)).map((feature) =&gt; ({ feature, logOdds: Math.log(((this.featCounts[winner][feature] ?? 0) + this.alpha) / (this.featTotals[… |
| toJSON | method | 114 | yes | toJSON() { return { classCounts: this.classCounts, featCounts: this.featCounts, featTotals: this.featTotals, vocab: [...this.vocab], examples: this.examples }; } |
| softmax | function | 117 | yes | export function softmax(scores) { |
| entries | const | 118 | no | const entries = Object.entries(scores); if (!entries.length) return {}; |
| infinite | const | 119 | no | const infinite = entries.filter(([, v]) =&gt; v === Infinity); |
| m | const | 122 | no | const m = Math.max(...entries.map(([, v]) =&gt; Number.isFinite(v) ? v : -Infinity)); |
| e | const | 123 | no | const e = Object.fromEntries(entries.map(([k, v]) =&gt; [k, Number.isFinite(v) ? Math.exp(v - m) : 0])); |
| z | const | 124 | no | const z = Object.values(e).reduce((a, b) =&gt; a + b, 0); |
| entropy | function | 128 | yes | export const entropy = (dist) =&gt; -Object.values(dist).reduce((a, p) =&gt; a + (p &gt; 0 ? p * Math.log2(p) : 0), 0); |
| argmax | function | 129 | yes | export const argmax = (dist) =&gt; Object.entries(dist).sort((a, b) =&gt; b[1] - a[1])[0]; |
| priorModel | function | 131 | yes | export function priorModel() { |
| m | const | 132 | no | const m = new RoleModel(); |
| heuristicRole | function | 138 | yes | export function heuristicRole(name, d = {}) { |
| t | const | 139 | no | const t = tokens(name), last = t[t.length - 1] ?? &#39;&#39;; |
| fm | const | 140 | no | const fm = d.string?.formats ?? {}; |
| SCOPES | const | 157 | yes | export const SCOPES = [&#39;instance&#39;, &#39;page&#39;, &#39;site&#39;, &#39;account&#39;, &#39;family&#39;, &#39;global&#39;]; |
| SCOPE_WEIGHT | const | 158 | no | const SCOPE_WEIGHT = { global: 1, family: 2, site: 3, account: 4, page: 5 }; |
| scopedKey | function | 159 | no | const scopedKey = (scope, ctx = {}) =&gt; { |
| instanceKey | function | 168 | no | const instanceKey = (ctx, name) =&gt; JSON.stringify([ctx.site ?? &#39;&#39;, ctx.origin ?? &#39;&#39;, ctx.account ?? &#39;&#39;, ctx.page ?? &#39;&#39;, ctx.instanceId ?? &#39;&#39;, ctx.typeKey ?? &#39;&#39;, name]); |
| ScopedLearner | class | 171 | yes | export class ScopedLearner { |
| constructor | method | 172 | yes | constructor(dir = null) { |
| _file | method | 187 | yes | _file() { return path.join(this.dir, &#39;learner.json&#39;); } |
| _load | method | 188 | yes | _load(snapshot = this.journal?.read()) { |
| reload | method | 203 | yes | reload() { if (!this.journal) return this.revision; this._load(); return this.revision; } |
| versions | method | 204 | yes | versions() { return this.journal?.versions() ?? []; } |
| save | method | 205 | yes | save() { |
| state | const | 207 | no | const state = { |
| written | const | 214 | no | const written = this.journal.commit(state, this.revision); |
| rollbackTo | method | 218 | yes | rollbackTo(revision, { actor = null, reason = null } = {}) { |
| priorAudit | const | 221 | no | const priorAudit = this.audit.slice(); |
| snap | const | 222 | no | const snap = this.journal.at(revision); |
| _chain | method | 231 | yes | _chain(ctx) { |
| predict | method | 235 | yes | predict(name, d, ctx = {}) { |
| key | const | 236 | no | const key = instanceKey(ctx, name); |
| legacyKey | const | 237 | no | const legacyKey = !ctx.origin &amp;&amp; !ctx.account &amp;&amp; !ctx.page &amp;&amp; !ctx.instanceId |
| feats | const | 241 | no | const feats = fieldFeatures(name, d, ctx); |
| total | const | 242 | no | const total = this.global.logScores(feats); |
| source | variable | 243 | no | let source = &#39;prior&#39;; |
| m | const | 245 | no | const m = this.models[k]; if (!m \|\| !m.examples) continue; |
| ls | const | 246 | no | const ls = m.logScores(feats); |
| w | const | 247 | no | const w = SCOPE_WEIGHT[scope] * Math.min(1, m.examples / 3); |
| dist | const | 251 | no | const dist = softmax(total); |
| ranked | const | 253 | no | const ranked = Object.values(dist).sort((a, b) =&gt; b - a); |
| _validate | method | 257 | yes | _validate({ scope, name, role, ctx = {}, weight = 5 }) { |
| _context | method | 268 | yes | _context(ctx = {}) { return { site: ctx.site, origin: ctx.origin, account: ctx.account, |
| _id | method | 270 | yes | _id() { this.nextCorrectionId++; return &#39;c&#39; + this.nextCorrectionId; } |
| _audit | method | 271 | yes | _audit(action, item, actor, evidence, note) { |
| proposeCorrection | method | 276 | yes | proposeCorrection({ scope, name, d = {}, ctx = {}, role, weight = 5, note, actor, evidence } = {}) { |
| proposal | const | 278 | no | const proposal = { id: this._id(), status: &#39;proposed&#39;, scope, name, role, weight, |
| reviewCorrection | method | 286 | yes | reviewCorrection(id, { action, actor, evidence, note } = {}) { |
| p | const | 288 | no | const p = this.proposals.find((x) =&gt; x.id === id); |
| _apply | method | 296 | yes | _apply(entry) { |
| learn | method | 303 | yes | learn({ scope, name, d = {}, ctx = {}, role, weight = 5, note, actor, evidence }) { |
| entry | const | 305 | no | const entry = { id: this._id(), at: new Date().toISOString(), scope, name, role, |
| revert | method | 313 | yes | revert(id, { actor, note } = {}) { |
| c | const | 314 | no | const c = this.corrections.find((x) =&gt; x.id === id); |
| _replay | method | 322 | yes | _replay(x) { |
| promotionCandidates | method | 327 | yes | promotionCandidates(minSites = 2) { |
| by | const | 328 | no | const by = new Map(); |
| sig | const | 331 | no | const sig = `${c.role}\|${c.features.filter((f) =&gt; f.startsWith(&#39;last:&#39;) \|\| f.startsWith(&#39;kind:&#39;) \|\| f.startsWith(&#39;fmt:&#39;)).sort().join(&#39;,&#39;)}`; |
| e | const | 332 | no | const e = by.get(sig) ?? { role: c.role, signature: sig, sites: new Set(), families: new Set(), examples: [] }; |
| Calibrator | class | 346 | yes | export class Calibrator { |
| constructor | method | 347 | yes | constructor(state) { this.bins = state?.bins ?? {}; this.nBins = 10; } |
| _b | method | 348 | yes | _b(p) { return Math.max(0, Math.min(this.nBins - 1, Math.floor(p * this.nBins))); } |
| observe | method | 349 | yes | observe(kind, p, accepted) { |
| k | function | 351 | no | const k = (this.bins[kind] ??= Array.from({ length: this.nBins }, () =&gt; ({ n: 0, pos: 0, psum: 0 }))); |
| b | const | 352 | no | const b = k[this._b(p)]; b.n++; b.psum += p; if (accepted) b.pos++; |
| calibrate | method | 354 | yes | calibrate(kind, p) { |
| k | const | 357 | no | const k = this.bins[kind]; if (!k) return p; |
| b | const | 358 | no | const b = k[this._b(p)]; if (b.n &lt; 3) return p; |
| reliability | method | 361 | yes | reliability(kind) { |
| bins | const | 362 | no | const bins = this.bins[kind] ?? Array.from({ length: this.nBins }, () =&gt; ({ n: 0, pos: 0, psum: 0 })); |
| blocks | const | 365 | no | const blocks = []; |
| a | const | 369 | no | const a = blocks[blocks.length - 2], b = blocks.at(-1); |
| block | const | 375 | no | const block = blocks.find((v) =&gt; i &gt;= v.from &amp;&amp; i &lt;= v.to); |
| ece | method | 381 | yes | ece(kind) { |
| k | const | 382 | no | const k = this.bins[kind]; if (!k) return null; |
| N | const | 383 | no | const N = k.reduce((a, b) =&gt; a + b.n, 0); if (!N) return null; |
| toJSON | method | 386 | yes | toJSON() { return { bins: this.bins }; } |
| expectedCalibrationError | function | 390 | yes | export function expectedCalibrationError(pairs, nBins = 10) { |
| bins | const | 392 | no | const bins = Array.from({ length: nBins }, () =&gt; ({ n: 0, c: 0, p: 0 })); |
| count | variable | 393 | no | let count = 0; |
| N | const | 395 | no | const N = count \|\| 1; |
| activeQuestions | function | 403 | yes | export function activeQuestions(items, n = 5, { maxPerGroup = Infinity } = {}) { |
| ranked | const | 404 | no | const ranked = items |
| groups | const | 408 | no | const groups = new Map(), seen = new Set(), chosen = []; |
| id | const | 411 | no | const id = item.id ?? item.prompt; |
| group | const | 413 | no | const group = item.group ?? item.typeKey ?? item.kind ?? &#39;other&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 12 | external |
| ./priors.mjs | import | 13 | [studio/src/intel/priors.mjs](./priors.mjs.md) |
| ./schema.mjs | import | 14 | [studio/src/intel/schema.mjs](./schema.mjs.md) |
| ./learner-journal.mjs | import | 15 | [studio/src/intel/learner-journal.mjs](./learner-journal.mjs.md) |
| ./statistics.mjs | import | 16 | [studio/src/intel/statistics.mjs](./statistics.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/learn.mjs](../../bin/commands/learn.mjs.md) | ../../src/intel/learn.mjs |
| [studio/bin/lib/context.mjs](../../bin/lib/context.mjs.md) | ../../src/intel/learn.mjs |
| [studio/eval/run.mjs](../../eval/run.mjs.md) | ../src/intel/learn.mjs |
| [studio/src/capture/campaign.mjs](../capture/campaign.mjs.md) | ../intel/learn.mjs |
| [studio/src/intel/discover.mjs](./discover.mjs.md) | ./learn.mjs |
| [studio/src/mcp/runtime.mjs](../mcp/runtime.mjs.md) | ../intel/learn.mjs |
| [studio/src/replay/derive.mjs](../replay/derive.mjs.md) | ../intel/learn.mjs |
| [studio/src/studio/integration-hub.mjs](../studio/integration-hub.mjs.md) | ../intel/learn.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../intel/learn.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Adaptive learning layer.
//
//   RoleModel       multinomial naive Bayes over structural field features (small, fast,
//                   incremental, interpretable; works with very few labels)
//   ScopedLearner   instance > page > site > family > global, with explicit promotion so a
//                   local correction never silently changes unrelated sites
//   Calibrator      histogram binning (Laplace smoothed) mapping raw confidence -> observed
//                   acceptance rate, per suggestion kind; reports ECE
//   activeQuestions which single clarification would reduce the most uncertainty
//
// All state is plain JSON so learned behaviour is versionable, inspectable and reversible.
import path from 'node:path';
import { ROLES, PRIOR_FIELDS, PRIOR_ROLES } from './priors.mjs';
import { tokens } from './schema.mjs';
import { LearnerJournal } from './learner-journal.mjs';
import { wilsonInterval } from './statistics.mjs';

export { ROLES };

const bucket = (x, edges, labels) => { for (let i = 0; i < edges.length; i++) if (x <= edges[i]) return labels[i]; return labels[labels.length - 1]; };

// Features of one field from its induced schema description (or a compact prior tuple).
export function fieldFeatures(name, d = {}, ctx = {}) {
  const f = [];
  const toks = tokens(name);
  for (const t of toks) f.push(`tok:${t}`);
  if (toks.length) f.push(`last:${toks[toks.length - 1]}`);
  if (toks.length > 1) f.push('compound');
  const kind = d.type === 'integer' ? 'integer' : d.type;
  f.push(`kind:${kind ?? 'unknown'}`);
  if (d.string) {
    for (const fm of Object.keys(d.string.formats ?? {})) f.push(`fmt:${fm}`);
    f.push(`len:${bucket(d.string.avgLen ?? 0, [3, 12, 40, 120], ['tiny', 'short', 'medium', 'long', 'verylong'])}`);
    f.push(`uniq:${bucket(d.string.uniqueness ?? 0, [0.15, 0.6, 0.95], ['low', 'mid', 'high', 'unique'])}`);
    if (d.string.enum) f.push('enum');
  }
  if (d.number) {
    if (d.number.format) f.push(`fmt:${d.number.format}`);
    f.push(`uniq:${bucket(d.number.uniqueness ?? 0, [0.15, 0.6, 0.95], ['low', 'mid', 'high', 'unique'])}`);
    f.push(`vol:${bucket(d.number.changeRate ?? 0, [0.1, 0.5], ['static', 'some', 'volatile'])}`);
    if (Number.isInteger(d.number.min) && Number.isInteger(d.number.max)) f.push('ints');
    if (d.number.min >= 0 && d.number.max <= 1) f.push('range:unit');
  }
  if (d.boolean) f.push('kind:boolean');
  if (d.presence !== undefined) f.push(`pres:${bucket(d.presence, [0.5, 0.99], ['sparse', 'mostly', 'always'])}`);
  if (ctx.depth !== undefined) f.push(`depth:${Math.min(ctx.depth, 3)}`);
  if (ctx.inArray) f.push('in_array');
  if (ctx.isKeyCandidate) f.push('keycand');
  return [...new Set(f)];
}

// Turn a prior tuple into a pseudo schema description so priors and live data share features.
export function priorDescription([name, kind, format, avgLen, uniq, extra = {}]) {
  const d = { type: kind };
  if (kind === 'string') d.string = { formats: format ? { [format]: 1 } : {}, avgLen: avgLen ?? 10, uniqueness: uniq ?? 0.5, ...(extra.enum ? { enum: [{}] } : {}) };
  if (kind === 'integer' || kind === 'number') d.number = { format: format ?? undefined, uniqueness: uniq ?? 0.5, changeRate: extra.volatile ? 0.8 : 0.05, min: 0, max: kind === 'integer' ? 100 : 99.5 };
  if (kind === 'boolean') d.boolean = { trueShare: 0.5 };
  return d;
}

export class RoleModel {
  constructor(state) {
    this.alpha = 0.5;
    this.classCounts = state?.classCounts ?? Object.fromEntries(ROLES.map((r) => [r, 0]));
    this.featCounts = state?.featCounts ?? Object.fromEntries(ROLES.map((r) => [r, {}]));
    this.featTotals = state?.featTotals ?? Object.fromEntries(ROLES.map((r) => [r, 0]));
    this.vocab = new Set(state?.vocab ?? []);
    this.examples = state?.examples ?? 0;
  }
  train(features, role, weight = 1) {
    if (!ROLES.includes(role)) throw new Error(`unknown role ${role}`);
    if (!Number.isFinite(weight) || weight <= 0) throw new RangeError('Training weight must be positive and finite');
    this.classCounts[role] += weight;
    for (const f of new Set(features)) { if (typeof f !== 'string' || !f) continue; this.featCounts[role][f] = (this.featCounts[role][f] ?? 0) + weight; this.featTotals[role] += weight; this.vocab.add(f); }
    this.examples += weight;
  }
  trainBatch(examples) { for (const e of examples) this.train(e.features, e.role, e.weight ?? 1); return this; }
  decay(factor = 0.99) {
    if (!Number.isFinite(factor) || factor <= 0 || factor > 1) throw new RangeError('Decay factor must be in (0, 1]');
    for (const role of ROLES) {
```

_First 80 of 420 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
