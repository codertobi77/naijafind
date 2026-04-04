# Moneroo Payment Integration - Environment Variables

Ce fichier documente les variables d'environnement nécessaires pour l'intégration Moneroo.

## Variables Obligatoires

### MONEROO_SECRET_KEY
Clé secrète API Moneroo pour les appels backend.
- **Obtention**: Dashboard Moneroo > Paramètres > API Keys
- **Format**: `sk_live_...` (production) ou `sk_test_...` (test)
- **Usage**: Authentification des appels API depuis Convex

### MONEROO_PUBLIC_KEY (Frontend)
Clé publique pour l'initialisation côté client (si nécessaire).
- **Obtention**: Dashboard Moneroo > Paramètres > API Keys
- **Format**: `pk_live_...` ou `pk_test_...`

### MONEROO_WEBHOOK_SECRET
Secret pour vérifier l'authenticité des webhooks Moneroo.
- **Obtention**: Dashboard Moneroo > Webhooks
- **Usage**: Validation des notifications de paiement

## Configuration Convex

Pour configurer ces variables dans Convex :

```bash
npx convex env set MONEROO_SECRET_KEY "sk_test_votre_cle_ici"
npx convex env set MONEROO_WEBHOOK_SECRET "whsec_votre_secret_ici"
```

Pour la production :
```bash
npx convex env set MONEROO_SECRET_KEY "sk_live_votre_cle_ici" --prod
npx convex env set MONEROO_WEBHOOK_SECRET "whsec_votre_secret_ici" --prod
```

## Configuration Webhook

Dans le dashboard Moneroo, configurez le webhook URL :
```
https://<votre-deployment>.convex.site/webhooks/moneroo
```

Événements à activer :
- `payment.success`
- `payment.failed`
- `payment.cancelled`
- `payment.refunded`

## Méthodes de Paiement Supportées

Configurez selon votre marché cible dans les appels `initializePayment` :

| Code | Méthode | Pays |
|------|---------|------|
| `mtn_bj` | MTN Mobile Money | Bénin |
| `moov_bj` | Moov Money | Bénin |
| `mtn_ci` | MTN Mobile Money | Côte d'Ivoire |
| `moov_ci` | Moov Money | Côte d'Ivoire |
| `orange_ci` | Orange Money | Côte d'Ivoire |
| `wave_sn` | Wave | Sénégal |
| `orange_sn` | Orange Money | Sénégal |
| `free_sn` | Free Money | Sénégal |
| `mtn_gh` | MTN Mobile Money | Ghana |
| `vodafone_gh` | Vodafone Cash | Ghana |
| `bank_transfer_ngn` | Virement bancaire | Nigeria |
| `qr_ngn` | QR Code | Nigeria |

## Exemple de Configuration Locale

Créez un fichier `.env.local` à la racine du projet :

```bash
# Moneroo (Test Mode)
MONEROO_SECRET_KEY=sk_test_votre_cle_test
MONEROO_WEBHOOK_SECRET=whsec_votre_secret_test

# Autres variables existantes...
```

## Tarifs de Référence (à configurer dans le code)

- **Featured Upgrade**: 50,000 XOF (30 jours)
- **Abonnement Basic**: 25,000 XOF/mois
- **Abonnement Premium**: 200,000 XOF/an (inclut featured)

## URLs de Retour

Configurez dans votre frontend les pages de retour :
- **Succès**: `/payment/success?paymentId={paymentId}`
- **Échec**: `/payment/failed?paymentId={paymentId}`

## Test

Pour tester en local avec ngrok :
1. `ngrok http 5173` (ou votre port Vite)
2. Configurez l'URL ngrok comme return_url temporairement
3. Utilisez les credentials de test Moneroo

## Support

- Documentation: https://docs.moneroo.io
- Support: support@moneroo.io
- Slack: https://moneroo.io/slack
