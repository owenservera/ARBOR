# MCP-U01 — private tunnel bootstrap
2026-11-25. Source implementation, not a live connection or plugin release.

The private tunnel must terminate at `server/tunnel-readonly.cjs`, not the local plugin's general-purpose Commander or operations servers. This is a thin Node stdio transport adapter reusing the existing Host discovery module. No new orchestration engine, listener, inbound port, provider route or effect authority. Default tool list: one harmless health probe. An explicit local `VIVIM_TUNNEL_HOST_DISCOVERY=1` opt-in exposes only four existing Host read-only discovery tools, using the existing local Host credential. Set neither credential nor opt-in in public manifests. The operator must assess disclosure of capability catalog/target data before enabling discovery.

## Supported connection
See [Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels) and [ChatGPT custom MCP eligibility](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt). The tunnel requires Platform tunnel permissions, a runtime API key, and an eligible linked ChatGPT workspace/client. Do not attempt to bypass plan limitations. The tunnel is authenticated by the official client/control plane; this stdio adapter does not implement an OAuth server or independently authenticate a remote user. Do not expose it directly over HTTP.

1. In Platform tunnel settings create a private tunnel if entitled; obtain its ID and inject the runtime API key locally using the documented mechanism. Never paste keys in chat or store them in Git.
2. Obtain the official tunnel-client release from https://github.com/openai/tunnel-client/releases/latest. In the intended local environment, use the official `tunnel-client init --sample sample_mcp_stdio_local --profile vivim-private --tunnel-id <id> --mcp-command "<absolute node command> <absolute path to tunnel-readonly.cjs>"` command. Confirm exact path quoting with the installed client's help.
3. Run `tunnel-client doctor --profile vivim-private --explain` then `tunnel-client run --profile vivim-private`. Verify health/readiness without exposing credentials.
4. In an eligible ChatGPT workspace, Plugins > Add custom MCP server > Tunnel, select the approved tunnel and configure authentication. Discover exactly one harmless tool initially. Call `vivim_tunnel_health` from the actual browser. A local stdio probe is not this acceptance.
5. Revoke tunnel access and confirm browser denial; restore only if desired. Stop/restart the local client and verify reconnect. Check timeout and duplicate calls. Only then consider enabling the optional Host discovery profile with locally injected `VIVIM_MCP_HOST_TOKEN` and existing loopback owner-auth flow. Full writes remain unimplemented and require existing Host plans, approval, receipts and account entitlement.

If browser eligibility or tunnel provisioning is unavailable, keep the local desktop/Codex plugin path and continue independent source development. No public generic shell, untrusted proxy, vendor-credit bypass, or new Host. No live activation or workstation mutation has been performed by this source change.

## Regression
`node --test tests/tunnel-readonly.test.cjs tests/protocol.test.cjs tests/host-discovery.test.cjs`
Source coverage: allowlist, local opt-in, redacted denial, argument validation, handshake/reconnect, duplicate read semantics and actual stdio process. The 64 KiB line check occurs after readline buffers the line; upstream authenticated transport must impose payload and rate limits. Not a public-facing resource-exhaustion boundary. Tunnel transport authentication, revocation, live Host reachability and real browser acceptance remain separate required evidence.
