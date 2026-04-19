## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-04-19 - [Search & Suggestion Parallelization]
**Learning:** Sequential 'await' calls in loops for independent database queries (like fetching suppliers per category) significantly increase latency due to cumulative RTT. Consolidating multiple filter passes into a single loop and using Map-based lookups ((1)$) instead of nested '.find()' ((N)$) provides substantial CPU efficiency gains when processing large result sets (e.g., 10k products).
**Action:** Always parallelize independent 'ctx.runQuery' calls with 'Promise.all' and prioritize Map-based indexing for data association in actions.
