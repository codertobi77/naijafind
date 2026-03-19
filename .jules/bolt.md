## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-03-20 - [Single-Pass Product Search Optimization]
**Learning:** Sequential 'await' calls inside loops for category-based queries in Convex actions (e.g., fetching suppliers) significantly inflate wall-clock time. Furthermore, performing multiple '.filter()' and '.map()' passes on large data sets (like the 7753 products in this app) results in unnecessary memory allocations and redundant iterations.
**Action:** Use 'Promise.all' to parallelize database queries and consolidate multiple array transformations into a single 'for...of' loop to achieve O(N) complexity in a single pass.
