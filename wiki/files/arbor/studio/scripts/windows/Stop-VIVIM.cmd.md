# File: studio/scripts/windows/Stop-VIVIM.cmd

> Generated 2026-11-19 · Other · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/scripts/windows/Stop-VIVIM.cmd |
| Language | Other |
| Kind | other |
| Size | 389 B |
| Lines | 10 |
| Hash | b6b4fd25ecd7 |
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
rem Double-click to stop VIVIM. The VIVIM browser and your sign-ins stay.
setlocal
set "VIVIM_PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%VIVIM_PS%" set "VIVIM_PS=powershell.exe"
"%VIVIM_PS%" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0VIVIM.ps1" -Stop %*
set "VIVIM_RESULT=%ERRORLEVEL%"
echo.
pause
exit /b %VIVIM_RESULT%
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
