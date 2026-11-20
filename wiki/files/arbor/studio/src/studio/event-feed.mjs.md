# File: studio/src/studio/event-feed.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/event-feed.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6126 B |
| Lines | 102 |
| Hash | 0e7e27107f83 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| EVENT_TYPES | const | 6 | yes | export const EVENT_TYPES = [&#39;status&#39;, &#39;started&#39;, &#39;stopped&#39;, &#39;warn&#39;, &#39;record&#39;, &#39;event&#39;, &#39;session.derived&#39;, &#39;learning.changed&#39;]; |
| EventFeed | class | 8 | yes | export class EventFeed extends EventEmitter { |
| constructor | method | 9 | yes | constructor({ maxEvents = 1000, maxBytes = 4 * 1024 * 1024, maxClientBytes = 512 * 1024, maxClients = 32, eventTypes = EVENT_TYPES } = {}) { |
| publish | method | 17 | yes | publish(type, data, session = null) { |
| id | const | 19 | no | const id = `${this.epoch}:${++this.sequence}`; |
| event | variable | 20 | no | let event = { id, type, at: new Date().toISOString(), session, data }; |
| encoded | variable | 21 | no | let encoded = JSON.stringify(event); |
| entry | const | 29 | no | const entry = { event, encoded, bytes: Buffer.byteLength(encoded) }; |
| matches | method | 37 | yes | matches(filter, event) { |
| frame | method | 44 | yes | frame(entry, legacy) { |
| write | method | 48 | yes | write(client, frame) { |
| subscribe | method | 58 | yes | subscribe(req, res, q = {}, { legacy = false, status = {} } = {}) { |
| types | const | 61 | no | const types = new Set(q.types ? String(q.types).split(&#39;,&#39;).filter(Boolean) : []); |
| kinds | const | 63 | no | const kinds = new Set(q.kind ? String(q.kind).split(&#39;,&#39;).filter(Boolean) : []); |
| cursor | const | 64 | no | const cursor = req.headers[&#39;last-event-id&#39;] ?? q.after; |
| replay | const | 65 | no | const replay = integer(q.replay, 0, this.maxEvents); |
| m | const | 68 | no | const m = /^([a-f0-9]{16}):(\\d+)$/.exec(String(cursor)); |
| oldest | const | 71 | no | const oldest = this.events[0]?.event.id.split(&#39;:&#39;)[1] ?? this.sequence + 1; |
| client | const | 78 | no | const client = { res, types, kinds, session: q.session, sid: q.sid, legacy, cleanup: () =&gt; { clearInterval(client.timer); this.clients.delete(client); } }; |
| info | method | 96 | yes | info() { return { epoch: this.epoch, latest: `${this.epoch}:${this.sequence}`, retainedEvents: this.events.length, retainedBytes: this.bytes, subscribers: this.clients.size, maxEvents: this.maxEvents… |
| close | method | 97 | yes | close() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |
| node:events | import | 3 | external |
| ./http.mjs | import | 4 | [studio/src/studio/http.mjs](./http.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/capabilities.mjs](./capabilities.mjs.md) | ./event-feed.mjs |
| [studio/src/studio/conversation-events.mjs](./conversation-events.mjs.md) | ./event-feed.mjs |
| [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) | ./event-feed.mjs |
| [studio/src/studio/webhooks.mjs](./webhooks.mjs.md) | ./event-feed.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Process-local, bounded SSE replay. IDs are delivery cursors, NOT durable raw-log sequences.
import { randomBytes } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { problem, integer } from './http.mjs';

export const EVENT_TYPES = ['status', 'started', 'stopped', 'warn', 'record', 'event', 'session.derived', 'learning.changed'];

export class EventFeed extends EventEmitter {
  constructor({ maxEvents = 1000, maxBytes = 4 * 1024 * 1024, maxClientBytes = 512 * 1024, maxClients = 32, eventTypes = EVENT_TYPES } = {}) {
    super();
    this.epoch = randomBytes(8).toString('hex'); this.sequence = 0;
    this.events = []; this.bytes = 0; this.clients = new Set();
    Object.assign(this, { maxEvents, maxBytes, maxClientBytes, maxClients, eventTypes });
    this.closed = false;
  }

  publish(type, data, session = null) {
    if (this.closed) return;
    const id = `${this.epoch}:${++this.sequence}`;
    let event = { id, type, at: new Date().toISOString(), session, data };
    let encoded = JSON.stringify(event);
    // Do not let a single unusually large status/event defeat bounded replay memory.
    if (Buffer.byteLength(encoded) > 128 * 1024) {
      event = { id, type, at: event.at, session, data: { truncated: true, reason: 'integration_event_size_limit', seq: data?.seq, sid: data?.sid } };
      encoded = JSON.stringify(event);
    }
    // Snapshot before storing: caller mutations must not change a replayed delivery.
    event = JSON.parse(encoded);
    const entry = { event, encoded, bytes: Buffer.byteLength(encoded) };
    this.events.push(entry); this.bytes += entry.bytes;
    while (this.events.length > this.maxEvents || this.bytes > this.maxBytes) this.bytes -= this.events.shift().bytes;
    for (const client of this.clients) if (this.matches(client, event)) this.write(client, this.frame(entry, client.legacy));
    this.emit('delivery', event);
    return event;
  }

  matches(filter, event) {
    return (!filter.session || filter.session === event.session)
      && (!filter.types.size || filter.types.has(event.type))
      && (!filter.sid || event.data?.sid === filter.sid)
      && (!filter.kinds?.size || filter.kinds.has(event.data?.kind) || filter.kinds.has(event.data?.k) || filter.kinds.has(event.type));
  }

  frame(entry, legacy) {
    return `id: ${entry.event.id}\nevent: ${entry.event.type}\ndata: ${legacy ? JSON.stringify(entry.event.data) : entry.encoded}\n\n`;
  }

  write(client, frame) {
    if (client.res.destroyed || client.res.writableEnded) { client.cleanup(); return false; }
    if (client.res.writableLength + Buffer.byteLength(frame) > this.maxClientBytes) {
      // Disconnect slow clients; Last-Event-ID resumes within the retained window.
      client.res.destroy(); client.cleanup(); return false;
    }
    client.res.write(frame);
    return true;
  }

  subscribe(req, res, q = {}, { legacy = false, status = {} } = {}) {
    if (this.closed) throw problem(503, 'Event feed is closing');
    if (this.clients.size >= this.maxClients) throw problem(429, 'Too many event stream subscribers');
    const types = new Set(q.types ? String(q.types).split(',').filter(Boolean) : []);
    for (const type of types) if (!this.eventTypes.includes(type)) throw problem(400, `Unknown event type: ${type}`);
    const kinds = new Set(q.kind ? String(q.kind).split(',').filter(Boolean) : []);
    const cursor = req.headers['last-event-id'] ?? q.after;
    const replay = integer(q.replay, 0, this.maxEvents);
    let from = this.sequence, reset = null;
    if (cursor !== undefined) {
      const m = /^([a-f0-9]{16}):(\d+)$/.exec(String(cursor));
      if (!m || !Number.isSafeInteger(Number(m[2]))) throw problem(400, 'Invalid event cursor');
      from = Number(m[2]);
      const oldest = this.events[0]?.event.id.split(':')[1] ?? this.sequence + 1;
      if (m[1] !== this.epoch || from > this.sequence || from < Number(oldest) - 1) {
        reset = { reason: m[1] !== this.epoch ? 'server_restarted' : 'cursor_outside_retained_window', oldest: this.events[0]?.event.id ?? null, latest: `${this.epoch}:${this.sequence}`, durableRecovery: '/api/v1/sessions/{session}/replay/records' };
        from = Number(oldest) - 1;
      }
    } else if (replay) from = Math.max(0, this.sequence - replay);
    res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no', 'x-content-type-options': 'nosniff' });
    const client = { res, types, kinds, session: q.session, sid: q.sid, legacy, cleanup: () => { clearInterval(client.timer); this.clients.delete(client); } };
    res.on('close', client.cleanup); res.on('error', client.cleanup);
    this.clients.add(client);
```

_First 80 of 103 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
