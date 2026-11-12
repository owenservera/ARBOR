# Install a persistent per-user command without changing machine PATH or shell profiles.
[CmdletBinding()]
param(
    [string]$DataDir = $(if ($env:CAPTURE_STUDIO_HOME) { $env:CAPTURE_STUDIO_HOME } else { 'C:\VIVIM' }),
    [ValidateRange(1024,65535)][int]$StudioPort = 38730
)
$ErrorActionPreference = 'Stop'
$installDir = Join-Path $env:LOCALAPPDATA 'VIVIM\cli'
$configFile = Join-Path $installDir 'installation.json'
if ((Test-Path -LiteralPath $configFile) -and -not $PSBoundParameters.ContainsKey('DataDir')) {
    $previous = Get-Content -LiteralPath $configFile -Raw | ConvertFrom-Json
    $DataDir = $previous.dataDir
    if (-not $PSBoundParameters.ContainsKey('StudioPort')) { $StudioPort = $previous.studioPort }
}
$DataDir = [IO.Path]::GetFullPath($DataDir)
if (-not (Test-Path -LiteralPath (Join-Path $DataDir 'chrome-profile') -PathType Container)) {
    throw 'Existing workspace chrome-profile required. Pass -DataDir with the existing VIVIM data directory; installation never creates a browser profile.'
}
$node = (Get-Command node -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
$version = & $node --version
if ($LASTEXITCODE -ne 0 -or $version -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 22) { throw 'Node.js 22 or newer required by the existing Studio runtime.' }
$entry = Join-Path $PSScriptRoot 'vivim-cli.ps1'
New-Item -ItemType Directory -Path $installDir -Force | Out-Null
$oldPath = [Environment]::GetEnvironmentVariable('Path', 'User')
# Keep an exact pre-install snapshot for recovery. Never replace it on reinstall.
$backup = Join-Path $installDir 'user-path-before-install.json'
if (-not (Test-Path -LiteralPath $backup)) { @{ path = $oldPath } | ConvertTo-Json | Set-Content -LiteralPath $backup -Encoding UTF8 }
@{ dataDir = $DataDir; studioPort = $StudioPort; nodePath = $node; entrypoint = $entry } | ConvertTo-Json | Set-Content -LiteralPath $configFile -Encoding UTF8
$launcher = "@echo off`r`nrem VIVIM per-user CLI; managed by install-cli.ps1.`r`n`"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe`" -NoLogo -NoProfile -ExecutionPolicy Bypass -File `"$entry`" %*`r`nexit /b %ERRORLEVEL%`r`n"
[IO.File]::WriteAllText((Join-Path $installDir 'vivim.cmd'), $launcher, [Text.Encoding]::ASCII)
$present = @($oldPath -split ';' | Where-Object { [Environment]::ExpandEnvironmentVariables($_.Trim().Trim('"')).TrimEnd('\') -ieq $installDir.TrimEnd('\') }).Count -gt 0
if (-not $present) {
    $newPath = if ([string]::IsNullOrEmpty($oldPath)) { $installDir } elseif ($oldPath.EndsWith(';')) { $oldPath + $installDir } else { $oldPath + ';' + $installDir }
    [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
}
if (-not (@($env:Path -split ';' | Where-Object { $_.TrimEnd('\') -ieq $installDir }).Count)) { $env:Path += ';' + $installDir }
# Tell Explorer and other environment-aware parents to refresh future child environments.
if (-not ('VivimEnvironmentBroadcast' -as [type])) {
    Add-Type 'using System; using System.Runtime.InteropServices; public class VivimEnvironmentBroadcast { [DllImport("user32.dll", CharSet=CharSet.Unicode, SetLastError=true)] public static extern IntPtr SendMessageTimeout(IntPtr h, uint m, UIntPtr w, string l, uint f, uint t, out UIntPtr r); }'
}
$result = [UIntPtr]::Zero
[void][VivimEnvironmentBroadcast]::SendMessageTimeout([IntPtr]0xffff, 0x1a, [UIntPtr]::Zero, 'Environment', 2, 5000, [ref]$result)
[pscustomobject]@{ launcher = (Join-Path $installDir 'vivim.cmd'); pathEntry = $installDir; pathChanged = (-not $present); dataDir = $DataDir; node = $node } | ConvertTo-Json
