/**
 * openAiRoutes.js
 * ----------------
 * Routes for AI content and JSON generation.
 */
import express from "express";
import { generateContent, generatePageJson } from "../../controllers/openAiController.js";

const router = express.Router();

// POST /api/openai/content → generate marketing & descriptive content
router.post("/content", generateContent);

// POST /api/openai/page-json → generate page JSON from given content
router.post("/page-json", generatePageJson);

export default router;
