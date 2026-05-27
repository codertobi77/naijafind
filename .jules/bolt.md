## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-05-27 - [Algorithmic Efficiency in Stats Aggregation]
**Learning:** Performing nested `.filter()` calls within a loop over categories creates an $O(C \times S)$ bottleneck that scales poorly as the number of categories and suppliers grows. Sequential database fetches also add unnecessary round-trip latency.
**Action:** Use `Promise.all` for parallel database fetches and implement Map-based single-pass aggregation loops ($O(N)$) to replace multiple array traversals.
