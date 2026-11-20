# File: integration/scripts/r004-local-gate.ps1

> Generated 2026-11-19 · PowerShell · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | integration/scripts/r004-local-gate.ps1 |
| Language | PowerShell |
| Kind | source |
| Size | 1086 B |
| Lines | 34 |
| Hash | 8d017bc1ad56 |
| Test | no |
| Generated | no |
| Component | integration |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```powershell
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
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
