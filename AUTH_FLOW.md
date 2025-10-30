# Flow d'Authentification - NaijaFind

## Vue d'ensemble

NaijaFind utilise **Convex Auth** avec le provider **Password** pour gérer l'authentification. Le système supporte deux types d'utilisateurs : **Buyers** (Acheteurs/clients) et **Suppliers** (Fournisseurs). 

**Flow d'inscription** : Les utilisateurs choisissent d'abord leur rôle lors de l'inscription. Les fournisseurs remplissent leurs informations personnelles ET celles de leur entreprise (relation 1:1 entre User et Supplier).

---

## Architecture

### 1. Configuration Serveur (`convex/auth.ts`)

```typescript
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password()],
});
```

**Ce qui est exporté :**
- `signIn` : Action Convex pour se connecter/s'inscrire
- `signOut` : Action Convex pour se déconnecter
- `store` : Fonction pour gérer l'état de session
- `isAuthenticated` : Query pour vérifier si l'utilisateur est connecté

### 2. Configuration Schéma (`convex/schema.ts`)

Le schéma fusionne les tables Convex Auth avec nos tables personnalisées :

```typescript
export default defineSchema({
  // Table utilisateurs fusionnée
  users: defineTable({
    // Champs Convex Auth
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    // ... autres champs auth
    
    // Champs personnalisés
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    user_type: v.optional(v.string()), // 'user' | 'supplier'
    created_at: v.optional(v.string()),
  }),
  
  // Tables Convex Auth standard
  authSessions: authTables.authSessions,
  authAccounts: authTables.authAccounts,
  authRefreshTokens: authTables.authRefreshTokens,
  authVerificationCodes: authTables.authVerificationCodes,
  
  // Nos tables métier
  suppliers: defineTable({ 
    userId: v.string(), // Relation 1:1 avec users
    business_name: v.string(),
    // ... autres champs
  })
    .index("userId", ["userId"]), // Index pour garantir 1 supplier par user
  
  products: defineTable({ ... }),
  // ... etc
});
```

### 3. Configuration Client (`src/main.tsx`)

```typescript
<ConvexAuthProvider client={convex}>
  <App />
</ConvexAuthProvider>
```

Cela fournit le contexte d'authentification à toute l'application React.

---

## Flow d'Inscription (Sign Up)

### Scénario 1 : Inscription en tant que Buyer (Acheteur)

```
┌─────────────────────────────────────────────────┐
│ 1. Utilisateur clique "Créer un compte"         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. /auth/register (sans paramètre type)         │
│    - Formulaire 3 étapes                        │
│    - userType = 'buyer' par défaut              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Submit du formulaire                         │
│    - flow: 'signUp'                             │
│    - email, password                            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. Convex Auth crée le compte                   │
│    - Crée session dans authSessions             │
│    - Crée compte dans authAccounts              │
│    - Hash le mot de passe (Scrypt)              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 5. Appel api.users.signUpBuyer()                │
│    → ensureUser(user_type: 'user')              │
│    - Crée/Met à jour dans table users           │
│    - Ajoute created_at si manquant              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 6. Redirection vers /auth/login avec message    │
└─────────────────────────────────────────────────┘
```

**Code côté client** :
```typescript
await signIn('password', {
  flow: 'signUp',
  email: formData.email,
  password: formData.password,
});
await signUpBuyer({
  firstName: formData.firstName,
  lastName: formData.lastName,
  phone: formData.phone,
});
```

### Scénario 2 : Inscription en tant que Supplier (Fournisseur)

```
┌─────────────────────────────────────────────────┐
│ 1. Utilisateur clique "Ajouter votre entreprise"│
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Vérification auth                            │
│    - Si non connecté → /auth/register?type=     │
│      supplier                                    │
│    - Si connecté comme supplier → /dashboard    │
│    - Si buyer → /dashboard?action=become-       │
│      supplier                                    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. /auth/register?type=supplier                 │
│    - Formulaire 3 étapes                        │
│    - userType = 'supplier'                      │
│    - Step = 2 (skip choix type)                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. Submit du formulaire                         │
│    - flow: 'signUp'                             │
│    - email, password                            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 5. Convex Auth crée le compte                   │
│    - Même processus que buyer                   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 6. Appel api.users.signUpSupplier()             │
│    → ensureUser(user_type: 'supplier')          │
│    - Crée/Met à jour dans table users           │
│    - Crée entrée dans table suppliers           │
│    - Inclut business info (nom, catégorie, etc) │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 7. Redirection vers /auth/login avec message    │
└─────────────────────────────────────────────────┘
```

