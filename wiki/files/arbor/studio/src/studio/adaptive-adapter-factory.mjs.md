# File: studio/src/studio/adaptive-adapter-factory.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/adaptive-adapter-factory.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11651 B |
| Lines | 181 |
| Hash | a59d547b45ae |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FACTORY_SCHEMA | const | 5 | yes | export const FACTORY_SCHEMA = &#39;aion.adaptive-webapp-adapter/1&#39;; |
| canonical | function | 8 | no | const canonical = (v) =&gt; Array.isArray(v) ? `[${v.map(canonical).join(&#39;,&#39;)}]` |
| candidateDigest | function | 13 | yes | export function candidateDigest(candidate) { |
| FEATURES | const | 19 | no | const FEATURES = Object.freeze([ &#39;composer&#39;, &#39;send-control&#39;, &#39;user-turn&#39;, &#39;assistant-turn&#39;, &#39;stop-control&#39;, &#39;thread-route&#39;, &#39;citation&#39;, &#39;artifact&#39;, &#39;task-progress&#39;, &#39;stream-component&#39;, ]); |
| FEATURE_SET | const | 23 | no | const FEATURE_SET = new Set(FEATURES); |
| TYPES | const | 24 | no | const TYPES = new Set([&#39;selector&#39;, &#39;route&#39;, &#39;stream-map&#39;]); |
| OUTCOMES | const | 25 | no | const OUTCOMES = new Set([&#39;present&#39;, &#39;absent&#39;, &#39;unknown&#39;]); |
| CARRIERS | const | 26 | no | const CARRIERS = new Set([&#39;dom&#39;, &#39;a11y&#39;, &#39;network&#39;, &#39;correlated&#39;]); |
| SOURCES | const | 27 | no | const SOURCES = new Set([&#39;SAVED_REAL_CAPTURE&#39;, &#39;SANDBOX_REAL_BROWSER&#39;, &#39;WINDOWS_LIVE_ACCEPTED&#39;, &#39;SYNTHETIC_TEST&#39;]); |
| READ_FEATURES | const | 28 | no | const READ_FEATURES = new Set([&#39;user-turn&#39;, &#39;assistant-turn&#39;, &#39;thread-route&#39;, &#39;citation&#39;, &#39;artifact&#39;, &#39;task-progress&#39;, &#39;stream-component&#39;]); |
| evidenceKey | function | 29 | no | const evidenceKey = (o) =&gt; `${o.captureId}:${o.sequence}`; |
| isString | function | 30 | no | const isString = (s, n = 256) =&gt; typeof s === &#39;string&#39; &amp;&amp; !!s.length &amp;&amp; s.length &lt;= n &amp;&amp; !/[\\x00-\\x1f\\x7f]/.test(s); |
| compare | function | 31 | no | const compare = (a, b) =&gt; a &lt; b ? -1 : a &gt; b ? 1 : 0; |
| safeOrigin | function | 32 | no | function safeOrigin(origin) { |
| u | variable | 34 | no | let u; |
| observationValid | function | 39 | no | function observationValid(o, siteId, origin, surface) { |
| ruleType | function | 51 | no | function ruleType(feature) { |
| groupEvidence | function | 56 | no | function groupEvidence(samples) { |
| byCapture | const | 57 | no | const byCapture = new Map(); |
| prior | const | 59 | no | const prior = byCapture.get(o.captureId); |
| next | const | 63 | no | const next = prior.outcome === o.outcome ? prior.outcome : &#39;unknown&#39;; |
| scoreCandidate | function | 71 | no | function scoreCandidate(group, baseline) { |
| votes | const | 72 | no | const votes = groupEvidence(group.samples); |
| pos | const | 73 | no | const pos = votes.filter(x =&gt; x.outcome === &#39;present&#39;); |
| neg | const | 74 | no | const neg = votes.filter(x =&gt; x.outcome === &#39;absent&#39;); |
| unk | const | 75 | no | const unk = votes.length - pos.length - neg.length; |
| realPositive | const | 76 | no | const realPositive = pos.filter(x =&gt; x.source !== &#39;SYNTHETIC_TEST&#39; &amp;&amp; x.source !== &#39;MIXED&#39;).length; |
| rate | const | 77 | no | const rate = (pos.length + neg.length) ? pos.length / (pos.length + neg.length) : 0; |
| confidence | const | 78 | no | const confidence = +((pos.length + 1) / (pos.length + neg.length + 2)).toFixed(4); |
| eligible | const | 79 | no | const eligible = pos.length &gt;= 3 &amp;&amp; realPositive &gt;= 2 &amp;&amp; neg.length === 0; |
| synthesizeWebappAdapter | function | 92 | yes | export function synthesizeWebappAdapter({ siteId, origin, surface = &#39;chat&#39;, observations = [], prior = null } = {}) { |
| groups | const | 99 | no | const groups = new Map(); |
| key | const | 103 | no | const key = JSON.stringify([observation.feature, observation.type, observation.candidate]); |
| features | const | 107 | no | const features = {}; |
| drift | const | 108 | no | const drift = []; |
| old | const | 110 | no | const old = prior?.features?.[feature]?.selected?.candidate ?? null; |
| ranked | const | 111 | no | const ranked = [...groups.values()].filter(x =&gt; x.feature === feature) |
| best | const | 117 | no | const best = ranked.find(x =&gt; x.status === &#39;shadow-ready&#39;) ?? ranked.find(x =&gt; x.provenance.positive &gt; 0) ?? null; |
| previousPresent | const | 118 | no | const previousPresent = old &amp;&amp; ranked.find(x =&gt; x.candidate === old); |
| previousContradicted | const | 119 | no | const previousContradicted = !!(previousPresent &amp;&amp; previousPresent.provenance.contradicted &gt; 0); |
| inheritable | const | 123 | no | const inheritable = !best &amp;&amp; !previousContradicted &amp;&amp; !!prior?.features?.[feature]?.selected; |
| selected | const | 124 | no | const selected = best ?? (inheritable ? prior.features[feature].selected : null); |
| covers | const | 134 | no | const covers = Object.fromEntries(Object.entries(features).map(([k,v]) =&gt; [k, v.selected?.status ?? &#39;unverified&#39;])); |
| uniqueCaptures | const | 135 | no | const uniqueCaptures = [...new Set(observations.map(o =&gt; o.captureId))].sort(compare); |
| candidate | const | 136 | no | const candidate = { |
| shadowEvaluateAdapter | function | 154 | yes | export function shadowEvaluateAdapter(candidate, heldout = []) { |
| checks | const | 157 | no | const checks = []; |
| rule | const | 159 | no | const rule = slot.selected; |
| samples | const | 161 | no | const samples = heldout.filter(o =&gt; o.feature === feature &amp;&amp; o.candidate === rule.candidate); |
| confirmed | const | 167 | no | const confirmed = checks.filter(x =&gt; x.passed); |
| failed | const | 168 | no | const failed = checks.filter(x =&gt; !x.passed &amp;&amp; !x.unknown); |
| observedFeatures | const | 169 | no | const observedFeatures = [...new Set(confirmed.map(x =&gt; x.feature))]; |
| readyReadFeatures | const | 170 | no | const readyReadFeatures = observedFeatures.filter(x =&gt; READ_FEATURES.has(x) &amp;&amp; candidate.features[x].selected.status === &#39;shadow-ready&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/adapter-factory-service.mjs](./adapter-factory-service.mjs.md) | ./adaptive-adapter-factory.mjs |
| [studio/src/studio/adapter-studio-bridge.mjs](./adapter-studio-bridge.mjs.md) | ./adaptive-adapter-factory.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Agent 14 — generic, pure, evidence-weighted adapter candidate compiler.
// Does not run CDP, execute DOM selectors, invoke a sender, or modify the current profile.
// Existing Capture Studio capture/intelligence components produce the observations.
import { createHash } from 'node:crypto';
export const FACTORY_SCHEMA = 'aion.adaptive-webapp-adapter/1';

// Canonical (sorted-key) JSON so a JSON round-trip through a client cannot change the digest.
const canonical = (v) => Array.isArray(v) ? `[${v.map(canonical).join(',')}]`
  : v && typeof v === 'object' ? `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`
  : JSON.stringify(v ?? null);
// Content digest of a candidate: everything the factory derived from evidence. Server-side
// stamps added after synthesis (`digest` itself, `basis`) are excluded.
export function candidateDigest(candidate) {
  if (!candidate || typeof candidate !== 'object') throw new TypeError('INVALID_CANDIDATE');
  const { digest: _d, basis: _b, ...content } = candidate;
  return createHash('sha256').update(canonical(content)).digest('hex');
}

const FEATURES = Object.freeze([
  'composer', 'send-control', 'user-turn', 'assistant-turn', 'stop-control',
  'thread-route', 'citation', 'artifact', 'task-progress', 'stream-component',
]);
const FEATURE_SET = new Set(FEATURES);
const TYPES = new Set(['selector', 'route', 'stream-map']);
const OUTCOMES = new Set(['present', 'absent', 'unknown']);
const CARRIERS = new Set(['dom', 'a11y', 'network', 'correlated']);
const SOURCES = new Set(['SAVED_REAL_CAPTURE', 'SANDBOX_REAL_BROWSER', 'WINDOWS_LIVE_ACCEPTED', 'SYNTHETIC_TEST']);
const READ_FEATURES = new Set(['user-turn', 'assistant-turn', 'thread-route', 'citation', 'artifact', 'task-progress', 'stream-component']);
const evidenceKey = (o) => `${o.captureId}:${o.sequence}`;
const isString = (s, n = 256) => typeof s === 'string' && !!s.length && s.length <= n && !/[\x00-\x1f\x7f]/.test(s);
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
function safeOrigin(origin) {
  if (!isString(origin, 512)) throw new TypeError('INVALID_ORIGIN');
  let u;
  try { u = new URL(origin); } catch { throw new TypeError('INVALID_ORIGIN'); }
  if (u.protocol !== 'https:' || u.origin !== origin) throw new TypeError('INVALID_ORIGIN');
  return origin;
}
function observationValid(o, siteId, origin, surface) {
  if (!o || typeof o !== 'object' || o.siteId !== siteId || o.origin !== origin || o.surface !== surface
    || !FEATURE_SET.has(o.feature) || !TYPES.has(o.type) || !OUTCOMES.has(o.outcome)
    || !CARRIERS.has(o.carrier) || !SOURCES.has(o.evidenceClass)
    || !isString(o.candidate, 320) || !isString(o.captureId, 128)
    || !Number.isSafeInteger(o.sequence) || o.sequence < 0
    || (o.outcome === 'absent' && o.coverage !== 'complete')) return false;
  // A producer may report absence only with a complete bounded probe; otherwise unknown.
  if (o.type === 'selector' && !['dom', 'a11y'].includes(o.carrier)) return false;
  if (o.type === 'stream-map' && !['network', 'correlated'].includes(o.carrier)) return false;
  return true;
}
function ruleType(feature) {
  if (feature === 'thread-route') return 'route';
  if (feature === 'stream-component') return 'stream-map';
  return 'selector';
}
function groupEvidence(samples) {
  const byCapture = new Map();
  for (const o of samples) {
    const prior = byCapture.get(o.captureId);
    // A capture can provide at most one vote; contradictory probes count as unknown.
    if (!prior) byCapture.set(o.captureId, { outcome: o.outcome, refs: [evidenceKey(o)], source: o.evidenceClass });
    else {
      const next = prior.outcome === o.outcome ? prior.outcome : 'unknown';
      prior.outcome = next;
      prior.refs.push(evidenceKey(o));
      if (prior.source !== o.evidenceClass) prior.source = 'MIXED';
    }
  }
  return [...byCapture.values()];
}
function scoreCandidate(group, baseline) {
  const votes = groupEvidence(group.samples);
  const pos = votes.filter(x => x.outcome === 'present');
  const neg = votes.filter(x => x.outcome === 'absent');
  const unk = votes.length - pos.length - neg.length;
  const realPositive = pos.filter(x => x.source !== 'SYNTHETIC_TEST' && x.source !== 'MIXED').length;
  const rate = (pos.length + neg.length) ? pos.length / (pos.length + neg.length) : 0;
  const confidence = +((pos.length + 1) / (pos.length + neg.length + 2)).toFixed(4);
  const eligible = pos.length >= 3 && realPositive >= 2 && neg.length === 0;
  return {
```

_First 80 of 181 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
