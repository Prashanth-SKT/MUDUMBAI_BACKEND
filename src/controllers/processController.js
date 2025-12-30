// processController.js
// Created on 2025-12-30
// Purpose: Handle CRUD operations for business processes in Firestore
// Collection pattern: {appPrefix}_processes in jayram database (normalized lowercase)

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
 * Get all processes for an app
 * GET /api/processes/:dbName/:appName
 */
export const getProcesses = async (req, res) => {
  const { dbName, appName } = req.params;
  
  logger.info(`[processController] GET processes - dbName: ${dbName}, appName: ${appName}`);
  
  if (!appName) {
    return res.status(400).json({ error: "appName is required" });
  }
  
  try {
    const appPrefix = normalizeAppName(appName);
    const collectionName = `${appPrefix}_processes`;
    logger.info(`[processController] Normalized collection name: ${collectionName}`);
    const result = await firestoreService.getDocs(collectionName, dbName || "jayram");
    
    if (!result.success) {
      logger.error(`[processController] Failed to get processes: ${result.error}`);
      return res.status(500).json({ error: result.error });
    }
    
    logger.info(`[processController] Retrieved ${result.data.length} processes from ${collectionName}`);
    return res.status(200).json(result.data);
  } catch (error) {
    logger.error(`[processController] Error getting processes: ${error.message}`);
    return res.status(500).json({ error: "Failed to fetch processes" });
  }
};

/**
 * Get single process by ID
 * GET /api/processes/:dbName/:appName/:id
 */
export const getProcessById = async (req, res) => {
  const { dbName, appName, id } = req.params;
  
  logger.info(`[processController] GET process by ID - dbName: ${dbName}, appName: ${appName}, id: ${id}`);
  
  if (!appName || !id) {
    return res.status(400).json({ error: "appName and id are required" });
  }
  
  try {
    const appPrefix = normalizeAppName(appName);
    const collectionName = `${appPrefix}_processes`;
    logger.info(`[processController] Normalized collection name: ${collectionName}`);
    const result = await firestoreService.getDoc(collectionName, id, dbName || "jayram");
    
    if (!result.success) {
      logger.warn(`[processController] Process not found: ${id}`);
      return res.status(404).json({ error: "Process not found" });
    }
    
    logger.info(`[processController] Retrieved process: ${id}`);
    return res.status(200).json(result.data);
  } catch (error) {
    logger.error(`[processController] Error getting process: ${error.message}`);
    return res.status(500).json({ error: "Failed to fetch process" });
  }
};

/**
 * Create new process
 * POST /api/processes/:dbName/:appName
 * Accepts structure with: name, description, appName, status, steps, finalActions, version
 */
export const createProcess = async (req, res) => {
  const { dbName, appName } = req.params;
  const processData = req.body;
  
  logger.info(`[processController] CREATE process - dbName: ${dbName}, appName: ${appName}, name: ${processData.name}`);
  
  if (!appName) {
    return res.status(400).json({ error: "appName is required" });
  }
  
  if (!processData.name) {
    return res.status(400).json({ error: "Process name is required" });
  }
  
  if (!processData.steps || !Array.isArray(processData.steps)) {
    return res.status(400).json({ error: "Process steps array is required" });
  }
  
  try {
    const appPrefix = normalizeAppName(appName);
    const collectionName = `${appPrefix}_processes`;
    logger.info(`[processController] Normalized collection name: ${collectionName}`);
    
    // Generate ID if not provided or null
    const processId = processData.id || `PROCESS_${Date.now()}`;
    
    // Prepare process document
    const processDoc = {
      id: processId,
      name: processData.name,
      description: processData.description || "",
      appName: processData.appName || appName,
      status: processData.status || "draft",
      steps: processData.steps || [],
      finalActions: processData.finalActions || [],
      version: processData.version || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      appPrefix: appPrefix  // Store normalized prefix for reference
    };
    
    // Use upsert to create with specific ID
    const result = await firestoreService.upsertDoc(
      collectionName, 
      processId, 
      processDoc, 
      dbName || "jayram"
    );
    
    if (!result.success) {
      logger.error(`[processController] Failed to create process: ${result.error}`);
      return res.status(500).json({ error: result.error });
    }
    
    logger.info(`[processController] Created process: ${processId} in ${collectionName}`);
    return res.status(201).json(result.data);
  } catch (error) {
    logger.error(`[processController] Error creating process: ${error.message}`);
    return res.status(500).json({ error: "Failed to create process" });
  }
};

