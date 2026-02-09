# Guide de Déploiement Production - Dentisterie App

## Architecture de Production

### Backend - Windows Server 2019
- **Serveur** : Windows Server 2019
- **RAM** : 32 GB
- **CPU** : Intel Core i7 12th gen
- **Stockage** : NVMe 500 GB
- **IP** : 192.168.1.100 (exemple)
- **Port** : 4000

### Frontend - Windows 10
- **RAM** : 4 GB
- **Application** : Tauri standalone (.exe)
- **Connexion** : http://192.168.1.100:4000

---

## Étape 1 : Préparation du Serveur Windows

### 1.1 Installer Node.js
```powershell
# Télécharger Node.js 20 LTS depuis nodejs.org
# Installer en mode administrateur
node --version  # Vérifier : v20.x.x
npm --version   # Vérifier : 10.x.x
```

### 1.2 Installer PostgreSQL
```powershell
# Télécharger PostgreSQL 15 depuis postgresql.org
# Installer avec pgAdmin 4
# Créer la base de données
psql -U postgres
CREATE DATABASE dentisterie;
CREATE USER dentisterie_user WITH PASSWORD 'VotreMotDePasseSecurise';
GRANT ALL PRIVILEGES ON DATABASE dentisterie TO dentisterie_user;
\q
```

### 1.3 Installer PM2 globalement
```powershell
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

### 1.4 Installer Git
```powershell
# Télécharger Git depuis git-scm.com
# Installer en mode administrateur
git --version
```

---

## Étape 2 : Déploiement du Backend

### 2.1 Transférer les fichiers
```powershell
# Sur votre Mac, créer un zip
cd /Users/mac/Documents/WORK/HLA/dentisterie-app
zip -r dentisterie-backend.zip backend/

# Transférer via SCP, USB, ou réseau partagé vers Windows Server
# Exemple avec SCP :
scp dentisterie-backend.zip admin@192.168.1.100:C:\Apps\
```

### 2.2 Extraire et configurer
```powershell
# Sur Windows Server
cd C:\Apps
unzip dentisterie-backend.zip
cd backend

# Créer le fichier .env
copy .env.example .env
notepad .env
```

**Contenu .env pour production** :
```env
DATABASE_URL="postgresql://dentisterie_user:VotreMotDePasseSecurise@localhost:5432/dentisterie"
PORT=4000
NODE_ENV=production
JWT_SECRET="votre-secret-jwt-super-securise-changez-moi"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="*"
LOG_LEVEL="info"
```

### 2.3 Installer les dépendances
```powershell
npm install --production
```

### 2.4 Générer Prisma Client
```powershell
npx prisma generate
```

### 2.5 Exécuter les migrations
```powershell
npx prisma migrate deploy
```

### 2.6 Seed initial (utilisateurs)
```powershell
npm run seed
```

### 2.7 Build TypeScript
```powershell
npm run build
```

---

## Étape 3 : Configuration PM2 avec Logs et Metrics

### 3.1 Créer le fichier ecosystem.config.js
```powershell
notepad ecosystem.config.js
```

**Contenu** :
```javascript
module.exports = {
  apps: [{
    name: 'dentisterie-backend',
    script: './dist/server.js',
    instances: 2,  // 2 instances pour utiliser les 2 cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: 'C:\\Apps\\logs\\dentisterie-error.log',
    out_file: 'C:\\Apps\\logs\\dentisterie-out.log',
    log_file: 'C:\\Apps\\logs\\dentisterie-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    
    // Metrics détaillées
    instance_var: 'INSTANCE_ID',
    
    // Logs rotatifs
    log_type: 'json',
    
    // Monitoring
    pmx: true,
    
    // Variables d'environnement pour les metrics
    env_production: {
      NODE_ENV: 'production',
      ENABLE_METRICS: 'true',
      METRICS_PORT: 9090
    }
  }]
}
```

### 3.2 Créer le dossier de logs
```powershell
mkdir C:\Apps\logs
```

### 3.3 Démarrer avec PM2
```powershell
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3.4 Vérifier le statut
```powershell
pm2 status
pm2 logs dentisterie-backend --lines 50
pm2 monit  # Monitoring en temps réel
```

