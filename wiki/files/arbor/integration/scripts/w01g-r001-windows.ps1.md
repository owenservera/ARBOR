# File: integration/scripts/w01g-r001-windows.ps1

> Generated 2026-11-19 · PowerShell · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | integration/scripts/w01g-r001-windows.ps1 |
| Language | PowerShell |
| Kind | source |
| Size | 4913 B |
| Lines | 81 |
| Hash | 3e41313b8bdf |
| Test | no |
| Generated | no |
| Component | integration |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| Invoke-Check | function | 12 | yes | function Invoke-Check([string]$Id,[string]$Exe,[string[]]$Args,[string]$Folder) { |
| Checked | function | 22 | yes | function Checked([string]$Id,[string]$Exe,[string[]]$Args,[string]$Folder){ |

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```powershell
#requires -Version 7.2
# W01-G R001. Disposable Windows x64 checkout only; no push, cutover, or publication.
# Modes: GenerateLocks (review/commit real locks), Verify, NoDonor (isolated ARBOR clone).
param([ValidateSet('GenerateLocks','Verify','NoDonor')][string]$Mode='Verify')
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$Root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$Evidence = Join-Path $env:TEMP ('ARBOR-W01G-R001-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Force -Path $Evidence | Out-Null
$records=[System.Collections.Generic.List[object]]::new()
function Invoke-Check([string]$Id,[string]$Exe,[string[]]$Args,[string]$Folder) {
  $started=(Get-Date).ToString('o'); $prev=Get-Location; $code=127; $output=''
  try { Set-Location $Folder; $output=(& $Exe @Args 2>&1 | Out-String); $code=$LASTEXITCODE }
  catch { $output=$_.Exception.ToString(); $code=127 }
  finally { Set-Location $prev }
  if ($null -eq $code) { $code=127 }
  $records.Add([ordered]@{id=$Id;cmd=$Exe;args=$Args;cwd=$Folder;started=$started;ended=(Get-Date).ToString('o');exitCode=[int]$code;output=$output})
  Write-Host ("$Id exit=$code")
  return [int]$code
}
function Checked([string]$Id,[string]$Exe,[string[]]$Args,[string]$Folder){
  $c=Invoke-Check $Id $Exe $Args $Folder
  if($c -ne 0){throw "$Id failed: $c"}
}
$head=(& git -C $Root rev-parse HEAD).Trim()
if($LASTEXITCODE -ne 0){throw 'Need checked-out ARBOR repository'}
try {
 if($Mode -eq 'GenerateLocks'){
   Checked 'node-version' 'node' @('--version') $Root
   Checked 'bun-version' 'bun' @('--version') $Root
   Checked 'cargo-version' 'cargo' @('--version') $Root
   Checked 'rustc-version' 'rustc' @('--version') $Root
   Checked 'cargo-generate-lockfile' 'cargo' @('generate-lockfile') $Root
   Checked 'bun-generate-lockfile' 'bun' @('install','--ignore-scripts') $Root
   Checked 'cargo-locked-metadata' 'cargo' @('metadata','--locked','--format-version','1') $Root
   Checked 'bun-frozen-install' 'bun' @('install','--frozen-lockfile','--ignore-scripts') $Root
   if(!(Test-Path (Join-Path $Root 'Cargo.lock')) -or !(Test-Path (Join-Path $Root 'bun.lock'))){throw 'Real lockfiles missing'}
   Write-Host 'Review and commit actual lockfiles as G; nothing auto-committed'
 }else{
   $At=$Root
   if($Mode -eq 'NoDonor'){
     $clean=(& git -C $Root status --porcelain)
     if($LASTEXITCODE -ne 0 -or $clean){throw 'NoDonor requires a clean committed tree'}
     $At=Join-Path $Evidence 'isolated-ARBOR'
     Checked 'clone-ARBOR-only' 'git' @('clone','--no-hardlinks','--no-checkout',$Root,$At) $Root
     Checked 'checkout-pinned-HEAD' 'git' @('checkout','--detach',$head) $At
   }
   $env:VIVIM_HOST_DATA_DIR=Join-Path $Evidence 'synthetic-host'
   $env:CAPTURE_STUDIO_HOME=Join-Path $Evidence 'synthetic-studio'
   New-Item -ItemType Directory -Force -Path $env:VIVIM_HOST_DATA_DIR,$env:CAPTURE_STUDIO_HOME | Out-Null
   if(!(Test-Path (Join-Path $At 'Cargo.lock')) -or !(Test-Path (Join-Path $At 'bun.lock'))){throw 'Commit genuine locks before verification'}
   $checks=@(
     @('node-version','node',@('--version')),
     @('bun-version','bun',@('--version')),
     @('cargo-version','cargo',@('--version')),
     @('rustc-version','rustc',@('-vV')),
     @('source-closure','node',@('integration/scripts/w01g-r001-source-closure.mjs')),
     @('packaging-preflight','node',@('tools/packaging/prepare-host-runtime.mjs','--check')),
     @('cargo-metadata','cargo',@('metadata','--locked','--format-version','1')),
     @('cargo-tree','cargo',@('tree','--locked','-d')),
     @('hqkg-importer','cargo',@('test','--locked','-p','hq-knowledge-graph','--features','importer')),
     @('programmability','cargo',@('test','--locked','-p','vivim-programmability-core')),
     @('cargo-workspace','cargo',@('test','--locked','--workspace')),
     @('tauri-msvc','cargo',@('check','--locked','-p','vivim-host','--target','x86_64-pc-windows-msvc')),
     @('bun-frozen','bun',@('install','--frozen-lockfile','--ignore-scripts')),
     @('host','bun',@('run','test:host')),
     @('hq','bun',@('run','test:hq')),
     @('interop','bun',@('run','test:interop')),
     @('mobile','bun',@('run','test:mobile')),
     @('tierflow','bun',@('run','test:tierflow'))
   )
   foreach($c in $checks){[void](Invoke-Check $c[0] $c[1] $c[2] $At)}
 }
}finally{
 $summary=[ordered]@{schema='arbor.w01g.r001.commands/1';head=$head;mode=$Mode;os=[Environment]::OSVersion.VersionString;ps=$PSVersionTable.PSVersion.ToString();records=$records}
 $summary | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $Evidence 'evidence.json') -Encoding UTF8
 Write-Host "Local unsanitized evidence: $Evidence/evidence.json"
}
if(($records | Where-Object {$_.exitCode -ne 0}).Count -gt 0){exit 1}
```

_First 80 of 82 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
