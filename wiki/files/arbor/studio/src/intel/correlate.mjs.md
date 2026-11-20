# File: studio/src/intel/correlate.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/correlate.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9253 B |
| Lines | 106 |
| Hash | 032c17a2191a |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sigmoid | function | 13 | no | const sigmoid = (x) =&gt; 1 / (1 + Math.exp(-x)); |
| STREAMING | const | 14 | no | const STREAMING = new Set([&#39;HTTP_SSE&#39;, &#39;HTTP_NDJSON&#39;, &#39;HTTP_STREAMED&#39;, &#39;EVENT_SOURCE&#39;, &#39;WEBSOCKET&#39;]); |
| correlateActions | function | 16 | yes | export function correlateActions(actions, streams, { windowMs = 3000 } = {}) { |
| hyps | const | 17 | no | const hyps = []; |
| acts | const | 18 | no | const acts = actions.filter((a) =&gt; Number.isFinite(a.t) &amp;&amp; [&#39;click&#39;, &#39;enter&#39;, &#39;submit&#39;, &#39;scroll&#39;, &#39;toggle&#39;, &#39;input&#39;].includes(a.kind)).sort((a, b) =&gt; a.t - b.t \|\| (a.seq ?? 0) - (b.seq ?? 0)); |
| lowerBound | function | 19 | no | const lowerBound = (time) =&gt; { let lo = 0, hi = acts.length; while (lo &lt; hi) { const mid = (lo + hi) &gt;&gt;&gt; 1; if (acts[mid].t &lt; time) lo = mid + 1; else hi = mid; } return lo; }; |
| start | const | 22 | no | const start = lowerBound(s.startedT - windowMs), end = lowerBound(s.startedT + 51); |
| prior | const | 23 | no | const prior = acts.slice(start, end); |
| cands | const | 25 | no | const cands = prior.map((a) =&gt; { const signedDt = s.startedT - a.t, dt = Math.max(0, signedDt); const intervening = Math.max(0, lowerBound(s.startedT + 1) - lowerBound(a.t + 1)); const kindW = { clic… |
| signedDt | const | 26 | no | const signedDt = s.startedT - a.t, dt = Math.max(0, signedDt); |
| intervening | const | 27 | no | const intervening = Math.max(0, lowerBound(s.startedT + 1) - lowerBound(a.t + 1)); |
| kindW | const | 28 | no | const kindW = { click: 1.2, enter: 1.4, submit: 1.5, scroll: 0.6, toggle: 0.7, input: 0.2 }[a.kind] ?? 0.3; |
| x | const | 29 | no | const x = 2.2 - dt / 700 - 1.6 * intervening + kindW + (s.initiator === &#39;script&#39; ? 0.4 : s.initiator === &#39;parser&#39; ? -0.8 : 0) + (STREAMING.has(s.transport) ? 0.3 : 0) - (s.resourceType === &#39;Image&#39; ? … |
| best | const | 32 | no | const best = cands[0]; |
| second | const | 33 | no | const second = cands[1]; |
| margin | const | 34 | no | const margin = best.score - (second?.score ?? 0); |
| causal | const | 35 | no | const causal = best.dt &gt;= 0 &amp;&amp; best.score &gt;= 0.7 &amp;&amp; best.intervening === 0 &amp;&amp; margin &gt;= 0.1; |
| salient | function | 42 | no | function salient(obj, out = [], depth = 0) { |
| tok | function | 51 | no | const tok = (s) =&gt; String(s).toLowerCase().split(/[^\\p{L}\\p{N}.]+/u).filter((t) =&gt; t.length &gt;= 2); |
| correlateRendered | function | 54 | yes | export function correlateRendered(subjects, elements, { minScore = 0.35 } = {}) { |
| df | const | 56 | no | const df = new Map(); |
| elTok | const | 57 | no | const elTok = elements.map((e) =&gt; { const ts = new Set(tok(e.text ?? &#39;&#39;)); for (const t of ts) df.set(t, (df.get(t) ?? 0) + 1); return ts; }); |
| elSh | const | 58 | no | const elSh = elements.map((e) =&gt; shingles(e.text ?? &#39;&#39;)); |
| postings | const | 59 | no | const postings = new Map(); |
| N | const | 61 | no | const N = Math.max(1, elements.length); |
| idf | function | 62 | no | const idf = (t) =&gt; Math.log((N + 1) / ((df.get(t) ?? 0) + 0.5)); |
| hyps | const | 63 | no | const hyps = []; |
| vals | const | 65 | no | const vals = s.text ? [s.text] : salient(s.attrs); |
| sTok | const | 66 | no | const sTok = new Set(vals.flatMap(tok)); |
| sSh | const | 68 | no | const sSh = shingles(vals.filter((v) =&gt; v.length &gt; 20).join(&#39; &#39;)); |
| totalW | const | 69 | no | const totalW = [...sTok].reduce((a, t) =&gt; a + idf(t), 0) \|\| 1; |
| candidates | const | 70 | no | const candidates = new Set(); for (const token of sTok) for (const i of postings.get(token) ?? []) candidates.add(i); |
| scored | const | 71 | no | const scored = [...candidates].filter((i) =&gt; sourcesCompatible(s.source ?? null, elements[i].source ?? null)).map((i) =&gt; { const e = elements[i]; let w = 0; for (const t of sTok) if (elTok[i].has(t))… |
| e | const | 72 | no | const e = elements[i]; |
| w | variable | 73 | no | let w = 0; for (const t of sTok) if (elTok[i].has(t)) w += idf(t); |
| tfidf | const | 74 | no | const tfidf = w / totalW; |
| shC | const | 75 | no | const shC = sSh.size ? containment(sSh, elSh[i]) : 0; |
| overlap | const | 76 | no | const overlap = Number.isFinite(s.t0) &amp;&amp; Number.isFinite(e.firstT) ? ((e.lastT ?? e.firstT) &gt;= s.t0 - 500 &amp;&amp; e.firstT &lt;= (s.t1 ?? s.t0) + 5000 ? 1 : 0) : 0.5; |
| score | const | 77 | no | const score = 0.5 * tfidf + 0.35 * shC + 0.15 * overlap; |
| near | const | 82 | no | const near = scored.filter((x) =&gt; scored[0].score - x.score &lt;= 0.025); |
| best | const | 84 | no | const best = near.sort((a, b) =&gt; (a.element.text?.length ?? Infinity) - (b.element.text?.length ?? Infinity) \|\| b.score - a.score)[0]; |
| second | const | 87 | no | const second = scored.find((x) =&gt; x.element.id !== best.element.id &amp;&amp; ((!!x.element.text &amp;&amp; x.element.text === best.element.text) \|\| (!(x.element.text ?? &#39;&#39;).includes(best.element.text ?? &#39;\\u0000&#39;) &amp;… |
| claims | const | 91 | no | const claims = new Map(); |
| reconcileFinal | function | 98 | yes | export function reconcileFinal(assembledText, renderedText) { |
| payload | const | 99 | no | const payload = normalizeText(assembledText), ui = normalizeText(renderedText); |
| a | const | 102 | no | const a = shingles(assembledText ?? &#39;&#39;), r = shingles(renderedText ?? &#39;&#39;); |
| forward | const | 103 | no | const forward = containment(a, r), backward = containment(r, a); |
| agreement | const | 104 | no | const agreement = +Math.min(forward, Math.max(backward, forward * 0.9)).toFixed(3); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./identity.mjs | import | 9 | [studio/src/intel/identity.mjs](./identity.mjs.md) |
| ./similarity.mjs | import | 10 | [studio/src/intel/similarity.mjs](./similarity.mjs.md) |
| ./join.mjs | import | 11 | [studio/src/intel/join.mjs](./join.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/eval/run.mjs](../../eval/run.mjs.md) | ../src/intel/correlate.mjs |
| [studio/src/capture/acceptance.mjs](../capture/acceptance.mjs.md) | ../intel/correlate.mjs |
| [studio/src/replay/derive.mjs](../replay/derive.mjs.md) | ../intel/correlate.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Cross-layer correlation as scored hypotheses, never asserted facts.
//
//   action -> stream   causal vs merely temporal (precedence, latency, intervening actions,
//                      initiator type, action kind)
//   entity -> element  which rendered element shows which entity/stream: TF-IDF weighted
//                      salient-value overlap + text shingle containment + activity overlap
//   payload <-> UI     final assembled content vs final rendered text (agreement / divergence)
// Each hypothesis carries features, score and a status: likely | ambiguous | conflict | weak.
import { shingles, containment } from './identity.mjs';
import { normalizeText } from './similarity.mjs';
import { sourcesCompatible } from './join.mjs';

const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const STREAMING = new Set(['HTTP_SSE', 'HTTP_NDJSON', 'HTTP_STREAMED', 'EVENT_SOURCE', 'WEBSOCKET']);

export function correlateActions(actions, streams, { windowMs = 3000 } = {}) {
  const hyps = [];
  const acts = actions.filter((a) => Number.isFinite(a.t) && ['click', 'enter', 'submit', 'scroll', 'toggle', 'input'].includes(a.kind)).sort((a, b) => a.t - b.t || (a.seq ?? 0) - (b.seq ?? 0));
  const lowerBound = (time) => { let lo = 0, hi = acts.length; while (lo < hi) { const mid = (lo + hi) >>> 1; if (acts[mid].t < time) lo = mid + 1; else hi = mid; } return lo; };
  for (const s of streams) {
    if (!Number.isFinite(s.startedT)) continue;
    const start = lowerBound(s.startedT - windowMs), end = lowerBound(s.startedT + 51);
    const prior = acts.slice(start, end);
    if (!prior.length) continue;
    const cands = prior.map((a) => {
      const signedDt = s.startedT - a.t, dt = Math.max(0, signedDt);
      const intervening = Math.max(0, lowerBound(s.startedT + 1) - lowerBound(a.t + 1));
      const kindW = { click: 1.2, enter: 1.4, submit: 1.5, scroll: 0.6, toggle: 0.7, input: 0.2 }[a.kind] ?? 0.3;
      const x = 2.2 - dt / 700 - 1.6 * intervening + kindW + (s.initiator === 'script' ? 0.4 : s.initiator === 'parser' ? -0.8 : 0) + (STREAMING.has(s.transport) ? 0.3 : 0) - (s.resourceType === 'Image' ? 1 : 0);
      return { action: a, dt: signedDt, intervening, score: sigmoid(x - 1.5 - (signedDt < 0 ? 1.5 : 0)) };
    }).sort((a, b) => b.score - a.score);
    const best = cands[0];
    const second = cands[1];
    const margin = best.score - (second?.score ?? 0);
    const causal = best.dt >= 0 && best.score >= 0.7 && best.intervening === 0 && margin >= 0.1;
    hyps.push({ kind: 'action_causes_request', t: s.startedT, from: { actionSeq: best.action.seq, kind: best.action.kind, label: best.action.target?.label }, to: { sid: s.sid }, score: +best.score.toFixed(3), relation: causal ? 'causal' : 'temporal', features: { latencyMs: best.dt, interveningActions: best.intervening, initiator: s.initiator ?? null, candidateCount: cands.length, scoreMargin: +margin.toFixed(3), causalProof: false }, status: second && margin < 0.1 ? 'ambiguous' : best.score >= 0.6 ? 'likely' : 'weak', alternatives: cands.slice(1, 4).map((c) => ({ actionSeq: c.action.seq, score: +c.score.toFixed(3), latencyMs: c.dt })) });
  }
  return hyps;
}

// Salient values of an object: long-ish strings and distinctive numbers, flattened.
function salient(obj, out = [], depth = 0) {
  if (depth > 6 || obj === null || obj === undefined) return out;
  if (typeof obj === 'string') { const s = obj.trim(); if (s.length >= 3 && s.length <= 4000 && !/^[0-9a-f-]{20,}$/i.test(s)) out.push(s); return out; }
   if (typeof obj === 'number') { if (Number.isFinite(obj) && (Math.abs(obj) >= 10 || !Number.isInteger(obj))) out.push(String(obj), obj.toFixed(2)); return out; }
  if (Array.isArray(obj)) { for (const x of obj.slice(0, 50)) salient(x, out, depth + 1); return out; }
  if (typeof obj === 'object') for (const v of Object.values(obj)) salient(v, out, depth + 1);
  return out;
}

const tok = (s) => String(s).toLowerCase().split(/[^\p{L}\p{N}.]+/u).filter((t) => t.length >= 2);

// subjects: [{ id, kind: 'entity'|'stream', attrs|text, t0, t1 }] ; elements: [{ id, text, firstT, lastT }]
export function correlateRendered(subjects, elements, { minScore = 0.35 } = {}) {
  // Document frequency of tokens across rendered elements (specificity).
  const df = new Map();
  const elTok = elements.map((e) => { const ts = new Set(tok(e.text ?? '')); for (const t of ts) df.set(t, (df.get(t) ?? 0) + 1); return ts; });
  const elSh = elements.map((e) => shingles(e.text ?? ''));
  const postings = new Map();
  elTok.forEach((tokens, i) => { for (const token of tokens) { if (!postings.has(token)) postings.set(token, new Set()); postings.get(token).add(i); } });
  const N = Math.max(1, elements.length);
  const idf = (t) => Math.log((N + 1) / ((df.get(t) ?? 0) + 0.5));
  const hyps = [];
  for (const s of subjects) {
    const vals = s.text ? [s.text] : salient(s.attrs);
    const sTok = new Set(vals.flatMap(tok));
    if (!sTok.size) continue;
    const sSh = shingles(vals.filter((v) => v.length > 20).join(' '));
    const totalW = [...sTok].reduce((a, t) => a + idf(t), 0) || 1;
    const candidates = new Set(); for (const token of sTok) for (const i of postings.get(token) ?? []) candidates.add(i);
    const scored = [...candidates].filter((i) => sourcesCompatible(s.source ?? null, elements[i].source ?? null)).map((i) => {
      const e = elements[i];
      let w = 0; for (const t of sTok) if (elTok[i].has(t)) w += idf(t);
      const tfidf = w / totalW;
      const shC = sSh.size ? containment(sSh, elSh[i]) : 0;
      const overlap = Number.isFinite(s.t0) && Number.isFinite(e.firstT) ? ((e.lastT ?? e.firstT) >= s.t0 - 500 && e.firstT <= (s.t1 ?? s.t0) + 5000 ? 1 : 0) : 0.5;
      const score = 0.5 * tfidf + 0.35 * shC + 0.15 * overlap;
      return { element: e, score, features: { tfidf: +tfidf.toFixed(3), shingleContainment: +shC.toFixed(3), activityOverlap: overlap } };
    }).filter((x) => x.score >= minScore).sort((a, b) => b.score - a.score || String(a.element.id).localeCompare(String(b.element.id)));
    if (!scored.length) { hyps.push({ kind: 'rendered_as', from: { [s.kind]: s.id }, to: null, score: 0, status: 'no_rendered_match', features: {} }); continue; }
```

_First 80 of 107 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
