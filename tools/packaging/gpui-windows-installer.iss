; VIVIM native GPUI Windows installer recipe (Inno Setup 6).
; Build only from a verified Tauri-free portable tree.
; Never package local owner data or stop a running Host with pending effects.
#define SourceRoot GetEnv("ARBOR_GPUI_PORTABLE_DIR")
#if SourceRoot == ""
  #error Define ARBOR_GPUI_PORTABLE_DIR to an already verified GPUI portable directory.
#endif
[Setup]
AppId=VIVIM.GPUI.Host
AppName=VIVIM Host (GPUI)
AppVersion=0.1.0
AppPublisher=VIVIM
DefaultDirName={localappdata}\Programs\VIVIM GPUI
DefaultGroupName=VIVIM
PrivilegesRequired=lowest
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
Compression=lzma2
SolidCompression=yes
OutputBaseFilename=VIVIM-GPUI-Host-0.1.0-x64
OutputDir={#SourceRoot}\..\installers
UninstallDisplayIcon={app}\vivim-gpui-desktop.exe
CloseApplications=no
RestartApplications=no
DisableProgramGroupPage=yes
[Files]
Source: "{#SourceRoot}\vivim-gpui-desktop.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourceRoot}\runtime\*"; DestDir: "{app}\runtime"; Flags: ignoreversion recursesubdirs createallsubdirs
[Icons]
Name: "{group}\VIVIM Host"; Filename: "{app}\vivim-gpui-desktop.exe"
Name: "{autodesktop}\VIVIM Host"; Filename: "{app}\vivim-gpui-desktop.exe"; Tasks: desktopicon
[Tasks]
Name: desktopicon; Description: "Create a desktop shortcut"; GroupDescription: "Additional shortcuts"; Flags: unchecked
