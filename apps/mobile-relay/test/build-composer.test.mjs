import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDesignPrompt, extractObject, previewReply, failureText, blankSurface, SUGGESTIONS } from '../build-composer.mjs';
import { welcomeCards, learning } from '../welcome.mjs';

const proposal = (surface, extra = {}) => ({
  schema: 'vivim.ui-proposal/1', surfaceId: surface.surfaceId, baseRevision: surface.revision,
  operations: [{ opId: 'op1', type: 'insert', parentId: 'root', component: { id: 'research', type: 'card', props: { title: 'Research', description: 'Questions and answers in one place.' } } }],
  explanation: 'Adds a Research card to your home screen.', assumptions: [], unknowns: ['Which topics you follow'], ...extra
});

test('the design prompt carries the exact schema, revision and a bounded context, and fits one message', () => {
  const surface = blankSurface();
  const prompt = buildDesignPrompt({ request: 'I need help researching', surface });
  assert.match(prompt, /vivim\.ui-proposal\/1/);
  assert.match(prompt, /surfaceId \("my-space"\), baseRevision \(0\)/);
  assert.match(prompt, /"userRequest":"I need help researching"/);
  assert.ok(prompt.length < 4000, 'must fit the 4000-character send limit, was ' + prompt.length);
  assert.throws(() => buildDesignPrompt({ request: '   ' }), /Say what/);
  assert.throws(() => buildDesignPrompt({ request: 'x'.repeat(401) }), /under 400/);
  for (const s of SUGGESTIONS) assert.doesNotThrow(() => buildDesignPrompt({ request: s }));
});

test('extractObject tolerates fences and prose, and braces inside strings', () => {
  assert.deepEqual(extractObject('Sure!\n```json\n{"a":1}\n```\nHope it helps'), { a: 1 });
  assert.deepEqual(extractObject('{"t":"a } b { c","n":{"x":2}} trailing'), { t: 'a } b { c', n: { x: 2 } });
  assert.deepEqual(extractObject('note {not json} then {"ok":true}'), { ok: true });
  assert.equal(extractObject('no object here'), null);
  assert.equal(extractObject('[1,2,3]'), null);
});

test('a valid reply previews as a draft; nothing is applied', () => {
  const surface = blankSurface();
  const out = previewReply({ reply: 'Here you go:\n```json\n' + JSON.stringify(proposal(surface)) + '\n```', surface });
  assert.equal(out.ok, true);
  assert.equal(out.summary.changes, 1);
  assert.deepEqual(out.summary.unknowns, ['Which topics you follow']);
  assert.equal(out.preview.persisted, false);
  assert.equal(out.preview.authorization, 'required');
});

test('hostile, stale or unreadable replies fail closed with a plain reason', () => {
  const surface = blankSurface();
  assert.equal(previewReply({ reply: 'I cannot do that', surface }).ok, false);
  const stale = previewReply({ reply: JSON.stringify(proposal(surface, { baseRevision: 7 })), surface });
  assert.equal(stale.ok, false); assert.match(stale.reason, /out of date/);
  const html = proposal(surface); html.operations[0].component.props.description = '<script>alert(1)</script>';
  assert.equal(previewReply({ reply: JSON.stringify(html), surface }).ok, false);
  const link = proposal(surface); link.operations[0].component.props.description = 'see https://evil.example';
  assert.equal(previewReply({ reply: JSON.stringify(link), surface }).ok, false);
  const unknown = proposal(surface); unknown.operations[0].component.type = 'script';
  assert.equal(previewReply({ reply: JSON.stringify(unknown), surface }).ok, false);
  const extra = proposal(surface, { onclick: 'x()' });
  assert.equal(previewReply({ reply: JSON.stringify(extra), surface }).ok, false);
});

test('failures are explained in the owner\'s words', () => {
  assert.match(failureText('DRAFT_PRESENT'), /unsent draft/);
  assert.match(failureText('UNSUPPORTED_STUDIO_TARGET: Studio mode supports default ChatGPT text only'), /ChatGPT/);
  assert.match(failureText('something odd'), /unchanged/);
});

test('welcome cards report real learning progress and never claim more than is known', () => {
  assert.equal(learning(null).state, 'idle');
  assert.match(welcomeCards(null).at(-1).title, /neutral/);
  const running = { progress: { passes: [{ pass: 'F02', status: 'complete' }, { pass: 'F01', status: 'running' }] } };
  assert.equal(learning(running).state, 'running');
  assert.match(welcomeCards(running).at(-1).body, /1 of 2/);
  const done = { progress: { passes: [{ pass: 'F02', status: 'complete' }, { pass: 'F01', status: 'complete' }] }, cards: [{ id: 'c1', title: 'VIVIM project' }] };
  assert.equal(learning(done).state, 'done');
  assert.match(welcomeCards(done).at(-1).body, /VIVIM project/);
  assert.equal(welcomeCards(null).length, 4);
});
