/**
 * Action Routes
 * =============
 * Defines HTTP routes for action library operations
 * 
 * This routes file is imported by: /api/index.js
 * These routes call: actionController.js functions
 * 
 * All routes prefix: /api/actions
 * 
 * Available endpoints:
 * - POST   /api/actions/save                    - Save/update an action
 * - GET    /api/actions/:appName                - Get all actions for an app
 * - GET    /api/actions/:appName/:actionId      - Get specific action
 * - DELETE /api/actions/:appName/:actionId      - Delete an action
 * - GET    /api/actions/:appName/by-tag/:tag    - Get actions by tag
 */

import express from "express";
import { 
  saveAction,
  getActionsByApp, 
  getAction, 
  deleteAction,
  getActionsByTag
} from "../../controllers/actionController.js";

const router = express.Router();

// POST /api/actions/save
// Save or update an action in the library
// Request body: { appName, actionId, actionData }
router.post("/save", saveAction);

// GET /api/actions/:appName
// Get all actions for a specific app
// URL params: appName
router.get("/:appName", getActionsByApp);

// GET /api/actions/:appName/by-tag/:tag
// Get actions filtered by tag
// URL params: appName, tag
router.get("/:appName/by-tag/:tag", getActionsByTag);

// GET /api/actions/:appName/:actionId
// Get specific action
// URL params: appName, actionId
router.get("/:appName/:actionId", getAction);

// DELETE /api/actions/:appName/:actionId
// Delete an action from the library
// URL params: appName, actionId
router.delete("/:appName/:actionId", deleteAction);

export default router;



