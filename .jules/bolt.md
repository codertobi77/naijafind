## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-03-21 - [Query Parallelization and Map Lookups]
**Learning:** Sequential 'ctx.runQuery' calls inside loops in Convex actions significantly increase RTT. Additionally, using '.find()' on large result sets within these loops creates O(N^2) complexity.
**Action:** Always parallelize independent internal queries using 'Promise.all' and use Maps for O(1) lookups when matching related data across collections.
