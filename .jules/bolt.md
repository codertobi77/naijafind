## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Native Counts and Single-Pass Aggregation]
**Learning:** Replacing `.take(N).length` with native Convex `.count()` significantly reduces data transfer and memory usage, especially for metadata badges. Furthermore, replacing multiple `.filter()` passes on large collected arrays with single-pass aggregation loops (O(N)) or Map-based lookups (O(C+S)) eliminates redundant CPU cycles in dashboard statistics.
**Action:** Always prefer `.count()` for simple document counting. When calculating multiple statistics from a dataset, use a single `for...of` loop to increment counters instead of chaining multiple `.filter()` calls.
