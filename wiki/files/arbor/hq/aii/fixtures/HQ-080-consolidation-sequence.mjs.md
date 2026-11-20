# File: hq/aii/fixtures/HQ-080-consolidation-sequence.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-080-consolidation-sequence.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5234 B |
| Lines | 103 |
| Hash | 5065fbf7bf02 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| buildWorkspace | function | 19 | no | function buildWorkspace(root) { |
| indexProject | function | 40 | no | function indexProject(db, root, name = &#39;demo&#39;) { |
| at | const | 41 | no | const at = &#39;2026-11-11T00:00:00.000Z&#39;; |
| info | const | 42 | no | const info = db.prepare(&#39;INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)&#39;) |
| projectId | const | 44 | no | const projectId = Number(info.lastInsertRowid); |
| abs | const | 46 | no | const abs = join(root, rel); |
| text | const | 47 | no | const text = readFileSync(abs, &#39;utf8&#39;); |
| stat | const | 48 | no | const stat = statSync(abs); |
| root | const | 70 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq080-fixture-&#39;)); |
| db | const | 73 | no | const db = openMemoryDb(); |
| seq | const | 76 | no | const seq = consolidationSequence(db, { project: &#39;demo&#39; }); |
| findings | const | 77 | no | const findings = []; |
| first | const | 80 | no | const first = group.safestFirst[0]; |
| second | const | 81 | no | const second = group.safestFirst[1]; |
| a | const | 88 | no | const a = seq.groups[0]; |
| b | const | 89 | no | const b = seq.groups[1]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 9 | external |
| node:os | import | 12 | external |
| node:path | import | 13 | external |
| ../../lib/schema.mjs | import | 14 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/canon.mjs | import | 15 | [hq/lib/canon.mjs](../../lib/canon.mjs.md) |
| ../../lib/util.mjs | import | 16 | [hq/lib/util.mjs](../../lib/util.mjs.md) |
| ./harness.mjs | import | 17 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 6 | see | — | . | . Pinned output: 2 duplicate-term groups; within each group the source with fewer |
| 29 | see | — | — | anchors create real binds_to dependents. |

## Excerpt

```javascript
// hq/aii/fixtures/HQ-080-consolidation-sequence.mjs — AII benchmark fixture (PRD HQ-PRD-AII-001).
// Scenario HQ-080: "What is the safest sequence for consolidating these duplicate systems."
// Engine: hq/lib/canon.mjs (consolidationSequence). Ground truth locked 2026-11-11 by running
// bun scripts/gt-hq080.mjs on a synthetic workspace where CANON-DICTIONARY.md and GLOSSARY.md
// duplicate the terms Auth/Session, and docs/auth-guide.md + docs/session-guide.md bind to them
// via @hq:see. Pinned output: 2 duplicate-term groups; within each group the source with fewer
// dependents is safest-first (GLOSSARY.md=1 dep before CANON-DICTIONARY.md=2 deps); groups tie at
// 3 total dependents and order by term name (auth before session). Re-derived live at run time.
import {
  mkdtempSync, mkdirSync, rmSync, writeFileSync, statSync, readFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openMemoryDb } from '../../lib/schema.mjs';
import { indexDocuments, indexCanonTerms, consolidationSequence } from '../../lib/canon.mjs';
import { sha256 } from '../../lib/util.mjs';
import { defineFixture, finding } from './harness.mjs';

function buildWorkspace(root) {
  mkdirSync(join(root, 'docs'), { recursive: true });
  writeFileSync(
    join(root, 'CANON-DICTIONARY.md'),
    `# CANON dictionary\n\n| Term | Working meaning | Status | Boundary |\n| --- | --- | --- | --- |\n| Auth | Identity verification mechanism. | current | authorization ≠ authentication |\n| Session | Authenticated client session state. | current | session ≠ token |\n`,
  );
  writeFileSync(
    join(root, 'GLOSSARY.md'),
    `# Glossary\n\n- **Auth** — How a caller proves who it is.\n- **Session** — A live authenticated connection.\n- **Receipt** — A record of what HQ read.\n`,
  );
  // @hq:see anchors create real binds_to dependents.
  writeFileSync(
    join(root, 'docs/auth-guide.md'),
    `# Auth guide\n\n@hq:see CANON-DICTIONARY.md:3\n@hq:see GLOSSARY.md:2\n`,
  );
  writeFileSync(
    join(root, 'docs/session-guide.md'),
    `# Session guide\n\n@hq:see CANON-DICTIONARY.md:4\n`,
  );
}

function indexProject(db, root, name = 'demo') {
  const at = '2026-11-11T00:00:00.000Z';
  const info = db.prepare('INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)')
    .run(name, root, at);
  const projectId = Number(info.lastInsertRowid);
  for (const rel of ['CANON-DICTIONARY.md', 'GLOSSARY.md', 'docs/auth-guide.md', 'docs/session-guide.md']) {
    const abs = join(root, rel);
    const text = readFileSync(abs, 'utf8');
    const stat = statSync(abs);
    db.prepare(
      'INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines, indexed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(
      projectId, rel, abs, 'markdown', 'source', stat.size, Math.floor(stat.mtimeMs),
      sha256(text), text.split('\n').length, at,
    );
  }
  indexDocuments(db, { name, path: root });
  indexCanonTerms(db, { name, path: root });
}

export default defineFixture({
  id: 'HQ-080',
  provenance: '2026-11-11 — built a synthetic workspace with bun scripts/gt-hq080.mjs: CANON-DICTIONARY.md and GLOSSARY.md duplicate Auth/Session; docs/auth-guide.md and docs/session-guide.md bind via @hq:see; ran consolidationSequence on the live hq/lib/canon.mjs module and pinned the exact per-source dependent counts and safest-first ordering.',
  expected: [
    { what: '2 duplicate-term groups found', where: 'HQ-080 consolidationSequence' },
    { what: 'auth: GLOSSARY.md(1 dependent) before CANON-DICTIONARY.md(2 dependents)', where: 'hq/lib/canon.mjs' },
    { what: 'session: GLOSSARY.md(1 dependent) before CANON-DICTIONARY.md(2 dependents)', where: 'hq/lib/canon.mjs' },
    { what: 'groups tie at 3 total dependents and order by term name: auth before session', where: 'hq/lib/canon.mjs' },
  ],
  run: async () => {
    const root = mkdtempSync(join(tmpdir(), 'hq080-fixture-'));
    try {
      buildWorkspace(root);
      const db = openMemoryDb();
      try {
        indexProject(db, root);
        const seq = consolidationSequence(db, { project: 'demo' });
        const findings = [];
        findings.push(finding(`${seq.groupCount} duplicate-term groups found`, 'HQ-080 consolidationSequence'));
        for (const group of seq.groups) {
          const first = group.safestFirst[0];
```

_First 80 of 104 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
