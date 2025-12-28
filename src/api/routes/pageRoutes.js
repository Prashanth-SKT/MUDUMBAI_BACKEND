/**
 * Page Routes
 * ===========
 * Defines HTTP routes for page operations
 * 
 * This routes file is imported by: /api/index.js
 * These routes call: pageController.js functions
 * 
 * All routes prefix: /api/pages
 * 
 * Available endpoints:
 * - POST   /api/pages                      - Save/update a page
 * - GET    /api/pages/:appName             - Get all pages for an app
 * - GET    /api/pages/:appName/:pageName   - Get a specific page
 * - DELETE /api/pages/:appName/:pageName   - Delete a page
 */

import express from "express";
import { 
  savePage,      // POST - Save or update a page
  getPagesByApp, // GET  - Fetch all pages for an app
  getPage,       // GET  - Fetch a specific page
  deletePage     // DELETE - Remove a page
} from "../../controllers/pageController.js";

const router = express.Router();

// POST /api/pages
// Save or update a page in JAYRAM database
// Request body: { appName, pageName, pageData }
router.post("/", savePage);

// GET /api/pages/:appName
// Get all pages for a specific app from JAYRAM database
// URL params: appName (e.g., "MyApp")
router.get("/:appName", getPagesByApp);

// GET /api/pages/:appName/:pageName
// Get a specific page from JAYRAM database
// URL params: appName, pageName (e.g., "MyApp", "Home_v1")
router.get("/:appName/:pageName", getPage);

// DELETE /api/pages/:appName/:pageName
// Delete a specific page from JAYRAM database
// URL params: appName, pageName
router.delete("/:appName/:pageName", deletePage);

export default router;
