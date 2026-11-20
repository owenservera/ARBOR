# File: hq/aii/fixtures/HQ-109-subsystem-implicit-knowledge.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-109-subsystem-implicit-knowledge.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4711 B |
| Lines | 77 |
| Hash | 65ca22a26eb3 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 25 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| ANCHORS | const | 27 | no | const ANCHORS = [ |
| findings | const | 66 | no | const findings = []; |
| text | const | 68 | no | const text = readFileSync(join(ROOT, ...a.file.split(&#39;/&#39;)), &#39;utf8&#39;); |
| lines | const | 69 | no | const lines = text.split(&#39;\\n&#39;); |
| idx | const | 70 | no | const idx = lines.findIndex((l) =&gt; l.includes(a.sentence)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 20 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| node:fs | import | 21 | external |
| node:path | import | 22 | external |
| node:url | import | 23 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-109-subsystem-implicit-knowledge.mjs
// AII scenario HQ-109 (group M): "What implicit knowledge makes this subsystem nuanced — what must be understood before changing it?"
// Engine: documented invariants in the code (hq:why / hq:invariant comments) — the knowledge
// a changer must read before touching the subsystem. Anchored to real files, line numbers
// resolved at run time from the exact documented sentences.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - harness.mjs:100-104: parallel fixture runs contend for the single SQLite writer slot;
//     the receipt write retries with backoff (harness.mjs:122-135) — a changer who misses
//     this breaks concurrent receipts.
//   - model-router.mjs:601-607: an agent on `inherit` follows whatever the session model is —
//     "five lanes once died together on one inherited model" (2026-11-05 measured failure:
//     reasoning-level-not-supported on every named-agent spawn).
//   - model-router.mjs:575: shared token-plan credit is provider-wide; a healthy sibling is
//     not a safe alternative (the F03 failure family).
//   - graph.mjs:196-209: static orphanhood alone is not proof of death — a dynamic import()
//     has no static inbound edge (HQ-023/HQ-029 semantics).
//   Each anchor is matched by its documented sentence; the file:line is resolved live.

import { defineFixture, finding } from './harness.mjs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const ANCHORS = [
  {
    file: 'hq/aii/fixtures/harness.mjs',
    sentence: 'Parallel fixture runs contend for the single SQLite writer slot',
    nuance: 'concurrent receipt writes need busy-timeout + retry — the writer slot is single',
  },
  {
    file: 'hq/lib/model-router.mjs',
    sentence: 'five lanes once died together on one inherited model',
    nuance: 'inherit pins are the failure the router exists to stop; the repair keeps the model and moves the level',
  },
  {
    file: 'hq/lib/model-router.mjs',
    sentence: 'Shared token-plan credit is provider-wide; a healthy sibling is not a safe alternative',
    nuance: 'credit exhaustion on one model voids every same-provider sibling (F03)',
  },
  {
    file: 'hq/lib/graph.mjs',
    sentence: 'Static orphanhood alone is not proof of death',
    nuance: 'a dynamic import() has no static inbound edge — orphans must be checked against dynamic loads before retirement',
  },
];

export default defineFixture({
  id: 'HQ-109',
  provenance:
    '2026-11-11 (this session): locked by reading the real documented invariants in the working tree — the four anchors ' +
    'above were located by content this session (harness.mjs:100-104 comment block; model-router.mjs inherit rationale ' +
    'at :601-607 and the F03 note at :575; graph.mjs orphan semantics at :196-209). Each anchor is matched by its exact ' +
    'documented sentence; the file:line in the findings is resolved at run time, so comment drift moves the line number ' +
    'but a deleted invariant fails the fixture.',
  expected: [
    { what: /^concurrent receipt writes need busy-timeout \+ retry — the writer slot is single \(hq\/aii\/fixtures\/harness\.mjs:\d+\)$/, where: 'hq/aii/fixtures/harness.mjs' },
    { what: /^inherit pins are the failure the router exists to stop; the repair keeps the model and moves the level \(hq\/lib\/model-router\.mjs:\d+\)$/, where: 'hq/lib/model-router.mjs' },
    { what: /^credit exhaustion on one model voids every same-provider sibling \(F03\) \(hq\/lib\/model-router\.mjs:\d+\)$/, where: 'hq/lib/model-router.mjs' },
    { what: /^a dynamic import\(\) has no static inbound edge — orphans must be checked against dynamic loads before retirement \(hq\/lib\/graph\.mjs:\d+\)$/, where: 'hq/lib/graph.mjs' },
    { what: 'every implicit-knowledge anchor resolves to a real file:line in the working tree', where: 'hq/lib' },
  ],
  run: async () => {
    const findings = [];
    for (const a of ANCHORS) {
      const text = readFileSync(join(ROOT, ...a.file.split('/')), 'utf8');
      const lines = text.split('\n');
      const idx = lines.findIndex((l) => l.includes(a.sentence));
      if (idx === -1) throw new Error(`anchor sentence not found in ${a.file}: ${a.sentence}`);
      findings.push(finding(`${a.nuance} (${a.file}:${idx + 1})`, a.file));
    }
    findings.push(finding('every implicit-knowledge anchor resolves to a real file:line in the working tree', 'hq/lib'));
    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
