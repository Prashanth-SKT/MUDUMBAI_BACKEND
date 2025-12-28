/**
 * App Routes
 * ==========
 * Defines HTTP routes for application operations
 * 
 * This routes file is imported by: /api/index.js
 * These routes call: appController.js functions
 * 
 * All routes prefix: /api/app
 * 
 * Available endpoints:
 * - POST   /api/app/create     - Create a new app
 * - GET    /api/app/list       - List all apps
 * - GET    /api/app/:appName   - Get specific app
 * - DELETE /api/app/:appName   - Delete app
 */

import express from "express";
import { 
  createApp,  // POST - Create new app with 4 collections
  listApps,   // GET  - List all apps with metadata
  getApp,     // GET  - Get specific app details
  deleteApp   // DELETE - Delete app and all collections
} from "../../controllers/appController.js";

const router = express.Router();

// POST /api/app/create
// Create a new application with 4 collections in JAYRAM database
// Request body: { appName, description }
router.post("/create", createApp);

// GET /api/app/list
// List all applications from JAYRAM database
// router.get("/list", listApps);
// fixed/updated by ChatGPT on 2025-10-18 23:35:57 – enhanced route to explicitly accept createdBy query param for ownership filtering
router.get("/list", (req, res, next) => {
  if (!req.query.createdBy) {
    // If frontend forgot to include uid, return user-friendly message
    res.status(400).json({
      success: false,
      message: "Missing required parameter: createdBy (uid)",
    });
    return;
  }
  return listApps(req, res, next);
});

// GET /api/app/:appName
// Get specific app details from JAYRAM database
// URL params: appName (e.g., "MyApp" or "myapp")
router.get("/:appName", getApp);

// DELETE /api/app/:appName
// Delete app and all its collections from JAYRAM database
// URL params: appName
router.delete("/:appName", deleteApp);

export default router;
