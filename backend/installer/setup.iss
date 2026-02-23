; ============================================================
; HLA Dentisterie - Backend Installer (Inno Setup)
; Compile this .iss file with Inno Setup on Windows to
; generate the HLA-Backend-Setup.exe installer.
; Download Inno Setup: https://jrsoftware.org/isinfo.php
; ============================================================

[Setup]
AppName=HLA Dentisterie Backend
AppVersion=1.0.0
AppPublisher=HLA
DefaultDirName={autopf}\HLA-Dentisterie
DefaultGroupName=HLA Dentisterie
OutputDir=output
OutputBaseFilename=HLA-Backend-Setup
Compression=lzma2
SolidCompression=yes
SetupIconFile=..\assets\icon.ico
PrivilegesRequired=admin
WizardStyle=modern

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Files]
; Backend source files
Source: "..\*"; DestDir: "{app}"; Excludes: "node_modules,.git,installer,database\dump.sql"; Flags: recursesubdirs createallsubdirs
; Database dump
Source: "..\database\dump.sql"; DestDir: "{app}\database"; Flags: ignoreversion
; PowerShell installer script
Source: "install.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion

[Run]
; Run the PowerShell setup script after file copy
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\installer\install.ps1"""; StatusMsg: "Configuration du backend et de la base de donnees..."; Flags: runhidden waituntilterminated

[Icons]
Name: "{group}\Demarrer Backend HLA"; Filename: "{app}\start-server.bat"
Name: "{group}\Desinstaller HLA Backend"; Filename: "{uninstallexe}"

[UninstallRun]
Filename: "powershell.exe"; Parameters: "-Command ""Stop-Process -Name node -Force -ErrorAction SilentlyContinue"""; Flags: runhidden

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
  if not MsgBox('Installer HLA Dentisterie Backend?' + #13#10 + #13#10 +
    'Cela va installer:' + #13#10 +
    '- Node.js (si absent)' + #13#10 +
    '- PostgreSQL (si absent)' + #13#10 +
    '- La base de donnees HLA' + #13#10 +
    '- Le serveur backend', mbConfirmation, MB_YESNO) = IDYES then
    Result := False;
end;
