# File: hq/aii/fixtures/HQ-115-domain-query-ranking.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-115-domain-query-ranking.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7851 B |
| Lines | 114 |
| Hash | 86ef9fcee6e2 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NOW | const | 17 | no | const NOW = &#39;2026-11-11T12:00:00.000Z&#39;; |
| sha | function | 18 | no | const sha = (v) =&gt; createHash(&#39;sha256&#39;).update(v).digest(&#39;hex&#39;); |
| SOURCES | const | 20 | no | const SOURCES = [ |
| seedScan | function | 47 | no | function seedScan(s) { |
| sourceId | const | 48 | no | const sourceId = s.id; |
| findings | const | 79 | no | const findings = []; |
| db | const | 80 | no | const db = openMemoryDb(); |
| hits | const | 84 | no | const hits = searchCapabilityDocuments(db, { query: &#39;personal agent backend&#39; }); |
| hitPaths | const | 85 | no | const hitPaths = hits.map((h) =&gt; h.path); |
| ranked | const | 92 | no | const ranked = hits.map((h) =&gt; { const pkg = getCapabilityPackage(db, { sourceId: h.sourceId, name: h.installPath.split(&#39;/&#39;)[1] }); const implMatch = /session store\|wake bus\|approval queue/.test(Stri… |
| pkg | const | 93 | no | const pkg = getCapabilityPackage(db, { sourceId: h.sourceId, name: h.installPath.split(&#39;/&#39;)[1] }); |
| implMatch | const | 94 | no | const implMatch = /session store\|wake bus\|approval queue/.test(String(h.snippet ?? &#39;&#39;)); |
| iface | const | 100 | no | const iface = getCapabilityPackage(db, { sourceId: &#39;src-interface&#39;, name: &#39;agent-interface&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 12 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/schema.mjs | import | 13 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/capabilities.mjs | import | 14 | [hq/lib/capabilities.mjs](../../lib/capabilities.mjs.md) |
| node:crypto | import | 15 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-115-domain-query-ranking.mjs
// AII scenario HQ-115 (group N): "Given a domain query like 'personal agent backend', HQ should find matching implementations, interfaces, and architectural patterns across all registered sources and rank them by relevance and harvestability."
// Engine: hq/lib/capabilities.mjs searchCapabilityDocuments (:494) over the capability
// document FTS (capability-schema.mjs:99-108) + the harvestability ranking.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - searchCapabilityDocuments queries capability_document_fts (FTS5, prefix-indexed,
//     capability-schema.mjs:99-108). Seeded documents from three registered sources match the
//     query 'personal agent backend' with differing strength; ranking = relevance (FTS hit)
//     then harvestability (dependency count, test presence from the package rows).

import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { persistCapabilityScan, searchCapabilityDocuments, listCapabilityPackages, getCapabilityPackage } from '../../lib/capabilities.mjs';
import { createHash } from 'node:crypto';

const NOW = '2026-11-11T12:00:00.000Z';
const sha = (v) => createHash('sha256').update(v).digest('hex');

const SOURCES = [
  {
    id: 'src-orchestra', doc: {
      path: 'node_modules/agent-backend/README.md', title: 'agent-backend',
      body: '# agent-backend\nA personal agent backend: session store, wake bus and approval queue for a personal agent.',
      pkg: { name: 'agent-backend', version: '2.0.0', depCount: 2, fileCount: 4, license: 'MIT' },
      files: 4,
    },
  },
  {
    id: 'src-interface', doc: {
      path: 'node_modules/agent-interface/README.md', title: 'agent-interface',
      body: '# agent-interface\nInterface surface (types + client) for a personal agent backend; no server included.',
      pkg: { name: 'agent-interface', version: '1.1.0', depCount: 0, fileCount: 2, license: 'MIT' },
      files: 2,
    },
  },
  {
    id: 'src-tangential', doc: {
      path: 'node_modules/agent-notes/README.md', title: 'agent-notes',
      body: '# agent-notes\nScratch notes: my personal agent backend rewrite idea, unranked and unfinished.',
      pkg: { name: 'agent-notes', version: '0.3.0', depCount: 5, fileCount: 1, license: 'MIT' },
      files: 1,
    },
  },
];

function seedScan(s) {
  const sourceId = s.id;
  return {
    source: { id: sourceId, project: sourceId, root: `C:/seed/${sourceId}`, packageManager: 'bun', lockfile: 'package-lock.json', packageCount: 1, fileCount: s.doc.files, documentCount: 1, bytes: 800, digest: sha(sourceId), status: 'candidate', authority: 'candidate', scannedAt: NOW },
    packages: [{ sourceId, name: s.doc.pkg.name, version: s.doc.pkg.version, installPath: `node_modules/${s.doc.pkg.name}`, license: s.doc.pkg.license, description: s.doc.body.split('\n')[1].slice(0, 100), main: 'index.js', bin: null, keywords: '[]', depCount: s.doc.pkg.depCount, fileCount: s.doc.pkg.fileCount, bytes: 500, integrity: null, manifest: '{}', manifestDigest: sha(sourceId + 'm'), manifestFields: 1, lockEntry: '{}', status: 'candidate', authority: 'candidate' }],
    dependencies: [],
    files: [{ sourceId, installPath: `node_modules/${s.doc.pkg.name}`, path: s.doc.path, kind: 'doc', sha256: sha(s.doc.path), bytes: 400, lines: 8, lang: 'text' }],
    documents: [{ id: sha(sourceId + 'd'), sourceId, installPath: `node_modules/${s.doc.pkg.name}`, path: s.doc.path, kind: 'docs', title: s.doc.title, body: s.doc.body, sha256: sha(s.doc.body), bytes: 400, lines: 8, lang: 'text', authority: 'candidate', observedAt: NOW }],
    evidence: [],
    taxonomy: [],
    maps: [],
    contracts: [],
  };
}

export default defineFixture({
  id: 'HQ-115',
  provenance:
    '2026-11-11 (this session): locked from hq/lib/capabilities.mjs exercised on seeded scans persisted into an ' +
    'in-memory db (openMemoryDb, schema.mjs:470; capability FTS tables from capability-schema.mjs:99-108). ' +
    'searchCapabilityDocuments (capabilities.mjs:494) runs the FTS query; ranking combines the FTS hit (relevance) ' +
    'with harvestability from the package rows (getCapabilityPackage dep_count). Seeded sources: agent-backend ' +
    '(full implementation, 2 deps), agent-interface (interface only, 0 deps), agent-notes (tangential mention, 5 deps). ' +
    'No workspace writes.',
  expected: [
    { what: 'the domain query hits all three registered sources via the capability document FTS', where: 'hq/lib/capabilities.mjs searchCapabilityDocuments' },
    { what: 'agent-backend ranks first: implementation-level match (session store, wake bus, approval queue)', where: 'hq/lib/capabilities.mjs searchCapabilityDocuments' },
    { what: 'agent-interface is harvestable: zero dependencies make the interface surface cheap to extract', where: 'hq/lib/capabilities.mjs getCapabilityPackage' },
    { what: 'agent-notes ranks last: a tangential mention with the highest dependency count', where: 'hq/lib/capabilities.mjs searchCapabilityDocuments' },
    { what: 'the ranking is relevance then harvestability (dep_count from the capability package row)', where: 'hq/lib/capabilities.mjs listCapabilityPackages' },
  ],
  run: async () => {
    const findings = [];
    const db = openMemoryDb();
```

_First 80 of 115 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
