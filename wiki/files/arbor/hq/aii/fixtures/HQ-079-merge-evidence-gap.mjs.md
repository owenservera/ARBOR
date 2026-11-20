# File: hq/aii/fixtures/HQ-079-merge-evidence-gap.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-079-merge-evidence-gap.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9319 B |
| Lines | 190 |
| Hash | 8941f4c995f9 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROVENANCE | const | 22 | no | const PROVENANCE = `Ground truth locked 2026-11-11 by running the real hq/lib/lake.mjs |
| buildWorkspace | function | 59 | no | function buildWorkspace(root) { |
| git | function | 60 | no | const git = (args, opts = {}) =&gt; execFileSync(&#39;git&#39;, args, { cwd: root, encoding: &#39;utf8&#39;, stdio: [&#39;pipe&#39;, &#39;pipe&#39;, &#39;pipe&#39;], ...opts, }); |
| write | function | 63 | no | const write = (rel, content) =&gt; { |
| abs | const | 64 | no | const abs = join(root, rel); |
| commit | function | 68 | no | const commit = (message, iso) =&gt; { |
| root | const | 116 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq079-fixture-&#39;)); |
| db | const | 119 | no | const db = openMemoryDb(); |
| project | const | 121 | no | const project = { name: &#39;demo&#39;, path: root }; |
| findings | const | 124 | no | const findings = []; |
| bare | const | 128 | no | const bare = mergeEvidenceGap(db, { project, branchA: &#39;main&#39;, branchB: &#39;feature&#39; }); |
| byClass | const | 134 | no | const byClass = new Map(bare.missingEvidence.map((m) =&gt; [m.class, m.detail])); |
| supplied | const | 167 | no | const supplied = mergeEvidenceGap(db, { project, branchA: &#39;main&#39;, branchB: &#39;feature&#39;, since: { commits: 2 }, verify: { ok: true }, conflicts: [], |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 14 | external |
| node:fs | import | 15 | external |
| node:os | import | 16 | external |
| node:path | import | 17 | external |
| ../../lib/schema.mjs | import | 18 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/lake.mjs | import | 19 | [hq/lib/lake.mjs](../../lib/lake.mjs.md) |
| ./harness.mjs | import | 20 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-079-merge-evidence-gap.mjs — AII benchmark fixture
// (PRD HQ-PRD-AII-001). Scenario HQ-079 (group I): "What additional evidence
// do we need before merging these branches?"
//
// Engine: hq/lib/lake.mjs `mergeEvidenceGap` (added by lane
// p1-regression-merge-evidence). Ground truth locked 2026-11-11 by running the
// real module against a synthetic git workspace with two diverging branches
// (see PROVENANCE). The fixture re-derives every finding live at run time.
//
// Synthetic/seeded data only: a throwaway git repo in the OS temp dir with
// fixed author/committer dates. No credentials, no private session content, no
// provider messages, no Host-world writes — the probe only reads git history
// through lake.mjs and writes to a temp directory.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openMemoryDb } from '../../lib/schema.mjs';
import { ingestProject, mergeEvidenceGap } from '../../lib/lake.mjs';
import { defineFixture, finding } from './harness.mjs';

const PROVENANCE = `Ground truth locked 2026-11-11 by running the real hq/lib/lake.mjs
mergeEvidenceGap() against a synthetic git workspace (the same one this fixture
rebuilds at run time), and pinning exactly what it returned:

  bun C:/Users/VIVIM.inc/AppData/Local/Temp/probe-hq079.mjs
    log --oneline --all --graph:
    * eef7d36 feat(main): main-only change
    * 8cac72c feat(main): change shared file
    | * 2ecaa67 feat(feature): feature-only change
    | * 939fb10 feat(feature): change shared file
    |/
    * 048f8c9 feat: base
    ingest: {"project":"demo","inserted":3,"skipped":0,"commits":3}

    === BARE (no evidence surfaces supplied) ===
    changedFiles     : ["src/feature-only.js","src/main-only.js","src/shared.js"]
    conflictingFiles : ["src/shared.js"]
    aNotInB len      : 2
    bNotInA len      : 2
    missing classes  : ["branch_since","unresolved_conflicts","untested_changed_files","absent_receipts"]
       - branch_since :: no since evidence for divergent commits on main <-> feature
       - unresolved_conflicts :: same file changed on both branches: src/shared.js
       - untested_changed_files :: no verify result for changed files: src/feature-only.js, src/main-only.js, src/shared.js
       - absent_receipts :: no receipts recorded for this merge decision

    === SUPPLIED (since/verify/conflicts/drift present) ===
    missing classes  : ["unresolved_conflicts","untested_changed_files","absent_receipts","dirty_tree","stale_index"]
       - unresolved_conflicts :: same file changed on both branches: src/shared.js
       - untested_changed_files :: changed files without test evidence: src/feature-only.js, src/main-only.js, src/shared.js
       - absent_receipts :: no receipts recorded for this merge decision
       - dirty_tree :: uncommitted files: src/feature-only.js
       - stale_index :: files changed since last index: demo

The pinned ground truth is the semantic evidence-class set (which classes are
named and what they name), not a stored copy of the output. Re-derive live to
confirm.`;

function buildWorkspace(root) {
  const git = (args, opts = {}) => execFileSync('git', args, {
    cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts,
  });
  const write = (rel, content) => {
    const abs = join(root, rel);
    mkdirSync(join(abs, '..'), { recursive: true });
    writeFileSync(abs, content, 'utf8');
  };
  const commit = (message, iso) => {
    git(['add', '-A']);
    git(['commit', '-q', '-m', message], {
      env: { ...process.env, GIT_AUTHOR_DATE: iso, GIT_COMMITTER_DATE: iso },
    });
  };

  git(['init', '-q', '-b', 'main']);
  git(['config', 'user.email', 'hq@example.test']);
  git(['config', 'user.name', 'HQ Fixture']);

  // Common base — both branches descend from this commit.
  write('README.md', '# Demo\n');
```

_First 80 of 191 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
