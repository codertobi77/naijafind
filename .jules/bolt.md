## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Review Mutations Bottleneck]
**Learning:** Review mutations (`createReview`, `updateReview`, `deleteReview`) in `convex/reviews.ts` currently fetch all reviews for a supplier (up to 1000) to recalculate average ratings and counts. This creates an $O(N)$ performance bottleneck that increases database I/O and CPU usage as more reviews are added.
**Action:** Replace full recalculations with $O(1)$ incremental updates using the formula: `new_avg = (old_avg * old_count + rating_change) / new_count`.
