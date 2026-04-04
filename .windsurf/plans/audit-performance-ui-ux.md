# Audit Performance UI/UX & Backend - Plan d'Implémentation

**Date:** Avril 2025  
**Statut:** Audit terminé - Prêt pour implémentation

---

## 1. RÉSUMÉ DES PROBLÈMES IDENTIFIÉS

### 🔴 CRITICAL (Haute priorité)

| # | Problème | Impact | Fichier(s) concerné(s) |
|---|----------|--------|------------------------|
| P1 | Requêtes dashboard trop lourdes - chargement de 500+ items simultanément | Temps de chargement >10s, timeout utilisateur | `convex/dashboard.ts:19-35` |
| P2 | Absence de lazy loading sur les routes - tout chargé upfront | Bundle initial trop lourd, TTFB élevé | `src/router/config.tsx` |
| P3 | N+1 Query problem - multiple requêtes séquentielles | Latence cumulative, dégradation perfs | `src/pages/admin/page.tsx:497-608` |
| P4 | Pas de pagination sur la liste produits admin | Crash navigateur avec +1000 produits | `src/pages/admin/page.tsx:550-564` |

### 🟠 HIGH (Priorité moyenne-haute)

| # | Problème | Impact | Fichier(s) concerné(s) |
|---|----------|--------|------------------------|
| P5 | Cache React Query non optimisé - staleTime trop court | Requêtes réseau inutiles, surcharge API | `src/lib/convexCache.ts:282-297` |
| P6 | Images sans optimisation (pas de WebP, pas de lazy loading) | LCP élevé, data usage mobile excessif | Composants d'image dans tout le projet |
| P7 | Re-renders inutiles sur dashboard - useEffect non optimisés | UI laggy, consommation CPU | `src/pages/dashboard/page.tsx:561-642` |
| P8 | Pas de code splitting pour les sections admin | Bundle monolithique | `src/pages/admin/page.tsx` |

### 🟡 MEDIUM (Priorité moyenne)

| # | Problème | Impact | Fichier(s) concerné(s) |
|---|----------|--------|------------------------|
| P9 | Pas de virtualisation pour les longues listes | Scroll lent, crash mobile | Tables admin avec pagination |
| P10 | Service worker manquant - pas de PWA/offline | Expérience offline inexistante | `src/App.tsx` |
| P11 | Console.log de debug en production | Pollution logs, légère perte perf | `src/pages/admin/page.tsx:533-534` |

---

## 2. PLAN D'IMPLÉMENTATION DÉTAILLÉ

### Phase 1: Optimisations Backend (Jour 1-2)

#### P1: Optimiser les requêtes dashboard
**Fichier:** `convex/dashboard.ts`  
**Actions:**
1. Créer une query `supplierDashboardLight` qui ne retourne que les stats essentielles
2. Créer des queries séparées pour orders, products, reviews avec pagination
3. Ajouter un cache côté serveur avec memoization

```typescript
// Avant (problématique)
const ordersResult = await ctx.db.query("orders").paginate({ cursor: null, numItems: MAX_PAGE_SIZE });

// Après (optimisé)
export const supplierDashboardStats = query({...}) // Uniquement les compteurs
export const supplierOrdersPaginated = query({...}) // Pagination lazy
```

**Métriques cibles:**
- Temps de chargement dashboard: <2s (actuellement >10s)
- Bandwidth par requête: <100KB (actuellement >1MB)

#### P3: Résoudre N+1 Query sur admin
**Fichier:** `src/pages/admin/page.tsx`  
**Actions:**
1. Créer une query backend `getAdminDashboardSummary` qui agrège tout en une seule requête
2. Utiliser `useQueries` avec dépendances pour paralleliser les requêtes indépendantes
3. Implémenter suspense boundaries

---

### Phase 2: Optimisations Frontend (Jour 2-3)

#### P2: Implémenter lazy loading des routes
**Fichier:** `src/router/config.tsx`  
**Actions:**
1. Activer le lazy loading avec React.lazy() déjà présent mais mal configuré
2. Ajouter Suspense boundaries avec fallback approprié
3. Implémenter preloading pour les routes probables

```typescript
// Optimisation
const Dashboard = lazy(() => import(/* webpackPrefetch: true */ '../pages/dashboard/page'));
```

#### P7: Optimiser les useEffect du dashboard
**Fichier:** `src/pages/dashboard/page.tsx`  
**Actions:**
1. Fusionner les useEffect de transformation business_hours (doublon détecté)
2. Utiliser useMemo pour les calculs dérivés
3. Extraire les callbacks avec useCallback

#### P6: Optimisation des images
**Fichiers:** Composants SupplierImage, GallerySection  
**Actions:**
1. Implémenter un composant Image optimisé avec WebP fallback
2. Ajouter loading="lazy" sur toutes les images non-critiques
3. Utiliser des placeholders blur-up

```typescript
// Composant Image optimisé
export function OptimizedImage({ src, alt, className, priority = false }) {
  return (
    <picture>
      <source srcSet={`${src}.webp`} type="image/webp" />
      <img 
        src={src} 
        alt={alt} 
        loading={priority ? "eager" : "lazy"}
        className={className}
      />
    </picture>
  );
}
```

