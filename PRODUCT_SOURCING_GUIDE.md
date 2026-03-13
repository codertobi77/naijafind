# Product-First Sourcing Search System - Implementation Guide

## Overview
This document describes the product-first sourcing search system implemented for the React + Convex application. The system allows users to search for products and receive a list of potential suppliers that can provide quotes.

## Architecture

### Data Model

#### 1. ProductSupplierCandidate (`productSupplierCandidates`)
Links products to potential suppliers with match scores.

**Fields:**
- `productId` (id<products>): Reference to product
- `supplierId` (id<suppliers>): Reference to supplier
- `matchScore` (float64): Normalized score 0-1
- `matchConfidence` (union): "high" | "medium" | "low"
- `matchSource` (union): "manual" | "rule_engine" | "ai_inference" | "import"
- `isApproved` (boolean): Whether candidate is approved for display
- `adminValidationScore` (optional float64): Manual adjustment
- Component scores: `categoryMatchScore`, `keywordMatchScore`, `countryMatchScore`, `profileCompletenessScore`
- `createdAt`, `updatedAt`

**Indexes:**
- `productId`: Lookup by product
- `supplierId`: Lookup by supplier
- `productId_approved`: Efficient filtering for approved candidates
- `supplierId_approved`: Efficient filtering for approved candidates
- `productId_score`: Sort by score

#### 2. QuoteRequest (`quoteRequests`)
Buyer's request for quotes.

**Fields:**
- `productId` (id<products>): Requested product
- `quantity`, `quantityUnit`: Order quantity
- `message`: Buyer's message
- `buyerName`, `buyerEmail`, `buyerPhone`, `buyerCountry`, `buyerCompany`: Buyer info
- `preferredDeliveryDate`, `budgetRange`: Preferences
- `status` (union): "pending" | "sent" | "responded" | "closed"
- `createdAt`, `updatedAt`
- `userId`: Optional authenticated user reference

**Indexes:**
- `productId`: Lookup by product
- `createdAt`: Sort by date
- `status`: Filter by status
- `buyerEmail`: Lookup buyer's requests

#### 3. QuoteRequestSupplier (`quoteRequestSuppliers`)
Links quote requests to specific suppliers.

**Fields:**
- `quoteRequestId` (id<quoteRequests>): Parent request
- `supplierId` (id<suppliers>): Target supplier
- `deliveryStatus` (union): "pending" | "sent" | "delivered" | "failed"
- `responseStatus` (union): "pending" | "viewed" | "responded" | "declined"
- `supplierMessage`, `quotedPrice`, `quotedCurrency`, `deliveryTimeDays`: Response data
- `createdAt`, `updatedAt`

**Indexes:**
- `quoteRequestId`: Lookup by request
- `supplierId`: Lookup by supplier
- `quoteRequestId_supplierId`: Unique constraint
- `responseStatus`: Filter by response status

#### 4. ProductTranslation (`productTranslations`)
Multilingual support for product data.

**Fields:**
- `productId` (id<products>): Reference to product
- `language` (string): Target language code
- `name`, `description`, `shortDescription`: Translated content
- `keywords` (array<string>): Translated search keywords
- `translatedAt`: Timestamp
- `translatedBy` (union): "deepl" | "manual" | "import"
- `translationStatus` (union): "pending" | "completed" | "failed"

**Indexes:**
- `productId_language`: Primary lookup
- `language`: Filter by language
- `productId`: All translations for a product
- `translationStatus`: Filter by status

### Extended Product Schema

Added fields to existing `products` table:
- `shortDescription` (optional string): Brief summary for search results
- `keywords` (optional array<string>): Search-optimized keywords
- `originalLanguage` (optional string): Source language for translation
- `isSearchable` (optional boolean): Whether product appears in search

**New Indexes:**
- `isSearchable`: Filter searchable products
- `status_category`: Combined filter for search optimization

## Supplier Matching Algorithm

### Match Score Formula
```
matchScore =
  0.35 * categoryMatch +
  0.30 * keywordMatch +
  0.15 * countryMatch +
  0.10 * supplierProfileCompleteness +
  0.10 * adminValidation
```

### Confidence Levels
- `>= 0.8`: "high" (Excellent match)
- `>= 0.55`: "medium" (Good match)
- `< 0.55`: "low" (Possible match)

### Component Scoring

**Category Match (35%):**
- Exact match: 1.0
- Partial overlap: 0.7
- Related categories: 0.5
- No match: 0

**Keyword Match (30%):**
- Based on overlap between product keywords and supplier description/category
- Percentage of matching keywords with minimum 0.1

**Country Match (15%):**
- Base score of 0.6 if supplier has country data
- Reserved for future buyer-country matching

**Profile Completeness (10%):**
- Based on: description, phone, website, logo, verified status, approved status, rating
- Max score of 1.0 for complete profiles

**Admin Validation (10%):**
- Manual adjustment score 0-1
- Defaults to 0.5 (neutral)

## Convex Functions

### Backend Files

