# Configuration JWT Template dans Clerk pour Convex

## Étape 1: Créer/Mettre à jour le JWT Template dans Clerk

1. **Accédez au Dashboard Clerk**
   - Allez sur https://dashboard.clerk.com
   - Sélectionnez votre application

2. **Naviguez vers JWT Templates**
   - Dans le menu de gauche, allez dans **"Configure"** → **"JWT Templates"**
   - Cliquez sur **"New template"** ou modifiez un template existant

3. **Configurez le Template JWT pour Convex**
   - **Name**: `Convex` (ou tout autre nom descriptif)
   - **Token Lifetime**: `5 minutes` (recommandé)
   - **Claims**: Ajoutez le JSON suivant :

```json
{
  "iss": "https://firm-cowbird-57.clerk.accounts.dev",
  "sub": "{{user.id}}",
  "aud": "convex",
  "iat": {{date.now}},
  "exp": {{date.now_plus_5_minutes}},
  "email": "{{user.primary_email_address}}",
  "given_name": "{{user.first_name}}",
  "family_name": "{{user.last_name}}"
}
```

**IMPORTANT**: 
- Remplacez `"iss"` par votre propre Issuer URL de Clerk
- La revendication `"aud": "convex"` est **OBLIGATOIRE** - elle doit correspondre à `applicationID: "convex"` dans `convex/auth.config.ts`

4. **Enregistrez le template**

## Étape 2: Vérifier la configuration Convex

Assurez-vous que `convex/auth.config.ts` contient:

```typescript
export default {
  providers: [
    {
      domain: "https://firm-cowbird-57.clerk.accounts.dev", // Votre Issuer URL
      applicationID: "convex", // Doit correspondre à "aud" dans le JWT
    },
  ],
};
```

**IMPORTANT**: Le `domain` doit correspondre exactement à la valeur de `"iss"` dans votre JWT template.

## Étape 3: Synchroniser avec Convex

Après avoir configuré `auth.config.ts`, exécutez:

```bash
npx convex dev
```

Ou pour la production:

```bash
npx convex deploy
```

## Vérification

Après avoir fait ces étapes:
1. ✅ L'erreur "No auth provider found" devrait disparaître
2. ✅ Les tokens JWT de Clerk seront validés par Convex
3. ✅ `ctx.auth.getUserIdentity()` fonctionnera dans vos fonctions Convex

## Dépannage

Si vous avez encore des erreurs:

1. **Vérifiez l'Issuer URL**: Elle doit être exactement la même dans:
   - Le JWT template Clerk (`iss`)
   - `convex/auth.config.ts` (`domain`)

2. **Vérifiez l'audience**: `"aud": "convex"` dans le JWT doit correspondre à `applicationID: "convex"` dans `auth.config.ts`

3. **Vérifiez que vous avez redémarré Convex** après avoir modifié `auth.config.ts`

4. **Décoder le JWT**: Utilisez https://jwt.io pour décoder votre token JWT et vérifier les valeurs de `iss` et `aud`

