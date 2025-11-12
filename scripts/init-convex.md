# Script d'Initialisation Convex

Ce script permet d'initialiser votre base de données Convex avec les catégories de base **sans nécessiter d'authentification**.

## Utilisation

### Option 1: Via une requête HTTP (Recommandé - Sans authentification)

Une fois votre projet Convex déployé, vous pouvez appeler l'endpoint HTTP :

**GET ou POST** vers : `https://votre-projet.convex.site/init`

**Depuis le navigateur :**
```javascript
fetch('https://votre-projet.convex.site/init')
  .then(res => res.json())
  .then(data => console.log(data));
```

**Via curl :**
```bash
curl https://votre-projet.convex.site/init
```

**Via le Dashboard Convex :**
1. Allez sur https://dashboard.convex.dev
2. Sélectionnez votre projet
3. Allez dans "HTTP Routes"
4. Testez la route `/init`

### Option 2: Via le CLI Convex

```bash
npx convex run init:initCategories
```

### Option 3: Via le Dashboard Convex (Functions)

1. Allez sur https://dashboard.convex.dev
2. Sélectionnez votre projet
3. Ouvrez la console de fonctions (Functions tab)
4. Trouvez la fonction `initCategories` dans `convex/init.ts`
5. Cliquez sur "Run" ou "Execute"

### Option 4: Via la page admin

La page admin (`/admin`) contient un bouton "🔄 Initialiser les catégories" qui appelle directement la mutation.

## Catégories initialisées

Le script crée les catégories suivantes :

1. **Agriculture** - Produits agricoles, équipements, semences et services
2. **Textile** - Tissus, vêtements, accessoires de mode
3. **Électronique** - Appareils électroniques, composants, accessoires
4. **Alimentation** - Produits alimentaires, boissons, épices
5. **Construction** - Matériaux de construction, outils, équipements
6. **Automobile** - Véhicules, pièces détachées, accessoires auto
7. **Santé & Beauté** - Produits de santé, cosmétiques, bien-être
8. **Éducation** - Livres, fournitures scolaires, équipements éducatifs
9. **Services** - Services professionnels, consulting, maintenance

## Prérequis

- La table `categories` doit exister dans votre schéma Convex
- Votre projet Convex doit être déployé (pour utiliser la route HTTP)

## Sécurité

- ⚠️ **Note importante** : Cette fonction ne requiert PAS d'authentification, ce qui permet l'initialisation de la base de données avant la création d'utilisateurs admin.
- Les catégories existantes sont automatiquement ignorées (pas de duplication)
- Une fois l'initialisation terminée, vous pouvez restreindre l'accès à cette route si nécessaire