1. **`convex/productSourcing.ts`**
   - `calculateMatchScore()`: Core matching algorithm
   - `_getApprovedSuppliersByCategory()`: Index-optimized supplier lookup
   - `_upsertCandidate()`: Create/update candidate entries
   - `computeProductMatches()`: Action to compute matches for a product
   - `recomputeSupplierMatches()`: Action to recompute for a supplier
   - `approveCandidate()`: Admin approval mutation

2. **`convex/productSearch.ts`**
   - `searchProductsMultilingual()`: Main search action with i18n
   - `getProductSuppliers()`: Get approved candidates for a product
   - `_getProductsForSearch()`: Index-optimized product loader
   - `_getProductTranslations()`: Batch translation fetcher
   - `_getSuppliersByIds()`: Batch supplier loader (prevents N+1)

3. **`convex/productTranslation.ts`**
   - `translateProductField()`: Translate single field via DeepL
   - `translateProduct()`: Translate all product fields
   - `batchTranslateProducts()`: Admin batch translation
   - `getProductTranslation()`: Get single translation
   - `getProductWithTranslation()`: Get product with fallback
   - `setProductTranslation()`: Manual translation entry

4. **`convex/quoteRequests.ts`**
   - `createQuoteRequest()`: Create RFQ with supplier entries
   - `updateQuoteRequestStatus()`: Update status
   - `respondToQuoteRequest()`: Supplier response handler
   - `getQuoteRequest()`: Get full request details
   - `getBuyerQuoteRequests()`: Get buyer's requests
   - `getSupplierQuoteRequests()`: Get supplier's requests

### Search Optimization

**Indexed Access:**
- Uses `.withIndex()` for all major queries
- Prevents full-table scans
- `isSearchable` index for product search
- `productId_approved` for candidate lookups

**N+1 Prevention:**
- Batch supplier lookups via `_getSuppliersByIds`
- Batch translation lookups
- Single query for all candidates per product

**Pagination:**
- All search queries support limit/offset
- Default 20 items per page
- Hard cap at 1000 for internal queries

## DeepL Integration

### Configuration
Requires `DEEPL_API_KEY` environment variable in Convex dashboard.

### Supported Languages
```typescript
const SUPPORTED_PRODUCT_LANGUAGES = [
  "en", "fr", "de", "es", "it", "pt", "nl", "pl", "ru", "ja", "zh"
];
```

### Translation Flow
1. Call `translateProduct()` action with product ID and target language
2. Fetches product data from database
3. Calls DeepL API via `translation.translateBatch()`
4. Stores result in `productTranslations` table
5. Translation status tracked as "completed" or "failed"

### Explicit Translation Policy
- Translations are NOT automatically generated on every read
- Admin or explicit action required to trigger translation
- Prevents unnecessary API costs

## React Frontend

### Hooks (`src/hooks/useProductSourcing.ts`)

**`useProductSearch(options):`**
```typescript
const { results, total, loading, error, hasMore, search, loadMore, reset } = 
  useProductSearch({ language: 'en', itemsPerPage: 20 });
```

**`useQuoteRequest():`**
```typescript
const { submitting, success, error, submitQuoteRequest, reset } = useQuoteRequest();
```

### Components

**`QuoteRequestForm` (`src/components/QuoteRequestForm.tsx`)**
- Full RFQ form with supplier selection
- Validation and error handling
- Success/error states
- i18n support

### I18n Keys Added

**English (`src/i18n/local/en/products.ts`):**
- `rfq.*`: RFQ form labels and messages
- `match.confidence.*`: Match badge labels
- `supplier.verified`, `supplier.approved`: Badge labels

**French (`src/i18n/local/fr/products.ts`):**
- French translations for all new keys

## Manual Migration Steps

### 1. Deploy Schema Changes
```bash
npx convex dev
# or for production
npx convex deploy
```

### 2. Run Full Migration (Automated)

The easiest way to migrate all products and compute supplier matches is to use the built-in migration action:

```typescript
// Run this from your admin panel or Convex dashboard
await ctx.runAction(api.productMigration.runFullMigration, {
  defaultLanguage: "en",      // or "fr" - default language for products
  productBatchSize: 100,      // products per batch (default: 100)
  matchBatchSize: 50,         // products per batch for match computation (default: 50)
  autoApproveHighConfidence: true,  // auto-approve high-confidence matches
});
```

This will:
1. **Phase 1**: Migrate all products (set `isSearchable: true`, detect language, generate keywords)
2. **Phase 2**: Compute supplier matches for all migrated products

### 3. Check Migration Status

Monitor progress:

```typescript
const status = await ctx.runQuery(api.productMigration.getMigrationStatus);
// Returns:
// {
//   total: { products, searchableProducts, productsWithOriginalLang, candidates, approvedCandidates, productsWithCandidates },
//   progress: { productsMigratedPercent, productsWithMatchesPercent },
//   readyForSearch: boolean
// }
```

### 4. Alternative: Run Migrations Separately

If you prefer to run each phase separately:

#### Phase 1 - Migrate Products Only
```typescript
await ctx.runAction(api.productMigration.migrateAllProducts, {
  defaultLanguage: "en",
  batchSize: 100,
});
```

