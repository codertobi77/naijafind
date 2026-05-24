## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2025-05-15 - [Batch Fetching and Single-Pass Aggregation]
**Learning:** Sequential 'await' calls for multiple database tables in stats queries create significant cumulative latency. Additionally, using '.filter().length' multiple times on large arrays (like suppliers or products) is inefficient compared to a single-pass aggregation loop.
**Action:** Use Promise.all for all primary data fetches and consolidate multiple filtering requirements into a single 'for...of' loop to minimize iterations over large datasets.
