/**
 * Action Controller
 * =================
 * Handles action library CRUD operations in JAYRAM database
 * 
 * This controller is called from: /api/routes/actionRoutes.js
 * Uses: firestoreService for database interactions
 * 
 * Endpoints provided:
 * - POST   /api/actions/save          - Save/update an action in library
 * - GET    /api/actions/:appName      - Get all actions for an app
 * - GET    /api/actions/:appName/:actionId - Get specific action
 * - DELETE /api/actions/:appName/:actionId - Delete an action
 * - GET    /api/actions/:appName/by-tag/:tag - Get actions by tag
 */

import { ok, created, fail } from "../utils/responseHandler.js";
import { AppError } from "../utils/errorHandler.js";
import { requireFields } from "../utils/validator.js";
import firestoreService from "../services/firestoreService.js";
import logger from "../services/loggerService.js";

/**
 * Normalize app name to collection prefix
 * Examples: "Rama2" -> "rama2", "My App" -> "myapp"
 */
const normalizeAppName = (appName) => {
  return appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
};

/**
 * POST /api/actions/save
 * ======================
 * Save or update an action in the action library
 * Called from: Frontend ActionLibrary via apiService.saveAction()
 * 
 * Request Body:
 * {
 *   appName: string,       // e.g., "MyApp"
 *   actionId: string,      // e.g., "welcome_msg_v1"
 *   actionData: object     // Action configuration and metadata
 * }
 * 
 * What it does:
 * 1. Validates required fields
 * 2. Saves/updates action in `{appName}_actions` collection
 * 
 * Response: { appName, actionId }
 */
export const saveAction = async (req, res, next) => {
  try {
    const { appName, actionId, actionData } = req.body || {};
    requireFields({ appName, actionId, actionData }, ["appName", "actionId", "actionData"]);

    const appPrefix = normalizeAppName(appName);
    const collectionName = `${appPrefix}_actions`;

    // Add metadata
    const enrichedData = {
      ...actionData,
      actionId,
      appName,
      updatedAt: new Date().toISOString(),
      reusable: true
    };

    // Add createdAt if new
    if (!actionData.createdAt) {
      enrichedData.createdAt = new Date().toISOString();
    }

    const result = await firestoreService.upsertDoc(collectionName, actionId, enrichedData);

    if (!result.success) {
      return fail(res, 500, "Failed to save action", { error: result.error });
    }

    logger.info(`[ActionController] Action saved to JAYRAM: ${appName}/${actionId}`);
    return created(res, { appName, actionId }, "Action saved to library successfully");
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message || "Save action failed", 500));
  }
};

/**
 * GET /api/actions/:appName
 * =========================
 * Get all actions for a specific app from JAYRAM database
 * Called from: Frontend ActionLibrary via apiService.getActions()
 * 
 * URL params: appName
 * 
 * Response: Array of action objects
 */
export const getActionsByApp = async (req, res, next) => {
  try {
    const { appName } = req.params;
    requireFields({ appName }, ["appName"]);

    const appPrefix = normalizeAppName(appName);
    const collectionName = `${appPrefix}_actions`;
    const result = await firestoreService.listDocs(collectionName);

    if (!result.success) {
      return fail(res, 500, "Failed to fetch actions", { error: result.error });
    }

    // Filter out _init document
    const actions = (result.data || []).filter(action => action.id !== '_init');

    logger.info(`[ActionController] Fetched ${actions.length} actions for app: ${appName}`);
    return ok(res, actions, `Fetched ${actions.length} actions from library`);
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message || "Fetch actions failed", 500));
  }
};

/**
 * GET /api/actions/:appName/:actionId
 * ===================================
 * Get specific action from JAYRAM database
 * 
 * URL params: appName, actionId
 * 
 * Response: Action object
 */
export const getAction = async (req, res, next) => {
  try {
    const { appName, actionId } = req.params;
    requireFields({ appName, actionId }, ["appName", "actionId"]);

    const appPrefix = normalizeAppName(appName);
    const collectionName = `${appPrefix}_actions`;
    const result = await firestoreService.getDoc(collectionName, actionId);

    if (!result.success || !result.data) {
      return fail(res, 404, "Action not found");
    }

    logger.info(`[ActionController] Fetched action: ${appName}/${actionId}`);
    return ok(res, result.data, "Action fetched successfully");
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message || "Fetch action failed", 500));
  }
};

/**
 * DELETE /api/actions/:appName/:actionId
 * ======================================
 * Delete an action from the action library
 * 
 * URL params: appName, actionId
 * 
 * Response: { message }
 */
export const deleteAction = async (req, res, next) => {
  try {
    const { appName, actionId } = req.params;
    requireFields({ appName, actionId }, ["appName", "actionId"]);

    const appPrefix = normalizeAppName(appName);
    const collectionName = `${appPrefix}_actions`;
    const result = await firestoreService.deleteDoc(collectionName, actionId);

    if (!result.success) {
      return fail(res, 500, "Failed to delete action", { error: result.error });
    }

    logger.info(`[ActionController] Action deleted: ${appName}/${actionId}`);
    return ok(res, { appName, actionId }, "Action deleted from library successfully");
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message || "Delete action failed", 500));
  }
};

/**
 * GET /api/actions/:appName/by-tag/:tag
 * ======================================
 * Get actions filtered by tag
 * 
 * URL params: appName, tag
 * 
 * Response: Array of action objects with the specified tag
 */
export const getActionsByTag = async (req, res, next) => {
  try {
    const { appName, tag } = req.params;
    requireFields({ appName, tag }, ["appName", "tag"]);

    const appPrefix = normalizeAppName(appName);
    const collectionName = `${appPrefix}_actions`;
    const result = await firestoreService.listDocs(collectionName);

    if (!result.success) {
      return fail(res, 500, "Failed to fetch actions", { error: result.error });
    }

    // Filter by tag
    const actions = (result.data || []).filter(action => 
      action.id !== '_init' && 
      action.tags && 
      action.tags.includes(tag)
    );

    logger.info(`[ActionController] Fetched ${actions.length} actions with tag "${tag}" for app: ${appName}`);
    return ok(res, actions, `Fetched ${actions.length} actions with tag: ${tag}`);
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message || "Fetch actions by tag failed", 500));
  }
};



