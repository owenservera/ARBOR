[CmdletBinding()]
param([Parameter(Mandatory=$true)][ValidateCount(1,32)][string[]]$Names)
# Local read-only candidate discovery. Output is private, not an authorization.
$ErrorActionPreference='Stop'
if($PSVersionTable.PSVersion.Major -lt 7){throw 'PowerShell 7+ required'}
foreach($name in $Names){
 if($name -notmatch '^[A-Za-z0-9][A-Za-z0-9_.-]{0,80}\.exe$'){throw 'Supply explicit executable basenames only'}
 foreach($entry in @(Get-Command $name -All -CommandType Application -ErrorAction SilentlyContinue)){
  $candidate=$entry.Source
  if($candidate -match '(?i)[\\/]Microsoft[\\/]WindowsApps[\\/]'){continue}
  try{
   $item=Get-Item -LiteralPath $candidate -ErrorAction Stop
   if($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)){continue}
   [pscustomobject]@{name=$name;path=$item.FullName;sha256=(Get-FileHash -LiteralPath $item.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}
  }catch{Write-Warning 'Candidate inaccessible; skipped'}
 }
}
