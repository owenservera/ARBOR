[CmdletBinding()]
param(
 [Parameter(Mandatory)][string]$RepoRoot,
 [Parameter(Mandatory)][ValidatePattern('^[a-f0-9]{40}$')][string]$SourceSha,
 [Parameter(Mandatory)][string]$LabRoot
)
$ErrorActionPreference='Stop'
$RepoRoot=(Resolve-Path -LiteralPath $RepoRoot).ProviderPath
$LabRoot=(Resolve-Path -LiteralPath $LabRoot).ProviderPath
if((Split-Path -Leaf $LabRoot) -cnotmatch '^self-install-lab-[a-z0-9-]+$'){throw 'Use a dedicated self-install-lab directory'}
if($LabRoot.StartsWith($RepoRoot+'\',[StringComparison]::OrdinalIgnoreCase) -or $LabRoot -ieq $RepoRoot){throw 'Lab must be outside the checkout'}
$bundle=Join-Path $LabRoot ('vivim-dev-setup-'+$SourceSha.Substring(0,12))
if(Test-Path -LiteralPath $bundle){throw 'Bundle already exists'}
$temp=Join-Path $LabRoot ('.package-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temp|Out-Null
try{
 $archive=Join-Path $temp 'source.tar'
 git -C $RepoRoot archive --format=tar --output=$archive $SourceSha tools/mcp/vivim-arbor/server tools/mcp/vivim-arbor/windows/Install-DevCopy.ps1 tools/mcp/vivim-arbor/windows/VIVIM-DEV-SETUP.cmd
 if($LASTEXITCODE){throw 'Pinned archive failed'}
 tar.exe -xf $archive -C $temp
 if($LASTEXITCODE){throw 'Pinned extraction failed'}
 $payload=Join-Path $temp 'tools\mcp\vivim-arbor'
 $source=Join-Path $payload 'server'
 $rows=@(Get-ChildItem -LiteralPath $source -Recurse -File|ForEach-Object{
  $name=$_.FullName.Substring($source.Length+1).Replace('\','/')
  "$name $((Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant())"
 }|Sort-Object)
 [IO.File]::WriteAllText((Join-Path $payload 'source-sha.txt'),$SourceSha)
 [IO.File]::WriteAllText((Join-Path $payload 'server-inventory.txt'),($rows -join "`n"))
 [IO.Directory]::Move($payload,$bundle)
 Write-Output ('DEV_BUNDLE='+$bundle)
}finally{if(Test-Path -LiteralPath $temp){Remove-Item -LiteralPath $temp -Recurse -Force}}
