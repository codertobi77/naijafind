## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-24 - [Search Latency & Indexing]
**Learning:** In the product search pipeline, sequential database queries for each product category create a linear latency bottleneck ((C \times RTT)$). Additionally, matching categories back to products using `.find()` inside the supplier loop creates an (P \times C)$ CPU bottleneck for large result sets.
**Action:** Use `Promise.all()` for concurrent database queries and pre-index products into a `Map` by category for (1)$ lookups in hot loops.
