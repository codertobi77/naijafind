/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adBanners from "../adBanners.js";
import type * as admin from "../admin.js";
import type * as adminImport from "../adminImport.js";
import type * as adminProductImport from "../adminProductImport.js";
import type * as categories from "../categories.js";
import type * as checkMigration from "../checkMigration.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as messages from "../messages.js";
import type * as migration from "../migration.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as productDictionary from "../productDictionary.js";
import type * as productMigration from "../productMigration.js";
import type * as productSearch from "../productSearch.js";
import type * as productSourcing from "../productSourcing.js";
import type * as productTranslation from "../productTranslation.js";
import type * as products from "../products.js";
import type * as purchaseRequests from "../purchaseRequests.js";
import type * as quoteRequests from "../quoteRequests.js";
import type * as rateLimit from "../rateLimit.js";
import type * as reviews from "../reviews.js";
import type * as searchNative from "../searchNative.js";
import type * as searchSuggestions from "../searchSuggestions.js";
import type * as sendEmail from "../sendEmail.js";
import type * as stats from "../stats.js";
import type * as statsCron from "../statsCron.js";
import type * as statsOptimized from "../statsOptimized.js";
import type * as supplierSearches from "../supplierSearches.js";
import type * as suppliers from "../suppliers.js";
import type * as suppliersInternal from "../suppliersInternal.js";
import type * as translation from "../translation.js";
import type * as users from "../users.js";
import type * as verification from "../verification.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adBanners: typeof adBanners;
  admin: typeof admin;
  adminImport: typeof adminImport;
  adminProductImport: typeof adminProductImport;
  categories: typeof categories;
  checkMigration: typeof checkMigration;
  crons: typeof crons;
  dashboard: typeof dashboard;
  emails: typeof emails;
  http: typeof http;
  init: typeof init;
  messages: typeof messages;
  migration: typeof migration;
  migrations: typeof migrations;
  notifications: typeof notifications;
  productDictionary: typeof productDictionary;
  productMigration: typeof productMigration;
  productSearch: typeof productSearch;
  productSourcing: typeof productSourcing;
  productTranslation: typeof productTranslation;
  products: typeof products;
  purchaseRequests: typeof purchaseRequests;
  quoteRequests: typeof quoteRequests;
  rateLimit: typeof rateLimit;
  reviews: typeof reviews;
  searchNative: typeof searchNative;
  searchSuggestions: typeof searchSuggestions;
  sendEmail: typeof sendEmail;
  stats: typeof stats;
  statsCron: typeof statsCron;
  statsOptimized: typeof statsOptimized;
  supplierSearches: typeof supplierSearches;
  suppliers: typeof suppliers;
  suppliersInternal: typeof suppliersInternal;
  translation: typeof translation;
  users: typeof users;
  verification: typeof verification;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  migrations: {
    lib: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { name: string },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
      cancelAll: FunctionReference<
        "mutation",
        "internal",
        { sinceTs?: number },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { limit?: number; names?: Array<string> },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      migrate: FunctionReference<
        "mutation",
        "internal",
        {
          batchSize?: number;
          cursor?: string | null;
          dryRun: boolean;
          fnHandle: string;
          name: string;
          next?: Array<{ fnHandle: string; name: string }>;
          oneBatchOnly?: boolean;
        },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
    };
  };
};
