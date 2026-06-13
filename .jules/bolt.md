## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Stats Aggregation Optimization]
**Learning:** In Convex, while database operations within a query or action are executed sequentially on a single thread, using `Promise.all` for multiple `ctx.db` calls is still beneficial as it overlaps the overhead of initiating and awaiting multiple asynchronous database operations, reducing total request latency. Additionally, replacing (C \times S)$ nested filters with (C + S)$ single-pass Map aggregations significantly improves scalability.
**Action:** Always parallelize independent database fetches and use Map-based aggregations for large datasets to avoid (N^2)$ or (N \times M)$ bottlenecks.