**Code côté client** :
```typescript
await signIn('password', {
  flow: 'signUp',
  email: formData.email,
  password: formData.password,
});
await signUpSupplier({
  firstName: formData.firstName,
  lastName: formData.lastName,
  business_name: formData.businessName,
  email: formData.email,
  phone: formData.phone,
  description: formData.businessDescription,
  category: formData.category,
  address: formData.address,
  city: formData.city,
  state: formData.state,
  website: formData.website
});
```

---

## Flow de Connexion (Sign In)

```
┌─────────────────────────────────────────────────┐
│ 1. Utilisateur va sur /auth/login               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Submit du formulaire                         │
│    - flow: 'signIn'                             │
│    - email, password                            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Convex Auth vérifie credentials              │
│    - Récupère compte dans authAccounts          │
│    - Vérifie hash password (Scrypt)             │
│    - Crée nouvelle session dans authSessions    │
│    - Génère JWT + Refresh Token                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. Client reçoit tokens                         │
│    - Stockés dans localStorage (par défaut)     │
│    - JWT utilisé pour authentifier requêtes     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 5. Redirection automatique                      │
│    - Supplier → /dashboard                      │
│    - Buyer → /                                  │
└─────────────────────────────────────────────────┘
```

**Code côté client** :
```typescript
await signIn('password', {
  flow: 'signIn',
  email: formData.email,
  password: formData.password,
});
```

**Redirection automatique** :
```typescript
useEffect(() => {
  if (!isLoading && isAuthenticated) {
    if (meData?.user?.user_type === 'supplier') {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  }
}, [isLoading, isAuthenticated, meData]);
```

---

## Flow de Déconnexion (Sign Out)

```
┌─────────────────────────────────────────────────┐
│ 1. Utilisateur clique "Déconnexion"             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Appel signOut()                              │
│    - Invalide session côté serveur              │
│    - Supprime tokens du localStorage            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Redirection vers / ou /auth/login            │
└─────────────────────────────────────────────────┘
```

**Code côté client** :
```typescript
const { signOut } = useAuthActions();
await signOut();
```

---

## Flow complet pour Suppliers après Authentification

### 1. Accès au Dashboard

```
┌─────────────────────────────────────────────────┐
│ 1. Supplier se connecte                         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Redirection automatique vers /dashboard      │
│    - Vérification user_type === 'supplier'      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Protection de route                          │
│    - Vérifie isAuthenticated                    │
│    - Vérifie user_type === 'supplier'           │
│    - Redirige /auth/login si non autorisé       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. Chargement des données du supplier           │
│    - api.users.me() → Récupère user + supplier  │
│    - Stats, produits, commandes, avis           │
└─────────────────────────────────────────────────┘
```

### 2. Fonctionnalités du Dashboard Supplier

#### Onglet Overview (Vue d'ensemble)

**Statistiques affichées** :
- Total de commandes
- Nombre de produits
- Nombre d'avis
- Note moyenne
- Revenus mensuels
- Graphique de performance mensuelle

**Sources de données** :
```typescript
const meData = useQuery(api.users.me, {});
// meData.supplier contient toutes les infos business
```

#### Onglet Profile (Profil)

**Actions disponibles** :
1. **Modifier le profil**
   - Nom de l'entreprise
   - Description
   - Catégorie
   - Adresse complète
   - Téléphone
   - Email
   - Site web
   
2. **Horaires d'ouverture**
   - Configuration jour par jour
   - Heures d'ouverture/fermeture
   - Jours fermés

3. **Réseaux sociaux**
   - Facebook, Instagram, Twitter
   - LinkedIn, WhatsApp

