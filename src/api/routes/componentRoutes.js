/**
 * Component Routes
 * ================
 * Defines HTTP routes for component operations
 * 
 * This routes file is imported by: /api/index.js
 * These routes call: componentController.js functions
 * 
 * All routes prefix: /api/components
 * 
 * Available endpoints:
 * - POST   /api/components           - Save component to library
 * - GET    /api/components           - Get all components (with filters)
 * - GET    /api/components/:id       - Get specific component
 * - DELETE /api/components/:id       - Delete component
 */

import express from "express";
import { 
  saveComponent,      // POST - Save component to library
  getAllComponents,   // GET  - Get all components
  getComponent,       // GET  - Get specific component
  deleteComponent     // DELETE - Delete component
} from "../../controllers/componentController.js";

const router = express.Router();

// POST /api/components
// Save a component to the library in JAYRAM database
// Request body: { componentData: { id, type, name, appName, ... } }
router.post("/", saveComponent);

// GET /api/components?appName=X&type=Y&category=Z
// Get all components for an app with optional filters
// Query params: appName (required), type (optional), category (optional)
router.get("/", getAllComponents);

// GET /api/components/:id?appName=X
// Get a specific component by ID
// URL params: id (component ID)
// Query params: appName (required)
router.get("/:id", getComponent);

// DELETE /api/components/:id?appName=X
// Delete a component from the library
// URL params: id (component ID)
// Query params: appName (required)
router.delete("/:id", deleteComponent);

export default router;


