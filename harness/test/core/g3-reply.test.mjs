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
