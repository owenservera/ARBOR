# Native capabilities × deterministic VLANG — implementation receipt and sequence

**Date**: 2026-11-22 (Europe/Madrid). **Owner directive**: wire valuable Desktop Commander features **natively** into existing ARBOR; then prioritize user natural language → direct deterministic command with **no LLM required**.
**Source authority**: `owenservera/ARBOR` `main`. **External source donor**: `owenservera/DesktopCommanderMCP-VIVIM@9a101b17e44577f0baefa4c7120f087881c5cc56` (MIT). Background assessment: `vivim-labs/labs/harness-intake/DESKTOP-COMMANDER.md`.

## This execution's actual source changes

| GitHub commit | Path | Change | State |
|---|---|---|---|
| `f6633a27505621f7420cc5819504e2adb9401575` | `native/gpui-desktop/src/desktop_capture.rs` | Added `inspect_owned_directory`, an explicitly bounded metadata-only direct-directory reader (256 entries, regular-file count, total bytes, truncated flag). Skips symlinks and subdirectories; added pure regression test. | PUSHED; **test UNRUN** |
| `d30e1947ca044cd97af926d7d68854909d8a4fad` | `native/gpui-desktop/src/main.rs` | Existing Developer → Save diagnostic report now records metadata for VIVIM's screenshot folder or reports unavailable. No filenames/content. | PUSHED; **test UNRUN** |

No application source was modified through Desktop Commander/ZCode. No separate MCP runtime, custom shell service, remote device transport, second UI, or additional Host effect authority was added. This first native source slice is **not proof of GPUI rendering, a live owner device, or production readiness**.

### Build/review outstanding
1. Refresh `main` and confirm exact HEAD.
2. `cargo test --manifest-path native/gpui-desktop/Cargo.toml --lib --offline`
3. `cargo check --manifest-path native/gpui-desktop/Cargo.toml --features desktop --offline --locked`
4. Independently inspect screenshot-directory error behavior, data minimization, access controls and cross-platform compile; make corrective source commits as needed.
5. Only after cloud checks, perform authorized Windows Developer-menu save-report acceptance on an immutable source build. Record actual evidence, never infer PASS.

## Deterministic text → direct command is the next **product** priority

### Reuse existing authority; no alternative compiler
- **Parser/compiler:** `apps/vivim-host/control/intent-planner.mjs` uses deterministic Omega NCLL world from `apps/mobile-relay/control-language.mjs`, bound to canonical `action-catalog.v1.json` and versioned world/lexicon. No LLM is required to interpret supported phrases.
- **Native command preview:** `native/gpui-desktop/src/control.rs::interpret_composer` calls `POST /api/host/control/interpret` with `composer:true`. `project_composer_meaning` only accepts catalog-confirmed candidate, clarification, incomplete or safe non-match. It has **no approval authority**.
- **Direct command planning:** `control.rs::plan` submits explicitly, returning separate Host plan state. Existing `execute` requires a consumed exact `PlanKey` and records a Host receipt; no auto-execution while typing.
- **Mobile:** `apps/mobile-relay/composer-assist.mjs` reuses the same Host interpreter/world. Verify revision identity on both viewports; do not instantiate another phone parser authority.
- **No-model rule:** deterministic interpretable commands work with models disabled/offline. Unsupported or ambiguous phrases yield `clarification_required`, `interpretation_required`, or `refused`, never speculative execution. An optional AI assistance lane, if ever admitted, cannot bypass canonical typed-program validation, planning or approval.

### Implementation sequence (sequential gates, parallel safe verification)

| Order | Deliverable | Source owner / verification | Acceptance |
|---|---|---|---|
| V-01 | Record actual action-catalog coverage and executable readiness vs supported phrase forms | Host catalog + existing deterministic tests | Version/source pinned, no invented available commands |
| V-02 | Re-run deterministic four-file NLP regression suite (no model) and GPUI Rust tests | ChatGPT Cloud Dev | Exact commands and count recorded, failures triaged |
| V-03 | Add held-out real-user paraphrases and ambiguity/negation/partial-input regressions before changing grammar | Host `control-language` and `intent-planner` tests | Same action/args or truthful non-match; no effects |
| V-04 | Fix actual deterministic parser gaps in the **existing** compiler and versioned WorldModel | Host + Rust projection guards | Tests prove old/new inputs, catalog/source pin unchanged except intended revisions |
| V-05 | Project typed action/slots/risk into live GPUI First Contact preview; reject late/older results | GPUI native `control.rs`, `main.rs` | User typing updates inert preview, clear/IME/rapid-input stable |
| V-06 | Submit draft to existing Host plan and explicit grant/approval flow, then bind effect receipt | Existing Host `plan`/`execute`; native control | Unsupported/risky requests never execute from raw text |
| V-07 | Publish truthful command status to revisioned AutoWiki and mobile counterpart via existing Host state | Shared VEC/LiveSurface + mobile relay | Same command identity, revision and receipt across PC/phone |
| V-08 | Physical two-device test: type, preview, clarify, approve, cancel, receipt and reconnect | Authorized Windows/Android verification | Screenshot + command/Host receipt, no duplicate effect or stale UI |
| V-09 | Fold next Desktop Commander **feature** (process inspection or native file search) behind the same Host authorization and catalog | Rust supervisor and existing action contracts | Deterministic user command → approved native capability → receipt; no extra MCP |

**Important sequencing distinction:** Inspection is useful native tooling; it does not grant direct shell execution by text. Any arbitrary-command/external-system execution remains out of scope unless separately permitted and explicitly authorized through Host.

## Integration with canonical tracker

This record supplements, does not replace, `CANONICAL-SURFACE-100-STEP-LEDGER.md`; track V-01–V-08 under CS-031–050, CS-055–060, CS-091–099 and the existing Z-VLANG, Z-SAFETY, Z-VISUAL verification lanes. Keep the 100-step ledger as product execution authority. The source tree is now beyond the initial handoff snapshot `e7f0ed8`; refresh before further writes.

**Truth status:** Native inspection CODED/PUSHED; current-SHA Rust tests UNRUN; VLANG deterministic path pre-existing and previously sampled, current-SHA regression UNRUN; physical GPUI typing/menus and PC↔Android sync NOT VERIFIED.
