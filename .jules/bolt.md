## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2025-05-15 - [Sequential vs Parallel I/O in Convex]
**Learning:** While Convex database operations are sequential, using `Promise.all` for multiple `ctx.runQuery` or `ctx.db` calls still significantly reduces latency by overlapping the overhead of initiating and awaiting multiple asynchronous operations. Furthermore, N+1 query patterns in actions (e.g., fetching suppliers for each matched category) can be eliminated by pre-calculating in-memory Maps from already-fetched bulk data.
**Action:** Always parallelize initial data fetching in actions/queries and prefer O(1) Map-based lookups over O(N) database queries in loops when the data is already available in the session.
