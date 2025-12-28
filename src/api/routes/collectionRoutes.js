/**
 * collectionRoutes.js
 * Hard-instrumented for debugging “no response” issue.
 * Adds /ping and /debug, and wires the main GET.
 */

import express from "express";
import { getCollectionData } from "../../controllers/collectionController.js";

const router = express.Router();

// Quick health check: GET /api/collection/ping
router.get("/ping", (req, res) => {
  console.log("[collectionRoutes] /ping hit");
  res.status(200).json({ ok: true, at: "collectionRoutes:/ping" });
});

// Debug echo: GET /api/collection/debug/:dbName/:appName/:collectionType
router.get("/debug/:dbName/:appName/:collectionType", (req, res) => {
  console.log("[collectionRoutes] /debug hit:", req.params);
  res.status(200).json({ ok: true, params: req.params });
});

// Main route: GET /api/collection/:dbName/:appName/:collectionType
router.get("/:dbName/:appName/:collectionType", getCollectionData);

export default router;
