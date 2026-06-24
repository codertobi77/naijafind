## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-06-24 - [Product Search Multi-Bottleneck Optimization]
**Learning:** Sequential await loops (N+1 patterns) for category-to-supplier fetches and multiple iteration passes on large result sets (10k items) significantly increase search latency and CPU overhead. Case-insensitive lookups using linear scans further exacerbate performance degradation.
**Action:** Consolidate multiple filter/map passes into a single iteration, use Promise.all for parallel database fetches, and implement secondary Map-based O(1) lookups for case-insensitive matching.
