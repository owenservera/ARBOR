# File: hq/test/day-one-context.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/day-one-context.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6407 B |
| Lines | 128 |
| Hash | f068c96aa6f8 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 19 | no | const ROOT = join(import.meta.dir, &#39;..&#39;, &#39;..&#39;); |
| AGENTS_PATH | const | 22 | no | const AGENTS_PATH = join(ROOT, &#39;AGENTS.md&#39;); |
| DAY_ONE_PRESENT | const | 23 | no | const DAY_ONE_PRESENT = existsSync(AGENTS_PATH) &amp;&amp; existsSync(join(ROOT, &#39;docs&#39;, &#39;AGENT-BUS.md&#39;)); |
| DAY_ONE_SKIP | const | 24 | no | const DAY_ONE_SKIP = DAY_ONE_PRESENT ? false |
| AGENTS | const | 26 | no | const AGENTS = DAY_ONE_PRESENT ? readFileSync(AGENTS_PATH, &#39;utf8&#39;) : &#39;&#39;; |
| BUS | const | 27 | no | const BUS = DAY_ONE_PRESENT ? readFileSync(join(ROOT, &#39;docs&#39;, &#39;AGENT-BUS.md&#39;), &#39;utf8&#39;) : &#39;&#39;; |
| BUS_PATH | const | 28 | no | const BUS_PATH = join(ROOT, &#39;docs&#39;, &#39;AGENT-BUS.md&#39;); |
| SYNC_PRESENT | const | 29 | no | const SYNC_PRESENT = existsSync(join(ROOT, &#39;scripts&#39;, &#39;sync.mjs&#39;)); |
| suite | const | 32 | no | const suite = DAY_ONE_PRESENT ? describe : describe.skip; |
| BUN | const | 33 | no | const BUN = process.env.BUN_BINARY \|\| &#39;bun&#39;; |
| run | function | 34 | no | const run = (args) =&gt; spawnSync(BUN, args, { cwd: ROOT, encoding: &#39;utf8&#39;, timeout: 60000 }); |
| doc | const | 58 | no | const doc = join(ROOT, &#39;docs&#39;, &#39;AGENT-BUS.md&#39;); |
| text | const | 60 | no | const text = readFileSync(doc, &#39;utf8&#39;); |
| globalPath | const | 77 | no | const globalPath = join(process.env.USERPROFILE \|\| process.env.HOME \|\| &#39;&#39;, &#39;.zcode&#39;, &#39;AGENTS.md&#39;); |
| text | const | 81 | no | const text = readFileSync(globalPath, &#39;utf8&#39;); |
| text | const | 91 | no | const text = readFileSync(globalPath, &#39;utf8&#39;); |
| r | const | 100 | no | const r = run([&#39;hq/bin/hq.mjs&#39;, &#39;seat&#39;, &#39;help&#39;]); |
| r | const | 107 | no | const r = run([&#39;hq/bin/hq.mjs&#39;, &#39;comms&#39;, &#39;--help&#39;]); |
| r | const | 115 | no | const r = run([&#39;scripts/sync.mjs&#39;, &#39;help&#39;]); |
| r | const | 123 | no | const r = run([&#39;hq/bin/hq.mjs&#39;, &#39;comms&#39;]); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 14 | external |
| node:fs | import | 15 | external |
| node:path | import | 16 | external |
| node:child_process | import | 17 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | A new conversation must be able to communicate on day one: the contract lives in the file the |
| 4 | owner | channel-manager | — | channel-manager |
| 5 | task | — | — | day-one-context |
| 6 | invariant | — | — | the test executes the commands the contract names; a stale instruction fails here. |
| 7 | see | — | docs/AGENT-BUS.md | docs/AGENT-BUS.md |

## Excerpt

```javascript
/**
 * @hq:context A new conversation must be able to communicate on day one: the contract lives in the file the
 *   harness injects (AGENTS.md), and every command it names must actually run.
 * @hq:owner channel-manager
 * @hq:task day-one-context
 * @hq:invariant the test executes the commands the contract names; a stale instruction fails here.
 * @hq:see docs/AGENT-BUS.md
 *
 * 2bf032a (2026-11-10) consolidated AGENTS.md: the day-one essentials (first-act check, live-state
 * view, the bus-does-not-wake rule) stay INLINE, and the full contract — the four channels and the
 * failure-mode rules — lives in docs/AGENT-BUS.md, which the injected file names. The assertions
 * below pin the contract at both of those homes, so moving or deleting either half fails here.
 */
import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = join(import.meta.dir, '..', '..');
// AGENTS.md is the harness-injected day-one file and is not committed in this
// checkout. Skipped loudly rather than failing the gate on an absent file.
const AGENTS_PATH = join(ROOT, 'AGENTS.md');
const DAY_ONE_PRESENT = existsSync(AGENTS_PATH) && existsSync(join(ROOT, 'docs', 'AGENT-BUS.md'));
const DAY_ONE_SKIP = DAY_ONE_PRESENT ? false
  : 'orphaned suite: AGENTS.md / docs/AGENT-BUS.md are absent from this checkout';
const AGENTS = DAY_ONE_PRESENT ? readFileSync(AGENTS_PATH, 'utf8') : '';
const BUS = DAY_ONE_PRESENT ? readFileSync(join(ROOT, 'docs', 'AGENT-BUS.md'), 'utf8') : '';
const BUS_PATH = join(ROOT, 'docs', 'AGENT-BUS.md');
const SYNC_PRESENT = existsSync(join(ROOT, 'scripts', 'sync.mjs'));

if (!DAY_ONE_PRESENT) console.warn('SKIP: ' + DAY_ONE_SKIP);
const suite = DAY_ONE_PRESENT ? describe : describe.skip;
const BUN = process.env.BUN_BINARY || 'bun';
const run = (args) => spawnSync(BUN, args, { cwd: ROOT, encoding: 'utf8', timeout: 60000 });

suite('day-one context in the injected file', () => {
  test('the comms contract is inline in AGENTS.md, not only a link', () => {
    expect(AGENTS).toContain('### Local HQ agent communications');
    // The two commands a day-one agent runs first, by the command that implements each one.
    expect(AGENTS).toContain('bun scripts/sync.mjs check --as <agent-id>');
    expect(AGENTS).toContain('bun hq/bin/hq.mjs comms');
    // The rule that stops the first known failure mode, stated inline and not only linked.
    expect(AGENTS).toContain('A bus message alone does not wake another seat');
    // The long form is named, never assumed.
    expect(AGENTS).toContain('AGENT-BUS.md');
  });

  test('the rules that stop the known failure modes are stated', () => {
    expect(AGENTS).toContain('check unread messages before changing shared work');
    expect(AGENTS).toContain('bun hq/bin/hq.mjs comms');
    expect(BUS).toContain('First act of every turn');
    expect(BUS).toContain('Bus delivery is not a wake');
    expect(BUS).toContain('never a receipt');
    expect(BUS).toContain('topic: agent-bus');
  });

  test('the long form is where the contract says it is', () => {
    const doc = join(ROOT, 'docs', 'AGENT-BUS.md');
    expect(existsSync(doc)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    // The four channels, by the command that implements each one.
    expect(text).toContain('bun scripts/sync.mjs send');
    expect(text).toContain('bun hq/bin/hq.mjs seat wake');
    expect(text).toContain('SendMessage');
    expect(text).toContain('anet delegate');
    // A wake is proven by the seat's reply, never by an acknowledgement — the rule that
    // the AGENTS.md consolidation moved here, still pinned at its current home.
    expect(text).toContain('reply in the dispatch result');
    expect(text).toContain('verified vs claimed');
    expect(text).toContain('Known defects');
  });
});

describe('the global instruction file carries the same contract', () => {
  // ~/.zcode/AGENTS.md is injected into EVERY project, so the universal rules
  // must live there too — otherwise "day one" only holds inside repos_hq.
  const globalPath = join(process.env.USERPROFILE || process.env.HOME || '', '.zcode', 'AGENTS.md');

  test('the global file exists and states the universal rules', () => {
    if (!existsSync(globalPath)) return;                      // machine without it: nothing to assert
```

_First 80 of 129 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
