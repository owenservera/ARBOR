# File: studio/src/studio/adapter-probes.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/adapter-probes.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 30742 B |
| Lines | 539 |
| Hash | 250979c88557 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROBE_SCHEMA | const | 20 | yes | export const PROBE_SCHEMA = &#39;aion.adapter-probe/1&#39;; |
| TEXT_PREVIEW_CAP | const | 21 | yes | export const TEXT_PREVIEW_CAP = 240; |
| MAX_LIVE_TURNS | const | 22 | yes | export const MAX_LIVE_TURNS = 200; |
| UUID_RE | const | 24 | no | const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; |
| IDENTITY_TOKEN_RE | const | 25 | no | const IDENTITY_TOKEN_RE = /^[0-9a-f]{16,}$/i; // long hex token |
| DIGITS_RE | const | 26 | no | const DIGITS_RE = /^\\d{6,}$/; |
| FEATURE_BY_ROLE | const | 30 | no | const FEATURE_BY_ROLE = { user: &#39;user-turn&#39;, assistant: &#39;assistant-turn&#39; }; |
| isString | function | 32 | no | const isString = (s, n) =&gt; typeof s === &#39;string&#39; &amp;&amp; !!s.length &amp;&amp; s.length &lt;= n; |
| ATTR_NAME_RE | const | 34 | no | const ATTR_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_:.-]{0,99}$/; |
| ROLE_VALUE_RE | const | 35 | no | const ROLE_VALUE_RE = /^[a-z]{1,40}$/; |
| selectorForRole | function | 38 | yes | export function selectorForRole(attr, role, match = &#39;exact&#39;) { |
| classifySegment | function | 43 | no | function classifySegment(seg) { |
| opaqueSegment | function | 54 | no | function opaqueSegment(seg) { |
| classifyQueryValue | function | 63 | no | function classifyQueryValue(v) { |
| routeCandidateFromUrl | function | 74 | yes | export function routeCandidateFromUrl(urlStr) { |
| u | variable | 76 | no | let u; |
| path | const | 80 | no | const path = u.pathname.split(&#39;/&#39;).map((seg) =&gt; seg ? (classifySegment(seg) ?? opaqueSegment(seg) ?? seg) : seg).join(&#39;/&#39;); |
| query | const | 81 | no | const query = []; |
| identityHits | variable | 82 | no | let identityHits = 0; |
| cls | const | 84 | no | const cls = classifyQueryValue(v); |
| segHit | const | 88 | no | const segHit = u.pathname.split(&#39;/&#39;).some((seg) =&gt; seg &amp;&amp; classifySegment(seg) !== null); |
| qs | const | 90 | no | const qs = query.length ? `?${query.join(&#39;&amp;&#39;)}` : &#39;&#39;; |
| candidate | const | 91 | no | const candidate = `${u.origin}${path}${qs}`; |
| seqCounter | variable | 95 | no | let seqCounter = 0; |
| probe | function | 96 | no | function probe({ feature, type, candidate, outcome = &#39;present&#39;, coverage = &#39;complete&#39;, carrier, captureId, evidenceClass, evidenceRef = null }) { |
| probesFromSession | function | 114 | yes | export function probesFromSession(session, { evidenceClass = &#39;SAVED_REAL_CAPTURE&#39;, maxStreamEndpoints = 8 } = {}) { |
| captureId | const | 116 | no | const captureId = session.id; |
| out | const | 117 | no | const out = []; |
| turns | const | 120 | no | const turns = session.kv?.get?.(&#39;DOM_TURNS&#39;) ?? []; |
| domIdSeen | const | 122 | no | const domIdSeen = new Set(); |
| feature | const | 124 | no | const feature = FEATURE_BY_ROLE[t?.role]; |
| attr | const | 126 | no | const attr = typeof t.roleAttribute === &#39;string&#39; ? t.roleAttribute : null; |
| roleSelector | const | 127 | no | const roleSelector = attr ? selectorForRole(attr, t.role, t.roleMatch) : null; |
| p | const | 129 | no | const p = probe({ feature, type: &#39;selector&#39;, candidate: roleSelector, carrier: &#39;dom&#39;, captureId, evidenceClass, evidenceRef: `KV:DOM_TURNS[${turnIndex}]` }); |
| p | const | 137 | no | const p = probe({ feature, type: &#39;selector&#39;, candidate: t.domId, carrier: &#39;dom&#39;, captureId, evidenceClass, evidenceRef: `KV:DOM_TURNS[${turnIndex}].domId` }); |
| assembled | const | 143 | no | const assembled = session.kv?.get?.(&#39;ASSEMBLED&#39;) ?? {}; |
| seen | const | 145 | no | const seen = new Set(); |
| endpoint | const | 147 | no | const endpoint = typeof a?.endpoint === &#39;string&#39; ? a.endpoint : null; |
| path | const | 152 | no | const path = endpoint.includes(&#39; &#39;) ? endpoint.slice(endpoint.indexOf(&#39; &#39;) + 1) : endpoint; |
| p | const | 153 | no | const p = probe({ feature: &#39;stream-component&#39;, type: &#39;stream-map&#39;, candidate: path, carrier: &#39;network&#39;, captureId, evidenceClass, evidenceRef: `KV:ASSEMBLED[${streamIndex}].endpoint` }); |
| url | const | 160 | no | const url = session.kv?.get?.(&#39;RECEIPT&#39;)?.pageUrl ?? session.kv?.get?.(&#39;DOM_INSPECT&#39;)?.url |
| route | const | 162 | no | const route = routeCandidateFromUrl(url); |
| p | const | 164 | no | const p = probe({ feature: &#39;thread-route&#39;, type: &#39;route&#39;, candidate: route, carrier: &#39;dom&#39;, captureId, evidenceClass, evidenceRef: session.kv?.get?.(&#39;RECEIPT&#39;)?.pageUrl ? &#39;KV:RECEIPT.pageUrl&#39; : sessi… |
| scopeProbes | function | 176 | yes | export function scopeProbes(probes, { siteId, origin, surface = &#39;chat&#39;, sessionOrigins }) { |
| probeOrigin | const | 178 | no | const probeOrigin = sessionOrigins.get(p.captureId); |
| routeOrigin | variable | 184 | no | let routeOrigin; |
| LIVE_BATTERY | const | 196 | yes | export const LIVE_BATTERY = Object.freeze({ &#39;composer&#39;: Object.freeze([&#39;textarea&#39;, &#39;[contenteditable=&quot;true&quot;]&#39;, &#39;[role=&quot;textbox&quot;]&#39;, &#39;form textarea&#39;]), &#39;send-control&#39;: Object.freeze([&#39;form button[type=… |
| BATTERY_FEATURES | const | 204 | no | const BATTERY_FEATURES = Object.freeze([...Object.keys(LIVE_BATTERY), &#39;citation&#39;, &#39;artifact&#39;, &#39;task-progress&#39;]); |
| liveMeasurementExpression | function | 212 | yes | export function liveMeasurementExpression({ priorSelectors = {} } = {}) { |
| batteryJson | const | 213 | no | const batteryJson = JSON.stringify(LIVE_BATTERY); |
| priorJson | const | 214 | no | const priorJson = JSON.stringify(Object.fromEntries(Object.entries(priorSelectors).slice(0, 8).map(([k, v]) =&gt; [k, Array.isArray(v) ? v.slice(0, 8).map(String) : []]))); |
| out | const | 216 | no | const out = { readyState: document.readyState, startUrl: location.href, url: location.href, battery: {}, prior: {}, roles: null, injected: false }; |
| q | function | 217 | no | const q = (sel) =&gt; { try { const n = document.querySelectorAll(sel).length; return n &gt; 255 ? 255 : n; } catch { return -1; } }; |
| battery | const | 218 | no | const battery = ${batteryJson}; |
| prior | const | 220 | no | const prior = ${priorJson}; |
| t | const | 228 | no | const t = globalThis.__aionCapture &amp;&amp; typeof globalThis.__aionCapture.turns === &#39;function&#39; ? globalThis.__aionCapture.turns() : null; |
| attr | const | 231 | no | const attr = String(x.roleAttribute ?? &#39;&#39;), role = String(x.role ?? &#39;&#39;); |
| sel | const | 232 | no | const sel = /^[a-zA-Z_][a-zA-Z0-9_:.-]{0,99}$/.test(attr) &amp;&amp; /^[a-z]{1,40}$/.test(role) |
| probesFromLiveMeasurement | function | 248 | yes | export function probesFromLiveMeasurement({ measurement, origin, url, captureId, evidenceClass = &#39;SANDBOX_REAL_BROWSER&#39; }) { |
| out | const | 250 | no | const out = []; |
| pageUrl | const | 252 | no | const pageUrl = measurement.url ?? url; |
| measuredOrigin | variable | 254 | no | let measuredOrigin; |
| sameDocument | const | 259 | no | const sameDocument = !measurement.startUrl \|\| measurement.startUrl === measurement.url; |
| complete | const | 260 | no | const complete = measurement.readyState === &#39;complete&#39; &amp;&amp; sameDocument; |
| coverage | const | 261 | no | const coverage = complete ? &#39;complete&#39; : &#39;partial&#39;; |
| outcomeFor | function | 262 | no | const outcomeFor = (count) =&gt; !complete ? &#39;unknown&#39; : count &gt; 0 ? &#39;present&#39; : count === 0 ? &#39;absent&#39; : &#39;unknown&#39;; |
| candidate | const | 267 | no | const candidate = LIVE_BATTERY[feature]?.[i]; |
| p | const | 269 | no | const p = probe({ feature, type: &#39;selector&#39;, candidate, outcome: outcomeFor(n), coverage, carrier: &#39;dom&#39;, captureId, evidenceClass }); |
| presentCandidates | const | 278 | no | const presentCandidates = new Set(); |
| seen | const | 281 | no | const seen = new Set(); |
| feature | const | 284 | no | const feature = FEATURE_BY_ROLE[r.role]; |
| candidate | const | 289 | no | const candidate = selectorForRole(r.attr, r.role, r.match); |
| p | const | 296 | no | const p = probe({ feature, type: &#39;selector&#39;, candidate, outcome: complete ? &#39;present&#39; : &#39;unknown&#39;, coverage, carrier: &#39;dom&#39;, captureId, evidenceClass }); |
| candidate | const | 303 | no | const candidate = measurement.priorCandidates?.[feature]?.[i]; |
| p | const | 306 | no | const p = probe({ feature, type: feature === &#39;thread-route&#39; ? &#39;route&#39; : &#39;selector&#39;, candidate, outcome: outcomeFor(n), coverage, carrier: &#39;dom&#39;, captureId, evidenceClass }); |
| route | const | 311 | no | const route = routeCandidateFromUrl(measurement.url ?? url); |
| p | const | 313 | no | const p = probe({ feature: &#39;thread-route&#39;, type: &#39;route&#39;, candidate: route, outcome: complete ? &#39;present&#39; : &#39;unknown&#39;, coverage, carrier: &#39;dom&#39;, captureId, evidenceClass }); |
| probesFromLivePage | function | 325 | yes | export async function probesFromLivePage({ dom, origin, captureId, priorSelectors = {} }) { |
| r | const | 327 | no | const r = await dom._evalInMain(liveMeasurementExpression({ priorSelectors })); |
| measurement | const | 328 | no | const measurement = r?.value ?? r; |
| previewOf | function | 334 | no | const previewOf = (text) =&gt; { |
| full | const | 335 | no | const full = typeof text === &#39;string&#39; ? text : &#39;&#39;; |
| turnMatchesSelector | function | 349 | no | function turnMatchesSelector(t, selector) { |
| THREAD_PROVIDER_HOSTS | const | 357 | no | const THREAD_PROVIDER_HOSTS = Object.freeze({ chatgpt: Object.freeze([...(chatgptSeed?.hosts ?? [])].map((h) =&gt; String(h).toLowerCase())) }); |
| threadProviderForOrigin | function | 358 | yes | export function threadProviderForOrigin(origin) { |
| host | variable | 359 | no | let host; |
| threadBinding | function | 366 | no | function threadBinding(candidateOrigin, url) { |
| unverified | const | 367 | no | const unverified = { binding: &#39;unverified&#39;, nativeRef: null, url: typeof url === &#39;string&#39; ? url : null }; |
| pageOrigin | variable | 369 | no | let pageOrigin; |
| provider | const | 372 | no | const provider = threadProviderForOrigin(candidateOrigin); |
| parsed | const | 374 | no | const parsed = parseThread(provider, url); |
| transcriptFromSession | function | 378 | yes | export function transcriptFromSession(session, candidate, { cap = MAX_LIVE_TURNS } = {}) { |
| selectors | const | 381 | no | const selectors = { |
| turns | const | 385 | no | const turns = session.kv?.get?.(&#39;DOM_TURNS&#39;) ?? []; |
| items | const | 386 | no | const items = []; |
| feature | const | 389 | no | const feature = FEATURE_BY_ROLE[t?.role]; |
| pv | const | 392 | no | const pv = previewOf(t.text); |
| url | const | 401 | no | const url = session.kv?.get?.(&#39;RECEIPT&#39;)?.pageUrl ?? session.meta?.target?.url ?? null; |
| thread | const | 402 | no | const thread = threadBinding(candidate.origin, url); |
| liveTranscriptExpression | function | 411 | yes | export function liveTranscriptExpression({ userSelector, assistantSelector, cap = MAX_LIVE_TURNS, textCap = TEXT_PREVIEW_CAP }) { |
| cap | const | 413 | no | const cap = ${Number(cap)}, textCap = ${Number(textCap)}; |
| grab | function | 414 | no | const grab = (sel, role) =&gt; { |
| items | const | 418 | no | const items = [...grab(${JSON.stringify(userSelector)}, &#39;user&#39;), ...grab(${JSON.stringify(assistantSelector)}, &#39;assistant&#39;)]; |
| transcriptFromLivePage | function | 431 | yes | export async function transcriptFromLivePage({ dom, candidate, scrub, cap = MAX_LIVE_TURNS }) { |
| userSelector | const | 434 | no | const userSelector = candidate.features?.[&#39;user-turn&#39;]?.selected?.candidate ?? null; |
| assistantSelector | const | 435 | no | const assistantSelector = candidate.features?.[&#39;assistant-turn&#39;]?.selected?.candidate ?? null; |
| r | const | 437 | no | const r = await dom._evalInMain(liveTranscriptExpression({ userSelector, assistantSelector, cap })); |
| m | const | 438 | no | const m = r?.value ?? r; |
| items | const | 440 | no | const items = (Array.isArray(m.items) ? m.items : []).slice(0, cap).map((x, i) =&gt; { const raw = typeof x?.text === &#39;string&#39; ? x.text : &#39;&#39;; const scrubbed = typeof scrub === &#39;function&#39; ? scrub(raw) : … |
| raw | const | 441 | no | const raw = typeof x?.text === &#39;string&#39; ? x.text : &#39;&#39;; |
| scrubbed | const | 442 | no | const scrubbed = typeof scrub === &#39;function&#39; ? scrub(raw) : { text: raw, redactions: [] }; |
| thread | const | 450 | no | const thread = threadBinding(candidate.origin, m.url); |
| NATIVE_PART_EVIDENCE_SCHEMA | const | 458 | yes | export const NATIVE_PART_EVIDENCE_SCHEMA = &#39;aion.native-part-evidence/1&#39;; |
| nativePartsFromSession | function | 459 | yes | export function nativePartsFromSession(session, { maxParts = 256 } = {}) { |
| limit | const | 461 | no | const limit = Number.isSafeInteger(maxParts) ? Math.max(0, Math.min(256, maxParts)) : 256; |
| parts | const | 462 | no | const parts = []; |
| add | function | 463 | no | const add = (part) =&gt; { if (parts.length &lt; limit) parts.push(part); }; |
| safeType | function | 464 | no | const safeType = (v) =&gt; typeof v === &#39;string&#39; &amp;&amp; /^[a-z][a-z0-9_-]{0,63}$/.test(v) ? v : &#39;unknown-native&#39;; |
| walk | function | 465 | no | const walk = (blocks, ref, turnOrd, role, depth = 0) =&gt; { |
| pointer | const | 469 | no | const pointer = `${ref}[${i}]`; |
| turns | const | 482 | no | const turns = session.kv?.get?.(&#39;DOM_TURNS&#39;); |
| doc | const | 487 | no | const doc = session.kv?.get?.(&#39;STREAM_COMPONENTS&#39;); |
| compareNativePartEvidence | function | 515 | yes | export function compareNativePartEvidence(before, after) { |
| groups | function | 520 | no | const groups = (doc) =&gt; { |
| out | const | 521 | no | const out = new Map(); |
| key | const | 524 | no | const key = JSON.stringify([p.carrier, p.role, p.nativeType]); |
| old | const | 530 | no | const old = groups(before), now = groups(after); |
| added | const | 531 | no | const added = [...now].filter(([key]) =&gt; !old.has(key)).map(([, v]) =&gt; v); |
| notObserved | const | 532 | no | const notObserved = [...old].filter(([key]) =&gt; !now.has(key)).map(([, v]) =&gt; v); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../capture/conversation-thread.mjs | import | 17 | [studio/src/capture/conversation-thread.mjs](../capture/conversation-thread.mjs.md) |
| ../profiles/sites/chatgpt.mjs | import | 18 | [studio/src/profiles/sites/chatgpt.mjs](../profiles/sites/chatgpt.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/adapter-evidence-intake.mjs](./adapter-evidence-intake.mjs.md) | ./adapter-probes.mjs |
| [studio/src/studio/adapter-factory-service.mjs](./adapter-factory-service.mjs.md) | ./adapter-probes.mjs |
| [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) | ./adapter-probes.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Probe production for the adaptive webapp adapter factory (Agent 14 Round 8).
//
// This module is the "capture to normalized probes" seam: it turns Capture Studio's OWN derived
// evidence (DOM_TURNS, ASSEMBLED stream endpoints, saved page URLs) and bounded READ-ONLY live
// page measurements into the source-qualified observation probes that
// src/studio/adaptive-adapter-factory.mjs consumes.
//
// Hard rules carried over from the factory contract and the webapp-native harness:
//   - Probes are evidence, not authority: nothing here grants a send, installs an adapter,
//     touches a browser write path, or fabricates identity.
//   - A thread route is only proposed when the page URL actually carries an identity-shaped
//     token (uuid / long id). Titles, positions, reply text and timestamps are never used.
//   - Absence is only claimed by a complete, whole-document measurement (the live probe); saved
//     captures only ever contribute presence votes, because the raw DOM is not re-queryable.
//   - Every probe keeps its capture reference (captureId:sequence) so the raw evidence stays
//     authoritative and auditable.
import { parseThread, threadSupported } from '../capture/conversation-thread.mjs';
import chatgptSeed from '../profiles/sites/chatgpt.mjs';

export const PROBE_SCHEMA = 'aion.adapter-probe/1';
export const TEXT_PREVIEW_CAP = 240;
export const MAX_LIVE_TURNS = 200;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IDENTITY_TOKEN_RE = /^[0-9a-f]{16,}$/i; // long hex token
const DIGITS_RE = /^\d{6,}$/;

// The two DOM features the factory knows that a saved capture can prove. Any other generic
// role word ('human', 'ai', 'bot', ...) is honestly skipped rather than coerced.
const FEATURE_BY_ROLE = { user: 'user-turn', assistant: 'assistant-turn' };

const isString = (s, n) => typeof s === 'string' && !!s.length && s.length <= n;

const ATTR_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_:.-]{0,99}$/;
const ROLE_VALUE_RE = /^[a-z]{1,40}$/;
// The one selector form for a recorded role attribute, shared by saved and live probes and by
// transcript matching. `match` is the page agent's roleMatch ('suffix' | 'exact').
export function selectorForRole(attr, role, match = 'exact') {
  if (!ATTR_NAME_RE.test(String(attr ?? '')) || !ROLE_VALUE_RE.test(String(role ?? ''))) return null;
  return match === 'suffix' ? `[${attr}$="${role}"]` : `[${attr}="${role}"]`;
}

function classifySegment(seg) {
  if (UUID_RE.test(seg)) return ':uuid';
  if (DIGITS_RE.test(seg) || IDENTITY_TOKEN_RE.test(seg)) return ':id';
  return null;
}

// Long opaque segments that carry digits (project/custom-assistant ids with a user-chosen slug,
// e.g. `g-p-67e1a2b3c4d5-my-private-project`, base62 share keys) are generalized to `:token`.
// They are NOT identity evidence (only uuid/:id count), but a learned, persisted route template
// must never retain account-specific or user-named path content. Percent-encoded segments are
// treated the same way.
function opaqueSegment(seg) {
  if (seg.includes('%')) return ':token';
  if (seg.length >= 12 && /\d/.test(seg) && /[a-z]/i.test(seg) && /^[A-Za-z0-9_.~-]+$/.test(seg)) return ':token';
  // Provider route words are short (`c`, `chat`, `app`, `backend-api`); multi-hyphen or long
  // literal segments are slugs (often user-named) and are generalized too.
  if (seg.length > 24 || (seg.match(/-/g)?.length ?? 0) >= 2) return ':token';
  return null;
}

function classifyQueryValue(v) {
  if (UUID_RE.test(v)) return ':uuid';
  if (DIGITS_RE.test(v) || IDENTITY_TOKEN_RE.test(v)) return ':id';
  return null;
}

/**
 * Generalize a page URL into a thread-route candidate template. Returns null unless the URL
 * carries at least one identity-shaped token — a URL without identity evidence never becomes
 * a thread route (no fabrication from titles, ordinals or reply text).
 */
export function routeCandidateFromUrl(urlStr) {
  if (!isString(urlStr, 2048)) return null;
  let u;
  try { u = new URL(urlStr); } catch { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;

  const path = u.pathname.split('/').map((seg) => seg ? (classifySegment(seg) ?? opaqueSegment(seg) ?? seg) : seg).join('/');
```

_First 80 of 540 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
