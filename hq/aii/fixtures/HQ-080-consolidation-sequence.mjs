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
          const second = group.safestFirst[1];
          findings.push(finding(
            `${group.term}: ${first.source}(${first.dependents} dependent) before ${second.source}(${second.dependents} dependents)`,
            'hq/lib/canon.mjs',
          ));
        }
        if (seq.groups.length >= 2) {
          const a = seq.groups[0];
          const b = seq.groups[1];
          findings.push(finding(
            `groups tie at ${a.totalDependents} total dependents and order by term name: ${a.term} before ${b.term}`,
            'hq/lib/canon.mjs',
          ));
        }
        return findings;
      } finally {
        db.close();
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
});
