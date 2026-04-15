## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2025-05-15 - [Aggressive Search Pipeline Optimization]
**Learning:** In the `searchProducts` action, sequential `ctx.runQuery` calls for category-based suppliers were creating a significant bottleneck as the number of inferred categories grew. Furthermore, using `.find()` inside the supplier scoring loop created an $O(N \cdot M)$ complexity where $N$ is suppliers and $M$ is results.
**Action:** Always parallelize independent Convex queries with `Promise.all`. Use Maps for $O(1)$ lookups when matching entities (e.g., categories to products) to avoid quadratic complexity in search pipelines.
