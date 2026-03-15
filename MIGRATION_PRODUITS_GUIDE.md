# Migration des Produits avec Convex Migrations Component

Ce guide explique comment migrer les produits en utilisant le composant **Migrations** de Convex, qui offre une approche robuste et fiable pour les migrations de données en production.

## Pourquoi utiliser le composant Migrations ?

Contrairement aux scripts manuels ou au dashboard, le composant Migrations offre :

- ✅ **Traitement par batches paginés** - Pas de limite de transaction unique
- ✅ **Reprise automatique** - Reprend là où il s'est arrêté en cas d'erreur
- ✅ **Suivi en temps réel** - Statut de la migration visible dans le dashboard
- ✅ **Zero downtime** - Fonctionne pendant que l'application est en production
- ✅ **Dry run** - Tester sans modifier les données
- ✅ **Idempotent** - Peut être exécuté plusieurs fois en toute sécurité

## Architecture des migrations

### Fichiers créés

1. **`convex/migrations.ts`** - Définition des migrations
2. **`convex/migrationActions.ts`** - Actions pour exécuter les migrations via CLI
3. **`convex/convex.config.ts`** - Configuration du composant Migrations (déjà fait)

### Migrations disponibles

| Migration | Champ ajouté | Description |
|-----------|-------------|-------------|
| `completeProductMigration` | Tous | isSearchable + originalLanguage + keywords (recommandé) |
| `setDefaultIsSearchable` | isSearchable | Rend les produits recherchables |
| `setOriginalLanguage` | originalLanguage | Détecte la langue (fr/en) |
| `setKeywords` | keywords | Génère des mots-clés SEO |

## Étapes de migration

### 1. Vérifier le schéma

Le schéma doit avoir les champs en optionnel pour permettre la coexistence ancien/nouveau format :

```ts
// convex/schema.ts
products: defineTable({
  // ... autres champs
  isSearchable: v.optional(v.boolean()),
  originalLanguage: v.optional(v.string()),
  keywords: v.optional(v.array(v.string())),
}),
```

✅ **Déjà configuré** - Le schéma actuel est correct.

### 2. Déployer les migrations

```bash
# Déployer en développement
npx convex dev

# OU pour la production directement
npx convex deploy
```

### 3. Tester avec un Dry Run

Toujours tester d'abord avec `dryRun: true` pour voir ce qui serait modifié :

```bash
# Migration complète (recommandé)
npx convex run migrationActions:runCompleteMigration '{dryRun: true}'

# Ou migrations individuelles
npx convex run migrationActions:runIsSearchableMigration '{dryRun: true}'
npx convex run migrationActions:runLanguageMigration '{dryRun: true}'
npx convex run migrationActions:runKeywordsMigration '{dryRun: true}'
```

### 4. Lancer la migration

Après validation du dry run, lancer la migration réelle :

```bash
# Migration complète (RECOMMANDÉ - plus efficace)
npx convex run migrationActions:runCompleteMigration

# Pour la production
npx convex run migrationActions:runCompleteMigration --prod

# Avec suivi en temps réel (--watch)
npx convex run migrationActions:runCompleteMigration --prod --watch
```

### 5. Suivre la progression

Le composant Migrations suit automatiquement la progression. Pour voir le statut :

```bash
# Via CLI avec suivi en temps réel
npx convex run --component migrations lib:getStatus --watch

# Ou via le dashboard Convex
# Allez dans "Functions" > "migrations" > "getStatus"
```

### 6. Finaliser le schéma (optionnel)

Une fois la migration terminée et tous les documents migrés, vous pouvez rendre les champs obligatoires :

```ts
// convex/schema.ts
products: defineTable({
  // ... autres champs
  isSearchable: v.boolean(), // Plus optionnel
  originalLanguage: v.string(), // Plus optionnel
  keywords: v.array(v.string()), // Plus optionnel
}),
```

⚠️ **Important** : Convex refusera le déploiement si des documents ne correspondent pas au nouveau schéma.

## Commandes CLI

### Migration complète (Recommandé)

```bash
# Dry run (test sans modification)
npx convex run migrationActions:runCompleteMigration '{dryRun: true}'

# Migration réelle (développement)
npx convex run migrationActions:runCompleteMigration

# Migration réelle (production)
npx convex run migrationActions:runCompleteMigration --prod

# Reprendre une migration interrompue
npx convex run migrationActions:runCompleteMigration '{cursor: "votre-cursor"}'
```

