# File: harness/test/core/reply-error.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/core/reply-error.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2646 B |
| Lines | 38 |
| Hash | d741422c8041 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| rec | const | 5 | no | const rec = { boundary:{ assistantTurns:0 } }; const ups = []; |
| journal | const | 6 | no | const journal = { read: async () =&gt; rec, update: async (_, u) =&gt; ups.push(u) }; |
| page | const | 7 | no | const page = { evaluate: async () =&gt; ({ text:&#39;&#39;, streaming:false, count:0, error:&#39;Model is currently at capacity&#39; }) }; |
| r | const | 8 | no | const r = await readReply({ page, provider:{}, journal, requestId:&#39;x&#39;, timeoutMs:5000 }); |
| updates | const | 14 | no | const updates = []; |
| journal | const | 15 | no | const journal = { read: async () =&gt; ({ boundary: { assistantTurns: 0 } }), update: async (_, patch) =&gt; updates.push(patch) }; |
| page | const | 16 | no | const page = { evaluate: async () =&gt; ({ text, streaming: false, count: 1 }) }; |
| reply | const | 17 | no | const reply = await readReply({ page, provider: {}, journal, requestId: &#39;x&#39;, timeoutMs: 0, stableSamples: 1 }); |
| updates | const | 22 | no | const updates = []; |
| journal | const | 23 | no | const journal = { read: async () =&gt; ({ boundary: { assistantTurns: 0 } }), update: async (_, patch) =&gt; updates.push(patch) }; |
| page | const | 24 | no | const page = { evaluate: async () =&gt; ({ text: &#39; \\n&#39;, streaming: false, count: 1, error: &#39;capacity&#39; }) }; |
| reply | const | 25 | no | const reply = await readReply({ page, provider: {}, journal, requestId: &#39;x&#39;, timeoutMs: 0, stableSamples: 1 }); |
| updates | const | 31 | no | const updates = []; |
| journal | const | 32 | no | const journal = { read: async () =&gt; ({ boundary: { assistantTurns: 0 } }), update: async (_, patch) =&gt; updates.push(patch) }; |
| text | const | 33 | no | const text = &#39; answer\\n&#39;; |
| page | const | 34 | no | const page = { evaluate: async () =&gt; ({ text, streaming: false, count: 1 }) }; |
| reply | const | 35 | no | const reply = await readReply({ page, provider: {}, journal, requestId: &#39;x&#39;, timeoutMs: 0, stableSamples: 1 }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| ../../src/core/reply.mjs | import | 2 | [harness/src/core/reply.mjs](../../src/core/reply.mjs.md) |
| ../../src/core/journal.mjs | import | 3 | [harness/src/core/journal.mjs](../../src/core/journal.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test'; import assert from 'node:assert/strict';
import { readReply } from '../../src/core/reply.mjs';
import { digestPayload } from '../../src/core/journal.mjs';
test('readReply stops on a provider error text with no new reply', async () => {
  const rec = { boundary:{ assistantTurns:0 } }; const ups = [];
  const journal = { read: async () => rec, update: async (_, u) => ups.push(u) };
  const page = { evaluate: async () => ({ text:'', streaming:false, count:0, error:'Model is currently at capacity' }) };
  const r = await readReply({ page, provider:{}, journal, requestId:'x', timeoutMs:5000 });
  assert.equal(r.error, 'Model is currently at capacity'); assert.equal(r.complete, false);
  assert.equal(ups[0].reason, 'PROVIDER_ERROR');
});

for (const text of ['', ' \t\n\u00a0']) test(`empty reply ${JSON.stringify(text)} is not complete or digested`, async () => {
  const updates = [];
  const journal = { read: async () => ({ boundary: { assistantTurns: 0 } }), update: async (_, patch) => updates.push(patch) };
  const page = { evaluate: async () => ({ text, streaming: false, count: 1 }) };
  const reply = await readReply({ page, provider: {}, journal, requestId: 'x', timeoutMs: 0, stableSamples: 1 });
  assert.equal(reply.complete, false); assert.equal(reply.digest, null); assert.deepEqual(updates, []);
});

test('whitespace does not hide a provider error', async () => {
  const updates = [];
  const journal = { read: async () => ({ boundary: { assistantTurns: 0 } }), update: async (_, patch) => updates.push(patch) };
  const page = { evaluate: async () => ({ text: ' \n', streaming: false, count: 1, error: 'capacity' }) };
  const reply = await readReply({ page, provider: {}, journal, requestId: 'x', timeoutMs: 0, stableSamples: 1 });
  assert.equal(reply.error, 'capacity'); assert.equal(reply.complete, false); assert.equal(reply.digest, null);
  assert.deepEqual(updates, [{ reason: 'PROVIDER_ERROR' }]);
});

test('nonempty reply preserves its original text and digest', async () => {
  const updates = [];
  const journal = { read: async () => ({ boundary: { assistantTurns: 0 } }), update: async (_, patch) => updates.push(patch) };
  const text = '  answer\n';
  const page = { evaluate: async () => ({ text, streaming: false, count: 1 }) };
  const reply = await readReply({ page, provider: {}, journal, requestId: 'x', timeoutMs: 0, stableSamples: 1 });
  assert.equal(reply.complete, true); assert.equal(reply.text, text); assert.equal(reply.digest, digestPayload(text));
  assert.deepEqual(updates, [{ replyDigest: digestPayload(text) }]);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
