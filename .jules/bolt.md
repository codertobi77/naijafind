## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.
## 2026-06-02 - [O(C+S) Stats Aggregation]
**Learning:** Nested filtering in stats queries (e.g., (C \times S)$) creates significant CPU overhead when datasets reach 1,000 categories and 10,000 suppliers. Map-based aggregation allows for a single (S)$ pass followed by (1)$ lookups.
**Action:** Use Map-based aggregation for any cross-table statistics or counts to ensure linear scaling as the database grows.
