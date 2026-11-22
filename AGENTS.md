# ARBOR — mandatory agent execution contract

## 0. Execution venue (owner directive, 2026-11-21)
**ChatGPT is the PRIMARY coding/integration agent. Application source engineering happens in ChatGPT's own cloud workspace with direct GitHub access, NOT through Remote Desktop Commander or ZCode on the owner's Windows PC.** This includes investigation of source code, implementation, refactoring, migrations, bug fixes, new Rust crates, code generation, and initial test/build work that can run in cloud.

The canonical GitHub repository is `owenservera/ARBOR`; operate directly on refreshed `main` unless the owner explicitly changes this rule. Confirm current GitHub HEAD before modifying files; preserve concurrent changes and never force-push or reset another lane. Work in small nonoverlapping file sets; push directly via GitHub tooling and verify the resulting commit SHA.

**Remote Desktop Commander is an operations interface, not the coding machine.** Allowed: read the local SITREP; inspect genuine Windows-only runtime facts; and, after code is pushed, explicitly requested local builds/packaging, Host/PWA launch/deployment, Tailscale/browser/device tests, and evidence collection. Forbidden by default: application source patching, local `git add/commit/push`, implementing fixes in local checkouts, silently using local test failures as permission to code there.

**ZCode is subordinate.** Use it only for separately scoped secondary lanes and local-only builds/runtime steps that ChatGPT cannot directly execute. Never delegate the user's foreground coding job by default. A generic “SITREP”, “implement”, “build” or “deploy” request does not convert the Windows machine into the coding workspace.

**Cloud blocked?** Report `BLOCKED: CLOUD_GITHUB_UNAVAILABLE` or the precise failure; do not switch to Desktop Commander or ZCode as an unannounced fallback. Only an explicit, current user directive can override the venue or delegate primary coding.

For the full tool matrix see [VIVIM Labs Cloud-First Coding Policy](https://github.com/owenservera/vivim-labs/blob/main/ZCODE-DESKTOP-COMMANDER-OPERATIONS/CLOUD-FIRST-CODING-POLICY.md).

## Engineering invariants
- Rust first for core, command, Host, graph, VEC, tooling and integration when sensible; TypeScript 7+ only for justified web/tooling exceptions. Avoid redundant runtime engines.
- Existing Host owns external effects, approvals, receipts and recovery. PWA first.
- Normal work targets GitHub `main`; no routine feature branches, PRs or new worktrees. Exceptions for major parallel lifts need explicit rationale and owner allowance.
- Never overwrite uncommitted work, stashes, another agent's files, active configurations, or credential material.
- Never report local device verification as accomplished from cloud-only tests.

## Required completion receipt
For every requested code change: repository / refreshed base SHA; cloud-changed paths; actual test commands and PASS/FAIL/UNRUN; GitHub commit SHA and verification on `main`; any separately authorized post-push local run or phone evidence; remaining blockers. Distinguish **CODED**, **PUSHED**, **DEPLOYED** and **DEVICE VERIFIED**.

**Preflight every tool call:** if the next action edits or builds application source through Desktop Commander/ZCode instead of ChatGPT cloud, stop and reroute to cloud/GitHub.

## Mandatory product architecture — ONE canonical live surface (owner directive, 2026-11-22)
**ONE VIVIM SURFACE → ONE CANONICAL STATE MODEL → MULTIPLE SYNCHRONIZED VIEWPORTS.** This overrides earlier PWA-only/GPUI-only UI ownership assumptions without changing Host authority or the cloud-first source-engineering rule. **Read [the complete owner architecture rule](docs/product/ONE-CANONICAL-LIVE-SURFACE.md) before any PC UI, PWA, TierFlow, VEC, renderer or Wiki work.**
- **GPUI is the Windows native master authoring/control and rendering environment.** No Edge/Chrome/Tauri/WebView as a PC UI or fallback; the mobile PWA stays a responsive web renderer of the same semantic surface.
- **TierFlow visual capabilities migrate into the shared Rust-led GPUI/VEC/LiveSurface runtime**, not into a second independent surface or effect engine. Keep existing source during incremental migration until proven replacement parity.
- **The Host remains sole persisted-state, commands, grant, approval, execution and receipt authority.** GPUI master means authoring/control, never an alternate authority. PC and phone synchronize source-backed revisions bidirectionally.
- **First Contact parity is the acceptance gate.** Reuse the successful Edge PWA as reference only. Native GPUI defaults to one composer with live Wiki-as-you-type and the same Host source data; confirm physical Windows/Android sync before expanding PC features. One launcher only after verified native deployment; preserve rollback.