---

## Étape 4 : Configuration des Logs Détaillés

### 4.1 Installer PM2 Log Rotate
```powershell
pm2 install pm2-logrotate

# Configuration
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:rotateModule true
```

### 4.2 Installer PM2 Metrics (optionnel)
```powershell
npm install -g @pm2/io
```

### 4.3 Commandes PM2 Utiles

```powershell
# Voir les logs en temps réel
pm2 logs dentisterie-backend

# Voir les logs d'erreur uniquement
pm2 logs dentisterie-backend --err

# Voir les metrics
pm2 monit

# Redémarrer
pm2 restart dentisterie-backend

# Recharger sans downtime
pm2 reload dentisterie-backend

# Arrêter
pm2 stop dentisterie-backend

# Supprimer
pm2 delete dentisterie-backend

# Voir les informations détaillées
pm2 show dentisterie-backend

# Exporter les logs
pm2 flush  # Vider les logs
pm2 logs --json > logs-export.json
```

### 4.4 Metrics Disponibles

PM2 fournit automatiquement :
- **CPU** : Utilisation CPU par instance
- **Memory** : Utilisation mémoire
- **Requests** : Nombre de requêtes/sec
- **Latency** : Temps de réponse moyen
- **Errors** : Taux d'erreur
- **Restarts** : Nombre de redémarrages
- **Uptime** : Temps de fonctionnement

**Dashboard web PM2 Plus** (optionnel) :
```powershell
pm2 link <secret_key> <public_key>
# Dashboard disponible sur https://app.pm2.io
```

---

## Étape 5 : Migration des Données

### 5.1 Sur votre Mac (Développement)
```bash
cd /Users/mac/Documents/WORK/HLA/dentisterie-app/backend

# Configurer la connexion PostgreSQL du serveur dans .env
DATABASE_URL="postgresql://dentisterie_user:password@192.168.1.100:5432/dentisterie"

# Exécuter la migration
tsx src/migrate-from-mysql.ts
```

### 5.2 Vérifier les données
```powershell
# Sur Windows Server
npx prisma studio
# Ouvrir http://localhost:5555 pour voir les données
```

---

## Étape 6 : Déploiement du Frontend

### 6.1 Build sur macOS
```bash
cd /Users/mac/Documents/WORK/HLA/dentisterie-app/frontend

# Build pour Windows
npm run tauri build -- --target x86_64-pc-windows-msvc

# Le fichier .exe sera dans :
# src-tauri/target/x86_64-pc-windows-msvc/release/dentisterie-app.exe
```

### 6.2 Installation sur Windows 10
1. Copier `dentisterie-app.exe` sur Windows 10
2. Double-cliquer pour installer
3. Au premier lancement, configurer l'URL du backend :
   - `http://192.168.1.100:4000`

---

## Étape 7 : Configuration Firewall

### Windows Server 2019
```powershell
# Autoriser le port 4000
New-NetFirewallRule -DisplayName "Dentisterie Backend" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow

# Autoriser PostgreSQL (si accès distant nécessaire)
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow
```

---

## Étape 8 : Monitoring et Maintenance

### 8.1 Logs Détaillés

**Structure des logs** :
```
C:\Apps\logs\
├── dentisterie-error.log      # Erreurs uniquement
├── dentisterie-out.log         # Sorties standard
├── dentisterie-combined.log    # Tout
└── archives/                   # Logs rotatifs (30 jours)
```

**Format des logs** :
```json
{
  "message": "Patient créé",
  "timestamp": "2026-02-09T14:30:00.000Z",
  "level": "info",
  "context": {
    "userId": 2,
    "username": "MC-Harison",
    "action": "CREATE",
    "module": "patient",
    "entityId": "12345"
  },
  "metrics": {
    "duration": "45ms",
    "memory": "125MB",
    "cpu": "12%"
  }
}
```

