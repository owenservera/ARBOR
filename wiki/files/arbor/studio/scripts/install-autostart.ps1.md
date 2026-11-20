# File: studio/scripts/install-autostart.ps1

> Generated 2026-11-19 · PowerShell · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/install-autostart.ps1 |
| Language | PowerShell |
| Kind | source |
| Size | 6868 B |
| Lines | 202 |
| Hash | ca648760df48 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Resolve-Node | function | 52 | yes | function Resolve-Node { |
| Get-AlwaysOnTask | function | 60 | yes | function Get-AlwaysOnTask { |
| Get-TaskInfo | function | 68 | yes | function Get-TaskInfo { |
| Show-TaskStatus | function | 76 | yes | function Show-TaskStatus { |
| Invoke-Supervisor | function | 94 | yes | function Invoke-Supervisor { |
| Install-Task | function | 115 | yes | function Install-Task { |
| Remove-Task | function | 160 | yes | function Remove-Task { |
| Start-Task | function | 169 | yes | function Start-Task { |
| Stop-Task | function | 182 | yes | function Stop-Task { |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```powershell
<#
.SYNOPSIS
  Install / remove / inspect the Capture Studio "always-on" scheduled task.

.DESCRIPTION
  Registers a per-user Scheduled Task named "CaptureStudio-AlwaysOn" that runs
  the always-on supervisor (scripts\always-on.mjs) at logon, hidden, with an
  unlimited execution time limit and automatic restarts.

  No administrator rights are required: the task runs in the current user's
  context (Interactive logon type, LeastPrivilege run level).

  This script never edits any file and never touches Chrome.

.PARAMETER Install
  Register (or replace) the scheduled task. This is the default action when no
  switch is given.

.PARAMETER Remove
  Unregister the scheduled task. No error if it does not exist.

.PARAMETER Status
  Show the task state, last run time and last result, and run
  "node scripts\always-on.mjs --status".

.PARAMETER Start
  Start the scheduled task now, then show the status.

.PARAMETER Stop
  Run "node scripts\always-on.mjs --stop", then stop the scheduled task.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-autostart.ps1 -Status
#>
[CmdletBinding()]
param(
  [switch]$Install,
  [switch]$Remove,
  [switch]$Status,
  [string]$ChromeProfile = (Join-Path $env:LOCALAPPDATA 'chrome-cdp-profile'),
  [switch]$Start,
  [switch]$Stop
)

$ErrorActionPreference = 'Stop'

$TaskName  = 'CaptureStudio-AlwaysOn'
$TaskPath  = '\'
$Root      = Split-Path -Parent $PSScriptRoot          # capture-studio root
$Script    = Join-Path $Root 'scripts\always-on.mjs'   # supervisor entry point

function Resolve-Node {
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  if (-not $cmd) {
    throw "node.exe was not found on PATH. Install Node.js (18 or newer) or add node.exe to PATH, then run this script again."
  }
  return $cmd.Source
}

function Get-AlwaysOnTask {
  try {
    return Get-ScheduledTask -TaskName $TaskName -TaskPath $TaskPath -ErrorAction Stop
  } catch {
    return $null
  }
}

function Get-TaskInfo {
  try {
    return Get-ScheduledTaskInfo -TaskName $TaskName -TaskPath $TaskPath -ErrorAction Stop
  } catch {
    return $null
  }
}

function Show-TaskStatus {
  Write-Host "Scheduled task : $TaskName"
  $task = Get-AlwaysOnTask
  if (-not $task) {
    Write-Host "  Installed    : no"
```

_First 80 of 203 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
