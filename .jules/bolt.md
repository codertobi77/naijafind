## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-06-23 - [Stats Aggregation Optimization]
**Learning:** Nested loops (O(C * S)) for statistics aggregation create significant performance degradation as datasets grow. Additionally, sequential database awaits in Convex queries create unnecessary "waterfall" latency.
**Action:** Use Map-based single-pass aggregations to reduce complexity to O(N) and parallelize independent database fetches using Promise.all to minimize total round-trip time.
