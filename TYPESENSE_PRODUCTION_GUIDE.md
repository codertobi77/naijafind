# Typesense Configuration Guide

## Configuration Typesense en Production

### 1. Options d'hébergement Typesense

#### Option A: Typesense Cloud (Recommandé)
```
URL: https://cloud.typesense.org
- Créez un compte
- Créez un cluster (choisissez la région la plus proche de vos utilisateurs)
- Récupérez les credentials (Host, Port, API Key)
```

#### Option B: Auto-hébergé (Docker sur VPS)
```bash
# Sur votre serveur production
docker run -p 8108:8108 \
  -v /var/typesense-data:/data \
  typesense/typesense:0.25.1 \
  --data-dir /data \
  --api-key VOTRE_CLE_SECRETE \
  --enable-cors
```

### 2. Variables d'environnement

Créez un fichier `.env.production` à la racine du projet :

```env
# Typesense Configuration
VITE_TYPESENSE_HOST=xxx.a1.typesense.net
VITE_TYPESENSE_PORT=443
VITE_TYPESENSE_PROTOCOL=https
VITE_TYPESENSE_API_KEY=VOTRE_CLE_API_SECRETE

# Pour le serveur Node.js (indexation)
TYPESENSE_HOST=xxx.a1.typesense.net
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=VOTRE_CLE_API_SECRETE
```

### 3. Configuration Vercel/Netlify (Frontend)

Dans votre dashboard Vercel/Netlify, ajoutez les variables d'environnement :

```
VITE_TYPESENSE_HOST = xxx.a1.typesense.net
VITE_TYPESENSE_PORT = 443
VITE_TYPESENSE_PROTOCOL = https
VITE_TYPESENSE_API_KEY = VOTRE_CLE_API_SECRETE
```

### 4. Mise à jour de la configuration

Modifiez `src/lib/typesense/config.ts` pour la production :

```typescript
const TYPESENSE_CONFIG = {
  apiKey: import.meta.env.VITE_TYPESENSE_API_KEY || '',
  nodes: [
    {
      host: import.meta.env.VITE_TYPESENSE_HOST || 'localhost',
      port: parseInt(import.meta.env.VITE_TYPESENSE_PORT || '8108'),
      protocol: import.meta.env.VITE_TYPESENSE_PROTOCOL || 'http',
    },
  ],
  connectionTimeoutSeconds: 5,
  retryIntervalSeconds: 1,
  numRetries: 3,
};
```

### 5. Indexation initiale en production

```bash
# 1. Déployez d'abord vos fonctions Convex
npx convex deploy

# 2. Configurez les variables d'environnement locales
export TYPESENSE_HOST=xxx.a1.typesense.net
export TYPESENSE_PORT=443
export TYPESENSE_PROTOCOL=https
export TYPESENSE_API_KEY=VOTRE_CLE_API_SECRETE

# 3. Exécutez le script d'initialisation
npm run typesense:init
```

### 6. Synchronisation automatique

Dans `convex/typesenseSync.ts`, les actions sont prêtes. Pour activer la sync automatique lors des mutations, ajoutez dans vos mutations products/suppliers :

```typescript
// Dans convex/products.ts
export const createProduct = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    // ... création du produit
    
    // Sync vers Typesense
    await ctx.runAction(internal.typesenseSync.syncProductToTypesense, {
      productId: id
    });
    
    return { success: true, id };
  }
});
```

### 7. Sécurité - Restrictions d'accès

Dans Typesense Cloud, configurez les **Search-only API Keys** pour le frontend :

```bash
# Créez une clé search-only (pas d'écriture)
curl -X POST \
  "https://xxx.a1.typesense.net/keys" \
  -H "X-TYPESENSE-API-KEY: VOTRE_CLE_ADMIN" \
  -d '{
    "description": "Search-only key for production",
    "actions": ["documents:search"],
    "collections": ["products", "suppliers"]
  }'
```

Utilisez cette clé search-only dans `VITE_TYPESENSE_API_KEY` pour le frontend.

Gardez la clé admin pour les scripts d'indexation côté serveur uniquement.

### 8. Monitoring

Typesense Cloud inclut un dashboard de monitoring. Pour l'auto-hébergé :

```bash
# Health check
curl -s "http://localhost:8108/health" | jq

# Stats
curl -s "http://localhost:8108/stats.json" \
  -H "X-TYPESENSE-API-KEY: VOTRE_CLE"
```

### 9. Backup des données Typesense

```bash
# Export des collections
for collection in products suppliers; do
  curl -s "https://xxx.a1.typesense.net/collections/${collection}/documents/export" \
    -H "X-TYPESENSE-API-KEY: VOTRE_CLE" > "backup-${collection}.jsonl"
done
```

### 10. Checklist production

- [ ] Typesense Cloud cluster créé
- [ ] Clé search-only créée pour le frontend
- [ ] Variables d'environnement configurées (Vercel/Netlify)
- [ ] Collections créées (products, suppliers)
- [ ] Données indexées depuis Convex
- [ ] Tests de recherche fonctionnels
- [ ] Monitoring activé

## Coûts Typesense Cloud

- **Sandbox** (2GB RAM, 2vCPU) : ~$29/mois
- **Small** (4GB RAM, 2vCPU) : ~$59/mois
- **Medium** (8GB RAM, 4vCPU) : ~$119/mois

Pour 7753 produits, le plan **Sandbox** suffit largement.
