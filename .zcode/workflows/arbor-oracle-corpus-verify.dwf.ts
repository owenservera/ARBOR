/* zcode-workflow
description: "Oracle ChatGPT onboarding corpus: bounded independent post-push verification. Runs existing deterministic Host/Studio tests only; no model asks, browser sends, account extraction, writes, branches, or automatic retries."
whenToUse: "After ChatGPT Cloud Dev pushes an Oracle onboarding change to ARBOR main, on a clean exact-SHA isolated source checkout. Repeat once after each defect fix, then stop."
*/
// ZCode test scout — deterministic and read-only to both provider and product state.
// Source changes belong to ChatGPT Cloud Dev + canonical GitHub main, not this workflow.
// Operator must start ZCode in a clean checkout pinned to current origin/main. No
// account credentials, live ChatGPT chats or personal corpus content are test inputs.
phase("Admit exact source revision");
const head = await world.run("git", ["rev-parse", "HEAD"], { output: { tail: 2048 } });
const origin = await world.run("git", ["rev-parse", "refs/remotes/origin/main"], { output: { tail: 2048 } });
const dirty = await world.run("git", ["status", "--porcelain", "--untracked-files=no"], { output: { tail: 2048 } });
if (head.exitCode !== 0 || origin.exitCode !== 0 || dirty.exitCode !== 0 ||
    !/^[a-f0-9]{40}$/.test(head.stdout.trim()) ||
    head.stdout.trim() !== origin.stdout.trim() || dirty.stdout.trim()) {
  throw new Error("BLOCKED_SOURCE_UNPINNED: run on a clean, post-push checkout with HEAD==origin/main; never patch owner's dirty ARBOR checkout.");
}
const sourceSha = head.stdout.trim();
log("Oracle scout source SHA: " + sourceSha);

phase("Replay existing Host + Studio onboarding and corpus tests");
const suites = [
  "apps/vivim-host/test/oracle-onboarding-prompts.test.mjs",
  "apps/vivim-host/test/onboarding.test.mjs",
  "apps/vivim-host/test/bootstrap.test.mjs",
  "apps/vivim-host/test/bootstrap-grant.test.mjs",
  "apps/vivim-host/test/oracle-wiki-wiring.test.mjs",
  "apps/vivim-host/test/wiki-visual-contract.test.mjs",
  "apps/vivim-host/test/product-routes.test.mjs",
  "apps/mobile-relay/test/wiki-live-context.test.mjs",
  "apps/mobile-relay/test/host-preview-mode.test.mjs"
];
const testRun = await world.run("node", ["--test", ...suites], { output: { tail: 12000 } });
const evidence = testRun.stdout + "\n" + testRun.stderr;
const count = (name: string): number | null => {
  const row = new RegExp("(?:^|\\n)\\s*(?:ℹ|#)\\s*" + name + "\\s+(\\d+)", "m").exec(evidence);
  return row ? Number(row[1]) : null;
};
const nPass = count("pass"), nFail = count("fail"), nTests = count("tests");
const accepted = testRun.exitCode === 0 && nPass !== null && nPass > 0 && nFail === 0 && nTests === nPass;
log("Oracle scout: SHA=" + sourceSha + " tests=" + nTests + " pass=" + nPass +
    " fail=" + nFail + " exit=" + testRun.exitCode + " providerAccountSends=0 (ZCode model admission is external to this test runner)");
if (!accepted) throw new Error("ORACLE_REGRESSION: " + evidence.slice(-4000));

phase("Record bounded outcome and next validation boundary");
log("PASS deterministic unit/integration simulation at SHA " + sourceSha +
    ". UNRUN: GPUI Rust desktop executable compile, actual signed-in ChatGPT Studio extraction, real owner-approved seven-pass ingestion, " +
    "physical GPUI/PWA AutoWiki projection. No browser, Host or provider effects were attempted. " +
    "Stop after this one verification; return any failure as a repro for ChatGPT Cloud Dev.");