**Mutation utilisée** :
```typescript
const updateProfile = useMutation(api.suppliers.updateSupplierProfile);

await updateProfile({
  business_name, email, phone, description,
  category, address, city, state, website,
  business_hours, social_links
});
```

#### Onglet Products (Produits)

**Actions** :

**Créer un produit** :
```typescript
const createProduct = useMutation(api.products.createProduct);

await createProduct({
  name: 'Produit A',
  price: 15000,
  stock: 20,
  status: 'active'
});
```

**Modifier un produit** :
```typescript
const updateProduct = useMutation(api.products.updateProduct);

await updateProduct({
  id: productId,
  name: 'Produit A modifié',
  price: 18000,
  stock: 25
});
```

**Supprimer un produit** :
```typescript
const deleteProduct = useMutation(api.products.deleteProduct);

await deleteProduct({ id: productId });
```

**Limitations selon le plan** :
- Gratuit : 5 produits max
- Basic : 50 produits max
- Premium : Illimité

#### Onglet Orders (Commandes)

**Actions** :

**Créer une commande** :
```typescript
const createOrder = useMutation(api.orders.createOrder);

await createOrder({
  order_number: 'ORD-001',
  total_amount: 45000,
  status: 'pending'
});
```

**Mettre à jour le statut** :
```typescript
const updateOrder = useMutation(api.orders.updateOrder);

await updateOrder({
  id: orderId,
  status: 'completed'
});
```

**Supprimer une commande** :
```typescript
const deleteOrder = useMutation(api.orders.deleteOrder);

await deleteOrder({ id: orderId });
```

**Statuts disponibles** :
- `pending` : En attente
- `processing` : En cours de traitement
- `completed` : Terminée
- `cancelled` : Annulée

#### Onglet Reviews (Avis)

**Actions** :

**Répondre à un avis** :
```typescript
const updateReview = useMutation(api.reviews.updateReview);

await updateReview({
  id: reviewId,
  response: 'Merci pour votre retour !',
  status: 'responded'
});
```

**Supprimer un avis** :
```typescript
const deleteReview = useMutation(api.reviews.deleteReview);

await deleteReview({ id: reviewId });
```

**Données affichées** :
- Nom de l'acheteur
- Note (1-5 étoiles)
- Commentaire
- Date
- Statut de réponse

#### Onglet Analytics (Analyse)

**Disponible pour** : Plans Basic et Premium uniquement

**Métriques** :
- Revenus par période
- Tendances de commandes
- Produits les plus vendus
- Avis et notes moyennes
- Performance mensuelle

**Graphiques** :
- Ligne de temps pour revenus
- Comparaison période/période
- Top produits

#### Onglet Settings (Paramètres)

**Sous-sections** :

1. **Informations du compte**
   - Email de connexion
   - Mot de passe
   - Numéro de téléphone

2. **Notifications**
   - Préférences email
   - Alertes nouvelles commandes
   - Nouvelles avis

3. **Abonnement**
   - Plan actuel
   - Historique de paiements
   - Changer de plan

4. **Intégrations**
   - API keys
   - Webhooks
   - Services tiers

### 3. Système d'Abonnement

**Plans disponibles** :

| Fonctionnalité | Gratuit | Basic | Premium |
|----------------|---------|-------|---------|
| Produits max | 5 | 50 | Illimité |
| Analytics | ❌ | ✅ Basique | ✅ Avancées |
| Badge vérifié | ❌ | ✅ | ✅ |
| Support | Basique | Prioritaire | 24/7 |
| Photos max | 3 | 10 | Illimité |
| Promotion | ❌ | ❌ | ✅ Prioritaire |

**Upgrade de plan** :
```typescript
const handleUpgrade = async (newPlan: 'basic' | 'premium') => {
  // 1. Ouvrir modal de paiement
  // 2. Simuler transaction
  // 3. Mettre à jour le plan
  // 4. Rediriger vers settings
};
```

### 4. Gestion des Commandes

**Workflow typique** :

