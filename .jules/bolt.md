## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2026-05-31 - [Search Algorithmic & I/O Optimization]
**Learning:** Sequential 'ctx.runQuery' calls in loops and nested 'Array.find' operations create massive bottlenecks in Convex actions. Refactoring to 'Promise.all' for I/O and Map-based lookups for (1)$ access significantly improves latency.
**Action:** Parallelize database fetches and hoist lookups into Maps before entering hot loops.
