## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-04-29 - [Standardizing Aggregation Patterns]
**Learning:** When refactoring O(N*M) filters to O(N+M) loops in aggregation logic, it's critical to pre-initialize the result Map/Record with all expected keys (e.g., active categories) to maintain behavioral consistency (like including zero-count items) while gaining performance.
**Action:** Always check if the original logic relied on a specific set of keys and initialize the optimized Map accordingly before starting the single-pass loop.