```
┌─────────────────────────────────────────────────┐
│ 1. Nouvelle commande reçue                      │
│    → Notification en temps réel                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Supplier visualise dans /dashboard/orders    │
│    - Statut: pending                            │
│    - Détails: produits, montant, date           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Supplier accepte la commande                 │
│    → Statut: processing                         │
│    → Notification envoyée au buyer              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. Préparation et livraison                     │
│    → Mise à jour tracking                       │
│    → Communication avec buyer                   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 5. Commande terminée                            │
│    → Statut: completed                          │
│    → Génération de facture                      │
│    → Demande d'avis au buyer                    │
└─────────────────────────────────────────────────┘
```

### 5. Gestion des Produits

**Cycle de vie d'un produit** :

```
┌─────────────────────────────────────────────────┐
│ Création → Statut initial: 'draft'              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Publication → Statut: 'active'                  │
│ - Visible sur le site                           │
│ - Recherchable                                  │
│ - Disponible à l'achat                          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Rupture de stock → Statut: 'out_of_stock'       │
│ - Toujours visible                              │
│ - Indication "Rupture de stock"                 │
│ - Pas d'achat possible                          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Réapprovisionnement → Retour à 'active'         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Désactivation → Statut: 'inactive'              │
│ - Non visible                                   │
│ - Peut être réactivé                            │
└─────────────────────────────────────────────────┘
```

### 6. Gestion des Avis

**Processus de réception d'avis** :

```
┌─────────────────────────────────────────────────┐
│ 1. Buyer laisse un avis                         │
│    - Note 1-5 étoiles                           │
│    - Commentaire optionnel                      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Convex calcule automatiquement               │
│    - Note moyenne mise à jour                   │
│    - Nombre d'avis incrémenté                   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Supplier reçoit notification                 │
│    - Notification dans dashboard                │
│    - Apparaît dans onglet Reviews               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. Supplier peut répondre                       │
│    - Ajouter une réponse publique               │
│    - Marquer comme modéré                       │
└─────────────────────────────────────────────────┘
```

**Calcul de la note moyenne** :
```typescript
// Automatique via queries Convex
const reviews = await ctx.db
  .query("reviews")
  .filter(q => q.eq(q.field("supplierId"), supplierId))
  .collect();

const avgRating = reviews.length > 0
  ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  : 0;

await ctx.db.patch(supplierId, {
  rating: avgRating,
  reviews_count: reviews.length
});
```

### 7. Recherche et Visibilité

**Comment les buyers trouvent votre entreprise** :

```
┌─────────────────────────────────────────────────┐
│ Search Suppliers                                │
│ Query: api.suppliers.searchSuppliers             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Filtres appliqués automatiquement :             │
│ - Catégorie                                     │
│ - Localisation (ville, état)                    │
│ - Note minimale                                 │
│ - Statut vérifié                                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Résultats triés par :                           │
│ - Pertinence                                    │
│ - Note                                          │
│ - Distance (si géolocalisé)                     │
└─────────────────────────────────────────────────┘
```

**Optimisation de la visibilité** :

1. **Profil complet**
   - Description détaillée
   - Photos de qualité
   - Tous les champs remplis

2. **Produits enrichis**
   - Titres descriptifs
   - Descriptions détaillées
   - Photos multiples
   - Catégories appropriées

3. **Engagement**
   - Répondre aux avis
   - Temps de réponse rapide
   - Bon service client

4. **Badge vérifié**
   - Disponible plans Basic/Premium
   - Augmente la confiance
   - Meilleur classement

### 8. Protection des Routes

**Exemple** : Dashboard (`/dashboard`)

```typescript
const { isAuthenticated, isLoading } = useConvexAuth();
const meData = useQuery(api.users.me, {});

useEffect(() => {
  if (!isLoading && (!isAuthenticated || meData?.user?.user_type !== 'supplier')) {
    navigate('/auth/login');
  }
}, [isAuthenticated, isLoading, meData, navigate]);
```

**Pattern de protection** :
1. Vérifier `isLoading` pour éviter redirections intempestives
2. Vérifier `isAuthenticated` pour les routes protégées
3. Vérifier `user_type` pour les routes spécifiques supplier/buyer
4. Rediriger vers `/auth/login` ou `/` si non autorisé

---

## Points d'entrée pour Suppliers

### Bouton "Ajouter votre entreprise"

**Localisations** :
- Page d'accueil (section CTA)
- Page de recherche (header)
- Page de catégories (header)
- Page de contact (header)

