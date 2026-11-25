[CmdletBinding()]
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$SourceSha,
 [string]$RepoRoot='C:\0-BlackBoxProject-0\ARBOR',
 [string]$ConnectRoot='C:\0-BlackBoxProject-0\VIVIM-ARBOR-CONNECT',
 [Parameter(Mandatory=$true)][string]$TargetDir,
 [switch]$EnableGeneralTerminal,
 [string]$OwnerProfilePath,
 [string]$OwnerProfileSha256
)
# Local operator entrypoint. Build/test/stage only. Does not stop a running
# Host or tunnel, modify live grants, or promote a candidate. No remote caller
# gets authority from this script; a separately authorized promotion is needed.
$ErrorActionPreference='Stop'
if($OwnerProfilePath){if($OwnerProfileSha256 -cnotmatch '^[a-f0-9]{64}
if($OwnerProfilePath -and -not $EnableGeneralTerminal){throw 'Expanded owner profile requires general terminal'}
if($OwnerProfilePath){$OwnerProfilePath=(Resolve-Path -LiteralPath $OwnerProfilePath -ErrorAction Stop).ProviderPath;if((Get-FileHash -LiteralPath $OwnerProfilePath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $OwnerProfileSha256){throw 'Reviewed owner selection changed'}}
$utf8=New-Object Text.UTF8Encoding($false)
function Hash([string]$p){(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()}
function Exe([string]$n){(Get-Command $n -CommandType Application -ErrorAction Stop|Select-Object -First 1).Source}
function Protect([string]$p){
 $acl=Get-Acl -LiteralPath $p;$acl.SetAccessRuleProtection($true,$false)
 foreach($r in @($acl.Access)){[void]$acl.RemoveAccessRuleSpecific($r)}
 $me=[Security.Principal.WindowsIdentity]::GetCurrent().User
 $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($me,'FullControl','ContainerInherit,ObjectInherit','None','Allow'))
 Set-Acl -LiteralPath $p -AclObject $acl
}
function Invoke-Checked([string]$exe,[string[]]$argv,[string]$label){
 & $exe @argv
 if($LASTEXITCODE -ne 0){throw "$label failed (exit $LASTEXITCODE)"}
}
$RepoRoot=(Resolve-Path -LiteralPath $RepoRoot).Path
$ConnectRoot=(Resolve-Path -LiteralPath $ConnectRoot).Path
$TargetDir=(Resolve-Path -LiteralPath $TargetDir).Path
if(-not (Test-Path -LiteralPath $TargetDir -PathType Container)){throw 'Build cache must be an existing directory'}
# The build cache must not be the checkout, live runtime, or their ancestor.
function Overlap([string]$a,[string]$b){
 $a=$a.TrimEnd('\')+'\';$b=$b.TrimEnd('\')+'\'
 return $a.StartsWith($b,[StringComparison]::OrdinalIgnoreCase) -or $b.StartsWith($a,[StringComparison]::OrdinalIgnoreCase)
}
if((Overlap $TargetDir $RepoRoot) -or (Overlap $TargetDir $ConnectRoot)){throw 'Use an independent existing build cache directory'}
$git=Exe 'git.exe';$node=Exe 'node.exe';$rustup=Exe 'rustup.exe'
Invoke-Checked $git @('-C',$RepoRoot,'fetch','--no-tags','origin','main') 'Fetch main'
$remote=@(& $git -C $RepoRoot rev-parse origin/main)
if($LASTEXITCODE -ne 0 -or $remote.Count -ne 1 -or $remote[0].Trim() -cne $SourceSha){throw 'Approved source is not current fetched origin/main'}
$short=$SourceSha.Substring(0,12)
$build=Join-Path $ConnectRoot "workstation-build-$short"
$release=Join-Path $ConnectRoot "workstation-runtime-$short"
if((Test-Path -LiteralPath $build) -or (Test-Path -LiteralPath $release)){throw 'Build or release already staged; reconcile existing evidence'}
New-Item -ItemType Directory -Path $build|Out-Null;Protect $build
$source=Join-Path $build 'source';New-Item -ItemType Directory -Path $source|Out-Null
$archive=Join-Path $build 'source.tar'
Invoke-Checked $git @('-C',$RepoRoot,'archive','--format=tar',"--output=$archive",$SourceSha) 'Archive exact source'
Invoke-Checked (Exe 'tar.exe') @('-xf',$archive,'-C',$source) 'Extract exact source'
Remove-Item -LiteralPath $archive
$names=@('cargo','rustc','rustdoc');$tools=@{}
$vars=@('RUSTC','RUSTDOC','RUSTC_WRAPPER','RUSTC_WORKSPACE_WRAPPER','CARGO_TARGET_DIR','VIVIM_WORKSTATION_SESSION_EXE','VIVIM_WORKSTATION_FILES_EXE','VIVIM_WORKSTATION_PROBE_EXE','VIVIM_WORKSTATION_PROBE_SHA256')
$prior=@{};foreach($name in $vars){$prior[$name]=[Environment]::GetEnvironmentVariable($name,'Process')}
Push-Location $source
try{
 foreach($name in $names){
  $paths=@(& $rustup which $name)
  if($LASTEXITCODE -ne 0 -or $paths.Count -ne 1){throw "Cannot resolve $name"}
  $exe=(Resolve-Path -LiteralPath $paths[0].Trim()).Path
  if([IO.Path]::GetFileName($exe) -ine "$name.exe"){throw "Unexpected toolchain executable for $name"}
  $tools[$name]=@{path=$exe;sha256=Hash $exe}
 }
 if((Split-Path -Parent $tools.cargo.path) -ine (Split-Path -Parent $tools.rustc.path) -or (Split-Path -Parent $tools.cargo.path) -ine (Split-Path -Parent $tools.rustdoc.path)){throw 'Mixed toolchain'}
 $cargo=$tools.cargo.path;$env:RUSTC=$tools.rustc.path;$env:RUSTDOC=$tools.rustdoc.path
 Remove-Item Env:RUSTC_WRAPPER,Env:RUSTC_WORKSPACE_WRAPPER -ErrorAction SilentlyContinue
 $env:CARGO_TARGET_DIR=$TargetDir
 Invoke-Checked $cargo @('--version') 'Cargo version'
 Invoke-Checked $env:RUSTC @('--version') 'Rustc version'
 Invoke-Checked $cargo @('test','--offline','--locked','-j','2','-p','vivim-host-supervisor') 'Native Host tests (including Windows Job Object tests)'
 Invoke-Checked $cargo @('test','--offline','--locked','-j','2','-p','vivim-programmability-core','workstation_capabilities') 'Workstation semantic kernel tests'
 Invoke-Checked $cargo @('build','--offline','--locked','-j','2','-p','vivim-host-supervisor','--bins') 'Native helpers'
 $bin=Join-Path $TargetDir 'debug'
 $env:VIVIM_WORKSTATION_SESSION_EXE=Join-Path $bin 'vivim-workstation-session.exe'
 $env:VIVIM_WORKSTATION_FILES_EXE=Join-Path $bin 'vivim-workstation-files.exe'
 $env:VIVIM_WORKSTATION_PROBE_EXE=Join-Path $bin 'vivim-workstation-probe.exe'
 $env:VIVIM_WORKSTATION_PROBE_SHA256=Hash $env:VIVIM_WORKSTATION_PROBE_EXE
 # Require normal exit, never --test-force-exit. No production Host is started.
 $tests=@('apps/vivim-host/test/workstation-terminal-policy.test.mjs','apps/vivim-host/test/workstation-terminal-request.test.mjs','apps/vivim-host/test/workstation-file-port.test.mjs','apps/vivim-host/test/workstation-session-port.test.mjs','apps/vivim-host/test/workstation-process-port.test.mjs','apps/vivim-host/test/workstation-probe-http.test.mjs','apps/vivim-host/test/workstation-tunnel-http.test.mjs','apps/vivim-host/test/control-dispatcher.test.mjs','tools/mcp/vivim-arbor/tests/workstation-tunnel.test.cjs','tools/mcp/vivim-arbor/tests/tunnel-readonly.test.cjs','tools/mcp/vivim-arbor/tests/probe-acceptance.test.cjs','tools/mcp/vivim-arbor/tests/workstation-probe-tunnel.test.cjs','tools/mcp/vivim-arbor/tests/release-evidence.test.mjs','tools/mcp/vivim-arbor/tests/live-upgrade-plan.test.mjs','tools/mcp/vivim-arbor/tests/maintenance-gate.test.cjs','tools/mcp/vivim-arbor/tests/release-sequence.test.mjs','tools/mcp/vivim-arbor/tests/release-journal.test.mjs','tools/mcp/vivim-arbor/tests/owner-profile-selection.test.mjs')
 Invoke-Checked $node (@('--test','--test-timeout=120000')+$tests) 'Host and MCP integration tests'
 foreach($name in $names){if((Hash $tools[$name].path) -ne $tools[$name].sha256){throw 'Toolchain changed during verification'}}
 $receipt=@{schema='vivim.workstation-build-receipt/1';sourceSha=$SourceSha;nativeTests='passed';hostTests='passed';toolchain=$tools;helpers=@{session=Hash $env:VIVIM_WORKSTATION_SESSION_EXE;files=Hash $env:VIVIM_WORKSTATION_FILES_EXE;probe=Hash $env:VIVIM_WORKSTATION_PROBE_EXE};verifiedAt=[DateTime]::UtcNow.ToString('o');promotionPerformed=$false}
 [IO.File]::WriteAllText((Join-Path $build 'build-receipt.json'),($receipt|ConvertTo-Json -Depth 8 -Compress),$utf8)
 $installer=Join-Path $source 'tools\mcp\vivim-arbor\windows\Install-WorkstationProfile.ps1'
 # Deliberately omit -Activate. The installer stages and validates only.
 & $installer -SourceSha $SourceSha -NativeBuildSha $SourceSha -NativeBinRoot $bin -RepoRoot $RepoRoot -ConnectRoot $ConnectRoot -EnableGeneralTerminal:$EnableGeneralTerminal -OwnerProfilePath $OwnerProfilePath -OwnerProfileSha256 $OwnerProfileSha256
 if(-not (Test-Path -LiteralPath (Join-Path $release 'manifest.json') -PathType Leaf)){throw 'Release manifest not staged'}
 $manifest=Get-Content -LiteralPath (Join-Path $release 'manifest.json') -Raw|ConvertFrom-Json
 if($manifest.sourceSha -cne $SourceSha -or $manifest.nativeBuildSha -cne $SourceSha -or $manifest.helperSha256.session -cne $receipt.helpers.session -or $manifest.helperSha256.files -cne $receipt.helpers.files -or $manifest.helperSha256.probe -cne $receipt.helpers.probe){throw 'Release manifest disagrees with tested build'}
 # Seal the complete staged tree against the successful exact-source build.
 $seal=Join-Path $build 'release-seal.json'
 Invoke-Checked $node @((Join-Path $source 'tools\mcp\vivim-arbor\server\release-evidence.mjs'),'seal',$release,(Join-Path $build 'build-receipt.json'),$seal) 'Release evidence seal'
 Invoke-Checked $node @((Join-Path $source 'tools\mcp\vivim-arbor\server\release-evidence.mjs'),'verify',$release,(Join-Path $build 'build-receipt.json'),$seal) 'Release evidence readback'
 Write-Output ('VERIFIED_STAGED_RELEASE='+$SourceSha)
 Write-Output ('BUILD_RECEIPT='+ (Join-Path $build 'build-receipt.json'))
 Write-Output 'LIVE_HOST_UNCHANGED=True'
}finally{
 Pop-Location
 foreach($name in $vars){[Environment]::SetEnvironmentVariable($name,$prior[$name],'Process')}
}
){throw 'Reviewed owner selection SHA-256 required'}}elseif($OwnerProfileSha256){throw 'Selection digest requires owner profile path'}
if($OwnerProfilePath -and -not $EnableGeneralTerminal){throw 'Expanded owner profile requires general terminal'}
if($OwnerProfilePath){$OwnerProfilePath=(Resolve-Path -LiteralPath $OwnerProfilePath -ErrorAction Stop).Path}
$utf8=New-Object Text.UTF8Encoding($false)
function Hash([string]$p){(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()}
function Exe([string]$n){(Get-Command $n -CommandType Application -ErrorAction Stop|Select-Object -First 1).Source}
function Protect([string]$p){
 $acl=Get-Acl -LiteralPath $p;$acl.SetAccessRuleProtection($true,$false)
 foreach($r in @($acl.Access)){[void]$acl.RemoveAccessRuleSpecific($r)}
 $me=[Security.Principal.WindowsIdentity]::GetCurrent().User
 $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($me,'FullControl','ContainerInherit,ObjectInherit','None','Allow'))
 Set-Acl -LiteralPath $p -AclObject $acl
}
function Invoke-Checked([string]$exe,[string[]]$argv,[string]$label){
 & $exe @argv
 if($LASTEXITCODE -ne 0){throw "$label failed (exit $LASTEXITCODE)"}
}
$RepoRoot=(Resolve-Path -LiteralPath $RepoRoot).Path
$ConnectRoot=(Resolve-Path -LiteralPath $ConnectRoot).Path
$TargetDir=(Resolve-Path -LiteralPath $TargetDir).Path
if(-not (Test-Path -LiteralPath $TargetDir -PathType Container)){throw 'Build cache must be an existing directory'}
# The build cache must not be the checkout, live runtime, or their ancestor.
function Overlap([string]$a,[string]$b){
 $a=$a.TrimEnd('\')+'\';$b=$b.TrimEnd('\')+'\'
 return $a.StartsWith($b,[StringComparison]::OrdinalIgnoreCase) -or $b.StartsWith($a,[StringComparison]::OrdinalIgnoreCase)
}
if((Overlap $TargetDir $RepoRoot) -or (Overlap $TargetDir $ConnectRoot)){throw 'Use an independent existing build cache directory'}
$git=Exe 'git.exe';$node=Exe 'node.exe';$rustup=Exe 'rustup.exe'
Invoke-Checked $git @('-C',$RepoRoot,'fetch','--no-tags','origin','main') 'Fetch main'
$remote=@(& $git -C $RepoRoot rev-parse origin/main)
if($LASTEXITCODE -ne 0 -or $remote.Count -ne 1 -or $remote[0].Trim() -cne $SourceSha){throw 'Approved source is not current fetched origin/main'}
$short=$SourceSha.Substring(0,12)
$build=Join-Path $ConnectRoot "workstation-build-$short"
$release=Join-Path $ConnectRoot "workstation-runtime-$short"
if((Test-Path -LiteralPath $build) -or (Test-Path -LiteralPath $release)){throw 'Build or release already staged; reconcile existing evidence'}
New-Item -ItemType Directory -Path $build|Out-Null;Protect $build
$source=Join-Path $build 'source';New-Item -ItemType Directory -Path $source|Out-Null
$archive=Join-Path $build 'source.tar'
Invoke-Checked $git @('-C',$RepoRoot,'archive','--format=tar',"--output=$archive",$SourceSha) 'Archive exact source'
Invoke-Checked (Exe 'tar.exe') @('-xf',$archive,'-C',$source) 'Extract exact source'
Remove-Item -LiteralPath $archive
$names=@('cargo','rustc','rustdoc');$tools=@{}
$vars=@('RUSTC','RUSTDOC','RUSTC_WRAPPER','RUSTC_WORKSPACE_WRAPPER','CARGO_TARGET_DIR','VIVIM_WORKSTATION_SESSION_EXE','VIVIM_WORKSTATION_FILES_EXE','VIVIM_WORKSTATION_PROBE_EXE','VIVIM_WORKSTATION_PROBE_SHA256')
$prior=@{};foreach($name in $vars){$prior[$name]=[Environment]::GetEnvironmentVariable($name,'Process')}
Push-Location $source
try{
 foreach($name in $names){
  $paths=@(& $rustup which $name)
  if($LASTEXITCODE -ne 0 -or $paths.Count -ne 1){throw "Cannot resolve $name"}
  $exe=(Resolve-Path -LiteralPath $paths[0].Trim()).Path
  if([IO.Path]::GetFileName($exe) -ine "$name.exe"){throw "Unexpected toolchain executable for $name"}
  $tools[$name]=@{path=$exe;sha256=Hash $exe}
 }
 if((Split-Path -Parent $tools.cargo.path) -ine (Split-Path -Parent $tools.rustc.path) -or (Split-Path -Parent $tools.cargo.path) -ine (Split-Path -Parent $tools.rustdoc.path)){throw 'Mixed toolchain'}
 $cargo=$tools.cargo.path;$env:RUSTC=$tools.rustc.path;$env:RUSTDOC=$tools.rustdoc.path
 Remove-Item Env:RUSTC_WRAPPER,Env:RUSTC_WORKSPACE_WRAPPER -ErrorAction SilentlyContinue
 $env:CARGO_TARGET_DIR=$TargetDir
 Invoke-Checked $cargo @('--version') 'Cargo version'
 Invoke-Checked $env:RUSTC @('--version') 'Rustc version'
 Invoke-Checked $cargo @('test','--offline','--locked','-j','2','-p','vivim-host-supervisor') 'Native Host tests (including Windows Job Object tests)'
 Invoke-Checked $cargo @('test','--offline','--locked','-j','2','-p','vivim-programmability-core','workstation_capabilities') 'Workstation semantic kernel tests'
 Invoke-Checked $cargo @('build','--offline','--locked','-j','2','-p','vivim-host-supervisor','--bins') 'Native helpers'
 $bin=Join-Path $TargetDir 'debug'
 $env:VIVIM_WORKSTATION_SESSION_EXE=Join-Path $bin 'vivim-workstation-session.exe'
 $env:VIVIM_WORKSTATION_FILES_EXE=Join-Path $bin 'vivim-workstation-files.exe'
 $env:VIVIM_WORKSTATION_PROBE_EXE=Join-Path $bin 'vivim-workstation-probe.exe'
 $env:VIVIM_WORKSTATION_PROBE_SHA256=Hash $env:VIVIM_WORKSTATION_PROBE_EXE
 # Require normal exit, never --test-force-exit. No production Host is started.
 $tests=@('apps/vivim-host/test/workstation-terminal-policy.test.mjs','apps/vivim-host/test/workstation-terminal-request.test.mjs','apps/vivim-host/test/workstation-file-port.test.mjs','apps/vivim-host/test/workstation-session-port.test.mjs','apps/vivim-host/test/workstation-process-port.test.mjs','apps/vivim-host/test/workstation-probe-http.test.mjs','apps/vivim-host/test/workstation-tunnel-http.test.mjs','apps/vivim-host/test/control-dispatcher.test.mjs','tools/mcp/vivim-arbor/tests/workstation-tunnel.test.cjs','tools/mcp/vivim-arbor/tests/tunnel-readonly.test.cjs','tools/mcp/vivim-arbor/tests/probe-acceptance.test.cjs','tools/mcp/vivim-arbor/tests/workstation-probe-tunnel.test.cjs','tools/mcp/vivim-arbor/tests/release-evidence.test.mjs','tools/mcp/vivim-arbor/tests/live-upgrade-plan.test.mjs','tools/mcp/vivim-arbor/tests/maintenance-gate.test.cjs','tools/mcp/vivim-arbor/tests/release-sequence.test.mjs','tools/mcp/vivim-arbor/tests/release-journal.test.mjs','tools/mcp/vivim-arbor/tests/owner-profile-selection.test.mjs')
 Invoke-Checked $node (@('--test','--test-timeout=120000')+$tests) 'Host and MCP integration tests'
 foreach($name in $names){if((Hash $tools[$name].path) -ne $tools[$name].sha256){throw 'Toolchain changed during verification'}}
 $receipt=@{schema='vivim.workstation-build-receipt/1';sourceSha=$SourceSha;nativeTests='passed';hostTests='passed';toolchain=$tools;helpers=@{session=Hash $env:VIVIM_WORKSTATION_SESSION_EXE;files=Hash $env:VIVIM_WORKSTATION_FILES_EXE;probe=Hash $env:VIVIM_WORKSTATION_PROBE_EXE};verifiedAt=[DateTime]::UtcNow.ToString('o');promotionPerformed=$false}
 [IO.File]::WriteAllText((Join-Path $build 'build-receipt.json'),($receipt|ConvertTo-Json -Depth 8 -Compress),$utf8)
 $installer=Join-Path $source 'tools\mcp\vivim-arbor\windows\Install-WorkstationProfile.ps1'
 # Deliberately omit -Activate. The installer stages and validates only.
 & $installer -SourceSha $SourceSha -NativeBuildSha $SourceSha -NativeBinRoot $bin -RepoRoot $RepoRoot -ConnectRoot $ConnectRoot -EnableGeneralTerminal:$EnableGeneralTerminal -OwnerProfilePath $OwnerProfilePath
 if(-not (Test-Path -LiteralPath (Join-Path $release 'manifest.json') -PathType Leaf)){throw 'Release manifest not staged'}
 $manifest=Get-Content -LiteralPath (Join-Path $release 'manifest.json') -Raw|ConvertFrom-Json
 if($manifest.sourceSha -cne $SourceSha -or $manifest.nativeBuildSha -cne $SourceSha -or $manifest.helperSha256.session -cne $receipt.helpers.session -or $manifest.helperSha256.files -cne $receipt.helpers.files -or $manifest.helperSha256.probe -cne $receipt.helpers.probe){throw 'Release manifest disagrees with tested build'}
 # Seal the complete staged tree against the successful exact-source build.
 $seal=Join-Path $build 'release-seal.json'
 Invoke-Checked $node @((Join-Path $source 'tools\mcp\vivim-arbor\server\release-evidence.mjs'),'seal',$release,(Join-Path $build 'build-receipt.json'),$seal) 'Release evidence seal'
 Invoke-Checked $node @((Join-Path $source 'tools\mcp\vivim-arbor\server\release-evidence.mjs'),'verify',$release,(Join-Path $build 'build-receipt.json'),$seal) 'Release evidence readback'
 Write-Output ('VERIFIED_STAGED_RELEASE='+$SourceSha)
 Write-Output ('BUILD_RECEIPT='+ (Join-Path $build 'build-receipt.json'))
 Write-Output 'LIVE_HOST_UNCHANGED=True'
}finally{
 Pop-Location
 foreach($name in $vars){[Environment]::SetEnvironmentVariable($name,$prior[$name],'Process')}
}
