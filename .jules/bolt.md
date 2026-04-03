## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2025-05-14 - [Query Parallelization and O(N²) Bottlenecks]
**Learning:** Sequential database queries in Convex actions create significant RTT overhead that scales with the number of unique categories or related items. Additionally, using `.find()` inside loops over large batch result sets (like translations) creates an O(N²) bottleneck that can be avoided if order is preserved.
**Action:** Always use `Promise.all` for independent database queries in Convex actions and use direct array indexing instead of `.find()` when mapping batch results back to source items.
