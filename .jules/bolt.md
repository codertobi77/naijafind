## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-29 - [Search Suggestions Optimization]
**Learning:** Sequential database queries inside loops (N+1 problem) can occur even when the required data is already fetched in a parent context. Parallelizing top-level data fetches and using in-memory Map lookups is highly effective for reducing latency in action handlers.
**Action:** Always check if data being queried in a loop is already available in a broader collection fetched earlier in the same function. Use Set for O(1) deduplication instead of O(N) array checks.
