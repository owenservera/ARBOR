# VIVIM ARBOR — Universal Personal AI engineering plan
Revision R002 | 2026-11-25 | Owner-directed product evolution

## Mission
One personal AI operating layer, independent of any individual model, agent, device or interface. My machine, my data, my AI. Build capabilities once, reuse them deterministically where possible, and retain evidence. The private MCP is an access surface for ARBOR, not a separate orchestration engine.

## Non-negotiable architecture
- Rust-first core; use TypeScript where practical and minimal existing JS transport adapters where necessary. Reuse rather than duplicate native modules, HQ and Studio.
- ARBOR Host is the sole product effect authority. Use existing action catalog, plan/digest, approval, idempotency and receipt contracts. Do not expose raw terminal, owner credentials or browser cookies to remote clients. No automatic retry of ambiguous effects.
- One native GPUI product renderer; mobile PWA is a thin authenticated remote viewport of actual GPUI output, not a parallel frontend.
- Native protocols for coding agents; signed-in authorized Chrome/Studio surfaces for web AI, no private provider backend/API or Playwright/Puppeteer. Respect service permissions, limits and pricing. No unapproved paid fallback.
- ChatGPT cloud coding directly to GitHub main, no force push or branch proliferation. Local ZCode/Codex for local-only integration, build and test. Check current claims before editing shared files.
- VIVIM-owned tools first. Use commercial Desktop Commander only for a precisely identified local capability gap, then migrate the gap into VIVIM and verify. Do not spend relay credits on repository reads, ordinary cloud coding or repeated polling.
- Existing five-lane operations and model/provider registry remain authoritative. Do not create another task ledger or model router. Distinguish installed, reachable, authenticated, tested, admitted and live-accepted.

## Owner priority clarification — R013 (2026-11-25)
**Primary objective: replace Desktop Commander with a complete VIVIM-owned workstation control plane, then exceed its capabilities. Codex is one optional agent adapter, not the project objective.**
U10 (N02–N05 in [NATIVE-WORKSTATION-PARITY.md](NATIVE-WORKSTATION-PARITY.md)) moves ahead of standalone U04–U06 agent work. U01 authenticated connectivity and U02 installed/live acceptance remain enabling dependencies, not substitutes for parity. Preserve the already working independent health tunnel; it is health-only and cannot currently execute workstation operations.

Execution order: (1) existing Host-approved scoped file read/list/inspect/multi-read/search; (2) exact edit/write/move/mkdir/PDF with CAS and receipts; (3) authorized native process start/output/input/cancel/session/list/terminate and recovery; (4) config, usage and receipt visibility; (5) expose admitted capabilities to the supported VIVIM client with scoped identity, denial and revocation tests; (6) additional agent integrations. Respect current Host source owners, including PY-001. Use existing internal HVI committed-source read composition for the first slice, not a new filesystem authority. Committed-source reads alone are not complete live filesystem parity. Preserve local-only effects and explicit authorization until a remote capability is actually admitted. Do not bypass prior tool denials, expose unscoped raw shell, or spend commercial relay credits unnecessarily.

Parity acceptance: each of the 24 general operations in the pinned 25-tool reference must have a working owned equivalent and real client-to-Host-to-workstation proof; vendor-specific feedback is replaced by VIVIM feedback. A catalogue, fixture, local wrapper around the reference engine, or native Codex observer alone does not establish parity.

