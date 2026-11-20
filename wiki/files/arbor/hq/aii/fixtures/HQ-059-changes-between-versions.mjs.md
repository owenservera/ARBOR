# File: hq/aii/fixtures/HQ-059-changes-between-versions.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-059-changes-between-versions.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4943 B |
| Lines | 69 |
| Hash | b22b24caaebb |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 19 | no | const ROOT = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| findings | const | 39 | no | const findings = []; |
| head | const | 41 | no | const head = headRecord(ROOT); |
| logs | const | 45 | no | const logs = logRecords(ROOT, { limit: 20 }); |
| linked | const | 47 | no | const linked = logs.some((r) =&gt; Array.isArray(r.parents) &amp;&amp; r.parents.includes(logs[1].sha)); |
| dirty | const | 55 | no | const dirty = dirtyFiles(ROOT); |
| seq | const | 59 | no | const seq = committedSequence(ROOT, { limit: 10 }); |
| dirtyNow | const | 65 | no | const dirtyNow = isDirty(ROOT); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 14 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/git.mjs | import | 15 | [hq/lib/git.mjs](../../lib/git.mjs.md) |
| node:path | import | 16 | external |
| node:url | import | 17 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-059-changes-between-versions.mjs
// AII scenario HQ-059 (group G): "What changed between the last working version and the current broken version?"
// Engine: hq/lib/git.mjs (logRecords :81, headRecord :116, dirtyFiles :46, committedSequence :73)
// — the diff surfaces the covered_unverified slice names (hq/aii/assessments/lane-6.json HQ-059).
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - Live probes on branch main (re-derived at run time; exact SHAs and counts drift):
//     headRecord('.') returned a HEAD commit; committedSequence('.', {limit:5}) returned
//     5 rows; dirtyFiles('.') returned 29 dirty files.
//   - logRecords rows carry {sha, parents, author, date, subject} (verified this session).
//   - The AII repair commits HQ-067/HQ-070 ground-truth refresh are visible in recent
//     history — the "what changed" answer for this repo's last working version.

import { defineFixture, finding } from './harness.mjs';
import { headRecord, logRecords, dirtyFiles, committedSequence, isDirty } from '../../lib/git.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default defineFixture({
  id: 'HQ-059',
  provenance:
    '2026-11-11 (this session): locked from live hq/lib/git.mjs probes on branch main — headRecord(), ' +
    'committedSequence({limit:5}) (5 rows), dirtyFiles() (29 dirty files), and logRecords rows carrying ' +
    '{sha, parents, author, date, subject} were all executed this session (matches hq/aii/assessments/lane-6.json ' +
    'HQ-059 capSurfaces: hq since joins lake.mjs queryCommits with git.mjs dirtyFiles). Exact SHAs and dirty-file ' +
    'counts drift with every commit and are re-derived live; the structural facts (HEAD exists, history is ' +
    'parent-linked, dirty files enumerable, commit subjects describe the change) are pinned.',
  expected: [
    { what: 'HEAD is resolvable and carries sha/author/date/subject — the current (possibly broken) version', where: 'hq/lib/git.mjs headRecord' },
    { what: 'the commit history is parent-linked — the baseline for "last working version" is any reachable ancestor', where: 'hq/lib/git.mjs logRecords' },
    { what: 'uncommitted changes are enumerable per file — part of what changed since the baseline', where: 'hq/lib/git.mjs dirtyFiles' },
    { what: 'committedSequence returns bounded sha strings for the version range', where: 'hq/lib/git.mjs committedSequence' },
    { what: /^the working tree is (dirty|clean) — the change set vs the baseline is (non-empty|empty) right now$/, where: 'hq/lib/git.mjs dirtyFiles' },
    { what: 'logRecords rows carry subject and date — the answer to "what changed" is readable per commit', where: 'hq/lib/git.mjs logRecords' },
  ],
  run: async () => {
    const findings = [];

    const head = headRecord(ROOT);
    if (!head || !head.sha || !head.date) throw new Error(`no HEAD: ${JSON.stringify(head)}`);
    findings.push(finding('HEAD is resolvable and carries sha/author/date/subject — the current (possibly broken) version', 'hq/lib/git.mjs headRecord'));

    const logs = logRecords(ROOT, { limit: 20 });
    if (logs.length < 2) throw new Error(`history too short: ${logs.length}`);
    const linked = logs.some((r) => Array.isArray(r.parents) && r.parents.includes(logs[1].sha));
    if (!linked) throw new Error('history is not parent-linked');
    if (!logs.every((r) => typeof r.subject === 'string' && typeof r.date === 'string')) {
      throw new Error('logRecords rows missing subject/date');
    }
    findings.push(finding('the commit history is parent-linked — the baseline for "last working version" is any reachable ancestor', 'hq/lib/git.mjs logRecords'));
    findings.push(finding('logRecords rows carry subject and date — the answer to "what changed" is readable per commit', 'hq/lib/git.mjs logRecords'));

    const dirty = dirtyFiles(ROOT);
    if (!Array.isArray(dirty)) throw new Error('dirtyFiles did not return an array');
    findings.push(finding('uncommitted changes are enumerable per file — part of what changed since the baseline', 'hq/lib/git.mjs dirtyFiles'));

    const seq = committedSequence(ROOT, { limit: 10 });
    if (seq.length < 1 || !seq.every((s) => /^[0-9a-f]{40}$/.test(String(s)))) {
      throw new Error(`committedSequence shape wrong: ${JSON.stringify(seq.slice(0, 2))}`);
    }
    findings.push(finding('committedSequence returns bounded sha strings for the version range', 'hq/lib/git.mjs committedSequence'));

    const dirtyNow = isDirty(ROOT);
    findings.push(finding(`the working tree is ${dirtyNow ? 'dirty' : 'clean'} — the change set vs the baseline is ${dirtyNow ? 'non-empty' : 'empty'} right now`, 'hq/lib/git.mjs dirtyFiles'));
    return findings;
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
