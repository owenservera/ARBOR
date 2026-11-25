# VIVIM DEV one-click setup — acceptance R001
2026-11-25. Owner requests a distinct development copy and iterative one-click installation/setup. Production VIVIM remains the working remote control path.

## Actual scope
Source-pinned development MCP adapter, health-only local stdio. Separate lab directory under the granted scratch root; no copied production credentials, no production Host writer, no tunnel registration, no cloud plugin creation. Windows PowerShell 7 and Node prerequisites already installed. This is not complete cold machine onboarding or remote plugin acceptance. The inventory protects against mismatch relative to the local package, not signed release authenticity; production distribution needs independently trusted signatures and verification. No power-loss or concurrent installer acceptance yet.

## Source and evidence
- 87ec9f8788e108af8be1ec342d61ebbcf951b725: actual Windows session ctl-bb44ee48dab2369b exit 0, 12.767s including fetch, bundle generation, first and repeat setup, deliberately modified manifest refusal, unchanged active pointer. Real MCP handshake: one health tool, ready/private-readonly, no Host discovery, terminal denied.
- a18b8af33de68d40fbf76ff73148d18aee386b54: session ctl-d84291cb99c8135f exit 1 after successful second-generation activation; older script failed rollback due to null backup argument interpreted as empty path. Explicit backup file implemented in newer installer.
- 7245dc34aa4532e2e1fc08f95aca56247efc2a67: session ctl-8cbf3c2fc2244dd2 exit 1, parser error; candidate never activated.
- 96954c1dfd8110ac38bb9727aa258bae0ccdffb9: session ctl-8c42568072b0b409 exit 0, 11.553s including source fetch, automated bundle assembly, PowerShell parser validation, third valid generation activation, rollback using current installer, reactivation and readback. Previous source a18b8af33de68d40fbf76ff73148d18aee386b54 retained. All three probes real MCP stdio, terminal denied. Active scope local-health-only, remoteConnected=false. Fresh production health ready/private-workstation/15 workstation tools. No Desktop Commander calls or production runtime changes.

## Current entrypoint
Under the granted scratch root: self-install-lab-r001/vivim-dev-setup-96954c1dfd81/windows/VIVIM-DEV-SETUP.cmd. Double-click from Explorer (the test invoked the same CMD entrypoint; physical mouse action not observed). New-DevSetupBundle.ps1 assembles exact git archive; Install-DevCopy.ps1 -Rollback selects previous verified retained generation. First run through remote terminal emitted a CMD extended-path working-directory warning; subsequent tests used conventional lab cwd. No manual plugin refresh needed for current production connection.

## Next incremental acceptance
1. Package actual isolated Host and native workers using explicit independent root, ports, profile, lifecycle and grant policy; prove no shared production effects; don't use incumbent production installer Activate.
2. Separate supported dev tunnel identity and scoped local credential provisioning, no production key copying or tunnel hijacking. Verify actual provider setup requirements and user consent, then private dev plugin discovery and harmless remote call. Local health-only is not cloud readiness.
3. Native signed bootstrap distribution for clean machine prerequisites, one-click user flow from download/launch to provider authorization, stable endpoint, signed generation graph and supervised recovery. Use existing Host release infrastructure, no duplicate runtime authority. Measure cold install, interruption, repeat, repair and rollback. No claims of full one-click onboarding until actual acceptance.
