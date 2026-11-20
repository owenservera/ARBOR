# File: studio/scripts/install-web-memory.ps1

> Generated 2026-11-19 · PowerShell · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/install-web-memory.ps1 |
| Language | PowerShell |
| Kind | source |
| Size | 4784 B |
| Lines | 78 |
| Hash | 065b6266707a |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```powershell
param(
  [string]$RustRoot = "",
  [switch]$StartStudio,
  [switch]$SkipTests,
  [switch]$PersistUserSetting
)
$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
if (-not $RustRoot) {
  $workspace = Split-Path $repoRoot -Parent
  $candidates = @(
    (Join-Path $workspace "repos_hq\research\rust-knowledge-graph"),
    (Join-Path $workspace "repos-hq\research\rust-knowledge-graph")
  )
  $RustRoot = @($candidates | Where-Object { Test-Path (Join-Path $_ "Cargo.toml") } | Select-Object -First 1)[0]
}
if (-not $RustRoot -or -not (Test-Path (Join-Path $RustRoot "Cargo.toml"))) {
  throw "Rust core not found at $RustRoot. Supply -RustRoot <path-to-repos-hq\research\rust-knowledge-graph>"
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node 22+ is required." }
$nodeMajor = [int]((& node --version).Trim().TrimStart("v").Split(".")[0])
if ($nodeMajor -lt 22) { throw "Node 22+ required; found $(node --version)" }
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) { throw "Rust cargo is required. Install Rust before running this setup." }
Write-Host "Building existing HQKG browser feed..."
& cargo build --manifest-path (Join-Path $RustRoot "Cargo.toml") --features importer --bin hqkg-web-feed --release
if ($LASTEXITCODE -ne 0) { throw "Rust web-memory build failed." }
$bin = Join-Path $RustRoot "target\release\hqkg-web-feed.exe"
if (-not (Test-Path $bin)) { throw "Expected Rust executable missing: $bin" }
if (-not $SkipTests) {
  & cargo test --manifest-path (Join-Path $RustRoot "Cargo.toml") --features importer --bin hqkg-web-feed
  if ($LASTEXITCODE -ne 0) { throw "Rust browser importer tests failed." }
  Push-Location $repoRoot
  try {
    & node --test "apps/browser-companion/test/companion.test.mjs" "studio/test/unit/browser-companion-ingress.test.mjs" "studio/test/unit/web-memory-core.test.mjs"
    if ($LASTEXITCODE -ne 0) { throw "Browser Companion tests failed." }
  } finally { Pop-Location }
  $probeDir = Join-Path ([IO.Path]::GetTempPath()) ("vivim-web-memory-" + [Guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $probeDir | Out-Null
  try {
    $probeJournal = Join-Path $probeDir "probe.hqj"
    $payload = @{
      schema = "vivim.browser-companion/1"
      installationId = [Guid]::NewGuid().ToString()
      sessionId = [Guid]::NewGuid().ToString()
      events = @(@{
        id = [Guid]::NewGuid().ToString()
        type = "visit.observed"
        at = (Get-Date).ToUniversalTime().ToString("o")
        page = @{ browserTabId = 1; site = "example.org"; url = "https://example.org/article" }
      })
    } | ConvertTo-Json -Depth 8 -Compress
    $first = $payload | & $bin $probeJournal
    if ($LASTEXITCODE -ne 0 -or ($first -notmatch "inserted=1")) { throw "Rust core synthetic write failed: $first" }
    $second = $payload | & $bin $probeJournal
    if ($LASTEXITCODE -ne 0 -or ($second -notmatch "inserted=0")) { throw "Rust core replay dedup failed: $second" }
    $found = & cargo run --quiet --manifest-path (Join-Path $RustRoot "Cargo.toml") --bin hqkg -- $probeJournal search example.org
    if ($LASTEXITCODE -ne 0 -or ($found -notmatch "web:visit")) { throw "Graph readback failed: $found" }
    Write-Host "Synthetic web observation -> Rust journal -> graph readback PASS"
  } finally { Remove-Item -Path $probeDir -Recurse -Force -ErrorAction SilentlyContinue }
}
$env:VIVIM_WEB_MEMORY_BIN = $bin
if ($PersistUserSetting) {
  [Environment]::SetEnvironmentVariable("VIVIM_WEB_MEMORY_BIN", $bin, "User")
}
Write-Host "Rust web-memory importer ready: $bin"
Write-Host "Dedicated VIVIM Chrome: chrome://extensions -> Developer mode -> Load unpacked -> $repoRoot\apps\browser-companion"
Write-Host "Note the 32-letter extension ID; from repo root run: node studio/bin/studio.mjs companion pair <extension-id>"
Write-Host "Paste the observation-only token into extension Options with Studio port 7878; tick the explicit Web Memory opt-in."
Write-Host "Open a normal https://example.org/article; inspect Options for Last local ACK and Studio via: node studio/bin/studio.mjs companion status"
Write-Host "No Chrome profile reset/recreation, provider send action, incognito permission, or browser automation is performed by this script."
if ($StartStudio) {
  Push-Location (Join-Path $repoRoot "studio")
  try { & node "bin/studio.mjs" "start"; if ($LASTEXITCODE -ne 0) { throw "Studio exited nonzero." } }
  finally { Pop-Location }
} else {
  Write-Host "Start Studio from THIS shell using: cd studio; node bin/studio.mjs start"
  Write-Host "Or rerun with -PersistUserSetting to make the bridge path available to subsequently launched Host processes."
}
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
