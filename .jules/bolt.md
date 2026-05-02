## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Consolidated Search Pipeline]
**Learning:** Sequential .filter() and .map() operations on large datasets (10,000+ items) in Convex actions lead to measurable CPU overhead. Combining these into a single for-of loop reduces iteration count and allows for pre-calculating lookup Maps for downstream scoring logic.
**Action:** Always prefer single-pass loops for data transformation in actions handling RAW_LIMIT datasets. Use Map-based indexing during the first pass to eliminate subsequent O(N) searches.
