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
      "path": "D:\\work\\craft-anything\\target\\release\\craft-anything-cli.exe",
      "sha256": "REPLACE_WITH_REVIEWED_64_CHARACTER_LOWERCASE_SHA256"
    }
  ],
  "expiresInMinutes": 120,
  "allowInteractive": true,
  "allowWrites": true
}
```

Local discovery: run `Find-OwnerProgramCandidates.ps1 -Names @('craft-anything-cli.exe','chrome.exe') -ExplicitPaths @('<actual compiled Craft CLI path>')` in PowerShell 7. It checks PATH, Windows App Paths (both registry views) and explicit paths; it does not launch anything. Review exact paths and SHA-256 fingerprints; copy the approved digest into each selected program entry. Discovery is not permission. The selected program hash must still match at staging. For Craft, select the actual compiled executable, not an assumed path. Browser discovery is read-only; signed-in browser work belongs to existing Studio/Host ownership, not a second control plane.

Stage the verified current source from PowerShell 7 locally, using the existing Build-WorkstationRelease.ps1 with -EnableGeneralTerminal -OwnerProfilePath <private selection path> -OwnerProfileSha256 <reviewed selection file SHA-256>. Compute the reviewed selection file digest locally with `(Get-FileHash -LiteralPath $selectionFile -Algorithm SHA256).Hash.ToLowerInvariant()` after reviewing the file. The installer rechecks the exact bytes after building; the manifest binds the reviewed digest. `allowWrites` controls the file-mutation tools only; it is not an OS sandbox for an admitted terminal program. Never use -Activate with this selection. The same existing root, program, grant and release seal checks apply. Tool count may change for read-only and noninteractive selections. The exact runtime/manifest and locally approved promotion remain necessary. Test the separate candidate before activation. No autonomous grant issuance or live changes were added.

Acceptance: ordinary default unchanged; explicit roots and binary hashes bound; negative cases rejected; source-pinned Windows build/stage and seal; supported owner-approved activation; actual grant summary and safe root/program tests; revoke and rollback. Studio and GPUI owner integration, centralized settings surface and real Craft/desktop acceptance remain open.

No second browser interaction surface: Studio/Harness convergence is held for its separate owner session (R033). The executable discovery helper does not control browser sessions or change the existing Host or GPUI configuration authority.

## Author a local selection proposal without hand-editing JSON

The existing installer accepts the same selection schema. From PowerShell 7, an owner can run `New-OwnerProfileSelection.ps1` with explicit `-Roots` and `-Programs` hashtables, `-OutputPath` pointing to a new JSON file in an existing local directory, and optional `-AllowInteractive` / `-AllowFileWrites`. For example, use `-Roots @{ labs = $actualLabsPath; craft = $actualCraftPath } -Programs @{ 'craft-cli' = $actualCraftExe }`. Defaults are 120 minutes, noninteractive, and no file-mutation tools. It pins the executable bytes and creates a private, non-overwriting proposal. Review the resulting JSON locally before deciding to use its digest as `-OwnerProfileSha256`. This proposal is not an approval or grant; only the supported owner-controlled staging/activation workflow can apply a profile. A remote invocation does not establish interactive owner presence. The final installer independently validates protected paths, duplicates, all configured roots, digests and grant coherence. Do not send the proposal or local paths to public Git.
