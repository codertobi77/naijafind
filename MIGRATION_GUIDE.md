# Migration de données Convex - Guide complet

Ce guide explique comment migrer les données de l'environnement de développement (dev) vers la production (prod) sur Convex.

## 📁 Fichiers créés

- `scripts/migrate-convex-data.js` - Script Node.js pour exporter/importer les données
- `convex/migration.ts` - Mutations Convex pour l'import/export
- `MIGRATION_GUIDE.md` - Ce fichier (documentation)

## 🚀 Processus de migration rapide

### Étape 1 : Prérequis

```bash
# Installer le CLI Convex globalement
npm install -g convex

# Se connecter à Convex
npx convex login
```

### Étape 2 : Obtenir l'ID du projet

```bash
# Lister les projets
npx convex projects list

# Ou trouver dans convex.json ou .env
```

### Étape 3 : Exporter depuis l'environnement de dev

```bash
# Méthode 1 : Utiliser le script de migration
node scripts/migrate-convex-data.js export --project <PROJECT_ID> --env dev --output ./migration-data

# Méthode 2 : Exporter table par table (manuellement)
npx convex data export users --project <PROJECT_ID> --env dev > users.json
npx convex data export suppliers --project <PROJECT_ID> --env dev > suppliers.json
# ... etc pour chaque table
```

### Étape 4 : Vérifier les données exportées

```bash
# Vérifier la structure
ls -la ./migration-data/

# Vérifier le contenu
cat ./migration-data/metadata.json
```

### Étape 5 : Préparer la production

```bash
# Déployer le schema et les fonctions en prod
npx convex deploy

# Vérifier les variables d'environnement
npx convex env list --project <PROJECT_ID> --env prod

# Définir les variables nécessaires (si pas déjà fait)
npx convex env set CLERK_ISSUER_URL "https://<votre-instance>.clerk.accounts.dev" --project <PROJECT_ID> --env prod
```

### Étape 6 : Importer en production

```bash
# ⚠️ ATTENTION : Cela va insérer les données en production
node scripts/migrate-convex-data.js import --project <PROJECT_ID> --env prod --input ./migration-data
```

### Étape 7 : Vérifier l'import

```bash
# Vérifier les statistiques des tables
npx convex run migration:getTableStats --project <PROJECT_ID> --env prod --data '{"table": "users"}'
npx convex run migration:getTableStats --project <PROJECT_ID> --env prod --data '{"table": "suppliers"}'
```

## 📊 Tables migrées (ordre de dépendance)

Les données sont migrées dans cet ordre pour respecter les dépendances :

1. **users** - Utilisateurs (aucune dépendance)
2. **categories** - Catégories (aucune dépendance)
3. **suppliers** - Fournisseurs (dépend de users)
4. **products** - Produits (dépend de suppliers)
5. **reviews** - Avis (dépend de suppliers, users)
6. **contacts** - Contacts (aucune dépendance)
7. **messages** - Messages (dépend de suppliers)
8. **verification_tokens** - Tokens de vérification (dépend de users)
9. **password_reset_tokens** - Tokens de réinitialisation (dépend de users)
10. **verification_documents** - Documents de vérification (dépend de suppliers)
11. **rate_limit_attempts** - Tentatives de rate limiting (aucune dépendance)
12. **newsletter_subscriptions** - Abonnements newsletter (aucune dépendance)
13. **notifications** - Notifications (dépend de users)

## ⚠️ Points importants

### IDs et relations
- Les `_id` générés par Convex seront **différents** entre dev et prod
- Les relations par `userId`, `supplierId`, etc. sont préservées car ce sont des chaînes
- Les documents sont insérés comme nouveaux enregistrements

### Données non migrées
- **Fichiers/Images** : Les URLs Cloudinary sont migrées, mais les fichiers eux-mêmes restent sur Cloudinary
- **Cache** : Le cache applicatif doit être reconstruit
- **Sessions** : Les sessions utilisateur doivent être recréées

### Sécurité
- Le script vérifie que seules les tables valides peuvent être importées
- Les mutations de migration ne sont accessibles que via le CLI (pas exposées au frontend)
- Les `_id` et `_creationTime` sont supprimés avant insertion pour éviter les conflits

## 🔧 Commandes utilitaires

### Vider une table (⚠️ DANGEREUX)

```bash
# Vider une table spécifique
npx convex run migration:clearTable --project <PROJECT_ID> --env prod --data '{"table": "contacts", "confirm": true}'
```

### Statistiques d'une table

```bash
npx convex run migration:getTableStats --project <PROJECT_ID> --env prod --data '{"table": "suppliers"}'
```

### Import manuel d'une table

```bash
# Via la mutation bulkImport directement
npx convex run migration:bulkImport --project <PROJECT_ID> --env prod --data '{"table": "categories", "data": [{"name": "Test", "created_at": "2024-01-01"}]}'
```

## 🐛 Dépannage

### Erreur "Project not found"
```bash
# Vérifier le project ID
npx convex projects list

# Ou utiliser le flag --project explicitement
node scripts/migrate-convex-data.js export --project your-project-id --env dev
```

### Erreur "Not authenticated"
```bash
# Se reconnecter
npx convex login

# Vérifier le token
npx convex whoami
```

### Erreur "Table does not exist"
- S'assurer que le schema a été déployé : `npx convex deploy`
- Vérifier que la table existe dans `convex/schema.ts`

### Données partiellement importées
- Le script importe par chunks de 50 enregistrements
- En cas d'erreur, vérifier les logs pour identifier le problème
- Vider la table et recommencer si nécessaire

### Problèmes de dépendances
- Si une table dépendante manque, l'import échouera
- S'assurer d'avoir exporté/importé les tables parents d'abord
- L'ordre dans TABLES est important

## 📝 Checklist pré-migration

- [ ] Backup des données de production (si existantes)
- [ ] Déployer le dernier schema en production
- [ ] Vérifier les variables d'environnement en prod
- [ ] Tester l'export depuis dev
- [ ] Vérifier l'intégrité des données exportées
- [ ] Prévoir une fenêtre de maintenance (si applicable)

## 📝 Checklist post-migration

- [ ] Vérifier le nombre d'enregistrements par table
- [ ] Tester la connexion utilisateur
- [ ] Vérifier l'affichage des fournisseurs
- [ ] Tester les fonctionnalités critiques
- [ ] Vérifier les images/logos
- [ ] Tester les recherches

## 💡 Alternative : Migration sélective

Si vous ne voulez migrer que certaines tables :

```bash
# Exporter seulement les tables nécessaires
npx convex data export categories --project <PROJECT_ID> --env dev > categories.json
npx convex data export users --project <PROJECT_ID> --env dev > users.json

# Importer manuellement via la mutation
npx convex run migration:bulkImport --project <PROJECT_ID> --env prod --data '{"table": "categories", "data": <contenu du JSON>}'
```

## 📞 Support

En cas de problème :
1. Vérifier les logs Convex Dashboard
2. Consulter la documentation : https://docs.convex.dev
3. Vérifier les issues connues sur GitHub

---

**⚠️ Attention** : La migration de données est une opération sensible. Testez toujours sur un environnement de staging si possible avant de toucher à la production.
