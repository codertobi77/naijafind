## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Consolidated Stats Aggregation]
**Learning:** Sequential database fetches and multiple `.filter()` passes on large datasets (10k items) in Convex queries create unnecessary latency and CPU overhead. Nested $O(C \times S)$ loops for category stats are particularly dangerous as they scale poorly.
**Action:** Always parallelize independent database queries using `Promise.all`. Consolidate multiple filtering passes into a single-pass `for...of` loop, and use `Map` or `Record` for $O(N)$ aggregations to replace nested $O(N^2)$ logic.
