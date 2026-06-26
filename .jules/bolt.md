## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2025-05-23 - [Stats Aggregation Parallelization & Complexity Reduction]
**Learning:** In Convex backend functions, sequential `await` calls for independent database queries create cumulative latency. Additionally, using multiple `.filter()` calls or nested loops on large result sets (e.g., 10k suppliers) is significantly less efficient than a single-pass aggregation loop.
**Action:** Always use `Promise.all` for independent `ctx.db` calls and prefer single-pass `for...of` loops with `Map`-based lookups to reduce algorithmic complexity from $O(N^2)$ to $O(N)$.
