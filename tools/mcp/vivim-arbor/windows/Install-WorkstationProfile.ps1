[CmdletBinding()]
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$SourceSha,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$NativeBuildSha,
 [Parameter(Mandatory=$true)][string]$NativeBinRoot,
 [string]$RepoRoot='C:\0-BlackBoxProject-0\ARBOR',
 [string]$ConnectRoot='C:\0-BlackBoxProject-0\VIVIM-ARBOR-CONNECT',
 [switch]$Activate,
 [switch]$EnableGeneralTerminal,
 [string]$OwnerProfilePath,
 [string]$OwnerProfileSha256,
 [switch]$EnableOwnerMachine
)
$ErrorActionPreference='Stop'
if($EnableOwnerMachine -and (-not $EnableGeneralTerminal -or $OwnerProfilePath -or $Activate)){throw 'Owner-machine requires explicit general terminal, stage only, no expanded selection'}
if($OwnerProfilePath){if($OwnerProfileSha256 -cnotmatch '^[a-f0-9]{64}$'){throw 'Reviewed owner selection SHA-256 required'}}elseif($OwnerProfileSha256){throw 'Selection digest requires owner profile path'}
if($OwnerProfilePath -and (!$EnableGeneralTerminal -or $Activate)){throw 'Expanded owner profile requires general terminal and stage-only operation; local supervised promotion required'}
$utf8=New-Object Text.UTF8Encoding($false)
function Hash([string]$p){(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()}
function Write-Json([string]$p,$obj){[IO.File]::WriteAllText($p,($obj|ConvertTo-Json -Depth 12 -Compress),$utf8)}
function Protect([string]$p){
 $acl=Get-Acl -LiteralPath $p;$acl.SetAccessRuleProtection($true,$false)
 foreach($r in @($acl.Access)){[void]$acl.RemoveAccessRuleSpecific($r)}
 $me=[Security.Principal.WindowsIdentity]::GetCurrent().User
 $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($me,'FullControl','ContainerInherit,ObjectInherit','None','Allow'))
 Set-Acl -LiteralPath $p -AclObject $acl
}
function Exe([string]$n){(Get-Command $n -CommandType Application -ErrorAction Stop|Select-Object -First 1).Source}
$RepoRoot=(Resolve-Path -LiteralPath $RepoRoot).Path;$ConnectRoot=(Resolve-Path -LiteralPath $ConnectRoot).Path
$NativeBinRoot=(Resolve-Path -LiteralPath $NativeBinRoot).Path
$node=Exe 'node.exe';$git=Exe 'git.exe';$ps=Exe 'powershell.exe'
# Rustup's cargo.exe proxy may canonicalize to rustup.exe. The native worker
# launches canonical paths, so bind the actual toolchain executable instead.
$rustup=Exe 'rustup.exe'
Push-Location $RepoRoot
try {
 $cargoPaths=@(& $rustup which cargo)
 if($LASTEXITCODE -ne 0 -or $cargoPaths.Count -ne 1){throw 'Rustup could not resolve active Cargo toolchain'}
 $cargo=(Resolve-Path -LiteralPath $cargoPaths[0].Trim()).Path
 if([IO.Path]::GetFileName($cargo) -ine 'cargo.exe'){throw 'Resolved executable is not Cargo'}
 $rustcPaths=@(& $rustup which rustc)
 if($LASTEXITCODE -ne 0 -or $rustcPaths.Count -ne 1){throw 'Rustc toolchain unavailable'}
 $rustdocPaths=@(& $rustup which rustdoc)
 if($LASTEXITCODE -ne 0 -or $rustdocPaths.Count -ne 1){throw 'Rustdoc toolchain unavailable'}
 $rustc=(Resolve-Path -LiteralPath $rustcPaths[0].Trim()).Path
 $rustdoc=(Resolve-Path -LiteralPath $rustdocPaths[0].Trim()).Path
 if([IO.Path]::GetFileName($rustc) -ine 'rustc.exe' -or [IO.Path]::GetFileName($rustdoc) -ine 'rustdoc.exe' -or (Split-Path -Parent $cargo) -ine (Split-Path -Parent $rustc) -or (Split-Path -Parent $cargo) -ine (Split-Path -Parent $rustdoc)){throw 'Cargo, rustc and rustdoc must be in one toolchain'}
 $cargoVersion=@(& $cargo --version)
 if($LASTEXITCODE -ne 0 -or ($cargoVersion -join ' ') -notmatch '^cargo [0-9]+\.[0-9]+\.[0-9]+'){throw 'Cargo toolchain verification failed'}
}finally{Pop-Location}
$short=$SourceSha.Substring(0,12);$release=Join-Path $ConnectRoot "workstation-runtime-$short"
if(Test-Path $release){throw 'Release already staged; reconcile before repeating'}
if($env:VIVIM_BOOTSTRAP_TOKEN){throw 'Environment owner-token binding not supported'}
& $git -C $RepoRoot fetch --no-tags origin main
if($LASTEXITCODE -ne 0){throw 'Git fetch failed'}
& $git -C $RepoRoot cat-file -e "$SourceSha^{commit}";if($LASTEXITCODE -ne 0){throw 'Source commit missing'}
$delta=@(& $git -C $RepoRoot diff --name-only $NativeBuildSha $SourceSha -- native/host-supervisor core/programmability Cargo.lock)
if($LASTEXITCODE -ne 0 -or $delta.Count -ne 0){throw 'Native helper source differs from verified build'}
New-Item -ItemType Directory -Path $release|Out-Null;Protect $release
$runtime=Join-Path $release 'runtime';$bin=Join-Path $release 'bin';$config=Join-Path $release 'config'
New-Item -ItemType Directory -Path $runtime,$bin,$config|Out-Null
$archive=Join-Path $release 'source.tar'
& $git -C $RepoRoot archive --format=tar --output=$archive $SourceSha;if($LASTEXITCODE -ne 0){throw 'Source archive failed'}
tar.exe -xf $archive -C $runtime;if($LASTEXITCODE -ne 0){throw 'Source extraction failed'}
Remove-Item -LiteralPath $archive
foreach($name in @('vivim-workstation-session.exe','vivim-workstation-files.exe','vivim-workstation-probe.exe')){
 $from=Join-Path $NativeBinRoot $name;$to=Join-Path $bin $name
 Copy-Item -LiteralPath $from -Destination $to
 if((Hash $from) -ne (Hash $to)){throw 'Native copy mismatch'}
}
$recipeFile=Join-Path $config 'recipes.json';$rootFile=Join-Path $config 'roots.json'
$scratch=Join-Path $ConnectRoot 'workstation-scratch'
if(-not(Test-Path $scratch)){New-Item -ItemType Directory -Path $scratch|Out-Null;Protect $scratch}
$environment=@('SystemRoot','WINDIR','PATH','PATHEXT','USERPROFILE','HOME','APPDATA','LOCALAPPDATA','TEMP','TMP','CARGO_HOME','RUSTUP_HOME','RUSTUP_TOOLCHAIN','CARGO_TARGET_DIR','LANG','TERM','NO_COLOR')
function Recipe([string]$id,[string]$exe,[string[]]$argv,[string]$work,[int]$timeout,[bool]$interactive=$false){
 @{id=$id;executable=$exe;executableSha256=Hash $exe;workspace=$work;args=@($argv);environment=$environment;interactive=$interactive;timeoutMs=$timeout}
}
$ff=Join-Path $config 'fast-forward-main.ps1'
$ffText=@'
$ErrorActionPreference='Stop'
$git='__GIT__'
$repo='__ROOT__'
if ((& $git -C $repo branch --show-current).Trim() -ne 'main') { throw 'Not on main' }
if (@(& $git -C $repo status --porcelain --untracked-files=no).Count -ne 0) { throw 'Tracked changes exist' }
& $git -C $repo merge --ff-only origin/main
exit $LASTEXITCODE
'@
$ffText=$ffText.Replace('__GIT__',$git.Replace("'","''")).Replace('__ROOT__',$RepoRoot.Replace("'","''"))
[IO.File]::WriteAllText($ff,$ffText,$utf8)
$recipes=@()
$recipes+=Recipe 'node-version' $node @('--version') $RepoRoot 15000
$recipes+=Recipe 'git-status' $git @('status','--short','--branch','--untracked-files=no') $RepoRoot 20000
$recipes+=Recipe 'git-head' $git @('rev-parse','HEAD') $RepoRoot 15000
$recipes+=Recipe 'git-fetch-main' $git @('fetch','--no-tags','origin','main') $RepoRoot 180000
$recipes+=Recipe 'git-fast-forward-main' $ps @('-NoLogo','-NoProfile','-NonInteractive','-File',$ff) $RepoRoot 120000
$recipes+=Recipe 'cargo-version' $cargo @('--version') $RepoRoot 15000
$cargoTests=Recipe 'cargo-host-tests' $cargo @('test','--offline','--locked','-j','2','-p','vivim-host-supervisor') $RepoRoot 1800000
$cargoTests.toolchain=@{rustc=@{path=$rustc;sha256=Hash $rustc};rustdoc=@{path=$rustdoc;sha256=Hash $rustdoc}}
$recipes+=$cargoTests
$recipes+=Recipe 'node-host-tests' $node @('--test','apps/vivim-host/test/control-dispatcher.test.mjs') $RepoRoot 300000
$recipes+=Recipe 'node-interactive-test' $node @('-e','process.stdin.on("data",b=>process.stdout.write("ECHO:"+b.toString(),()=>process.exit(0)))') $scratch 60000 $true
$zcode='C:\Program Files\ZCode\resources\glm\zcode.cjs'
if(Test-Path -LiteralPath $zcode -PathType Leaf){
 $recipes+=Recipe 'zcode-version' $node @($zcode,'--version') $RepoRoot 20000
 $recipes+=Recipe 'zcode-help' $node @($zcode,'--help') $RepoRoot 30000
}
Write-Json $recipeFile @{schema='vivim.workstation-recipes/1';recipes=@($recipes)}
$rootEntries=@(@{id='arbor';path=$RepoRoot},@{id='scratch';path=$scratch})
Write-Json $rootFile @{schema='vivim.workstation-roots/1';roots=$rootEntries}
Push-Location $runtime
try{$dataRoot=(& $node --input-type=module -e "import {studioDataDir} from './apps/vivim-host/server.mjs';process.stdout.write(studioDataDir())").Trim();if($LASTEXITCODE -ne 0 -or -not [IO.Path]::IsPathRooted($dataRoot)){throw 'Host data root unavailable'}}finally{Pop-Location}
$auth=(Resolve-Path -LiteralPath (Join-Path $runtime 'apps\vivim-host\bootstrap\owner-auth.mjs')).Path
$profile=Join-Path $release 'profile';$grantDir=Join-Path $profile 'session-authority';$src=Join-Path $runtime 'tools\mcp\vivim-arbor'
New-Item -ItemType Directory -Path $grantDir -Force|Out-Null
Copy-Item -LiteralPath (Join-Path $src 'server') -Destination (Join-Path $profile 'server') -Recurse
$grant=@{schema='vivim.workstation-tunnel-grant/1';id=[guid]::NewGuid().ToString('N');expiresAt=[DateTimeOffset]::UtcNow.AddHours(8).ToUnixTimeMilliseconds();port=43187;dataRoot=$dataRoot;ownerAuthModule=$auth;ownerAuthSha256=Hash $auth;recipeConfigSha=Hash $recipeFile;rootConfigSha=Hash $rootFile;recipes=@($recipes|ForEach-Object{$_.id});roots=@('arbor','scratch');interactiveRecipes=@('node-interactive-test');allowWrites=$true}
if($EnableGeneralTerminal){
 # Local operator explicitly opts in. These are general CLI programs, not a sandbox.
 $terminalPrograms=@()
 foreach($entry in @(@{id='node';path=$node},@{id='git';path=$git},@{id='powershell';path=$ps},@{id='cargo';path=$cargo},@{id='rustc';path=$rustc},@{id='rustdoc';path=$rustdoc})){
  $p=@{id=$entry.id;path=$entry.path;sha256=Hash $entry.path;environment=@($environment)}
  if($p.id -eq 'cargo'){$p.toolchain=$cargoTests.toolchain}
  $terminalPrograms+=$p
 }
 # Microsoft Store execution aliases may be inaccessible placeholders, not
 # native executables. PowerShell 5.1 is already registered independently.
 foreach($pwsh in @(Get-Command pwsh.exe -All -CommandType Application -ErrorAction SilentlyContinue)){
  if($pwsh.Source -match '(?i)[\\/]Microsoft[\\/]WindowsApps[\\/]'){continue}
  try{$pwshPath=(Resolve-Path -LiteralPath $pwsh.Source -ErrorAction Stop).Path;$pwshHash=Hash $pwshPath}
  catch{Write-Warning 'Skipping inaccessible optional PowerShell 7 executable';continue}
  if($pwshHash -notmatch '^[a-f0-9]{64}$'){continue}
  $terminalPrograms+=@{id='pwsh';path=$pwshPath;sha256=$pwshHash;environment=@($environment)}
  break
 }
 if($OwnerProfilePath){
  # The input is a local operator selection, not a remote authorization API.
  # Keep the selection outside the candidate and never copy it into public Git.
  $selection=(Resolve-Path -LiteralPath $OwnerProfilePath -ErrorAction Stop).Path
  $contextFile=Join-Path $config 'owner-selection-context.json'
  $protected=@($ConnectRoot,$dataRoot,$env:APPDATA,$env:LOCALAPPDATA,(Join-Path $env:USERPROFILE '.ssh'),(Join-Path $env:USERPROFILE '.aws'),(Join-Path $env:USERPROFILE '.azure'),(Join-Path $env:USERPROFILE '.config'),(Join-Path $env:USERPROFILE '.gnupg'),(Join-Path $env:USERPROFILE '.codex'),(Join-Path $env:USERPROFILE '.claude'),$env:WINDIR)|Where-Object {$_}
  Write-Json $contextFile @{baseRoots=$rootEntries;basePrograms=$terminalPrograms;protectedPaths=@($protected)}
  try{
   $projected=@(& $node (Join-Path $src 'server\owner-profile-selection.mjs') $selection $contextFile $OwnerProfileSha256)
   if($LASTEXITCODE -ne 0 -or $projected.Count -ne 1){throw 'Expanded owner selection rejected'}
   $expanded=$projected[0]|ConvertFrom-Json
   if($expanded.schema -ne 'vivim.owner-workstation-selection-result/1'){throw 'Invalid expanded projection'}
   $rootEntries=@($expanded.roots)
   $terminalPrograms=@($expanded.programs|ForEach-Object{
     if(-not $_.PSObject.Properties['environment']){$_|Add-Member -NotePropertyName environment -NotePropertyValue @($environment)}
     $_
   })
   $grant.expiresAt=[DateTimeOffset]::UtcNow.AddMinutes($expanded.expiresInMinutes).ToUnixTimeMilliseconds()
   $grant.allowWrites=[bool]$expanded.allowWrites
   $grant.roots=@($rootEntries|ForEach-Object{$_.id})
   if(-not $expanded.allowInteractive){$grant.interactiveRecipes=@()}
   $allowTerminalInteractive=[bool]$expanded.allowInteractive
   Write-Json $rootFile @{schema='vivim.workstation-roots/1';roots=$rootEntries}
   $grant.rootConfigSha=Hash $rootFile
  }finally{Remove-Item -LiteralPath $contextFile -ErrorAction Stop}
 }else{$allowTerminalInteractive=$true}

 $terminalFile=Join-Path $config 'terminal-policy.json'
 $terminalPolicy=@{schema='vivim.workstation-terminal-policy/1';enabled=$true;expiresAt=$grant.expiresAt;programs=@($terminalPrograms);roots=$rootEntries;maxTimeoutMs=1800000;allowInteractive=$allowTerminalInteractive}
 if($EnableOwnerMachine){
  $protected=@($ConnectRoot,$dataRoot,(Join-Path $env:USERPROFILE '.ssh'),(Join-Path $env:USERPROFILE '.aws'),(Join-Path $env:USERPROFILE '.azure'),(Join-Path $env:USERPROFILE '.gnupg'),(Join-Path $env:USERPROFILE '.codex'),(Join-Path $env:USERPROFILE '.claude'),(Join-Path $env:LOCALAPPDATA 'Google\Chrome\User Data'),(Join-Path $env:LOCALAPPDATA 'Microsoft\Edge\User Data'))|Where-Object {$_}|Sort-Object -Unique
  $machine=@{schema='vivim.owner-machine-scope/1';expiresAt=$grant.expiresAt;protectedPaths=@($protected)}
  $terminalPolicy.machineScope=$machine;$grant.machineScope=$true
  Write-Json $rootFile @{schema='vivim.workstation-roots/1';roots=$rootEntries;machineScope=$machine};$grant.rootConfigSha=Hash $rootFile
 }
 Write-Json $terminalFile $terminalPolicy
 $grant.terminal=@{configSha=Hash $terminalFile;programs=@($terminalPrograms|ForEach-Object{$_.id});roots=@($grant.roots);allowInteractive=$allowTerminalInteractive}
}
Write-Json (Join-Path $grantDir 'grant.json') $grant
$m=@{schema='vivim.workstation-runtime/1';sourceSha=$SourceSha;nativeBuildSha=$NativeBuildSha;nodeExe=$node;nodeSha256=Hash $node;dataRoot=$dataRoot;hostSha256=Hash (Join-Path $runtime 'apps\vivim-host\server.mjs');cargoTargetDir=(Split-Path -Parent $NativeBinRoot);recipes=@($grant.recipes);roots=$grant.roots;helperSha256=@{session=Hash (Join-Path $bin 'vivim-workstation-session.exe');files=Hash (Join-Path $bin 'vivim-workstation-files.exe');probe=Hash (Join-Path $bin 'vivim-workstation-probe.exe')};recipeConfigSha=$grant.recipeConfigSha;rootConfigSha=$grant.rootConfigSha}
if($EnableGeneralTerminal){$m.terminalConfigSha=$grant.terminal.configSha}
if($OwnerProfilePath){$m.ownerProfile='expanded';$m.ownerSelectionSha256=$OwnerProfileSha256}
if($EnableOwnerMachine){$m.ownerProfile='machine'}
Write-Json (Join-Path $release 'manifest.json') $m
Copy-Item -LiteralPath (Join-Path $src 'windows\Start-WorkstationHost.ps1') -Destination (Join-Path $release 'Start-WorkstationHost.ps1')
Push-Location $runtime
try{& $node --test tools/mcp/vivim-arbor/tests/workstation-tunnel.test.cjs tools/mcp/vivim-arbor/tests/tunnel-readonly.test.cjs;if($LASTEXITCODE -ne 0){throw 'Candidate tunnel tests failed'}}finally{Pop-Location}
$messages=@('{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25"}}','{"jsonrpc":"2.0","method":"notifications/initialized"}','{"jsonrpc":"2.0","id":2,"method":"tools/list"}')
$lines=@($messages|& $node (Join-Path $profile 'server\tunnel-readonly.cjs'))
if($LASTEXITCODE -ne 0 -or $lines.Count -ne 2){throw 'Candidate handshake failed'}
$names=@(($lines[1]|ConvertFrom-Json).result.tools|ForEach-Object name)
$expectedTools=if($EnableGeneralTerminal){16}else{15}
if($OwnerProfilePath -and -not $grant.allowWrites){$expectedTools-=3}
if($OwnerProfilePath -and -not $grant.terminal.allowInteractive){$expectedTools-=1}
if($names.Count -ne $expectedTools -or $names -notcontains 'vivim_session_start' -or ($grant.allowWrites -and $names -notcontains 'vivim_file_edit') -or ($EnableGeneralTerminal -and $names -notcontains 'vivim_terminal_start')){throw 'Candidate tools mismatch'}
Write-Output ('STAGED_SOURCE='+$SourceSha);Write-Output ('STAGED_TOOLS='+($names -join ','))
if(-not $Activate){return}
# Same supervisor, replace only the MCP child after the production Host passed.
$target=Join-Path $ConnectRoot 'server';$backup=Join-Path $ConnectRoot "rollback-workstation-$short"
$liveGrant=Join-Path $ConnectRoot 'session-authority';$launcher=Join-Path $ConnectRoot 'windows\Connect-Vivim.ps1'
if((Test-Path $backup) -or (Test-Path $liveGrant)){throw 'Existing deployment/rollback requires reconciliation'}
& (Join-Path $release 'Start-WorkstationHost.ps1') -ReleaseRoot $release
$exe=Join-Path $ConnectRoot 'runtime\v0.0.21\verified\tunnel-client.exe'
$tunnels=@(Get-CimInstance Win32_Process -Filter "Name='tunnel-client.exe'"|Where-Object{$_.ExecutablePath -eq $exe})
if($tunnels.Count -ne 1){throw 'Expected verified tunnel supervisor'}
$supervisor=$tunnels[0].ProcessId
$children=@(Get-CimInstance Win32_Process -Filter ('ParentProcessId='+$supervisor)|Where-Object{$_.Name -eq 'node.exe' -and [string]$_.CommandLine -match 'VIVIM-ARBOR-CONNECT[\\/]server[\\/]tunnel-readonly\.cjs'})
if($children.Count -ne 1){throw 'Expected one owned MCP child'}
$oldPid=$children[0].ProcessId
Copy-Item -LiteralPath $target -Destination $backup -Recurse;Copy-Item -LiteralPath $launcher -Destination (Join-Path $backup 'Connect-Vivim.ps1')
$modules=@('host-discovery.cjs','workstation-probe-tunnel.cjs','probe-acceptance.cjs','workstation-tunnel.cjs','maintenance-gate.cjs','tunnel-readonly.cjs')
try{
 New-Item -ItemType Directory -Path $liveGrant|Out-Null;Protect $liveGrant
 Copy-Item -LiteralPath (Join-Path $grantDir 'grant.json') -Destination (Join-Path $liveGrant 'grant.json')
 foreach($n in $modules){$from=Join-Path $profile "server\$n";$to=Join-Path $target $n;Copy-Item -LiteralPath $from -Destination $to -Force;if((Hash $from) -ne (Hash $to)){throw 'Adapter hash mismatch'}}
 Copy-Item -LiteralPath (Join-Path $src 'windows\Connect-Vivim.ps1') -Destination $launcher -Force
 $lines=@($messages|& $node (Join-Path $target 'tunnel-readonly.cjs'))
 if($LASTEXITCODE -ne 0 -or $lines.Count -ne 2){throw 'Installed handshake failed'}
 $names=@(($lines[1]|ConvertFrom-Json).result.tools|ForEach-Object name)
 if($names -notcontains 'vivim_session_start' -or $names -notcontains 'vivim_file_edit' -or ($EnableGeneralTerminal -and $names -notcontains 'vivim_terminal_start')){throw 'Installed tools missing'}
 $child=Get-CimInstance Win32_Process -Filter ('ProcessId='+$oldPid)
 if($child.ParentProcessId -ne $supervisor -or $child.Name -ne 'node.exe' -or [string]$child.CommandLine -notmatch 'VIVIM-ARBOR-CONNECT[\\/]server[\\/]tunnel-readonly\.cjs'){throw 'Child changed before reload'}
 Stop-Process -Id $oldPid -ErrorAction Stop;Start-Sleep -Seconds 2
 if(-not(Get-Process -Id $supervisor -ErrorAction SilentlyContinue)){throw 'Tunnel supervisor exited'}
 Write-Output ('LIVE_TOOL_NAMES='+($names -join ','));Write-Output ('TUNNEL_SUPERVISOR_PRESERVED='+$supervisor)
 Write-Output ('GRANT_EXPIRES_UTC='+[DateTimeOffset]::FromUnixTimeMilliseconds($grant.expiresAt).UtcDateTime.ToString('o'))
 Write-Output 'WORKSTATION_PROFILE_PROMOTED'
}catch{
 foreach($n in $modules){$saved=Join-Path $backup $n;if(Test-Path $saved){Copy-Item -LiteralPath $saved -Destination (Join-Path $target $n) -Force}}
 Copy-Item -LiteralPath (Join-Path $backup 'Connect-Vivim.ps1') -Destination $launcher -Force
 if(Test-Path (Join-Path $liveGrant 'grant.json')){Rename-Item -LiteralPath (Join-Path $liveGrant 'grant.json') -NewName 'grant.disabled.json'}
 throw
}
