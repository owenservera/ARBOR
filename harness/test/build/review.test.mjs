import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_DIFF_CHARS, reviewPrompt, parseVerdict, gate, reviewComment, truncateDiff } from '../../src/build/review.mjs';

test('MAX_DIFF_CHARS is 60000', () => { assert.equal(MAX_DIFF_CHARS, 60000); });

test('prompt contains task, author, checklist, diff and verdict instruction', () => {
  const p = reviewPrompt({ task: 'add foo', diff: '+const foo = 1;', author: 'claude:opus-5.5' });
  assert.match(p, /TASK: add foo/);
  assert.match(p, /claude:opus-5\.5/);
  assert.match(p, /\+const foo = 1;/);
  for (const word of ['Secrets', 'loopback', 'standing approval', 'send-once', 'journal', 'PROTECTED', 'Destructive', 'assert']) assert.ok(p.includes(word), word);
  assert.match(p, /VERDICT: APPROVE/);
  assert.match(p, /VERDICT: BLOCK/);
  assert.doesNotMatch(p, /diff truncated/);
});

test('long diff is truncated with marker and BLOCK instruction', () => {
  const diff = 'x'.repeat(MAX_DIFF_CHARS + 123);
  const p = reviewPrompt({ task: 't', diff, author: 'a:b' });
  assert.match(p, /\[diff truncated: 123 chars omitted\]/);
  assert.match(p, /MUST answer BLOCK/);
  assert.ok(!p.includes('x'.repeat(MAX_DIFF_CHARS + 1)));
  assert.equal(truncateDiff('abc').omitted, 0);
});

test('parse plain approve with findings', () => {
  const r = parseVerdict('Looks fine.\n- tests assert output\n* no network\n• no secrets\nVERDICT: APPROVE\n');
  assert.equal(r.verdict, 'approve');
  assert.deepEqual(r.findings, ['tests assert output', 'no network', 'no secrets']);
});

test('parse bold verdict', () => {
  assert.equal(parseVerdict('- bad\n**VERDICT: BLOCK**').verdict, 'block');
  assert.equal(parseVerdict('- ok\n**VERDICT:** APPROVE').verdict, 'approve');
});

test('parse lowercase verdict', () => {
  assert.equal(parseVerdict('verdict: approve').verdict, 'approve');
  assert.equal(parseVerdict('  Verdict: block  ').verdict, 'block');
});

test('missing verdict is unknown', () => {
  const r = parseVerdict('- something\nI think it is ok');
  assert.equal(r.verdict, 'unknown');
  assert.deepEqual(r.findings, ['something']);
  assert.equal(parseVerdict('').verdict, 'unknown');
  assert.equal(parseVerdict('The VERDICT: APPROVE is mine').verdict, 'unknown');
});

test('last verdict line wins', () => {
  assert.equal(parseVerdict('VERDICT: APPROVE\n- wait, leaks token\nVERDICT: BLOCK').verdict, 'block');
  const r = parseVerdict('VERDICT: BLOCK\n- fixed on reread\nVERDICT: APPROVE');
  assert.equal(r.verdict, 'approve');
  assert.deepEqual(r.findings, ['fixed on reread']);
});

test('verdict must be the final line; findings capped at 20', () => {
  assert.equal(parseVerdict('- a\nVERDICT: APPROVE\nActually, critical issue').verdict, 'unknown');
  assert.deepEqual(parseVerdict('- a\nVERDICT: BLOCK\n\n').findings, ['a']);
  const many = Array.from({ length: 30 }, (_, i) => `- f${i}`).join('\n') + '\nVERDICT: BLOCK';
  const r = parseVerdict(many);
  assert.equal(r.findings.length, 20);
  assert.equal(r.findings[0], 'f0');
});

