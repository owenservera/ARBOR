# Expanded owner development profile (R032, stage only)

This extends the existing Windows installer, not the live connector. Ordinary installation is unchanged. Only a local owner should select and approve these paths; keep the file private. The broad terminal is not sandboxed by cwd. Never include credentials or authority files, and never use terminal access to alter its own grants. No new remote configuration route.

Example selection shape (illustrative paths, not discovered machine facts):

```json
{
  "schema": "vivim.owner-workstation-selection/1",
  "roots": [
    {
      "id": "labs",
      "path": "C:\\work\\vivim-labs"
    },
    {
      "id": "craft",
      "path": "D:\\work\\craft-anything"
    }
  ],
  "programs": [
    {
      "id": "craft-cli",
      "path": "D:\\work\\craft-anything\\target\\release\\craft-anything-cli.exe"
    }
  ],
  "expiresInMinutes": 120,
  "allowInteractive": true,
  "allowWrites": true
}
```

Local discovery: use the read-only PowerShell 7 helper below to enumerate specifically requested installed executable names; review exact paths and approve only required programs. For Craft, select the actual compiled executable, not an assumed path. Browser discovery is read-only; signed-in browser work belongs to existing Studio/Host ownership, not a second control plane.

Stage the verified current source from PowerShell 7 locally, using the existing Build-WorkstationRelease.ps1 with -EnableGeneralTerminal -OwnerProfilePath <private selection path>. Never use -Activate with this selection. The same existing root, program, grant and release seal checks apply. Tool count may change for read-only and noninteractive selections. The exact runtime/manifest and locally approved promotion remain necessary. Test the separate candidate before activation. No autonomous grant issuance or live changes were added.

Acceptance: ordinary default unchanged; explicit roots and binary hashes bound; negative cases rejected; source-pinned Windows build/stage and seal; supported owner-approved activation; actual grant summary and safe root/program tests; revoke and rollback. Studio and GPUI owner integration, centralized settings surface and real Craft/desktop acceptance remain open.
