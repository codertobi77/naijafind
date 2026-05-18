## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-05-18 - [Batch Processing Search Results]
**Learning:** In the multilingual search hook, mapping translated batch results back to their source items using `.find()` within a loop creates an (N^2)$ bottleneck. Since batching operations in this codebase typically maintain the order of input items, direct array indexing is both safe and significantly more efficient.
**Action:** Replace `.find()` with direct array indexing (`array[index]`) when processing ordered batch results.
