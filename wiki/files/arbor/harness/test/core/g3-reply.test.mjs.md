# File: harness/test/core/g3-reply.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/core/g3-reply.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3668 B |
| Lines | 70 |
| Hash | a855763b6f12 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dom | const | 7 | no | const dom = &#39;Here is code:\\n```js\\nconst x = 1;\\n```\\nand more:\\n```ts\\nconst y: string = \\&quot;hi\\&quot;;\\n```&#39;; |
| blocks | const | 8 | no | const blocks = extractCodeBlocks(dom); |
| blocks | const | 20 | no | const blocks = extractCodeBlocks(&#39;```\\nraw\\n```&#39;); |
| updates | const | 52 | no | const updates = []; |
| journal | const | 53 | no | const journal = { read: async () =&gt; ({ boundary: { assistantTurns: 0 } }), update: async (_, patch) =&gt; updates.push(patch) }; |
| page | const | 54 | no | const page = { evaluate: async () =&gt; ({ text: &#39;Here is code:&#39;, streaming: false, count: 1, codeBlocks: &#39;const x = 1;&#39; }) }; |
| reply | const | 55 | no | const reply = await readReply({ page, provider: {}, journal, requestId: &#39;x&#39;, timeoutMs: 0, stableSamples: 1 }); |
| updates | const | 64 | no | const updates = []; |
| journal | const | 65 | no | const journal = { read: async () =&gt; ({ boundary: { assistantTurns: 0 } }), update: async (_, patch) =&gt; updates.push(patch) }; |
| page | const | 66 | no | const page = { evaluate: async () =&gt; ({ text: &#39;The answer is&#39;, streaming: false, count: 1 }) }; |
| reply | const | 67 | no | const reply = await readReply({ page, provider: {}, journal, requestId: &#39;x&#39;, timeoutMs: 0, stableSamples: 1 }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/core/reply.mjs | import | 3 | [harness/src/core/reply.mjs](../../src/core/reply.mjs.md) |
| ../../src/core/journal.mjs | import | 4 | [harness/src/core/journal.mjs](../../src/core/journal.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

````javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readReply, extractCodeBlocks, detectTruncation, detectContinueStyle, hasReplyText } from '../../src/core/reply.mjs';
import { digestPayload } from '../../src/core/journal.mjs';

test('extractCodeBlocks pulls fenced code blocks from DOM text', () => {
  const dom = 'Here is code:\n```js\nconst x = 1;\n```\nand more:\n```ts\nconst y: string = \"hi\";\n```';
  const blocks = extractCodeBlocks(dom);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].lang, 'js'); assert.equal(blocks[0].code, 'const x = 1;');
  assert.equal(blocks[1].lang, 'ts'); assert.equal(blocks[1].code, 'const y: string = "hi";');
});

test('extractCodeBlocks returns empty array when none present', () => {
  assert.deepEqual(extractCodeBlocks('plain text no blocks'), []);
  assert.deepEqual(extractCodeBlocks(''), []);
});

test('extractCodeBlocks defaults unmarked fences to lang text', () => {
  const blocks = extractCodeBlocks('```\nraw\n```');
  assert.equal(blocks[0].lang, 'text'); assert.equal(blocks[0].code, 'raw');
});

test('detectTruncation flags mid-sentence and continuation tails', () => {
  assert.equal(detectTruncation('The answer is 42'), null);
  assert.equal(detectTruncation('The answer is'), 'truncated');
  assert.equal(detectTruncation('And then,'), 'truncated');
  assert.equal(detectTruncation('Because'), 'truncated');
  assert.equal(detectTruncation('More to come…'), 'truncated');
  assert.equal(detectTruncation('Wait...'), 'truncated');
  assert.equal(detectTruncation(''), null);
  assert.equal(detectTruncation(null), null);
});

test('detectContinueStyle flags continue/open-ended replies', () => {
  assert.equal(detectContinueStyle('continue'), 'continue-style');
  assert.equal(detectContinueStyle('Go on'), 'continue-style');
  assert.equal(detectContinueStyle('carry on please'), 'continue-style');
  assert.equal(detectContinueStyle('The answer is 42'), null);
  assert.equal(detectContinueStyle(''), null);
  assert.equal(detectContinueStyle(null), null);
});

test('hasReplyText requires real text', () => {
  assert.equal(hasReplyText('answer'), true);
  assert.equal(hasReplyText(' \t\n'), false);
  assert.equal(hasReplyText(''), false);
  assert.equal(hasReplyText(null), false);
});

test('readReply captures codeBlocks alongside reply text', async () => {
  const updates = [];
  const journal = { read: async () => ({ boundary: { assistantTurns: 0 } }), update: async (_, patch) => updates.push(patch) };
  const page = { evaluate: async () => ({ text: 'Here is code:', streaming: false, count: 1, codeBlocks: 'const x = 1;' }) };
  const reply = await readReply({ page, provider: {}, journal, requestId: 'x', timeoutMs: 0, stableSamples: 1 });
  assert.equal(reply.complete, true);
  assert.equal(reply.text, 'Here is code:\n\n---code-block\n\nconst x = 1;');
  assert.equal(reply.codeBlocks, 'const x = 1;');
  assert.equal(reply.digest, digestPayload(reply.text));
  assert.deepEqual(updates, [{ replyDigest: digestPayload(reply.text) }]);
});

test('readReply truncation detection marks truncated stable replies', async () => {
  const updates = [];
  const journal = { read: async () => ({ boundary: { assistantTurns: 0 } }), update: async (_, patch) => updates.push(patch) };
  const page = { evaluate: async () => ({ text: 'The answer is', streaming: false, count: 1 }) };
  const reply = await readReply({ page, provider: {}, journal, requestId: 'x', timeoutMs: 0, stableSamples: 1 });
  assert.equal(reply.complete, true);
  assert.equal(reply.text, 'The answer is');
});
````

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
