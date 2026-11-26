# External administrator entrypoint for owner-directed installation.
# This is not an MCP tool or an authorization issuer. The independent administrator
# must obtain explicit owner approval for the exact candidate before invoking it.
# No GUI, credential transfer, remote approval endpoint, or automatic renewal.
# Never invoke from the VIVIM terminal whose authority is being replaced.
[CmdletBinding()]
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$SourceSha,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$PreviousSourceSha,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{64}$')][string]$ExpectedTreeSha256,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{64}$')][string]$ExpectedGrantSha256,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{64}$')][string]$ExpectedPreviousGrantSha256,
 [Parameter(Mandatory=$true)][switch]$OwnerDirectedStandingActivation,
 [string]$ConnectRoot='C:\0-BlackBoxProject-0\VIVIM-ARBOR-CONNECT'
)
$ErrorActionPreference='Stop'
if(-not $OwnerDirectedStandingActivation){throw 'Explicit external owner-directed deployment required'}
$root=(Resolve-Path -LiteralPath $ConnectRoot).Path
$source=$SourceSha
$priorSource=$PreviousSourceSha
if($source -ceq $priorSource){throw 'Candidate must be distinct from current release'}
# The switch is a declaration by the external operator, NOT cryptographic proof
# of identity or local physical presence. No authorization claim is fabricated.
$release=Join-Path $root ('workstation-runtime-'+$source.Substring(0,12))
$oldRelease=Join-Path $root ('workstation-runtime-'+$priorSource.Substring(0,12))
$build=Join-Path $root ('workstation-build-'+$source.Substring(0,12))
$receipt=Join-Path $build 'build-receipt.json'
$seal=Join-Path $build 'release-seal.json'
$marker=Join-Path $root 'maintenance\drain.json'
$liveGrant=Join-Path $root 'session-authority\grant.json'
$candidateGrant=Join-Path $release 'profile\session-authority\grant.json'
$modules=@('host-discovery.cjs','workstation-probe-tunnel.cjs','probe-acceptance.cjs','workstation-tunnel.cjs','maintenance-gate.cjs','tunnel-readonly.cjs')
$node=(Get-Command node.exe -CommandType Application | Select-Object -First 1).Source
$utf8=[Text.UTF8Encoding]::new($false)
function Hash([string]$f){(Get-FileHash -LiteralPath $f -Algorithm SHA256).Hash.ToLowerInvariant()}
function Json([string]$f){Get-Content -LiteralPath $f -Raw | ConvertFrom-Json}
function Verify-Seal {
 $v=@(& $node (Join-Path $build 'source\tools\mcp\vivim-arbor\server\release-evidence.mjs') verify $release $receipt $seal)
 if($LASTEXITCODE -ne 0 -or $v.Count -ne 1){throw 'Release seal verification failed'}
 $proof=$v[0]|ConvertFrom-Json
 if($proof.sourceSha -cne $source -or $proof.promotionPerformed -ne $false){throw 'Wrong candidate evidence'}
 if($proof.treeSha256 -cne $ExpectedTreeSha256 -or $proof.grantSha256 -cne $ExpectedGrantSha256 -or (Hash $candidateGrant) -cne $proof.grantSha256){throw 'Candidate does not match approved release and grant digests'}
 return $proof
}
function Protect([string]$d){
 $acl=Get-Acl -LiteralPath $d
 $acl.SetAccessRuleProtection($true,$false)
 foreach($r in @($acl.Access)){[void]$acl.RemoveAccessRuleSpecific($r)}
 $me=[Security.Principal.WindowsIdentity]::GetCurrent().User
 $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($me,'FullControl','ContainerInherit,ObjectInherit','None','Allow'))
 Set-Acl -LiteralPath $d -AclObject $acl
}
function Host-Listener {
 $listeners=@(Get-NetTCPConnection -LocalPort 43187 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
 if($listeners.Count -ne 1){throw 'Expected one Host listener'}
 $proc=Get-CimInstance Win32_Process -Filter ('ProcessId='+$listeners[0])
 if(!$proc -or $proc.Name -ne 'node.exe'){throw 'Host listener identity mismatch'}
 return $proc
}
function Tunnel-Identity {
 $exe=Join-Path $root 'runtime\v0.0.21\verified\tunnel-client.exe'
 $s=@(Get-CimInstance Win32_Process -Filter "Name='tunnel-client.exe'" | Where-Object{$_.ExecutablePath -eq $exe})
 if($s.Count -ne 1){throw 'Expected one verified tunnel supervisor'}
 $c=@(Get-CimInstance Win32_Process -Filter ('ParentProcessId='+$s[0].ProcessId) | Where-Object{$_.Name -eq 'node.exe' -and $_.CommandLine -match 'VIVIM-ARBOR-CONNECT[\\/]server[\\/]tunnel-readonly\.cjs'})
 if($c.Count -ne 1){throw 'Expected one owned MCP child'}
 return @{supervisor=$s[0].ProcessId;child=$c[0].ProcessId}
}
function Assert-Idle([int]$hostId){
 $h=Host-Listener
 if($h.ProcessId -ne $hostId -or $h.CommandLine -notlike "*$oldRelease*"){throw 'Incumbent Host changed'}
 $sockets=@(Get-NetTCPConnection -OwningProcess $hostId -State Established -ErrorAction SilentlyContinue)
 if($sockets.Count){throw 'Host connections active; leave production untouched'}
 $all=@(Get-CimInstance Win32_Process)
 $parents=@($hostId)
 $seen=@()
 for($depth=0;$depth -lt 10;$depth++){
  $children=@($all|Where-Object{$_.ParentProcessId -in $parents -and $_.ProcessId -notin $seen})
  if(!$children.Count){return}
  foreach($c in $children){
   if($c.Name -notin @('conhost.exe','vivim-workstation-session.exe')){throw 'Managed native job still active; no interruption'}
   $seen+=$c.ProcessId
  }
  $parents=@($children.ProcessId)
 }
 throw 'Host descendant inventory exceeded bound'
}
function Stop-VerifiedHost($identity,[string]$expectedRelease){
 # Retain the exact process handle, not just a PID. Windows may retain a
 # terminated process object while another handle is open.
 $pidValue=[int]$identity.ProcessId
 $p=[Diagnostics.Process]::GetProcessById($pidValue)
 try{
  $null=$p.Handle
  $current=Host-Listener
  if($current.ProcessId -ne $pidValue -or $current.CreationDate -ne $identity.CreationDate -or $current.CommandLine -notlike "*$expectedRelease*" -or $p.HasExited){throw 'Host identity changed before stop'}
  $p.Kill()
  if(-not $p.WaitForExit(60000) -or -not $p.HasExited){throw 'Verified Host process did not exit'}
 }finally{$p.Dispose()}
 # The old process has actually exited; require an unoccupied listener
 # and no live Host entrypoint before allowing the next start.
 $deadline=[DateTime]::UtcNow.AddSeconds(30)
 do{
  $listeners=@(Get-NetTCPConnection -LocalPort 43187 -State Listen -ErrorAction SilentlyContinue)
  if($listeners.Count){throw 'Unexpected Host listener after shutdown; reconcile before starting'}
  $remaining=@(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object{[string]$_.CommandLine -match 'apps[\\/]vivim-host[\\/]server\.mjs'})
  if(-not $remaining.Count){return}
  Start-Sleep -Milliseconds 500
 }while([DateTime]::UtcNow -lt $deadline)
 throw 'Host process inventory did not clear; reconcile before starting'
}
function Restart-Mcp([int]$supervisorId){
 $t=Tunnel-Identity
 if($t.supervisor -ne $supervisorId){throw 'Supervisor changed'}
 Stop-Process -Id $t.child -ErrorAction Stop
 for($i=0;$i -lt 20;$i++){
  Start-Sleep -Milliseconds 500
  try{$n=Tunnel-Identity;if($n.supervisor -eq $supervisorId -and $n.child -ne $t.child){return}}catch{}
 }
 throw 'MCP child restart not observed'
}
function Remove-Marker([string]$id){
 if(Test-Path -LiteralPath $marker){
  $r=Json $marker
  if($r.id -ne $id){throw 'Maintenance marker ownership changed'}
  Remove-Item -LiteralPath $marker
 }
}
function Verify-Live {
 $messages=@('{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25"}}','{"jsonrpc":"2.0","method":"notifications/initialized"}','{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"vivim_tunnel_health","arguments":{}}}','{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"vivim_workstation_recipes","arguments":{}}}')
 # The exact staged profile has the same sealed grant/modules; verify it while
 # the incumbent remote admission marker is still closed.
 $lines=@($messages|& $node (Join-Path $release 'profile\server\tunnel-readonly.cjs'))
 if($LASTEXITCODE -ne 0 -or $lines.Count -ne 3){throw 'Installed MCP verification failed'}
 $health=($lines[1]|ConvertFrom-Json).result.content[0].text|ConvertFrom-Json
 $grant=($lines[2]|ConvertFrom-Json).result.content[0].text|ConvertFrom-Json
 if($health.status -ne 'ready' -or $health.workstationHealth.cDrive -ne 'accessible' -or $grant.schema -ne 'vivim.workstation-tunnel-grant-summary/1' -or $grant.machineScope -ne $true -or !$grant.PSObject.Properties['expiresAt'] -or $null -ne $grant.expiresAt){throw 'Standing owner-machine access not verified'}
}
$proof=Verify-Seal
$g=Json $candidateGrant
$old=Json $liveGrant
$m=Json (Join-Path $release 'manifest.json')
$oldM=Json (Join-Path $oldRelease 'manifest.json')
if(!$g.PSObject.Properties['expiresAt'] -or $null -ne $g.expiresAt -or $g.machineScope -ne $true -or !$g.terminal -or $old.machineScope -ne $true -or $m.dataRoot -ne $oldM.dataRoot -or $m.ownerProfile -ne 'machine'){throw 'Not the requested standing replacement of the existing owner profile'}
if($null -eq $old.expiresAt -or $old.expiresAt -gt [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()){throw 'Existing grant changed or remains active; reconcile before replacing'}
$oldHost=Host-Listener
if($oldHost.CommandLine -notlike "*$oldRelease*"){throw 'Unexpected incumbent release'}
$tunnel=Tunnel-Identity
if(Test-Path -LiteralPath $marker){throw 'Another maintenance operation is active'}
# No dialog. This entrypoint runs under an independently authorized administrator
# channel, with explicit owner direction and exact release/grant pins.
if((Hash $liveGrant) -cne $ExpectedPreviousGrantSha256){throw 'Incumbent grant changed'}
function SameSet($a,$b){
 return ((@($a|Sort-Object) -join [char]31) -ceq (@($b|Sort-Object) -join [char]31))
}
if(-not (SameSet $old.recipes $g.recipes) -or -not (SameSet $old.roots $g.roots) -or -not (SameSet $old.interactiveRecipes $g.interactiveRecipes) -or -not (SameSet $old.terminal.programs $g.terminal.programs) -or -not (SameSet $old.terminal.roots $g.terminal.roots) -or $old.allowWrites -ne $g.allowWrites -or $old.terminal.allowInteractive -ne $g.terminal.allowInteractive){throw 'Standing replacement must retain the existing machine scope'}
$before=Json (Join-Path $oldRelease 'config\terminal-policy.json')
$after=Json (Join-Path $release 'config\terminal-policy.json')
if(-not (SameSet $before.machineScope.protectedPaths $after.machineScope.protectedPaths) -or $before.maxTimeoutMs -ne $after.maxTimeoutMs -or $before.allowInteractive -ne $after.allowInteractive){throw 'Standing replacement changes protected paths or session restrictions'}

$proof=Verify-Seal
$id=[Guid]::NewGuid().ToString('N')
$backup=Join-Path $root ('rollback-standing-'+$source.Substring(0,12)+'-'+$id.Substring(0,8))
New-Item -ItemType Directory -Path $backup|Out-Null
Protect $backup
foreach($n in $modules){Copy-Item -LiteralPath (Join-Path $root "server\$n") -Destination (Join-Path $backup $n)}
Copy-Item -LiteralPath $liveGrant -Destination (Join-Path $backup 'grant.json')
Copy-Item -LiteralPath (Join-Path $root 'windows\Connect-Vivim.ps1') -Destination (Join-Path $backup 'Connect-Vivim.ps1')
function Record([string]$phase){
 $record=@{schema='vivim.owner-local-handover/1';phase=$phase;id=$id;previousSource=$priorSource;candidateSource=$source;approvalSource='external-administrator-owner-directed';physicalPresenceAttested=$false;approvedTreeSha=$ExpectedTreeSha256;candidateGrantSha=$proof.grantSha256;previousGrantSha=(Hash (Join-Path $backup 'grant.json'));supervisorPid=$tunnel.supervisor}
 [IO.File]::WriteAllText((Join-Path $backup 'handover.json'),($record|ConvertTo-Json -Compress),$utf8)
}
Record 'rollback-ready'
$markerOwned=$false
$hostStopped=$false
$modulesChanged=$false
try{
 $stream=[IO.File]::Open($marker,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
 $markerOwned=$true
 try{$bytes=$utf8.GetBytes((@{schema='vivim.workstation-maintenance/1';id=$id}|ConvertTo-Json -Compress));$stream.Write($bytes,0,$bytes.Length)}finally{$stream.Dispose()}
 Start-Sleep -Seconds 5
 Assert-Idle $oldHost.ProcessId
 Start-Sleep -Seconds 2
 Assert-Idle $oldHost.ProcessId
 if((Hash $liveGrant) -cne $ExpectedPreviousGrantSha256){throw 'Incumbent grant changed during drain'}
 $t=Tunnel-Identity
 if($t.supervisor -ne $tunnel.supervisor -or $t.child -ne $tunnel.child){throw 'Tunnel identity changed during drain'}
 Record 'promotion-claimed'
 $hostStopped=$true
 Stop-VerifiedHost $oldHost $oldRelease
 & (Join-Path $release 'Start-WorkstationHost.ps1') -ReleaseRoot $release
 $newHost=Host-Listener
 if($newHost.CommandLine -notlike "*$release*"){throw 'Candidate Host identity mismatch'}
 $modulesChanged=$true
 foreach($n in $modules){
  $from=Join-Path $release "profile\server\$n";$to=Join-Path $root "server\$n"
  Copy-Item -LiteralPath $from -Destination $to -Force
  if((Hash $from) -cne (Hash $to)){throw 'Adapter hash mismatch'}
 }
 Copy-Item -LiteralPath $candidateGrant -Destination $liveGrant -Force
 if((Hash $liveGrant) -cne $proof.grantSha256){throw 'Installed grant hash mismatch'}
 Copy-Item -LiteralPath (Join-Path $release 'runtime\tools\mcp\vivim-arbor\windows\Connect-Vivim.ps1') -Destination (Join-Path $root 'windows\Connect-Vivim.ps1') -Force
 Restart-Mcp $tunnel.supervisor
 Verify-Live
 Record 'candidate-verified'
 Record 'promoted'
 Remove-Marker $id
 $markerOwned=$false
 Write-Output 'STANDING_OWNER_MACHINE_ACTIVE'
}catch{
 Write-Warning ('Activation failed: '+$_.Exception.Message)
 try{
  if($modulesChanged){
   foreach($n in $modules){Copy-Item -LiteralPath (Join-Path $backup $n) -Destination (Join-Path $root "server\$n") -Force}
   Copy-Item -LiteralPath (Join-Path $backup 'grant.json') -Destination $liveGrant -Force
   Copy-Item -LiteralPath (Join-Path $backup 'Connect-Vivim.ps1') -Destination (Join-Path $root 'windows\Connect-Vivim.ps1') -Force
  }
  if($hostStopped){
   $listeners=@(Get-NetTCPConnection -LocalPort 43187 -State Listen -ErrorAction SilentlyContinue)
   if($listeners.Count){
    $h=Host-Listener
    if($h.CommandLine -like "*$release*"){Stop-VerifiedHost $h $release}
    elseif($h.CommandLine -notlike "*$oldRelease*"){throw 'Unexpected rollback listener; no process stopped'}
   }
   if(-not @(Get-NetTCPConnection -LocalPort 43187 -State Listen -ErrorAction SilentlyContinue).Count){
    try{& (Join-Path $oldRelease 'Start-WorkstationHost.ps1') -ReleaseRoot $oldRelease}catch{Write-Warning 'Prior grant is expired; authenticated readiness may remain denied'}
   }
   $h=Host-Listener
   if($h.CommandLine -notlike "*$oldRelease*"){throw 'Prior Host not restored'}
  }
  if($modulesChanged){Restart-Mcp $tunnel.supervisor}
  if($markerOwned){Remove-Marker $id;$markerOwned=$false}
  Record 'rolled-back'
 }catch{Write-Warning 'Rollback needs local reconciliation; do not replay effects automatically';Record 'reconciliation-required'}
 exit 1
}
