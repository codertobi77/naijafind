## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-07-03 - [Stats Aggregation Optimization]
**Learning:** In Convex queries performing heavy data aggregation (like dashboard stats), sequential database fetches and multiple O(N) passes over collected arrays (using `.filter()`) significantly increase latency.
**Action:** Use `Promise.all` to parallelize all `ctx.db` calls and refactor multiple filter passes into single-pass `for...of` loops or Map-based aggregations to achieve O(N) or O(N+M) complexity.
