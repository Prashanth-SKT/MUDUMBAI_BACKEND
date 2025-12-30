/**
 * API Routes Index
 * ================
 * Mount all route modules here
 * 
 * This file is imported by: backend/src/app.js
 * 
 * All routes are prefixed with /api
 * 
 * Available route modules:
 * - /api/app         - Application CRUD operations
 * - /api/pages       - Page CRUD operations (JAYRAM)
 * - /api/components  - Component library operations (JAYRAM)
 * - /api/actions     - Action library operations (JAYRAM)
 * - /api/openai      - OpenAI content generation
 * // 🔧 fixed/updated by ChatGPT on 2025-10-18 00:20:00 – reason: add /api/auth for token-verified user sync/profile endpoints (START)
 * - /api/auth        - Auth sync & profile (MUDUMBAI) protected by verifyToken
 * // 🔧 fixed/updated by ChatGPT on 2025-10-18 00:20:00 (END)
 */

import express from "express";
import collectionRoutes from "./routes/collectionRoutes.js";
import appRoutes from "./routes/appRoutes.js";
import pageRoutes from "./routes/pageRoutes.js";
import componentRoutes from "./routes/componentRoutes.js";
import actionRoutes from "./routes/actionRoutes.js";
import openAiRoutes from "./routes/openAiRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import logRoutes from "./routes/logRoutes.js";
// 🔧 fixed/updated by ChatGPT on 2025-10-18 00:20:00 – reason: import new auth routes module to expose /api/auth endpoints (START)
import authRoutes from "./routes/authRoutes.js";
// 🔧 fixed/updated by ChatGPT on 2025-10-18 00:20:00 (END)
// 🔧 added by Claude on 2025-11-10 – reason: import validation routes for custom business validations
import validationRoutes from "./routes/validationRoutes.js";
// 🔧 added by Claude on 2025-11-16 – reason: import validation template routes for system templates
import validationTemplateRoutes from "./routes/validationTemplateRoutes.js";
// 🔧 added on 2025-12-30 – reason: import process routes for business process management
import processRoutes from "./routes/processRoutes.js";
// 🔧 added by Claude on 2025-11-16 – reason: import asset routes for Firebase Storage asset management
import assetRoutes from "./routes/assetRoutes.js";
// 🔧 added on 2025-12-27 – reason: import data management routes for no-code data tables (schema, records, bulk, CSV)
import dataManagementRoutes from "./routes/dataManagementRoutes.js";

const router = express.Router();

// Mount routes
router.use("/app", appRoutes);           // App operations (create, list, delete)
router.use("/pages", pageRoutes);        // Page operations (save, load, delete) - JAYRAM
router.use("/components", componentRoutes); // Component library operations - JAYRAM
router.use("/actions", actionRoutes);    // Action library operations - JAYRAM
router.use("/openai", openAiRoutes);     // AI content generation
router.use("/template", templateRoutes); // Template-based page generation (without OpenAI)
// 🔧 fixed/updated by ChatGPT on 2025-10-18 00:20:00 – reason: mount /api/auth for Firebase-token-protected sync and profile retrieval (START)
router.use("/auth", authRoutes);
router.use("/collection", collectionRoutes);
router.use("/logs",logRoutes);
// 🔧 fixed/updated by ChatGPT on 2025-10-18 00:20:00 (END)
// 🔧 added by Claude on 2025-11-10 – reason: mount validation routes at /api/validations
router.use("/validations", validationRoutes); // Custom business validation operations
// 🔧 added by Claude on 2025-11-16 – reason: mount validation template routes at /api/validation-templates
router.use("/validation-templates", validationTemplateRoutes); // System validation templates
// 🔧 added on 2025-12-30 – reason: mount process routes at /api/processes
router.use("/processes", processRoutes); // Business process management operations
// 🔧 added by Claude on 2025-11-16 – reason: mount asset routes at /api/assets
router.use("/assets", assetRoutes); // Asset management operations
// 🔧 added on 2025-12-27 – reason: mount data management routes (schema, records, bulk operations, CSV)
router.use(dataManagementRoutes); // Data management operations (no-code data tables)

export default router;
