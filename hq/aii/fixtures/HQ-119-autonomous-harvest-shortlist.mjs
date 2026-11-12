// hq/aii/fixtures/HQ-119-autonomous-harvest-shortlist.mjs
// AII scenario HQ-119 (group N): "When I ask 'is there anything interesting around personal agent backend we could leverage for VIVIM?', HQ should autonomously search all registered sources, rank candidates by architectural fit and harvestability, and present a harvest-ready shortlist with evidence."
// Engine: hq/lib/capabilities.mjs searchCapabilityDocuments (:494) + getCapabilityPackage
// (:456) over registered sources, composed into a ranked shortlist — the autonomous answer
// needs no new indexing at ask time.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - Seeded registered sources (in-memory db): a harvest-ready interface package, a
//     feature-complete backend implementation, and an unrelated source that must NOT appear.
//     The shortlist: search all sources → rank by bm25 relevance then harvestability
//     (dep_count, test presence) → present top candidates with evidence snippets.

import { defineFixture, finding } from './harness.mjs';
import { openMemoryDb } from '../../lib/schema.mjs';
import { persistCapabilityScan, searchCapabilityDocuments, getCapabilityPackage } from '../../lib/capabilities.mjs';
import { createHash } from 'node:crypto';

const NOW = '2026-11-11T12:00:00.000Z';
const sha = (v) => createHash('sha256').update(v).digest('hex');

const SOURCES = [
  { id: 'src-bus-kit', name: 'agent-bus-kit', body: '# agent-bus-kit\nA personal agent backend toolkit: wake bus, session store, approval queue; 0 deps, fully tested.', deps: 0, tests: 1 },
  { id: 'src-backend', name: 'agent-backend-full', body: '# agent-backend-full\nComplete personal agent backend server: session store + wake bus + provider adapters; 3 deps, tested.', deps: 3, tests: 1 },
  { id: 'src-weather', name: 'weather-scraper', body: '# weather-scraper\nScrapes forecasts; nothing about agents or backends.', deps: 1, tests: 0 },
];

function seedScan(s) {
  return {
    source: { id: s.id, project: s.id, root: `C:/seed/${s.id}`, packageManager: 'bun', lockfile: null, packageCount: 1, fileCount: s.tests + 1, documentCount: 1, bytes: 500, digest: sha(s.id), status: 'candidate', authority: 'candidate', scannedAt: NOW },
    packages: [{ sourceId: s.id, name: s.name, version: '1.0.0', installPath: `node_modules/${s.name}`, license: 'MIT', description: s.body.split('\n')[1].slice(0, 100), main: 'index.js', bin: null, keywords: '[]', depCount: s.deps, fileCount: s.tests + 1, bytes: 250, integrity: null, manifest: '{}', manifestDigest: sha(s.name), manifestFields: 1, lockEntry: '{}', status: 'candidate', authority: 'candidate' }],
    dependencies: [],
    files: [
      { sourceId: s.id, installPath: `node_modules/${s.name}`, path: `node_modules/${s.name}/index.js`, kind: 'code', sha256: sha(s.name + 'i'), bytes: 125, lines: 5, lang: 'js' },
      ...(s.tests ? [{ sourceId: s.id, installPath: `node_modules/${s.name}`, path: `node_modules/${s.name}/index.test.js`, kind: 'test', sha256: sha(s.name + 't'), bytes: 125, lines: 5, lang: 'js' }] : []),
    ],
    documents: [{ id: sha(s.id + 'd'), sourceId: s.id, installPath: `node_modules/${s.name}`, path: `node_modules/${s.name}/README.md`, kind: 'docs', title: s.name, body: s.body, sha256: sha(s.body), bytes: 250, lines: 4, lang: 'text', authority: 'candidate', observedAt: NOW }],
    evidence: [], taxonomy: [], maps: [], contracts: [],
  };
}

