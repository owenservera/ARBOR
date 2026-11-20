# File: hq/test/arbor-boundary.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/arbor-boundary.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7833 B |
| Lines | 150 |
| Hash | 1857b9089d7f |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fixture | function | 11 | no | function fixture(run) { |
| tmp | const | 12 | no | const tmp = mkdtempSync(join(tmpdir(), &#39;arbor-dev-boundary-&#39;)); |
| source | const | 13 | no | const source = join(tmp, &#39;source&#39;); |
| dataDir | const | 14 | no | const dataDir = join(tmp, &#39;data&#39;); |
| privateWorld | const | 15 | no | const privateWorld = join(tmp, &#39;private-world&#39;); |
| seen | const | 29 | no | const seen = []; |
| allow | variable | 30 | no | let allow = true; |
| api | const | 31 | no | const api = createDevIntelligence({ dataDir, approvedRoots: [source], mode: &#39;host&#39;, actorId: &#39;host-actor&#39;, sessionId: &#39;host-session&#39;, authorize: request =&gt; { seen.push(request); return allow; }, }); |
| api | const | 47 | no | const api = createDevIntelligence({ mode: &#39;diagnostic&#39;, dataDir, approvedRoots: [source] }); |
| identity | const | 48 | no | const identity = api.registerSource({ name: &#39;fixture&#39;, path: source }).sourceId; |
| first | const | 50 | no | const first = api.sourceEvidence({ project: &#39;fixture&#39;, path: &#39;example.mjs&#39; }); |
| stale | const | 59 | no | const stale = api.sourceEvidence({ project: &#39;fixture&#39;, path: &#39;example.mjs&#39; }); |
| api | const | 71 | no | const api = createDevIntelligence({ mode: &#39;diagnostic&#39;, dataDir, approvedRoots: [source] }); |
| bundle | const | 74 | no | const bundle = api.context({ task: &#39;uniqueBoundarySignal&#39;, project: &#39;fixture&#39; }); |
| poisoned | const | 77 | no | const poisoned = { ...bundle, sources: bundle.sources.map(item =&gt; ({ ...item, absPath: join(privateWorld, &#39;personal.txt&#39;), })) }; |
| api | const | 92 | no | const api = createDevIntelligence({ mode: &#39;diagnostic&#39;, dataDir, approvedRoots: [source] }); |
| operations | const | 101 | no | const operations = []; |
| readRevoked | variable | 102 | no | let readRevoked = false; |
| api | const | 103 | no | const api = createDevIntelligence({ mode: &#39;host&#39;, dataDir, approvedRoots: [source], actorId: &#39;a&#39;, sessionId: &#39;s&#39;, authorize: request =&gt; { operations.push(request.operation); return !readRevoked \|\| re… |
| api | const | 123 | no | const api = createDevIntelligence({ mode: &#39;diagnostic&#39;, dataDir, approvedRoots: [source] }); |
| api | const | 137 | no | const api = createDevIntelligence({ mode: &#39;diagnostic&#39;, dataDir, approvedRoots: [source] }); |
| db | const | 140 | no | const db = join(dataDir, &#39;.hq&#39;, &#39;index.db&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 7 | external |
| node:path | import | 8 | external |
| ../lib/arbor-service.mjs | import | 9 | [hq/lib/arbor-service.mjs](../lib/arbor-service.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync,
  symlinkSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDevIntelligence } from '../lib/arbor-service.mjs';

function fixture(run) {
  const tmp = mkdtempSync(join(tmpdir(), 'arbor-dev-boundary-'));
  const source = join(tmp, 'source');
  const dataDir = join(tmp, 'data');
  const privateWorld = join(tmp, 'private-world');
  mkdirSync(source);
  mkdirSync(privateWorld);
  writeFileSync(join(source, 'example.mjs'),
    'export function uniqueBoundarySignal() { return "PUBLIC_CODE"; }\n');
  writeFileSync(join(privateWorld, 'personal.txt'), 'PERSONAL_WORLD_SENTINEL');
  try { return run({ tmp, source, dataDir, privateWorld }); }
  finally { rmSync(tmp, { recursive: true, force: true }); }
}

test('explicit mode and Host callback are mandatory', () => fixture(({ source, dataDir }) => {
  assert.throws(() => createDevIntelligence({ dataDir, approvedRoots: [source] }), /HQ_MODE_REQUIRED/);
  assert.throws(() => createDevIntelligence({ dataDir, approvedRoots: [source], mode: 'host' }),
    /HQ_HOST_AUTHORITY_REQUIRED/);
  const seen = [];
  let allow = true;
  const api = createDevIntelligence({
    dataDir, approvedRoots: [source], mode: 'host',
    actorId: 'host-actor', sessionId: 'host-session',
    authorize: request => { seen.push(request); return allow; },
  });
  api.registerSource({ name: 'fixture', path: source });
  api.index();
  assert.ok(api.search({ query: 'uniqueBoundarySignal' }).total >= 1);
  allow = false;
  assert.throws(() => api.search({ query: 'uniqueBoundarySignal' }), /HQ_HOST_PERMISSION_DENIED/);
  assert.ok(seen.some(x => x.operation === 'source.index' && x.actorId === 'host-actor'
    && x.sessionId === 'host-session' && x.domain === 'development'
    && x.sourceId.startsWith('dev-source:')));
}));

test('index, source evidence and semantic read port have explicit revision/freshness', () => fixture(({ source, dataDir }) => {
  const api = createDevIntelligence({ mode: 'diagnostic', dataDir, approvedRoots: [source] });
  const identity = api.registerSource({ name: 'fixture', path: source }).sourceId;
  api.index();
  const first = api.sourceEvidence({ project: 'fixture', path: 'example.mjs' });
  assert.equal(first.schema, 'arbor.dev-source-evidence/1');
  assert.equal(first.status, 'indexed');
  assert.equal(first.devSourceId, identity);
  assert.equal(first.indexedHash, first.currentHash);
  assert.equal(api.indexWatermarks()[0].sourceId, identity);
  assert.ok(api.graph({ kind: 'projects' }));
  assert.ok(api.context({ task: 'uniqueBoundarySignal', project: 'fixture' }).sources.length > 0);
  writeFileSync(join(source, 'example.mjs'), 'export function uniqueBoundarySignal() { return "CHANGED"; }\n');
  const stale = api.sourceEvidence({ project: 'fixture', path: 'example.mjs' });
  assert.equal(stale.status, 'stale');
  assert.notEqual(stale.indexedHash, stale.currentHash);
  api.index({ force: true });
  assert.equal(api.sourceEvidence({ project: 'fixture', path: 'example.mjs' }).status, 'indexed');
  assert.throws(() => api.sourceEvidence({ project: 'fixture', path: '../personal.txt' }),
    /HQ_INVALID_RELATIVE_PATH/);
  assert.throws(() => api.sourceEvidence({ project: 'fixture', path: 'C:\\private\\file' }),
    /HQ_INVALID_RELATIVE_PATH/);
}));

test('bundle supplied absolute path cannot override indexed source scope', () => fixture(({ source, dataDir, privateWorld }) => {
  const api = createDevIntelligence({ mode: 'diagnostic', dataDir, approvedRoots: [source] });
  api.registerSource({ name: 'fixture', path: source });
  api.index();
  const bundle = api.context({ task: 'uniqueBoundarySignal', project: 'fixture' });
  assert.ok(bundle.sources.length);
  assert.equal(api.verifyContext(bundle).valid, true);
  const poisoned = { ...bundle, sources: bundle.sources.map(item => ({
    ...item, absPath: join(privateWorld, 'personal.txt'),
  })) };
  assert.equal(api.verifyContext(poisoned).valid, true);
```

_First 80 of 151 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
