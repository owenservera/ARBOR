@echo off
pwsh.exe -NoLogo -NoProfile -NonInteractive -File "%~dp0Install-DevCopy.ps1"
exit /b %errorlevel%
