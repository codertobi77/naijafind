# CI/CD Deployment Guide - Hostinger VPS

Ce guide explique comment configurer le déploiement automatique de NaijaFind sur un VPS Hostinger via GitHub Actions.

## Configuration Requise

### 1. Prérequis sur le VPS Hostinger

Connectez-vous à votre VPS et exécutez :

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installation de PM2 globalement
sudo npm install -g pm2

# Installation de serve pour servir les fichiers statiques
sudo npm install -g serve

# Installation de Nginx
sudo apt install -y nginx

# Installation de Certbot pour SSL
sudo apt install -y certbot python3-certbot-nginx

# Création du répertoire de déploiement
sudo mkdir -p /var/www/naijafind
sudo chown $USER:$USER /var/www/naijafind

# Création du répertoire de logs
mkdir -p /var/www/naijafind/logs
```

### 2. Configuration SSH pour GitHub Actions

Générez une clé SSH sur votre machine locale (si vous n'en avez pas déjà une) :

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

### 4. Configuration Nginx

Copiez la configuration Nginx sur le VPS :

```bash
# Copier la configuration
sudo cp /var/www/naijafind/nginx.conf /etc/nginx/sites-available/naijafind

# Créer le lien symbolique
sudo ln -sf /etc/nginx/sites-available/naijafind /etc/nginx/sites-enabled/

# Supprimer la configuration par défaut si nécessaire
sudo rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 5. Configuration SSL (HTTPS)

Obtenez un certificat SSL gratuit avec Certbot :

```bash
# Installer le certificat
sudo certbot --nginx -d naijafind.com -d www.naijafind.com

# Renouvellement automatique
sudo systemctl enable certbot.timer
```

### 6. Configuration PM2

PM2 est utilisé pour gérer l'application Node.js :

```bash
cd /var/www/naijafind

# Démarrer l'application avec PM2
pm2 start ecosystem.config.cjs --env production

# Sauvegarder la configuration PM2
pm2 save

# Configurer le démarrage automatique
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

## Déploiement

### Déclenchement Automatique

Le déploiement se déclenche automatiquement :
- Sur chaque push sur la branche `main` ou `master`
- Sur chaque merge de Pull Request vers `main` ou `master`

### Déploiement Manuel

Vous pouvez aussi déclencher manuellement depuis l'onglet **Actions** de GitHub.

## Vérification du Déploiement

```bash
# Vérifier le statut de l'application
pm2 status

# Voir les logs
pm2 logs naijafind

# Voir les logs Nginx
sudo tail -f /var/log/nginx/naijafind-access.log
sudo tail -f /var/log/nginx/naijafind-error.log
```

## Dépannage

### Problème de permissions

```bash
# Corriger les permissions
sudo chown -R $USER:$USER /var/www/naijafind
sudo chmod -R 755 /var/www/naijafind
```

### Redémarrage manuel

```bash
# Redémarrer l'application
pm2 restart naijafind

# Ou recharger la configuration
pm2 reload ecosystem.config.cjs --env production
```

### Problèmes de build

Si le build échoue, vérifiez les logs GitHub Actions et assurez-vous que tous les secrets sont correctement configurés.

## Architecture du Déploiement

```
┌─────────────────┐
│   GitHub Repo   │
│  (Code source)  │
└────────┬────────┘
         │ Push/Merge
         ▼
┌─────────────────┐
│  GitHub Actions │
│  (Build + Test) │
└────────┬────────┘
         │ SSH/RSYNC
         ▼
┌─────────────────┐
│  Hostinger VPS  │
│  ┌───────────┐  │
│  │   Nginx   │  │  ← Reverse Proxy + SSL
│  │  (80/443) │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │    PM2    │  │  ← Process Manager
│  │  (Port    │  │
│  │   3000)   │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │   dist/   │  │  ← Fichiers statiques
│  │  (React   │  │
│  │   App)    │  │
│  └───────────┘  │
└─────────────────┘
```

## Commandes Utiles

```bash
# Sur le VPS
pm2 status                    # Statut des processus
pm2 logs naijafind            # Logs de l'application
pm2 monit                     # Monitoring en temps réel
pm2 reload all               # Recharger toutes les apps

# Nginx
sudo nginx -t                # Tester la configuration
sudo systemctl status nginx  # Statut de Nginx
sudo systemctl reload nginx  # Recharger Nginx

# SSL
sudo certbot renew --dry-run # Tester le renouvellement
sudo certbot certificates    # Lister les certificats
```

## Mises à Jour

Pour mettre à jour le workflow ou la configuration :

1. Modifiez les fichiers dans `.github/workflows/`, `ecosystem.config.cjs`, ou `nginx.conf`
2. Commit et push sur `main`
3. Le workflow se déclenchera automatiquement

## Support

En cas de problème :
1. Vérifiez les logs GitHub Actions (onglet **Actions**)
2. Vérifiez les logs PM2 sur le VPS : `pm2 logs naijafind`
3. Vérifiez les logs Nginx : `sudo tail -f /var/log/nginx/error.log`
