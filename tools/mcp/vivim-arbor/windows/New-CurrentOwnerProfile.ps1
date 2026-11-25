[CmdletBinding()]
param(
 [Parameter(Mandatory)][string]$WorkspaceParent,
 [Parameter(Mandatory)][string]$OutputPath,
 [string[]]$RequiredRepositories=@('vivim-labs','craft-anything'),
 [ValidateRange(15,480)][int]$ExpiresInMinutes=480
)
# Batch proposal for the CURRENT owner workstation connector.
# Discovery is not authorization. No live grant changes or executable launch.
$ErrorActionPreference='Stop'
if($PSVersionTable.PSVersion.Major -lt 7){throw 'PowerShell 7+ required'}
if(-not [IO.Path]::IsPathFullyQualified($WorkspaceParent)){throw 'Select an absolute development workspace parent'}
$parent=Get-Item -LiteralPath $WorkspaceParent -ErrorAction Stop
if(-not $parent.PSIsContainer -or $parent.FullName -eq $parent.Root.FullName){throw 'Select a development workspace, not an entire drive'}
for($d=$parent;$null -ne $d;$d=$d.Parent){if($d.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Workspace traverses a reparse point'}}
$roots=@{};$programs=@{};$found=@{}
# Shallow repository discovery: no recursive search of private folders,
# no credential reads, no links, no execution, no implicit whole-drive grant.
foreach($child in @(Get-ChildItem -LiteralPath $parent.FullName -Directory | Sort-Object Name)){
 if($child.Name -in @('ARBOR','VIVIM-ARBOR-CONNECT','VIVIM','scratch') -or $child.Name.StartsWith('.') -or ($child.Attributes -band [IO.FileAttributes]::ReparsePoint)){continue}
 $marker=Join-Path $child.FullName '.git'
 if(-not (Test-Path -LiteralPath $marker)){continue}
 $gitItem=Get-Item -LiteralPath $marker -Force
 if($gitItem.Attributes -band [IO.FileAttributes]::ReparsePoint){continue}
 $id=$child.Name.ToLowerInvariant() -replace '[^a-z0-9-]','-'
 if($id -cnotmatch '^[a-z][a-z0-9-]{0,63}$' -or $id -in @('arbor','scratch') -or $roots.ContainsKey($id)){throw 'Repository IDs conflict; review workspace layout'}
 $roots[$id]=$child.FullName;$found[$child.Name]=$child.FullName
}
foreach($name in $RequiredRepositories){
 if($name -cnotmatch '^[A-Za-z0-9][A-Za-z0-9_.-]{0,80}$' -or -not $found.ContainsKey($name)){throw "Required development repository missing: $name"}
}
if($roots.Count -gt 14){throw 'Workspace exceeds existing 16-root contract; select a smaller workspace or upgrade root capacity'}
if($found.ContainsKey('craft-anything')){
 $craft=Join-Path $found['craft-anything'] 'target\release\craft-anything-cli.exe'
 if(-not (Test-Path -LiteralPath $craft -PathType Leaf)){throw 'Stock Craft release executable missing; build with upstream workflow first'}
 $programs['craft-cli']=$craft
}
if(($roots.Count+$programs.Count) -eq 0){throw 'No eligible repositories discovered'}
# All ordinary development shell commands can use the existing pwsh entry
# point after local approval of the profile. Do not add a separate tool per app.
$r=& (Join-Path $PSScriptRoot 'New-OwnerProfileSelection.ps1') -Roots $roots -Programs $programs -ExpiresInMinutes $ExpiresInMinutes -AllowInteractive -AllowFileWrites -OutputPath $OutputPath
[pscustomobject]@{schema='vivim.owner-workstation-batch-proposal/1';target='current-owner-connector';selectionPath=$r.selectionPath;sha256=$r.sha256;rootIds=$r.rootIds;programIds=$r.programIds;reviewRequired=$true;grantChanged=$false;activationPerformed=$false}
