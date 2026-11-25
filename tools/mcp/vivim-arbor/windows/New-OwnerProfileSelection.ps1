[CmdletBinding()]
param(
 [hashtable]$Roots=@{},
 [hashtable]$Programs=@{},
 [ValidateRange(15,480)][int]$ExpiresInMinutes=120,
 [switch]$AllowInteractive,
 [switch]$AllowFileWrites,
 [Parameter(Mandatory=$true)][string]$OutputPath
)
# Author a reviewable proposal only. This is not a grant, a promotion,
# proof of interactive owner presence or a replacement configuration store.
$ErrorActionPreference='Stop'
if($PSVersionTable.PSVersion.Major -lt 7){throw 'PowerShell 7+ required'}
if($Roots.Count -gt 14 -or $Programs.Count -gt 56 -or ($Roots.Count+$Programs.Count) -eq 0){throw 'Select explicit roots and/or programs within supported limits'}
if(-not [IO.Path]::IsPathFullyQualified($OutputPath)){throw 'Select an absolute output path'}
$out=[IO.Path]::GetFullPath($OutputPath)
if([IO.Path]::GetExtension($out) -ine '.json'){throw 'Selection file must have a .json extension'}
if(Test-Path -LiteralPath $out){throw 'Selection already exists; choose a new file'}
$parent=Get-Item -LiteralPath ([IO.Path]::GetDirectoryName($out)) -ErrorAction Stop
if(-not $parent.PSIsContainer){throw 'Output directory must already exist'}
for($d=$parent;$null -ne $d;$d=$d.Parent){if($d.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Output path traverses a reparse point'}}
function Resolve-Selected([string]$path,[bool]$directory){
 if(-not [IO.Path]::IsPathFullyQualified($path) -or $path -notmatch '^[A-Za-z]:\\'){throw 'Select explicit local filesystem paths'}
 $item=Get-Item -LiteralPath $path -ErrorAction Stop
 if($item.PSIsContainer -ne $directory -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Selection path type or reparse point invalid'}
 $p=if($directory){$item}else{$item.Directory}
 for($d=$p;$null -ne $d;$d=$d.Parent){if($d.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Selection traverses a reparse point'}}
 return $item
}
$rootEntries=@(foreach($id in @($Roots.Keys|Sort-Object)){
 if($id -isnot [string] -or $id -cnotmatch '^[a-z][a-z0-9-]{0,63}$' -or $id -in @('arbor','scratch')){throw 'Invalid or reserved root ID'}
 $item=Resolve-Selected $Roots[$id] $true
 [ordered]@{id=$id;path=$item.FullName}
})
$programEntries=@(foreach($id in @($Programs.Keys|Sort-Object)){
 if($id -isnot [string] -or $id -cnotmatch '^[a-z][a-z0-9-]{0,63}$' -or $id -in @('node','git','powershell','pwsh','cargo','rustc','rustdoc')){throw 'Invalid or reserved program ID'}
 $item=Resolve-Selected $Programs[$id] $false
 if($item.Extension -ine '.exe' -or $item.Length -lt 1 -or $item.Length -gt 256MB -or $item.FullName -match '(?i)[\\/]Microsoft[\\/]WindowsApps[\\/]'){throw 'Select a real executable, not an alias'}
 [ordered]@{id=$id;path=$item.FullName;sha256=(Get-FileHash -LiteralPath $item.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}
})
$proposal=[ordered]@{schema='vivim.owner-workstation-selection/1';roots=$rootEntries;programs=$programEntries;expiresInMinutes=$ExpiresInMinutes;allowInteractive=[bool]$AllowInteractive;allowWrites=[bool]$AllowFileWrites}
# New-file only. Create with a private ACL before writing selection bytes.
$me=[Security.Principal.WindowsIdentity]::GetCurrent().User
$acl=[Security.AccessControl.FileSecurity]::new()
$acl.SetAccessRuleProtection($true,$false)
$acl.SetOwner($me)
$acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($me,'FullControl','Allow'))
$bytes=[Text.UTF8Encoding]::new($false).GetBytes(($proposal|ConvertTo-Json -Depth 8))
$stream=[System.IO.FileSystemAclExtensions]::Create([IO.FileInfo]::new($out),[IO.FileMode]::CreateNew,[Security.AccessControl.FileSystemRights]::FullControl,[IO.FileShare]::None,4096,[IO.FileOptions]::None,$acl)
try{$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true)}finally{$stream.Dispose()}
[pscustomobject]@{schema='vivim.owner-workstation-proposal-receipt/1';selectionPath=$out;sha256=(Get-FileHash -LiteralPath $out -Algorithm SHA256).Hash.ToLowerInvariant();rootIds=@($rootEntries|ForEach-Object {$_.id});programIds=@($programEntries|ForEach-Object {$_.id});expiresInMinutes=$ExpiresInMinutes;reviewRequired=$true;grantChanged=$false}
