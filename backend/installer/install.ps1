# ============================================================
# HLA Dentisterie - Backend + Database Installer (PowerShell)
# ============================================================
# Ce script installe Node.js, PostgreSQL, configure la BDD
# et démarre le backend automatiquement.
# Usage: Run as Administrator
# ============================================================

$ErrorActionPreference = "Stop"

$INSTALL_DIR = "$env:ProgramFiles\HLA-Dentisterie"
$DATA_DIR = "$env:ProgramData\HLA-Dentisterie"
$DB_NAME = "dentisterie"
$DB_USER = "hla_admin"
$DB_PASS = "hla_secure_2026"
$NODE_VERSION = "20.11.1"
$PG_VERSION = "16"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  HLA Dentisterie - Installation Backend"     -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --- Verify admin ---
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERREUR: Veuillez executer ce script en tant qu'Administrateur." -ForegroundColor Red
    pause
    exit 1
}

# ---- 1. Install Node.js ----
Write-Host "[1/6] Verification de Node.js..." -ForegroundColor Yellow
$nodeInstalled = $false
try {
    $nodeVer = & node --version 2>$null
    if ($nodeVer) {
        Write-Host "  Node.js deja installe: $nodeVer" -ForegroundColor Green
        $nodeInstalled = $true
    }
} catch {}

if (-not $nodeInstalled) {
    Write-Host "  Installation de Node.js v$NODE_VERSION..." -ForegroundColor Yellow
    $nodeUrl = "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-x64.msi"
    $nodeMsi = "$env:TEMP\node-install.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeMsi -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /qn" -Wait -NoNewWindow
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    Remove-Item $nodeMsi -Force
    Write-Host "  Node.js installe avec succes." -ForegroundColor Green
}

# ---- 2. Install PostgreSQL ----
Write-Host "[2/6] Verification de PostgreSQL..." -ForegroundColor Yellow
$pgInstalled = $false
try {
    $pgVer = & psql --version 2>$null
    if ($pgVer) {
        Write-Host "  PostgreSQL deja installe: $pgVer" -ForegroundColor Green
        $pgInstalled = $true
    }
} catch {}

if (-not $pgInstalled) {
    Write-Host "  Installation de PostgreSQL $PG_VERSION..." -ForegroundColor Yellow
    $pgUrl = "https://get.enterprisedb.com/postgresql/postgresql-$PG_VERSION.2-1-windows-x64.exe"
    $pgExe = "$env:TEMP\pg-install.exe"
    Invoke-WebRequest -Uri $pgUrl -OutFile $pgExe -UseBasicParsing
    Start-Process $pgExe -ArgumentList "--mode unattended --superpassword `"postgres`" --serverport 5432" -Wait -NoNewWindow
    $env:Path += ";C:\Program Files\PostgreSQL\$PG_VERSION\bin"
    [System.Environment]::SetEnvironmentVariable("Path", $env:Path, "Machine")
    Remove-Item $pgExe -Force
    Write-Host "  PostgreSQL installe avec succes." -ForegroundColor Green
}

# ---- 3. Create database and user ----
Write-Host "[3/6] Configuration de la base de donnees..." -ForegroundColor Yellow
$env:PGPASSWORD = "postgres"

# Create user if not exists
$userExists = & psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>$null
if ($userExists -ne "1") {
    & psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS' CREATEDB;"
    Write-Host "  Utilisateur '$DB_USER' cree." -ForegroundColor Green
} else {
    Write-Host "  Utilisateur '$DB_USER' existe deja." -ForegroundColor Green
}

# Create database if not exists
$dbExists = & psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>$null
if ($dbExists -ne "1") {
    & psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    Write-Host "  Base de donnees '$DB_NAME' creee." -ForegroundColor Green
} else {
    Write-Host "  Base de donnees '$DB_NAME' existe deja." -ForegroundColor Green
}

# ---- 4. Import database dump ----
Write-Host "[4/6] Import des donnees..." -ForegroundColor Yellow
$dumpFile = Join-Path $PSScriptRoot "..\database\dump.sql"
if (Test-Path $dumpFile) {
    $env:PGPASSWORD = $DB_PASS
    & psql -U $DB_USER -d $DB_NAME -f $dumpFile 2>$null
    Write-Host "  Donnees importees avec succes." -ForegroundColor Green
} else {
    Write-Host "  ATTENTION: Fichier dump.sql introuvable. La base sera vide." -ForegroundColor Red
}

# ---- 5. Copy backend files ----
Write-Host "[5/6] Installation du backend..." -ForegroundColor Yellow
$backendSrc = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path $INSTALL_DIR)) {
    New-Item -ItemType Directory -Path $INSTALL_DIR -Force | Out-Null
}
Copy-Item -Path "$backendSrc\*" -Destination $INSTALL_DIR -Recurse -Force -Exclude @("installer", "node_modules", ".git", "database")
Write-Host "  Fichiers copies dans $INSTALL_DIR" -ForegroundColor Green

# Create .env
$envContent = @"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
PORT=3001
NODE_ENV=production
JWT_SECRET=hla_jwt_secret_prod_2026
LOG_LEVEL=info
"@
$envContent | Out-File -FilePath "$INSTALL_DIR\.env" -Encoding utf8
Write-Host "  Fichier .env cree." -ForegroundColor Green

# Install npm dependencies
Set-Location $INSTALL_DIR
& npm install --production 2>$null
& npx prisma generate 2>$null
Write-Host "  Dependances installees." -ForegroundColor Green

# ---- 6. Create Windows service / startup shortcut ----
Write-Host "[6/6] Configuration du demarrage automatique..." -ForegroundColor Yellow

# Create a batch file to start the server
$startBat = @"
@echo off
cd /d "$INSTALL_DIR"
node dist/server.js
"@
$startBat | Out-File -FilePath "$INSTALL_DIR\start-server.bat" -Encoding ascii

# Create startup shortcut
$WshShell = New-Object -ComObject WScript.Shell
$startupPath = $WshShell.SpecialFolders("Startup")
$shortcut = $WshShell.CreateShortcut("$startupPath\HLA-Backend.lnk")
$shortcut.TargetPath = "$INSTALL_DIR\start-server.bat"
$shortcut.WorkingDirectory = $INSTALL_DIR
$shortcut.WindowStyle = 7  # Minimized
$shortcut.Save()
Write-Host "  Demarrage automatique configure." -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Installation terminee avec succes!"        -ForegroundColor Green
Write-Host "  Backend: http://localhost:3001"             -ForegroundColor Green
Write-Host "  Base de donnees: $DB_NAME"                  -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Demarrage du serveur..."
Start-Process "$INSTALL_DIR\start-server.bat" -WindowStyle Minimized
Write-Host "Le serveur est demarre en arriere-plan." -ForegroundColor Green
pause
