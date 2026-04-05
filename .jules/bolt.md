## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Convex Action Parallelization]
**Learning:** Sequential database queries (using `await` in a loop) inside Convex actions create significant latency bottlenecks. Combining multiple array transformations (map/filter) into a single pass is critical when processing the 10,000 product "search base".
**Action:** Parallelize independent database queries using `Promise.all` and consolidate data processing into single-pass loops to minimize RTT and CPU overhead.