**Logique de redirection** :

```typescript
const handleAddBusinessClick = () => {
  if (!isLoading) {
    if (!isAuthenticated) {
      // Non connecté → Inscription supplier
      navigate('/auth/register?type=supplier');
    } else {
      if (meData?.user?.user_type === 'supplier') {
        // Déjà supplier → Dashboard
        navigate('/dashboard');
      } else {
        // Buyer → Option devenir supplier
        navigate('/dashboard?action=become-supplier');
      }
    }
  }
};
```

---

## Queries Convex Disponibles

### Pour les Suppliers

#### `api.suppliers.searchSuppliers`
Recherche de fournisseurs avec filtres multiples

```typescript
const results = useQuery(api.suppliers.searchSuppliers, {
  q: 'terme de recherche',
  category: 'Électronique',
  location: 'Lagos',
  minRating: 4.0,
  verified: true,
  limit: BigInt(20),
  offset: BigInt(0)
});

// results.suppliers: tableau de suppliers correspondants
```

#### `api.suppliers.getSupplierDetails`
Récupère les détails complets d'un supplier

```typescript
const details = useQuery(api.suppliers.getSupplierDetails, {
  id: supplierId
});

// details.supplier: infos du supplier
// details.reviews: avis associés
```

#### `api.users.me`
Récupère les infos du supplier connecté

```typescript
const meData = useQuery(api.users.me, {});

// meData.user: utilisateur (email, user_type, etc.)
// meData.supplier: profil business complet
```

---

## Intégration Convex dans le Dashboard

Le dashboard doit être migré de Supabase vers Convex pour utiliser les mutations et queries disponibles.

### État Actuel vs État Cible

**Actuellement** (Supabase) :
```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/supplier-dashboard`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

**Après migration** (Convex) :
```typescript
// Plus besoin de fetch manuels
// Les données sont réactives et synchronisées automatiquement
const supplier = useQuery(api.users.me, {});
const products = useQuery(api.products.list, {});
const orders = useQuery(api.orders.list, {});
const reviews = useQuery(api.reviews.list, {});

// Mutations sont déclenchées simplement
const updateProfile = useMutation(api.suppliers.updateSupplierProfile);
const createProduct = useMutation(api.products.createProduct);
```

---

## Hooks React Disponibles

### `useAuthActions()`
Retourne `{ signIn, signOut }`

```typescript
import { useAuthActions } from '@convex-dev/auth/react';

const { signIn, signOut } = useAuthActions();
```

### `useConvexAuth()`
Retourne l'état d'authentification

```typescript
import { useConvexAuth } from 'convex/react';

const { isAuthenticated, isLoading } = useConvexAuth();
```

### `useQuery(api.users.me)`
Récupère les infos utilisateur

```typescript
const meData = useQuery(api.users.me, {});
// meData.user : Infos table users
// meData.supplier : Infos table suppliers (si supplier)
```

---

## Mutations Backend

### `api.users.ensureUser`
Crée ou met à jour un utilisateur dans la table `users`

```typescript
await ensureUser({ 
  user_type: 'supplier', 
  phone: '+234 123 456 7890',
  firstName: 'John',
  lastName: 'Doe'
});
```

**Comportement** :
- Si utilisateur existe → Patch avec user_type, firstName, lastName, phone
- Si créé par Convex Auth sans created_at → Ajoute created_at
- Si n'existe pas → Crée avec tous les champs
- Garantit la relation 1:1 avec la table suppliers (un user supplier a un seul supplier)

### `api.users.signUpBuyer`
Crée un profil buyer

```typescript
await signUpBuyer({
  firstName: 'John',
  lastName: 'Doe',
  phone: '+234 123 456 7890'
});
```

### `api.users.signUpSupplier`
Crée un profil supplier avec infos business

```typescript
await signUpSupplier({
  firstName: 'Jane',
  lastName: 'Smith',
  business_name: 'Mon Entreprise',
  email: 'jane@entreprise.com',
  phone: '+234 123 456 7890',
  description: 'Description de mon entreprise',
  category: 'Électronique',
  address: '123 Main Street',
  city: 'Lagos',
  state: 'Lagos',
  website: 'https://mon-entreprise.com'
});
```