### 8.2 Alertes

**Configurer des alertes PM2** :
```powershell
# Alerte si mémoire > 800MB
pm2 set pm2:max_memory_restart 800M

# Alerte si redémarrage > 5 fois en 1 minute
pm2 set pm2:min_uptime 60000
pm2 set pm2:max_restarts 5
```

### 8.3 Backup Automatique

**Script PowerShell pour backup quotidien** :
```powershell
# backup-dentisterie.ps1
$date = Get-Date -Format "yyyy-MM-dd"
$backupPath = "C:\Backups\dentisterie-$date.sql"

# Backup PostgreSQL
& "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" -U dentisterie_user -d dentisterie -f $backupPath

# Compresser
Compress-Archive -Path $backupPath -DestinationPath "$backupPath.zip"
Remove-Item $backupPath

# Garder seulement 7 jours
Get-ChildItem "C:\Backups\dentisterie-*.zip" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Remove-Item
```

**Planifier avec Task Scheduler** :
- Exécuter tous les jours à 2h du matin
- Compte : SYSTEM
- Démarrer même si l'utilisateur n'est pas connecté

---

## Étape 9 : Vérification Post-Déploiement

### 9.1 Tests de Santé
```powershell
# Test endpoint health
curl http://localhost:4000/health

# Test tRPC
curl http://localhost:4000/trpc/auth.me

# Vérifier PM2
pm2 status
pm2 logs --lines 100
```

### 9.2 Tests de Performance
```powershell
# Installer Apache Bench (optionnel)
# Test de charge : 1000 requêtes, 10 concurrent
ab -n 1000 -c 10 http://localhost:4000/health
```

### 9.3 Checklist Finale
- [ ] PostgreSQL démarre automatiquement au boot
- [ ] PM2 démarre automatiquement au boot
- [ ] Firewall configuré
- [ ] Logs rotatifs configurés
- [ ] Backup automatique configuré
- [ ] Frontend se connecte au backend
- [ ] Les 4 utilisateurs peuvent se connecter
- [ ] Création d'une facture test réussie

---

## Étape 10 : Commandes de Maintenance

### Redémarrage complet
```powershell
# Arrêter PM2
pm2 stop all

# Redémarrer PostgreSQL
Restart-Service postgresql-x64-15

# Redémarrer PM2
pm2 restart all

# Vérifier
pm2 status
pm2 logs --lines 20
```

### Mise à jour de l'application
```powershell
cd C:\Apps\backend

# Sauvegarder l'ancienne version
xcopy /E /I . ..\backend-backup-%date%

# Arrêter PM2
pm2 stop dentisterie-backend

# Mettre à jour le code (via Git ou copie manuelle)
git pull origin main

# Installer les nouvelles dépendances
npm install --production

# Exécuter les nouvelles migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Redémarrer
pm2 restart dentisterie-backend

# Vérifier
pm2 logs dentisterie-backend --lines 50
```

### Restauration depuis backup
```powershell
# Arrêter l'application
pm2 stop dentisterie-backend

# Restaurer la base de données
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U dentisterie_user -d dentisterie -f C:\Backups\dentisterie-2026-02-09.sql

# Redémarrer
pm2 restart dentisterie-backend
```

---

## Logs et Metrics Détaillés

### Structure des Logs PM2

**Logs d'application** :
```
[2026-02-09 14:30:00] INFO  [Patient] CREATE - User: MC-Harison - Entity: D7264F
[2026-02-09 14:30:05] INFO  [Facture] CREATE - User: DT-Operateur - Numero: 00248 - Montant: 17820
[2026-02-09 14:30:10] WARN  [Auth] FAILED_LOGIN - Username: unknown - IP: 192.168.1.50
[2026-02-09 14:30:15] ERROR [Database] CONNECTION_LOST - Reconnecting...
```

### Metrics Disponibles

