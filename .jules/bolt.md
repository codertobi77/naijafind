## 2024-05-22 - [Search Optimization Bottlenecks]
**Learning:** In Convex actions handling large datasets (up to 10k items), redundant lowercasing and array conversions (e.g., `Array.from(Set)`) inside loops create significant CPU bottlenecks. Additionally, fetching global metadata like "all supplier categories" on every request scales poorly.
**Action:** Pre-calculate array forms of Sets, implement memoization for repetitive lookups like `isServiceCategory`, and refine database queries to target only the categories present in the current result set.

## 2024-05-23 - [Multilingual Search & Cache Optimization]
**Learning:** Batching translations without deduplication leads to redundant API calls and O(N²) mapping bottlenecks. Additionally, simple character-summation hashes for translation caches are highly collision-prone (e.g., anagrams).
**Action:** Use a Set for deduplicating strings before batch translation and a Map for O(1) lookups when applying results. Implement a 32-bit (DJB2-like) hash with string length for robust cache keys.
