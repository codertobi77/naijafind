## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Frontend Translation Loop Bottleneck]
**Learning:** In React hooks that process batch API results (like `useMultilingualSearch`), using `.find()` to map flattened results back to their original objects creates an O(N^2) bottleneck. Since batch processing typically preserves request order, direct array indexing is a safe and significant optimization.
**Action:** Use direct index mapping (e.g., `textMapping[globalIndex]`) instead of searching through mapping arrays when processing batch API responses.
