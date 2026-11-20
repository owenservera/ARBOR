# File: hq/test/semantic-source-context.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/semantic-source-context.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8334 B |
| Lines | 133 |
| Hash | b8471249b624 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 13 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-semantic-source-&#39;)); |
| project | const | 14 | no | const project = join(root, &#39;source&#39;); |
| dataDir | const | 15 | no | const dataDir = join(root, &#39;data&#39;); |
| id | const | 16 | no | const id = &#39;hq.source.digest@1&#39;; |
| legacy | const | 17 | no | const legacy = &#39;hq.source.legacy@1&#39;; |
| unknown | const | 18 | no | const unknown = &#39;hq.source.unknown@1&#39;; |
| file | const | 20 | no | const file = join(project, &#39;util.mjs&#39;); |
| original | const | 22 | no | const original = readFileSync(new URL(&#39;../lib/util.mjs&#39;, import.meta.url), &#39;utf8&#39;); |
| annotation | const | 23 | no | const annotation = &#39;// @hq:capability &#39; + id; |
| source | const | 24 | no | const source = original.replace(&#39;export function sha256(value)&#39;, annotation + &#39;\\nexport function sha256(value)&#39;) |
| line | const | 32 | no | const line = source.split(&#39;\\n&#39;).indexOf(annotation) + 1; |
| db | function | 37 | no | let db; |
| open | function | 38 | no | const open = () =&gt; openDb(join(dataDir, &#39;.hq&#39;, &#39;index.db&#39;)); |
| hq | const | 40 | no | const hq = createDevIntelligence({ dataDir, approvedRoots: [project], mode: &#39;diagnostic&#39; }); |
| denied | const | 47 | no | const denied = createDevIntelligence({ dataDir, approvedRoots: [project], mode: &#39;host&#39;, actorId: &#39;owner&#39;, sessionId: &#39;test&#39;, authorize: () =&gt; false, }); |
| firstIndex | const | 52 | no | const firstIndex=hq.index(); |
| firstAnchor | const | 55 | no | const firstAnchor=firstIndex.projects[0].semanticChanges.find(c=&gt;c.semanticId===id&amp;&amp;c.annotationKind===&#39;capability&#39;); |
| results | const | 57 | no | const results = hq.search({ query: id, project: &#39;actual-hq&#39; }).results; |
| bundle | const | 68 | no | const bundle = hq.context({ task: &#39;inspect &#39; + id, project: &#39;actual-hq&#39;, budgetTokens: 3000, maxFiles: 1 }); |
| reference | const | 73 | no | const reference=bundle.sources[0].semanticReferences.find(r=&gt;r.semanticId===id&amp;&amp;r.annotationKind===&#39;capability&#39;); |
| surface | const | 77 | no | const surface=hq.fileSurface({project:&#39;actual-hq&#39;,path:&#39;util.mjs&#39;}).files[0]; |
| live | const | 78 | no | const live=surface.annotations.find(a=&gt;a.semanticId===id&amp;&amp;a.kind===&#39;capability&#39;); |
| query | function | 88 | no | const query = query =&gt; searchSemanticReferences(db, { query, project: &#39;actual-hq&#39; }).results; |
| unchanged | const | 101 | no | const unchanged=hq.index().projects[0]; |
| edited | const | 112 | no | const edited = source + &#39;\\nexport const revision = 2;\\n&#39;; |
| editedIndex | const | 115 | no | const editedIndex=hq.index(); |
| delta | const | 117 | no | const delta=editedIndex.projects[0].semanticChanges.find(c=&gt;c.anchorId===firstAnchor.anchorId); |
| changed | const | 121 | no | const changed = edited.replace(annotation, &#39;// removed annotation&#39;).replace(&#39;// @hq:contract &#39; + id, &#39;// removed contract&#39;); |
| removed | const | 123 | no | const removed=hq.index().projects[0].semanticChanges; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../lib/arbor-service.mjs | import | 6 | [hq/lib/arbor-service.mjs](../lib/arbor-service.mjs.md) |
| ../lib/schema.mjs | import | 7 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/search.mjs | import | 8 | [hq/lib/search.mjs](../lib/search.mjs.md) |
| ../lib/semantic-registry.mjs | import | 9 | [hq/lib/semantic-registry.mjs](../lib/semantic-registry.mjs.md) |
| ../lib/util.mjs | import | 10 | [hq/lib/util.mjs](../lib/util.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDevIntelligence } from '../lib/arbor-service.mjs';
import { openDb } from '../lib/schema.mjs';
import { searchSemanticReferences } from '../lib/search.mjs';
import { registerSemanticId, deprecateSemanticId, getSemanticId } from '../lib/semantic-registry.mjs';
import { sha256 } from '../lib/util.mjs';

test('real approved source -> HQ index -> semantic search -> verified context', () => {
  const root = mkdtempSync(join(tmpdir(), 'hq-semantic-source-'));
  const project = join(root, 'source');
  const dataDir = join(root, 'data');
  const id = 'hq.source.digest@1';
  const legacy = 'hq.source.legacy@1';
  const unknown = 'hq.source.unknown@1';
  mkdirSync(project);
  const file = join(project, 'util.mjs');
  // Annotate real executable HQ source, not a synthetic semantic store.
  const original = readFileSync(new URL('../lib/util.mjs', import.meta.url), 'utf8');
  const annotation = '// @hq:capability ' + id;
  const source = original.replace('export function sha256(value)', annotation + '\nexport function sha256(value)')
    + '\n// @hq:context ordinary v1 tag\n'
    + '// @hq:capability ' + unknown + '\n'
    + '// @hq:capability ' + legacy + '\n'
    + '// @hq:contract ' + id + '\n'
    + '// @hq:capability duplicate.sample@1 @hq:capability duplicate.sample@1\n'
    + '// @hq:capability malformed\n'
    + 'const fake = "// @hq:capability fake.sample@1";\n';
  const line = source.split('\n').indexOf(annotation) + 1;
  writeFileSync(file, source);
  writeFileSync(join(project, 'incidental.mjs'), 'export const mention = "' + id + '";\n');
  mkdirSync(join(project, '.env-local'));
  writeFileSync(join(project, '.env-local', 'private.mjs'), annotation);
  let db;
  const open = () => openDb(join(dataDir, '.hq', 'index.db'));
  try {
    const hq = createDevIntelligence({ dataDir, approvedRoots: [project], mode: 'diagnostic' });
    hq.registerSource({ name: 'actual-hq', path: project });
    db = open();
    assert.equal(registerSemanticId(db, { id, kind: 'capability' }).ok, true);
    assert.equal(registerSemanticId(db, { id: legacy, kind: 'capability' }).ok, true);
    assert.equal(deprecateSemanticId(db, legacy, { ownerConfirmed: true }).ok, true);
    db.close(); db = null;
    const denied = createDevIntelligence({
      dataDir, approvedRoots: [project], mode: 'host', actorId: 'owner', sessionId: 'test',
      authorize: () => false,
    });
    assert.throws(() => denied.index(), /HQ_HOST_PERMISSION_DENIED/);
    const firstIndex=hq.index();
    assert.equal(firstIndex.errors.length, 0);
    assert.equal(firstIndex.projects[0].semanticChangeComplete,true);
    const firstAnchor=firstIndex.projects[0].semanticChanges.find(c=>c.semanticId===id&&c.annotationKind==='capability');
    assert.equal(firstAnchor.change,'added');
    const results = hq.search({ query: id, project: 'actual-hq' }).results;
    assert.equal(results[0].path, 'util.mjs');
    assert.equal(results[0].line, line);
    assert.equal(results[0].semanticReferences[0].semanticId, id);
    assert.equal(results[0].semanticReferences[0].resolution, 'proposed');
    assert.equal(results[0].semanticReferences[0].contentHash, sha256(source));
    assert.equal(results[0].semanticReferences[0].semanticAnchor.anchorId,firstAnchor.anchorId);
    assert.equal(results[0].semanticReferences[0].semanticAnchor.fingerprint,firstAnchor.fingerprint);
    assert.ok(results[0].snippet.includes('export function sha256'));
    assert.ok(results.some(hit => hit.path === 'incidental.mjs'));
    assert.equal(hq.search({ query: id, project: 'missing' }).results.length, 0);
    const bundle = hq.context({ task: 'inspect ' + id, project: 'actual-hq', budgetTokens: 3000, maxFiles: 1 });
    assert.equal(bundle.sources[0].path, 'util.mjs');
    assert.equal(bundle.sources[0].contentHash, sha256(source));
    assert.ok(bundle.fragment.includes('export function sha256'));
    assert.equal(hq.verifyContext(bundle).valid, true);
    const reference=bundle.sources[0].semanticReferences.find(r=>r.semanticId===id&&r.annotationKind==='capability');
    assert.equal(reference.evidence.claim,'annotation-occurrence');
    assert.equal(reference.evidence.planningEligible,false);
    assert.equal(reference.evidence.assurance,'proposed');
    const surface=hq.fileSurface({project:'actual-hq',path:'util.mjs'}).files[0];
    const live=surface.annotations.find(a=>a.semanticId===id&&a.kind==='capability');
    assert.equal(live.semanticAnchor.anchorId,reference.semanticAnchor.anchorId);
    assert.equal(live.evidence.assurance,'verified');
```

_First 80 of 134 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