---

## Mutations Products (Pour Suppliers)

### `api.products.createProduct`
Crée un nouveau produit

```typescript
const createProduct = useMutation(api.products.createProduct);

await createProduct({
  name: 'Produit A',
  price: 15000,
  stock: 20,
  status: 'active'
});
```

**Validation** :
- Authentification requise (supplier uniquement)
- Vérifie que l'utilisateur a un profil supplier
- Ajoute automatiquement supplierId

### `api.products.updateProduct`
Met à jour un produit existant

```typescript
const updateProduct = useMutation(api.products.updateProduct);

await updateProduct({
  id: productId,
  name: 'Nouveau nom',
  price: 18000,
  stock: 25,
  status: 'inactive'
});
```

**Validation** :
- Vérifie que le produit appartient au supplier
- Champs optionnels : seuls les champs fournis sont mis à jour

### `api.products.deleteProduct`
Supprime un produit

```typescript
const deleteProduct = useMutation(api.products.deleteProduct);

await deleteProduct({ id: productId });
```

**Validation** :
- Vérifie la propriété du produit
- Action irréversible

---

## Mutations Orders (Pour Suppliers)

### `api.orders.createOrder`
Crée une nouvelle commande

```typescript
const createOrder = useMutation(api.orders.createOrder);

await createOrder({
  order_number: 'ORD-001',
  total_amount: 45000,
  status: 'pending'
});
```

### `api.orders.updateOrder`
Met à jour une commande

```typescript
const updateOrder = useMutation(api.orders.updateOrder);

await updateOrder({
  id: orderId,
  status: 'completed',
  payment_status: 'paid'
});
```

### `api.orders.deleteOrder`
Supprime une commande

```typescript
const deleteOrder = useMutation(api.orders.deleteOrder);

await deleteOrder({ id: orderId });
```

---

## Mutations Reviews (Pour Suppliers)

### `api.reviews.updateReview`
Répond à un avis ou le modère

```typescript
const updateReview = useMutation(api.reviews.updateReview);

await updateReview({
  id: reviewId,
  response: 'Merci pour votre retour !',
  status: 'responded'
});
```

### `api.reviews.deleteReview`
Supprime un avis

```typescript
const deleteReview = useMutation(api.reviews.deleteReview);

await deleteReview({ id: reviewId });
```

---

## Mutations Suppliers

### `api.suppliers.updateSupplierProfile`
Met à jour le profil complet du supplier

```typescript
const updateProfile = useMutation(api.suppliers.updateSupplierProfile);

await updateProfile({
  business_name: 'Nouveau nom',
  email: 'nouveau@email.com',
  phone: '+234 123 456 7890',
  description: 'Description mise à jour',
  category: 'Électronique',
  address: '123 Main Street',
  city: 'Lagos',
  state: 'Lagos',
  website: 'https://example.com',
  business_hours: { monday: '09:00-18:00' },
  social_links: { facebook: 'https://fb.com/example' }
});
```

**Comportement** :
- Met à jour `updated_at` automatiquement
- Recalcule `location` à partir de city + state
- Valide que l'utilisateur est bien un supplier

---

## Sécurité

### Hash des mots de passe
- **Algorithme** : Scrypt (via Lucia)
- **Configuration** : Par défaut de Convex Auth
- **Storage** : `authAccounts` table avec champ `secret` hashed

### Sessions
- **Stockage client** : localStorage (JWT + Refresh Token)
- **Gestion serveur** : Table `authSessions` avec expiration
- **Tokens** : JWT pour auth, Refresh Token pour renouvellement

### Validation
- **Email** : Format validé côté client et serveur
- **Password** : Minimum 8 caractères (validation Convex Auth)
- **Champs requis** : Validés côté client et serveur

---

## Gestion d'erreurs

### Inscription
- Email déjà utilisé → Erreur affichée
- Mot de passe faible → Validation échoue
- Champs manquants → Erreur de formulaire

### Connexion
- Email/password incorrect → "Invalid credentials"
- Utilisateur inexistant → Même message
- Erreur réseau → Message générique