## Ordered delivery plan
| ID | Priority | Work | Acceptance evidence |
|---|---|---|---|
| U01 | P0 | Establish independent authenticated browser-to-workstation MCP transport; inspect existing Host/pairing/relay contracts first; use supported remote MCP connection with scoped authentication and revocation | Real browser ChatGPT tools/list and harmless VIVIM tool call to owner PC; auth denial, revocation, timeout, replay/duplicate and reconnect tests; no public raw shell |
| U02 | P0 | Synchronize local marketplace with canonical ARBOR MCP v0.4.0 or newer; use supported Codex plugin upgrade; keep release rollback | Local installed/enabled version readback, exact-source tests, real installed stdio calls and authenticated Host discovery; no credentials in logs |
| U03 | P0 | Native ZCode control via existing Rust observer/bridge, V4 state revisions and receipts | Read sessions/workflows, one explicitly authorized bounded work order, progress, cancellation, persisted receipt, uncertain-result recovery; budget admission |
| U04 | P0 | Codex App Server adapter | Native initialize/thread/session discovery, bounded authorized task, progress/cancel, receipt; avoid broken PATH shim |
| U05 | P0 | Claude Code and Antigravity native adapters | Local version/help/schema verified, structured task lifecycle, permission and budget adherence, real bounded task each |
| U06 | P1 | OpenCode local server and Gemini CLI (where supported) | Recover healthy launcher; verify documented protocol, actual authenticated bounded task and error/cancel paths |
| U07 | P1 | Web AI via existing Studio/Host: ChatGPT, Claude, Gemini, Qwen, Kimi, DeepSeek, Z.ai, extend only when grounded | For each service: authorized live account, composer readiness, one explicit send, settled response, Host receipt, visible GPUI/PWA projection; no historical resend |
| U08 | P1 | Common task/session/agent contract, live capability discovery and routing | Reuse existing HQ model router, existing provider registry and task ledger; approved model selection, bounded retries, cancel, handoffs, receipt correlation; no duplicate scheduler or authority |
| U09 | P1 | Integrate AutoWiki/Oracle/Work/VLANG and GPUI | Live user/agent text revisions reflected in AutoWiki; explicit provenance; Host-approved Work; native GPUI rendering and physical phone parity |
| U10 | P1 | Replace commercial Commander dependency with owned scoped filesystem/process/desktop adapters | Read/write boundaries, real local shell/process tests, exact authority checks, logs/redaction, rollback; no remote unscoped terminal |
| U11 | P2 | Multi-machine orchestration and durable continuation | Authorized device discovery, per-device capabilities, independent workloads, lease/recovery, resource and budget constraints; no claim of always-on work without running scheduler |
| U12 | P2 | Release convergence and user acceptance | Source-pinned native and MCP tests, reproducible Windows package, supported browser/desktop/mobile activation, end-to-end evidence, rollback |

U01/U02 enable the cutover; prioritize U10/N02–N05 immediately and continue independent native workstation source and tests if device acceptance is blocked. Standalone agent adapters are secondary. Do not attempt repeated costly probes for the same blocker. New task-specific native effects require existing Host authorization; broad development authorization is not permission to bypass service security or spend unknown amounts.

## Existing systems to reuse
- `apps/vivim-host/control/universal-api.mjs` and `apps/vivim-host/server.mjs`: owner-authenticated discovery, typed plan/execute/receipt.
- `apps/vivim-host/control/cli.mjs` and bootstrap owner-auth: existing local auth mechanism.
- `studio/src/studio/ai-router.mjs`, orchestrator and compare services: existing signed-in AI routing.
- `studio/src/mcp/server-stdio.mjs` and runtime: existing Studio MCP; do not expose internal tools as independently authorized effects.
- `hq/lib/mcp-team-tools.mjs` and model-router: existing team-state, route and seat operations.
- `vivim-labs/ZCODE-DESKTOP-COMMANDER-OPERATIONS/`: native ZCode observer, native protocol reference, model registry policy, five-lane task claims and handoffs.
- `tools/mcp/vivim-arbor/`: canonical standalone MCP source, tests and compatibility manifests.

## Development cycle
Refresh main and active claims; select highest-impact unclaimed scope; implement real code; run focused tests and actual smoke tests when available; commit directly to main without overwriting unrelated edits; read back exact SHA; publish receipts and release claim; select next safe task. Continue within the available execution. Never claim later/background work unless an actual scheduler is configured and verified. Document exact blockers, ownership, next executable action and proof level. A successful fixture, installed executable or research catalogue entry is not live acceptance.
