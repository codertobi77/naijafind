## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-05-05 - [Stats Aggregation Optimization]
**Learning:** Multiple array passes using `.filter().length` and `.reduce()` on large collections (suppliers, products, users) create significant CPU overhead. Refactoring these into a single `for...of` loop and using `Map`-based aggregations for category breakdowns reduces complexity from $O(C \times S)$ to $O(C + S)$. Parallelizing independent database queries with `Promise.all` also reduces total latency.
**Action:** Use single-pass loops for multi-metric aggregation and parallelize independent Convex database queries to improve performance in data-heavy endpoints.
