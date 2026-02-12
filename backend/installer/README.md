# HLA Dentisterie - Installeur Backend Windows

## Prérequis
- Windows 10/11 (64-bit)
- Droits administrateur

## Option 1 : Script PowerShell (sans .exe)
1. Ouvrir PowerShell **en tant qu'administrateur**
2. Exécuter :
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
.\install.ps1
```

## Option 2 : Générer le .exe avec Inno Setup
1. Installer [Inno Setup](https://jrsoftware.org/isinfo.php) sur Windows
2. Ouvrir `setup.iss` dans Inno Setup
3. Compiler (Ctrl+F9)
4. Le fichier `HLA-Backend-Setup.exe` sera généré dans `output/`

## Ce que l'installeur fait
- Installe **Node.js v20** (si absent)
- Installe **PostgreSQL 16** (si absent)
- Crée la base de données `dentisterie`
- Importe les données depuis `dump.sql`
- Configure le démarrage automatique du serveur backend

## Configuration
- Backend : `http://localhost:3001`
- Base de données : `postgresql://hla_admin:***@localhost:5432/dentisterie`
