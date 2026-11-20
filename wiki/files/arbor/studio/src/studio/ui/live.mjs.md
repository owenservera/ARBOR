# File: studio/src/studio/ui/live.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/ui/live.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3763 B |
| Lines | 66 |
| Hash | b6a1db0cb6d5 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| form | const | 2 | no | const form = document.querySelector(&#39;#filters&#39;); |
| status | const | 3 | no | const status = document.querySelector(&#39;#status&#39;); |
| container | const | 4 | no | const container = document.querySelector(&#39;#streams&#39;); |
| streams | const | 5 | no | const streams = new Map(); |
| seen | const | 6 | no | const seen = new Set(); |
| source | variable | 7 | no | let source; |
| clear | function | 9 | no | function clear() { streams.clear(); seen.clear(); container.replaceChildren(); } |
| streamFor | function | 10 | no | function streamFor(data, session) { |
| sid | const | 11 | no | const sid = data.sid ?? data.stream?.sid ?? &#39;unknown&#39;; |
| key | const | 12 | no | const key = `${session ?? &#39;&#39;}:${sid}`; |
| oldest | const | 15 | no | const oldest = streams.keys().next().value; |
| section | const | 18 | no | const section = document.createElement(&#39;section&#39;); |
| heading | const | 19 | no | const heading = document.createElement(&#39;h2&#39;); |
| state | const | 20 | no | const state = document.createElement(&#39;p&#39;); |
| content | const | 21 | no | const content = document.createElement(&#39;pre&#39;); |
| receive | function | 29 | no | function receive(event) { |
| envelope | variable | 30 | no | let envelope; |
| data | const | 34 | no | const data = envelope.data ?? envelope; |
| stream | const | 36 | no | const stream = streamFor(data, envelope.session); |
| delta | const | 40 | no | const delta = typeof data.delta === &#39;string&#39; ? data.delta : typeof data.text === &#39;string&#39; ? data.text : typeof data === &#39;string&#39; ? data : &#39;&#39;; |
| connect | function | 49 | no | function connect() { |
| params | const | 51 | no | const params = new URLSearchParams(); |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Plain text only: captured content must never become HTML or executable script.
const form = document.querySelector('#filters');
const status = document.querySelector('#status');
const container = document.querySelector('#streams');
const streams = new Map();
const seen = new Set();
let source;

function clear() { streams.clear(); seen.clear(); container.replaceChildren(); }
function streamFor(data, session) {
  const sid = data.sid ?? data.stream?.sid ?? 'unknown';
  const key = `${session ?? ''}:${sid}`;
  if (!streams.has(key)) {
    if (streams.size >= 100) {
      const oldest = streams.keys().next().value;
      streams.get(oldest).section.remove(); streams.delete(oldest);
    }
    const section = document.createElement('section');
    const heading = document.createElement('h2');
    const state = document.createElement('p');
    const content = document.createElement('pre');
    heading.textContent = `${session ? session + ' / ' : ''}${sid}`;
    section.append(heading, state, content); container.append(section);
    streams.set(key, { section, state, content, text: '' });
  }
  return streams.get(key);
}

function receive(event) {
  let envelope;
  try { envelope = JSON.parse(event.data); } catch { status.textContent = 'Received an invalid feed event.'; return; }
  if (envelope.id && seen.has(envelope.id)) return;
  if (envelope.id) { seen.add(envelope.id); if (seen.size > 2000) seen.delete(seen.values().next().value); }
  const data = envelope.data ?? envelope;
  if (data.truncated) { status.textContent = 'An oversized event was omitted from this preview; use saved replay for full evidence.'; return; }
  const stream = streamFor(data, envelope.session);
  if (event.type === 'stream-open') stream.state.textContent = `Open ${data.kind ?? ''} ${data.url ?? ''}`;
  if (event.type === 'stream-close') stream.state.textContent = `Closed ${data.reason ?? ''}`;
  if (event.type !== 'text') return;
  const delta = typeof data.delta === 'string' ? data.delta : typeof data.text === 'string' ? data.text : typeof data === 'string' ? data : '';
  stream.text = data.replace === true || data.snapshot === true ? delta : stream.text + delta;
  if (stream.text.length > 200000) {
    stream.text = stream.text.slice(-200000);
    stream.state.textContent = 'Showing only the latest 200,000 characters; full evidence is in the recording.';
  }
  stream.content.textContent = stream.text;
}

function connect() {
  source?.close(); clear();
  const params = new URLSearchParams();
  for (const [key, value] of new FormData(form)) if (String(value).trim()) params.set(key, String(value).trim());
  params.set('types', 'stream-open,text,stream-close');
  status.textContent = 'Connecting…';
  source = new EventSource(`/api/v1/live?${params}`);
  source.addEventListener('open', () => { status.textContent = 'Connected. Waiting for live text.'; });
  source.addEventListener('error', () => { status.textContent = 'Feed disconnected or unavailable (authentication or optional live-tap module may be missing). Reconnecting when supported.'; });
  source.addEventListener('reset', () => { clear(); status.textContent = 'Replay cursor expired; text may be incomplete. Use saved replay for complete evidence.'; });
  for (const type of ['stream-open', 'text', 'stream-close']) source.addEventListener(type, receive);
}

form.addEventListener('submit', (event) => { event.preventDefault(); connect(); });
document.querySelector('#disconnect').addEventListener('click', () => { source?.close(); status.textContent = 'Disconnected.'; });
document.querySelector('#clear').addEventListener('click', clear);
window.addEventListener('pagehide', () => source?.close());
connect();
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
