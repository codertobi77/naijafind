# CI/CD Deployment Guide - Hostinger VPS (Docker)

Ce guide explique comment configurer le déploiement automatique de NaijaFind sur un VPS Hostinger via GitHub Actions avec Docker.

## Architecture Docker

```
┌─────────────────┐
│   GitHub Repo   │
│  (Code source)  │
└────────┬────────┘
         │ Push/Merge
         ▼
┌──────────────────────────┐
│      GitHub Actions      │
│  (Build Docker Image)    │
└────────┬─────────────────┘
         │ SCP / SSH
         ▼
┌──────────────────────────┐
│     Hostinger VPS        │
│  ┌────────────────────┐  │
│  │   Nginx (80/443)   │  │  ← Reverse Proxy + SSL
│  │   (sur le host)    │  │
│  └────────┬───────────┘  │
│           │              │
│  ┌────────▼──────────┐  │
│  │  Docker Container │  │
│  │  ┌─────────────┐    │  │
│  │  │    Nginx    │    │  │  ← Sert l'app React
│  │  │   (Port 80) │    │  │
│  │  └──────┬──────┘    │  │
│  │         │            │  │
│  │  ┌──────▼──────┐    │  │
│  │  │  dist/      │    │  │  ← App React buildée
│  │  │ (React App) │    │  │
│  │  └─────────────┘    │  │
│  └─────────────────────┘  │
└──────────────────────────┘
```

## Configuration Requise

### 1. Prérequis sur le VPS Hostinger

Connectez-vous à votre VPS et exécutez :

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER
newgrp docker

# Installation de Docker Compose (plugin)
sudo apt install -y docker-compose-plugin

# Vérification
docker --version
docker compose version

# Installation de Nginx (sur le host pour reverse proxy)
sudo apt install -y nginx

# Installation de Certbot pour SSL
sudo apt install -y certbot python3-certbot-nginx

# Création du répertoire de déploiement
sudo mkdir -p /var/www/naijafind
sudo chown $USER:$USER /var/www/naijafind
```

### 2. Configuration SSH pour GitHub Actions

Générez une clé SSH sur votre machine locale :

```bash
ssh-keygen -t ed25519 -C "github-actions@naijafind.com" -f ~/.ssh/github_actions_naijafind
```

Copiez la clé publique sur le VPS :

```bash
ssh-copy-id -i ~/.ssh/github_actions_naijafind.pub user@votre-vps-hostinger.com
```

Ou ajoutez manuellement la clé publique au fichier `~/.ssh/authorized_keys` sur le VPS.

### 3. Configuration des Secrets GitHub

Allez dans **Settings > Secrets and variables > Actions** de votre repository GitHub et ajoutez :

| Secret | Description | Exemple |
|--------|-------------|---------|
| `VPS_HOST` | Adresse IP ou nom de domaine du VPS | `123.45.67.89` ou `votre-domaine.com` |
| `VPS_USER` | Nom d'utilisateur SSH | `root` ou `ubuntu` |
| `VPS_SSH_PRIVATE_KEY` | Clé SSH privée complète | Contenu de `~/.ssh/github_actions_naijafind` |
| `VPS_SSH_PORT` | Port SSH (optionnel, défaut: 22) | `22` ou `2222` |
| `VPS_DEPLOY_PATH` | Chemin de déploiement (optionnel) | `/var/www/naijafind` |
| `APP_PORT` | Port externe du conteneur (optionnel, défaut: 3333) | `3333` |
| `VITE_CONVEX_URL` | URL de l'API Convex | `https://your-app.convex.cloud` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clé publique Clerk | `pk_test_...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe | `pk_test_...` |
| `VITE_GOOGLE_MAPS_API_KEY` | Clé API Google Maps | `AIza...` |
| `VITE_MAPBOX_TOKEN` | Token Mapbox | `pk.eyJ...` |
| `VITE_SUPABASE_URL` | URL Supabase | `https://...supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase | `eyJ...` |
| `VITE_FIREBASE_API_KEY` | Clé API Firebase | `AIza...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domaine Firebase Auth | `your-app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ID projet Firebase | `your-app` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket Firebase | `your-app.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID Firebase | `123456789` |
| `VITE_FIREBASE_APP_ID` | App ID Firebase | `1:123456789:web:...` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Nom du cloud Cloudinary | `your-cloud` |

### 4. Configuration Nginx (Reverse Proxy)

> **Alternative si le port 80 est occupé** : Vous pouvez skipper cette section et accéder directement à l'application via `http://votre-ip:3333`. Le conteneur Docker expose déjà le port 3333.

Si vous souhaitez utiliser Nginx comme reverse proxy (nécessite le port 80 libre) :

Créez la configuration Nginx pour rediriger vers le conteneur Docker :

```bash
sudo nano /etc/nginx/sites-available/naijafind
```

Contenu :