test('gate truth table', () => {
  assert.deepEqual(gate({ verdict: 'approve', testsOk: true }), { merge: true, reason: 'OK' });
  assert.deepEqual(gate({ verdict: 'block', testsOk: true }), { merge: false, reason: 'REVIEW_BLOCK' });
  assert.deepEqual(gate({ verdict: 'unknown', testsOk: true }), { merge: false, reason: 'REVIEW_UNKNOWN' });
  assert.deepEqual(gate({ verdict: 'APPROVE', testsOk: true }), { merge: false, reason: 'REVIEW_UNKNOWN' });
  for (const verdict of ['approve', 'block', 'unknown']) {
    assert.deepEqual(gate({ verdict, testsOk: false }), { merge: false, reason: 'TESTS_RED' });
    assert.equal(gate({ verdict, testsOk: 'true' }).merge, false);
    assert.equal(gate({ verdict, testsOk: undefined }).merge, false);
  }
});

test('review comment contents', () => {
  const c = reviewComment({ reviewer: { provider: 'openai', model: { id: 'gpt-x' } }, verdict: 'block', findings: ['leaks token', 'no asserts'], threadUrl: 'https://chat.example/t/1', requestId: 'req-42' });
  assert.match(c, /`openai:gpt-x`/);
  assert.match(c, /BLOCK/);
  assert.match(c, /- leaks token/);
  assert.match(c, /- no asserts/);
  assert.match(c, /https:\/\/chat\.example\/t\/1/);
  assert.match(c, /req-42/);
  const c2 = reviewComment({ reviewer: 'gemini:pro', verdict: 'approve', findings: [], threadUrl: 'u', requestId: 'r' });
  assert.match(c2, /`gemini:pro`/);
  assert.match(c2, /APPROVE/);
  assert.match(c2, /No findings listed/);
  assert.match(reviewComment({ reviewer: 'x:y', verdict: 'weird' }), /UNKNOWN/);
});

test('diff is fenced longer than any backtick run; unbulleted findings fall back to lines', async () => {
  const { fence } = await import('../../src/build/review.mjs');
  assert.equal(fence('a ``` b'), '````');
  assert.equal(fence('plain'), '```');
  const p = reviewPrompt({ task: 't', diff: '+x = `a`', author: 'a:b' });
  assert.match(p, /```diff\n\+x = `a`\n```/);
  assert.deepEqual(parseVerdict('[BLOCKER] bad regex\n\nSecrets: none\nVERDICT: BLOCK').findings, ['[BLOCKER] bad regex', 'Secrets: none']);
});

test('prompt scopes the network rule and flags composer escape artifacts', () => {
  const p = reviewPrompt({ task: 't', diff: '+a', author: 'a:b' });
  assert.match(p, /git\/gh calls to GitHub/);
  assert.match(p, /transport artifacts/);
});

test('severity: only cited BLOCKERs block; round cap -> NEEDS_OWNER', async () => {
  const { classifyFindings, severityGate } = await import('../../src/build/review.mjs');
  const c = classifyFindings(['[BLOCKER] src/core/send.mjs:93 — bad', '[BLOCKER] parser broken', '[ADVISORY] add tests', 'BLOCKER `src/a.mjs:1`']);
  assert.deepEqual(c.blockers.map(b => [b.path, b.line]), [['src/core/send.mjs', 93]]);
  assert.equal(c.advisory.length, 3);
  assert.deepEqual(severityGate({ testsOk: true, verdict: 'block', verified: [] }), { merge: true, reason: 'OK' });
  assert.equal(severityGate({ testsOk: true, verdict: 'approve', verified: [1] }).reason, 'REVIEW_BLOCK');
  assert.equal(severityGate({ testsOk: true, verdict: 'approve', verified: [1], round: 3 }).reason, 'NEEDS_OWNER');
  assert.equal(severityGate({ testsOk: false, verdict: 'approve' }).reason, 'TESTS_RED');
  assert.equal(severityGate({ testsOk: true, verdict: 'unknown' }).reason, 'REVIEW_UNKNOWN');
});
