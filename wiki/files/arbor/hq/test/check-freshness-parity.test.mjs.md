# File: hq/test/check-freshness-parity.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/check-freshness-parity.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5134 B |
| Lines | 114 |
| Hash | ee16260689b4 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REPO | const | 23 | no | const REPO = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;); |
| CLI | const | 24 | no | const CLI = join(REPO, &#39;hq&#39;, &#39;bin&#39;, &#39;hq.mjs&#39;); |
| dirname | function | 26 | no | function dirname(p) { return p.slice(0, Math.max(p.lastIndexOf(&#39;/&#39;), p.lastIndexOf(&#39;\\\\&#39;))); } |
| run | function | 28 | no | function run(workspace, args) { |
| out | const | 29 | no | const out = execFileSync(process.execPath, [CLI, ...args], { cwd: workspace, encoding: &#39;utf8&#39;, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;ignore&#39;], }); |
| fixedMtime | function | 37 | no | function fixedMtime(path, ms) { |
| d | const | 38 | no | const d = new Date(ms); |
| makeWorkspace | function | 42 | no | function makeWorkspace() { |
| ws | const | 44 | no | const ws = mkdtempSync(join(tmpdir(), &#39;hq-check-parity-&#39;)); |
| ws | const | 67 | no | const ws = makeWorkspace(); |
| indexed | const | 69 | no | const indexed = run(ws, [&#39;index&#39;, &#39;--json&#39;]); |
| check | const | 73 | no | const check = run(ws, [&#39;check&#39;, &#39;--strict&#39;, &#39;--json&#39;]); |
| verify | const | 79 | no | const verify = run(ws, [&#39;verify&#39;, &#39;--json&#39;]); |
| ws | const | 87 | no | const ws = makeWorkspace(); |
| before | const | 90 | no | const before = run(ws, [&#39;check&#39;, &#39;--strict&#39;, &#39;--json&#39;]); |
| after | const | 95 | no | const after = run(ws, [&#39;check&#39;, &#39;--json&#39;]); |
| ws | const | 104 | no | const ws = makeWorkspace(); |
| check | const | 108 | no | const check = run(ws, [&#39;check&#39;, &#39;--json&#39;]); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 15 | external |
| node:assert/strict | import | 16 | external |
| node:child_process | import | 17 | external |
| node:fs | import | 18 | external |
| node:os | import | 19 | external |
| node:path | import | 20 | external |
| node:url | import | 21 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/check-freshness-parity.test.mjs — `hq check`/`hq verify` must judge
// freshness against the same file universe the indexer walks.
//
// Regression fixtures (Z.ai R1): cmdCheck/cmdVerify used to walk with a
// hardcoded 10MB cap and no config ignores, while the indexer caps at
// config.maxFileBytes and honours config.ignores. Files between the two caps
// were reported as forever-new on every run, so `check --strict` could never
// pass on a clean clone of this workspace (real offenders: 6.8MB
// .work/blockers/records.jsonl, 3.2MB source-dispositions.v1.json). The same
// mismatch made generated output (wiki/) reappear as stale the moment it was
// written.
//
// The tests also pin the counter-capability: parity must not make the check
// toothless. A genuine edit within the cap must still be reported as changed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = join(REPO, 'hq', 'bin', 'hq.mjs');

function dirname(p) { return p.slice(0, Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'))); }

function run(workspace, args) {
  const out = execFileSync(process.execPath, [CLI, ...args], {
    cwd: workspace,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return JSON.parse(out);
}

function fixedMtime(path, ms) {
  const d = new Date(ms);
  utimesSync(path, d, d);
}

function makeWorkspace() {
  // index cap 200 bytes; old hardcoded walk cap was 10_000_000 bytes.
  const ws = mkdtempSync(join(tmpdir(), 'hq-check-parity-'));
  mkdirSync(join(ws, '.hq'), { recursive: true });
  writeFileSync(join(ws, '.hq', 'config.json'), JSON.stringify({
    db: '.hq/index.db',
    maxFileBytes: 200,
    ignores: ['generated-out'],
  }), 'utf8');
  // one registered space, relative path like real clean-clone registrations
  writeFileSync(join(ws, 'projects.json'), JSON.stringify({
    version: 1,
    projects: [{ name: 'demo', path: 'demo', tags: [], addedAt: '2026-11-10T00:00:00.000Z' }],
  }), 'utf8');
  // the space: one indexable file, one over the cap, one under an ignored dir
  mkdirSync(join(ws, 'demo', 'src'), { recursive: true });
  mkdirSync(join(ws, 'demo', 'big'), { recursive: true });
  mkdirSync(join(ws, 'demo', 'generated-out'), { recursive: true });
  writeFileSync(join(ws, 'demo', 'src', 'small.mjs'), 'export const one = 1;\n');
  writeFileSync(join(ws, 'demo', 'big', 'huge.mjs'), 'export const two = 2;\n'.repeat(40)); // ~640B > 200B cap, < 10MB
  writeFileSync(join(ws, 'demo', 'generated-out', 'page.md'), '# generated page\n');
  return ws;
}

test('check --strict is current when over-cap and ignored files are excluded by the index', () => {
  const ws = makeWorkspace();
  try {
    const indexed = run(ws, ['index', '--json']);
    assert.equal(indexed.totals.errors, 0);
    assert.deepEqual(indexed.projects.map((p) => p.added).sort(), [1], 'only src/small.mjs is indexable');

    const check = run(ws, ['check', '--strict', '--json']);
    assert.equal(check.ok, true);
    assert.equal(check.staleCount, 0);
    assert.equal(check.stale.filter((s) => s.path === 'big/huge.mjs').length, 0, 'over-cap file must not be forever-new');
    assert.equal(check.stale.filter((s) => s.path === 'generated-out/page.md').length, 0, 'config-ignored file must not be forever-new');

    const verify = run(ws, ['verify', '--json']);
    assert.equal(verify.staleCount, 0, 'verify uses the same parity rule');
```

_First 80 of 115 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
