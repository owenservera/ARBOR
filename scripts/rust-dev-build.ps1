# Native development rebuilds. The release packager is deliberately unchanged.
[CmdletBinding()]
param(
  [ValidateSet('core','gpui')][string]$Component='core',
  [ValidateSet('check','build','test')][string]$Action='check',
  [ValidateRange(1,16)][int]$Jobs=4,
  [switch]$Offline
)
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
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
