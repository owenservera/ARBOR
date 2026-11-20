# File: hq/aii/fixtures/HQ-058-route-documented-not-mounted.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-058-route-documented-not-mounted.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5952 B |
| Lines | 100 |
| Hash | acdb34044aec |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 20 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| SERVER_FILE | const | 23 | no | const SERVER_FILE = [ |
| DOC_TEXT | const | 34 | no | const DOC_TEXT = [ |
| extractMountedRoutes | function | 43 | no | function extractMountedRoutes(serverText) { |
| mounted | const | 44 | no | const mounted = []; |
| extractDocumentedRoutes | function | 48 | no | function extractDocumentedRoutes(docText) { |
| out | const | 49 | no | const out = []; |
| findings | const | 71 | no | const findings = []; |
| indexerText | const | 74 | no | const indexerText = readFileSync(join(ROOT, &#39;hq&#39;, &#39;lib&#39;, &#39;indexer.mjs&#39;), &#39;utf8&#39;); |
| schemaText | const | 80 | no | const schemaText = readFileSync(join(ROOT, &#39;hq&#39;, &#39;lib&#39;, &#39;schema.mjs&#39;), &#39;utf8&#39;); |
| mounted | const | 87 | no | const mounted = extractMountedRoutes(SERVER_FILE).sort(); |
| documented | const | 88 | no | const documented = extractDocumentedRoutes(DOC_TEXT); |
| documentedSorted | const | 90 | no | const documentedSorted = [...documented].sort(); |
| unmounted | const | 92 | no | const unmounted = [...documented].sort().filter((r) =&gt; !mounted.includes(r)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 15 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| node:fs | import | 16 | external |
| node:path | import | 17 | external |
| node:url | import | 18 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 101 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
