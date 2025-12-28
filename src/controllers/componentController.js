/**
 * Component Controller
 * ====================
 * Handles all component-related CRUD operations in JAYRAM database
 * 
 * This controller is called from: /api/routes/componentRoutes.js
 * 
 * Components are reusable UI elements that can be used across multiple pages.
 * They are stored in {appName}_components collection in JAYRAM database.
 * 
 * Endpoints provided:
 * - POST   /api/components           - Save component to library
 * - GET    /api/components           - Get all components (with optional filters)
 * - GET    /api/components/:id       - Get specific component
 * - DELETE /api/components/:id       - Delete component
 */

import { ok, created, fail } from "../utils/responseHandler.js";
import { AppError } from "../utils/errorHandler.js";
import firestoreService from "../services/firestoreService.js";
import logger from "../services/loggerService.js";

/**
 * POST /api/components
 * ====================
 * Save a component to the component library in JAYRAM database
 * Called from: Frontend firestoreService.saveComponentToLibrary()
 * 
 * Request Body:
 * {
 *   componentData: {
 *     id: string,
 *     type: string,
 *     name: string,
 *     appName: string,
 *     commonAttrs: object,
 *     specificAttrs: object,
 *     tags: array,
 *     category: string
 *   }
 * }
 * 
 * Flow:
 * 1. Extract component data
 * 2. Determine collection name from appName
 * 3. Save to {appName}_components collection in JAYRAM
 * 
 * Response: { componentId, collectionName }
 */
export const saveComponent = async (req, res, next) => {
  try {
    const { componentData } = req.body || {};
    
    if (!componentData) {
      return fail(res, 400, "Component data is required");
    }

    // Extract appName to determine collection
    const appName = componentData.appName;
    if (!appName) {
      return fail(res, 400, "appName is required in componentData");
    }

    // Normalize app name to collection name
    const appPrefix = appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
    const collectionName = `${appPrefix}_components`;
    
    // Use component ID as document ID (or generate one)
    const componentId = componentData.id || `comp_${Date.now()}`;
    
    // Prepare component data with metadata
    const fullComponentData = {
      ...componentData,
      id: componentId,
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to JAYRAM database
    const result = await firestoreService.upsertDoc(collectionName, componentId, fullComponentData);
    
    if (!result.success) {
      return fail(res, 500, "Failed to save component", { error: result.error });
    }

    logger.info(`[ComponentController] Component saved to JAYRAM: ${collectionName}/${componentId}`);
    return created(res, { componentId, collectionName }, "Component saved successfully");
    
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message || "Save component failed", 500));
  }
};

/**
 * GET /api/components
 * ===================
 * Get all components with optional filters
 * Called from: Frontend firestoreService.fetchComponentLibrary()
 * 
 * Query Params:
 * - appName: string (required) - Filter by app
 * - type: string (optional) - Filter by component type
 * - category: string (optional) - Filter by category
 * 
 * Flow:
 * 1. Get appName from query params
 * 2. Fetch from {appName}_components collection
 * 3. Apply filters if provided
 * 
 * Response: Array of component objects
 */
export const getAllComponents = async (req, res, next) => {
  try {
    const { appName, type, category } = req.query;
    
    if (!appName) {
      return fail(res, 400, "appName query parameter is required");
    }

    // Normalize app name to collection name
    const appPrefix = appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
    const collectionName = `${appPrefix}_components`;
    
    // Fetch all components from JAYRAM
    const result = await firestoreService.listDocs(collectionName);
    
    if (!result.success) {
      return fail(res, 500, "Failed to fetch components", { error: result.error });
    }

    let components = result.data || [];
    
    // Filter out system/init documents
    components = components.filter(comp => comp.id !== '_init');
    
    // Apply type filter if provided
    if (type) {
      components = components.filter(comp => comp.type === type);
    }
    
    // Apply category filter if provided
    if (category) {
      components = components.filter(comp => comp.category === category);
    }

    logger.info(`[ComponentController] Fetched ${components.length} components from JAYRAM: ${collectionName}`);
    return ok(res, components, "Components fetched successfully");
    
  } catch (err) {
    return next(new AppError(err.message || "Get components failed", 500));
  }
};

/**
 * GET /api/components/:id
 * =======================
 * Get a specific component by ID
 * 
 * URL Params:
 * - id: string - Component ID
 * 
 * Query Params:
 * - appName: string (required)
 * 
 * Response: Single component object
 */
export const getComponent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { appName } = req.query;
    
    if (!appName) {
      return fail(res, 400, "appName query parameter is required");
    }
    
    if (!id) {
      return fail(res, 400, "Component ID is required");
    }

    // Normalize app name to collection name
    const appPrefix = appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
    const collectionName = `${appPrefix}_components`;
    
    // Fetch component from JAYRAM
    const result = await firestoreService.getDoc(collectionName, id);
    
    if (!result.success) {
      return fail(res, 404, "Component not found", { error: result.error });
    }

    logger.info(`[ComponentController] Fetched component from JAYRAM: ${collectionName}/${id}`);
    return ok(res, result.data, "Component fetched successfully");
    
  } catch (err) {
    return next(new AppError(err.message || "Get component failed", 500));
  }
};

/**
 * DELETE /api/components/:id
 * ==========================
 * Delete a component from the library
 * 
 * URL Params:
 * - id: string - Component ID
 * 
 * Query Params:
 * - appName: string (required)
 * 
 * Response: { componentId }
 */
export const deleteComponent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { appName } = req.query;
    
    if (!appName) {
      return fail(res, 400, "appName query parameter is required");
    }
    
    if (!id) {
      return fail(res, 400, "Component ID is required");
    }

    // Normalize app name to collection name
    const appPrefix = appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
    const collectionName = `${appPrefix}_components`;
    
    // Delete component from JAYRAM
    const result = await firestoreService.deleteDoc(collectionName, id);
    
    if (!result.success) {
      return fail(res, 500, "Failed to delete component", { error: result.error });
    }

    logger.info(`[ComponentController] Deleted component from JAYRAM: ${collectionName}/${id}`);
    return ok(res, { componentId: id }, "Component deleted successfully");
    
  } catch (err) {
    return next(new AppError(err.message || "Delete component failed", 500));
  }
};

// Export all controller functions
export default {
  saveComponent,
  getAllComponents,
  getComponent,
  deleteComponent
};


