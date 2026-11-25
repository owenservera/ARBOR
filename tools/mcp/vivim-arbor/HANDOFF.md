# VIVIM ARBOR MCP — Browser session restart handoff
2026-11-25 | R001 | Read this before continuing development.

## R003 — first successful independent browser call (2026-11-25)
- Live ChatGPT browser `vivim_tunnel_health({})` returned `{"schema":"vivim.tunnel-health/1","status":"ready","profile":"private-readonly","hostDiscovery":false}` via the user-created Secure MCP Tunnel plugin, without Desktop Commander for the call.
- Windows launcher installed at `C:\\0-BlackBoxProject-0\\VIVIM-ARBOR-CONNECT\\windows\\VIVIM-ARBOR.cmd`; official client v0.0.21 checksum-verified; installed server revision `5b58aabc727756874f6cf10ccb695f9f8cc168a1`, 33/33 exact-source Windows regression PASS. After local ID reset and user reentered restricted runtime credential, actual browser tool execution succeeded.
- U01 basic live connectivity milestone achieved. Full authorization/revocation, timeout and reconnect acceptance remain open. Browser-facing tool surface is health-only; Host discovery disabled. Do not expose personal data or effect tools until separate per-user authorization, scope checks and denial/revocation are verified.
- Keep original local plugin and remote tunnel plugin distinct until supported identity convergence; no further commercial relay calls for health probes. U02 and native agent integrations remain open.

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
- Browser-to-PC authenticated transport not established; browser session cannot invoke private plugin.
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
