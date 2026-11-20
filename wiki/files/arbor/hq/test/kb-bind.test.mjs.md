# File: hq/test/kb-bind.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/kb-bind.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7062 B |
| Lines | 157 |
| Hash | 3eae4f32c9c2 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| row | function | 21 | no | const row = (kbId, targetKind, target, extra = {}) =&gt; ({ kbId, title: `${kbId} title`, target, targetKind, |
| bindingOf | function | 31 | no | function bindingOf(bindings) { |
| read | function | 40 | no | const read = (db, id) =&gt; db.prepare(&#39;SELECT * FROM semantic_id WHERE id = ?&#39;).get(id) ?? null; |
| loaded | const | 43 | no | const loaded = loadKbBinding(); |
| binding | const | 46 | no | const binding = loaded.binding; |
| ids | const | 50 | no | const ids = binding.bindings.map((entry) =&gt; entry.kbId); |
| db | const | 61 | no | const db = openMemoryDb(); |
| binding | const | 62 | no | const binding = bindingOf([ row(&#39;KB-ACTION&#39;, &#39;canonical&#39;, &#39;grammar.action&#39;), row(&#39;KB-FEATURE&#39;, &#39;extension&#39;, extensionTarget(&#39;KB-FEATURE&#39;)), row(&#39;KB-PERSON&#39;, &#39;unbound&#39;, extensionTarget(&#39;KB-PERSON&#39;)), … |
| first | const | 68 | no | const first = bindKbTypes(db, binding); |
| inserted | const | 71 | no | const inserted = read(db, &#39;hq.ext.kb-feature&#39;); |
| second | const | 83 | no | const second = bindKbTypes(db, binding); |
| db | const | 89 | no | const db = openMemoryDb(); |
| res | const | 95 | no | const res = bindKbTypes(db, bindingOf([row(&#39;KB-ACTION&#39;, &#39;canonical&#39;, &#39;grammar.action&#39;)])); |
| untouched | const | 101 | no | const untouched = read(db, &#39;grammar.action&#39;); |
| db | const | 107 | no | const db = openMemoryDb(); |
| res | const | 113 | no | const res = bindKbTypes(db, bindingOf([row(&#39;KB-FEATURE&#39;, &#39;extension&#39;, extensionTarget(&#39;KB-FEATURE&#39;))])); |
| db | const | 120 | no | const db = openMemoryDb(); |
| binding | const | 126 | no | const binding = bindingOf([row(&#39;KB-BOGUS&#39;, &#39;canonical&#39;, &#39;hq.component/1&#39;)]); |
| refused | const | 127 | no | const refused = bindKbTypes(db, binding); |
| confirmed | const | 131 | no | const confirmed = bindKbTypes(db, binding, { ownerConfirmed: true }); |
| db | const | 136 | no | const db = openMemoryDb(); |
| missing | const | 137 | no | const missing = bindKbTypes(db, bindingOf([row(&#39;KB-NOPE&#39;, &#39;canonical&#39;, &#39;grammar.nope&#39;)])); |
| bad | const | 140 | no | const bad = bindingOf([row(&#39;KB-FEATURE&#39;, &#39;extension&#39;, extensionTarget(&#39;KB-FEATURE&#39;)), row(&#39;KB-FEATURE&#39;, &#39;extension&#39;, extensionTarget(&#39;KB-FEATURE&#39;))]); |
| res | const | 142 | no | const res = bindKbTypes(db, bad); |
| db | const | 149 | no | const db = openMemoryDb(); |
| loaded | const | 150 | no | const loaded = loadKbBinding(); |
| res | const | 151 | no | const res = bindKbTypes(db, loaded.binding); |
| again | const | 154 | no | const again = bindKbTypes(db, loaded.binding); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 12 | external |
| node:assert/strict | import | 13 | external |
| ../lib/schema.mjs | import | 15 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/kb-bind.mjs | import | 16 | [hq/lib/kb-bind.mjs](../lib/kb-bind.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Conformance tests for the KB binding layer: one target per KB |
| 5 | owner | hq | — | hq |
| 6 | task | — | — | kb-binding-v1 |
| 7 | invariant | — | — | The database is in-memory or a temp fixture; the active |
| 9 | see | — | hq/lib/kb-bind.mjs | hq/lib/kb-bind.mjs |
| 10 | see | — | docs/KB-BINDING-MAP.md | docs/KB-BINDING-MAP.md |

## Excerpt

```javascript
/**
 * @hq:context Conformance tests for the KB binding layer: one target per KB
 *   id, namespaced extension rows, canonical verification, explicit unbound
 *   entries and idempotent re-binding.
 * @hq:owner hq
 * @hq:task kb-binding-v1
 * @hq:invariant The database is in-memory or a temp fixture; the active
 *   `.hq/index.db` is never touched.
 * @hq:see hq/lib/kb-bind.mjs
 * @hq:see docs/KB-BINDING-MAP.md
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { openMemoryDb } from '../lib/schema.mjs';
import {
  EXTENSION_PREFIX, KB_BINDING_SCHEMA, bindingCounts, bindKbTypes,
  extensionTarget, loadKbBinding, validateKbBinding,
} from '../lib/kb-bind.mjs';

const row = (kbId, targetKind, target, extra = {}) => ({
  kbId,
  title: `${kbId} title`,
  target,
  targetKind,
  family: 'system',
  reason: `${kbId} reason`,
  ...extra,
});

function bindingOf(bindings) {
  return {
    schema: KB_BINDING_SCHEMA,
    version: 1,
    generatedFrom: { path: 'vivim-web-harness:docs/knowledge/kb-types.v1.json', sha256: 'a'.repeat(64) },
    bindings,
  };
}

const read = (db, id) => db.prepare('SELECT * FROM semantic_id WHERE id = ?').get(id) ?? null;

test('the checked-in binding covers every KB type exactly once', () => {
  const loaded = loadKbBinding();
  assert.deepEqual(loaded.errors, []);
  assert.equal(loaded.ok, true);
  const binding = loaded.binding;
  assert.equal(binding.schema, KB_BINDING_SCHEMA);
  assert.equal(binding.version, 1);
  assert.match(binding.generatedFrom.sha256, /^[0-9a-f]{64}$/);
  const ids = binding.bindings.map((entry) => entry.kbId);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 44);
  assert.deepEqual(bindingCounts(binding), { total: 44, canonical: 6, extension: 33, unbound: 5 });
  for (const entry of binding.bindings) {
    if (entry.targetKind === 'extension') assert.equal(entry.target, extensionTarget(entry.kbId));
    if (entry.targetKind === 'unbound') assert.ok(entry.reason.length > 20);
  }
});

test('first bind inserts extensions, verifies canonical ids and skips unbound', () => {
  const db = openMemoryDb();
  const binding = bindingOf([
    row('KB-ACTION', 'canonical', 'grammar.action'),
    row('KB-FEATURE', 'extension', extensionTarget('KB-FEATURE')),
    row('KB-PERSON', 'unbound', extensionTarget('KB-PERSON')),
  ]);

  const first = bindKbTypes(db, binding);
  assert.deepEqual(first, { inserted: 1, existing: 1, conflicts: [] });

  const inserted = read(db, 'hq.ext.kb-feature');
  assert.equal(inserted.kind, 'extension');
  assert.equal(inserted.name, 'KB-FEATURE');
  assert.equal(inserted.version, '1');
  assert.equal(inserted.label, 'KB-FEATURE title');
  assert.equal(inserted.description, 'KB-FEATURE reason');
  assert.equal(inserted.status, 'provisional');
  assert.equal(inserted.authority, 'project_observed');
  assert.equal(inserted.provenance, 'system');
  assert.equal(read(db, 'hq.ext.kb-person'), null);
```

_First 80 of 158 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
