## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Stats Aggregation Optimizations]
**Learning:** Statistics functions often perform sequential database queries and nested array operations (e.g., `.filter()` inside a `.map()`), leading to O(N*M) complexity and high latency.
**Action:** Use `Promise.all` to parallelize independent data fetches and replace nested filters with single-pass loops or Map-based aggregations to achieve O(N+M) complexity.
