/**
 * App Controller
 * ==============
 * Handles application-level CRUD operations in JAYRAM database
 * 
 * This controller is called from: /api/routes/appRoutes.js
 * Uses: AppService for business logic
 * 
 * Endpoints provided:
 * - POST   /api/app/create     - Create new app with 4 collections
 * - GET    /api/app/list       - List all apps with metadata
 * - GET    /api/app/:appName   - Get specific app details
 * - DELETE /api/app/:appName   - Delete app and all collections
 */

import { ok, created, fail } from "../utils/responseHandler.js";
import { AppError } from "../utils/errorHandler.js";
import { requireFields } from "../utils/validator.js";
import AppService from "../services/appService.js";
import firestoreService from "../services/firestoreService.js";
import { createLogger } from "../services/loggerService.js";

// Create file-scoped logger
const logger = createLogger(import.meta.url);

// Wire dependencies here (Composition Root for this use case)
const appService = new AppService({ firestore: firestoreService });

/**
 * POST /api/app/create
 * ====================
 * Create a new application with 4 collections in JAYRAM database
 * Called from: Frontend AppCreationForm via apiService.createApp()
 * 
 * Request Body:
 * {
 *   appName: string,      // e.g., "My Event App"
 *   description?: string, // Optional app description
 *   createdBy: string     // uid of logged-in user (added in 2025-10-18 update)
 * }
 * 
 * What it does:
 * 1. Normalizes app name to prefix (e.g., "My Event App" -> "myeventapp")
 * 2. Creates 4 collections in JAYRAM database:
 *    - myeventapp_pages
 *    - myeventapp_components
 *    - myeventapp_layouts
 *    - myeventapp_theme
 * 3. Creates metadata document in apps_meta collection
 * 4. Also writes ownership link to mudumbai.app_users
 * 
 * Response: { appPrefix, collections }
 */
export const createApp = async (req, res, next) => {
  logger.entry("createApp", { body: req.body });
  
  try {
    const { appName, description = "", createdBy } = req.body || {};
    logger.info("createApp", "Validating request", { appName, createdBy });

    // Validate required fields
    requireFields({ appName, createdBy }, ["appName", "createdBy"]);
    logger.info("createApp", "Validation passed");

    // Call AppService to create app in JAYRAM database
    logger.info("createApp", "Creating app via AppService", { appName, description, createdBy });
    const { collections, appPrefix } = await appService.createApp(appName, description, createdBy);

    logger.info("createApp", "App created successfully", { 
      appPrefix, 
      createdBy, 
      collections: collections.join(",") 
    });

    logger.exit("createApp", { appPrefix });
    return created(
      res,
      { appPrefix, collections, createdBy },
      "App collections and ownership mapping created successfully in JAYRAM & MUDUMBAI"
    );
  } catch (err) {
    logger.error("createApp", "Failed to create app", err);
    return next(err instanceof AppError ? err : new AppError(err.message || "Create app failed", 500));
  }
};

/**
 * GET /api/app/list
 * =================
 * List all applications from JAYRAM database
 * Called from: Frontend Dashboard via apiService.getAllApps()
 * 
 * What it does:
 * 1. Fetches apps belonging to current user (by createdBy or app_users mapping)
 * 2. For each app, counts pages in {appPrefix}_pages collection
 * 3. Returns enhanced app list with page counts
 * 
 * Response: Array of app objects with metadata
 * [
 *   {
 *     appName: "My Event App",
 *     appPrefix: "myeventapp",
 *     collections: [...],
 *     pageCount: 5,
 *     createdAt: "2025-10-10T...",
 *     updatedAt: "2025-10-10T..."
 *   },
 *   ...
 * ]
 */
