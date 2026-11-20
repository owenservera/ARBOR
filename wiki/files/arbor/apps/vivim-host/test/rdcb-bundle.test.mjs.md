# File: apps/vivim-host/test/rdcb-bundle.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/rdcb-bundle.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7345 B |
| Lines | 151 |
| Hash | 09ad182ed903 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sha | function | 19 | no | const sha = (text) =&gt; createHash(&#39;sha256&#39;).update(text).digest(&#39;hex&#39;); |
| header | const | 23 | no | const header = &#39;/* @vlang:surface demo/widget.js\\n @vlang:action: */\\n&#39;; |
| body | const | 24 | no | const body = &#39;export const version = 1;\\n&#39;; |
| sourceText | const | 25 | no | const sourceText = header + body; |
| sourceDigest | const | 26 | no | const sourceDigest = sha(sourceText); |
| RELPATH | const | 27 | no | const RELPATH = &#39;apps/vivim-host/public/demo/widget.js&#39;; |
| surfaceRecord | const | 29 | no | const surfaceRecord = { |
| catalogIds | const | 39 | no | const catalogIds = new Set([&#39;catalog.list&#39;, &#39;catalog.show&#39;]); |
| catalogMeta | const | 40 | no | const catalogMeta = { schema: &#39;vivim.control-action-catalog/1&#39;, version: 9 }; |
| excerptText | const | 41 | no | const excerptText = header.slice(0, -1); // verbatim header without trailing newline |
| bundle | const | 52 | no | const bundle = composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta }); |
| bundle | const | 73 | no | const bundle = composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta }); |
| alteredSource | const | 75 | no | const alteredSource = sourceText + &#39;// appended\\n&#39;; |
| altered | const | 76 | no | const altered = composeBundle({ relPath: RELPATH, bytes: alteredSource, surface: { ...surfaceRecord, sourceDigest: sha(alteredSource) }, catalogIds, |
| a | const | 88 | no | const a = composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta }); |
| b | const | 89 | no | const b = composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta, now: &#39;2026-01-01T00:00:00.000Z&#39; }); |
| first | const | 97 | no | const first = JSON.stringify(composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta })); |
| second | const | 98 | no | const second = JSON.stringify(composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta })); |
| fresh | const | 103 | no | const fresh = composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta }); |
| stale | const | 107 | no | const stale = composeBundle({ relPath: RELPATH, bytes: sourceText, surface: { ...surfaceRecord, sourceDigest: sha(&#39;some-other-bytes&#39;) }, catalogIds, |
| bundle | const | 119 | no | const bundle = composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta }); |
| capacity | const | 120 | no | const capacity = BUDGET_MAX_TOKENS - BUDGET_RESERVED - CAPACITY_SLACK; |
| badSurface | const | 130 | no | const badSurface = { ...surfaceRecord, actionIds: [&#39;catalog.unknown&#39;] }; |
| registry | const | 141 | no | const registry = { byPath: new Map([[RELPATH, surfaceRecord]]) }; |
| catalog | const | 142 | no | const catalog = { ids: catalogIds, schema: catalogMeta.schema, version: catalogMeta.version }; |
| bundle | const | 143 | no | const bundle = composeBundleFromRegistry({ relPath: RELPATH, bytes: sourceText, registry, catalog }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:crypto | import | 3 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  composeBundle,
  composeBundleFromRegistry,
  surfaceHeaderExcerpt,
  sha256Hex,
  estimateTokens,
  BUNDLE_SCHEMA,
  INHERITS,
  BUNDLE_AUTHORITY,
  PINNED_NOW,
  BUDGET_MAX_TOKENS,
  BUDGET_RESERVED,
  CAPACITY_SLACK
} from '../control/rdcb-bundle.mjs';

const sha = (text) => createHash('sha256').update(text).digest('hex');

// A minimal @vlang:surface header followed by body source, matching the
// seeded corpus convention (control/rdcb-gen.mjs).
const header = '/* @vlang:surface demo/widget.js\n   @vlang:action: */\n';
const body = 'export const version = 1;\n';
const sourceText = header + body;
const sourceDigest = sha(sourceText);
const RELPATH = 'apps/vivim-host/public/demo/widget.js';

const surfaceRecord = {
  path: RELPATH,
  surface: 'demo widget surface',
  commentIds: ['widget-id'],
  actionIds: [],
  schema: 'vivim.file-surface/1',
  generatorVersion: 'file-surface-gen/1 stage-a',
  recordCount: 1,
  sourceDigest
};
const catalogIds = new Set(['catalog.list', 'catalog.show']);
const catalogMeta = { schema: 'vivim.control-action-catalog/1', version: 9 };
const excerptText = header.slice(0, -1); // verbatim header without trailing newline

test('surfaceHeaderExcerpt returns the verbatim header with 1-based lines', () => {
  const { lines, text } = surfaceHeaderExcerpt(sourceText);
  assert.deepEqual(lines, [1, 2]);
  assert.equal(text, excerptText);
  assert.ok(text.startsWith('/* @vlang:surface'));
  assert.ok(text.endsWith('*/'));
});

test('composeBundle conforms to the vivim.rdcb/1 contract', () => {
  const bundle = composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta });
  assert.equal(bundle.schema, BUNDLE_SCHEMA);
  assert.equal(bundle.inherits, INHERITS);
  assert.equal(bundle.protocol, 'hq.dcb-protocol/1');
  assert.equal(bundle.authority, BUNDLE_AUTHORITY);
  assert.equal(bundle.trigger, 'edit.pre');
  assert.equal(bundle.project, 'arbor');
  assert.equal(bundle.status, 'fresh');
  assert.equal(bundle.sources.length, 1);
  assert.equal(bundle.sources[0].path, RELPATH);
  assert.equal(bundle.sources[0].lang, 'javascript');
  assert.equal(bundle.sources[0].authority, 'project_observed');
  assert.equal(bundle.reprogramming.vlangExecution, false);
  assert.deepEqual(bundle.symbols, []);
  assert.deepEqual(bundle.decisions, []);
  assert.deepEqual(bundle.canon, []);
  assert.deepEqual(bundle.sessions, []);
  assert.deepEqual(bundle.reprogramming.surfaceDrift, []);
});

test('bundle is pinned to the source revision: sha256 tracks exact source bytes', () => {
  const bundle = composeBundle({ relPath: RELPATH, bytes: sourceText, surface: surfaceRecord, catalogIds, catalogMeta });
  assert.equal(bundle.sources[0].sha256, sha(sourceText));
  const alteredSource = sourceText + '// appended\n';
  const altered = composeBundle({
    relPath: RELPATH,
    bytes: alteredSource,
    surface: { ...surfaceRecord, sourceDigest: sha(alteredSource) },
    catalogIds,
```

_First 80 of 152 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
