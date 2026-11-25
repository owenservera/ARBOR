@echo off
setlocal
powershell.exe -NoProfile -File "%~dp0Connect-Vivim.ps1" %*
set "VIVIM_EXIT=%ERRORLEVEL%"
if not "%VIVIM_EXIT%"=="0" pause
exit /b %VIVIM_EXIT%
