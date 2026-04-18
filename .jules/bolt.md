## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Hoisting Constant Computations in Hot Loops]
**Learning:** In scoring algorithms that iterate over large result sets, hoisting redundant operations like bigram generation (`extractNGrams`) and collection normalization (`Array.from(Set)`) outside the loop yields significant performance gains by avoiding O(N) redundant work. Defensive programming (e.g., `String()` safety wrappers) should be preserved to maintain robustness against non-string database values.
**Action:** Always audit `.map()` and `.filter()` loops for computations that are constant relative to the iteration, and hoist them to the outer scope.
