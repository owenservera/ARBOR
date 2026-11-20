# File: studio/scripts/windows/VIVIM.ps1

> Generated 2026-11-19 · PowerShell · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/scripts/windows/VIVIM.ps1 |
| Language | PowerShell |
| Kind | source |
| Size | 25942 B |
| Lines | 432 |
| Hash | fd953094ae5f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Say | function | 34 | yes | function Say([string]$Text) { Write-Host $Text } |
| Preview | function | 35 | yes | function Preview([string]$Text) { Write-Host &quot;[Preview] $Text&quot; -ForegroundColor Cyan } |
| Get-Health | function | 41 | yes | function Get-Health([int]$Port, [string]$Token) { |
| Get-ListenerPorts | function | 80 | yes | function Get-ListenerPorts([switch]$Fresh) { |
| Test-Port | function | 98 | yes | function Test-Port([int]$Port, [switch]$Fresh) { |
| Read-Json | function | 105 | yes | function Read-Json([string]$Path) { |
| Test-Alive | function | 109 | yes | function Test-Alive($ProcessId) { |
| Get-Owner | function | 113 | yes | function Get-Owner { |
| Get-LaunchedLog | function | 118 | yes | function Get-LaunchedLog { |
| Get-PairingUrl | function | 126 | yes | function Get-PairingUrl([string]$Log) { |
| Get-TokenFromUrl | function | 131 | yes | function Get-TokenFromUrl([string]$Url) { |
| Get-KnownToken | function | 137 | yes | function Get-KnownToken { |
| Find-Studio | function | 147 | yes | function Find-Studio { |
| Open-World | function | 170 | yes | function Open-World($Found) { |
| Show-PhoneLink | function | 184 | yes | function Show-PhoneLink([string]$PairingUrl) { |
| Wait-Exit | function | 194 | yes | function Wait-Exit { |
| Find-Node | function | 198 | yes | function Find-Node { |
| Stop-Studio | function | 210 | yes | function Stop-Studio { |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```powershell
# VIVIM one-click start for Windows. Double-click VIVIM.cmd (or a VIVIM shortcut).
#
#   .\VIVIM.ps1            reuse a running VIVIM, otherwise open the dedicated browser + Studio
#   .\VIVIM.ps1 -LanPair   same, with phone pairing (prints the phone link + QR code)
#   .\VIVIM.ps1 -Stop      stop the Studio we started, or ask before stopping another owner
#   .\VIVIM.ps1 -DryRun    preview only: checks everything, starts/stops/opens nothing
#
# One Studio per browser. Studio runs hidden in the background, so closing this window does not
# stop it; use "Stop VIVIM". The launcher never closes a browser, sends an AI message or signs in.
# Windows PowerShell 5.1 compatible; keep this file ASCII-only (5.1 reads BOM-less files as ANSI).
[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$LanPair,
    [switch]$Stop,
    [switch]$Force,
    [switch]$NoPause,
    [string]$DataDir = $(if ($env:CAPTURE_STUDIO_HOME) { $env:CAPTURE_STUDIO_HOME } else { 'C:\VIVIM' }),
    [ValidateRange(1024, 65535)][int]$StudioPort = 38730,
    [string]$ManifestProfileDir,
    [string]$ManifestChromeExecutable,
    [int]$ManifestCdpPort
)
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$cli = Join-Path $repo 'bin\studio.mjs'
$helper = Join-Path $PSScriptRoot 'launcher-helper.mjs'
$cdpPort = 38702
# Manifest values (from vivim start) replace the defaults: exact CDP port, profile and executable.
if ($PSBoundParameters.ContainsKey('ManifestCdpPort')) { $cdpPort = $ManifestCdpPort }
$nodeDownload = 'https://nodejs.org/en/download'
$interactive = [Environment]::UserInteractive -and -not $NoPause

function Say([string]$Text) { Write-Host $Text }
function Preview([string]$Text) { Write-Host "[Preview] $Text" -ForegroundColor Cyan }

# --- Studio health -----------------------------------------------------------------------------
# Returns 'ok' (VIVIM answered), 'locked' (VIVIM answered but wants its pairing token),
# 'other' (something else listens there) or 'none' (nothing listens).
# HttpWebRequest with no proxy: works on PowerShell 5.1 and 7 and never routes loopback via a proxy.
function Get-Health([int]$Port, [string]$Token) {
    # A closed port never gets an HttpWebRequest: on Windows a refused loopback connect costs ~2 s,
    # so a port scan paid seconds per dead candidate. The listener snapshot answers in milliseconds.
    if (-not (Test-Port $Port)) { return [pscustomobject]@{ State = 'none'; Port = $Port; Health = $null } }
    $request = [Net.HttpWebRequest]::Create("http://127.0.0.1:$Port/api/v1/health")
    $request.Proxy = $null
    $request.Timeout = 2500
    $request.ReadWriteTimeout = 2500
    if ($Token) { $request.Headers.Add('x-studio-token', $Token) }
    $response = $null
    try {
        $response = $request.GetResponse()
        $reader = New-Object IO.StreamReader($response.GetResponseStream())
        $body = $reader.ReadToEnd() | ConvertFrom-Json
        if ($body.apiVersion -eq 1 -and $body.version -and $null -ne $body.recorder) {
            return [pscustomobject]@{ State = 'ok'; Port = $Port; Health = $body }
        }
        return [pscustomobject]@{ State = 'other'; Port = $Port; Health = $null }
    } catch [Net.WebException] {
        $failed = $_.Exception.Response
        if ($failed) {
            $code = [int]$failed.StatusCode
            $failed.Close()
            # Studio in pairing (token) mode answers 401 for /api/* without the token.
            if ($code -eq 401) { return [pscustomobject]@{ State = 'locked'; Port = $Port; Health = $null } }
            return [pscustomobject]@{ State = 'other'; Port = $Port; Health = $null }
        }
        if (Test-Port -Port $Port -Fresh) { return [pscustomobject]@{ State = 'other'; Port = $Port; Health = $null } }
        return [pscustomobject]@{ State = 'none'; Port = $Port; Health = $null }
    } catch {
        return [pscustomobject]@{ State = 'other'; Port = $Port; Health = $null }
    } finally { if ($response) { $response.Close() } }
}
# TCP connect to a closed loopback port costs ~2 s on Windows (the failing connect is retried
# before it reports ConnectFailure). The OS listener table is one cheap call, so a probe asks it
# instead. The 500 ms cache is deliberate: the start loop polls a port that only starts listening
# during the loop, so a snapshot older than half a second is never trusted.
$listenerPorts = $null
$listenerPortsAt = [DateTime]::MinValue
function Get-ListenerPorts([switch]$Fresh) {
```

_First 80 of 433 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
