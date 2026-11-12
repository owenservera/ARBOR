# Public CLI adapter over the existing Windows launcher. No separate browser owner.
[CmdletBinding()]
param(
    [Parameter(Position=0)][string]$Command = 'help',
    [Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments
)
$ErrorActionPreference = 'Stop'
try {
    if ($Command -in @('help', '--help', '-h')) {
        Write-Output @'
VIVIM Windows CLI
Usage: vivim <start|status|doctor|stop> [options]
  start   Unavailable until manifest-selected browser ownership can be verified.
  status  Read configured Studio health and ownership. Does not start anything.
  doctor  Run existing Studio diagnostics for the installed workspace.
  stop    Stop only launcher-owned Studio; preserve Chrome and sign-ins.
This adapter does not add Host/relay supervision or automatic Windows startup.
Reinstall: powershell -NoProfile -File studio/scripts/windows/install-cli.ps1
'@
        exit 0
    }
    if ($Command -notin @('start', 'status', 'doctor', 'stop')) { throw "Unknown command '$Command'. Use vivim --help." }
    $configFile = Join-Path $env:LOCALAPPDATA 'VIVIM\cli\installation.json'
    $config = Get-Content -LiteralPath $configFile -Raw | ConvertFrom-Json
    if (-not (Test-Path -LiteralPath $config.nodePath)) { throw 'Installed Node runtime missing. Re-run install-cli.ps1.' }
    if ($Command -ne 'start') { $env:CAPTURE_STUDIO_HOME = $config.dataDir }
    $env:Path = (Split-Path $config.nodePath) + ';' + $env:Path
    $launcher = Join-Path $PSScriptRoot 'VIVIM.ps1'
    if ($Command -eq 'doctor') {
        & $config.nodePath (Join-Path $PSScriptRoot '..\..\bin\studio.mjs') doctor --data-dir $config.dataDir --port 38702 @Arguments
        exit $LASTEXITCODE
    }
    if ($Command -eq 'status') {
        if ($Arguments.Count -and ($Arguments.Count -ne 1 -or $Arguments[0] -ne '--json')) { throw 'Usage: vivim status [--json]' }
        $ownerFile = Join-Path $config.dataDir 'locks\cdp-38702.json'
        $owner = if (Test-Path -LiteralPath $ownerFile) { Get-Content -LiteralPath $ownerFile -Raw | ConvertFrom-Json } else { $null }
        $owned = $false
        if ($owner.pid) {
            $process = Get-CimInstance Win32_Process -Filter "ProcessId = $([int]$owner.pid)" -ErrorAction SilentlyContinue
            $owned = $process -and $process.Name -eq 'node.exe' -and $process.CommandLine -match 'studio\.mjs' -and $process.CommandLine -match '\s(?:serve|start)(?:\s|$)'
        }
        $health = 'not-probed'
        if ($owned -and $owner.studioPort) {
            $request = [Net.HttpWebRequest]::Create("http://127.0.0.1:$([int]$owner.studioPort)/api/v1/health")
            $request.Proxy = $null; $request.Timeout = 2500
            $response = $null
            try {
                $response = $request.GetResponse()
                $reader = New-Object IO.StreamReader($response.GetResponseStream())
                $body = $reader.ReadToEnd() | ConvertFrom-Json
                $health = if ($body.apiVersion -eq 1 -and $null -ne $body.recorder) { 'ready' } else { 'unexpected-response' }
            } catch { $health = 'unavailable-or-pairing-required' }
            finally { if ($response) { $response.Close() } }
        }
        [pscustomobject]@{
            component = 'Studio'; state = $(if ($owned) { 'running' } else { 'stopped' })
            health = $health; dataDir = $config.dataDir
            profileDir = (Join-Path $config.dataDir 'chrome-profile')
            pid = $(if ($owned) { $owner.pid } else { $null })
            staleOwnerRecord = [bool]($owner -and -not $owned)
            supervision = 'Existing Windows Studio launcher only; Host/relay supervisor not implemented'
        } | ConvertTo-Json
        exit 0
    }
    # Bind only supported switches, never arbitrary workspace overrides or positional values.
    $options = @{}
    foreach ($argument in $Arguments) {
        switch ($argument.ToLowerInvariant()) {
            { $_ -in @('-dryrun', '--dry-run') } { $options.DryRun = $true; break }
            '-force' { if ($Command -ne 'stop') { throw '-Force is only supported by stop.' }; $options.Force = $true; break }
            '-lanpair' { if ($Command -ne 'start') { throw '-LanPair is only supported by start.' }; $options.LanPair = $true; break }
            default { throw "Unsupported option '$argument'. Workspace and port are installation settings." }
        }
    }
    # start: the manifest is the single source of the browser executable, profile and CDP port.
    # Its profile and executable are passed to the launcher; nothing falls back to other paths.
    $startOptions = @{}
    if ($Command -eq 'start') {
        $resolver = Join-Path $PSScriptRoot 'resolve-start-config.mjs'
        $resolved = (& $config.nodePath $resolver $config.dataDir | ConvertFrom-Json)
        if ($LASTEXITCODE -ne 0 -or -not $resolved.chrome) {
            if ($resolved.error) { throw "$($resolved.error): $($resolved.message)" }
            throw 'MANIFEST_INVALID: Could not resolve workspace configuration. Run vivim doctor.'
        }
        $startOptions = @{ ManifestProfileDir = $resolved.chrome.profileDir; ManifestChromeExecutable = $resolved.chrome.executable; ManifestCdpPort = [int]$resolved.chrome.port }
    }
    $env:CAPTURE_STUDIO_HOME = $config.dataDir
    if ($Command -eq 'stop') { & $launcher -DataDir $config.dataDir -StudioPort $config.studioPort -NoPause -Stop @options }
    else { & $launcher -DataDir $config.dataDir -StudioPort $config.studioPort -NoPause @options @startOptions }
    exit $LASTEXITCODE
} catch {
    [Console]::Error.WriteLine("VIVIM: $($_.Exception.Message)")
    exit 1
}
