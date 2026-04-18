## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [O(N^2) Bottleneck in Translation Mapping]
**Learning:** In the `useMultilingualSearch` hook, mapping batch translation results back to their source items using `.find()` inside the translation loop created an $O(N^2)$ bottleneck. This is particularly impactful when translating large result sets (e.g., search results with multiple translatable fields).
**Action:** Use direct array indexing (O(1)) instead of `.find()` (O(N)) when the mapping array is built in parallel with the translation request array.