### Redirection
- Utilisateur déjà connecté → Redirection automatique
- URL protégée sans auth → Redirection vers /auth/login

---

## Flow Complet : De l'Inscription au Dashboard

### Parcours complet d'un nouveau Supplier

```
┌────────────────────────────────────────────────────┐
│ ÉTAPE 1 : Découverte                              │
│ User visite la page d'accueil                     │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ ÉTAPE 2 : Intérêt                                 │
│ User clique "Ajouter votre entreprise"            │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ ÉTAPE 3 : Redirection intelligente               │
│ Navigate vers /auth/register?type=supplier        │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ ÉTAPE 4 : Formulaire d'inscription               │
│ - Step 1: Sauté (type déjà pré-sélectionné)      │
│ - Step 2: Infos personnelles                     │
│   • Nom, email, password, téléphone              │
│ - Step 3: Infos business                         │
│   • Nom entreprise, catégorie, description       │
│   • Adresse, ville, état, site web               │
│   • Acceptation conditions                       │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ ÉTAPE 5 : Création du compte                     │
│ Convex Auth + Mutation signUpSupplier             │
│ → Crée tables: authSessions, authAccounts        │
│ → Crée tables: users, suppliers                  │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ ÉTAPE 6 : Redirection login                      │
│ Message: "Compte créé avec succès"                │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ ÉTAPE 7 : Première connexion                     │
│ User se connecte avec email/password              │
│ → JWT + Refresh Token générés                     │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ ÉTAPE 8 : Redirection dashboard                  │
│ Automatique vers /dashboard                       │
│ (détecté via user_type='supplier')                │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ ÉTAPE 9 : Accès dashboard                        │
│ Protection route active:                          │
│ - Vérifie isAuthenticated ✓                       │
│ - Vérifie user_type='supplier' ✓                  │
│ - Charge données via api.users.me                 │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ ÉTAPE 10 : Configuration initiale                │
│ Supplier configure son profil:                    │
│ - Complète informations business                  │
│ - Ajoute horaires d'ouverture                     │
│ - Renseigne réseaux sociaux                       │
│ - Télécharge photos/logo                          │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ ÉTAPE 11 : Ajout de produits                     │
│ Supplier crée son premier produit:                │
│ - Nom, prix, stock, statut                        │
│ - Mutation: api.products.createProduct            │
└────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────────┐
│ ÉTAPE 12 : Visibilité                            │
│ L'entreprise devient visible dans:                │
│ - Recherche api.suppliers.searchSuppliers         │
│ - Page de catégories                              │
│ - Résultats géolocalisés                          │
└────────────────────────────────────────────────────┘
```

---

## Erreurs Communes et Solutions

### 1. "No auth provider found matching the given token"
**Cause** : Le provider Password n'est pas configuré correctement  
**Solution** : Vérifier que `convex/auth.ts` exporte bien le provider
```typescript
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password()], // Ne pas oublier les parenthèses
});
```

### 2. "Provider at index 0 has unexpected 'type' value 'credentials'"
**Cause** : auth.config.ts exporte un provider credentials qui n'est pas supporté  
**Solution** : Supprimer auth.config.ts et configurer directement dans auth.ts

### 3. "Object is missing the required field `created_at`"
**Cause** : Le schéma a des champs requis non fournis  
**Solution** : Rendre created_at et user_type optionnels dans le schéma users

### 4. "useConvexAuth is not exported"
**Cause** : Import depuis le mauvais module  
**Solution** : Importer depuis 'convex/react', pas '@convex-dev/auth/react'
```typescript
import { useConvexAuth } from 'convex/react'; // ✓
import { useConvexAuth } from '@convex-dev/auth/react'; // ✗
```

### 5. "useSignUp is not exported"
**Cause** : API obsolète  
**Solution** : Utiliser useAuthActions avec flow: 'signUp'
```typescript
const { signIn } = useAuthActions();
await signIn('password', { flow: 'signUp', ... });
```

### 6. Redirection boucle infinie
**Cause** : Conditions de redirection mal gérées  
**Solution** : Toujours vérifier isLoading
```typescript
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    navigate('/auth/login');
  }
}, [isLoading, isAuthenticated]);
```

