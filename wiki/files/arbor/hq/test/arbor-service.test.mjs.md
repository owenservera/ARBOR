# File: hq/test/arbor-service.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/arbor-service.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2621 B |
| Lines | 46 |
| Hash | 57e4865723aa |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| tmp | const | 9 | no | const tmp = mkdtempSync(join(tmpdir(), &#39;arbor-hq-&#39;)); |
| source | const | 11 | no | const source = join(tmp, &#39;code&#39;); |
| data | const | 12 | no | const data = join(tmp, &#39;private-dev-index&#39;); |
| hq | const | 15 | no | const hq = createDevIntelligence({ mode: &#39;diagnostic&#39;, dataDir: data, approvedRoots: [source] }); |
| indexed | const | 18 | no | const indexed = hq.index(); |
| rendered | const | 25 | no | const rendered = hq.wiki(); |
| tmp | const | 35 | no | const tmp = mkdtempSync(join(tmpdir(), &#39;arbor-hq-deny-&#39;)); |
| source | const | 37 | no | const source = join(tmp, &#39;project&#39;), data = join(tmp, &#39;data&#39;); |
| hq | const | 41 | no | const hq = createDevIntelligence({ mode: &#39;diagnostic&#39;, dataDir: data }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../lib/arbor-service.mjs | import | 6 | [hq/lib/arbor-service.mjs](../lib/arbor-service.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDevIntelligence, DEV_INTELLIGENCE_CONTRACT } from '../lib/arbor-service.mjs';

test('index, search, context and wiki operate on authorized local project without donor HQ', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'arbor-hq-'));
  try {
    const source = join(tmp, 'code');
    const data = join(tmp, 'private-dev-index');
    mkdirSync(source);
    writeFileSync(join(source, 'example.mjs'), 'export function distinctArborGreeting() { return "ARBOR_SOURCE_SENTINEL"; }\n');
    const hq = createDevIntelligence({ mode: 'diagnostic', dataDir: data, approvedRoots: [source] });
    assert.equal(hq.contract, DEV_INTELLIGENCE_CONTRACT);
    hq.registerSource({ name: 'fixture', path: source });
    const indexed = hq.index();
    assert.equal(indexed.errors.length, 0);
    assert.ok(indexed.totals.files >= 1);
    assert.ok(hq.search({ query: 'distinctArborGreeting', project: 'fixture' }).total >= 1);
    assert.equal(hq.indexWatermarks().length, 1);
    assert.match(hq.sourceEvidence({ project: 'fixture', path: 'example.mjs' }).text, /distinctArborGreeting/);
    assert.ok(hq.context({ task: 'distinctArborGreeting', project: 'fixture' }).sources.length >= 1);
    const rendered = hq.wiki();
    assert.ok(rendered);
    assert.ok(existsSync(join(data, '.hq', 'index.db')));
    assert.equal(hq.status().domain, 'development');
    assert.equal(hq.removeSource('fixture'), true);
    assert.equal(hq.search({ query: 'distinctArborGreeting' }).total, 0);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test('unapproved and nonexistent roots fail closed; no implicit source discovery', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'arbor-hq-deny-'));
  try {
    const source = join(tmp, 'project'), data = join(tmp, 'data');
    mkdirSync(source);
    // `mode` is mandatory (see the HQ_MODE_REQUIRED contract); the denial being
    // exercised here is the source-root allowlist, not the mode requirement.
    const hq = createDevIntelligence({ mode: 'diagnostic', dataDir: data });
    assert.throws(() => hq.registerSource({ name: 'secret', path: source }), /HQ_SOURCE_NOT_APPROVED/);
    assert.deepEqual(hq.status().sources, []);
    assert.throws(() => hq.scanCapabilities({ path: source }), /HQ_SOURCE_NOT_APPROVED/);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
