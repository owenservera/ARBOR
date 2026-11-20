# File: studio/src/families/core.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/families/core.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18814 B |
| Lines | 400 |
| Hash | a71c04d923bf |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CORE_SITES | const | 28 | yes | export const CORE_SITES = Object.freeze([...ADAPTER_IDS]); |
| LIBRARY_ID | const | 30 | no | const LIBRARY_ID = &#39;ai-chat-core&#39;; |
| SIG_NOTE | const | 31 | no | const SIG_NOTE = &#39;ai-chat-core contract v1&#39;; |
| STREAMING | const | 33 | no | const STREAMING = new Set([&#39;HTTP_SSE&#39;, &#39;HTTP_NDJSON&#39;, &#39;HTTP_STREAMED&#39;, &#39;EVENT_SOURCE&#39;, &#39;WEBSOCKET&#39;]); |
| SCALAR | const | 34 | no | const SCALAR = new Set([&#39;string&#39;, &#39;number&#39;, &#39;boolean&#39;, &#39;null&#39;]); |
| DELTA_LEAVES | const | 37 | no | const DELTA_LEAVES = new Set([&#39;v&#39;, &#39;value&#39;, &#39;delta&#39;, &#39;text&#39;, &#39;token&#39;, &#39;tokens&#39;, &#39;chunk&#39;, &#39;chunks&#39;, &#39;completion&#39;, &#39;fragment&#39;, &#39;patch&#39;, &#39;answer&#39;, &#39;output&#39;, &#39;response&#39;]); |
| TERMINAL_LEAVES | const | 38 | no | const TERMINAL_LEAVES = new Set([&#39;end_turn&#39;, &#39;finish_reason&#39;, &#39;stop_reason&#39;, &#39;stop_sequence&#39;, &#39;stream_close_reason&#39;, &#39;message_stream_complete&#39;, &#39;done&#39;]); |
| STRONG_FRAME | const | 39 | no | const STRONG_FRAME = /message_stream_complete\|message_stop\|\\[DONE\\]\|stream_complete\|end_turn\|finish_reason\|stop_reason\|stream_close\|close_reason/i; |
| ENVELOPE_LEAVES | const | 40 | no | const ENVELOPE_LEAVES = new Set([&#39;type&#39;, &#39;kind&#39;, &#39;model&#39;, &#39;stream&#39;, &#39;metadata&#39;, &#39;delta&#39;, &#39;conversation_id&#39;, &#39;message_id&#39;, &#39;id&#39;, &#39;request_id&#39;, &#39;role&#39;, &#39;content&#39;, &#39;usage&#39;, &#39;status&#39;, &#39;event&#39;, &#39;session_i… |
| TOOL_LEAVES | const | 41 | no | const TOOL_LEAVES = new Set([&#39;tool_use&#39;, &#39;tool_call&#39;, &#39;tool_calls&#39;, &#39;function_call&#39;, &#39;tool_result&#39;, &#39;tool_name&#39;, &#39;tool_use_id&#39;]); |
| USAGE_LEAVES | const | 42 | no | const USAGE_LEAVES = new Set([&#39;usage&#39;, &#39;input_tokens&#39;, &#39;output_tokens&#39;, &#39;token_usage&#39;, &#39;cached_tokens&#39;, &#39;total_tokens&#39;, &#39;prompt_tokens&#39;, &#39;completion_tokens&#39;]); |
| REQUEST_LEAVES | const | 43 | no | const REQUEST_LEAVES = new Set([&#39;input_message&#39;, &#39;messages&#39;, &#39;prompt&#39;, &#39;instructions&#39;, &#39;system&#39;, &#39;content&#39;, &#39;parts&#39;]); |
| cmp | function | 45 | no | const cmp = (a, b) =&gt; (a &lt; b ? -1 : a &gt; b ? 1 : 0); |
| sorted | function | 46 | no | const sorted = (iterable) =&gt; [...iterable].sort(cmp); |
| uniq | function | 47 | no | const uniq = (iterable) =&gt; sorted(new Set(iterable)); |
| leafOf | function | 50 | no | function leafOf(p) { |
| seg | const | 51 | no | const seg = String(p ?? &#39;&#39;).replace(/\\[\\*\\]/g, &#39;&#39;).split(&#39;.&#39;).pop() ?? &#39;&#39;; |
| m | const | 52 | no | const m = /\\[&quot;([^&quot;]+)&quot;\\]$/.exec(seg); |
| isStreamingEndpoint | function | 56 | no | const isStreamingEndpoint = (ep) =&gt; Object.keys(ep?.transports ?? {}).some((t) =&gt; STREAMING.has(t)); |
| dominantTransport | function | 59 | no | function dominantTransport(ep) { |
| entries | const | 60 | no | const entries = Object.entries(ep?.transports ?? {}); |
| deltaFieldsOf | function | 67 | no | function deltaFieldsOf(g) { |
| out | const | 68 | no | const out = new Set(); |
| stripped | const | 72 | no | const stripped = String(p).replace(/\\[\\*\\]/g, &#39;&#39;); |
| leaf | const | 77 | no | const leaf = leafOf(p); |
| types | const | 79 | no | const types = Array.isArray(f?.types) ? f.types : []; |
| scalar | const | 80 | no | const scalar = types.length &gt; 0 &amp;&amp; types.every((t) =&gt; SCALAR.has(t)); |
| changes | const | 81 | no | const changes = scalar ? (f?.distinct === undefined \|\| Number(f.distinct) &gt; 1) : true; |
| textish | const | 83 | no | const textish = DELTA_LEAVES.has(leaf) \|\| /(^\|\\.)delta(\\.\|$)/i.test(stripped); |
| grows | const | 84 | no | const grows = types.includes(&#39;object&#39;) \|\| types.includes(&#39;array&#39;) |
| terminalMarkersOf | function | 92 | no | function terminalMarkersOf(g) { |
| out | const | 93 | no | const out = new Set(); |
| d | const | 94 | no | const d = String(g?.discriminator ?? &#39;&#39;); |
| leaf | const | 97 | no | const leaf = leafOf(p); |
| answerEvidence | function | 108 | no | function answerEvidence(g, { post = false } = {}) { |
| d | const | 109 | no | const d = String(g?.discriminator ?? &#39;&#39;); |
| leaves | const | 110 | no | const leaves = new Set(Object.keys(g?.fields ?? {}).map(leafOf)); |
| frameKindsOf | function | 120 | no | function frameKindsOf(groups, deltaFields, terminalMarkers) { |
| kinds | const | 121 | no | const kinds = new Set(); |
| d | const | 125 | no | const d = String(g?.discriminator ?? &#39;&#39;); |
| leaves | const | 130 | no | const leaves = new Set(Object.keys(g?.fields ?? {}).map(leafOf)); |
| envelopeFieldsOf | function | 139 | no | function envelopeFieldsOf(groups) { |
| out | const | 140 | no | const out = new Set(); |
| stripped | const | 143 | no | const stripped = String(p).replace(/\\[\\*\\]/g, &#39;&#39;); |
| leaf | const | 145 | no | const leaf = leafOf(stripped); |
| dialectOf | function | 153 | no | function dialectOf(sessions) { |
| streams | const | 154 | no | const streams = new Map(); // &quot;transport endpoint&quot; -&gt; signature shape |
| patterns | const | 155 | no | const patterns = new Set(); // streaming endpoint path patterns |
| transports | const | 156 | no | const transports = new Set(); |
| groups | const | 157 | no | const groups = []; // streaming shape groups (all sessions) |
| dialects | const | 158 | no | const dialects = new Set(); // assembled delta dialects (src/replay/derive.mjs) |
| eps | const | 163 | no | const eps = new Map((s.endpoints ?? []).map((e) =&gt; [e.endpoint, e])); |
| ep | const | 165 | no | const ep = eps.get(g.endpoint) ?? null; |
| transport | const | 170 | no | const transport = dominantTransport(ep); |
| endpoint | const | 171 | no | const endpoint = pathPattern(g.endpoint ?? &#39;&#39;); |
| key | const | 173 | no | const key = `${transport} ${endpoint}`; |
| entry | const | 174 | no | const entry = streams.get(key) ?? { transport, endpoint, fields: new Map() }; |
| shapes | const | 183 | no | const shapes = [...streams.values()] |
| deltaFields | const | 192 | no | const deltaFields = uniq(groups.flatMap((g) =&gt; deltaFieldsOf(g))); |
| terminalMarkers | const | 193 | no | const terminalMarkers = uniq(groups.flatMap((g) =&gt; terminalMarkersOf(g))); |
| primaryHost | function | 207 | no | function primaryHost(sessions) { |
| counts | const | 208 | no | const counts = new Map(); |
| entries | const | 210 | no | const entries = [...counts.entries()].sort((a, b) =&gt; b[1] - a[1] \|\| cmp(a[0], b[0])); |
| coreSignature | function | 217 | no | function coreSignature(core, perSite) { |
| canon | const | 218 | no | const canon = JSON.stringify({ note: SIG_NOTE, core, perSite }); |
| buildCoreLibrary | function | 223 | yes | export function buildCoreLibrary({ sessionsDir, familiesDir = null, sites = CORE_SITES, minSessions = 1 } = {}) { |
| ids | const | 225 | no | const ids = (Array.isArray(sites) &amp;&amp; sites.length ? sites : CORE_SITES).map((s) =&gt; String(s).toLowerCase()); |
| siteRows | const | 226 | no | const siteRows = []; |
| perSite | const | 227 | no | const perSite = {}; |
| gaps | const | 228 | no | const gaps = []; |
| sessionsTotal | variable | 229 | no | let sessionsTotal = 0; |
| derivedTotal | variable | 230 | no | let derivedTotal = 0; |
| streamsTotal | variable | 231 | no | let streamsTotal = 0; |
| sessions | const | 234 | no | const sessions = collectSessions({ sessionsDir, site: id }); |
| derived | const | 235 | no | const derived = sessions.filter((s) =&gt; s.hasDerived); |
| dialect | const | 236 | no | const dialect = dialectOf(sessions); |
| deltaByName | const | 280 | no | const deltaByName = new Map(); // name -&gt; { name, paths: { site: [...] } } |
| name | const | 283 | no | const name = leafOf(p); |
| entry | const | 284 | no | const entry = deltaByName.get(name) ?? { name, paths: {} }; |
| deltaFields | const | 289 | no | const deltaFields = [...deltaByName.values()] |
| terminalByName | const | 296 | no | const terminalByName = new Map(); |
| entry | const | 299 | no | const entry = terminalByName.get(marker) ?? { marker, sites: new Set() }; |
| envelopeByName | const | 305 | no | const envelopeByName = new Map(); |
| entry | const | 308 | no | const entry = envelopeByName.get(name) ?? { name, sites: new Set() }; |
| transports | const | 314 | no | const transports = uniq(siteRows.flatMap((r) =&gt; r.transports)); |
| frameKinds | const | 315 | no | const frameKinds = uniq(Object.values(perSite).flatMap((p) =&gt; p.frameKinds)); |
| core | const | 317 | no | const core = { |
| coverage | const | 327 | no | const coverage = { |
| writeCoreLibrary | function | 350 | yes | export function writeCoreLibrary({ familiesDir, library } = {}) { |
| store | const | 353 | no | const store = new FamilyStore(familiesDir); |
| rec | const | 355 | no | const rec = store.save(library.id, { ...library, kind: &#39;core-library&#39;, coverage: library.coverage, gaps: library.gaps, |
| dir | const | 362 | no | const dir = path.join(familiesDir, library.id); |
| versionFile | const | 363 | no | const versionFile = path.join(dir, `v${String(rec.version).padStart(4, &#39;0&#39;)}.json`); |
| currentFile | const | 364 | no | const currentFile = path.join(dir, &#39;CURRENT&#39;); |
| plainFile | const | 365 | no | const plainFile = path.join(dir, &#39;core.json&#39;); |
| compareSites | function | 378 | yes | export function compareSites({ library } = {}) { |
| p | const | 381 | no | const p = library.perSite?.[row.id] ?? {}; |
| transports | const | 382 | no | const transports = p.transports ?? []; |
| framing | const | 383 | no | const framing = [ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 20 | external |
| node:crypto | import | 21 | external |
| node:fs | import | 22 | external |
| ../profiles/sites/index.mjs | import | 23 | [studio/src/profiles/sites/index.mjs](../profiles/sites/index.mjs.md) |
| ./build.mjs | import | 24 | [studio/src/families/build.mjs](./build.mjs.md) |
| ./families.mjs | import | 25 | [studio/src/families/families.mjs](./families.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/library.mjs](../../bin/commands/library.mjs.md) | ../../src/families/core.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Cross-site CORE library: one contract for how AI chat sites stream an answer, plus the per-site
// dialect that differs. Nothing in the contract is hardcoded: every transport, frame kind, delta
// field, terminal marker and envelope field is EARNED from the derived sessions on disk.
//
// Reused vocabulary and stores (no parallel taxonomy):
//   - sessions + SHAPES / ASSEMBLED   src/store/session.mjs via collectSessions() in ./build.mjs
//   - endpoint path patterns          ./build.mjs  pathPattern()
//   - per-site stream hash            ./build.mjs  familySignature()
//   - persistence                     ./families.mjs FamilyStore (vNNNN.json + CURRENT)
//   - transport + field names         src/shapes/infer.mjs / profiler.mjs (endpoints[], groups[].fields)
//
// Delta / terminal evidence: within one shape group (same endpoint + discriminator, i.e. the same
// kind of frame of the same stream) a field present in several records whose value is not constant
// behaves like a delta; a frame whose discriminator or field names a completion behaves like a
// terminal marker. Scalar fields expose `distinct`; container fields (object/array) are treated as
// changing because their contents can change while the path stays the same.
//
// Determinism: every collection is sorted, the per-site and core signatures hash only normalised
// data (no timestamps, no session ids), so two runs over the same sessions are byte-identical.
import path from 'node:path';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { ADAPTER_IDS } from '../profiles/sites/index.mjs';
import { collectSessions, familySignature, pathPattern } from './build.mjs';
import { FamilyStore } from './families.mjs';

// The nine sites this build knows how to drive (same list as the adapter registry).
export const CORE_SITES = Object.freeze([...ADAPTER_IDS]);

const LIBRARY_ID = 'ai-chat-core';
const SIG_NOTE = 'ai-chat-core contract v1';

const STREAMING = new Set(['HTTP_SSE', 'HTTP_NDJSON', 'HTTP_STREAMED', 'EVENT_SOURCE', 'WEBSOCKET']);
const SCALAR = new Set(['string', 'number', 'boolean', 'null']);

// Field leaves that behave like streamed answer text when they are present on a streaming frame.
const DELTA_LEAVES = new Set(['v', 'value', 'delta', 'text', 'token', 'tokens', 'chunk', 'chunks', 'completion', 'fragment', 'patch', 'answer', 'output', 'response']);
const TERMINAL_LEAVES = new Set(['end_turn', 'finish_reason', 'stop_reason', 'stop_sequence', 'stream_close_reason', 'message_stream_complete', 'done']);
const STRONG_FRAME = /message_stream_complete|message_stop|\[DONE\]|stream_complete|end_turn|finish_reason|stop_reason|stream_close|close_reason/i;
const ENVELOPE_LEAVES = new Set(['type', 'kind', 'model', 'stream', 'metadata', 'delta', 'conversation_id', 'message_id', 'id', 'request_id', 'role', 'content', 'usage', 'status', 'event', 'session_id', 'prompt', 'messages', 'data', 'error']);
const TOOL_LEAVES = new Set(['tool_use', 'tool_call', 'tool_calls', 'function_call', 'tool_result', 'tool_name', 'tool_use_id']);
const USAGE_LEAVES = new Set(['usage', 'input_tokens', 'output_tokens', 'token_usage', 'cached_tokens', 'total_tokens', 'prompt_tokens', 'completion_tokens']);
const REQUEST_LEAVES = new Set(['input_message', 'messages', 'prompt', 'instructions', 'system', 'content', 'parts']);

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const sorted = (iterable) => [...iterable].sort(cmp);
const uniq = (iterable) => sorted(new Set(iterable));

// Last path segment as a normalised field name ("$.metadata[\"Stream-Close-Reason\"]" -> stream_close_reason).
function leafOf(p) {
  const seg = String(p ?? '').replace(/\[\*\]/g, '').split('.').pop() ?? '';
  const m = /\["([^"]+)"\]$/.exec(seg);
  return (m ? m[1] : seg).toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, '');
}

const isStreamingEndpoint = (ep) => Object.keys(ep?.transports ?? {}).some((t) => STREAMING.has(t));

// The transport that carried most of this endpoint's streams (ties broken by name).
function dominantTransport(ep) {
  const entries = Object.entries(ep?.transports ?? {});
  if (!entries.length) return 'UNKNOWN';
  entries.sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0) || cmp(a[0], b[0]));
  return entries[0][0];
}

// Field paths that behave like a delta on this frame kind.
function deltaFieldsOf(g) {
  const out = new Set();
  for (const [p, f] of Object.entries(g?.fields ?? {})) {
    if (!p || p === '$') continue;
    if (Number(f?.count ?? 0) < 2) continue;
    const stripped = String(p).replace(/\[\*\]/g, '');
    // Collection-item paths only count when they sit under an explicit delta envelope
    // (choices[*].delta.content); otherwise every nested array element looks like a delta.
    if (String(p).includes('[*]') && !/(^|\.)delta(\.|$)/i.test(stripped)) continue;
    if (stripped.split('.').length - 1 > 3) continue;
    const leaf = leafOf(p);
    if (!leaf) continue;
    const types = Array.isArray(f?.types) ? f.types : [];
    const scalar = types.length > 0 && types.every((t) => SCALAR.has(t));
```

_First 80 of 401 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
