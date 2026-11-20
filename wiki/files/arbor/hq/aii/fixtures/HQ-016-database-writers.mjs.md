# File: hq/aii/fixtures/HQ-016-database-writers.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-016-database-writers.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3092 B |
| Lines | 57 |
| Hash | 21296485b0db |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 17 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| findings | const | 37 | no | const findings = []; |
| writeOp | const | 38 | no | const writeOp = /(INSERT\|UPDATE\|DELETE)\\b/i; |
| libDir | const | 39 | no | const libDir = join(ROOT, &#39;hq/lib&#39;); |
| text | const | 42 | no | const text = readFileSync(join(libDir, file), &#39;utf8&#39;); |
| lines | const | 43 | no | const lines = text.split(&#39;\\n&#39;); |
| inPrepare | variable | 44 | no | let inPrepare = false; |
| line | const | 46 | no | const line = lines[i]; |
| op | const | 49 | no | const op = line.match(writeOp)[1].toUpperCase(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 12 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| node:fs | import | 13 | external |
| node:path | import | 14 | external |
| node:url | import | 15 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-016-database-writers.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-016 (group B): "Which components can write to this database?"
// Ground truth locked at authoring time 2026-11-11 by scanning hq/lib/*.mjs for
// db.prepare(...) statements containing INSERT/UPDATE/DELETE, each anchored to
// its real source line:
//   hq/lib/indexer.mjs:98 UPDATE; 107 UPDATE files; 108 DELETE files;
//   109 DELETE symbols; 110 DELETE imports; 111 DELETE annotations;
//   112 DELETE content_fts; 113 INSERT content_fts
//   hq/lib/receipts.mjs:74 INSERT receipts
//   hq/lib/schema.mjs:521 INSERT meta; 522 INSERT meta; 546 INSERT meta (upsert)
// Re-derived at run time by re-running the same read-only scan of hq/lib/*.mjs.
import { defineFixture, finding } from './harness.mjs';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-016',
  provenance: 'Locked at authoring time 2026-11-11 by grepping hq/lib/*.mjs for db.prepare(...) INSERT/UPDATE/DELETE statements and anchoring each writer to its real source line (indexer.mjs:98-113, receipts.mjs:74, schema.mjs:521/522/546). Re-derived at run time by re-running the same read-only scan.',
  expected: [
    { what: /indexer\.mjs:98 UPDATE/, where: 'hq/lib/indexer.mjs' },
    { what: /indexer\.mjs:107 UPDATE/, where: 'hq/lib/indexer.mjs' },
    { what: /indexer\.mjs:108 DELETE/, where: 'hq/lib/indexer.mjs' },
    { what: /indexer\.mjs:109 DELETE/, where: 'hq/lib/indexer.mjs' },
    { what: /indexer\.mjs:110 DELETE/, where: 'hq/lib/indexer.mjs' },
    { what: /indexer\.mjs:111 DELETE/, where: 'hq/lib/indexer.mjs' },
    { what: /indexer\.mjs:112 DELETE/, where: 'hq/lib/indexer.mjs' },
    { what: /indexer\.mjs:113 INSERT/, where: 'hq/lib/indexer.mjs' },
    { what: /receipts\.mjs:74 INSERT/, where: 'hq/lib/receipts.mjs' },
    { what: /schema\.mjs:521 INSERT/, where: 'hq/lib/schema.mjs' },
    { what: /schema\.mjs:522 INSERT/, where: 'hq/lib/schema.mjs' },
    { what: /schema\.mjs:546 INSERT/, where: 'hq/lib/schema.mjs' },
  ],
  run: async () => {
    const findings = [];
    const writeOp = /(INSERT|UPDATE|DELETE)\b/i;
    const libDir = join(ROOT, 'hq/lib');
    for (const file of readdirSync(libDir).sort()) {
      if (!file.endsWith('.mjs')) continue;
      const text = readFileSync(join(libDir, file), 'utf8');
      const lines = text.split('\n');
      let inPrepare = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/db\.prepare\(/i.test(line)) inPrepare = true;
        if (inPrepare && writeOp.test(line)) {
          const op = line.match(writeOp)[1].toUpperCase();
          findings.push(finding(`${file}:${i + 1} ${op}`, `hq/lib/${file}`));
        }
        if (/\b\)\s*[\.;]?\s*$/.test(line)) inPrepare = false;
      }
    }
    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
