/**
 * templateRoutes.js
 * Routes for template-based page generation (without OpenAI)
 */

import express from "express";
import {
  getTemplateTypes,
  getTemplatePreview,
  generateFromTemplate,
  generateAndSave
} from "../../controllers/templateController.js";

const router = express.Router();

// GET /api/template/types
// List all available template types
router.get("/types", getTemplateTypes);

// GET /api/template/preview/:type
// Get preview of template structure
router.get("/preview/:type", getTemplatePreview);

// POST /api/template/generate
// Generate pages from template
// Request body: { appName, appType, content }
router.post("/generate", generateFromTemplate);

// POST /api/template/generate-and-save
// Generate pages from template and save directly to Firestore
// Request body: { appName, appType, content }
router.post("/generate-and-save", generateAndSave);

export default router;



