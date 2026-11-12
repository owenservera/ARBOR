import test from 'node:test';
import assert from 'node:assert/strict';
import { createVecCompiler, VEC_COMPILE_SCHEMA } from '../vec/compiler.mjs';
import { compileVecUiRequest } from '../vec/ui-adapter.mjs';
import { createSurface } from '../generative-ui/catalog.mjs';
import { compileUiProposal } from '../generative-ui/compiler.mjs';

const compiler = () => createVecCompiler({ adapters: { ui: compileVecUiRequest } });
const run = (text, surface = createSurface()) => compiler().compile({ domain: 'ui', text, context: { surface } });
const candidate = (text, surface) => {
  const result = run(text, surface);
  assert.equal(result.outcome, 'candidate', JSON.stringify(result));
  assert.equal(result.schema, VEC_COMPILE_SCHEMA);
  assert.equal(result.authorization, 'none');
  assert.equal(result.executed, false);
  assert.equal(result.persisted, false);
  assert.equal(result.preview.persisted, false);
  assert.equal(result.preview.authorization, 'required');
  return result;
};
const edited = (surface, text) => candidate(text, surface).preview.surface;

test('one VEC compiler separates Wiki, command and UI; unported owners are not executed', () => {
  const c = compiler();
  for (const domain of ['wiki', 'command']) {
    const result = c.compile({ domain, text: 'known', context: {} });
    assert.equal(result.outcome, 'unsupported');
    assert.equal(result.code, 'LEGACY_OWNER_NOT_MIGRATED');
    assert.equal(result.executed, false);
  }
  assert.equal(c.compile({ domain: 'unknown', text: 'known' }).code, 'UNKNOWN_DOMAIN');
  assert.equal(createVecCompiler().compile({ domain: 'ui', text: 'Edit UI' }).legacyOwner, 'vivim.ui-proposal/1');
  assert.equal(c.compile({ domain: 'ui', text: '', context: { surface: createSurface() } }).outcome, 'refused');
});
test('deterministic create-card, heading and plain-text preview without model or Host', () => {
  const s = createSurface();
  const a = candidate('Add a card called Research', s);
  const b = candidate('Add a card called Research', s);
  assert.deepEqual(a.proposal, b.proposal);
  assert.equal(a.preview.previewDigest, b.preview.previewDigest);
  assert.equal(a.preview.surface.tree.children[0].props.title, 'Research');
  assert.equal(candidate('Add a heading saying My work', s).preview.surface.tree.children[0].props.variant, 'heading');
  assert.equal(candidate('Create text named Notes', s).preview.surface.tree.children[0].props.value, 'Notes');
});
test('existing surface supports typed rename/remove/move with exact revision', () => {
  const original = createSurface();
  const withCard = edited(original, 'Add a card called Research');
  assert.equal(edited(withCard, 'Rename card Research to Projects').tree.children[0].props.title, 'Projects');
  const withSecond = edited(withCard, 'Add a card named Today');
  assert.equal(edited(withSecond, 'Move card Today to the top').tree.children[0].props.title, 'Today');
  assert.equal(edited(withSecond, 'Remove card Research').tree.children.length, 1);
  assert.equal(original.tree.children.length, 0, 'pure compiler never mutates source');
});
test('ambiguous names and unknown UI target request clarification rather than guessing', () => {
  let s = edited(createSurface(), 'Add a card called Research');
  s = edited(s, 'Add a card called Research');
  assert.equal(run('Rename card Research to Projects', s).code, 'UI_TARGET_AMBIGUOUS');
  assert.equal(run('Remove card Missing', s).code, 'UI_TARGET_NOT_FOUND');
});
test('complex/not-yet-supported UI grammar returns model-eligible unsupported, no implicit effects', () => {
  assert.equal(run('Create my complete workspace').outcome, 'unsupported');
  assert.equal(run('Add a card called Research and then delete my files').outcome, 'unsupported');
  assert.equal(run('Add a card called Research and also remove Today').outcome, 'unsupported');
  assert.equal(run('Add a card called Research; delete notes').outcome, 'unsupported');
  assert.equal(run('Every morning move my cards').outcome, 'unsupported');
  assert.equal(run('List my provider chats').outcome, 'unsupported');
});
test('unsafe proposal payloads and extra fields are rejected by canonical compiler', () => {
  assert.equal(run('Add a card called <script>alert(1)</script>').outcome, 'refused');
  assert.equal(run('Add a card called https://evil.invalid').outcome, 'refused');
  assert.equal(run('Add a heading called ' + 'x'.repeat(90)).outcome, 'refused');
  const valid = candidate('Add a card called Research');
  const stale = { ...valid.proposal, baseRevision: 5 };
  assert.throws(() => compileUiProposal({ proposal: stale, surface: createSurface() }), /UI_REJECTED/);
  assert.throws(() => compileUiProposal({ proposal: { ...valid.proposal, code: 'do bad' }, surface: createSurface() }), /UI_REJECTED/);
});
test('screen-invisible PC-private branches cannot be selected', () => {
  const s = createSurface();
  s.tree.children.push({ id: 'private', type: 'card', props: { title: 'Private' }, visibility: 'pc-private', children: [] });
  assert.equal(run('Remove card Private', s).outcome, 'clarification_required');
  assert.notEqual(run('Add a card called Public', s).outcome, 'candidate', 'phone preview cannot silently include private branch');
});
test('caller cannot grant execution from custom adapter output', () => {
  const malicious = createVecCompiler({ adapters: {
    wiki: () => ({ outcome: 'candidate', authorization: 'yes', persisted: true, executed: true, code: 'DEMO' })
  } });
  const out = malicious.compile({ domain: 'wiki', text: 'show wiki' });
  assert.equal(out.authorization, 'none');
  assert.equal(out.persisted, false);
  assert.equal(out.executed, false);
  assert.equal(out.product, 'wiki-projection');
});
test('unsupported or malformed inputs never become executable plans', () => {
  assert.equal(run('Delete everything').outcome, 'unsupported');
  assert.equal(run('Add a card called A\nB').outcome, 'refused');
  assert.equal(compiler().compile({ domain: 'ui', text: 'Add a card called A', context: { bogus: 'no surface' } }).outcome, 'refused');
  assert.throws(() => createVecCompiler({ adapters: { ui: null } }), /INVALID_ADAPTERS/);
});
