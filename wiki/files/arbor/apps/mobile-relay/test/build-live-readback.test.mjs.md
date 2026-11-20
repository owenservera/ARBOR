# File: apps/mobile-relay/test/build-live-readback.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/build-live-readback.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5626 B |
| Lines | 84 |
| Hash | 11a44d533cbe |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| compile | function | 7 | no | const compile = (surface, request) =&gt; ({ ...resolveBuildRequest({ request, surface }), surface }); |
| surface | const | 18 | no | const surface = { ...blankSurface(), revision: 7 }; |
| draft | const | 19 | no | const draft = compile(surface, &#39;Add a card called Research&#39;); |
| changed | const | 27 | no | const changed = compile(surface, &#39;Add a card called Other&#39;); |
| surface | const | 33 | no | const surface = { ...blankSurface(), revision: 7 }; |
| draft | const | 34 | no | const draft = compile(surface, &#39;Add a card called Research&#39;); |
| proof | const | 35 | no | const proof = { surfaceId: surface.surfaceId, parentRevision: 7, committedRevision: 8 }; |
| observed | const | 36 | no | const observed = { ...draft.preview.surface, revision: 8 }; |
| rename | const | 42 | no | const rename = compile(observed, &#39;Rename card Research to Projects&#39;); |
| before | const | 52 | no | const before = { ...blankSurface(), revision: 7 }; |
| original | const | 53 | no | const original = compile(before, &#39;Add a card called Research&#39;); |
| committed | const | 54 | no | const committed = { surfaceId: before.surfaceId, parentRevision: 7, committedRevision: 8 }; |
| live | const | 55 | no | const live = { ...original.preview.surface, revision: 8 }; |
| undo | const | 56 | no | const undo = buildUndoProposal({ original, before, committed, live }); |
| surface | const | 72 | no | const surface={...blankSurface(),revision:7}; |
| stable | function | 74 | no | const stable=v=&gt;Array.isArray(v)?v.map(stable):v&amp;&amp;typeof v===&#39;object&#39;?Object.fromEntries(Object.keys(v).sort().map(k=&gt;[k,stable(v[k])])):v; |
| projectionDigest | const | 75 | no | const projectionDigest=digestJson(stable({audience:&#39;phone&#39;,surfaceId:preview.surfaceId,catalogVersion:preview.catalogVersion,theme:preview.surface.theme,tree:preview.surface.tree})); |
| body | const | 76 | no | const body={schema:&#39;vivim.bootstrap-command-worker/1&#39;,action:&#39;apply-proposal&#39;,persisted:true,revision:8,parentRevision:7,surfaceId:surface.surfaceId,previewDigest:preview.previewDigest,projectionDige… |
| ack | function | 77 | no | const ack=result=&gt;({status:&#39;done&#39;,result}); |
| absent | const | 81 | no | const absent={...body};delete absent[key]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../generative-ui/portable-digest.mjs | import | 3 | [apps/mobile-relay/generative-ui/portable-digest.mjs](../generative-ui/portable-digest.mjs.md) |
| ../build-composer.mjs | import | 4 | [apps/mobile-relay/build-composer.mjs](../build-composer.mjs.md) |
| ../build-canvas.mjs | import | 5 | [apps/mobile-relay/build-canvas.mjs](../build-canvas.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { digestJson } from '../generative-ui/portable-digest.mjs';
import { resolveBuildRequest, blankSurface } from '../build-composer.mjs';
import { assertBuildPreviewCurrent, committedUiRevision, matchesCommittedUiReadback, buildRequestRoute, buildUndoProposal } from '../build-canvas.mjs';

const compile = (surface, request) => ({ ...resolveBuildRequest({ request, surface }), surface });

test('Wiki navigation is not a UI proposal; unmatched text reaches semantic interpretation', () => {
  assert.deepEqual(buildRequestRoute('Open the Wiki'), { kind: 'navigate', tab: 'wiki' });
  assert.equal(buildRequestRoute('show ARBOR progress projection').kind, 'design');
  assert.equal(buildRequestRoute('preview an edit').kind, 'design');
  assert.deepEqual(buildRequestRoute('capture a note'),{kind:'navigate',tab:'pocket'});
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

test('Undo compiles exact previous screen as a new Host revision, never an unproved rollback', () => {
  const before = { ...blankSurface(), revision: 7 };
  const original = compile(before, 'Add a card called Research');
  const committed = { surfaceId: before.surfaceId, parentRevision: 7, committedRevision: 8 };
  const live = { ...original.preview.surface, revision: 8 };
  const undo = buildUndoProposal({ original, before, committed, live });
  assert.ok(undo);
  assert.equal(undo.proposal.baseRevision, 8);
  assert.deepEqual(undo.proposal.operations, [{ opId: 'vec.undo.1', type: 'remove', componentId: 'vec.card.research' }]);
  assert.deepEqual(undo.preview.surface, { ...before, revision: 8 });
  assert.equal(undo.preview.persisted, false);
  assert.doesNotThrow(() => assertBuildPreviewCurrent(undo, live));
  assert.equal(matchesCommittedUiReadback({ surfaceId: before.surfaceId, parentRevision: 8, committedRevision: 9 },
    undo.preview.surface, { ...before, revision: 9 }), true);
  for (const stale of [null, before, { ...live, revision: 9 }, { ...before, revision: 8 }]) {
    assert.equal(buildUndoProposal({ original, before, committed, live: stale }), null);
  }
});


test('real preview proof fields must match expected candidate before readback',()=>{
  const surface={...blankSurface(),revision:7};
  const {preview}=compile(surface,'Add a card called Research');
  const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
  const projectionDigest=digestJson(stable({audience:'phone',surfaceId:preview.surfaceId,catalogVersion:preview.catalogVersion,theme:preview.surface.theme,tree:preview.surface.tree}));
  const body={schema:'vivim.bootstrap-command-worker/1',action:'apply-proposal',persisted:true,revision:8,parentRevision:7,surfaceId:surface.surfaceId,previewDigest:preview.previewDigest,projectionDigest,changeId:'chg-test'};
  const ack=result=>({status:'done',result});
  assert.doesNotThrow(()=>committedUiRevision(ack(body),surface,preview));
  for(const key of ['previewDigest','projectionDigest','changeId']){
    assert.throws(()=>committedUiRevision(ack({...body,[key]:'wrong'}),surface,preview));
```

_First 80 of 85 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
