## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-22 - [Batch Mapping & Sequential I/O Bottlenecks]
**Learning:** Using `.find()` or `.filter()` inside loops to map batch results (like translations) back to source items creates an (N^2)$ bottleneck that scales poorly with result size. In Convex actions, sequential `await ctx.runQuery` calls in loops create unnecessary RTT overhead.
**Action:** Use `Map` for (1)$ batch result mapping and parallelize independent database queries with `Promise.all` to minimize latency. Always consolidate multiple array transformation passes into a single loop to reduce iteration overhead.
