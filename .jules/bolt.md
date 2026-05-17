## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Real-time Aggregation Optimization]
**Learning:** Real-time statistics queries in Convex that use `.collect()` on multiple tables often suffer from unnecessary sequential wait times and redundant CPU cycles. Multiple `.filter()` passes on the same array are less efficient than a single `for...of` loop for multi-metric aggregation. Additionally, nested-loop filtering for category-wise stats ($O(C \times S)$) is a common performance pitfall.
**Action:** Always parallelize independent database fetches with `Promise.all`. Consolidate multiple filter/reduce operations on a single collection into a single-pass loop. Use Map-based grouping to achieve $O(C + S)$ complexity for category-wise breakdowns.
