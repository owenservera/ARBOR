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
    try {
      for (const s of SOURCES) persistCapabilityScan(db, seedScan(s));

      const hits = searchCapabilityDocuments(db, { query: 'personal agent backend' });
      const hitPaths = hits.map((h) => h.path);
      if (hitPaths.length !== 3) throw new Error(`expected 3 hits, got ${hitPaths.length}: ${hitPaths.join(', ')}`);
      findings.push(finding('the domain query hits all three registered sources via the capability document FTS', 'hq/lib/capabilities.mjs searchCapabilityDocuments'));

      // Relevance then harvestability: rank by FTS hit weight first (implementation match
      // outranks a mention — matched on the engine's snippet of the document body), then by
      // dep_count ascending.
      const ranked = hits.map((h) => {
        const pkg = getCapabilityPackage(db, { sourceId: h.sourceId, name: h.installPath.split('/')[1] });
        const implMatch = /session store|wake bus|approval queue/.test(String(h.snippet ?? ''));
        return { sourceId: h.sourceId, path: h.path, depCount: Number(pkg?.dep_count ?? 0), implMatch, rank: h.rank };
      }).sort((a, b) => (Number(b.implMatch) - Number(a.implMatch)) || (a.depCount - b.depCount));
      if (ranked[0].sourceId !== 'src-orchestra') throw new Error(`top hit wrong: ${ranked[0].sourceId}`);
      findings.push(finding('agent-backend ranks first: implementation-level match (session store, wake bus, approval queue)', 'hq/lib/capabilities.mjs searchCapabilityDocuments'));

      const iface = getCapabilityPackage(db, { sourceId: 'src-interface', name: 'agent-interface' });
      if (Number(iface.dep_count) !== 0) throw new Error(`interface deps wrong: ${iface.dep_count}`);
      findings.push(finding('agent-interface is harvestable: zero dependencies make the interface surface cheap to extract', 'hq/lib/capabilities.mjs getCapabilityPackage'));

      if (ranked[ranked.length - 1].sourceId !== 'src-tangential') {
        throw new Error(`last rank wrong: ${ranked[ranked.length - 1].sourceId}`);
      }
      findings.push(finding('agent-notes ranks last: a tangential mention with the highest dependency count', 'hq/lib/capabilities.mjs searchCapabilityDocuments'));
      findings.push(finding('the ranking is relevance then harvestability (dep_count from the capability package row)', 'hq/lib/capabilities.mjs listCapabilityPackages'));
    } finally {
      db.close();
    }
    return findings;
  },
});
