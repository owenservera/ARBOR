# File: studio/src/families/evidence-partitions.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/families/evidence-partitions.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 17005 B |
| Lines | 295 |
| Hash | 9e7f28d94701 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| EVIDENCE_PARTITIONS_SCHEMA | const | 81 | yes | export const EVIDENCE_PARTITIONS_SCHEMA = &#39;capture-studio.evidence-partitions/1&#39;; |
| FAMILY_EVIDENCE_SCHEMA | const | 86 | yes | export const FAMILY_EVIDENCE_SCHEMA = &#39;capture-studio.family-evidence/1&#39;; |
| FAMILY_EVIDENCE_VERSION | const | 87 | yes | export const FAMILY_EVIDENCE_VERSION = 1; |
| PAGE_SCHEMES | const | 89 | no | const PAGE_SCHEMES = new Set([&#39;http:&#39;, &#39;https:&#39;]); |
| NETWORK_SCHEMES | const | 90 | no | const NETWORK_SCHEMES = new Set([&#39;http:&#39;, &#39;https:&#39;, &#39;ws:&#39;, &#39;wss:&#39;]); |
| EXCLUDABLE_ROLES | const | 91 | no | const EXCLUDABLE_ROLES = new Set([&#39;config&#39;, &#39;telemetry&#39;]); |
| EXCLUDING_CONFIDENCE | const | 92 | no | const EXCLUDING_CONFIDENCE = new Set([&#39;medium&#39;, &#39;high&#39;]); |
| isObj | function | 94 | no | const isObj = (v) =&gt; v !== null &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); |
| norm | function | 95 | no | const norm = (v) =&gt; (typeof v === &#39;string&#39; ? v.trim().toLowerCase() \|\| null : null); |
| sidOf | function | 96 | no | const sidOf = (row) =&gt; (row.sid === undefined \|\| row.sid === null \|\| row.sid === &#39;&#39; ? null : row.sid); |
| parseSite | function | 98 | no | function parseSite(siteUrl) { |
| input | const | 102 | no | const input = siteUrl.trim(); |
| u | variable | 103 | no | let u; |
| classifyUrl | function | 111 | no | function classifyUrl(rawUrl) { |
| text | const | 113 | no | const text = rawUrl.trim(); |
| u | variable | 114 | no | let u; |
| roleOfRow | function | 126 | no | function roleOfRow(row) { |
| role | const | 127 | no | const role = norm(row.role); |
| fi | const | 128 | no | const fi = isObj(row.roleCoverage) &amp;&amp; typeof row.roleCoverage.fullyInspected === &#39;boolean&#39; ? row.roleCoverage.fullyInspected : null; |
| roleOfInput | function | 133 | no | function roleOfInput(input) { |
| role | const | 136 | no | const role = norm(input.role); |
| raw | const | 138 | no | const raw = input.fullyInspected ?? (isObj(input.coverage) ? input.coverage.fullyInspected : isObj(input.roleCoverage) ? input.roleCoverage.fullyInspected : undefined); |
| lookupRole | function | 142 | no | function lookupRole(roles, sid) { |
| key | const | 143 | no | const key = String(sid); |
| partitionEvidenceStreams | function | 158 | yes | export function partitionEvidenceStreams(streams, { siteUrl = null, domTurns = null, roles = null, requireCoverage = false } = {}) { |
| site | const | 162 | no | const site = parseSite(siteUrl); |
| rows | const | 165 | no | const rows = []; |
| skipped | variable | 166 | no | let skipped = 0; |
| candidate | const | 168 | no | const candidate = Array.isArray(item) &amp;&amp; item.length === 2 &amp;&amp; isObj(item[1]) ? item[1] : item; |
| sidCounts | const | 174 | no | const sidCounts = new Map(); |
| sid | const | 176 | no | const sid = sidOf(row); |
| key | const | 178 | no | const key = String(sid); |
| ambiguousSids | const | 181 | no | const ambiguousSids = [...sidCounts].filter(([, n]) =&gt; n &gt; 1).map(([key]) =&gt; key).sort(); |
| ambiguous | const | 182 | no | const ambiguous = new Set(ambiguousSids); |
| roleSourceKind | const | 184 | no | const roleSourceKind = roles instanceof Map ? &#39;map&#39; : isObj(roles) ? &#39;object&#39; : &#39;none&#39;; |
| mapKeys | const | 185 | no | const mapKeys = roleSourceKind === &#39;map&#39; ? [...roles.keys()].map(String) |
| mapKeySet | const | 187 | no | const mapKeySet = new Set(mapKeys); |
| buckets | const | 189 | no | const buckets = { |
| otherOrigins | const | 194 | no | const otherOrigins = new Set(); |
| entries | const | 195 | no | const entries = []; |
| knownSids | const | 196 | no | const knownSids = new Set(); |
| sid | const | 199 | no | const sid = sidOf(row); |
| originClass | const | 202 | no | const originClass = origin === null ? &#39;unknown&#39; : site.origin !== null &amp;&amp; origin === site.origin ? &#39;site&#39; : &#39;other&#39;; |
| role | variable | 205 | no | let role = null; |
| confidence | variable | 206 | no | let confidence = &#39;none&#39;; |
| fullyInspected | variable | 207 | no | let fullyInspected = null; |
| roleSource | variable | 208 | no | let roleSource = null; |
| roleMapIgnored | variable | 209 | no | let roleMapIgnored = null; |
| mapped | const | 211 | no | const mapped = lookupRole(roles, sid); |
| parsed | const | 216 | no | const parsed = roleOfInput(mapped); |
| own | const | 222 | no | const own = roleOfRow(row); |
| labelled | const | 228 | no | const labelled = EXCLUDABLE_ROLES.has(role) &amp;&amp; EXCLUDING_CONFIDENCE.has(confidence); |
| trusted | const | 229 | no | const trusted = fullyInspected === true \|\| (fullyInspected === null &amp;&amp; !requireCoverage); |
| excluded | const | 230 | no | const excluded = labelled &amp;&amp; trusted; |
| entry | const | 231 | no | const entry = { |
| bucket | const | 239 | no | const bucket = buckets[originClass]; |
| provided | const | 248 | no | const provided = Array.isArray(domTurns) ? domTurns.length : 0; |
| attributed | const | 249 | no | const attributed = provided &gt; 0 &amp;&amp; site.origin !== null; |
| dom | const | 250 | no | const dom = { |
| applied | const | 262 | no | const applied = entries.filter((e) =&gt; e.roleSource === &#39;map&#39;).length; |
| fromRow | const | 263 | no | const fromRow = entries.filter((e) =&gt; e.roleSource === &#39;row&#39;).length; |
| missing | const | 264 | no | const missing = entries.filter((e) =&gt; e.roleSource === null).length; |
| ignoredAmbiguous | const | 265 | no | const ignoredAmbiguous = ambiguousSids.filter((key) =&gt; mapKeySet.has(key)); |
| unmatchedKeys | const | 266 | no | const unmatchedKeys = mapKeys.filter((key) =&gt; !knownSids.has(key)); |
| rolesSummary | const | 267 | no | const rolesSummary = { |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Origin-aware evidence partitioning for gatherEvidence() integration.
//
// WHY: gatherEvidence() without a page context unions every reducer stream, delta document, event,
// sample and collection, so a family match can be supported by evidence fetched from a CDN, an
// analytics host or a socket to a different origin than the captured page. This module is the pure,
// dependency-free building block of the origin-aware path: it classifies stream rows by EXACT
// URL.origin relative to an explicit page URL and reports which rows may contribute payload
// evidence. families.mjs gatherEvidence({ pageUrl }) consumes it (offline derive supplies the page URL).
//
//   partitionEvidenceStreams(streams, { siteUrl, domTurns, roles, requireCoverage })
//
// INPUT
//   streams   any iterable of stream rows: reducer.streams.values() (live objects) or
//             reducer.summary().streams (plain rows). The Map itself is also accepted for
//             convenience (its [sid, row] entries are unwrapped). Rows are never copied: the
//             returned buckets hold the caller's references. Items that are not row objects are
//             skipped and counted in totals.skipped.
//   siteUrl   the captured page URL (elsewhere: session.meta.target.url). Only its origin is used.
//             http/https only; ws/wss or opaque URLs are not a page identity.
//   domTurns  optional page DOM turns from the primary page. Attributed to the site origin only.
//   roles     optional Map (or plain object) keyed by SID -> role string or { role, confidence }.
//             Use it for an already-computed classifier result; this module NEVER classifies.
//             Row-carried role / roleConfidence fields are honoured as per-row evidence.
//
// OUTPUT (see the return literal below)
//   site        canonical page identity: { input, url, origin, reason }.
//   buckets     site / other / unknown, each { kind, origin, streams, payloadEligible, payloadExcluded }.
//               Every bucket keeps ALL of its member references; payload eligibility is a separate
//               flag list, so config/telemetry streams remain available as control evidence.
//   streams     one flat entry per row, in input order, content-free:
//               { ref, sid, origin, originClass, originReason, role, roleConfidence, roleSource,
//                 roleMapIgnored, payloadEligible, exclusion }. originReason is one of
//               missing-url | unparseable-url | relative-url | opaque-origin | unsupported-scheme.
//   dom         { origin, attributed, provided, count, turns, unattributedCount, unattributedTurns,
//               reason }. Attributed DOM (`turns`) is the caller's array (no copy) and `count` its
//               length. Unattributed DOM keeps the same caller array by reference in
//               `unattributedTurns` (counted by `unattributedCount`), so no captured DOM is
//               discarded. At most one of the two lists is non-empty.
//   roles       { source, entries, applied, fromRow, missing, ambiguousSids, ignoredAmbiguous,
//                 unmatchedKeys }.
//   totals      stream and eligibility counts.
//
// RULES
//   * Origin means scheme + host + port, exactly (URL.origin). Hostnames and registrable domains are
//     never compared. URL canonicalisation only removes the DEFAULT port of its own scheme
//     (http/ws 80, https/wss 443); ws/wss origins stay explicit and are never merged with http/https
//     and never with each other.
//   * Invalid, opaque (origin "null"), non-network (file:, data:, blob:, chrome-extension:, ...),
//     relative or missing URLs are UNKNOWN. A relative URL is deliberately not resolved against
//     siteUrl: without explicit provenance a guess would silently rebind evidence, so it stays
//     unknown (`originReason: 'relative-url'`).
//   * Nothing is inferred from sid/tag prefixes. A stream is only "site" when its own URL parses to
//     the same origin as the page.
//   * Page DOM is attributed only to an explicit valid site origin. Without one it stays
//     unattributed evidence: `turns` is empty and `count` 0, while the raw caller array is retained
//     in `unattributedTurns` / `unattributedCount` for inspection. DOM never enters a bucket.
//     Without a usable page URL the site bucket is empty: a stream with a parseable origin is still
//     "other" (known, just not attributable), and only unparseable URLs are "unknown".
//   * Roles: a stream is payload-excluded only when its role is config or telemetry AND its
//     confidence is medium or high. Unknown, low, missing and unrecognised roles stay
//     payload-eligible. Exclusion never removes the stream from its bucket.
//   * SIDs are not globally unique evidence. If a SID occurs more than once in the input, a roles
//     map entry for it is ignored for every occurrence (`roleMapIgnored: 'ambiguous-sid'`) instead of
//     lending one origin's role to another; the rows fall back to their own role fields, if any.
//     Ambiguous SIDs, ignored entries and map keys matching no row are reported.
//   * No global state: all classification is per call, so an origin that is the site in one call is
//     "other" in the next without leakage.
//   * Cost: one pass over the rows plus O(k) role-map lookups; O(n) references retained, no payload,
//     event or document copying and no nested document scan. Sorting is bounded per subset, not
//     universal: other.origins, roles.ambiguousSids and roles.unmatchedKeys are O(k log k) in their
//     own subset size (distinct origins / duplicated or mapped SIDs), never O(n log n) in stream
//     count. No clock, no randomness, no I/O.
//
// INTEGRATION: gatherEvidence() in families.mjs calls this once (when given an explicit pageUrl), builds
// primary evidence from result.buckets.site only, keeps site config/telemetry streams as CONTROL evidence
// (transport / method / status / mime / url metadata) but skips their payload-derived fields, reports
// other/unknown streams separately and takes DOM signals only when result.dom.attributed is true.
// Unattributed DOM remains inspectable through result.dom.unattributedTurns; it has no page origin and is
// never folded into site or "other" evidence. FAMILY_EVIDENCE_VERSION (below) versions that behaviour.
```

_First 80 of 296 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
