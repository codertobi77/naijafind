## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2025-05-15 - [Stats Aggregation Complexity]
**Learning:** Nested `.filter()` calls inside a `.map()` loop (e.g., `categories.map(c => suppliers.filter(s => s.category === c.name))`) create O(C * S) complexity. In the admin dashboard where all suppliers, users, and reviews are fetched, sequential `.filter()` and `.reduce()` calls on the same large arrays add significant overhead.
**Action:** Use a `Map` for category-based aggregation in a single pass over suppliers. For global counts, use a single `for...of` loop with multiple counters to minimize array traversals.
