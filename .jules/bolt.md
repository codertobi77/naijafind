## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Stats Aggregation Optimization]
**Learning:** Sequential database fetches in dashboard statistics functions create linear latency growth. Furthermore, nested O(N*M) filtering logic for category breakdowns significantly impacts CPU time as the dataset grows.
**Action:** Parallelize independent database fetches using `Promise.all` and replace nested filtering with single-pass O(N+M) aggregation using Map/Object lookups.
