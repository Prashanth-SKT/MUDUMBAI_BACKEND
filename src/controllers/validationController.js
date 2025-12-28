// validationController.js
// Created by Claude on 2025-11-10
// Updated by Claude on 2025-11-10 - Added appName normalization to match system standard
// Purpose: Handle CRUD operations for custom business validations in Firestore
// Collection pattern: {appPrefix}_validations in jayram database (normalized lowercase)

import firestoreService from "../services/firestoreService.js";
import logger from "../services/loggerService.js";

/**
 * Normalize app name to collection prefix (same as AppService)
 * Examples: "Rama2" -> "rama2", "My App" -> "myapp"
 * @param {string} appName - Original app name
 * @returns {string} Normalized prefix
 */
const normalizeAppName = (appName) => {
  return appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
};

/**
 * Get all validations for an app
 * GET /api/validations/:dbName/:appName
 */
export const getValidations = async (req, res) => {
  const { dbName, appName } = req.params;
  
  logger.info(`[validationController] GET validations - dbName: ${dbName}, appName: ${appName}`);
  
  if (!appName) {
    return res.status(400).json({ error: "appName is required" });
  }
  
  try {
    const appPrefix = normalizeAppName(appName);
    const collectionName = `${appPrefix}_validations`;
    logger.info(`[validationController] Normalized collection name: ${collectionName}`);
    const result = await firestoreService.getDocs(collectionName, dbName || "jayram");
    
    if (!result.success) {
      logger.error(`[validationController] Failed to get validations: ${result.error}`);
      return res.status(500).json({ error: result.error });
    }
    
    logger.info(`[validationController] Retrieved ${result.data.length} validations from ${collectionName}`);
    return res.status(200).json(result.data);
  } catch (error) {
    logger.error(`[validationController] Error getting validations: ${error.message}`);
    return res.status(500).json({ error: "Failed to fetch validations" });
  }
};

/**
 * Get single validation by ID
 * GET /api/validations/:dbName/:appName/:id
 */
export const getValidationById = async (req, res) => {
  const { dbName, appName, id } = req.params;
  
  logger.info(`[validationController] GET validation by ID - dbName: ${dbName}, appName: ${appName}, id: ${id}`);
  
  if (!appName || !id) {
    return res.status(400).json({ error: "appName and id are required" });
  }
  
  try {
    const appPrefix = normalizeAppName(appName);
    const collectionName = `${appPrefix}_validations`;
    logger.info(`[validationController] Normalized collection name: ${collectionName}`);
    const result = await firestoreService.getDoc(collectionName, id, dbName || "jayram");
    
    if (!result.success) {
      logger.warn(`[validationController] Validation not found: ${id}`);
      return res.status(404).json({ error: "Validation not found" });
    }
    
    logger.info(`[validationController] Retrieved validation: ${id}`);
    return res.status(200).json(result.data);
  } catch (error) {
    logger.error(`[validationController] Error getting validation: ${error.message}`);
    return res.status(500).json({ error: "Failed to fetch validation" });
  }
};

/**
 * Create new validation
 * POST /api/validations/:dbName/:appName
 */
export const createValidation = async (req, res) => {
  const { dbName, appName } = req.params;
  const validationData = req.body;
  
  logger.info(`[validationController] CREATE validation - dbName: ${dbName}, appName: ${appName}, name: ${validationData.name}`);
  
  if (!appName) {
    return res.status(400).json({ error: "appName is required" });
  }
  
  if (!validationData.name || !validationData.type) {
    return res.status(400).json({ error: "Validation name and type are required" });
  }
  
  try {
    const appPrefix = normalizeAppName(appName);
    const collectionName = `${appPrefix}_validations`;
    logger.info(`[validationController] Normalized collection name: ${collectionName}`);
    
    // Generate ID if not provided
    const validationId = validationData.id || `val_${Date.now()}`;
    
    // Prepare validation document
    const validationDoc = {
      ...validationData,
      id: validationId,
      version: validationData.version || "1.0.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      appName: appName,
      appPrefix: appPrefix  // Store normalized prefix for reference
    };
    
    // Use upsert to create with specific ID
    const result = await firestoreService.upsertDoc(
      collectionName, 
      validationId, 
      validationDoc, 
      dbName || "jayram"
    );
    
    if (!result.success) {
      logger.error(`[validationController] Failed to create validation: ${result.error}`);
      return res.status(500).json({ error: result.error });
    }
    
    logger.info(`[validationController] Created validation: ${validationId} in ${collectionName}`);
    return res.status(201).json(result.data);
  } catch (error) {
    logger.error(`[validationController] Error creating validation: ${error.message}`);
    return res.status(500).json({ error: "Failed to create validation" });
  }
};

