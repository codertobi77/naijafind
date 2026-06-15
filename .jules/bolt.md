## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-06-15 - [Supplier Search Optimization]
**Learning:** In the `searchSuppliers` action, sequential database queries for multiple categories and redundant string operations (lowercasing, joining) inside the hot supplier scoring loop were major bottlenecks. Pre-calculating product-related scores and hoisting invariant computations reduced complexity from O(S * P) to O(S + P) for string processing.
**Action:** Always parallelize independent database queries with `Promise.all` and use `Set` for O(1) lookups in filtering/sorting logic. Pre-process and hoist all computations that don't depend on the loop variable.
