## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Single-Pass Aggregation vs. Multi-Filter Pattern]
**Learning:** In Convex queries handling large collections (suppliers, products, users), the common pattern of chaining multiple `.filter()` and `.reduce()` calls on the same fetched array creates significant CPU overhead. Additionally, sequential awaits for independent table fetches increase RTT latency unnecessarily.
**Action:** Use `Promise.all` to parallelize independent queries and implement a single `for...of` loop to aggregate multiple counts, sums, and status flags in one pass, reducing time complexity from $O(k \cdot N)$ to $O(N)$. Always ensure that derived length variables (e.g., `totalSuppliers`) are correctly mapped to the new array references after refactoring.
