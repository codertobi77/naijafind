# Guide d'Import Bulk des Fournisseurs

Ce guide explique comment importer en masse des fournisseurs avec leurs utilisateurs associés depuis le dashboard admin.

## 📁 Fichiers créés

1. **`scripts/suppliers_import_template.csv`** - Template CSV avec tous les champs
2. **`convex/adminImport.ts`** - Mutations Convex pour l'import bulk

## 📋 Champs du CSV

### Champs Utilisateur (obligatoires marqués avec O)

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `user_email` | string | **OUI** | Email de l'utilisateur (unique) |
| `user_firstName` | string | Non | Prénom de l'utilisateur |
| `user_lastName` | string | Non | Nom de l'utilisateur |
| `user_phone` | string | Non | Téléphone de l'utilisateur |

### Champs Fournisseur (obligatoires marqués avec O)

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `supplier_business_name` | string | **OUI** | Nom de l'entreprise |
| `supplier_email` | string | **OUI** | Email de contact du fournisseur |
| `supplier_phone` | string | Non | Téléphone du fournisseur |
| `supplier_category` | string | **OUI** | Catégorie d'activité |
| `supplier_description` | text | Non | Description de l'entreprise |
| `supplier_address` | string | Non | Adresse complète |
| `supplier_city` | string | **OUI** | Ville |
| `supplier_state` | string | **OUI** | État/Région |
| `supplier_country` | string | Non | Pays (défaut: Nigeria) |
| `supplier_website` | URL | Non | Site web |
| `supplier_business_type` | string | Non | `products` ou `services` |
| `supplier_verified` | boolean | Non | Vérifié (true/false) |
| `supplier_approved` | boolean | Non | Approuvé (true/false) |
| `supplier_featured` | boolean | Non | Mis en avant (true/false) |
| `supplier_image` | URL | Non | URL de l'image principale |
| `supplier_imageGallery` | array | Non | URLs des images galerie |
| `supplier_business_hours` | JSON | Non | Horaires d'ouverture |
| `supplier_social_links` | JSON | Non | Liens réseaux sociaux |
| `supplier_latitude` | number | Non | Latitude GPS |
| `supplier_longitude` | number | Non | Longitude GPS |

## 🚀 Instructions d'utilisation

### 1. Préparer le fichier CSV

1. Ouvrir `scripts/suppliers_import_template.csv`
2. Supprimer les lignes d'exemple (lignes 17-20)
3. Remplir vos données selon le format
4. Sauvegarder en UTF-8

### 2. Format des valeurs spéciales

**Horaires d'ouverture (JSON):**
```json
{
  "monday": "08:00-18:00",
  "tuesday": "08:00-18:00",
  "wednesday": "08:00-18:00",
  "thursday": "08:00-18:00",
  "friday": "08:00-18:00",
  "saturday": "09:00-17:00",
  "sunday": "closed"
}
```

**Galerie d'images (array):**
```
["https://example.com/img1.jpg","https://example.com/img2.jpg"]
```

**Réseaux sociaux (JSON):**
```json
{
  "facebook": "https://facebook.com/ma-page",
  "instagram": "https://instagram.com/mon-compte",
  "linkedin": "https://linkedin.com/company/ma-societe",
  "twitter": "https://twitter.com/mon-compte"
}
```

### 3. Import depuis le Dashboard Admin

1. Se connecter au dashboard admin (`/admin`)
2. Naviguer vers l'onglet "Import Fournisseurs"
3. Cliquer sur "Choisir un fichier" et sélectionner votre CSV
4. Cliquer sur "Importer"
5. Vérifier le rapport d'import (succès/erreurs)

## 🔧 Déploiement

### Exécuter Convex

```bash
npx convex dev
```

Cela déploiera automatiquement les nouvelles mutations.

### Tester l'import

1. Utiliser le fichier `scripts/suppliers_import_template.csv`
2. Ajouter 1-2 lignes de test
3. Importer depuis le dashboard

## 📝 Notes importantes

- **User unique**: Si l'email existe déjà, l'utilisateur existant sera converti en `supplier`
- **Supplier unique**: Un utilisateur ne peut avoir qu'un seul profil fournisseur
- **Notifications**: Les fournisseurs créés reçoivent une notification automatique
- **Par défaut**:
  - `supplier_approved`: `true` (approuvé immédiatement)
  - `supplier_verified`: `false` (non vérifié)
  - `supplier_featured`: `false` (non mis en avant)
  - `supplier_business_type`: `products`

## 🐛 Dépannage

### Erreur "Un fournisseur existe déjà"
- L'utilisateur avec cet email a déjà un profil fournisseur
- Modifier l'email ou utiliser l'API de mise à jour

### Erreur de parsing JSON
- Vérifier que les valeurs JSON sont bien formatées
- Utiliser des guillemets doubles `"` pour les clés et valeurs
- Échapper les guillemets dans CSV: `""`

### Caractères spéciaux
- Toujours sauvegarder le CSV en UTF-8
- Éviter les caractères spéciaux dans les noms de fichiers

## 🔗 API Convex

### Import bulk
```typescript
const result = await ctx.runMutation(api.adminImport.bulkImportSuppliers, {
  suppliers: [/* array de SupplierImportData */]
});
```

### Import single
```typescript
const result = await ctx.runMutation(api.adminImport.importSingleSupplier, {
  user_email: "test@example.com",
  supplier_business_name: "Test Business",
  // ... autres champs
});
```

## 📞 Support

En cas de problème, vérifier:
1. Les logs de la console navigateur
2. Les logs Convex dans le terminal
3. Le format du CSV avec un validateur en ligne
