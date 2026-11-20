# File: hq/aii/fixtures/HQ-065-root-cause.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/aii/fixtures/HQ-065-root-cause.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2080 B |
| Lines | 25 |
| Hash | 610cedb00591 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| manifest | const | 6 | no | const manifest = fileURLToPath(new URL(&#39;../../../research/rust-knowledge-graph/Cargo.toml&#39;, import.meta.url)); |
| result | const | 19 | no | const result = spawnSync(&#39;cargo&#39;, [&#39;run&#39;, &#39;--quiet&#39;, &#39;--manifest-path&#39;, manifest, &#39;--example&#39;, &#39;observability_probe&#39;], { cwd: fileURLToPath(new URL(&#39;../../../&#39;, import.meta.url)), encoding: &#39;utf8&#39;, w… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 2 | external |
| node:url | import | 3 | external |
| ./harness.mjs | import | 4 | [hq/aii/fixtures/harness.mjs](./harness.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// HQ-065: What is the actual root cause of this failed workflow?
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { defineFixture, finding } from './harness.mjs';

const manifest = fileURLToPath(new URL('../../../research/rust-knowledge-graph/Cargo.toml', import.meta.url));
const where = 'research/rust-knowledge-graph/examples/observability_probe.rs';
export default defineFixture({
  id: 'HQ-065',
  provenance: 'Locked 2026-11-11 from actual cargo run --quiet --manifest-path <crate>/Cargo.toml --example observability_probe, exit 0, after vivim.rust-causal-attribution/1 repair. Synthetic trusted-adapter attestations of controlled reproduction/revert, not real experiments or production causality. Bare failure is unresolved; only independent revision-bound causal linkage confirms. Exact stdout captured before authoring.',
  expected: [
    { what: 'contract=vivim.rust-causal-attribution/1', where },
    { what: 'HQ-065 bare_failure=UNRESOLVED diagnostic=verified_command_failure hypotheses=1 revision=seed-candidate-2', where },
    { what: 'HQ-065 linked=CONFIRMED cause=upstream-regression revision=seed-candidate-2 baseline=seed-baseline-1 symptom=failure-receipt causal_evidence=seed-controlled-revert', where },
    { what: 'HQ-065 healthy_unresolved=true', where },
    { what: 'HQ-065 scope=synthetic-trusted-adapter-attestations-not-production-causality', where },
  ],
  async run() {
    const result = spawnSync('cargo', ['run', '--quiet', '--manifest-path', manifest, '--example', 'observability_probe'], {
      cwd: fileURLToPath(new URL('../../../', import.meta.url)), encoding: 'utf8', windowsHide: true, timeout: 120_000,
    });
    if (result.error || result.status !== 0) throw new Error(`Rust probe exit=${result.status}: ${result.error?.message ?? ''}\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
    return result.stdout.trim().split(/\r?\n/).filter((line) => line.startsWith('contract=') || line.startsWith('HQ-065 ')).map((line) => finding(line, where));
  },
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