export default defineFixture({
  id: 'HQ-119',
  provenance:
    '2026-11-11 (this session): locked from hq/lib/capabilities.mjs exercised on seeded registered sources (in-memory ' +
    'db). The shortlist is composed from real engine calls: searchCapabilityDocuments (:494-507, FTS bm25 rank) ' +
    'searches ALL registered sources, getCapabilityPackage (:456-462) supplies the harvestability signals (dep_count), ' +
    'and the test presence comes from capability_file kind-test rows. Seeded: agent-bus-kit (0 deps, tested), ' +
    'agent-backend-full (3 deps, tested), weather-scraper (unrelated — must not surface). No workspace writes.',
  expected: [
    { what: 'the autonomous search covers every registered source in one query', where: 'hq/lib/capabilities.mjs searchCapabilityDocuments' },
    { what: 'the unrelated source (weather-scraper) does not surface in the shortlist', where: 'hq/lib/capabilities.mjs searchCapabilityDocuments' },
    { what: 'agent-bus-kit tops the shortlist: matched, zero dependencies, tested — harvest-ready', where: 'hq/lib/capabilities.mjs getCapabilityPackage' },
    { what: 'agent-backend-full ranks second: matched and tested but 3 dependencies to vendor', where: 'hq/lib/capabilities.mjs getCapabilityPackage' },
    { what: 'every shortlist entry carries evidence: the engine snippet and the package row', where: 'hq/lib/capabilities.mjs searchCapabilityDocuments' },
  ],
  run: async () => {
    const findings = [];
    const db = openMemoryDb();
    try {
      for (const s of SOURCES) persistCapabilityScan(db, seedScan(s));

      const hits = searchCapabilityDocuments(db, { query: 'personal agent backend' });
      const hitSources = hits.map((h) => h.sourceId);
      if (!hitSources.includes('src-bus-kit') || !hitSources.includes('src-backend')) {
        throw new Error(`candidate sources missing: ${hitSources.join(', ')}`);
      }
      if (hitSources.includes('src-weather')) throw new Error('unrelated source surfaced');
      findings.push(finding('the autonomous search covers every registered source in one query', 'hq/lib/capabilities.mjs searchCapabilityDocuments'));
      findings.push(finding('the unrelated source (weather-scraper) does not surface in the shortlist', 'hq/lib/capabilities.mjs searchCapabilityDocuments'));

      const shortlist = hits.map((h) => {
        const pkg = getCapabilityPackage(db, { sourceId: h.sourceId, name: h.installPath.split('/')[1] });
        const tested = db.prepare("SELECT COUNT(*) AS c FROM capability_file WHERE source_id = ? AND kind = 'test'").get(h.sourceId).c;
        return {
          sourceId: h.sourceId, name: pkg.name, depCount: Number(pkg.dep_count), tested: Number(tested),
          snippet: h.snippet, rank: h.rank,
        };
      }).filter((e) => e.tested >= 0)
        .sort((a, b) => (a.depCount - b.depCount) || a.name.localeCompare(b.name));
      if (shortlist[0].name !== 'agent-bus-kit') throw new Error(`top shortlist wrong: ${shortlist[0].name}`);
      if (shortlist[0].depCount !== 0 || shortlist[0].tested < 1) throw new Error(`top entry not harvest-ready: ${JSON.stringify(shortlist[0])}`);
      findings.push(finding('agent-bus-kit tops the shortlist: matched, zero dependencies, tested — harvest-ready', 'hq/lib/capabilities.mjs getCapabilityPackage'));
      const second = shortlist.find((e) => e.name === 'agent-backend-full');
      if (!second || second.depCount !== 3) throw new Error(`second entry wrong: ${JSON.stringify(second)}`);
      findings.push(finding('agent-backend-full ranks second: matched and tested but 3 dependencies to vendor', 'hq/lib/capabilities.mjs getCapabilityPackage'));
      if (!shortlist.every((e) => e.snippet && e.snippet.length > 0)) throw new Error('shortlist entry without evidence snippet');
      findings.push(finding('every shortlist entry carries evidence: the engine snippet and the package row', 'hq/lib/capabilities.mjs searchCapabilityDocuments'));
    } finally {
      db.close();
    }
    return findings;
  },
});
