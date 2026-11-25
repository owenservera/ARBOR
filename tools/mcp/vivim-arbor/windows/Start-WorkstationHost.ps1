[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$ReleaseRoot)
$ErrorActionPreference='Stop'
function Hash([string]$p){(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()}
$ReleaseRoot=(Resolve-Path -LiteralPath $ReleaseRoot).Path
$m=Get-Content -LiteralPath (Join-Path $ReleaseRoot 'manifest.json') -Raw|ConvertFrom-Json
if($m.schema -ne 'vivim.workstation-runtime/1'){throw 'Unknown release manifest'}
if($env:VIVIM_BOOTSTRAP_TOKEN){throw 'Environment owner-token binding not supported'}
$runtime=Join-Path $ReleaseRoot 'runtime';$bin=Join-Path $ReleaseRoot 'bin';$config=Join-Path $ReleaseRoot 'config'
$node=$m.nodeExe
if((Hash $node) -ne $m.nodeSha256){throw 'Node executable changed'}
$env:VIVIM_WORKSTATION_RECIPES=Join-Path $config 'recipes.json'
$env:VIVIM_WORKSTATION_ROOTS=Join-Path $config 'roots.json'
$env:VIVIM_WORKSTATION_RECIPES_SHA256=$m.recipeConfigSha
$env:VIVIM_WORKSTATION_ROOTS_SHA256=$m.rootConfigSha
if((Hash $env:VIVIM_WORKSTATION_RECIPES) -ne $m.recipeConfigSha -or (Hash $env:VIVIM_WORKSTATION_ROOTS) -ne $m.rootConfigSha){throw 'Config digest mismatch'}
$env:VIVIM_WORKSTATION_SESSION_EXE=Join-Path $bin 'vivim-workstation-session.exe'
$env:VIVIM_WORKSTATION_FILES_EXE=Join-Path $bin 'vivim-workstation-files.exe'
$env:VIVIM_WORKSTATION_PROBE_EXE=Join-Path $bin 'vivim-workstation-probe.exe'
$env:VIVIM_WORKSTATION_SESSION_SHA256=$m.helperSha256.session
$env:VIVIM_WORKSTATION_FILES_SHA256=$m.helperSha256.files
$env:VIVIM_WORKSTATION_PROBE_SHA256=$m.helperSha256.probe
if((Hash $env:VIVIM_WORKSTATION_SESSION_EXE) -ne $m.helperSha256.session -or (Hash $env:VIVIM_WORKSTATION_FILES_EXE) -ne $m.helperSha256.files -or (Hash $env:VIVIM_WORKSTATION_PROBE_EXE) -ne $m.helperSha256.probe){throw 'Native helper digest mismatch'}
$env:VIVIM_HOST_PORT='43187';$env:VIVIM_HOST_DATA_DIR=$m.dataRoot
if($m.cargoTargetDir){$env:CARGO_TARGET_DIR=$m.cargoTargetDir}
$entry=Join-Path $runtime 'apps\vivim-host\server.mjs'
if((Hash $entry) -ne $m.hostSha256){throw 'Host entry digest mismatch'}
if(@(Get-NetTCPConnection -LocalPort 43187 -State Listen -ErrorAction SilentlyContinue).Count){throw 'Host port occupied; no duplicate start'}
$existing=@(Get-CimInstance Win32_Process -Filter "Name='node.exe'"|Where-Object{[string]$_.CommandLine -match 'apps[\\/]vivim-host[\\/]server\.mjs'})
if($existing.Count){throw 'Existing Host process found; no duplicate start'}
$p=Start-Process -FilePath $node -ArgumentList @('"'+$entry+'"') -WorkingDirectory $runtime -WindowStyle Hidden -RedirectStandardOutput (Join-Path $ReleaseRoot 'host.stdout.log') -RedirectStandardError (Join-Path $ReleaseRoot 'host.stderr.log') -PassThru
$deadline=[DateTime]::UtcNow.AddSeconds(30);$ready=$false
while([DateTime]::UtcNow -lt $deadline){
 if($p.HasExited){throw 'New Host exited; inspect protected logs locally'}
 if(@(Get-NetTCPConnection -LocalPort 43187 -State Listen -ErrorAction SilentlyContinue|Where-Object{$_.OwningProcess -eq $p.Id}).Count){$ready=$true;break}
 Start-Sleep -Milliseconds 500
}
if(-not $ready){throw 'Host readiness not observed; do not promote tunnel'}
$proof=@(& $node (Join-Path $runtime 'tools\mcp\vivim-arbor\server\verify-workstation-host.mjs'))
if($LASTEXITCODE -ne 0 -or $proof.Count -ne 1){throw 'Authenticated Host readiness failed'}
$check=$proof[0]|ConvertFrom-Json
if($check.schema -ne 'vivim.workstation-host-readiness/1' -or -not $check.filesystem -or -not $check.processPlan){throw 'Host readiness contract mismatch'}
Write-Output ('PRODUCTION_HOST_PID='+$p.Id)
Write-Output ('PRODUCTION_HOST_PROOF='+$proof[0])
