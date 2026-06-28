## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2025-05-22 - [Search Suggestions Optimization]
**Learning:** Sequential awaits and N+1 query patterns in search actions can significantly increase latency, especially when combined with external API calls like DeepL. Additionally, O(N²) deduplication logic in hot paths creates unnecessary CPU overhead.
**Action:** Always use Promise.all for independent data fetches and external API calls. Pre-calculate lookup Maps for related data to replace inner loops that perform database queries. Use Sets for efficient O(N) deduplication.
