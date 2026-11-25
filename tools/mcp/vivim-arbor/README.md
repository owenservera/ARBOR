# VIVIM ARBOR private plugin 0.4.0
Local stdio plugin for ChatGPT Desktop or compatible local clients. Requires Node and the existing Desktop Commander 0.3.4 installation. Set `VIVIM_PROJECT_ROOT` or use the Windows workstation default. Set `VIVIM_COMMANDER_ENTRY` for a separately verified 0.3.4 build if not in the existing npm cache. No vendor relay is used by the stdio adapter. The external engine is MIT licensed, not bundled; see https://github.com/owenservera/DesktopCommanderMCP-VIVIM/blob/main/LICENSE. It remains subject to its local configuration. Do not expose it via unauthenticated HTTP. The operations adapter adds ten structured read-only tools, including native inventory, task claims, lane plans, project Wiki and the installed Rust ZCode observer; browser/mobile connection and Host-native actions remain unimplemented. Package creation is not runtime installation or ChatGPT tool discovery.

Run `node --test tests/protocol.test.cjs` for local protocol and scoped-filesystem regression checks. These use isolated fixtures, not live workstation acceptance. The native observer is a separately built local Rust executable.

Windows regression: use a directory junction for the out-of-scope test without administrator or Developer Mode permissions. Run `node --test tests/protocol.test.cjs`. Local server startup is not browser connectivity.

Universal adapter catalogue and local CLI inventory are now implemented. Neither establishes authentication, provider health, remote browser access, or native execution for the new targets. See the VIVIM operations skill for the integration contract.

## Host discovery
Four new read-only tools call the existing loopback Host API. Configure `VIVIM_MCP_HOST_TOKEN` through the local executor environment, never in plugin files or chat; optionally set `VIVIM_HOST_PORT` (default 43187). Missing credentials fail closed. No Host plans or effects are executed. The JS module is a thin adapter to the existing Node Host interface, not a new orchestration core.
