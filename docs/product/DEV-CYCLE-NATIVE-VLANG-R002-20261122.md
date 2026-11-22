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
- The exact-SHA desktop-feature `cargo check --manifest-path native/gpui-desktop/Cargo.toml --features desktop --offline --locked` was started after restoring the prior isolated cached target; **INTERRUPTED / NO PASS**. The reused-cache build stalled while checking Windows/Host dependencies and was explicitly terminated to avoid continued load on the owner's PC. The terminated process returned exit code 1; this is not evidence of a compiler/source diagnostic. Exact-SHA desktop compile remains UNVERIFIED.
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

## Cycle closure (2026-11-22)

**CODED & PUSHED:** native screenshot metadata inspection, fixed-root/Windows reparse protections, deterministic no-match/refusal feedback and no-model regression tests. **VERIFIED on exact code SHA `4a26454`:** 45/45 Rust library tests + 27/27 deterministic Node tests, both exit 0. **BLOCKED / UNVERIFIED:** GUI desktop-feature `cargo check` (intentionally terminated without result), native binary launch, real GPUI typing, Windows menu painting, and Android synchronous rendering. GitHub Actions `startup_failure` produced no jobs. No paid model, provider API, new MCP daemon, local product-source edits, shortcut changes or phone URL changes.


## R004 continuation — typed Host arguments in native VLANG preview

**November 22, 2026 — exact implementation source `1324cc2760f588dfee6fd69c4ce237d6c96db4a6`**.
This continues R002 in the same log, rather than creating another competing planner, command grammar, MCP service or tracking system.

- **Code:** [`e4f509f62dc75348603ba2a82202cd6311a386f6`](https://github.com/owenservera/ARBOR/commit/e4f509f62dc75348603ba2a82202cd6311a386f6) modifies `native/gpui-desktop/src/control.rs::project_composer_meaning`. The existing Host-produced `candidate.args` now appears in a bounded, non-authoritative GPUI command preview. Invalid fields, over-limit arguments, non-string values and control characters fail closed. Risk R2/R3 argument values are shown only as `[supplied]`; longer R0/R1 values are explicitly abbreviated. No new local NLP, LLM, planning or effects.
- **Test correction:** [`1324cc2760f588dfee6fd69c4ce237d6c96db4a6`](https://github.com/owenservera/ARBOR/commit/1324cc2760f588dfee6fd69c4ce237d6c96db4a6) tests actual control-character rejection (not a literal backslash escape).
- **Windows exact-source verification:** isolated verification checkout `C:\0-BlackBoxProject-0\.arbor-gpui-releases\verify-4a26454` detached to `1324cc2`; ordinary dirty application workspace untouched. `cargo test --manifest-path native/gpui-desktop/Cargo.toml --lib --offline --locked`: **45 PASS / 0 FAIL / exit 0**. The four canonical `node --test` VLANG/Host files: **27 PASS / 0 FAIL / exit 0**. The Node tests explicitly leave optional independent native-binary guard parity subchecks unrun.
- **Physical acceptance:** no new live GPUI typing/IME screenshot, phone revision parity or Win32 menu painting evidence yet. Existing running app/Host and user URLs/shortcuts deliberately untouched. 
- **Concurrent ownership:** a separate agent has since pushed native PC→phone handoff work. This change does not replace or duplicate that lane; rebase future verification on canonical `main`, not its older implementation source.
- **Native desktop-feature build:** launched with `cargo build --manifest-path native/gpui-desktop/Cargo.toml --features desktop --offline --locked` using the existing shared target, **PENDING result when this log entry was authored**. Build not yet a pass; append exact exit receipt after completion.

**Next:** complete the native desktop build, obtain guarded foreground GPUI text/preview and physical phone-source proof. The model-free interpretation path is source/test-proven but device acceptance remains separate.
