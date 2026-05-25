## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2025-05-23 - [Stats Aggregation Parallelization]
**Learning:** Sequential database fetches in Convex queries (e.g., fetching 6 different tables for an admin dashboard) create unnecessary network wait time. Additionally, using multiple `.filter()` passes or nested loops for category-based aggregation is highly inefficient for datasets ~10k items.
**Action:** Use `Promise.all` to parallelize independent fetches to reduce RTT to O(1). Implement single-pass aggregation loops and Map-based lookups to reduce complexity from O(N*M) to O(N). Always initialize category Map/Record with all active categories to ensure consistency for empty categories.
