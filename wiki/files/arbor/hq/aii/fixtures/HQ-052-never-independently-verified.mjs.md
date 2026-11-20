# File: hq/aii/fixtures/HQ-052-never-independently-verified.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-052-never-independently-verified.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6408 B |
| Lines | 93 |
| Hash | 09904ab5f0b2 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 18 | no | const ROOT = join(import.meta.dirname ?? &#39;.&#39;, &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| RECEIPTS | const | 21 | no | const RECEIPTS = [ |
| OUTCOMES | const | 30 | no | const OUTCOMES = [ |
| findings | const | 55 | no | const findings = []; |
| whyOf | function | 57 | no | const whyOf = (requestId) =&gt; tasks.find((t) =&gt; t.proof?.includes(requestId))?.quote ?? null; |
| reconDir | const | 83 | no | const reconDir = join(ROOT, &#39;dogfood&#39;, &#39;recon&#39;); |
| rows | const | 84 | no | const rows = readdirSync(reconDir).filter((f) =&gt; f.endsWith(&#39;.json&#39;)) |
| counts | const | 86 | no | const counts = {}; |
| unproven | const | 88 | no | const unproven = (counts.partial ?? 0) + (counts.blocked ?? 0) + (counts.absent ?? 0); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./harness.mjs | import | 13 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |
| ../../lib/dogfood.mjs | import | 14 | [hq/lib/dogfood.mjs](../../lib/dogfood.mjs.md) |
| node:fs | import | 15 | external |
| node:path | import | 16 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/aii/fixtures/HQ-052-never-independently-verified.mjs
// AII scenario HQ-052 (group F): "Which reported successes were never independently verified?"
// Engine: hq/lib/dogfood.mjs evidenceTasks (dogfood.mjs:857) + the dogfood recon register.
//
// Ground truth LOCKED 2026-11-11 (this session):
//   - evidenceTasks(receipts, outcomes) (hq/lib/dogfood.mjs:857-899) flags exactly the
//     unverified successes: OK effect with no outcome, OK vs disagreeing outcome, CLAIMED
//     evidence state (dogfood.mjs:875), placeholder-thread touches (dogfood.mjs:877).
//   - Live recon register re-derived this session: dogfood/recon/*.json holds 18 rows —
//     3 blocked, 12 partial, 2 absent, 1 proven (statuses verified by reading the files);
//     RECON_STATES = ['proven','partial','blocked','absent'] (dogfood.mjs:45).

import { defineFixture, finding } from './harness.mjs';
import { evidenceTasks } from '../../lib/dogfood.mjs';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '..', '..', '..');

// Seeded channel receipts/outcomes covering each unverified-success shape.
const RECEIPTS = [
  { receiptId: 'rcpt_seed_ok_no_outcome', requestId: 'req-101', actor: { id: 'chatgpt' }, effect: 'OK', thread: { after: 'thread-a' } },
  { receiptId: 'rcpt_seed_claimed', requestId: 'req-102', actor: { id: 'gemini' }, effect: 'OK', thread: { after: 'thread-b' } },
  { receiptId: 'rcpt_seed_disagree', requestId: 'req-103', actor: { id: 'claude' }, effect: 'OK', thread: { after: 'thread-c' } },
  { receiptId: 'rcpt_seed_placeholder', requestId: 'req-104', actor: { id: 'claude' }, effect: 'OK', thread: { after: 'live-tab capture' } },
  // req-104 carries an observed outcome so the placeholder-thread check (dogfood.mjs:876-879,
  // applied only when no stronger mismatch exists) is what flags it.
  { receiptId: 'rcpt_seed_verified', requestId: 'req-105', actor: { id: 'chatgpt' }, effect: 'OK', thread: { after: 'thread-e' } },
];
const OUTCOMES = [
  { requestId: 'req-102', effect: 'OK', evidenceState: 'CLAIMED' },
  { requestId: 'req-103', effect: 'SEND_FAILED' },
  { requestId: 'req-104', effect: 'OK', evidenceState: 'observed' },
  { requestId: 'req-105', effect: 'OK', evidenceState: 'observed' },
];

export default defineFixture({
  id: 'HQ-052',
  provenance:
    '2026-11-11 (this session): locked from the engine named by hq/aii/assessments/lane-6.json HQ-052 capSurfaces. ' +
    'evidenceTasks(receipts, outcomes) (hq/lib/dogfood.mjs:857-899) was exercised on seeded receipts/outcomes covering ' +
    'each unverified-success shape (no workspace writes). Live recon register re-derived this session by reading ' +
    'dogfood/recon/*.json: 18 rows with statuses {blocked:3, partial:12, absent:2, proven:1}; RECON_STATES ' +
    "(dogfood.mjs:45) = ['proven','partial','blocked','absent'] — 'not_verified' means unproven, never missing " +
    '(dogfood.mjs:18). The live recon count is re-derived at run time; the seeded classification is pinned.',
  expected: [
    { what: 'an OK effect with no outcome for its requestId is unproven, not fine', where: 'hq/lib/dogfood.mjs evidenceTasks' },
    { what: 'evidence state CLAIMED with an OK effect is not independent verification', where: 'hq/lib/dogfood.mjs evidenceTasks' },
    { what: 'an OK effect contradicted by its outcome effect is flagged for verification', where: 'hq/lib/dogfood.mjs evidenceTasks' },
    { what: 'a receipt touching a placeholder/live-tab thread is flagged', where: 'hq/lib/dogfood.mjs evidenceTasks' },
    { what: 'a receipt whose outcome is OK with observed evidence state passes as verified', where: 'hq/lib/dogfood.mjs evidenceTasks' },
    { what: /^the live dogfood recon register holds \d+ rows with statuses \{.*\} — unproven rows are ranked work, not success$/, where: 'dogfood/recon' },
  ],
  run: async () => {
    const findings = [];
    const { tasks, defects } = evidenceTasks(RECEIPTS, OUTCOMES);
    const whyOf = (requestId) => tasks.find((t) => t.proof?.includes(requestId))?.quote ?? null;

    if (whyOf('req-101') !== 'effect OK but no outcome for this requestId') {
      throw new Error(`req-101 not flagged as OK-without-outcome: ${JSON.stringify(tasks)}`);
    }
    findings.push(finding('an OK effect with no outcome for its requestId is unproven, not fine', 'hq/lib/dogfood.mjs evidenceTasks'));

    if (whyOf('req-102') !== 'evidence state is CLAIMED, not observed') {
      throw new Error(`req-102 not flagged as CLAIMED: ${JSON.stringify(tasks)}`);
    }
    findings.push(finding('evidence state CLAIMED with an OK effect is not independent verification', 'hq/lib/dogfood.mjs evidenceTasks'));

    if (whyOf('req-103') !== 'effect OK but outcome says SEND_FAILED') {
      throw new Error(`req-103 not flagged as disagreeing: ${JSON.stringify(tasks)}`);
    }
    findings.push(finding('an OK effect contradicted by its outcome effect is flagged for verification', 'hq/lib/dogfood.mjs evidenceTasks'));

    if (!/placeholder thread/.test(whyOf('req-104') ?? '')) {
      throw new Error(`req-104 not flagged as placeholder: ${JSON.stringify(tasks)}`);
    }
    findings.push(finding('a receipt touching a placeholder/live-tab thread is flagged', 'hq/lib/dogfood.mjs evidenceTasks'));

    if (whyOf('req-105') !== null) throw new Error(`verified receipt was flagged: ${whyOf('req-105')}`);
    findings.push(finding('a receipt whose outcome is OK with observed evidence state passes as verified', 'hq/lib/dogfood.mjs evidenceTasks'));
```

_First 80 of 94 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
