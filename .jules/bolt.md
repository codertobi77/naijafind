## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-06-21 - [Convex Query Optimization and Parallelization]
**Learning:** In Convex, both `.collect()` and `.take(n)` are terminal operations that return a Promise. Chaining `.collect()` after `.take(n)` is a syntax error. Also, while database operations are sequential, using `Promise.all` for multiple `ctx.db` calls significantly reduces total request latency by overlapping asynchronous overhead.
**Action:** Use `Promise.all` for independent database fetches and avoid chaining terminal query methods. Replace multiple `.filter()` passes with single-pass loops for O(N) aggregation.
