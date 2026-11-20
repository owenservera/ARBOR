import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWikiEditPreview } from '../public/pages/preview.mjs';

// Fixture mirrors the Host wiki read-model shape: { revision, pages: { Page: { sections: { Section: text } } } }.
const wikiState = {
  revision: 7,
  pages: {
    Main: { sections: { Main: 'welcome home' } },
    Handbook: { sections: { Intro: 'hello world', Safety: 'be careful' } }
  }
};

test('known command builds a preview with target, baseRevision, current, proposed and executable:false', () => {
  const preview = buildWikiEditPreview('Change Handbook/Intro to hello there', wikiState);
  assert.deepEqual(preview.target, { page: 'Handbook', section: 'Intro' });
  assert.equal(preview.baseRevision, 7);
  assert.equal(preview.current, 'hello world');
  assert.equal(preview.proposed, 'hello there');
  assert.equal(preview.executable, false);
  assert.ok(!Object.hasOwn(preview, 'refused'));
});

test('unknown target is refused, not synthesized', () => {
  const page = buildWikiEditPreview('Change Nope/Intro to x', wikiState);
  assert.deepEqual(page, { refused: 'unknown target: page "Nope" does not exist' });
  const section = buildWikiEditPreview('Change Handbook/Nope to x', wikiState);
  assert.deepEqual(section, { refused: 'unknown target: section "Nope" does not exist on page "Handbook"' });
});

test('malformed phrase is refused with a reason', () => {
  for (const bad of ['Change Handbook/Intro', 'Handbook/Intro to x', 'delete Handbook/Intro', 'Change Handbook to x', 'Change Handbook/Intro to']) {
    assert.equal(buildWikiEditPreview(bad, wikiState).refused, 'malformed command: expected "Change <Page>/<Section> to <text>"');
  }
  assert.equal(buildWikiEditPreview('', wikiState).refused, 'malformed command: empty');
});

test('preview performs no POST and no fetch', () => {
  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (...args) => { fetchCalls += 1; throw new Error('preview must not fetch: ' + String(args[0])); };
  try {
    buildWikiEditPreview('Change Handbook/Safety to stay careful', wikiState);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});