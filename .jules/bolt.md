## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.
## 2026-06-20 - [Stats Calculation Optimization]
**Learning:** In statistics aggregation queries, sequential database fetches and nested O(N*M) loops create significant latency as the dataset grows. Using Promise.all for fetches and Map-based single-pass aggregation reduces complexity to O(N+M).
**Action:** Always parallelize independent database queries and use Maps/Objects for lookups instead of nested .filter() calls in aggregation logic.
