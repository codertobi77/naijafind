## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-06-22 - [Convex API Terminal Operator Pitfalls]
**Learning:** Chaining terminal operators like `.take(n).count()` or `.take(n).collect()` in Convex results in runtime errors. `.take(n)` executes the query and returns an array (wrapped in a Promise), whereas `.count()` is a terminal operator for the query builder itself.
**Action:** When a capped count is needed, use `.take(n)` followed by checking the `.length` of the resulting array, or use `.count()` as the sole terminal operator if no cap is needed.
