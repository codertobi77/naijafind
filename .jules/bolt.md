## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Stats Aggregation Optimization]
**Learning:** Chaining multiple `.filter()` calls or nested loops ((N \times M)$) on large Convex datasets (suppliers/products) significantly increases query execution time and memory usage. Parallelizing `ctx.db` calls with `Promise.all` is essential for reducing total request latency.
**Action:** Use single-pass aggregation loops and `Map`-based lookups to reduce complexity to (N)$. Always parallelize independent database fetches.