/**
 * Update existing validation
 * PUT /api/validations/:dbName/:appName/:id
 */
export const updateValidation = async (req, res) => {
  const { dbName, appName, id } = req.params;
  const updates = req.body;
  
  logger.info(`[validationController] UPDATE validation - dbName: ${dbName}, appName: ${appName}, id: ${id}`);
  
  if (!appName || !id) {
    return res.status(400).json({ error: "appName and id are required" });
  }
  
  try {
    const appPrefix = normalizeAppName(appName);
    const collectionName = `${appPrefix}_validations`;
    logger.info(`[validationController] Normalized collection name: ${collectionName}`);
    
    // Check if validation exists
    const existing = await firestoreService.getDoc(collectionName, id, dbName || "jayram");
    if (!existing.success) {
      return res.status(404).json({ error: "Validation not found" });
    }
    
    // Prepare update data
    const updateData = {
      ...updates,
      id: id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
      version: incrementVersion(existing.data.version || "1.0.0")
    };
    
    const result = await firestoreService.updateDoc(
      collectionName, 
      id, 
      updateData, 
      dbName || "jayram"
    );
    
    if (!result.success) {
      logger.error(`[validationController] Failed to update validation: ${result.error}`);
      return res.status(500).json({ error: result.error });
    }
    
    logger.info(`[validationController] Updated validation: ${id} in ${collectionName}`);
    return res.status(200).json(result.data);
  } catch (error) {
    logger.error(`[validationController] Error updating validation: ${error.message}`);
    return res.status(500).json({ error: "Failed to update validation" });
  }
};

/**
 * Delete validation
 * DELETE /api/validations/:dbName/:appName/:id
 */
export const deleteValidation = async (req, res) => {
  const { dbName, appName, id } = req.params;
  
  logger.info(`[validationController] DELETE validation - dbName: ${dbName}, appName: ${appName}, id: ${id}`);
  
  if (!appName || !id) {
    return res.status(400).json({ error: "appName and id are required" });
  }
  
  try {
    const appPrefix = normalizeAppName(appName);
    const collectionName = `${appPrefix}_validations`;
    logger.info(`[validationController] Normalized collection name: ${collectionName}`);
    
    const result = await firestoreService.deleteDoc(collectionName, id, dbName || "jayram");
    
    if (!result.success) {
      logger.error(`[validationController] Failed to delete validation: ${result.error}`);
      return res.status(404).json({ error: "Validation not found" });
    }
    
    logger.info(`[validationController] Deleted validation: ${id} from ${collectionName}`);
    return res.status(200).json({ message: "Validation deleted successfully", id });
  } catch (error) {
    logger.error(`[validationController] Error deleting validation: ${error.message}`);
    return res.status(500).json({ error: "Failed to delete validation" });
  }
};

/**
 * Helper: Increment semantic version
 * @param {string} version - Current version (e.g., "1.0.0")
 * @returns {string} Incremented version (e.g., "1.0.1")
 */
function incrementVersion(version) {
  const parts = (version || "1.0.0").split(".");
  parts[2] = String(parseInt(parts[2] || 0) + 1);
  return parts.join(".");
}

// End of validationController.js - Created by Claude on 2025-11-10


