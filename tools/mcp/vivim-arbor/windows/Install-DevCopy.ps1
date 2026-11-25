# One-click development installer — local MCP slice.
# Run only from a source-pinned development bundle, never the live Connect root.
[CmdletBinding()]
param()
$ErrorActionPreference='Stop'
$bundle=Split-Path -Parent $PSScriptRoot
if((Split-Path -Leaf $bundle) -cnotmatch '^vivim-dev-setup-[a-f0-9]{12}$'){throw 'Expected a dedicated development bundle'}
$parent=Split-Path -Parent $bundle
$root=Join-Path $parent 'vivim-dev-instance'
$source=Join-Path $bundle 'server'
$sha=(Get-Content -LiteralPath (Join-Path $bundle 'source-sha.txt') -Raw).Trim()
if($sha -cnotmatch '^[a-f0-9]{40}$' -or -not (Split-Path -Leaf $bundle).EndsWith($sha.Substring(0,12))){throw 'Source identity mismatch'}
$node=(Get-Command node.exe -CommandType Application -ErrorAction Stop|Select-Object -First 1).Source
function Assert-Plain([string]$p){
 $item=Get-Item -LiteralPath $p -Force
 if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Reparse points are not allowed'}
}
function Inventory([string]$p){
 Assert-Plain $p
 $files=@(Get-ChildItem -LiteralPath $p -Recurse -Force)
 foreach($f in $files){Assert-Plain $f.FullName}
 $rows=@($files|Where-Object {!$_.PSIsContainer}|ForEach-Object{
  $name=$_.FullName.Substring($p.Length+1).Replace('\','/')
  "$name $((Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant())"
 }|Sort-Object)
 if($rows.Count -eq 0){throw 'Empty source'}
 return ($rows -join "`n")
}
function Probe([string]$path){
 $psi=[Diagnostics.ProcessStartInfo]::new()
 $psi.FileName=$node
 $psi.ArgumentList.Add((Join-Path $path 'tunnel-readonly.cjs'))
 $psi.WorkingDirectory=$path
 $psi.UseShellExecute=$false;$psi.CreateNoWindow=$true
 $psi.RedirectStandardInput=$true;$psi.RedirectStandardOutput=$true;$psi.RedirectStandardError=$true
 # Inherit only OS essentials, no production Host, tunnel, grants or credentials.
 $psi.Environment.Clear()
 foreach($key in @('SystemRoot','WINDIR','TEMP','TMP')){if([Environment]::GetEnvironmentVariable($key)){$psi.Environment[$key]=[Environment]::GetEnvironmentVariable($key)}}
 $psi.Environment['VIVIM_TUNNEL_FORCE_HEALTH_ONLY']='1'
 $psi.Environment['VIVIM_TUNNEL_HOST_DISCOVERY']='0'
 $p=[Diagnostics.Process]::Start($psi)
 try{
  $out=$p.StandardOutput.ReadToEndAsync();$err=$p.StandardError.ReadToEndAsync()
  foreach($line in @('{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25"}}','{"jsonrpc":"2.0","method":"notifications/initialized"}','{"jsonrpc":"2.0","id":2,"method":"tools/list"}','{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"vivim_tunnel_health"}}','{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"vivim_terminal_start"}}')){$p.StandardInput.WriteLine($line)}
  $p.StandardInput.Close()
  if(-not $p.WaitForExit(15000)){ $p.Kill($true);throw 'MCP timeout' }
  if($p.ExitCode -ne 0){throw 'MCP failed'}
  $lines=@($out.GetAwaiter().GetResult() -split '\r?\n'|Where-Object {$_})
  if($lines.Count -ne 4){throw 'MCP response count'}
  $list=($lines[1]|ConvertFrom-Json).result.tools
  $health=($lines[2]|ConvertFrom-Json).result.content[0].text|ConvertFrom-Json
  $denied=($lines[3]|ConvertFrom-Json).error.code
  if(@($list).Count -ne 1 -or $list[0].name -ne 'vivim_tunnel_health' -or $health.status -ne 'ready' -or $health.profile -ne 'private-readonly' -or $health.hostDiscovery -ne $false -or $denied -ne -32602){throw 'Isolated health-only admission failed'}
 }finally{$p.Dispose()}
}
Assert-Plain $bundle;Assert-Plain $source
$inventory=Inventory $source
$expected=(Get-Content -LiteralPath (Join-Path $bundle 'server-inventory.txt') -Raw).TrimEnd()
if($inventory -cne $expected){throw 'Bundle inventory mismatch'}
if(-not(Test-Path -LiteralPath $root)){New-Item -ItemType Directory -Path $root|Out-Null}
Assert-Plain $root
$marker=Join-Path $root 'dev-instance.marker'
if(-not(Test-Path -LiteralPath $marker)){
 if(@(Get-ChildItem -LiteralPath $root -Force).Count){throw 'Refusing unmarked existing directory'}
 [IO.File]::WriteAllText($marker,'vivim-dev-instance/1')
}
Assert-Plain $marker
if([IO.File]::ReadAllText($marker) -cne 'vivim-dev-instance/1'){throw 'Invalid development instance'}
$lock=[IO.File]::Open((Join-Path $root 'install.lock'),[IO.FileMode]::OpenOrCreate,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)
try{
 $generation=Join-Path $root $sha
 if(Test-Path -LiteralPath $generation){
  if((Inventory $generation) -cne $inventory){throw 'Installed generation differs; leave active pointer untouched'}
 }else{
  $stage=Join-Path $root ('.stage-'+[guid]::NewGuid().ToString('N'))
  Copy-Item -LiteralPath $source -Destination $stage -Recurse
  try{
   if((Inventory $stage) -cne $inventory){throw 'Staging mismatch'}
   Probe $stage
   [IO.Directory]::Move($stage,$generation)
  }finally{if(Test-Path -LiteralPath $stage){Remove-Item -LiteralPath $stage -Recurse -Force}}
 }
 Probe $generation
 $active=Join-Path $root 'active.json'
 if(Test-Path -LiteralPath $active){Assert-Plain $active}
 $old=if(Test-Path -LiteralPath $active){Get-Content -LiteralPath $active -Raw|ConvertFrom-Json}else{$null}
 if($old -and ($old.schema -ne 'vivim.dev-install/1' -or $old.sourceSha -cnotmatch '^[a-f0-9]{40}$')){throw 'Invalid active pointer'}
 if(-not $old -or $old.sourceSha -cne $sha){
  $pending=Join-Path $root ('.active-'+[guid]::NewGuid().ToString('N'))
  $record=@{schema='vivim.dev-install/1';sourceSha=$sha;previousSourceSha=if($old){$old.sourceSha}else{$null};scope='local-health-only';remoteConnected=$false}
  $bytes=[Text.Encoding]::UTF8.GetBytes(($record|ConvertTo-Json -Compress))
  $stream=[IO.File]::Open($pending,[IO.FileMode]::CreateNew)
  try{$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true)}finally{$stream.Dispose()}
  try{if($old){[IO.File]::Replace($pending,$active,$null)}else{[IO.File]::Move($pending,$active)}}finally{if(Test-Path -LiteralPath $pending){Remove-Item -LiteralPath $pending}}
 }
 Write-Output ('VIVIM_DEV_READY='+$sha)
 Write-Output 'MCP_HEALTH_ONLY=PASS; FORBIDDEN_TERMINAL=DENIED; REMOTE_CONNECTED=False'
}finally{$lock.Dispose()}