```nginx
server {
    listen 80;
    server_name naijafind.com www.naijafind.com;

    location / {
        proxy_pass http://localhost:3333;  # Port du conteneur Docker
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activez la configuration :

```bash
sudo ln -sf /etc/nginx/sites-available/naijafind /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

**Si le port 80 est occupé par Apache ou autre** et que vous ne pouvez pas l'arrêter :
- N'utilisez pas Nginx
- Accédez directement à l'application via `http://votre-ip:3333`
- Ou configurez Apache pour faire un proxy vers le port 3333

### 5. Configuration SSL (HTTPS) - Optionnel

> **Note** : Si vous n'utilisez pas Nginx, vous pouvez configurer SSL directement dans Apache (s'il est déjà installé) ou utiliser un reverse proxy externe (Cloudflare, etc.)

Avec Nginx :
```bash
sudo certbot --nginx -d naijafind.com -d www.naijafind.com
sudo systemctl enable certbot.timer
```

## Fichiers de Configuration Docker

### Dockerfile

Le `Dockerfile` crée une image multi-stage :
- Étape 1 : Build de l'application React avec Node.js
- Étape 2 : Serveur Nginx pour servir les fichiers statiques

### docker-compose.yml

Le fichier `docker-compose.yml` définit :
- Le service `naijafind` avec l'image buildée
- Le mapping du port (3000:80 par défaut)
- Le healthcheck du conteneur
- Le restart policy

### nginx-docker.conf

Configuration Nginx interne au conteneur pour servir l'application React (SPA avec support du routing).

## Déploiement

### Déclenchement Automatique

Le déploiement se déclenche automatiquement :
- Sur chaque push sur la branche `main` ou `master`
- Sur chaque merge de Pull Request vers `main` ou `master`
- Manuellement via **Actions > Deploy to Hostinger VPS (Docker) > Run workflow**

### Processus de Déploiement

1. **GitHub Actions** build l'image Docker avec les variables d'environnement
2. L'image est compressée et transférée via SCP sur le VPS
3. L'image est chargée dans Docker sur le VPS
4. Le conteneur est redémarré avec `docker compose up -d`
5. Les anciennes images sont nettoyées

## Vérification du Déploiement

```bash
# Sur le VPS

# Vérifier le statut du conteneur
docker ps

# Voir les logs du conteneur
docker logs naijafind-app

# Voir les logs en temps réel
docker logs -f naijafind-app

# Vérifier le statut Docker Compose
cd /var/www/naijafind
docker compose ps

# Voir les logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Dépannage

### Conteneur ne démarre pas

```bash
# Vérifier les logs
docker logs naijafind-app

# Vérifier la configuration
cd /var/www/naijafind
docker compose config

# Redémarrer manuellement
docker compose down
docker compose up -d
```

### Problème de port déjà utilisé

```bash
# Vérifier ce qui utilise le port
sudo lsof -i :3000

# Changer le port dans docker-compose.yml
# ou arrêter le processus qui utilise le port
```

### Nettoyer les images Docker inutilisées

```bash
# Supprimer les images dangling
docker image prune -f

# Supprimer les images non utilisées
docker system prune -a -f

# Voir l'espace utilisé par Docker
docker system df
```

### Rebuild manuel sur le VPS

```bash
cd /var/www/naijafind

# Arrêter le conteneur
docker compose down

# Supprimer l'image
docker rmi naijafind:latest

# Charger l'image
gunzip -c naijafind-image.tar.gz | docker load

# Redémarrer
docker compose up -d
```

## Commandes Utiles

```bash
# Docker
docker ps                       # Lister les conteneurs actifs
docker images                   # Lister les images
docker logs naijafind-app       # Logs du conteneur
docker exec -it naijafind-app sh # Shell dans le conteneur

# Docker Compose
cd /var/www/naijafind
docker compose up -d            # Démarrer
docker compose down             # Arrêter
docker compose ps               # Statut
docker compose logs             # Logs
docker compose pull             # Mettre à jour les images

# Nginx
sudo nginx -t                   # Tester la config
sudo systemctl reload nginx     # Recharger Nginx

# SSL
sudo certbot renew --dry-run    # Tester le renouvellement
sudo certbot certificates       # Voir les certificats
```

## Mises à Jour

Pour mettre à jour la configuration :

1. Modifiez les fichiers `Dockerfile`, `docker-compose.yml`, ou `nginx-docker.conf`
2. Commit et push sur `main`
3. Le workflow se déclenchera automatiquement

Pour mettre à jour uniquement les variables d'environnement :
1. Modifiez les secrets dans GitHub Settings
2. Relancez manuellement le workflow depuis l'onglet Actions

## Support

En cas de problème :
1. Vérifiez les logs GitHub Actions (onglet **Actions**)
2. Vérifiez les logs Docker sur le VPS : `docker logs naijafind-app`
3. Vérifiez les logs Nginx : `sudo tail -f /var/log/nginx/error.log`
4. Vérifiez que Docker est installé et fonctionne : `docker ps`

