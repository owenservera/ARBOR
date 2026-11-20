# File: apps/vivim-host/test/preview.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/preview.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2214 B |
| Lines | 48 |
| Hash | b6b331e61827 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| wikiState | const | 6 | no | const wikiState = { |
| preview | const | 15 | no | const preview = buildWikiEditPreview(&#39;Change Handbook/Intro to hello there&#39;, wikiState); |
| page | const | 25 | no | const page = buildWikiEditPreview(&#39;Change Nope/Intro to x&#39;, wikiState); |
| section | const | 27 | no | const section = buildWikiEditPreview(&#39;Change Handbook/Nope to x&#39;, wikiState); |
| fetchCalls | variable | 39 | no | let fetchCalls = 0; |
| originalFetch | const | 40 | no | const originalFetch = globalThis.fetch; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../public/pages/preview.mjs | import | 3 | [apps/vivim-host/public/pages/preview.mjs](../public/pages/preview.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
