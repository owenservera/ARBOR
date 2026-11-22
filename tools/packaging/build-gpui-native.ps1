# Build the one canonical GPUI desktop from exact ARBOR main, then stamp it.
# This is a build tool, not another application launcher or Host effect owner.
[CmdletBinding()]
param(
    [ValidateSet('debug','release')]
    [string]$Configuration = 'debug',
    [switch]$Offline
)
$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$manifest = Join-Path $repoRoot 'native\gpui-desktop\Cargo.toml'
$exe = Join-Path $repoRoot ("native\gpui-desktop\target\$Configuration\vivim-gpui-desktop.exe")
$receiptFile = $exe + '.source-receipt.json'
$head = (& git.exe -C $repoRoot rev-parse HEAD | Select-Object -First 1)
$origin = (& git.exe -C $repoRoot rev-parse origin/main | Select-Object -First 1)
if (-not $head -or -not $origin -or $head -ne $origin) {
    throw 'GPUI_BUILD_SOURCE_NOT_CURRENT: ARBOR HEAD must equal origin/main.'
}
if (@(& git.exe -C $repoRoot status --porcelain=v1).Count -gt 0) {
    throw 'GPUI_BUILD_DIRTY_SOURCE: do not stamp an uncommitted application.'
}
$mainSource = Get-Content -LiteralPath (Join-Path $repoRoot 'native\gpui-desktop\src\main.rs') -Raw
if ($mainSource -notmatch 'panel\s*:\s*Panel::FirstContact' -or
    $mainSource -notmatch 'Application::new\(\)\.run\(') {
    throw 'GPUI_BUILD_NOT_CANONICAL_FIRST_CONTACT: refuse retired desktop product home.'
}
$args = @('build','--manifest-path',$manifest,'--features','desktop','--locked','-j','4')
if ($Configuration -eq 'release') { $args += '--release' }
if ($Offline) { $args += '--offline' }
Push-Location $repoRoot
try {
    $cargo = (Get-Command cargo.exe -ErrorAction Stop).Source
    $compiled = Start-Process -FilePath $cargo -ArgumentList $args -WorkingDirectory $repoRoot -NoNewWindow -Wait -PassThru
    if ($compiled.ExitCode -ne 0) { throw "GPUI_BUILD_FAILED: cargo exit $($compiled.ExitCode)" }
} finally {
    Pop-Location
}
if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) {
    throw 'GPUI_BUILD_BINARY_NOT_CREATED'
}
if ((& git.exe -C $repoRoot rev-parse HEAD) -ne $head -or
    (& git.exe -C $repoRoot rev-parse origin/main) -ne $head -or
    @(& git.exe -C $repoRoot status --porcelain=v1).Count -gt 0) {
    throw 'GPUI_BUILD_SOURCE_CHANGED: cannot stamp an unpinned result.'
}
$hash = (Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash.ToLowerInvariant()
$receipt = [ordered]@{
    schema = 'vivim.gpui-source-receipt/1'
    sourceSha = $head
    configuration = $Configuration
    binarySha256 = $hash
    firstContactDefault = $true
    compiledAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    scope = 'Locally compiled GPUI binary, not on-device acceptance or phone parity'
}
$json = $receipt | ConvertTo-Json -Depth 5
$temp = $receiptFile + '.tmp'
[System.IO.File]::WriteAllText($temp,$json + [Environment]::NewLine,[System.Text.UTF8Encoding]::new($false))
Move-Item -LiteralPath $temp -Destination $receiptFile -Force
Write-Output "GPUI_BUILD_VERIFIED SOURCE=$head EXE=$exe SHA256=$hash RECEIPT=$receiptFile"
