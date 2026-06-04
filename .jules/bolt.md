## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-06-04 - [Stats Aggregation Optimization]
**Learning:** Nested `.filter()` calls inside a `.map()` loop (O(C * S)) on large datasets (10k items) create significant latency in Convex queries. Parallelizing independent database fetches with `Promise.all` can also drastically reduce total execution time.
**Action:** Replace nested loops with single-pass aggregation using `Map` or objects for O(1) lookups. Always parallelize non-dependent database queries using `Promise.all`.
