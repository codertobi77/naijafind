## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Supplier Fetching N+1 in Search]
**Learning:** Sequential category-based supplier fetches (using await in a loop) in the search pipeline created a linear latency growth proportional to the number of unique categories in the result set. Consolidating product filtering into a single pass and using Maps for (1)$ product-to-category mapping enables safe parallelization.
**Action:** Always use Promise.all for batch lookups and utilize Maps to preserve relationships between items without nested O(N) searches.