#### Phase 2 - Compute Matches Only
```typescript
await ctx.runAction(api.productMigration.computeMatchesForAllProducts, {
  batchSize: 50,
  onlyWithoutMatches: true,  // only process products without existing matches
  autoApproveHighConfidence: true,
});
```

### 5. Single Product Migration (Testing)

For testing on a single product:

```typescript
// Migrate single product
await ctx.runMutation(api.productMigration.migrateSingleProduct, {
  productId: "<product-id>",
  originalLanguage: "en", // optional, auto-detected if not provided
});

// Compute matches for single product
await ctx.runMutation(api.productMigration.computeMatchesForSingleProduct, {
  productId: "<product-id>",
  autoApproveHighConfidence: true,
});
```

### 6. Configure DeepL (Optional)
Add to Convex environment variables:
```
DEEPL_API_KEY=your-deepl-api-key
```

### 7. Translate Products (Optional)
```typescript
// Translate single product
await ctx.runAction(api.productTranslation.translateProduct, {
  productId: "<product-id>",
  targetLang: "fr",
});

// Or batch translate
await ctx.runAction(api.productTranslation.batchTranslateProducts, {
  productIds: ["<id1>", "<id2>"],
  targetLang: "fr",
});
```

## Migration Features

The migration system (`convex/productMigration.ts`) provides:

- **Automatic language detection**: Detects French vs English based on common words
- **Keyword generation**: Auto-generates keywords from product name, description, and category
- **Batch processing**: Processes products in batches to avoid timeouts
- **Progress tracking**: `getMigrationStatus` query shows migration progress
- **Error handling**: Collects errors without stopping the migration
- **Idempotent**: Can be run multiple times safely
- **Resumable**: If interrupted, run again to continue from where it left off

### Language Detection
The migration automatically detects product language:
- Checks for common French words ("le", "la", "les", "pour", etc.)
- Defaults to the specified `defaultLanguage` if uncertain
- Stores detected language in `originalLanguage` field

### Keyword Generation
Keywords are generated from:
- Product name (all words >2 characters)
- Category name and related keywords
- Description (top 10 most relevant words, excluding stop words)
- Category-specific keyword mappings (e.g., "electronics" → ["electronic", "device", "gadget"])

## Performance Considerations
- All product lookups use `isSearchable` index
- Candidate lookups use `productId_approved` index
- Supplier details fetched in batch (prevents N+1)
- Hard limits on all list queries (100-1000 items)

### Monitoring
Watch for:
- "Too many bytes read in a single function execution"
- Slow query logs in Convex dashboard
- DeepL API rate limits

### Scaling Recommendations
- If >10,000 products: Add pagination to `computeProductMatches`
- If >1,000 suppliers: Add category pre-filtering
- Consider caching match scores for stable data
- Use Convex crons for periodic match recomputation

## Security

### Authorization
- `createQuoteRequest`: Public (anyone can request quotes)
- `approveCandidate`: Admin only
- `setProductTranslation`: Admin only
- `batchTranslateProducts`: Admin only

### Data Access
- Quote requests only visible to: buyer (by email), involved suppliers, admins
- Supplier candidates only visible if `isApproved: true`

## Testing

### Unit Tests
Test match scoring algorithm with various inputs.

### Integration Tests
- Test search with different filters
- Test RFQ creation flow
- Test translation flow

### Manual Testing Checklist
- [ ] Search returns products with suppliers
- [ ] Supplier match badges display correctly
- [ ] RFQ form validates properly
- [ ] RFQ submission creates database entries
- [ ] Translations display in correct language
- [ ] Fallback to original language works

## Files Created/Modified

### New Files
1. `convex/productSourcing.ts` - Supplier matching logic
2. `convex/productSearch.ts` - Search queries with i18n
3. `convex/productTranslation.ts` - DeepL translation integration
4. `convex/quoteRequests.ts` - RFQ system
5. `convex/productMigration.ts` - **Migration scripts for products and supplier matches**
6. `src/hooks/useProductSourcing.ts` - React hooks
7. `src/components/QuoteRequestForm.tsx` - RFQ form component

### Modified Files
1. `convex/schema.ts` - Added new tables and indexes
2. `convex/users.ts` - Added `_getUserByEmail` internal query
3. `convex/products.ts` - Added `_getProductByIdInternal`
4. `src/i18n/local/en/products.ts` - Added RFQ translations
5. `src/i18n/local/fr/products.ts` - Added French translations

## Next Steps

1. **Deploy schema**: `npx convex dev`
2. **Update products**: Set `isSearchable: true` on existing products
3. **Compute matches**: Run `computeProductMatches` for all products
4. **Configure DeepL**: Add API key to environment
5. **Test search**: Verify products appear with suppliers
6. **Test RFQ**: Submit test quote request

## Support

For issues:
1. Check Convex dashboard logs
2. Verify indexes are being used (check query performance)
3. Confirm DeepL API key is valid
4. Ensure products have `isSearchable: true`
