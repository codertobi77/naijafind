## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2025-05-15 - [Sequential Database Queries & Array Iteration]
**Learning:** Sequential database queries (using `await` in a loop) in Convex actions cause unnecessary latency that scales with the number of items. Furthermore, multiple `.map()` and `.filter()` passes on large arrays introduce redundant iteration overhead.
**Action:** Use `Promise.all` to parallelize independent database queries and consolidate multiple array transformations into a single loop.

## 2025-05-15 - [O(N^2) Loop Bottleneck in Translations]
**Learning:** Using `.find()` inside a loop to map batch processing results back to their source items creates an $O(N^2)$ bottleneck that degrades performance as batch size or data volume increases.
**Action:** Replace `.find()` lookups with $O(1)$ direct array indexing or Map-based lookups.
