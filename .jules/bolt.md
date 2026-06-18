## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Stats Aggregation Bottlenecks]
**Learning:** Sequential `await` calls for database fetches in stats-heavy functions create unnecessary latency. Also, nested loops for grouping (e.g., $O(Categories \times Suppliers)$) cause significant CPU overhead that can be avoided with $O(N)$ Map-based aggregations.
**Action:** Use `Promise.all` for parallel database fetches. Replace nested iterations with single-pass Map-based aggregations for grouping and counting. Consolidate multiple `.filter()` passes into a single loop.
