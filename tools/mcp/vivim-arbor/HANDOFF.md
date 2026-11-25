# VIVIM ARBOR MCP — Browser session restart handoff
2026-11-25 | R001 | Read this before continuing development.

## R003 — first successful independent browser call (2026-11-25)
- Live ChatGPT browser `vivim_tunnel_health({})` returned `{"schema":"vivim.tunnel-health/1","status":"ready","profile":"private-readonly","hostDiscovery":false}` via the user-created Secure MCP Tunnel plugin, without Desktop Commander for the call.
- Windows launcher installed at `C:\\0-BlackBoxProject-0\\VIVIM-ARBOR-CONNECT\\windows\\VIVIM-ARBOR.cmd`; official client v0.0.21 checksum-verified; installed server revision `5b58aabc727756874f6cf10ccb695f9f8cc168a1`, 33/33 exact-source Windows regression PASS. After local ID reset and user reentered restricted runtime credential, actual browser tool execution succeeded.
- U01 basic live connectivity milestone achieved. Full authorization/revocation, timeout and reconnect acceptance remain open. Browser-facing tool surface is health-only; Host discovery disabled. Do not expose personal data or effect tools until separate per-user authorization, scope checks and denial/revocation are verified.
- Keep original local plugin and remote tunnel plugin distinct until supported identity convergence; no further commercial relay calls for health probes. U02 and native agent integrations remain open.


