# Agent Uplink → ARBOR: selective integration decision
Date: 2026-11-24. Status: provisional donor identification; architecture assessment only, not deployed or runtime-integrated. Owner said "uplink" without a URL. Candidate: https://github.com/andymac4182/agentuplink (formerly Agent Tunnel, MIT); separate gsicvj/uplink Bun terminal agent is not the selected candidate. Confirm donor identity before importing code.

## Source evidence
- ARBOR observed main: 532e2d7d2cebb04fe84bf20d6c2835b1d085dba3. Canonical ledger #33; release #31; conversations #32. Existing Labs TASK-CLAIMS ownership applies; this document changes no claimed runtime path.
- Existing apps/mobile-relay/gpui-phone-channel.mjs already verifies device grant/session, frame age/revision, content type and bounded size; never retries uncertain input POSTs. apps/vivim-host/remote/gpui-direct-channel.mjs owns the direct channel; native/gpui-desktop owns actual pixels and input fence. Preserve these, not a competing renderer.
- Upstream architecture review pin 626ba9365b5d (2026-11-18): https://agentuplink.dev/docs/architecture ; overview https://agentuplink.dev/docs/ ; support https://agentuplink.dev/docs/support . Upstream reports scoped tests, not ARBOR verification; Windows is client-only with provisioning limitations, computer-use adapter not enabled in shipped builds. Relay terminates TLS and can see payloads; not end-to-end encrypted.

## Disposition (no new backlog)
| Donor pattern | Decision and canonical owner |
| --- | --- |
| Outbound-only authenticated reverse connection | Evaluate as OPTIONAL transport of the existing Host for remote connectivity; S09/S13/U11. Preserve local phone URL/pairing. No open inbound listener, duplicate Host or default cloud dependency. |
| Separate control/data channels; bounded streams and backpressure | Adapt only if measured real GPUI frame latency/recovery warrants it; S07-S10. No independent PWA renderer. |
| Device certificates, service+operation grants, revocation | Reuse existing Host/device identity and local policy. Add missing constraints only after source audit; U07/U11/S13. Remote grants cannot replace Host approvals. |
| Owner epoch, stale-session fence, bounded reconnect | Map to existing Host/native session and source revision; S09/S13. A fresh session cannot replay old inputs or provider sends. |
| Explicit not-dispatched vs unknown vs verified completion | Preserve existing phone/Studio distinctions; extend only identified gaps across A16/U07/S13. Durable Host receipt, not tunnel ACK, proves an effect. |
| MCP HTTP/stdio exports; ACP supervised CLI | Optional adapters behind existing U11 Host and ZCode registry, no generic shell, dynamic executable or arbitrary URL. Read-only capability discovery first; no provider routing changes. |
| Confined filesystem mount | Later O06/U11; default read-only, explicit root and operation grants, refuse traversal and symlink/reparse escapes, no private corpus export without consent. |
| Redis cluster, separate authority, HTTP/3 peers, production relay | Defer: zero-cash local-first product, no demonstrated need. Do not import the full stack. |
| Computer-use adapter | Defer; existing Desktop Commander/GPUI owner and real device acceptance first. Never expose unrestricted desktop control. |

## Target wiring
Authorized consumer → existing transport or optional outbound connector → existing Host grant + local export + approval → existing MCP/ACP/Studio/native capability → durable Host receipt → same GPUI-rendered surface and thin phone viewport. Cloud connector carries requests, not authority. Use the signed-in browser Studio path for AI conversations; no provider API or duplicate browser owner.

## Implementation order
1. S07–S14 physical same-source GPUI/phone acceptance and baseline real latency/recovery before changing transport. Read and reconcile task claims.
2. S09/S13/A16: source audit current grant/revocation/epoch/timeout/receipt contracts; add targeted regression only for demonstrated gaps, Rust first when core/native is changed. Explicitly test revocation mid-stream, stale epoch, disconnection before/after dispatch, no duplicate effect, bounded queue and recovery; ensure the old session cannot reattach.
3. U11: read-only MCP capability enumeration through Host; ACP only for approved existing ZCode agent/session identity; record actual consent and receipts. No cloud payload until explicit data policy (relay visibility and retention, or application-layer E2E encryption with reviewed key management) is accepted.
4. If remote reach remains a demonstrated blocker, evaluate pinned upstream Rust client and narrow adapter in isolation (MIT attribution, dependency/license/security review, Windows compatibility and exact-source real-socket tests). Do not vendor the entire relay, add external services, or enable new egress without approval.
5. Verify unchanged phone URL, same GPUI native pixels/interaction, actual Windows↔Android receipts; remote access optional and disabled until acceptance. No synthetic results treated as physical evidence.

## Receipt
Documentation integration only. No upstream files copied, runtime dependencies, deployments, credentials, device enrollment, service exports, network configuration, provider sends, or task closure. Runtime tests and physical verification UNRUN. A later implementation requires confirmed donor identity and source claims; no competing backlog or implicit agent dispatch.