---

## Troubleshooting

### Convex ne détecte pas les changements

**Symptômes** :
- Erreur "No auth provider found"
- Schéma non à jour
- Mutations ne fonctionnent pas

**Solutions** :

1. **Vérifier que Convex CLI est actif**
   ```bash
   npx convex dev
   ```

2. **Vérifier les exports dans `convex/auth.ts`**
   ```typescript
   export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
     providers: [Password()], // ✓
   });
   ```

3. **Nettoyer le cache Vite**
   ```bash
   # Windows
   rmdir /s /q node_modules\.vite
   
   # Mac/Linux
   rm -rf node_modules/.vite
   ```

4. **Redémarrer les serveurs**
   - Arrêter Convex
   - Nettoyer cache Vite
   - Redémarrer `npx convex dev`
   - Redémarrer `npm run dev`

5. **Vérifier que le schéma est bien déployé**
   - Ouvrir Convex Dashboard
   - Vérifier que les tables sont créées
   - Vérifier que les mutations apparaissent

### "No auth provider found" après déploiement

**Cause** : Le fichier `auth.config.ts` a été supprimé mais Convex cherche encore le config

**Solution** :
1. Supprimer complètement `auth.config.ts` (déjà fait)
2. Relancer `npx convex dev`
3. Attendre que le schéma soit déployé
4. Actualiser l'application

### Erreurs de schéma incompatibles

**Symptômes** :
- "Object is missing required field"
- Champs non reconnus

**Solution** :
1. Vérifier `convex/schema.ts` a tous les champs optionnels nécessaires
2. Les champs Convex Auth doivent être optionnels
3. Les champs personnalisés peuvent être requis selon nos besoins
4. Redéployer : `npx convex dev`

---

## Checklist de Déploiement

Avant de déployer en production :

- [ ] **Configuration Auth**
  - [ ] `convex/auth.ts` exporte correctement les fonctions
  - [ ] Provider Password configuré
  - [ ] Aucun `auth.config.ts` orphelin

- [ ] **Schéma Convex**
  - [ ] `authTables` inclus dans le schéma
  - [ ] Table `users` avec champs optionnels
  - [ ] Tables métier (suppliers, products, orders, reviews) définies
  - [ ] Index ajoutés où nécessaire

- [ ] **Fonctions Backend**
  - [ ] `convex/users.ts` : ensureUser, signUpBuyer, signUpSupplier, me
  - [ ] `convex/suppliers.ts` : searchSuppliers, getSupplierDetails, updateSupplierProfile
  - [ ] `convex/products.ts` : listProducts, createProduct, updateProduct, deleteProduct
  - [ ] `convex/orders.ts` : listOrders, createOrder, updateOrder, deleteOrder
  - [ ] `convex/reviews.ts` : listReviews, updateReview, deleteReview
  - [ ] `convex/dashboard.ts` : supplierDashboard

- [ ] **Pages Frontend**
  - [ ] `/auth/login` utilise `useAuthActions` et `flow: 'signIn'`
  - [ ] `/auth/register` utilise `useAuthActions` et `flow: 'signUp'`
  - [ ] Bouton "Ajouter entreprise" redirige selon auth
  - [ ] `/dashboard` protégé pour suppliers uniquement
  - [ ] Redirections après login selon user_type

- [ ] **Tests**
  - [ ] Inscription buyer fonctionne
  - [ ] Inscription supplier fonctionne
  - [ ] Connexion fonctionne
  - [ ] Déconnexion fonctionne
  - [ ] Redirections fonctionnent
  - [ ] Dashboard accessible aux suppliers uniquement

---

## Prochaines améliorations possibles

1. **Email verification** : Ajouter vérification email
2. **Password reset** : Implémenter réinitialisation  
3. **OAuth providers** : Ajouter Google/GitHub login
4. **2FA** : Ajouter authentification à deux facteurs
5. **Sessions multiples** : Gérer sessions actives
6. **Migration dashboard** : Migrer de Supabase vers Convex complètement
7. **Upload images** : Implémenter upload photos produits/profil
8. **Notifications** : Système de notifications en temps réel

