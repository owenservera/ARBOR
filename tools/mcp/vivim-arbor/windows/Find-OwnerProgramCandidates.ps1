[CmdletBinding()]
param(
 [Parameter(Mandatory=$true)][ValidateCount(1,32)][string[]]$Names,
 [ValidateCount(0,32)][string[]]$ExplicitPaths=@()
)
# Local read-only candidate discovery. Review output locally; it is not a grant.
$ErrorActionPreference='Stop'
if($PSVersionTable.PSVersion.Major -lt 7){throw 'PowerShell 7+ required'}
$seen=[System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach($name in $Names){if($name -notmatch '^[A-Za-z0-9][A-Za-z0-9_.-]{0,80}\.exe$'){throw 'Supply explicit executable basenames only'}}
foreach($candidate in $ExplicitPaths){if(-not [IO.Path]::IsPathFullyQualified($candidate) -or [IO.Path]::GetFileName($candidate) -notin $Names){throw 'Explicit path must match a requested executable basename'}}
function Add-Candidate([string]$name,[string]$candidate,[string]$source){
 if(-not $candidate){return}
 # App Paths sometimes encloses the whole path in quotes; never parse or execute command lines.
 if($candidate.StartsWith('"') -and $candidate.EndsWith('"')){$candidate=$candidate.Substring(1,$candidate.Length-2)}
 if(-not [IO.Path]::IsPathFullyQualified($candidate) -or $candidate -notmatch '^[A-Za-z]:\\' -or $candidate -match '(?i)[\\/]Microsoft[\\/]WindowsApps[\\/]' -or [IO.Path]::GetFileName($candidate) -ine $name){return}
 try{
  $item=Get-Item -LiteralPath $candidate -ErrorAction Stop
  if($item.PSIsContainer -or $item.Length -lt 1 -or $item.Length -gt 256MB -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)){return}
  for($parent=$item.Directory;$null -ne $parent;$parent=$parent.Parent){if($parent.Attributes -band [IO.FileAttributes]::ReparsePoint){return}}
  if(-not $seen.Add($item.FullName)){return}
  [pscustomobject]@{name=$name;path=$item.FullName;sha256=(Get-FileHash -LiteralPath $item.FullName -Algorithm SHA256).Hash.ToLowerInvariant();source=$source}
 }catch{Write-Warning 'Candidate inaccessible; skipped'}
}
foreach($name in $Names){
 foreach($entry in @(Get-Command $name -All -CommandType Application -ErrorAction SilentlyContinue)){Add-Candidate $name $entry.Source 'PATH'}
 foreach($hive in @([Microsoft.Win32.RegistryHive]::CurrentUser,[Microsoft.Win32.RegistryHive]::LocalMachine)){
  foreach($view in @([Microsoft.Win32.RegistryView]::Registry64,[Microsoft.Win32.RegistryView]::Registry32)){
   $base=$null;$key=$null
   try{
    $base=[Microsoft.Win32.RegistryKey]::OpenBaseKey($hive,$view)
    $key=$base.OpenSubKey("SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\$name",$false)
    if($null -ne $key){$value=$key.GetValue('');if($value -is [string]){Add-Candidate $name $value 'AppPaths'}}
   }catch{Write-Warning 'App Paths lookup unavailable; skipped'}finally{if($null -ne $key){$key.Dispose()};if($null -ne $base){$base.Dispose()}}
  }
 }
 foreach($candidate in $ExplicitPaths){if([IO.Path]::GetFileName($candidate) -ieq $name){Add-Candidate $name $candidate 'explicit'}}
}
