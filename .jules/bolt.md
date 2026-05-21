## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-05-21 - [Dashboard and Stats Aggregation Optimization]
**Learning:** Sequential awaits in Convex queries for multiple independent collections cause additive latency. Algorithmic complexity of $O(C \times S)$ in dashboard aggregations (categories x suppliers) risks execution timeouts as the dataset grows (e.g., 1k categories * 10k suppliers).
**Action:** Parallelize database fetches with `Promise.all` and use single-pass Map-based aggregations to reduce complexity to $O(C + S)$. Always prioritize `withIndex` over manual `.filter()` for indexed fields.
