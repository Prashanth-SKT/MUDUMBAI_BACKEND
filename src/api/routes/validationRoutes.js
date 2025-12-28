// validationRoutes.js
// Created by Claude on 2025-11-10
// Purpose: Express routes for validation CRUD operations
// Endpoints: /api/validations/:dbName/:appName

import express from "express";
import {
  getValidations,
  getValidationById,
  createValidation,
  updateValidation,
  deleteValidation
} from "../../controllers/validationController.js";

const router = express.Router();

// Get all validations for an app
router.get("/:dbName/:appName", getValidations);

// Get single validation by ID
router.get("/:dbName/:appName/:id", getValidationById);

// Create new validation
router.post("/:dbName/:appName", createValidation);

// Update existing validation
router.put("/:dbName/:appName/:id", updateValidation);

// Delete validation
router.delete("/:dbName/:appName/:id", deleteValidation);

// End of validationRoutes.js - Created by Claude on 2025-11-10

export default router;


