## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-06-16 - [Product Search Complexity & I/O Optimization]
**Learning:** In Convex search actions handling thousands of items, O(N²) patterns (like .find inside a loop) and redundant string normalization (toLowerCase) create CPU bottlenecks. Parallelizing sequential database queries with Promise.all significantly reduces total request latency.
**Action:** Use Map-based lookups for O(1) correlation, consolidate multiple array passes into single-pass filters, and pre-calculate normalized strings before entering hot loops.
