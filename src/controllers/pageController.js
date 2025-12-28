/**
 * Page Controller
 * ===============
 * Handles all page-related CRUD operations in JAYRAM database
 * 
 * This controller is called from: /api/routes/pageRoutes.js
 * 
 * Endpoints provided:
 * - POST /api/pages - Save or update a page
 * - GET /api/pages/:appName - Get all pages for an app
 * - GET /api/pages/:appName/:pageName - Get a specific page
 * - DELETE /api/pages/:appName/:pageName - Delete a page
 */

import { ok, created, fail } from "../utils/responseHandler.js";
import { AppError } from "../utils/errorHandler.js";
import { requireFields } from "../utils/validator.js";
import firestoreService from "../services/firestoreService.js";
import logger from "../services/loggerService.js";

/**
 * POST /api/pages
 * ===============
 * Save or update a page in JAYRAM database
 * Called from: Frontend apiService.savePage()
 * 
 * Request Body:
 * {
 *   appName: string,      // e.g., "MyApp"
 *   pageName: string,     // e.g., "Home_v1"
 *   pageData: object      // Page configuration (components, layout, etc.)
 * }
 * 
 * Flow:
 * 1. Validate required fields
 * 2. Normalize app name to collection name (e.g., "MyApp" -> "myapp_pages")
 * 3. Normalize page name to document ID (e.g., "Home v1" -> "home_v1")
 * 4. Add metadata (name, appName, updatedAt)
 * 5. Save to Firestore using upsertDoc (creates or updates)
 * 
 * Response: { pageName, docId }
 */
export const savePage = async (req, res, next) => {
  try {
    const { appName, pageName, pageData } = req.body || {};
    
    // Validate required fields
    requireFields({ appName, pageName, pageData }, ["appName", "pageName", "pageData"]);

    // Generate collection name: "myapp_pages"
    const collectionName = `${appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "")}_pages`;
    
    // Generate document ID: safe identifier for Firestore
    const docId = pageName.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    
    // Prepare full page data with metadata
    const fullPageData = {
      ...pageData,
      name: pageName,        // Original page name
      appName: appName,      // Original app name
      updatedAt: new Date().toISOString()  // Track when page was last modified
    };

    // Save to JAYRAM database
    const result = await firestoreService.upsertDoc(collectionName, docId, fullPageData);
    
    if (!result.success) {
      return fail(res, 500, "Failed to save page", { error: result.error });
    }

    logger.info(`[PageController] Page saved: ${appName}/${pageName} in JAYRAM database`);
    return created(res, { pageName, docId }, "Page saved successfully");
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message || "Save page failed", 500));
  }
};

/**
 * GET /api/pages/:appName
 * ========================
 * Get all pages for a specific app from JAYRAM database
 * Called from: Frontend apiService.getPagesByApp()
 * 
 * URL Params:
 * - appName: string  // e.g., "MyApp"
 * 
 * Flow:
 * 1. Normalize app name to collection name
 * 2. Fetch all documents from {appname}_pages collection
 * 3. Filter out initialization docs (_init)
 * 4. Return array of page documents
 * 
 * Response: Array of page objects with id, name, components, etc.
 */
export const getPagesByApp = async (req, res, next) => {
  try {
    const { appName } = req.params;
    
    if (!appName) {
      return fail(res, 400, "App name is required");
    }

    // Generate collection name
    const collectionName = `${appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "")}_pages`;
    
    // Fetch all documents from JAYRAM database
    const result = await firestoreService.listDocs(collectionName);
    
    if (!result.success) {
      return fail(res, 500, "Failed to fetch pages", { error: result.error });
    }

    // Filter out system/init documents
    const pages = (result.data || []).filter(page => page.id !== '_init');

    logger.info(`[PageController] Fetched ${pages.length} pages for app: ${appName} from JAYRAM database`);
    return ok(res, pages, "Pages fetched successfully");
  } catch (err) {
    return next(new AppError(err.message || "Get pages failed", 500));
  }
};

/**
 * GET /api/pages/:appName/:pageName
 * ==================================
 * Get a specific page from JAYRAM database
 * Called from: Frontend apiService.getPage()
 * 
 * URL Params:
 * - appName: string   // e.g., "MyApp"
 * - pageName: string  // e.g., "Home_v1"
 * 
 * Flow:
 * 1. Normalize app name and page name
 * 2. Fetch document from Firestore
 * 3. Return page data
 * 
 * Response: Single page object with all configuration data
 */
export const getPage = async (req, res, next) => {
  try {
    const { appName, pageName } = req.params;
    
    if (!appName || !pageName) {
      return fail(res, 400, "App name and page name are required");
    }

    // Generate collection and document identifiers
    const collectionName = `${appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "")}_pages`;
    const docId = pageName.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    
    // Fetch from JAYRAM database
    const result = await firestoreService.getDoc(collectionName, docId);
    
    if (!result.success) {
      return fail(res, 404, "Page not found", { error: result.error });
    }

    logger.info(`[PageController] Fetched page: ${appName}/${pageName} from JAYRAM database`);
    return ok(res, result.data, "Page fetched successfully");
  } catch (err) {
    return next(new AppError(err.message || "Get page failed", 500));
  }
};

/**
 * DELETE /api/pages/:appName/:pageName
 * =====================================
 * Delete a specific page from JAYRAM database
 * Called from: Frontend apiService.deletePage()
 * 
 * URL Params:
 * - appName: string   // e.g., "MyApp"
 * - pageName: string  // e.g., "Home_v1"
 * 
 * Flow:
 * 1. Normalize app name and page name
 * 2. Delete document from Firestore
 * 3. Return success confirmation
 * 
 * Response: { pageName }
 */
export const deletePage = async (req, res, next) => {
  try {
    const { appName, pageName } = req.params;
    
    if (!appName || !pageName) {
      return fail(res, 400, "App name and page name are required");
    }

    // Generate collection and document identifiers
    const collectionName = `${appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "")}_pages`;
    const docId = pageName.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    
    // Delete from JAYRAM database
    const result = await firestoreService.deleteDoc(collectionName, docId);
    
    if (!result.success) {
      return fail(res, 500, "Failed to delete page", { error: result.error });
    }

    logger.info(`[PageController] Deleted page: ${appName}/${pageName} from JAYRAM database`);
    return ok(res, { pageName }, "Page deleted successfully");
  } catch (err) {
    return next(new AppError(err.message || "Delete page failed", 500));
  }
};

// Export all controller functions
export default {
  savePage,
  getPagesByApp,
  getPage,
  deletePage
};