export const listApps = async (req, res, next) => {
  logger.entry("listApps", { query: req.query });
  
  try {
    const { createdBy } = req.query;
    
    if (!createdBy) {
      logger.warn("listApps", "Missing createdBy parameter");
      return fail(res, 400, "Missing required parameter: createdBy (uid)");
    }

    logger.info("listApps", "Fetching apps for user", { createdBy });

    // Step 1: Fetch apps created by this user in jayram.apps_meta
    logger.debug("listApps", "Querying apps_meta collection");
    const result = await firestoreService.queryDocs("apps_meta", "createdBy", "==", createdBy);
    let apps = result.success ? result.data : [];
    logger.info("listApps", "Direct ownership query result", { count: apps.length });

    // Step 2: If user not direct owner, fallback to mudumbai.app_users mapping
    if (apps.length === 0) {
      logger.debug("listApps", "No direct apps found, checking user mappings");
      const mappingResult = await firestoreService.queryDocs("app_users", "uid", "==", createdBy, "mudumbai");
      
      if (mappingResult.success && mappingResult.data.length > 0) {
        logger.info("listApps", "Found user mappings", { count: mappingResult.data.length });
        const prefixes = mappingResult.data.map(m => m.appPrefix);
        const metaResult = await firestoreService.getDocsByIds("apps_meta", prefixes);
        apps = metaResult.success ? metaResult.data : [];
        logger.info("listApps", "Fetched apps via mappings", { count: apps.length });
      }
    }

    if (!apps || apps.length === 0) {
      logger.info("listApps", "No apps found for user", { createdBy });
      return ok(res, [], "No apps found for this user");
    }

    // Enhance each app with page count
    logger.debug("listApps", "Enhancing apps with page counts");
    const enhancedApps = await Promise.all(
      apps.map(async (app) => {
        try {
          const pagesCollection = `${app.appPrefix}_pages`;
          const pagesResult = await firestoreService.listDocs(pagesCollection);
          const pageCount = pagesResult.success
            ? (pagesResult.data || []).filter(p => p.id !== "_init").length
            : 0;

          return {
            ...app,
            pageCount,
            updatedAt: app.updatedAt || app.createdAt
          };
        } catch (e) {
          logger.warn("listApps", `Failed to get page count for ${app.appPrefix}`, { error: e.message });
          return { ...app, pageCount: 0 };
        }
      })
    );

    logger.exit("listApps", { count: enhancedApps.length, createdBy });
    return ok(res, enhancedApps, "Apps fetched from JAYRAM for this user");
  } catch (err) {
    logger.error("listApps", "Failed to list apps", err);
    return next(new AppError(err.message || "List apps failed", 500));
  }
};

/**
 * GET /api/app/:appName
 * =====================
 * Get a specific app's details from JAYRAM database
 * Called from: Frontend via apiService.getAppByName()
 * 
 * URL Params:
 * - appName: string  // e.g., "My Event App" or "myeventapp"
 * 
 * Response: Single app object with all metadata
 */
export const getApp = async (req, res, next) => {
  try {
    const { appName } = req.params;
    if (!appName) {
      return fail(res, 400, "App name is required");
    }

    // Normalize to app prefix for lookup
    const appPrefix = appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
    const result = await firestoreService.getDoc("apps_meta", appPrefix);

    if (!result.success) {
      return fail(res, 404, "App not found in JAYRAM database", { error: result.error });
    }

    logger.info(`[AppController] Fetched app: ${appName} from JAYRAM database`);
    return ok(res, result.data, "App fetched successfully");
  } catch (err) {
    return next(new AppError(err.message || "Get app failed", 500));
  }
};

/**
 * DELETE /api/app/:appName
 * ========================
 * Delete an app and all its collections from JAYRAM database
 * Called from: Frontend Dashboard via apiService.deleteApp()
 * 
 * URL Params:
 * - appName: string  // e.g., "My Event App" or "myeventapp"
 * 
 * What it does:
 * 1. Fetches app metadata to get collection names
 * 2. Deletes all documents in each collection:
 *    - {appPrefix}_pages
 *    - {appPrefix}_components
 *    - {appPrefix}_layouts
 *    - {appPrefix}_theme
 * 3. Deletes app metadata document
 * 
 * Response: { appName }
 */
export const deleteApp = async (req, res, next) => {
  try {
    const { appName } = req.params;
    if (!appName) {
      return fail(res, 400, "App name is required");
    }

    // Normalize to app prefix
    const appPrefix = appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");

    // Get app metadata first to know which collections to delete
    const appResult = await firestoreService.getDoc("apps_meta", appPrefix);
    if (!appResult.success) {
      return fail(res, 404, "App not found in JAYRAM database");
    }

    const app = appResult.data;
    const collections = app.collections || [
      `${appPrefix}_pages`,
      `${appPrefix}_components`,
      `${appPrefix}_layouts`,
      `${appPrefix}_theme`
    ];

    // Delete all documents in each collection
    for (const collectionName of collections) {
      try {
        const docsResult = await firestoreService.listDocs(collectionName);
        if (docsResult.success && docsResult.data) {
          for (const doc of docsResult.data) {
            await firestoreService.deleteDoc(collectionName, doc.id);
          }
        }
        logger.info(`[AppController] Deleted collection from JAYRAM: ${collectionName}`);
      } catch (e) {
        logger.warn(`[AppController] Failed to delete collection ${collectionName}: ${e.message}`);
      }
    }

    // Delete app metadata
    await firestoreService.deleteDoc("apps_meta", appPrefix);

    logger.info(`[AppController] App deleted from JAYRAM: ${appName}`);
    return ok(res, { appName }, "App and all collections deleted successfully");
  } catch (err) {
    return next(new AppError(err.message || "Delete app failed", 500));
  }
};
