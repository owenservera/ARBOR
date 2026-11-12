# HVI Version Intelligence — Canonical Test Gate

HVI (HQ Version Intelligence) is tested as **synthetic, fail-closed, receipted**
testing, governed by the Proposal 5 scope correction:

- `.integration/proposal5/hq-version-intelligence/10-NATIVE-TOOLING-ONLY-SCOPE.md`
  — native tooling only; no real multi-repository / HQ migration audit in this wave.
- `.integration/proposal5/hq-version-intelligence/05-ACCEPTANCE-TEST-MATRIX.md`
  — HVI executable and negative acceptance matrix (T01–T24).

All HVI tests run on **synthetic invented Git fixtures and injected Git-object
adapters**. Synthetic same-repo SHA1/SHA2/SHA3 and distinct synthetic repositories
cover 2..N comparison, exact relocation, lineage, digest, incomplete scans,
invalid source/secret denial, redaction, authorization/revocation and offline
no-donor replay. Tests are not a real migration analysis.

---

## Commands

All gates are implemented in `scripts/test-gate.mjs` and invoked from the repo root:

| Command | Behavior |
|---|---|
| `bun run test:gate` | Run the **selected** tests (impact selection) and write a receipt. |
| `bun run test:gate --all` | Run the **full** HVI suite (every suite in the runtime matrix). |
| `bun run test:gate --plan` | Print the test selection only; **no execution**. |
| `bun run test:gate --no-cache` | Bypass the `.hq/test-cache/` cache; force re-execution. |
| `bun run test:gate --explain` | Print why each test was selected, then exit (no execution). |

Selection defaults to the HVI synthetic suites. When any change cannot be
classified as covered, the gate falls back to the full suite (fail-closed, see
below).

---

## Runtime matrix

| Runtime | Test scope | Notes |
|---|---|---|
| **Node 24** (HVI gate) | `tests/hq-version-intelligence/*.test.mjs`, `hq/version-intelligence/**/*.test.mjs`, `hq/catalogue-identity/test/crosswalk.test.mjs`, `apps/vivim-host/test/hvi-*.test.mjs` | AJV 8.17.1 is the schema validator (`tests/hq-version-intelligence/package.json` devDependency). G1 additionally runs a standards-compliant JSON Schema 2020-12 validator and the 10k-record bounded-query benchmark. |
| **Bun** | `hq/test/hvi-mcp-tool.test.mjs` | Native HQ HVI tool discovery, invoke, and refusal on non-synthetic / incomplete sources. |
| **node --experimental-strip-types** | `packages/tierflow/tests/hvi-inspector.test.mjs` | TierFlow inert inspector (type-stripped execution). |

Node version in use: `v24.22.1` (per `engines.node: >=24`).

---

## Fail-closed guarantees

1. **Unknown or uncovered changes → full suite.** If impact selection cannot
   prove a change is covered by an existing test, nothing is skipped and the
   full suite runs.
2. **No proof for failed or interrupted runs.** A receipt is only written when
   the gate exits cleanly with code 0. A non-zero exit, timeout, or interruption
   grants no proof and must be treated as UNRUN.
3. **Cache is never a substitute for execution.** The test cache lives under the
   gitignored `.hq/test-cache/` directory. A missing, corrupt, unreadable, or
   bypassed (`--no-cache`) cache forces full re-execution; cache hits are an
   optimization only and never replace a recorded exit code.
4. **A named test without an executed command + exit code is UNRUN.** GitHub
   source inspection is never test execution (per `05-ACCEPTANCE-TEST-MATRIX.md`
   truth rule).

---

## Receipts

- **Where they live:** `proofs/G2/` (git-committed evidence directory).
- **What they contain:** command, OS, tool versions (Node/Bun), commit SHA,
  totals (`tests`, `pass`, `fail`), exit code, `startedAt`/`finishedAt` (ISO),
  `durationMs`, `provenance`, `capabilityId`, `sourcePins`, `coverage`.

Receipt schema example: `arbor.proposal5.hvi.g2.receipt/1` (see
`proofs/G2/cli-offline-replay-receipt.json`).

---

## Offline no-donor replay

The HVI CLI supports replay without a donor checkout or any network:

```sh
node hq/version-intelligence/integration/cli.mjs \
  --synthetic-stdin < fixture.json
```

- The CLI accepts only `--synthetic-stdin` and requires every source manifest
  pin's `repoIdentity` to start with `synthetic/`.
- It routes through the same HQ code paths (`runHviTool`) as the registered
  capability, with `authorize: async () => true` for the synthetic operator path.
- Output is stamped `provenance: "SYNTHETIC_ONLY"`.

**What it proves:** offline replay of already-pinned manifests works with no
GitHub/API network (matrix T08); synthetic-only capability routing
(`arbor.hvi.compare.pinned/1`); and deterministic pin resolution across the
invented repo `synthetic/offline-replay` at pins v1/v2/v3 (3 source pins).

Receipt: `proofs/G2/cli-offline-replay-receipt.json` (single successful replay:
tests 1, pass 1, fail 0, exit code 0).

---

## Restrictions (synthetic-only boundary)

- **Synthetic invented Git fixtures only.** No real ARBOR / VIVIM / Labs
  repository comparisons.
- No provider APIs (no GitHub, no donor source acquisition).
- No browser automation.
- No personal corpus.
- No remote privileged access.
- No real source snapshots acquired for "dogfood"; no automatic comparisons
  when idle; no background watches.

The HVI tool never executes repo code, providers, browser automation, or
untrusted package hooks, and attacker-controlled Git content is treated as
untrusted data, not agent instructions (matrix T17–T24).
