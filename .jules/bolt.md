## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-05-30 - [Product Search Efficiency]
**Learning:** Performing $O(N)$ array lookups (like `.find()`) inside nested loops for category-to-supplier mapping creates an exponential performance degradation as the dataset grows. In `searchProducts`, this was $O(Categories \times Suppliers \times Products)$.
**Action:** Always use a `Map` for $O(1)$ lookups when matching items across lists in hot paths. Additionally, parallelize independent database queries using `Promise.all` to minimize total latency.
