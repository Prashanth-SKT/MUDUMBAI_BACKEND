// validationTemplateRoutes.js
// Created by Claude on 2025-11-16
// Purpose: Routes for system validation template management
// Base path: /api/validation-templates

import express from 'express';
import validationTemplateController from '../../controllers/validationTemplateController.js';

const router = express.Router();

// GET all templates
router.get('/', validationTemplateController.getTemplates);

// GET specific template by ID
router.get('/:templateId', validationTemplateController.getTemplateById);

// POST create new template
router.post('/', validationTemplateController.createTemplate);

// PUT update template
router.put('/:templateId', validationTemplateController.updateTemplate);

// DELETE template
router.delete('/:templateId', validationTemplateController.deleteTemplate);

// POST increment usage count
router.post('/:templateId/use', validationTemplateController.incrementUsageCount);

// POST initialize default system templates
router.post('/init-defaults/seed', validationTemplateController.initializeDefaultTemplates);

export default router;




