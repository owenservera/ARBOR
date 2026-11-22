# Dev cycle R002 — Native Desktop Commander extraction × deterministic VLANG

**Date:** 2026-11-22. **Owner:** ChatGPT Cloud Dev, canonical `ARBOR/main`.  
**Rule:** ONE GPUI/native + mobile surface, Host sole state/effect authority, Rust first; no extra MCP daemon, no model prerequisite for supported commands.

## Source receipts, exact commits

- `f6633a27505621f7420cc5819504e2adb9401575` — `desktop_capture.rs`: bounded, metadata-only directory observation.
- `d30e1947ca044cd97af926d7d68854909d8a4fad` — `main.rs`: Developer diagnostics include screenshot counts/bytes only, not file names or content.
- `74df0d3f2cf3efead4fbb4d6d498ebcf44eec965` — `control.rs`: explicit non-executable no-match/refusal feedback for model-free composer.
- `31d2a1267e39c5cb5d13d6cc954b39008317a6c6` — `desktop_capture.rs`: reject root and file Windows reparse points.
- `ce9bbf359f051c2bbd778cfbe0fdb2f9ba4929ea` — `main.rs`: public native observation is fixed to VIVIM screenshot directory.
- `4a264544ec5cf48004031df92a40adc305725553` — `control-intent-planner.test.mjs`: deterministic no-model regression for help, status, list wiki pages.

**No owner PC source edits:** all application changes above were committed through direct GitHub. The local dirty `C:\0-BlackBoxProject-0\ARBOR` working tree was inspected but not changed.

## Real test evidence

**Immutable Windows test checkout** `C:\0-BlackBoxProject-0\.arbor-gpui-releases\verify-e3f8b0d` from `e3f8b0d038abb0ef300acee11d8ba5e5c51b4f2b`:
- `node --test apps/vivim-host/test/vlang-command-compilation.test.mjs apps/vivim-host/test/control-intent-planner.test.mjs apps/vivim-host/test/command-intent-native.test.mjs apps/mobile-relay/test/composer-assist.test.mjs`: **26 PASS / 0 FAIL**, exit 0. Native-binary checks inside Node suite expressly UNRUN.
- First `cargo test --manifest-path native/gpui-desktop/Cargo.toml --lib --offline`: **dependency resolution FAIL before build**. An offline-only `core-foundation` version index mismatch occurred in a clean test worktree without a generated lockfile.
- Test-only lockfile copied from prior verified isolated GPUI checkout; `cargo test --manifest-path native/gpui-desktop/Cargo.toml --lib --offline --locked`: **43 PASS / 0 FAIL**, exit 0; includes native screenshot metadata inspection test. Generated lockfile remains only in test checkout, not canonical source.
- `cargo check --manifest-path native/gpui-desktop/Cargo.toml --features desktop --offline --locked`: **IN PROGRESS at this receipt**; compilation is not success.
- Changes from `74df0d3`, `31d2a12`, `ce9bbf3`, and `4a26454` were pushed **after** the pinned `e3f8b0d` checkout. Their exact-SHA tests are **UNRUN at this receipt**, must be tested before release acceptance.

## Final exact-source regression recheck

**Immutable Windows test checkout** `C:\\0-BlackBoxProject-0\\.arbor-gpui-releases\\verify-4a26454`, pinned to source `4a264544ec5cf48004031df92a40adc305725553` (includes all six code/test commits above):

- `node --test apps/vivim-host/test/vlang-command-compilation.test.mjs apps/vivim-host/test/control-intent-planner.test.mjs apps/vivim-host/test/command-intent-native.test.mjs apps/mobile-relay/test/composer-assist.test.mjs`: **27 PASS / 0 FAIL / exit 0**. The new deterministic help/status/wiki list test passed.
- `cargo test --manifest-path native/gpui-desktop/Cargo.toml --lib --offline --locked`: **45 PASS / 0 FAIL / exit 0**. The latest Rust no-match and fixed-root filesystem tests passed.
- The exact-SHA desktop-feature `cargo check --manifest-path native/gpui-desktop/Cargo.toml --features desktop --offline --locked` was started after restoring the prior isolated cached target; **PENDING final command result** at this update.
- Local test-only `Cargo.lock` was copied into the isolated checkout. No tracked source or owner working tree was edited through Desktop Commander.
- Native executable launch, actual GPUI physical typing, Alt/mouse Windows menu painting and Android synchronized viewport: **UNRUN**.

## CI truth

GitHub Actions push run [45045596759](https://github.com/owenservera/ARBOR/actions/runs/45045596759), for `ce9bbf3`, concluded `startup_failure` with zero jobs. This is not code test evidence.

## Next execution and safety gates

1. Test the exact current source with native `cargo test --lib --locked`, desktop `cargo check --features desktop --locked` and 4-file deterministic Node suite including the newly added case; preserve command exit codes.
2. Probe first real GPUI typed command → Wiki / VLANG preview on a built native Windows application, then Android shared-revision proof. Do not assert acceptance without pixels and source revisions.
3. No arbitrary shell execution from text, no new MCP daemon, no second Host approval authority, no synthetic Wiki state, no LLM fallback requirement. Unrecognized commands remain inert and explicitly described.
4. Do not touch the local dirty working tree, existing launcher, owner's phone URL or prior screenshot artifacts.

**Canonical tracker link:** `CANONICAL-SURFACE-100-STEP-LEDGER.md`, CS-011–020 (Developer), CS-021–040 (composer/Wiki), CS-041–050 (Host authority), CS-051–060 (phone), CS-091–100 (acceptance).
