## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Parallelization and Loop Consolidation]
**Learning:** Parallelizing independent database queries in Convex actions using `Promise.all` significantly reduces response latency by overlapping Round-Trip Times (RTT). Additionally, combining multiple array transformations (map, filter) into a single loop reduces both iteration overhead and intermediate array creation, which is critical when processing thousands of items.
**Action:** Always look for opportunities to use `Promise.all` for independent queries and favor single-pass loops over chained `.filter().map()` calls for performance-critical paths.