---

### Phase 3: Pagination & Virtualisation (Jour 3-4)

#### P4: Pagination des produits admin
**Fichier:** `src/pages/admin/page.tsx`  
**Actions:**
1. Remplacer `useConvexQuery` par `usePaginatedQuery` pour les produits
2. Implémenter une table virtuelle avec react-window
3. Ajouter infinite scroll ou pagination classique

#### P9: Virtualisation des longues listes
**Fichier:** `src/pages/admin/page.tsx`  
**Actions:**
1. Installer react-window ou @tanstack/react-virtual
2. Implémenter VirtualTable pour les grilles de données
3. Hauteur fixe des lignes pour calcul efficace

---

### Phase 4: Cache & Performance Avancée (Jour 4-5)

#### P5: Optimiser React Query cache
**Fichier:** `src/lib/convexCache.ts`  
**Actions:**
1. Augmenter staleTime pour données semi-statiques (categories: 5min → 15min)
2. Implémenter prefetching intelligent sur hover des liens
3. Activer cache persistence avec localStorage pour données critiques

#### P10: Service Worker & PWA
**Fichier:** Nouveau `src/service-worker.ts`  
**Actions:**
1. Créer un service worker avec Workbox
2. Stratégie stale-while-revalidate pour les données API
3. Cache-first pour les assets statiques
4. Offline fallback page

---

## 3. MÉTRIQUES DE SUCCÈS

### KPIs Frontend

| Métrique | Actuel | Cible | Comment mesurer |
|----------|--------|-------|-----------------|
| Lighthouse Performance | ~45 | >80 | Chrome DevTools |
| Time to First Byte (TTFB) | ~2.5s | <600ms | WebPageTest |
| Largest Contentful Paint (LCP) | ~4s | <2.5s | Lighthouse |
| First Input Delay (FID) | ~200ms | <100ms | Chrome UX Report |
| Bundle size initial | ~850KB | <500KB | webpack-bundle-analyzer |

### KPIs Backend

| Métrique | Actuel | Cible | Comment mesurer |
|----------|--------|-------|-----------------|
| Dashboard load time | ~10s | <2s | Convex dashboard |
| Requêtes N+1 | 5-6 | 1 | React Query DevTools |
| Bandwidth par session | ~5MB | <2MB | Chrome DevTools Network |
| Cache hit rate | ~30% | >70% | React Query DevTools |

---

## 4. RISQUES ET MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Régression fonctionnelle | Moyen | Haut | Tests E2E avant/après chaque phase |
| Breaking changes API | Faible | Haut | Maintenir anciennes queries pendant transition |
| Complexité cache | Moyen | Moyen | Documentation claire, monitoring |
| Mobile performance | Moyen | Moyen | Tests sur devices réels, Lighthouse mobile |

---

## 5. OUTILS RECOMMANDÉS

### Profilage & Monitoring
- **React DevTools Profiler** - Identifier les re-renders
- **Chrome DevTools Performance** - Analyse temps d'exécution
- **Lighthouse CI** - Intégration CI/CD pour perfs
- **Convex Dashboard** - Monitoring queries backend
- **React Query DevTools** - Inspection cache

### Bundle Analysis
```bash
npx vite-bundle-visualizer
npx webpack-bundle-analyzer dist/stats.json
```

---

## 6. CHECKLIST DE VALIDATION

### Avant déploiement
- [ ] Lighthouse score >80 sur desktop et mobile
- [ ] Dashboard charge en <2s sur 3G simulé
- [ ] Pas de régression fonctionnelle (tests E2E passent)
- [ ] Images WebP générées pour tous les uploads
- [ ] Service worker enregistré et fonctionnel
- [ ] Console clean (pas d'erreurs/warnings)

### Post-déploiement
- [ ] Monitoring erreurs Sentry (si utilisé)
- [ ] Analytics temps de chargement
- [ ] Feedback utilisateurs sur performance perçue

---

## 7. ORDRE DE PRIORITÉ D'IMPLÉMENTATION

### Semaine 1 - Fondations
1. **P1** - Optimiser requêtes dashboard (backend)
2. **P3** - Résoudre N+1 queries (backend)
3. **P7** - Optimiser useEffect dashboard (frontend)

### Semaine 2 - Expérience Utilisateur
4. **P2** - Lazy loading routes
5. **P4** - Pagination produits admin
6. **P6** - Optimisation images

### Semaine 3 - Polish
7. **P5** - Cache React Query optimisé
8. **P9** - Virtualisation listes
9. **P10** - Service Worker PWA
10. **P8** - Code splitting admin (si temps)

---

## 8. RESSOURCES & DOCUMENTATION

- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices)
- [React Query Performance](https://tanstack.com/query/latest/docs/react/guides/performance)
- [Web Vitals](https://web.dev/vitals/)
- [Vite Performance](https://vitejs.dev/guide/performance.html)

---

**Prochaine étape:** Approbation de ce plan, puis implémentation Phase 1 (Optimisations Backend)
