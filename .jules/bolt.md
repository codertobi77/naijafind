## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-04-10 - [Search and Translation Hot Path Optimization]
**Learning:** Sequential await calls in Convex actions (e.g., fetching suppliers for multiple categories) significantly inflate RTT. Additionally, using `.find()` inside batch processing loops (like multilingual translation) creates an O(N²) bottleneck as results scale.
**Action:** Always parallelize independent database queries using `Promise.all` and replace repetitive array lookups with O(1) Map indexing or direct array access when indices are aligned.
