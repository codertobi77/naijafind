## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Parallel Database Queries in Convex Actions]
**Learning:** Sequential 'await' calls for independent database queries within loops (e.g., fetching suppliers for multiple categories) create a major Round-Trip Time (RTT) bottleneck. Combining this with (N)$ lookups inside hot loops compound the latency.
**Action:** Always use 'Promise.all' for independent queries and Map-based lookups for (1)$ cross-referencing between datasets in search actions.
