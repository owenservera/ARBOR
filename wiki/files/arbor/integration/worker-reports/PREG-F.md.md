# File: integration/worker-reports/PREG-F.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | integration/worker-reports/PREG-F.md |
| Language | Markdown |
| Kind | doc |
| Size | 16971 B |
| Lines | 119 |
| Hash | aa5b31f24eca |
| Test | no |
| Generated | no |
| Component | integration |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```markdown
# ARBOR Proposal 5 — PRE-G Lane F FINAL FREEZE

**Verdict: FREEZE_READY for G source/evidence integration only. NOT beta GO, BUILD_PASS, HOST_WIRED, SECURITY_ACCEPTED or DEVICE_ACCEPTED.**

- Repository: `owenservera/ARBOR`
- Frozen branch: `work/p5-w01-f-verify`
- **Frozen HEAD:** the exact Git commit introducing **this** `PREG-F.md`; master G/referee MUST resolve `refs/heads/work/p5-w01-f-verify` and pin its immutable SHA after this commit. A self-referential commit SHA cannot be embedded inside the committed file.
- **Last code/evidence HEAD before report:** `7538ebc706f98c15530fe39ba3a40b479448b37f`
- **Original common base:** `dd245d78ff3c110ba8630cad557ea0479c51a635`, not an approved W0-G baseline.
- **Integration branch:** `integrate/proposal5-beta-r001` absent in pre-G review; G exclusively creates/merges it.
- Freeze work order: `work/p5-pre-g-convergence-r001:.integration/proposal5/pre-g/prompts/R2-F-FINAL-FREEZE.md`. Refreshed decision and original convergence read. **No additional feature/code work in this final freeze.**

## 1 — Exact source pins and physical source inventory

| Donor | Pinned source commit | Material physically imported on F | Exact proof |
| --- | --- | --- | --- |
| `owenservera/vivim-labs` | `022608f5797e7b4a14ccc4c393bd3c5a4704a4be` | **7 / 7 exact donor files**, byte-for-byte verified | `tests/migration/W01-F-ledger.v1.json`, `W01-F-proof.v1.json` |
| `owenservera/vivim-web-harness` | `cae97afe848d79957c9d6c698a90996a758bfd56` | **0 executable Host donor files.** Derived **test-only** catalog baseline from `control/action-catalog.v1.json` v6 + journal read semantics | B is the exclusive real Host importer |
| `owenservera/repos-hq` | `9b922ea049dbadc94e504b5b9432743995c020ca` | **0 original HQ files**; source-derived identity/evidence contract only | D alone imports HQ source |
| `owenservera/tierflow` | `50822f11ee63c3d80f631f8fea7dcb9b19bffc38` | **0 original TierFlow files**; inert-view typed mirror only | E alone imports renderer |

**Exact 7 source-preserving donor files → ARBOR destination:**

1. `vivim/voice-to-tasks/workbench/fixtures.json` → `tests/fixtures/labs/voice-to-tasks/fixtures.json`
2. `vivim/voice-to-tasks/workbench/trace-check.mjs` → `tests/fixtures/labs/voice-to-tasks/trace-check.mjs`
3. `capability-observatory/data/capabilities.json` → `tests/fixtures/labs/capability-observatory/seed.json`
4. `capability-observatory/schemas/capabilities.schema.json` → `tests/fixtures/labs/capability-observatory/schema.json`
5. `chronos-toolkit/wave2/repos-hq/contracts/chronos/contract.v1.json` → `contracts/chronos/staged-contract.v1.json`
6. `personal-knowledge-lifecycle/runtime/src/chatgpt-normalize.mjs` → `tests/fixtures/labs/personal-knowledge/src/chatgpt-normalize.mjs`
7. `personal-knowledge-lifecycle/runtime/tests/chatgpt-normalize.test.mjs` → `tests/fixtures/labs/personal-knowledge/tests/chatgpt-normalize.test.mjs`

Original donor **blob SHA for each source and target**, implementation status, privacy class and retirement condition: `tests/migration/W01-F-ledger.v1.json`. These are synthetic/pure/test artifacts, not a second personal knowledge ingestion owner or runtime.

**ARBOR-authored files added beyond the 7 exact donor files:**
- `contracts/interop/v1/{README.md,protocol.schema.json,types.ts,types.rs,validate.mjs}`: minimal source/ref, revision, capability, evidence, event, status and inert view mirrors. Rust type file is not yet Cargo-linked.
- `contracts/extension-ports/source-hooks.v1.json`: **descriptive, non-installing** extension seam census.
- `capability-spaces/source-truth.v1.json`: read-only classification inventory; all `releaseReady=false`.
- `tests/compatibility/{host-actions.baseline.v1.json,synthetic-projections.v1.json,wave1f.test.mjs}`: Host catalog drift baseline and synthetic source/receipt cases.
- `tests/privacy/{w01-f-source-lint.mjs,w01-f-source-lint.test.mjs}`: scoped donor-path/secret-shaped-file guard; **not** a complete security scan.
- `tests/migration/{W01-F-ledger.v1.json,W01-F-proof.v1.json}`: exact provenance and observed test ledger.
- `integration/worker-reports/W01-F.md`: original handoff.
- **This file**: `integration/worker-reports/PREG-F.md` (report only).

**Deliberately excluded:** Labs Node 0 R001 mutex/thread-per-edit implementation (not present at referenced Labs main path, separate uncompiled draft); full R007 visual lab; private ChatGPT exports, transcripts, audio, device profiles, credentials, World databases; Labs T0 coordinator/write store and ingestion adapters; Chronos daemon/scheduler; third-party extension loader/marketplace; AutoWiki/Rock Core new implementation; second Host catalog, journal, native graph engine or UI publisher.

**Status taxonomy here:** `IMPLEMENTED` = code observed at source, `VERIFIED` = synthetic/source-side test material, `PREVIEW` = conditional/non-effectful, `DESIGN_ONLY` = specification, `DEFERRED` = intentionally not shipped, `BLOCKED` = missing proof/dependency. No source-status label asserts availability or device acceptance.

## 2 — Complete Lane F commit chain, including prior focused work

| SHA | Change type | Exact change |
| --- | --- | --- |
| `106d7cfd230294d50241524401bdab5b2edb3244` | **SOURCE_IMPORTED + CONTRACTS/TESTS** | Initial 21 files: 7 exact Labs donor copies + 14 ARBOR-authored contract/evidence/test files (includes `W01-F.md`), no other lane files |
| `43cf1edaf87d7b6d52c1e64ccdee597656700beb` | **SOURCE_PATCHED** | Fix over-escaped source-ID control-character validator in `contracts/interop/v1/validate.mjs` after smoke caught false refusal |
| `7538ebc706f98c15530fe39ba3a40b479448b37f` | **EVIDENCE ONLY** | Updated `W01-F.md` + added `tests/migration/W01-F-proof.v1.json`, 25 V8 pure assertions and 7/7 donor equality recorded |
| **This report's new Git commit (resolve branch tip)** | **DOCUMENT ONLY** | `PREG-F.md`; nothing executable or other lane changed |

The already-completed first focused follow-up and actual verification are fully accounted for by `43cf1eda...` and `7538ebc7...`. **No unreported second runtime implementation or new test execution.** The branch's common parent is exactly `dd245d78...`; G must reconcile the later architecture changes during serial merge. No root workspace, lockfile, other worker branch or `main` edits.

## 3 — Canonical authority/contract owners and exact Host regression baseline

- **B Host** owns action catalog v6, 19 source actions, World, owner grants, planning, approvals, exclusive journal effect fence, claim/receipt/recovery and single effect writer. **F's JSON is test-only**, never a dispatcher or alternate availability catalog.
- **A Rust/Tauri** owns native origin/actor/process attestation and HQKG computation, with **no duplicate Host effect authority**.
- **C Studio** owns signed-in Chrome/CDP, exact provider/thread targeting, local send-once/uncertain outcome fencing; must flow through B Host effect/admission.
- **D HQ** owns in-ARBOR Development-domain index/search/context/wiki with source identity, allowlisted roots and grant-derived read scope, never Personal World data.
- **E PWA/TierFlow** owns mobile presentation, browser signer and inert visual projections; Host remains only device/grant/effect/publisher authority.
- **F** owns interop/schema baselines, evidence classifications, differential and negative tests.
- **G** alone owns serial source merger, root Bun/Cargo and lockfiles, release/CI integration, final combined acceptance.

**Host v6 exact action ID → risk/readiness, in test baseline** (`source_wired` except explicitly noted):
`control.catalog.list R0`; `vivim.status.show R0`; `devices.summary R0`; `devices.approve R2`; `devices.revoke R2`; `personalization.context.summary R0`; `personalization.preference.list R0`; `personalization.preference.add R1`; `personalization.preference.remove R1`; `ui.theme.show R0`; `ui.theme.set_preset R1`; `ui.theme.undo R1`; `privacy.hard_no.list R0`; `privacy.hard_no.add R2`; `privacy.hard_no.clear R2`; `control.lexicon.teach R1`; `control.lexicon.forget R1`; `vivim.network.pause_egress R2 (enforcement_missing)`; `machine.network.disable_all R3 (unsupported)`.

**Invariants to test after G:** original ID, owner, risk, readiness and exact catalog digest; R3 never auto-admits; R2 requires actual desktop owner approval; plan digest/expiry/stale policy; a Host journal `claimed` without receipt projects **`uncertain`**, no automatic resend. TierFlow read statuses `available/permitted` or `reported_applied` do **not** certify a verified Host effect or grant. HQ `name@version` semantic registry is not a Host permission registry; synthetic Labs seed `integrated_test` is not `AVAILABLE_NOW`.

## 4 — Executed test evidence versus UNRUN (no inflated exit codes)

| Check / concrete command | Observed status | Exit code |
| --- | --- | --- |
| Connected GitHub source/commit/branch/ref and donor file reads | **PASSED SOURCE INSPECTION**: source pins, import paths and final pre-report head observed | **N/A** (API calls, not process) |
| Exact 7 Labs source files vs corresponding donor GitHub blobs/content | **PASSED**: **7/7 identical**, no changed donor bytes | **N/A** (API comparison) |
| Authored pure contract assertions run in connector V8 against committed source | **PASSED** **25/25**: source owner/revision, stale/refusal, Host uncertain claims, synthetic voice traces, Chronos staged, taxonomy and catalog count; after validator correction | **N/A** (in-process V8 checks, not shell) |
```

_First 80 of 120 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
