## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Stats Aggregation Parallelization]
**Learning:** Sequential database fetches and nested O(N*M) aggregation loops in Convex queries create avoidable latency and CPU overhead, especially as the database grows. Parallelizing independent `ctx.db` calls significantly reduces round-trip time.
**Action:** Always use `Promise.all` for independent database fetches and replace nested `.filter()` calls with Map-based O(N+M) lookups for multi-table statistics.
