# File: harness/test/agents/fake-router.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/agents/fake-router.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1318 B |
| Lines | 24 |
| Hash | ba4b0cef85ae |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fakeRouter | function | 4 | yes | export function fakeRouter({ replyFor = (c) =&gt; `reply ${c.n} from ${c.provider}`, statusFor = () =&gt; &#39;complete&#39;, threadFor = null, hold = false } = {}) { |
| calls | const | 5 | no | const calls = [], waits = [], held = new Map(); |
| n | variable | 6 | no | let n = 0; |
| call | const | 10 | no | const call = { ...req, n: ++n, requestId: &#39;r&#39; + n }; |
| call | const | 16 | no | const call = calls.find((c) =&gt; c.requestId === id); |
| status | const | 18 | no | const status = statusFor(call); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [harness/test/agents/cli.test.mjs](./cli.test.mjs.md) | ./fake-router.mjs |
| [harness/test/agents/fleet.test.mjs](./fleet.test.mjs.md) | ./fake-router.mjs |
| [harness/test/agents/swarm.test.mjs](./swarm.test.mjs.md) | ./fake-router.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Test double for src/interface/router.mjs: ask() returns { requestId }, wait() returns { status, reply }.
// replyFor(call) customises the reply; statusFor(call) customises the status; hold=true makes wait() block
// until release(requestId) is called (used to test one-in-flight-per-agent).
export function fakeRouter({ replyFor = (c) => `reply ${c.n} from ${c.provider}`, statusFor = () => 'complete', threadFor = null, hold = false } = {}) {
  const calls = [], waits = [], held = new Map();
  let n = 0;
  return {
    calls, waits,
    async ask(req) {
      const call = { ...req, n: ++n, requestId: 'r' + n };
      calls.push(call);
      return { requestId: call.requestId, status: 'pending_approval', provider: String(req.provider).split(':')[0] };
    },
    async wait(id) {
      waits.push(id);
      const call = calls.find((c) => c.requestId === id);
      if (hold) await new Promise((resolve) => held.set(id, resolve));
      const status = statusFor(call);
      return { requestId: id, status, ...(status === 'complete' ? { reply: replyFor(call) } : {}), ...(threadFor ? { threadUrl: threadFor(call) } : {}) };
    },
    async result(id) { return { requestId: id, status: held.has(id) ? 'complete' : 'pending_approval' }; },
    release(id) { held.get(id)?.(); },
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
