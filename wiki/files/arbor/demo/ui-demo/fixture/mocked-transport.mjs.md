# File: demo/ui-demo/fixture/mocked-transport.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | demo/ui-demo/fixture/mocked-transport.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5922 B |
| Lines | 106 |
| Hash | 7ffd9023ce39 |
| Test | yes |
| Generated | no |
| Component | demo |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RELAY | const | 6 | no | const RELAY = [&#39;/api/relay&#39;, &#39;/mobile/api/relay&#39;]; |
| today | const | 8 | no | const today = { |
| talk | const | 26 | no | const talk = { |
| build | const | 34 | no | const build = { |
| world | const | 41 | no | const world = { |
| me | const | 54 | no | const me = { |
| control | const | 65 | no | const control = { |
| BY_PATH | const | 71 | no | const BY_PATH = { status: today, today, world, me, build, talk, conversations: talk, control }; |
| json | function | 73 | no | const json = (code, value) =&gt; new Response(JSON.stringify(value), { status: code, headers: { &#39;content-type&#39;: &#39;application/json; charset=utf-8&#39;, &#39;cache-control&#39;: &#39;no-store&#39;, &#39;x-vivim-demo&#39;: &#39;mocked-tr… |
| MUTATION | const | 78 | no | const MUTATION = new Set([&#39;POST&#39;, &#39;PUT&#39;, &#39;PATCH&#39;, &#39;DELETE&#39;, &#39;OPTIONS&#39;]); |
| relayResponse | function | 80 | no | function relayResponse(method, path) { |
| actualFetch | const | 87 | no | const actualFetch = globalThis.fetch.bind(globalThis); |
| raw | const | 89 | no | const raw = typeof input === &#39;string&#39; ? input : (input &amp;&amp; input.url != null ? input.url : String(input ?? &#39;&#39;)); |
| url | variable | 90 | no | let url; |
| method | const | 93 | no | const method = String((options &amp;&amp; options.method) \|\| (input &amp;&amp; input.method) \|\| &#39;GET&#39;).toUpperCase(); |
| path | const | 94 | no | const path = new URLSearchParams(url.search).get(&#39;path&#39;) \|\| &#39;&#39;; |
| method | const | 99 | no | const method = String((options &amp;&amp; options.method) \|\| (input &amp;&amp; input.method) \|\| &#39;GET&#39;).toUpperCase(); |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
/* VIVIM UI demo — mocked-transport fixture (backend zero).
   Synthetic records only, derived from the walkthrough spec. No provider accounts,
   no real browser/CDP, no network. Intercepts same-origin product-relay fetch calls.
   Reads return synthetic JSON; every product-API write is refused 405. */

const RELAY = ['/api/relay', '/mobile/api/relay'];

const today = {
  snapshot: {
    live: {
      conversations: [
        { id: 'conv-2', provider: 'anthropic', messages: [{ id: 'm-5', state: 'uncertain', commandId: 'cmd-8' }] },
        { id: 'conv-1', provider: 'openai', model: 'gpt-5', messages: [{ id: 'm-9', state: 'waiting_reply' }] }
      ]
    },
    bootstrap: { progress: { passes: [{ pass: 'palette', status: 'running' }] } },
    bridge: { queued: 1, claimed: 0, done: 3, failed: 1 }
  },
  commands: [
    { id: 'cmd-9', mode: 'relay-chat', text: 'Summarize the intake notes', consumer: 'harness', status: 'failed', updatedAt: '2026-11-13T09:12:00Z' },
    { id: 'cmd-7', mode: 'relay-chat', text: 'Draft the demo outline', consumer: 'harness', status: 'done', updatedAt: '2026-11-13T08:40:00Z' }
  ],
  ctx: { connection: 'Direct to your PC', connectionTone: 'ok', paired: true, pendingSend: false }
};

const talk = {
  conversations: [{ id: 'conv-1', title: 'Demo outline', provider: 'openai', model: 'gpt-5',
    messages: [{ role: 'user', text: 'Draft the demo outline' }, { role: 'assistant', state: 'waiting_reply', text: 'Here is a first outline…' }] }],
  providers: [{ id: 'openai', label: 'OpenAI', signedIn: true }, { id: 'anthropic', label: 'Anthropic', signedIn: true }],
  focusViews: ['Today', 'World', 'Build'],
  rustContext: { state: 'Not loaded · Direct connection only' }
};

const build = {
  composeInput: 'Show a card listing the three demo beats',
  proposal: { id: 'prop-1', title: 'Demo beats card', status: 'done', description: 'Adds a card listing the three demo beats',
    preview: { type: 'card', id: 'c1', title: 'Demo beats', children: [{ type: 'text', props: { value: '1. Pair · 2. Talk · 3. Build' } }] } },
  revision: { surfaceId: 'surf-1', revision: 12, parentRevision: 11, changeId: 'chg-88', status: 'committed' }
};

const world = {
  revision: { surfaceId: 'surf-1', revision: 12, changeId: 'chg-88', parentRevision: 11, status: 'committed',
    tree: { type: 'stack', children: [
      { type: 'card', id: 'c1', props: { title: 'Demo beats', description: 'The three beats of the walkthrough' } },
      { type: 'text', id: 't1', props: { value: '1. Pair · 2. Talk · 3. Build' } },
      { type: 'button', id: 'b1', props: { label: 'Open outline', intent: 'open.outline' } }
    ] } },
  live: { conversations: [{ id: 'conv-1', provider: 'openai', messages: [{ state: 'waiting_reply' }] }] },
  bridge: { queued: 1, claimed: 0, done: 3, failed: 1 },
  bootstrap: { undo: { available: true } },
  commands: [{ id: 'cmd-9', mode: 'relay-chat', text: 'Summarize the intake notes', status: 'queued', updatedAt: '2026-11-13T09:05:00Z' }]
};

const me = {
  personalAgent: { agentId: 'vivim-local-7', scope: 'household', identityAssurance: 'device-bound', initialized: true },
  worldId: 'arbor-home-01',
  ctx: { paired: true, mode: 'direct', deviceStatus: 'granted', scopes: ['chat.send', 'build.propose', 'media.read'] },
  providers: [{ id: 'openai', signedIn: true }, { id: 'anthropic', signedIn: true }, { id: 'gemini', signedIn: false }],
  commands: [
    { id: 'cmd-7', mode: 'relay-chat', text: 'Draft the demo outline', status: 'done', updatedAt: '2026-11-13T08:40:00Z' },
    { id: 'cmd-9', mode: 'relay-chat', text: 'Summarize the intake notes', status: 'failed', updatedAt: '2026-11-13T09:12:00Z' }
  ]
};

const control = {
  controlRequest: 'Set my theme to dusk',
  previewResult: { ok: true, action: 'set-theme', params: { theme: 'dusk' }, receipt: 'pending-approval', note: 'Preview only — nothing changed yet' },
  controlActivity: [{ id: 'dec-3', request: 'Stop all traffic', decision: 'approved', receipt: 'host:rcpt-51', at: '2026-11-13T07:55:00Z' }]
};

const BY_PATH = { status: today, today, world, me, build, talk, conversations: talk, control };

const json = (code, value) => new Response(JSON.stringify(value), {
  status: code,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-vivim-demo': 'mocked-transport' }
});

const MUTATION = new Set(['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);

function relayResponse(method, path) {
```

_First 80 of 107 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
