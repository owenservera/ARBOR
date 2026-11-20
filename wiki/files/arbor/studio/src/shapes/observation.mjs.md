# File: studio/src/shapes/observation.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/shapes/observation.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12207 B |
| Lines | 215 |
| Hash | 898335e2848f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| OBSERVATION_SCHEMA | const | 17 | yes | export const OBSERVATION_SCHEMA = &#39;aion.web-observation/1&#39;; |
| OBSERVATION_VERSION | const | 18 | yes | export const OBSERVATION_VERSION = 1; |
| TEXT_PREVIEW_CAP | const | 19 | yes | export const TEXT_PREVIEW_CAP = 240; |
| CHAT_ENDPOINT_RE | const | 21 | no | const CHAT_ENDPOINT_RE = /conversation\|completion\|chat\|message\|generate\|stream\|reply\|timeline\|response/i; |
| SEMANTIC_PARTS | const | 26 | yes | export const SEMANTIC_PARTS = Object.freeze([&#39;text&#39;, &#39;markdown&#39;, &#39;code&#39;, &#39;table&#39;, &#39;chart&#39;, &#39;image&#39;, &#39;file&#39;, &#39;citation&#39;, &#39;reference&#39;, &#39;visible-thinking-summary&#39;, &#39;progress&#39;, &#39;tool-activity-observed&#39;, … |
| PART_BY_NATIVE_COMPONENT | const | 30 | no | const PART_BY_NATIVE_COMPONENT = Object.freeze({ paragraph: &#39;text&#39;, heading: &#39;markdown&#39;, list: &#39;markdown&#39;, table: &#39;table&#39;, code: &#39;code&#39;, quote: &#39;text&#39;, image: &#39;image&#39;, file: &#39;file&#39;, link: &#39;reference&#39;… |
| preview | function | 37 | no | const preview = (text, cap = TEXT_PREVIEW_CAP) =&gt; { |
| full | const | 38 | no | const full = typeof text === &#39;string&#39; ? text : &#39;&#39;; |
| truncated | const | 39 | no | const truncated = full.length &gt; cap; |
| projectPart | function | 43 | no | const projectPart = (c) =&gt; { |
| native | const | 44 | no | const native = c.component ?? &#39;unknown&#39;; |
| partType | const | 45 | no | const partType = PART_BY_NATIVE_COMPONENT[native] ?? &#39;unknown-native&#39;; |
| projectTurn | function | 56 | no | const projectTurn = (t, ord) =&gt; { |
| role | const | 57 | no | const role = t?.role === &#39;user&#39; \|\| t?.role === &#39;assistant&#39; ? t.role : &#39;unknown&#39;; |
| completionFacts | function | 70 | no | function completionFacts({ terminal, join, acceptance, sessionStatus }) { |
| streams | const | 71 | no | const streams = terminal?.streams ?? 0, done = terminal?.done ?? 0, failed = terminal?.fail ?? 0; |
| chatStreams | const | 72 | no | const chatStreams = terminal?.chatStreams ?? null; |
| withoutTerminal | const | 73 | no | const withoutTerminal = chatStreams === null ? null : Math.max(0, chatStreams - done - failed); |
| lossMarkers | function | 88 | no | function lossMarkers({ componentsDoc, domTurns, terminal, join }) { |
| out | const | 89 | no | const out = []; |
| streams | const | 90 | no | const streams = Array.isArray(componentsDoc?.streams) ? componentsDoc.streams : []; |
| unmapped | const | 91 | no | const unmapped = streams.reduce((a, s) =&gt; a + (s.unmappedCount ?? 0), 0); |
| unknownParts | const | 94 | no | const unknownParts = streams.reduce((a, s) =&gt; a + (s.components ?? []).filter((c) =&gt; !(c.component in PART_BY_NATIVE_COMPONENT)).length, 0); |
| unknownRoles | const | 96 | no | const unknownRoles = (Array.isArray(domTurns) ? domTurns : []).filter((t) =&gt; t?.role !== &#39;user&#39; &amp;&amp; t?.role !== &#39;assistant&#39;).length; |
| buildObservation | function | 110 | yes | export function buildObservation({ session, profile = null, components = null, domTurns = null, join = null, shapes = null, acceptance = null, terminal = null } = {}) { |
| meta | const | 113 | no | const meta = session.meta ?? {}; |
| site | const | 114 | no | const site = meta.site ?? null; |
| targetUrl | const | 115 | no | const targetUrl = meta.target?.url ?? null; |
| conversation | variable | 118 | no | let conversation = { binding: &#39;unverified&#39;, nativeRef: null, identitySource: null }; |
| thread | const | 120 | no | const thread = parseThread(site, targetUrl); |
| endpoints | const | 123 | no | const endpoints = Array.isArray(shapes?.endpoints) ? shapes.endpoints : []; |
| chatEndpoints | const | 124 | no | const chatEndpoints = endpoints.filter((e) =&gt; CHAT_ENDPOINT_RE.test(e.endpoint ?? &#39;&#39;)); |
| surface | const | 125 | no | const surface = chatEndpoints.length &gt; 0 ? &#39;chat&#39; : endpoints.length &gt; 0 ? &#39;unknown&#39; : &#39;unknown&#39;; |
| componentsDoc | const | 127 | no | const componentsDoc = components &amp;&amp; components.schema === &#39;capture-studio.stream-components/1&#39; ? components : null; |
| streams | const | 128 | no | const streams = (componentsDoc?.streams ?? []).map((s) =&gt; ({ sid: s.sid, carrier: &#39;network-stream&#39;, native: { mapId: s.mapId ?? null, mapVerified: s.mapId !== null, eventsOmitted: s.eventsOmitted ?? … |
| turns | const | 138 | no | const turns = (Array.isArray(domTurns) ? domTurns : []).map(projectTurn); |
| joinSummary | const | 139 | no | const joinSummary = join?.summary?.messageStatus ?? null; |
| scanTerminalRecords | function | 177 | yes | export async function scanTerminalRecords(session, { chatEndpointRe = CHAT_ENDPOINT_RE } = {}) { |
| shapes | const | 178 | no | const shapes = session.kv.get(&#39;SHAPES&#39;, null); |
| chatSids | const | 179 | no | const chatSids = new Set(); |
| state | const | 186 | no | const state = new Map(); // sid -&gt; { done, fail } |
| firstSeq | variable | 187 | no | let firstSeq = null, lastSeq = null, count = 0; |
| e | const | 192 | no | const e = state.get(r.sid) ?? { done: 0, fail: 0 }; |
| streams | variable | 196 | no | let streams = 0, done = 0, fail = 0; |
| observeSession | function | 203 | yes | export async function observeSession(session, { profile = null, acceptance = null, scanImpl = scanTerminalRecords } = {}) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../capture/conversation-thread.mjs | import | 15 | [studio/src/capture/conversation-thread.mjs](../capture/conversation-thread.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/integration-hub.mjs](../studio/integration-hub.mjs.md) | ../shapes/observation.mjs |
| [studio/src/studio/world-service.mjs](../studio/world-service.mjs.md) | ../shapes/observation.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// The L02->L03 seam of the webapp-native harness (roles/14-webapp-native-harness/CONTRACTS.md):
// a LOSS-AWARE common projection over Capture Studio's own derived session data. It never
// discards native structure to obtain a plain response.text, never fabricates identity
// (unverified stays null), and keeps DOM and network evidence separable when they disagree.
//
// Pure projection: the builder consumes already-derived artifacts (STREAM_COMPONENTS, DOM_TURNS,
// STREAM_DOM_JOIN, SHAPES, acceptance document) and an optional terminal-record scan. No browser
// logic, no new write path, no second parser; every node carries its source references so the
// original evidence stays authoritative.
//
// Identity rules (bench E03): a conversation reference is surfaced ONLY through the source-
// supported durable thread parser (ChatGPT /c/<uuid> today). Guest query-parameter identities
// (e.g. duck.ai ?chatID) and title/ordinal/timestamp/text heuristics are NEVER elevated; they
// stay binding 'unverified' with nativeRef null.
import { parseThread, threadSupported } from '../capture/conversation-thread.mjs';

export const OBSERVATION_SCHEMA = 'aion.web-observation/1';
export const OBSERVATION_VERSION = 1;
export const TEXT_PREVIEW_CAP = 240;
// Chat-surface detection uses the same endpoint heuristic as docs/AI-CHAT-SHAPES.md generation.
const CHAT_ENDPOINT_RE = /conversation|completion|chat|message|generate|stream|reply|timeline|response/i;

// SemanticPart vocabulary from the specialist contract, plus the native names the projection
// already knows. Anything outside the vocabulary is projected as 'unknown-native' with the raw
// component name retained — never silently coerced to text.
export const SEMANTIC_PARTS = Object.freeze(['text', 'markdown', 'code', 'table', 'chart', 'image', 'file',
  'citation', 'reference', 'visible-thinking-summary', 'progress', 'tool-activity-observed', 'artifact',
  'error', 'interactive-native', 'unknown']);

const PART_BY_NATIVE_COMPONENT = Object.freeze({
  paragraph: 'text', heading: 'markdown', list: 'markdown', table: 'table', code: 'code',
  quote: 'text', image: 'image', file: 'file', link: 'reference', citation: 'citation',
  equation: 'text', rule: 'text', tool: 'tool-activity-observed',
  message: 'text',
});

const preview = (text, cap = TEXT_PREVIEW_CAP) => {
  const full = typeof text === 'string' ? text : '';
  const truncated = full.length > cap;
  return { textPreview: truncated ? full.slice(0, cap) : full, textTruncated: truncated, textLength: full.length };
};

const projectPart = (c) => {
  const native = c.component ?? 'unknown';
  const partType = PART_BY_NATIVE_COMPONENT[native] ?? 'unknown-native';
  return {
    key: c.componentKey ?? null,
    partType,
    nativeType: native,
    ...(partType === 'unknown-native' ? { lossMarker: 'unknown-native-part' } : {}),
    state: c.opened === true && c.closed === true ? 'closed' : c.opened === true ? 'streaming' : 'unknown',
    ...preview(c.text),
  };
};

const projectTurn = (t, ord) => {
  const role = t?.role === 'user' || t?.role === 'assistant' ? t.role : 'unknown';
  return {
    ord,
    nativeRef: { carrier: 'dom', domId: t?.domId ?? t?.id ?? null, roleAttribute: t?.roleAttribute ?? null },
    partType: role === 'user' ? 'user-turn' : role === 'assistant' ? 'assistant-generation' : 'unknown-native',
    ...(role === 'unknown' ? { lossMarker: 'unknown-dom-role' } : {}),
    truncated: t?.truncated === true || undefined,
    ...preview(t?.text),
  };
};

// The five completion facts are DISTINCT (CONTRACTS lifecycle semantics): a single boolean done
// is never enough. Each fact names the evidence class it came from.
function completionFacts({ terminal, join, acceptance, sessionStatus }) {
  const streams = terminal?.streams ?? 0, done = terminal?.done ?? 0, failed = terminal?.fail ?? 0;
  const chatStreams = terminal?.chatStreams ?? null;
  const withoutTerminal = chatStreams === null ? null : Math.max(0, chatStreams - done - failed);
  return {
    providerNetworkEnded: streams === 0 ? 'unknown'
      : failed > 0 ? 'no' : withoutTerminal === 0 && done > 0 ? 'yes' : done > 0 ? 'partial' : 'no',
    pageStable: acceptance?.gates?.G3 ? acceptance.gates.G3.value : 'unassessed',
    turnAttribution: {
      domObserved: (terminal?.domTurns ?? 0) > 0,
      joinStatus: join && !join.error ? join.status ?? null : join?.error ? 'join-error' : 'not-derived',
```

_First 80 of 216 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
