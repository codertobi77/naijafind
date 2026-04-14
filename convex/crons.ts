import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// NOTE: All cron jobs have been temporarily disabled
// To re-enable, uncomment the relevant sections below

/**
 * Cron job: Update global admin stats every 5 minutes
 * This ensures admin dashboard stats are always up-to-date
 */
// crons.interval(
//   "updateGlobalStats",
//   { minutes: 5 },
//   internal.statsCron.recalculateGlobalStats,
//   {}
// );

/**
 * Cron job: Update supplier stats every 10 minutes
 * Each supplier gets their own stats updated
 */
// crons.interval(
//   "updateSupplierStats",
//   { minutes: 10 },
//   internal.statsCron.recalculateAllSupplierStats,
//   {}
// );

/**
 * Cron job: Update homepage/user stats every 15 minutes
 * These are stats shown to regular users on the homepage
 */
// crons.interval(
//   "updateHomepageStats",
//   { minutes: 15 },
//   internal.statsCron.recalculateHomepageStats,
//   {}
// );

/**
 * Cron job: Update category stats every 30 minutes
 * Category counts can be updated less frequently
 */
// crons.interval(
//   "updateCategoryStats",
//   { minutes: 30 },
//   internal.statsCron.recalculateCategoryStats,
//   {}
// );

/**
 * Cron job: Daily cleanup and full recalculation every 24 hours
 * Ensures all stats are fully accurate once per day
 */
// crons.interval(
//   "dailyStatsCleanup",
//   { hours: 24 },
//   internal.statsCron.recalculateGlobalStats,
//   {}
// );

export default crons;
