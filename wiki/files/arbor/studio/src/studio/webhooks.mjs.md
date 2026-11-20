# File: studio/src/studio/webhooks.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/webhooks.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6563 B |
| Lines | 105 |
| Hash | 6cf52324f337 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Webhooks | class | 9 | yes | export class Webhooks { |
| constructor | method | 10 | yes | constructor(feed, { forbiddenPorts = () =&gt; [] } = {}) { |
| register | method | 17 | yes | register(input) { |
| url | variable | 22 | no | let url; |
| destinationPort | const | 26 | no | const destinationPort = Number(url.port \|\| (url.protocol === &#39;https:&#39; ? 443 : 80)); |
| events | const | 28 | no | const events = input.events ?? [&#39;started&#39;, &#39;stopped&#39;, &#39;session.derived&#39;]; |
| hook | const | 32 | no | const hook = { id: randomBytes(12).toString(&#39;hex&#39;), url: url.href, events: [...new Set(events)], session: input.session ?? null, |
| view | method | 39 | yes | view(hook) { |
| get | method | 44 | yes | get(id) { const hook = this.hooks.get(id); if (!hook) throw problem(404, &#39;Webhook not found&#39;, &#39;NOT_FOUND&#39;); return hook; } |
| list | method | 45 | yes | list() { return [...this.hooks.values()].map((h) =&gt; this.view(h)); } |
| remove | method | 46 | yes | remove(id) { |
| hook | const | 47 | no | const hook = this.get(id); this.hooks.delete(id); |
| dispatch | method | 52 | yes | dispatch(event) { |
| data | const | 57 | no | const data = hook.includePayload ? event.data : Object.fromEntries([&#39;seq&#39;, &#39;t&#39;, &#39;sid&#39;, &#39;k&#39;, &#39;state&#39;].filter((k) =&gt; event.data?.[k] !== undefined).map((k) =&gt; [k, event.data[k]])); |
| body | const | 58 | no | const body = JSON.stringify({ schema: &#39;capture-studio.webhook/1&#39;, id: event.id, type: event.type, at: event.at, session: event.session, preview: true, payloadIncluded: hook.includePayload, data }); |
| bytes | const | 59 | no | const bytes = Buffer.byteLength(body); |
| pump | method | 66 | yes | pump(hook) { |
| item | const | 68 | no | const item = hook.queue.shift(); hook.queuedBytes -= item.bytes; |
| stamp | const | 69 | no | const stamp = String(Math.floor(Date.now() / 1000)); |
| signature | const | 70 | no | const signature = createHmac(&#39;sha256&#39;, hook.secret).update(`${stamp}.${item.body}`).digest(&#39;hex&#39;); |
| started | const | 71 | no | const started = Date.now(); |
| finished | variable | 72 | no | let finished = false, deadline; |
| done | function | 73 | no | const done = (status, error = null) =&gt; { |
| ok | const | 75 | no | const ok = status &gt;= 200 &amp;&amp; status &lt; 300; |
| transport | const | 84 | no | const transport = hook.url.startsWith(&#39;https:&#39;) ? https : http; |
| req | const | 85 | no | const req = transport.request(hook.url, { method: &#39;POST&#39;, agent: false, headers: { &#39;content-type&#39;: &#39;application/json&#39;, &#39;content-length&#39;: item.bytes, &#39;x-capture-event-id&#39;: item.eventId, &#39;x-capture-tim… |
| close | method | 100 | yes | close() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:http | import | 3 | external |
| node:https | import | 4 | external |
| node:crypto | import | 5 | external |
| ./event-feed.mjs | import | 6 | [studio/src/studio/event-feed.mjs](./event-feed.mjs.md) |
| ./http.mjs | import | 7 | [studio/src/studio/http.mjs](./http.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) | ./webhooks.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Explicitly registered, process-lifetime local integrations. Never forward Studio auth.
// No redirects, no DNS lookup, no remote destinations, no retry of uncertain effects.
import http from 'node:http';
import https from 'node:https';
import { createHmac, randomBytes } from 'node:crypto';
import { EVENT_TYPES } from './event-feed.mjs';
import { problem, object, text } from './http.mjs';

export class Webhooks {
  constructor(feed, { forbiddenPorts = () => [] } = {}) {
    this.feed = feed; this.forbiddenPorts = forbiddenPorts;
    this.hooks = new Map(); this.closed = false;
    this.onDelivery = (event) => this.dispatch(event);
    feed.on('delivery', this.onDelivery);
  }

  register(input) {
    object(input);
    if (this.closed) throw problem(503, 'Webhooks are closing');
    // A registration POST is the explicit local-owner operation; no redundant
    // confirm checkbox or artificial 16-hook cap. Delivery remains 127.0.0.1/[::1] only.
    let url;
    try { url = new URL(text(input.url, 'url', 2048)); } catch { throw problem(400, 'Invalid webhook URL'); }
    if (!['http:', 'https:'].includes(url.protocol) || !['127.0.0.1', '[::1]'].includes(url.hostname)
      || url.username || url.password || url.hash || url.search) throw problem(400, 'Webhook URL must use literal 127.0.0.1 or [::1], HTTP(S), and no credentials, query or fragment');
    const destinationPort = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
    if (this.forbiddenPorts().includes(destinationPort)) throw problem(400, 'Studio and DevTools ports cannot be webhook destinations');
    const events = input.events ?? ['started', 'stopped', 'session.derived'];
    if (!Array.isArray(events) || !events.length || events.some((e) => !EVENT_TYPES.includes(e))) throw problem(400, 'events must be a nonempty list of supported event types');
    if (input.session !== undefined) text(input.session, 'session', 128);
    if (input.includePayload !== undefined && typeof input.includePayload !== 'boolean') throw problem(400, 'includePayload must be boolean');
    const hook = { id: randomBytes(12).toString('hex'), url: url.href, events: [...new Set(events)], session: input.session ?? null,
      includePayload: input.includePayload === true, secret: randomBytes(32).toString('base64url'), createdAt: new Date().toISOString(),
      queue: [], queuedBytes: 0, delivered: 0, failed: 0, dropped: 0, active: null, receipts: [] };
    this.hooks.set(hook.id, hook);
    return { ...this.view(hook), secret: hook.secret, secretNote: 'Returned once; HMAC-SHA256 over timestamp + dot + exact request body. Registration expires on Studio shutdown.' };
  }

  view(hook) {
    return { id: hook.id, url: hook.url, events: hook.events, session: hook.session, includePayload: hook.includePayload,
      createdAt: hook.createdAt, pending: hook.queue.length, inFlight: !!hook.active, delivered: hook.delivered, failed: hook.failed, dropped: hook.dropped,
      lastDelivery: hook.receipts.at(-1) ?? null, durable: false, retries: false };
  }
  get(id) { const hook = this.hooks.get(id); if (!hook) throw problem(404, 'Webhook not found', 'NOT_FOUND'); return hook; }
  list() { return [...this.hooks.values()].map((h) => this.view(h)); }
  remove(id) {
    const hook = this.get(id); this.hooks.delete(id);
    hook.active?.destroy(); hook.queue = []; hook.queuedBytes = 0;
    return { deleted: id, inFlightMayHaveBeenDelivered: !!hook.active };
  }

  dispatch(event) {
    if (this.closed) return;
    for (const hook of this.hooks.values()) {
      if (!hook.events.includes(event.type) || (hook.session && hook.session !== event.session)) continue;
      // Payloads can contain private captured content. Default envelope contains no URLs/text.
      const data = hook.includePayload ? event.data : Object.fromEntries(['seq', 't', 'sid', 'k', 'state'].filter((k) => event.data?.[k] !== undefined).map((k) => [k, event.data[k]]));
      const body = JSON.stringify({ schema: 'capture-studio.webhook/1', id: event.id, type: event.type, at: event.at, session: event.session, preview: true, payloadIncluded: hook.includePayload, data });
      const bytes = Buffer.byteLength(body);
      if (hook.queue.length >= 100 || hook.queuedBytes + bytes > 1024 * 1024) { hook.dropped++; continue; }
      hook.queue.push({ body, bytes, eventId: event.id }); hook.queuedBytes += bytes;
      this.pump(hook);
    }
  }

  pump(hook) {
    if (hook.active || !hook.queue.length || this.closed || !this.hooks.has(hook.id)) return;
    const item = hook.queue.shift(); hook.queuedBytes -= item.bytes;
    const stamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac('sha256', hook.secret).update(`${stamp}.${item.body}`).digest('hex');
    const started = Date.now();
    let finished = false, deadline;
    const done = (status, error = null) => {
      if (finished) return; finished = true; clearTimeout(deadline);
      const ok = status >= 200 && status < 300;
      if (ok) hook.delivered++; else hook.failed++;
      hook.receipts.push({ eventId: item.eventId, at: new Date().toISOString(), status: status ?? null, ok, error, durationMs: Date.now() - started,
        outcome: ok ? 'acknowledged' : status ? 'http_rejected' : 'delivery_unknown' });
      if (hook.receipts.length > 100) hook.receipts.shift();
      hook.active = null;
```

_First 80 of 106 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
