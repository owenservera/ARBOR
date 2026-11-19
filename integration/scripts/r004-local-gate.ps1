#Requires -Version 7.2
<#
  R004 local Node24 acceptance runner.
  Execute from any directory:
    pwsh -NoProfile -File integration/scripts/r004-local-gate.ps1
    pwsh -NoProfile -File integration/scripts/r004-local-gate.ps1 -Profile full
  No elevated rights; no package install; no writes to live owner data.
#>
[CmdletBinding()]
param(
  [ValidateSet('focused','full')]
  [string] $Profile = 'focused'
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$runner = Join-Path $PSScriptRoot 'r004-local-gate.mjs'
if (-not (Test-Path -LiteralPath $runner -PathType Leaf)) {
  Write-Error 'R004 local gate source file is missing.'
  exit 2
}
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Error 'Node.js is unavailable. Install or select Node >=24 before acceptance.'
  exit 2
}
try {
  & $node.Source $runner ('--' + $Profile)
  $code = $LASTEXITCODE
  if ($null -eq $code) { exit 2 }
  exit ([int] $code)
} catch {
  Write-Error ('R004 local gate refused execution: ' + $_.Exception.Message)
  exit 2
}
