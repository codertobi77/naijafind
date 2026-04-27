## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-04-27 - [Convex Search Parallelization & Map Optimization]
**Learning:** Sequential database queries in Convex actions (e.g., using `for...of` with `ctx.runQuery`) create unnecessary latency. Additionally, using `.find()` or `.filter()` inside loops to map batch results back to source items is an O(N^2) anti-pattern.
**Action:** Use `Promise.all` for independent database queries and implement `Map`-based lookups for O(1) correlation of results to source data.
