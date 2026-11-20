# File: hq/test/walk-bin-source.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/walk-bin-source.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5301 B |
| Lines | 123 |
| Hash | a6347a7aa4bf |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| fixture | function | 19 | no | function fixture(files) { |
| dir | const | 20 | no | const dir = mkdtempSync(join(tmpdir(), &#39;hq-walk-bin-&#39;)); |
| full | const | 22 | no | const full = join(dir, rel); |
| rels | function | 29 | no | function rels(dir, opts) { |
| dir | const | 39 | no | const dir = fixture({ &#39;bin/cli.mjs&#39;: &#39;export function main() { return 1; }\\n&#39;, &#39;tools/bin/second.mjs&#39;: &#39;export const two = 2;\\n&#39;, &#39;plain.txt&#39;: &#39;y&#39;, }); |
| got | const | 45 | no | const got = rels(dir); |
| files | const | 63 | no | const files = { |
| dir | const | 73 | no | const dir = fixture(files); |
| got | const | 84 | no | const got = discoverFiles(dir).map((entry) =&gt; entry.rel).sort(); |
| dir | const | 94 | no | const dir = fixture({ &#39;bin/compiled.bin.mjs&#39;: Buffer.from([0x00, 0x01, 0x02, 0x03]), &#39;bin/cli.mjs&#39;: &#39;export const one = 1;\\n&#39;, }); |
| got | const | 99 | no | const got = rels(dir); |
| dir | const | 108 | no | const dir = fixture({ &#39;dist/hq-single/package.json&#39;: &#39;{}&#39;, &#39;build/derived.js&#39;: &#39;y&#39;, &#39;out/artifact.txt&#39;: &#39;z&#39;, &#39;src/real.mjs&#39;: &#39;export const real = true;\\n&#39;, |
| got | const | 115 | no | const got = rels(dir); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 10 | external |
| node:assert/strict | import | 11 | external |
| node:path | import | 12 | external |
| node:fs | import | 13 | external |
| node:os | import | 14 | external |
| node:child_process | import | 15 | external |
| ../lib/git.mjs | import | 16 | [hq/lib/git.mjs](../lib/git.mjs.md) |
| ../lib/walk.mjs | import | 17 | [hq/lib/walk.mjs](../lib/walk.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/walk-bin-source.test.mjs — bin/ directories are source, not build output.
//
// Regression fixture (Z.ai R1): DEFAULT_IGNORES used to contain the bare name
// 'bin', which made discoverFiles skip every bin/ directory. In this workspace
// those directories are hand-written CLI source (repos-hq hq/bin, vivim-web-harness
// harness/bin and studio/bin), so the index, context, search and wiki were blind
// to the CLI surface — `hq context` could not even find cmdCheck inside
// hq/bin/hq.mjs. This test pins the repaired behavior so it cannot silently
// regress, and pins the protections that still hold for real build output.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { git, isGitRepo, lsTracked } from '../lib/git.mjs';
import { discoverFiles, DEFAULT_IGNORES } from '../lib/walk.mjs';

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'hq-walk-bin-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(dir, rel.split('/').slice(0, -1).join('/')), { recursive: true });
    writeFileSync(full, content ?? 'x', 'utf8');
  }
  return dir;
}

function rels(dir, opts) {
  return discoverFiles(dir, { useGit: false, ...opts }).map((e) => e.rel).sort();
}

test('DEFAULT_IGNORES no longer contains the bare name bin', () => {
  assert.equal(DEFAULT_IGNORES.includes('bin'), false);
  assert.equal(DEFAULT_IGNORES.includes('dist'), true);
});

test('a tracked-style bin/ directory with text CLI source is discovered', () => {
  const dir = fixture({
    'bin/cli.mjs': 'export function main() { return 1; }\n',
    'tools/bin/second.mjs': 'export const two = 2;\n',
    'plain.txt': 'y',
  });
  try {
    const got = rels(dir);
    assert.equal(got.includes('bin/cli.mjs'), true, 'nested bin/ source must be visible');
    assert.equal(got.includes('tools/bin/second.mjs'), true);
    assert.equal(got.includes('plain.txt'), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('default Git-backed discovery includes tracked bin source but excludes binary and generated output', (t) => {
  try {
    execFileSync('git', ['--version'], { stdio: 'pipe', windowsHide: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    t.skip('Git executable unavailable; Git-backed discovery gate not run');
    return;
  }

  const files = {
    '.gitignore': 'bin/ignored-untracked.mjs\n',
    'bin/cli.mjs': 'export function main() { return 1; }\n',
    'bin/compiled.bin.mjs': Buffer.from([0x00, 0x01, 0x02, 0x03]),
    'bin/cli.bundle.mjs': 'export const bundled = true;\n',
    'generated/derived.mjs': 'export const generated = true;\n',
    'dist/derived.mjs': 'export const dist = true;\n',
    'build/derived.mjs': 'export const build = true;\n',
    'out/derived.mjs': 'export const out = true;\n',
  };
  const dir = fixture(files);
  try {
    // Only this disposable repository's index is written; no commit/config is needed.
    git(dir, ['init']);
    git(dir, ['add', '-f', '--', ...Object.keys(files)]);
    assert.equal(isGitRepo(dir), true, 'fixture must select the actual Git-backed path');
    assert.deepEqual(lsTracked(dir).tracked.sort(), Object.keys(files).sort());
```

_First 80 of 124 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
