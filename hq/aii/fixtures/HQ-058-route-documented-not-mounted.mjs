// hq/aii/fixtures/HQ-058-route-documented-not-mounted.mjs
// AII scenario HQ-058 (group G): "Why does the documentation say this route is live when no server mounts it?"
// Engine: hq/lib/indexer.mjs (the gap slice's engine) — the index extracts files/symbols/imports
// only (indexer.mjs:100-126 inserts files and imports rows) and has NO route-registration model.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - Explicit zero re-verified: grep for 'route|mount|server|endpoint' over hq/lib/indexer.mjs
//     returns no route-extraction surface; schema.mjs CREATE TABLE list (schema.mjs:11-443)
//     has no routes table.
//   - The documented-route-vs-mount join is exercised on a SEEDED server file and doc (in the
//     fixture): a server registering 2 of 3 documented routes; the doc claims all 3 live.
//     Findings = the route id with no mount + the claiming doc, with the extraction rule the
//     indexer-side join belongs in.

import { defineFixture, finding, runHq } from './harness.mjs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// Seeded server entry: mounts /healthz and /agents, never mounts /runs/stream.
const SERVER_FILE = [
  "import { createServer } from 'node:http';",
  'const server = createServer();',
  "server.on('request', (req, res) => {",
  "  if (req.url === '/healthz') { res.end('ok'); return; }",
  "  if (req.url === '/agents') { res.end('[]'); return; }",
  '});',
  'server.listen(0);',
].join('\n');

// Seeded doc claiming all three routes are live.
const DOC_TEXT = [
  '# API routes',
  '',
  '- `GET /healthz` — live',
  '- `GET /agents` — live',
  '- `GET /runs/stream` — live',
].join('\n');

// The route-extraction + doc join the gap names (inline; the indexer has no such model).
function extractMountedRoutes(serverText) {
  const mounted = [];
  for (const m of serverText.matchAll(/req\.url === '([^']+)'/g)) mounted.push(m[1]);
  return mounted;
}
function extractDocumentedRoutes(docText) {
  const out = [];
  for (const m of docText.matchAll(/`GET (\/[a-z/.-]+)` — live/g)) out.push(m[1]);
  return out;
}

export default defineFixture({
  id: 'HQ-058',
  provenance:
    "2026-11-11 (this session): locked from the engine named by hq/aii/assessments/lane-6.json HQ-058 gap.engine " +
    '(hq/lib/indexer.mjs). Explicit zero re-verified this session: bun -e grep for route|mount|server|endpoint over ' +
    'hq/lib/indexer.mjs finds no route-extraction surface, and schema.mjs (schema.mjs:11-443) creates no routes table — ' +
    'the indexer stores files/imports rows only (indexer.mjs:100-126). The documented-route-vs-mount join is exercised ' +
    'on a seeded server file (2 mounted routes) and a seeded doc claiming 3 live routes; the unmounted route and the ' +
    'claiming doc are the pinned findings. No workspace writes.',
  expected: [
    { what: 'the indexer extracts files/symbols/imports only — no route-registration model exists (indexer.mjs:100-126)', where: 'hq/lib/indexer.mjs' },
    { what: 'the schema creates no routes table (schema.mjs:11-443) — route mounts are not indexed', where: 'hq/lib/schema.mjs' },
    { what: 'the doc claims GET /runs/stream is live but no server file mounts it — the doc route with no mount', where: 'hq/lib/indexer.mjs (proposed join)' },
    { what: 'mounted routes /healthz and /agents are extracted from the server file request handler', where: 'hq/lib/indexer.mjs (proposed join)' },
    { what: 'the claiming doc is named as the source of the stale route claim', where: 'hq/lib/indexer.mjs (proposed join)' },
  ],
  run: async () => {
    const findings = [];

    // Explicit zeros on the real engine and schema.
    const indexerText = readFileSync(join(ROOT, 'hq', 'lib', 'indexer.mjs'), 'utf8');
    if (/route|mount|endpoint/i.test(indexerText.replace(/\/\*[\s\S]*?\*\//g, ''))) {
      throw new Error('indexer.mjs unexpectedly mentions route mounting — refresh this fixture');
    }
    findings.push(finding('the indexer extracts files/symbols/imports only — no route-registration model exists (indexer.mjs:100-126)', 'hq/lib/indexer.mjs'));

    const schemaText = readFileSync(join(ROOT, 'hq', 'lib', 'schema.mjs'), 'utf8');
    if (/CREATE TABLE IF NOT EXISTS (routes|http_routes|server_routes)\b/i.test(schemaText)) {
      throw new Error('schema.mjs unexpectedly creates a routes table — refresh this fixture');
    }
    findings.push(finding('the schema creates no routes table (schema.mjs:11-443) — route mounts are not indexed', 'hq/lib/schema.mjs'));

    // The seeded doc-vs-mount join.
    const mounted = extractMountedRoutes(SERVER_FILE).sort();
    const documented = extractDocumentedRoutes(DOC_TEXT);
    if (mounted.join('|') !== '/agents|/healthz') throw new Error(`unexpected mounts: ${mounted.join(', ')}`);
    const documentedSorted = [...documented].sort();
    if (documentedSorted.join('|') !== '/agents|/healthz|/runs/stream') throw new Error(`unexpected documented: ${documentedSorted.join(', ')}`);
    const unmounted = [...documented].sort().filter((r) => !mounted.includes(r));
    if (unmounted.join('|') !== '/runs/stream') throw new Error(`unexpected unmounted: ${unmounted.join(', ')}`);
    findings.push(finding('mounted routes /healthz and /agents are extracted from the server file request handler', 'hq/lib/indexer.mjs (proposed join)'));
    findings.push(finding('the doc claims GET /runs/stream is live but no server file mounts it — the doc route with no mount', 'hq/lib/indexer.mjs (proposed join)'));
    findings.push(finding('the claiming doc is named as the source of the stale route claim', 'hq/lib/indexer.mjs (proposed join)'));

    return findings;
  },
});
