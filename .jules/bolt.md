## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Stats Aggregation Bottlenecks]
**Learning:** Dashboard and homepage stats functions were using nested `.filter()` calls, leading to $O(C \cdot S)$ complexity ($C$ categories, $S$ suppliers). With 10k suppliers and hundreds of categories, this pattern causes significant CPU overhead and response latency.
**Action:** Replace nested filters with single-pass loops and Map-based aggregation. Pre-initialize aggregators with all active categories to ensure response consistency for items with zero counts.
