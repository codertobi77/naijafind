## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-06-15 - [Search Suggestions Latency Reduction]
**Learning:** High-frequency actions like search suggestions suffer from compounded latency when fetching data sequentially. Parallelizing multiple `ctx.runQuery` calls with `Promise.all` and pre-grouping results into an in-memory `Map` eliminates N+1 query patterns within a single execution context.
**Action:** Always parallelize independent database lookups and use local Maps to resolve category/parent relationships instead of repeated nested queries.
