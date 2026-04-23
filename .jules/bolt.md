## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2025-05-15 - [Statistical Aggregation Complexity]
**Learning:** Nested `.filter()` calls inside a `.map()` or loop over large collections (e.g., categories and suppliers) create $O(C \times S)$ bottlenecks that scale poorly. Sequential `await` calls for independent collections further increase RTT latency.
**Action:** Replace nested filtering with single-pass aggregation using Maps to achieve $O(C + S)$ complexity. Parallelize independent database queries with `Promise.all` to minimize total latency.