## R004 — bounded HTTP authorization adapter (source only)
- Separate loopback-only stateless legacy MCP HTTP module `server/remote-http.cjs`, per-request and pre-disclosure authorization with existing verifier, separate Host credential, explicit local discovery opt-in, minimal projections and bounded requests/concurrency. No public listener, token issuer, deployment, or change to working secure tunnel. No CLI auto-start: trusted issuer policy must be supplied by an authorized local integrator. Modern MCP 2026 protocol and real OAuth/Host acceptance remain open.
- Exact source [f3f65b3](https://github.com/owenservera/ARBOR/commit/f3f65b35a0b2196a9daa18969be426c64ec2f4d9): Windows isolated git archive, Node v24.22.1, PID 25992, full MCP regression **44/44 PASS**, exit 0 (five new HTTP tests). Fixture RSA grants and actual loopback HTTP fixture Host; not real OAuth or live ARBOR Host acceptance. Desktop Commander used only for this bounded local verification; VIVIM health independently returned ready in the new session. No live tunnel restart, credential change, or HTTP deployment. Next: wire trusted local policy and supported transport, test live denial/revocation, then U02 installed upgrade/Host read acceptance.

## R005 — local operator policy loader
- `server/remote-policy.cjs` provides `createConfiguredRemoteHttp({env})`; explicit absolute local `VIVIM_MCP_HTTP_POLICY_FILE`, bounded fresh policy reads, invalid/removed/disabled policy fails closed. Keep policy directory owner-controlled; no network-supplied paths. No issuer or key provisioned, no listener started. Cloud Node v22.16.0 loader tests 4/4 PASS; source blob 3377a2de72dc391a233238df2865f25d45aaaa8b and test blob c05292b21b9c4f14b0903950b3c00630c9e87af6 verified before commit. Configured wrapper and Windows file replacement still need integration acceptance. Existing Windows 44/44 receipt refers to R004 source.

## R006 — configured policy integration and in-flight revocation
- Exact source [9e97c7b](https://github.com/owenservera/ARBOR/commit/9e97c7bab7a6ac86583644bf726bd8e686d654f2): Node v22.16.0 cloud isolated test run of `remote-configured.test.cjs` and `remote-policy.test.cjs` **7/7 PASS**, exit 0. All seven source/test Git blob hashes match canonical GitHub. New configured tests cover missing policy, live file replacement, disabled/changed/removed policy, restoration, and revocation while a loopback fixture Host read is in flight (403, no data disclosure).
- Workstation execution request was blocked by tool safety checks; do not retry or route around the restriction. Windows acceptance of R005/R006 and installed marketplace upgrade remain unverified. No production changes, no listener deployed, no live issuer configured. VIVIM private tunnel health returned ready; Host discovery remains disabled. Next authorized step is supported local verification of the exact source, then real issuer and Host acceptance; local test command `node --test tests/*.test.cjs` (explicit file paths if Windows shell requires). Keep existing tunnel running. No remote effects.

## R007 — private engineering plugin 0.4.1 published
- Same existing private account plugin, release `pluginrel_6b06dc8345ac8191bd4c73afb07b3717`. Published support files and regressions from exact `7988542220191d9b2784d19da053e407607e87ee`; 27/27 cloud tests on Node v22.16.0, 10/10 published source/test file contents match canonical GitHub. Existing MCP bindings retained, no new live tools or transport activated. Separate secure tunnel app 1.0.0 unchanged; post-release live health returned ready/private-readonly/hostDiscovery=false. Windows package installation and live Host authorization remain pending; updating the account package does not remove the earlier workstation execution restriction. See [release notes](RELEASE-0.4.1.md).

## R008 — Windows marketplace and Codex installation 0.4.1
- Source `655b59ea2ff51d05c9a8ddccc8d308ada801ca14` staged by local git archive, Windows marketplace 0.2.1 → 0.4.1, 31/31 file hashes verified; original package preserved at `vivim-arbor-local-marketplace/backup-0.2.1`. Staging PID 22396; replacement PID 21044, exit 0. Existing tunnel health remained ready.
- Default Codex PATH launcher is broken (`MODULE_NOT_FOUND`); existing npm-installed `codex.cmd` works. Native supported `codex plugin add vivim-arbor-plugin@vivim-local --json`, PID 25032, exit 0, returned version 0.4.1, installed cache `~/.codex/plugins/cache/vivim-local/vivim-arbor-plugin/0.4.1`, auth policy ON_INSTALL. Installed tool calls and live Host auth remain to be verified. No direct cache edits, no remote grants or listener change.

## Objective and owner authorization
Continue the all-in-one VIVIM ARBOR personal AI control plane until implemented, integrated and genuinely tested. Core ARBOR upgrades are authorized where needed. VIVIM ARBOR first; commercial Desktop Commander only as a bounded bootstrap/fallback to close a specific missing capability. Use GitHub directly for cloud coding. Do not burn commercial relay credits on routine work. Reuse native protocols, existing Host/Studio/HQ and existing model registry; Rust-first, single GPUI renderer and thin phone viewport. See [PLAN.md](PLAN.md) for work packages and acceptance conditions.

## R002 — 2026-11-25 connectivity progress
- Exact source [6c8fe74](https://github.com/owenservera/ARBOR/commit/6c8fe74fdcea9ca37be13a18ca0b239e95ddd3bc): dedicated private tunnel stdio profile, one harmless health tool by default; explicit local opt-in adds four existing read-only Host discovery tools. No Commander, private Wiki, or effects exposed.
- Real Windows source archive regression Node v24.22.1, Desktop Commander PID 16324, 28/28 PASS, exit 0. Not a live browser connection or installed release upgrade.
- Owner clarified that Desktop Commander is already callable on this Plus account; do not assume subscription upgrade required. Official OpenAI plugin manifest supports remote streamable HTTP and OAuth; use existing private identity and supported activation, not a duplicate or entitlement bypass. Context7 sources: `/websites/developers_openai`, `/modelcontextprotocol/rust-sdk`, `/modelcontextprotocol/modelcontextprotocol`.
- Added remote-only manifest generator; it requires an actual provisioned endpoint and does not change the current stdio package or publish a fictitious endpoint. See [TUNNEL.md](TUNNEL.md).
- Next: verify actual private plugin installation and remote endpoint/tunnel entitlement; provision authorized OAuth or Secure MCP Tunnel, then actual browser health call. No public terminal. U02 local v0.4.0 installation and Host-auth acceptance still pending.

## Source and release baseline
- Canonical source: `owenservera/ARBOR`, main, `tools/mcp/vivim-arbor/`.
- Verified implementation commit: `65f036a799cc8152cc69b86cde1ca57b93e2bee2` (refresh main; this is a historical baseline, not a claim about current head).
- Private account plugin release v0.4.0 saved and read back. Use the existing private plugin through its owner account; do not create a duplicate. Preserve identity, audience and existing integration settings when publishing.
- v0.4.0 contains 16 VIVIM-specific tools plus the separately installed 25-tool MIT Commander engine adapter; total 41 configured, not 41 individually live-tested.
- Prior session reported 20/20 regression checks on v0.4.0 (fixtures and controlled loopback HTTP), plus 11/11 source parity readbacks between account release and GitHub; no fresh workstation acceptance of v0.4.0 yet.
- Local Codex plugin v0.2.1 was installed, enabled and independently smoke-tested from installed cache, exit 0 in 32.65 seconds. Windows tests 12/12 after junction fix. Both adapters initialized, actual project claims/Wiki/native inventory/SITREP read, Rust observer passed and filesystem read passed. This is not proof of browser connectivity or v0.4.0 local activation.
- Local marketplace identifier `vivim-local`; plugin `vivim-arbor-plugin@vivim-local`; marketplace root under project root `vivim-arbor-local-marketplace`. Use supported Codex CLI upgrade/install path; do not edit plugin cache. Alternate npm Codex launcher worked despite broken default PATH shim.
- Workstation version probes: ZCode 0.18.0, Claude Code 2.1.314, Antigravity CLI 1.5.17, Codex 0.162.0, Gemini CLI 0.43.0; OpenCode primary shim failed. These are historical launch/version checks only, not provider authentication or task execution.
- Existing Rust ZCode observer saw 1 session, 16 workflows, 67 plugins, V4 snapshot PASS, 0 errors. Read-only, no provider prompt sent. Counts may change.
- Browser ChatGPT session had NO callable VIVIM tools even after private release publication; local stdio is not a browser-cloud transport. Do not falsely claim otherwise. Commercial Commander allowance reported 90% used; no further calls after owner's cutover instruction.

## First actions in new session
1. Inspect actual available tool list and try VIVIM tools if exposed. Do not invent tool availability. Verify account plugin version and source, GitHub main, ARBOR issues #31/#33, and current Labs TASK-CLAIMS and five-lane notes.
2. Work on U01: examine current official ChatGPT remote MCP connection requirements, ARBOR Host's pairing/auth/relay and existing native networking. Prefer supported secure transport; no unauthenticated public endpoint, no exposing owner token or generic shell to Internet. If user activation is essential, give the exact action and continue independent source work.
3. Work on U02: synchronize local marketplace source with canonical ARBOR source using a safe upgrade with backup and exact-version check. Test `node --test tests/*.test.cjs` (use explicit test file paths on Windows if shell glob unsupported). Verify actual installed server startup, tools/list and harmless tool call. Do not reinstall or modify unrelated runtimes.
4. Test live Host discovery. Adapter uses `VIVIM_MCP_HOST_TOKEN` injected locally and `VIVIM_HOST_PORT` default 43187; no token in chat, GitHub, plugin manifests or logs. Reuse existing local Host owner-auth procedure; fail closed if unavailable. Test `vivim_host_sources`, `vivim_host_capabilities`, `vivim_host_targets`, `vivim_host_capability` and denial paths. These tools are read-only; no plan execution.
5. Advance U03 onward using [PLAN.md](PLAN.md). Existing RUST-BRIDGE-ARCHITECTURE.md/NATIVE-PROTOCOL.md in Labs, Studio AI router, HQ team tools and Host action discovery are source authority. Reuse model registry and existing approved-provider/budget rules; no duplicate registry. Agent effects must have exact scoped work, admission and receipts.
6. After each safe increment, commit main, test exact revision, write evidence and update task claims. Keep this handoff current when work changes the actual state. Prefer further productive independent tasks over repeated SITREP-only turns.

## Current critical blockers
- Browser-to-PC health transport independently verified; scoped Host OAuth, revocation and live integration still open.
- Workstation installed plugin remains v0.2.1 until verified upgrade.
- No live v0.4.0 Host-authenticated tool acceptance.
- Native CLI agents beyond ZCode observer are catalogued/version-probed only; web AI dispatch and full task lifecycle still incomplete.
- Do not confuse 1,000 research targets or Studio internal descriptors with executable admitted capabilities.

## Copy-paste restart prompt
```
Resume VIVIM ARBOR universal personal AI development now. Read the canonical handoff and plan at:
https://github.com/owenservera/ARBOR/blob/main/tools/mcp/vivim-arbor/HANDOFF.md
https://github.com/owenservera/ARBOR/blob/main/tools/mcp/vivim-arbor/PLAN.md

Refresh actual GitHub main, current private plugin release, available tools, ARBOR #31/#33 and vivim-labs TASK-CLAIMS/five-lane handoffs. Core upgrades are authorized. VIVIM ARBOR first; use direct GitHub coding and local VIVIM/ZCode/Codex tools, commercial Desktop Commander only for a precise capability gap and migrate back. First close authenticated browser-to-PC connectivity and local version/Host acceptance, then native ZCode, Codex, Claude Code, Antigravity, OpenCode, Gemini and signed-in web AI integration through existing Host/Studio/HQ. Rust-first; one GPUI renderer; Host-owned approvals, effects, receipts and recovery; no unauthorized costs, secret extraction, unsafe public terminal or fake acceptance. Implement, test, commit to main, record evidence, and continue the next unclaimed task within the available execution. If blocked, pivot to independent work and leave an exact executable handoff. Do not stop at a SITREP or create another orchestration core.
```
