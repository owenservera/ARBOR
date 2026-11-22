# Canonical native Windows entrypoint; fail closed for unverified/stale builds.
# Never fall back to browser, WebView, Edge/Chrome, or a legacy second UI.
# Build/stamp first with: pwsh tools/packaging/build-gpui-native.ps1
[CmdletBinding()]
param(
    [ValidateSet('debug','release')]
    [string]$Configuration = 'debug'
)
$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$exe = Join-Path $repoRoot ("native\gpui-desktop\target\$Configuration\vivim-gpui-desktop.exe")
$receiptFile = $exe + '.source-receipt.json'
if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) {
    throw "GPUI_ONLY_UNAVAILABLE: No verified native executable at $exe. Run build-gpui-native.ps1."
}
if (-not (Test-Path -LiteralPath $receiptFile -PathType Leaf)) {
    throw "GPUI_ONLY_UNVERIFIED_BUILD: Refusing to launch an old cached GPUI binary without source receipt."
}
$head = (& git.exe -C $repoRoot rev-parse HEAD | Select-Object -First 1)
$origin = (& git.exe -C $repoRoot rev-parse origin/main | Select-Object -First 1)
if (-not $head -or -not $origin -or $head -ne $origin) {
    throw 'GPUI_ONLY_SOURCE_NOT_CURRENT: synchronize ARBOR main before launching.'
}
$changes = @(& git.exe -C $repoRoot status --porcelain=v1)
if ($LASTEXITCODE -ne 0 -or $changes.Count -gt 0) {
    throw 'GPUI_ONLY_DIRTY_SOURCE: refuse unpinned native launch.'
}
try {
    $receipt = Get-Content -LiteralPath $receiptFile -Raw | ConvertFrom-Json -AsHashtable
} catch {
    throw 'GPUI_ONLY_UNVERIFIED_BUILD: invalid source receipt.'
}
$hash = (Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash.ToLowerInvariant()
if ($receipt.schema -ne 'vivim.gpui-source-receipt/1' -or
    $receipt.sourceSha -ne $head -or
    $receipt.configuration -ne $Configuration -or
    $receipt.binarySha256 -ne $hash -or
    $receipt.firstContactDefault -ne $true) {
    throw 'GPUI_ONLY_STALE_BUILD: source/head, binary hash, or First Contact claim mismatch.'
}
# Local source files may be edited independently of HEAD (or restored afterward).
# This is an additional freshness check, not the principal source-identity proof.
$binaryWrite = (Get-Item -LiteralPath $exe).LastWriteTimeUtc
$freshestSource = Get-ChildItem -LiteralPath (Join-Path $repoRoot 'native\gpui-desktop\src') -Recurse -File -Filter '*.rs' |
    Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
if ($freshestSource -and $freshestSource.LastWriteTimeUtc -gt $binaryWrite) {
    throw 'GPUI_ONLY_STALE_BUILD: native source is newer than executable.'
}
$existing = @(Get-Process -Name 'vivim-gpui-desktop' -ErrorAction SilentlyContinue |
    Where-Object { $_.Path -and $_.Path.Equals($exe, [System.StringComparison]::OrdinalIgnoreCase) })
if ($existing.Count -gt 0) {
    Write-Output "GPUI_ONLY_REUSED PID=$($existing[0].Id) SOURCE=$head"
    exit 0
}
$started = Start-Process -FilePath $exe -WorkingDirectory $repoRoot -PassThru
Start-Sleep -Milliseconds 900
$live = Get-Process -Id $started.Id -ErrorAction SilentlyContinue
if (-not $live) {
    throw 'GPUI_ONLY_EXITED: native process exited; do not open another UI.'
}
Write-Output "GPUI_ONLY_VERIFIED_LAUNCHED PID=$($started.Id) SOURCE=$head BINARY_SHA256=$hash"
