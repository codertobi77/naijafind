# Currency Localization System

This document explains how the currency localization system works in the Olufinja application.

## Overview

The currency localization system automatically formats monetary values based on the user's selected language and regional preferences. It uses the existing i18n infrastructure to dynamically sync currency formatting with language changes.

## Features

1. **Automatic Localization**: Currency symbols, formatting, and decimal separators automatically update when the user switches languages
2. **Nigerian Naira Support**: Properly formats Nigerian Naira (₦) for both English and French Nigeria locales
3. **Extensible Design**: Easily add support for additional currencies and locales
4. **Integration with i18n**: Works seamlessly with the existing react-i18next setup

## Implementation Details

### Core Files

1. **`src/lib/currency.ts`** - Contains the core currency formatting logic
2. **`src/hooks/useCurrency.ts`** - React hook for using currency formatting in components
3. **`src/i18n/local/*/common.ts`** - Translation files with currency-related keys

### Currency Configuration

The system is configured with locale-specific settings:

```typescript
const currencyConfig: Record<string, { currency: string; locale: string }> = {
  'en': { currency: 'NGN', locale: 'en-NG' },  // English Nigeria
  'fr': { currency: 'NGN', locale: 'fr-FR' },  // French Nigeria (using French locale for formatting)
  'en-NG': { currency: 'NGN', locale: 'en-NG' },
  'fr-FR': { currency: 'NGN', locale: 'fr-FR' },
};
```

### Usage in Components

To use the currency formatting in React components:

1. Import the `useCurrency` hook:
```typescript
import useCurrency from '../../hooks/useCurrency';
```

2. Use the hook in your component:
```typescript
const { formatCurrency } = useCurrency();

// Format a monetary value
const formattedPrice = formatCurrency(1234.56); // Returns "₦1,234.56" for English Nigeria
```

### Updating Currency Display

Replace hardcoded currency formatting with the new system:

**Before:**
```jsx
<td>₦{Number(product.price || 0).toLocaleString('fr-FR')}</td>
```

**After:**
```jsx
<td>{formatCurrency(Number(product.price || 0))}</td>
```

## Adding New Currencies

To add support for additional currencies:

1. Update the `currencyConfig` object in `src/lib/currency.ts`
2. Add currency-related translation keys to the appropriate language files:
   - `currency.symbol` - Currency symbol (e.g., "₦")
   - `currency.code` - Currency code (e.g., "NGN")
   - `currency.name` - Full currency name (e.g., "Nigerian Naira")

## Benefits

1. **Consistency**: All currency values are formatted consistently throughout the application
2. **Maintainability**: Centralized currency formatting logic makes updates easier
3. **User Experience**: Users see currency values in their preferred format
4. **Localization**: Properly adapts to regional formatting conventions

## Components Updated

The following components have been updated to use the new currency system:

- Dashboard Overview (monthly revenue)
- Products list (product prices)
- Orders list (order amounts)
- Recent orders card
- Admin dashboard (total revenue)
- Admin recent activity

## Future Enhancements

Potential future improvements include:

1. Support for additional currencies beyond Nigerian Naira
2. User preference settings for currency display
3. Integration with real-time exchange rates for multi-currency support