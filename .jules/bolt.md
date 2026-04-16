## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-04-16 - [Convex Action Search Optimization]
**Learning:** Sequential database queries inside loops (N+1 at the action level) and repeated array transformations/lookups significantly degrade performance in Convex actions handling large datasets. Map-based lookups and Promise.all parallelization are critical for sub-second response times.
**Action:** Always audit for 'await' inside loops when calling internal queries and replace O(N) .find() calls with pre-indexed Map lookups for category/supplier associations.
