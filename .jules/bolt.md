## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Optimization of Real-time Statistics]
**Learning:** In Convex queries aggregating data across tables (e.g., categories and suppliers), nested loops create (C \times S)$ bottlenecks that scale poorly. Parallelizing database fetches with `Promise.all` and using single-pass Map-based aggregations drastically reduces both I/O wait time and CPU usage. Using `.count()` instead of `.collect().length` for large tables (like reviews or products) where document content isn't needed saves significant bandwidth and memory.
**Action:** Always prefer `Promise.all` for independent sequential database calls. Replace nested loops with Map-based single-pass aggregations for (N)$ complexity. Use `.count()` for counting documents when metadata/content isn't required.
