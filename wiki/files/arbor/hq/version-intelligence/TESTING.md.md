# File: hq/version-intelligence/TESTING.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/version-intelligence/TESTING.md |
| Language | Markdown |
| Kind | doc |
| Size | 8733 B |
| Lines | 182 |
| Hash | cc4c6e29101f |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

````markdown
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

The gate lives in `scripts/` and is the repository's canonical test runner:
`scripts/test-gate.mjs` over the committed manifest `scripts/test-manifest.json`.

---

## Commands

All commands are invoked from the repo root:

| Command | Behavior |
|---|---|
| `bun run test:gate` | Run the tests selected by impact analysis and write receipts. |
| `bun run test:gate --all` | Run the **full** manifest suite (271 tests), ignoring impact selection. |
| `bun run test:gate --plan` | Print the selection only; **no execution**. |
| `bun run test:gate --no-cache` | Bypass `.hq/test-cache/` entirely; force re-execution. |
| `bun run test:gate --explain` | Print why each test was selected. |
| `bun run test:gate --gate NAME` | Run only the named gate (repeatable). Each named gate forces a full run of that gate, so a receipt is never produced from a partial selection. |

**The canonical HVI gate** — the exact command CI runs and the exact command the
committed receipts were produced by:

```sh
bun scripts/test-gate.mjs --no-cache \
  --gate hvi-g1-g2 --gate hvi-host-read-port --gate hvi-discovery \
  --gate hvi-hq-boundary --gate hvi-tierflow-inspector --gate hvi-modules
```

### Gates

The `hvi-*` gates mirror the canonical CI contract **file-for-file**, so a
per-gate receipt is exactly the evidence the CI step claims.

| Gate | Files | What it covers |
|---|---|---|
| `hvi-g1-g2` | 6 | The G1/G2 synthetic schema, contract-QA, N-way and negative suites. |
| `hvi-host-read-port` | 2 | The Host read port and the development-source grant. |
| `hvi-discovery` | 1 | Native HQ capability discovery and invocation (the MCP tool). |
| `hvi-hq-boundary` | 3 | The existing HQ boundary suite. |
| `hvi-tierflow-inspector` | 1 | The TierFlow inert inspector. |
| `hvi-modules` | 6 | The HVI module suites (compare, identity, parity, report, sources, catalogue-identity). |

The wider repository is covered by `host-suite`, `hq-suite`, `interop`,
`compatibility` and `uncategorized`. The wider suites still carry pre-existing
failures that reproduce identically on `origin/main`, so they are an
operator-level gate rather than a CI gate until those are repaired.

---

## Runtime matrix

The runtime is declared per test in `scripts/test-manifest.json` and derived
from the test's **transitive import closure**, not from the test file alone:

| Runtime | Rule | Count |
|---|---|---|
| `node24-ajv` | the default; nothing in the closure needs bun or TypeScript | 193 |
| `bun` | anything in the closure imports a `bun:` module | 32 |
| `node-strip-types` | anything in the closure is or imports TypeScript | 46 |

The closure is what makes this correct: `packages/tierflow/tests/hvi-inspector.test.mjs`
imports `.mjs` files that in turn import `.ts`, so it needs type stripping even
though its own imports are all `.mjs`.

Node version in use: `v24.22.1` (per `engines.node: >=24`). AJV 8.17.1 is the
````

_First 80 of 183 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
