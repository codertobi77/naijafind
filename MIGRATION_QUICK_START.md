# 🚀 Migration des Produits - Guide Rapide

## Commandes principales

### 1️⃣ Tester sans modifier (Dry Run)

```bash
npm run migrate:complete:dry
```

### 2️⃣ Lancer la migration complète

```bash
# Production
npm run migrate:complete
```

### 3️⃣ Suivre la progression

```bash
npx convex run --component migrations lib:getStatus --watch --prod
```

## Migrations disponibles

| Migration | Commande | Description |
|-----------|----------|-------------|
| **Complète** | `npm run migrate:complete` | isSearchable + originalLanguage + keywords ✅ |
| isSearchable | `npm run migrate:issearchable` | Rend les produits recherchables |
| Language | `npm run migrate:language` | Détecte la langue (fr/en) |
| Keywords | `npm run migrate:keywords` | Génère des mots-clés SEO |

## Avantages vs Ancienne Méthode

| Aspect | Ancien Script | Nouveau Composant Migrations |
|--------|--------------|------------------------------|
| Limite documents | ~8 192 max | Illimité ✅ |
| Reprise après erreur | ❌ Non | ✅ Oui |
| Suivi temps réel | ❌ Non | ✅ Oui |
| Zero downtime | ❌ Risqué | ✅ Garanti |
| Dry run | ❌ Non | ✅ Oui |

## Workflow Recommandé

```bash
# 1. Tester d'abord avec dry run
npm run migrate:complete:dry

# 2. Vérifier le résultat
# Confirmer que le nombre de produits à migrer est correct

# 3. Lancer en production
npm run migrate:complete

# 4. Suivre la progression
npx convex run --component migrations lib:getStatus --watch --prod

# 5. Vérifier que c'est terminé
npm run migrate:complete:dry
# Devrait afficher 0 produit à migrer
```

## Plus d'infos

📖 Voir le guide complet : [MIGRATION_PRODUITS_GUIDE.md](./MIGRATION_PRODUITS_GUIDE.md)

---

**Note** : Cette nouvelle méthode utilise le composant officiel Convex Migrations, beaucoup plus robuste que les anciens scripts manuels.