**CPU & Memory** :
```
┌─────┬──────────────────────┬─────────┬─────────┬──────────┬─────────┐
│ id  │ name                 │ mode    │ ↺       │ status   │ cpu     │ memory  │
├─────┼──────────────────────┼─────────┼─────────┼──────────┼─────────┤
│ 0   │ dentisterie-backend  │ cluster │ 0       │ online   │ 2.5%    │ 145 MB  │
│ 1   │ dentisterie-backend  │ cluster │ 0       │ online   │ 1.8%    │ 138 MB  │
└─────┴──────────────────────┴─────────┴─────────┴──────────┴─────────┘
```

**Requêtes/sec** :
```
Requests: 1250/min (20.8/sec)
Latency: avg 45ms, p95 120ms, p99 250ms
Errors: 0.02% (2 errors/10000 requests)
```

### Exporter les Metrics

**Script PowerShell pour export quotidien** :
```powershell
# export-metrics.ps1
$date = Get-Date -Format "yyyy-MM-dd-HH-mm"
pm2 jlist | Out-File "C:\Apps\metrics\metrics-$date.json"
```

---

## Étape 11 : Sécurité

### 11.1 HTTPS (Recommandé)
```powershell
# Installer un certificat SSL
# Option 1: Let's Encrypt avec Certbot
# Option 2: Certificat auto-signé pour réseau local

# Configurer Fastify pour HTTPS
# Modifier src/server.ts pour ajouter les options HTTPS
```

### 11.2 Restriction d'accès
```powershell
# Autoriser uniquement le réseau local
New-NetFirewallRule -DisplayName "Dentisterie Local Only" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow -RemoteAddress 192.168.1.0/24
```

### 11.3 Mots de passe forts
- Changer les mots de passe par défaut des utilisateurs
- Utiliser un gestionnaire de mots de passe
- Rotation des mots de passe tous les 3 mois

---

## Étape 12 : Troubleshooting

### Backend ne démarre pas
```powershell
# Vérifier les logs
pm2 logs dentisterie-backend --err --lines 100

# Vérifier PostgreSQL
psql -U dentisterie_user -d dentisterie -c "SELECT 1;"

# Vérifier le port
netstat -ano | findstr :4000

# Redémarrer en mode debug
pm2 delete dentisterie-backend
set NODE_ENV=development
node dist/server.js
```

### Frontend ne se connecte pas
1. Vérifier l'URL backend dans les paramètres
2. Ping le serveur : `ping 192.168.1.100`
3. Tester avec curl : `curl http://192.168.1.100:4000/health`
4. Vérifier le firewall

### Performance lente
```powershell
# Vérifier les metrics
pm2 monit

# Augmenter les instances PM2
pm2 scale dentisterie-backend 4

# Vérifier PostgreSQL
# Ouvrir pgAdmin 4 > Dashboard > Server Activity
```

---

## Résumé des Commandes Essentielles

```powershell
# Démarrer
pm2 start ecosystem.config.js

# Arrêter
pm2 stop dentisterie-backend

# Redémarrer
pm2 restart dentisterie-backend

# Logs
pm2 logs dentisterie-backend

# Monitoring
pm2 monit

# Statut
pm2 status

# Sauvegarder la config
pm2 save

# Liste des processus
pm2 list

# Informations détaillées
pm2 show dentisterie-backend

# Flush logs
pm2 flush

# Reload sans downtime
pm2 reload dentisterie-backend
```

---

## Support et Maintenance

### Contacts
- **Dev** : dev@hopital.mg
- **Admin** : MC-Harison, GT-Nary

### Documentation
- `README.md` - Vue d'ensemble
- `INSTALLATION.md` - Installation développement
- `DEPLOIEMENT_PRODUCTION.md` - Ce document
- `DOCUMENTATION_FRONTEND.md` - API et structure

### Logs d'Audit
Tous les logs utilisateurs sont dans la table `user_logs` :
```sql
SELECT * FROM user_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```
