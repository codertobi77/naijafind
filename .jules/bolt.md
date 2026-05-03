## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Parallel Query and Map-Based Lookups]
**Learning:** Sequential `await` calls in Convex actions during cross-category lookups significantly inflate RTT. Furthermore, using `.find()` inside a supplier scoring loop creates an $O(N^2)$ bottleneck when matching products to categories.
**Action:** Use `Promise.all` for concurrent category-based supplier queries. Implement a `Map` to index items by category before the loop to achieve $O(1)$ lookups during result assembly.
