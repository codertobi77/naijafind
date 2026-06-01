## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2025-05-24 - [O(N^2) Lookup Anti-pattern in Search]
**Learning:** Using `.find()` or `.filter()` inside loops to map batch database results back to their source items (e.g., matching a product to its category's suppliers) creates a hidden $O(N^2)$ CPU bottleneck that can exceed database latency on large result sets.
**Action:** Always implement a Map-based $O(1)$ lookup table when processing batch query results against a source list.
