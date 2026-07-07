## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-07-07 - [Search Parallelization and Map Lookups]
**Learning:** Sequential 'ctx.runQuery' calls in Convex actions create linear latency growth relative to the number of categories. Additionally, nested loops for case-insensitive matching ((C \times P)$) significantly bottleneck CPU when scaling to thousands of products.
**Action:** Always parallelize independent database queries using 'Promise.all' in actions, and use Map-based O(1) lookups for case-insensitive and category-based associations.
