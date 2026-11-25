# Unified Rust development rebuild entrypoint. The release packager is deliberately unchanged.
[CmdletBinding()]
param(
  [ValidateSet('core','gpui')][string]$Component='core',
  [ValidateSet('check','build','test')][string]$Action='check',
  [ValidateRange(1,16)][int]$Jobs=4,
  [switch]$Offline,
  [ValidateSet('native','blaze-v1','blaze-v2')][string]$Backend='native',
  [ValidatePattern('^[a-zA-Z0-9_.-]+$')][string]$WslDistribution='Ubuntu',
  [string]$WslSourceRoot,
  [string]$ExpectedSourceSha,
  [switch]$AllowDevelopmentEdits
)
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
# Blaze is an explicit experimental Linux/WSL backend, never a Windows compiler.
if($Backend -ne 'native'){
  if($Component -ne 'core'){throw 'BLAZE_GPUI_UNSUPPORTED: use native Cargo for Windows GPUI'}
  if($Offline -or $PSBoundParameters.ContainsKey('Jobs')){throw 'BLAZE_NATIVE_FLAGS_UNSUPPORTED: do not silently discard Offline or Jobs'}
  if($Backend -eq 'blaze-v2' -and $Action -eq 'build'){throw 'BLAZE_V2_BUILD_UNAVAILABLE'}
  if(-not $WslSourceRoot -or $WslSourceRoot -notmatch '^/[a-zA-Z0-9_./-]+$' -or
      $WslSourceRoot -match '(^/mnt(?:/|$)|//|(?:^|/)\.\.?(?:/|$)|/$)'){
    throw 'BLAZE_EXPLICIT_LINUX_CHECKOUT_REQUIRED'
  }
  if($ExpectedSourceSha -cnotmatch '^[a-f0-9]{40}$'){throw 'BLAZE_EXACT_SOURCE_SHA_REQUIRED'}
  $wsl = (Get-Command wsl.exe -ErrorAction Stop).Source
  $actualRoot = (& $wsl -d $WslDistribution --exec git -C $WslSourceRoot rev-parse --show-toplevel | Out-String).Trim()
  if($LASTEXITCODE -ne 0 -or $actualRoot -cne $WslSourceRoot){throw 'BLAZE_CHECKOUT_ROOT_MISMATCH'}
  $physicalRoot = (& $wsl -d $WslDistribution --exec realpath $WslSourceRoot | Out-String).Trim()
  if($LASTEXITCODE -ne 0 -or $physicalRoot -cne $WslSourceRoot){throw 'BLAZE_CHECKOUT_NOT_CANONICAL'}
  $head = (& $wsl -d $WslDistribution --exec git -C $WslSourceRoot rev-parse HEAD | Out-String).Trim()
  if($LASTEXITCODE -ne 0 -or $head -cne $ExpectedSourceSha){throw 'BLAZE_SOURCE_SHA_MISMATCH'}
  $status = (& $wsl -d $WslDistribution --exec git -C $WslSourceRoot status --porcelain --untracked-files=normal | Out-String).Trim()
  if($LASTEXITCODE -ne 0){throw 'BLAZE_SOURCE_STATUS_UNAVAILABLE'}
  if($status -and -not $AllowDevelopmentEdits){throw 'BLAZE_DIRTY_CHECKOUT: use an isolated clean checkout or explicitly allow development edits'}
  $version = if($Backend -eq 'blaze-v1'){'0.20261029.7'}else{'0.20261122.0'}
  Write-Output "BLAZE_DEV_ONLY backend=$Backend source=$head dirty=$([bool]$status) action=$Action"
  & $wsl -d $WslDistribution --exec env "VIVIM_BLAZE_VERSION=$version" sh "$WslSourceRoot/scripts/rust-dev-blaze.sh" $Action
  if($LASTEXITCODE -ne 0){throw "BLAZE_DEV_FAILED exit=$LASTEXITCODE"}
  return
}
if($WslSourceRoot -or $ExpectedSourceSha -or $AllowDevelopmentEdits -or $PSBoundParameters.ContainsKey('WslDistribution')){
  throw 'WSL_OPTIONS_REQUIRE_EXPLICIT_BLAZE_BACKEND'
}
$manifest=if($Component -eq 'gpui') { Join-Path $root 'native/gpui-desktop/Cargo.toml' } else { Join-Path $root 'core/programmability/Cargo.toml' }
if(-not (Test-Path -LiteralPath $manifest -PathType Leaf)){throw 'RUST_DEV_MANIFEST_MISSING'}
$previous=@{}
foreach($key in @('CARGO_PROFILE_DEV_INCREMENTAL','CARGO_PROFILE_TEST_INCREMENTAL','CARGO_PROFILE_DEV_DEBUG','CARGO_PROFILE_TEST_DEBUG','RUSTC_WRAPPER')){
  $previous[$key]=[Environment]::GetEnvironmentVariable($key,'Process')
}
try {
  # Keep Rust's own incremental cache warm. sccache does not cache incremental rustc invocations.
  $env:CARGO_PROFILE_DEV_INCREMENTAL='true'
  $env:CARGO_PROFILE_TEST_INCREMENTAL='true'
  $env:CARGO_PROFILE_DEV_DEBUG='0'
  $env:CARGO_PROFILE_TEST_DEBUG='0'
  $env:RUSTC_WRAPPER=''
  $argv=@($Action,'--manifest-path',$manifest,'--locked','-j',"$Jobs")
  if($Component -eq 'gpui'){$argv+=@('--features','desktop')}
  if($Offline){$argv+='--offline'}
  Write-Output "CARGO_NATIVE_DEV_ONLY component=$Component action=$Action"
  Push-Location $root
  try { & cargo @argv; $result=$LASTEXITCODE } finally { Pop-Location }
  if($result -ne 0){throw "CARGO_NATIVE_DEV_FAILED exit=$result"}
} finally {
  foreach($key in $previous.Keys){[Environment]::SetEnvironmentVariable($key,$previous[$key],'Process')}
}
