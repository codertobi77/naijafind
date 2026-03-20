## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Parallel Database Queries and O(1) Lookups in Actions]
**Learning:** Sequential `runQuery` calls within `for` loops in Convex actions create significant latency due to multiple round-trip times (RTTs). Additionally, using `.find()` inside nested loops for results mapping leads to $O(N \times M)$ complexity, which degrades rapidly as result sets grow.
**Action:** Always parallelize independent database queries using `Promise.all` and use `Map` for $O(1)$ lookups when correlating results from different data sources or categories.
