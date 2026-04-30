## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Consolidated Stats Aggregation]
**Learning:** Sequential `.filter()` calls and nested loops (O(C*S)) on large Convex collections (Suppliers, Products) lead to significant execution overhead and potential timeout risks as the database grows. Single-pass loops with Map-based lookups drastically reduce CPU time and memory pressure.
**Action:** Always prefer single `for...of` loops over multiple functional transformations (`filter`, `map`, `reduce`) when processing large Convex result sets in queries or actions.
