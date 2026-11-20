# File: studio/src/studio/conversation-events.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/conversation-events.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9408 B |
| Lines | 153 |
| Hash | 54649cd43308 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CONVERSATION_EVENT_TYPES | const | 30 | yes | export const CONVERSATION_EVENT_TYPES = [&#39;conversation.changed&#39;]; |
| CONVERSATION_TEXT_EVENT_TYPES | const | 31 | yes | export const CONVERSATION_TEXT_EVENT_TYPES = [...CONVERSATION_EVENT_TYPES, &#39;conversation.reply_text&#39;]; |
| REPLY_TEXT_EVENT | const | 32 | yes | export const REPLY_TEXT_EVENT = &#39;conversation.reply_text&#39;; |
| DEFAULT_TEXT_LIMITS | const | 33 | no | const DEFAULT_TEXT_LIMITS = Object.freeze({ maxChars: 16000 }); |
| turnProjection | function | 35 | no | const turnProjection = (t) =&gt; ({ id: t.id, key: t.key, phase: t.phase, reason: t.reason ?? null, send: { state: t.send?.state ?? null, observationSource: t.send?.observationSource ?? null }, reply: {… |
| projection | function | 41 | no | const projection = (v) =&gt; ({ conversationId: v.id, revision: v.revision, state: v.state, site: v.site, identity: v.identity ?? null, readiness: v.readiness ?? null, writer: { active: v.writer?.active… |
| textProjection | function | 49 | no | const textProjection = (v, maxChars) =&gt; { |
| t | const | 50 | no | const t = v.turn, r = t?.reply; |
| raw | const | 52 | no | const raw = typeof r.text === &#39;string&#39; ? r.text : &#39;&#39;; |
| truncated | const | 53 | no | const truncated = raw.length &gt; maxChars; |
| textKey | function | 62 | no | const textKey = (snap, fullText) =&gt; snap === null ? null |
| createConversationEvents | function | 65 | yes | export function createConversationEvents({ runtime, intervalMs = 200, feedOptions = {}, textFeedOptions = {}, textLimits = {} } = {}) { |
| maxChars | const | 66 | no | const maxChars = Number.isSafeInteger(textLimits.maxChars) &amp;&amp; textLimits.maxChars &gt; 0 &amp;&amp; textLimits.maxChars &lt;= 128000 |
| feed | const | 68 | no | const feed = new EventFeed({ eventTypes: CONVERSATION_EVENT_TYPES, ...feedOptions }); |
| textFeed | const | 70 | no | const textFeed = new EventFeed({ eventTypes: CONVERSATION_TEXT_EVENT_TYPES, ...textFeedOptions }); |
| watched | const | 71 | no | const watched = new Map(); // conversation id -&gt; { last: string\|null, lastTextKey: string\|null, missing: boolean } |
| timer | variable | 72 | no | let timer = null, pumping = false; |
| start | function | 74 | no | const start = () =&gt; { |
| stop | function | 83 | no | const stop = () =&gt; { if (timer) { clearInterval(timer); timer = null; } }; |
| pump | function | 84 | no | async function pump() { |
| view | variable | 86 | no | let view; |
| next | const | 99 | no | const next = JSON.stringify(projection(view)); |
| payload | const | 102 | no | const payload = JSON.parse(next); |
| snap | const | 106 | no | const snap = textProjection(view, maxChars), key = textKey(snap, view.turn?.reply?.text); |
| withText | const | 132 | no | const withText = q.include === &#39;text&#39;; |
| selected | const | 133 | no | const selected = withText ? textFeed : feed; |
| result | const | 134 | no | const result = selected.subscribe(req, res, { ...q, session: id }, { status: { conversationId: id, derived: &#39;conversation snapshot diff; reply text only on the include=text feed, bounded and snapshot… |
| release | function | 139 | no | const release = () =&gt; { |
| active | const | 142 | no | const active = [...feed.clients, ...textFeed.clients].some((client) =&gt; client.session === id); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 26 | external |
| ./event-feed.mjs | import | 27 | [studio/src/studio/event-feed.mjs](./event-feed.mjs.md) |
| ./http.mjs | import | 28 | [studio/src/studio/http.mjs](./http.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/server.mjs](./server.mjs.md) | ./conversation-events.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Incremental conversation state events for harness clients, over the studio's existing
// EventFeed SSE contract (epoch:sequence delivery cursors, bounded process-local replay,
// reset on cursor loss, heartbeats, slow-client disconnect).
//
// This is a DERIVED read-model, deliberately: a bounded diff pump re-reads the runtime's own
// conversation views and publishes events per observed change. There is no second state store
// to diverge, no browser logic, and no new write path — the durable truth stays the conversation
// snapshot + thread-turn journal. The snapshot revision carried in every event is the durable
// state cursor; the SSE `id:` is only a delivery cursor.
//
// Reconnect contract (no blind replay): a client reconnects with Last-Event-ID / after and is
// replayed the retained window exactly once; if the cursor predates the retained window or the
// server restarted (epoch change), the client receives a `reset` event and re-reads state with
// an ordinary authenticated conversation GET. Events never instruct a resend; submission stays
// gated by the runtime (journal fence + writer window), so no event can cause a duplicate send.
//
// TWO feeds, ONE pump. The default feed carries lifecycle metadata ONLY (phases, send/reply
// states, revisions, writer and diagnostic accounting) — prompts and reply text are never
// included, so existing metadata-only clients keep their exact contract. Clients that opt in
// with `?include=text` subscribe to a separate feed that ALSO publishes `conversation.reply_text`:
// bounded snapshot events carrying the newest turn's reply text with its source confidence
// (network/page/differ) and attribution identity. Snapshots (not deltas) make any single event
// self-sufficient under bounded replay: a client that missed earlier events renders the latest
// snapshot correctly and re-reads full text via the authenticated conversation GET. Text is
// head-capped (truncated flag set); full bodies remain in the durable snapshot and saved session.
import { createHash } from 'node:crypto';
import { EventFeed } from './event-feed.mjs';
import { problem } from './http.mjs';

export const CONVERSATION_EVENT_TYPES = ['conversation.changed'];
export const CONVERSATION_TEXT_EVENT_TYPES = [...CONVERSATION_EVENT_TYPES, 'conversation.reply_text'];
export const REPLY_TEXT_EVENT = 'conversation.reply_text';
const DEFAULT_TEXT_LIMITS = Object.freeze({ maxChars: 16000 });

const turnProjection = (t) => ({ id: t.id, key: t.key, phase: t.phase, reason: t.reason ?? null,
  send: { state: t.send?.state ?? null, observationSource: t.send?.observationSource ?? null },
  reply: { state: t.reply?.state ?? null, completion: t.reply?.completion ?? null,
    revision: t.reply?.evidence?.revision ?? null, identity: t.reply?.evidence?.identity ?? null },
  readiness: t.readiness?.state ?? null, completion: t.completion?.state ?? null });

const projection = (v) => ({ conversationId: v.id, revision: v.revision, state: v.state, site: v.site,
  identity: v.identity ?? null, readiness: v.readiness ?? null,
  writer: { active: v.writer?.active === true, releaseError: v.writer?.releaseError ?? null },
  diagnostic: v.diagnostic ?? null, turns: (v.turns ?? []).map(turnProjection) });

// Bounded self-sufficient reply snapshot for the newest turn. source/identity keep the separation
// of state, content and source confidence: a client can never mistake page text for a matched
// network stream, and identity points at the durable reply evidence behind the text.
const textProjection = (v, maxChars) => {
  const t = v.turn, r = t?.reply;
  if (!t || !r) return null;
  const raw = typeof r.text === 'string' ? r.text : '';
  const truncated = raw.length > maxChars;
  return { conversationId: v.id, turnId: t.id, revision: v.revision,
    reply: { state: r.state ?? null, source: r.source ?? null, completion: r.completion ?? null,
      chars: r.chars ?? raw.length, text: truncated ? raw.slice(0, maxChars) : raw, truncated,
      identity: r.evidence?.identity ?? null, evidenceRevision: r.evidence?.revision ?? null },
    at: new Date().toISOString() };
};
// The wire snapshot is deliberately head-capped. Hash the COMPLETE in-memory reply,
// otherwise changes beyond the cap (including same-length edits) never wake consumers.
const textKey = (snap, fullText) => snap === null ? null
  : `${snap.turnId}:${snap.reply.state}:${snap.reply.chars}:${createHash('sha256').update(typeof fullText === 'string' ? fullText : snap.reply.text).digest('hex').slice(0, 16)}`;

export function createConversationEvents({ runtime, intervalMs = 200, feedOptions = {}, textFeedOptions = {}, textLimits = {} } = {}) {
  const maxChars = Number.isSafeInteger(textLimits.maxChars) && textLimits.maxChars > 0 && textLimits.maxChars <= 128000
    ? textLimits.maxChars : DEFAULT_TEXT_LIMITS.maxChars;
  const feed = new EventFeed({ eventTypes: CONVERSATION_EVENT_TYPES, ...feedOptions });
  // The opt-in text feed carries the metadata events too, so one subscription is sufficient.
  const textFeed = new EventFeed({ eventTypes: CONVERSATION_TEXT_EVENT_TYPES, ...textFeedOptions });
  const watched = new Map(); // conversation id -> { last: string|null, lastTextKey: string|null, missing: boolean }
  let timer = null, pumping = false;
  // A slow snapshot read must not stack another full scan every 200 ms.
  const start = () => {
    if (timer || watched.size === 0) return;
    timer = setInterval(() => {
      if (pumping) return;
      pumping = true;
      pump().catch(() => {}).finally(() => { pumping = false; });
    }, intervalMs);
```

_First 80 of 154 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
