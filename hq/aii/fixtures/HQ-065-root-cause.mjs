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
