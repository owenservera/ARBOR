# File: hq/aii/fixtures/HQ-096-challenge-conclusions.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-096-challenge-conclusions.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9372 B |
| Lines | 150 |
| Hash | c7025a721e03 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 32 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| CONFLICT_TERMS | const | 35 | no | const CONFLICT_TERMS = [ |
| findings | const | 52 | no | const findings = []; |
| tmp | const | 55 | no | const tmp = mkdtempSync(join(tmpdir(), &#39;hq096-fixture-&#39;)); |
| docPath | const | 57 | no | const docPath = join(tmp, &#39;challenge-target.md&#39;); |
| db | const | 59 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| bundle | variable | 60 | no | let bundle; |
| verified | const | 68 | no | const verified = verifyContext(bundle); |
| initial | const | 78 | no | const initial = &#39;# Challenge target\\n\\nInitial conclusion text.\\n&#39;; |
| sourceBundle | const | 79 | no | const sourceBundle = { |
| afterEdit | const | 98 | no | const afterEdit = verifyContext(sourceBundle); |
| noDigest | const | 109 | no | const noDigest = verifyContext({ task: &#39;x&#39;, digest: null, sources: [] }); |
| db | const | 117 | no | const db = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| health | const | 119 | no | const health = documentHealth(db, { root: ROOT }); |
| conflicts | const | 120 | no | const conflicts = (health.conflicts ?? []).filter((c) =&gt; c.kind === &#39;duplicate_term&#39;); |
| byTerm | const | 121 | no | const byTerm = new Map(conflicts.map((c) =&gt; [c.a, c])); |
| conflict | const | 123 | no | const conflict = byTerm.get(term); |
| db2 | const | 134 | no | const db2 = openDb(join(ROOT, &#39;.hq&#39;, &#39;index.db&#39;)); |
| stale | const | 138 | no | const stale = await collectStaleFiles({ db: db2, config: loadConfig(ROOT), projects: projectsForIndex(ROOT) }); |
| reasons | const | 139 | no | const reasons = [...new Set(stale.map((s) =&gt; s.reason))].sort(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 23 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/context.mjs | import | 24 | [hq/lib/context.mjs](../../lib/context.mjs.md) |
| ../../lib/schema.mjs | import | 25 | [hq/lib/schema.mjs](../../lib/schema.mjs.md) |
| ../../lib/canon.mjs | import | 26 | [hq/lib/canon.mjs](../../lib/canon.mjs.md) |
| node:fs | import | 27 | external |
| node:os | import | 28 | external |
| node:path | import | 29 | external |
| node:url | import | 30 | external |
| ../../lib/util.mjs | dynamic | 77 | [hq/lib/util.mjs](../../lib/util.mjs.md) |
| ../../lib/freshness.mjs | dynamic | 136 | [hq/lib/freshness.mjs](../../lib/freshness.mjs.md) |
| ../../lib/registry.mjs | dynamic | 137 | [hq/lib/registry.mjs](../../lib/registry.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-096-challenge-conclusions.mjs
// AII build lane "p1-existing-surface-fixtures". Scenario HQ-096 (group L):
// "Challenge your previous conclusions and look for evidence that could
// disprove them."
//
// Ground truth LOCKED 2026-11-11 from live output on branch main:
//   verifyContext(bundle) (hq/lib/context.mjs:847) re-reads every bundle
//   source, recomputes the sha256 per line range and the whole-bundle digest,
//   and returns { valid, expected, current, changed[] } — a conclusion is
//   DISPROVED exactly when a source hash changed (valid false, changed[] lists
//   the ref). Proven live on a SEEDED bundle (a temp file that was edited
//   between compose and verify): valid=false and the edited ref appears in
//   changed[]. The workspace index is never written.
//   bun hq/bin/hq.mjs conflicts
//     -> 4 duplicate_term conflicts, each "CANON term <term> is defined in 2
//        sources and was not merged" — recorded, self-contradicting conclusions.
//   collectStaleFiles() (hq/lib/freshness.mjs:19) returns {reason:
//   'new'|'changed'|'deleted'} for index-vs-disk drift — the evidence that a
//   previous snapshot no longer holds.
//
// The disproval mechanism (verifyContext flips valid on a changed source) and
// the duplicate-term conflicts are pinned; live drift counts are re-derived.
import { defineFixture, finding, runHq } from './harness.mjs';
import { composeContext, verifyContext } from '../../lib/context.mjs';
import { openDb } from '../../lib/schema.mjs';
import { documentHealth } from '../../lib/canon.mjs';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// The duplicate CANON terms recorded as conflicting conclusions (locked live).
const CONFLICT_TERMS = [
  'every case asserts the transport was NOT called where the policy refuses',
  'pure: no fs, no childprocess, no clock read. now is an argument and is required',
];

export default defineFixture({
  id: 'HQ-096',
  provenance: 'Locked 2026-11-11 on branch main from live output and seeded proof: verifyContext(bundle) (hq/lib/context.mjs:847) re-reads every source, recomputes per-range sha256 and the bundle digest, returning { valid, expected, current, changed[] }; a SEEDED bundle built over a temp file (composeContext over the real module with the temp file in the workspace, then the file edited) verified as valid=false with the edited ref listed in changed[] — the mechanism that disproves a previous conclusion, proven without writing the workspace index. bun hq/bin/hq.mjs conflicts printed 4 duplicate_term conflicts, each "CANON term <term> is defined in 2 sources and was not merged", including "every case asserts the transport was NOT called where the policy refuses" (hq/test/channel-broker.test.mjs, hq/test/channel-seat.test.mjs) and "pure: no fs, no childprocess, no clock read. now is an argument and is required" (hq/lib/revive-daemon.mjs, hq/lib/revive-lane.mjs). documentHealth(db) (hq/lib/canon.mjs:192) returned the same conflicts. collectStaleFiles() (hq/lib/freshness.mjs:19) returns reason new|changed|deleted for index-vs-disk drift. The disproval mechanism and the two recorded contradictions are pinned exactly; live drift counts are re-derived.',
  expected: [
    { what: 'a conclusion backed by a changed source is disproved: verifyContext flips valid and names the changed ref', where: 'hq/lib/context.mjs verifyContext' },
    { what: 'an unmodified bundle verifies as valid=true with no changed sources', where: 'hq/lib/context.mjs verifyContext' },
    { what: 'the challenge surface lists the ref whose sha256 no longer matches', where: 'hq/lib/context.mjs verifyContext' },
    { what: 'recorded contradiction: "every case asserts the transport was NOT called where the policy refuses" is defined in 2 sources and was not merged', where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'recorded contradiction: "pure: no fs, no childprocess, no clock read. now is an argument and is required" is defined in 2 sources and was not merged', where: 'hq/lib/canon.mjs documentHealth' },
    { what: 'the staleness walk reports index-vs-disk drift with reasons new, changed, deleted', where: 'hq/lib/freshness.mjs collectStaleFiles' },
  ],
  run: async () => {
    const findings = [];

    // Seeded disproval proof on a temp workspace, read-only w.r.t. the repo.
    const tmp = mkdtempSync(join(tmpdir(), 'hq096-fixture-'));
    try {
      const docPath = join(tmp, 'challenge-target.md');
      writeFileSync(docPath, '# Challenge target\n\nInitial conclusion text.\n', 'utf8');
      const db = openDb(join(ROOT, '.hq', 'index.db'));
      let bundle;
      try {
        // A real bundle over the live index: compose and verify in the same
        // state, so nothing has changed on disk between the two steps.
        bundle = composeContext(db, { task: 'git context', budgetTokens: 2000 });
      } finally {
        db.close();
      }
      const verified = verifyContext(bundle);
      if (verified.valid !== true || verified.changed.length !== 0) {
        throw new Error(`a freshly composed bundle must verify clean: ${JSON.stringify({ valid: verified.valid, changed: verified.changed })}`);
      }
      findings.push(finding('an unmodified bundle verifies as valid=true with no changed sources', 'hq/lib/context.mjs verifyContext'));

      // Seed a bundle whose source digest matches the file's INITIAL content,
      // then edit the file: verifyContext must disprove the conclusion and
      // name the changed ref.
      const { sha256 } = await import('../../lib/util.mjs');
      const initial = '# Challenge target\n\nInitial conclusion text.\n';
      const sourceBundle = {
        task: 'challenge target conclusion',
```

_First 80 of 151 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
