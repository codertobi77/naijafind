## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Supplier Search Scoring Optimization]
**Learning:** Relevance scoring in search actions that involves cross-referencing products (e.g., S suppliers x P matching products) creates an O(S x P) bottleneck. Redundant string transformations (e.g., .toLowerCase(), .split()) inside loops also compound CPU overhead.
**Action:** Use a Map to group products by supplierId before entering the loop, changing complexity to O(S + P). Hoist all search-wide invariants (bigrams, search phrase, lowercased categories) out of the scoring loop.
