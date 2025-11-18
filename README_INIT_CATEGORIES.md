# Initialisation des Catégories dans NaijaFind

Ce script permet d'initialiser les catégories dans la base de données Convex de NaijaFind.

## Utilisation

### 1. Via npm (recommandé)

```bash
npm run init-categories
```

### 2. Directement avec Node.js

```bash
node scripts/init-categories.js
```

## Fonctionnalités

- Détection automatique de l'URL Convex depuis les fichiers `.env` ou la CLI Convex
- Initialisation avec des catégories par défaut ou personnalisées
- Gestion des erreurs et des catégories déjà existantes
- Interface interactive en ligne de commande

## Catégories par défaut

Si vous choisissez d'utiliser les catégories par défaut, les catégories suivantes seront créées :

1. Restaurants - Food and dining establishments
2. Hotels - Accommodation services
3. Transport - Transportation services
4. Shopping - Retail stores and shopping centers
5. Healthcare - Medical and healthcare providers
6. Education - Schools and educational institutions
7. Entertainment - Leisure and entertainment venues
8. Services - Professional services and contractors
9. Technology - IT and technology companies
10. Finance - Banks and financial institutions

## Personnalisation

Lors de l'exécution du script, vous pouvez choisir de fournir vos propres catégories au lieu d'utiliser les catégories par défaut.

Chaque catégorie peut avoir :
- Nom (requis)
- Description (optionnel)
- Icône (optionnel)
- Ordre (optionnel)

## Endpoint API

Le script utilise l'endpoint HTTP suivant de votre déploiement Convex :

```
POST /categories/init
```

## Dépannage

### Erreurs courantes

1. **"URL requise"** : L'URL Convex n'a pas pu être détectée automatiquement. Assurez-vous que votre projet est déployé et que l'URL est correcte.

2. **"Erreur HTTP"** : Vérifiez que votre projet Convex est déployé et accessible.

3. **"Réponse invalide"** : L'endpoint `/categories/init` peut ne pas exister. Assurez-vous que le code du backend est à jour.

### Vérification manuelle

Vous pouvez tester l'endpoint manuellement avec curl :

```bash
curl -X POST https://VOTRE-PROJET.convex.site/categories/init \
  -H "Content-Type: application/json" \
  -d '{"categories":[{"name":"Test","description":"Test category","icon":"🧪","order":1}]}'
```

Remplacez `VOTRE-PROJET` par le nom de votre projet Convex.