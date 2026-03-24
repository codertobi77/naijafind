## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Parallel Database Fetching & Map Lookups]
**Learning:** Sequential async database queries in Convex actions (e.g., in a loop) create a significant RTT bottleneck. Furthermore, using `Array.find()` inside loops for mapping related data (like products to categories) leads to O(N^2) complexity, which scales poorly as result sets grow.
**Action:** Use `Promise.all` to parallelize independent database queries and replace `Array.find()` with `Map` for O(1) lookups. Additionally, pre-calculate constant strings and stop-word sets at the module level.
