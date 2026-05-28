## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-05-28 - [Product Search Association Optimization]
**Learning:** Associating suppliers to products by category using `.find()` or manual loops inside a search result set creates an O(N*M) bottleneck. Parallelizing database fetches with `Promise.all` is essential for independent category lookups.
**Action:** Use Map-based O(1) lookups for case-insensitive associations and always parallelize independent database queries in Convex actions.
