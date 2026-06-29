## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-06-29 - [Search Suggestions N+1 and O(N²) Bottlenecks]
**Learning:** Chaining sequential database queries (N+1 pattern) and using O(N²) deduplication logic (e.g., `.filter(index === findIndex)`) in high-frequency search actions significantly degrades performance and scales poorly.
**Action:** Parallelize initial data fetching with `Promise.all`, implement in-memory lookup Maps for related data to eliminate N+1 queries, and use `Set`-based deduplication with early-break conditions to achieve O(N) efficiency.
