# G1 integration decision — G1_SOURCE_STAGED_TESTS_UNRUN

**Decision: REPAIR_REQUIRED. Promotion: NO.**
**Candidate code HEAD:** 0dfb08406c50df2e385c0ff924694e0aeaa33565
**Branch:** integrate/p5-hq-version-intelligence-r001
**Main baseline:** aece3618395f215d825bf4eb41dcc07d6d656ab7
**Acceptance main SHA:** none.

All S0/A-F/Z1X source and referee proofs have been serially staged on the exclusive G1 branch. The key incompatibilities have explicit versioned G-owned source repair adapters: A/C dual digest, C/E evidence-rich report, D parity join, B identity advisory, stricter v2 schemas, bounded grant-aware native library and synthetic-only CLI. A synthetic Node24 suite, 2/3/5 invented repos, T01-T24 negatives and offline replay are committed.

However **no actual Node24 G1 combined suite has executed**. The available local environment has only Node22 and no checkout; GitHub Actions reports startup_failure with zero jobs. The available evidence supports static source staging, not validated runtime or schema conformance. Main must not be updated from this candidate without observed tests and independent review.

No normal PR to main or merge was performed. GO_FOR_W2_TOOLING **not issued**; H/U must not use this branch as an accepted source pin. The beta gate remains BLOCKED_NOT_BETA. X real audit remains deferred pending explicit later user request.

Resume only after obtaining Node24 run receipts, repairing any failures, independent security review, a reviewed PR and normal merge. Until then, retain this branch and its exact blocker ledger.
