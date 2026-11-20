# File: studio/scripts/windows/VIVIM.cmd

> Generated 2026-11-19 · Other · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/scripts/windows/VIVIM.cmd |
| Language | Other |
| Kind | other |
| Size | 470 B |
| Lines | 13 |
| Hash | 947129ea23eb |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```
@echo off
rem Double-click to open VIVIM. Extra options pass through, e.g.  VIVIM.cmd -LanPair  or  -DryRun
setlocal
set "VIVIM_PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%VIVIM_PS%" set "VIVIM_PS=powershell.exe"
"%VIVIM_PS%" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0VIVIM.ps1" %*
if errorlevel 1 (
  echo.
  echo VIVIM could not open. Read the message above, then try again.
  pause
  exit /b 1
)
exit /b 0
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
