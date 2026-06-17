## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-06-17 - [Real-time Stats Aggregation Optimization]
**Learning:** In Convex, while database operations within a query or action are executed sequentially on a single thread, using `Promise.all` for multiple `ctx.db` calls is still beneficial as it overlaps the overhead of initiating and awaiting multiple asynchronous database operations, reducing total request latency. Additionally, replacing O(C * S) nested category-supplier loops with O(C + S) Map-based aggregation provides a major performance boost for large datasets.
**Action:** Always parallelize independent database fetches with `Promise.all` and use single-pass `Map` or `Set` lookups for relational aggregations in Convex queries.
