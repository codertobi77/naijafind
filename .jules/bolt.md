## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.
## 2026-06-11 - [Dictionary Expansion Hoisting]
**Learning:** Calling query expansion functions like `expandQueryWithDictionary` inside loops (e.g., scoring hundreds of products) creates significant CPU overhead because it redundantly re-processes the same query for every item.
**Action:** Always hoist expansion/normalization logic outside of hot loops and pass the pre-calculated results into scoring or filter functions.
