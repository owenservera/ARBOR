import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveBuildRequest, blankSurface } from '../build-composer.mjs';
import { assertBuildPreviewCurrent, committedUiRevision, matchesCommittedUiReadback, buildRequestRoute } from '../build-canvas.mjs';

const compile = (surface, request) => ({ ...resolveBuildRequest({ request, surface }), surface });

test('Wiki navigation is not a UI proposal; legacy fake intents are refused', () => {
  assert.deepEqual(buildRequestRoute('Open the Wiki'), { kind: 'navigate', tab: 'wiki' });
  assert.equal(buildRequestRoute('show ARBOR progress projection').kind, 'unsupported');
  assert.equal(buildRequestRoute('preview an edit').kind, 'unsupported');
  assert.equal(buildRequestRoute('Add a card called Research').kind, 'design');
});

test('approval binds to live surface and refuses stale or altered previews', () => {
  const surface = { ...blankSurface(), revision: 7 };
  const draft = compile(surface, 'Add a card called Research');
  assert.equal(draft.outcome, 'candidate');
  assert.equal(draft.preview.persisted, false);
  assert.equal(surface.tree.children.length, 0);
  assert.doesNotThrow(() => assertBuildPreviewCurrent(draft, surface));
  assert.throws(() => assertBuildPreviewCurrent(draft, null));
  assert.throws(() => assertBuildPreviewCurrent(draft, { ...surface, revision: 8 }));
  assert.throws(() => assertBuildPreviewCurrent(draft, { ...surface, surfaceId: 'other' }));
  const changed = compile(surface, 'Add a card called Other');
  assert.throws(() => assertBuildPreviewCurrent(draft, changed.preview.surface));
  assert.throws(() => assertBuildPreviewCurrent({ ...draft, proposal: changed.proposal }, surface));
});

test('readback predicate requires exact successor revision, identity and proposed content', () => {
  const surface = { ...blankSurface(), revision: 7 };
  const draft = compile(surface, 'Add a card called Research');
  const proof = { surfaceId: surface.surfaceId, parentRevision: 7, committedRevision: 8 };
  const observed = { ...draft.preview.surface, revision: 8 };
  assert.equal(matchesCommittedUiReadback(proof, draft.preview.surface, observed), true);
  for (const wrong of [
    null, surface, { ...observed, revision: 9 }, { ...observed, surfaceId: 'other' },
    { ...surface, revision: 8 }, { ...observed, theme: { ...observed.theme, accent: '#abcdef' } }
  ]) assert.equal(matchesCommittedUiReadback(proof, draft.preview.surface, wrong), false);
  const rename = compile(observed, 'Rename card Research to Projects');
  assert.equal(rename.outcome, 'candidate');
  assert.doesNotThrow(() => assertBuildPreviewCurrent(rename, observed));
  assert.equal(matchesCommittedUiReadback({ ...proof, parentRevision: 8, committedRevision: 9 },
    rename.preview.surface, { ...rename.preview.surface, revision: 9 }), true);
  assert.throws(() => committedUiRevision({ status: 'claimed' }, surface));
  assert.throws(() => committedUiRevision({ status: 'done', result: '{}' }, surface));
});
