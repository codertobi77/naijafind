## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [O(C*S) to O(C+S) Aggregation Optimization]
**Learning:** Functions that aggregate statistics across categories (C) for a large list of items (S, like suppliers) can easily fall into O(C*S) traps by using .filter() inside a .map() over categories.
**Action:** Use a Map to perform a single-pass aggregation over the items O(S), then map the categories to the pre-aggregated results O(C), achieving O(C+S) complexity.
