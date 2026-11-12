// HQ-064: What evidence would distinguish the competing explanations for this bug?
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { defineFixture, finding } from './harness.mjs';

const manifest = fileURLToPath(new URL('../../../research/rust-knowledge-graph/Cargo.toml', import.meta.url));
const where = 'research/rust-knowledge-graph/examples/observability_probe.rs';
export default defineFixture({
  id: 'HQ-064',
  provenance: 'Locked 2026-11-11 from actual cargo run --quiet --manifest-path <crate>/Cargo.toml --example observability_probe, exit 0, after vivim.rust-causal-attribution/1 repair. Synthetic workflow, fixed clock 200, caller-trusted seeded evidence; not production verification. Exact stdout lines retained below, not derived from source-text presence.',
  expected: [
    { what: 'contract=vivim.rust-causal-attribution/1', where },
    { what: 'HQ-064 discriminators=["delivery-ack", "failure-receipt"]', where },
    { what: 'HQ-064 supports=[("delivery-ack", "delivery-completed"), ("failure-receipt", "upstream-regression")]', where },
    { what: 'HQ-064 untrusted_discriminators=0', where },
    { what: 'HQ-064 foreign_subject_rejected=true', where },
  ],
  async run() {
    const result = spawnSync('cargo', ['run', '--quiet', '--manifest-path', manifest, '--example', 'observability_probe'], {
      cwd: fileURLToPath(new URL('../../../', import.meta.url)), encoding: 'utf8', windowsHide: true, timeout: 120_000,
    });
    if (result.error || result.status !== 0) throw new Error(`Rust probe exit=${result.status}: ${result.error?.message ?? ''}\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
    return result.stdout.trim().split(/\r?\n/).filter((line) => line.startsWith('contract=') || line.startsWith('HQ-064 ')).map((line) => finding(line, where));
  },
});
