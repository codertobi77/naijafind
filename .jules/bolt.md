## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2025-05-15 - [Efficient Real-time Statistics Aggregation]
**Learning:** Chaining multiple `.filter()` calls or using nested loops (e.g., iterating suppliers for every category) on collections of ~10,000 items creates $O(N \times K)$ complexity and high CPU overhead. In Convex, this can lead to execution timeouts and increased latency.
**Action:** Replace multiple passes with single-pass `for...of` loops and use `Map` or objects for categorization. Parallelize independent database fetches with `Promise.all` to overlap async I/O overhead.
