# File: native/hqkg/tests/invalidate-revision.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | native/hqkg/tests/invalidate-revision.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2648 B |
| Lines | 58 |
| Hash | a3d5b36f373e |
| Test | yes |
| Generated | no |
| Component | native |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 13 | no | const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;../../..&#39;); |
| HQKG | const | 14 | no | const HQKG = path.join(ROOT, &#39;native/hqkg&#39;); |
| cargoTest | function | 16 | no | function cargoTest(target, filter) { |
| args | const | 17 | no | const args = [&#39;test&#39;, &#39;--test&#39;, target]; |
| out | const | 26 | no | const out = cargoTest(&#39;invalidate&#39;); |
| out | const | 31 | no | const out = cargoTest(&#39;invalidate&#39;, &#39;entity_invalidation_drops_only_affected_entries&#39;); |
| out | const | 36 | no | const out = cargoTest(&#39;invalidate&#39;, &#39;invalidate_epoch_drops_everything_below_new_epoch&#39;); |
| out | const | 41 | no | const out = cargoTest(&#39;invalidate&#39;, &#39;stale_watermark_mismatch_is_miss_with_entry_dropped&#39;); |
| out | const | 46 | no | const out = cargoTest(&#39;invalidate&#39;, &#39;watermark_must_cover_every_touched_node&#39;); |
| out | const | 51 | no | const out = cargoTest(&#39;scoped_graph&#39;); |
| out | const | 56 | no | const out = cargoTest(&#39;context_retrieval&#39;, &#39;watermark_staleness_records_both_versions&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:child_process | import | 3 | external |
| node:path | import | 4 | external |
| node:url | import | 5 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// A06 partition 5: revision-scoped invalidation + watermark fail-closed.
// Runs the Rust test targets that exercise InvalidateCache (invalidate.rs),
// scoped_graph gate_serve (scoped_graph.rs), and context_retrieval watermark
// staleness (context_retrieval.rs), then asserts the specific behaviors that
// the A06 acceptance criteria require: only-affected-bundle invalidation,
// epoch+watermark fail-closed hits, and cross-namespace serve rejection.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const HQKG = path.join(ROOT, 'native/hqkg');

function cargoTest(target, filter) {
  const args = ['test', '--test', target];
  if (filter) args.push(filter);
  return execFileSync('cargo', args, {
    cwd: HQKG,
    encoding: 'utf8',
  });
}

test('revision-scoped invalidation: invalidate Rust test target passes', () => {
  const out = cargoTest('invalidate');
  assert.match(out, /test result: ok\. 12 passed/);
});

test('revision-scoped invalidation: entity invalidation drops only affected entries', () => {
  const out = cargoTest('invalidate', 'entity_invalidation_drops_only_affected_entries');
  assert.match(out, /test entity_invalidation_drops_only_affected_entries \.\.\. ok/);
});

test('revision-scoped invalidation: epoch fence drops entries below new epoch', () => {
  const out = cargoTest('invalidate', 'invalidate_epoch_drops_everything_below_new_epoch');
  assert.match(out, /test invalidate_epoch_drops_everything_below_new_epoch \.\.\. ok/);
});

test('watermark fail-closed: stale watermark mismatch is miss with entry dropped', () => {
  const out = cargoTest('invalidate', 'stale_watermark_mismatch_is_miss_with_entry_dropped');
  assert.match(out, /test stale_watermark_mismatch_is_miss_with_entry_dropped \.\.\. ok/);
});

test('watermark fail-closed: partial watermark never validates a hit', () => {
  const out = cargoTest('invalidate', 'watermark_must_cover_every_touched_node');
  assert.match(out, /test watermark_must_cover_every_touched_node \.\.\. ok/);
});

test('scoped_graph: gate_serve and scoped records pass', () => {
  const out = cargoTest('scoped_graph');
  assert.match(out, /test result: ok\. 4 passed/);
});

test('context_retrieval: watermark staleness records both versions', () => {
  const out = cargoTest('context_retrieval', 'watermark_staleness_records_both_versions');
  assert.match(out, /test watermark_staleness_records_both_versions \.\.\. ok/);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
