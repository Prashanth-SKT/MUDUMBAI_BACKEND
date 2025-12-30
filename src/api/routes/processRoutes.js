// processRoutes.js
// Created on 2025-12-30
// Purpose: Express routes for process CRUD operations
// Endpoints: /api/processes/:dbName/:appName

import express from "express";
import {
  getProcesses,
  getProcessById,
  createProcess,
  updateProcess,
  deleteProcess
} from "../../controllers/processController.js";

const router = express.Router();

// Get all processes for an app
router.get("/:dbName/:appName", getProcesses);

// Get single process by ID
router.get("/:dbName/:appName/:id", getProcessById);

// Create new process
router.post("/:dbName/:appName", createProcess);

// Update existing process
router.put("/:dbName/:appName/:id", updateProcess);

// Delete process
router.delete("/:dbName/:appName/:id", deleteProcess);

// End of processRoutes.js - Created on 2025-12-30

export default router;


