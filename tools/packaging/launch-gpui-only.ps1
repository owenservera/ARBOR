# Strict native Windows UI entrypoint. No browser, WebView, Edge/Chrome, or PWA fallback.
# From repository root: powershell -NoProfile -File tools/packaging/launch-gpui-only.ps1
# Build explicitly first: cargo build --manifest-path native/gpui-desktop/Cargo.toml --features desktop
[CmdletBinding()]
param(
    [ValidateSet('debug','release')]
    [string]$Configuration = 'debug'
)
$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$exe = Join-Path $repoRoot ("native\gpui-desktop\target\$Configuration\vivim-gpui-desktop.exe")
if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) {
    throw "GPUI_ONLY_UNAVAILABLE: Native executable missing at $exe. Build GPUI; no browser fallback is permitted."
}
# Only reuse the same native application; never redirect to a PWA shell.
$existing = @(Get-Process -Name 'vivim-gpui-desktop' -ErrorAction SilentlyContinue |
    Where-Object { $_.Path -and $_.Path.Equals($exe, [System.StringComparison]::OrdinalIgnoreCase) })
if ($existing.Count -gt 0) {
    Write-Output "GPUI_ONLY_REUSED PID=$($existing[0].Id)"
    exit 0
}
$started = Start-Process -FilePath $exe -WorkingDirectory $repoRoot -PassThru
Start-Sleep -Milliseconds 900
$live = Get-Process -Id $started.Id -ErrorAction SilentlyContinue
if (-not $live) {
    throw "GPUI_ONLY_EXITED: Native process exited immediately. Inspect GPUI logs; no browser fallback is permitted."
}
Write-Output "GPUI_ONLY_LAUNCHED PID=$($started.Id) EXECUTABLE=$exe"