### Migrations individuelles

```bash
# isSearchable uniquement
npx convex run migrationActions:runIsSearchableMigration '{dryRun: true}'
npx convex run migrationActions:runIsSearchableMigration --prod

# originalLanguage uniquement
npx convex run migrationActions:runLanguageMigration '{dryRun: true}'
npx convex run migrationActions:runLanguageMigration --prod

# keywords uniquement
npx convex run migrationActions:runKeywordsMigration '{dryRun: true}'
npx convex run migrationActions:runKeywordsMigration --prod
```

### Gestion des erreurs

```bash
# Arrêter une migration en cours
npx convex run --component migrations lib:cancel '{name: "migrations:completeProductMigration"}' --prod

# Redémarrer depuis le début
npx convex run migrationActions:runCompleteMigration '{cursor: null}' --prod

# Voir les logs d'erreur
npx convex run --component migrations lib:getStatus --watch
```

## Comparaison avec les anciennes méthodes

### Ancienne méthode (scripts manuels)

```bash
# Script manuel - Moins robuste
npm run migrate:products
```

❌ **Problèmes** :
- Transaction unique limitée à ~8192 documents
- Pas de reprise automatique
- Pas de suivi en temps réel
- Risque de timeout

### Nouvelle méthode (Composant Migrations)

```bash
# Composant Migrations - Robuste
npx convex run migrationActions:runCompleteMigration --prod
```

✅ **Avantages** :
- Batches paginés illimités
- Reprise automatique après erreur
- Suivi en temps réel dans le dashboard
- Zero downtime
- Dry run disponible

## Exemple de workflow complet

```bash
# 1. Déployer les changements
npx convex dev

# 2. Tester avec dry run
npx convex run migrationActions:runCompleteMigration '{dryRun: true}'

# 3. Vérifier le résultat du dry run
# Confirmer que le nombre de produits à migrer est correct

# 4. Lancer la migration en production
npx convex run migrationActions:runCompleteMigration --prod

# 5. Suivre la progression dans un autre terminal
npx convex run --component migrations lib:getStatus --watch

# 6. Une fois terminé, vérifier que tout est bon
npx convex run migrationActions:runCompleteMigration '{dryRun: true}'
# Devrait afficher 0 produit à migrer

# 7. Optionnel : Mettre à jour le schéma pour rendre les champs obligatoires
# Modifier convex/schema.ts
npx convex deploy
```

## Monitoring et débogage

### Voir le statut en temps réel

```bash
npx convex run --component migrations lib:getStatus --watch
```

### Logs détaillés

Consultez les logs dans le dashboard Convex :
1. Allez dans "Functions"
2. Cherchez "migrationActions:runCompleteMigration"
3. Cliquez sur "View logs"

### Annuler une migration

```bash
npx convex run --component migrations lib:cancel '{name: "migrations:completeProductMigration"}'
```

## FAQ

### Q: Combien de temps prend la migration ?
R: Cela dépend du nombre de produits. Pour ~7 000 produits, comptez 5-15 minutes selon la complexité.

### Q: Puis-je utiliser l'application pendant la migration ?
R: Oui ! C'est une migration zero-downtime. L'application reste fonctionnelle.

### Q: Que se passe-t-il en cas d'erreur ?
R: La migration s'arrête et peut être reprise exactement là où elle s'est arrêtée avec le curseur.

### Q: Comment savoir si la migration est terminée ?
R: Le statut affiche "completed" et un nouveau dry run montre 0 produit à migrer.

### Q: Puis-je migrer en développement d'abord ?
R: Oui, c'est recommandé ! Testez toujours en dev avant la production.

## Support

Pour plus d'informations sur le composant Migrations :
- [Documentation officielle](https://www.convex.dev/components/migrations)
- [Exemples de code](https://github.com/get-convex/migrations)
- [Guide des migrations zero-downtime](https://stack.convex.dev/zero-downtime-migrations)

---

**Note** : Ce guide remplace les anciens scripts de migration (`scripts/migrate-products.js`). Il est recommandé d'utiliser le composant Migrations pour toutes les futures migrations de données.
