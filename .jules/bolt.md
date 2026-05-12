## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2025-05-14 - [Stats Aggregation Efficiency]
**Learning:** In Convex queries aggregating across multiple tables, fetching data sequentially with `await` and then using multiple `.filter()` passes on large arrays (e.g. 10k items) creates significant latency and CPU overhead.
**Action:** Parallelize database queries using `Promise.all` and consolidate data aggregation into single-pass loops. For category-based breakdowns, use a `Map` to reduce complexity from $O(C \times S)$ to $O(C + S)$.
