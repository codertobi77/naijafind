## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-24 - [Stats Aggregation Parallelization and Complexity Reduction]
**Learning:** In Convex functions that aggregate data across multiple tables, sequential `await` calls and nested `.filter()` calls within `.map()` create significant latency and CPU overhead. Parallelizing I/O and using Map-based $O(C+S)$ aggregation instead of $O(C \times S)$ provides immediate gains.
**Action:** Always use `Promise.all` for independent database queries in the same function. Use single-pass traversal over main data arrays to populate pre-initialized Maps/Records for category or status-based counting.