/**
 * Update existing process
 * PUT /api/processes/:dbName/:appName/:id
 */
export const updateProcess = async (req, res) => {
  const { dbName, appName, id } = req.params;
  const updates = req.body;
  
  logger.info(`[processController] UPDATE process - dbName: ${dbName}, appName: ${appName}, id: ${id}`);
  
  if (!appName || !id) {
    return res.status(400).json({ error: "appName and id are required" });
  }
  
  try {
    const appPrefix = normalizeAppName(appName);
    const collectionName = `${appPrefix}_processes`;
    logger.info(`[processController] Normalized collection name: ${collectionName}`);
    
    // Check if process exists
    const existing = await firestoreService.getDoc(collectionName, id, dbName || "jayram");
    if (!existing.success) {
      return res.status(404).json({ error: "Process not found" });
    }
    
    // Prepare update data - increment version as number
    const currentVersion = typeof existing.data.version === 'number' 
      ? existing.data.version 
      : 1;
    
    const updateData = {
      id: id, // Ensure ID doesn't change
      name: updates.name || existing.data.name,
      description: updates.description !== undefined ? updates.description : existing.data.description,
      appName: updates.appName || existing.data.appName,
      status: updates.status || existing.data.status,
      steps: updates.steps || existing.data.steps,
      finalActions: updates.finalActions || existing.data.finalActions,
      updatedAt: new Date().toISOString(),
      version: currentVersion + 1,
      appPrefix: appPrefix
    };
    
    const result = await firestoreService.updateDoc(
      collectionName, 
      id, 
      updateData, 
      dbName || "jayram"
    );
    
    if (!result.success) {
      logger.error(`[processController] Failed to update process: ${result.error}`);
      return res.status(500).json({ error: result.error });
    }
    
    logger.info(`[processController] Updated process: ${id} in ${collectionName}`);
    return res.status(200).json(result.data);
  } catch (error) {
    logger.error(`[processController] Error updating process: ${error.message}`);
    return res.status(500).json({ error: "Failed to update process" });
  }
};

/**
 * Delete process
 * DELETE /api/processes/:dbName/:appName/:id
 */
export const deleteProcess = async (req, res) => {
  const { dbName, appName, id } = req.params;
  
  logger.info(`[processController] DELETE process - dbName: ${dbName}, appName: ${appName}, id: ${id}`);
  
  if (!appName || !id) {
    return res.status(400).json({ error: "appName and id are required" });
  }
  
  try {
    const appPrefix = normalizeAppName(appName);
    const collectionName = `${appPrefix}_processes`;
    logger.info(`[processController] Normalized collection name: ${collectionName}`);
    
    const result = await firestoreService.deleteDoc(collectionName, id, dbName || "jayram");
    
    if (!result.success) {
      logger.error(`[processController] Failed to delete process: ${result.error}`);
      return res.status(404).json({ error: "Process not found" });
    }
    
    logger.info(`[processController] Deleted process: ${id} from ${collectionName}`);
    return res.status(200).json({ message: "Process deleted successfully", id });
  } catch (error) {
    logger.error(`[processController] Error deleting process: ${error.message}`);
    return res.status(500).json({ error: "Failed to delete process" });
  }
};

// End of processController.js - Created on 2025-12-30


