// validationTemplateController.js
// Created by Claude on 2025-11-16
// Purpose: Handle CRUD operations for system validation templates
// Collection: mudumbai.system_validation_templates (platform-level templates)

import firestoreService from "../services/firestoreService.js";
import logger from "../services/loggerService.js";

/**
 * Get all system validation templates
 * GET /api/validation-templates
 */
export const getTemplates = async (req, res) => {
  logger.info(`[validationTemplateController] GET templates`);
  
  try {
    const result = await firestoreService.getDocs("system_validation_templates", "mudumbai");
    
    if (!result.success) {
      logger.error(`[validationTemplateController] Failed to get templates: ${result.error}`);
      return res.status(500).json({ error: result.error });
    }
    
    logger.info(`[validationTemplateController] Retrieved ${result.data.length} templates`);
    return res.status(200).json(result.data);
  } catch (error) {
    logger.error(`[validationTemplateController] Error getting templates: ${error.message}`);
    return res.status(500).json({ error: "Failed to fetch templates" });
  }
};

/**
 * Get a specific template by ID
 * GET /api/validation-templates/:templateId
 */
export const getTemplateById = async (req, res) => {
  const { templateId } = req.params;
  
  logger.info(`[validationTemplateController] GET template - ID: ${templateId}`);
  
  try {
    const result = await firestoreService.getDoc("system_validation_templates", templateId, "mudumbai");
    
    if (!result.success) {
      logger.error(`[validationTemplateController] Template not found: ${templateId}`);
      return res.status(404).json({ error: "Template not found" });
    }
    
    logger.info(`[validationTemplateController] Retrieved template: ${templateId}`);
    return res.status(200).json(result.data);
  } catch (error) {
    logger.error(`[validationTemplateController] Error getting template: ${error.message}`);
    return res.status(500).json({ error: "Failed to fetch template" });
  }
};

/**
 * Create a new validation template
 * POST /api/validation-templates
 */
export const createTemplate = async (req, res) => {
  const templateData = req.body;
  
  logger.info(`[validationTemplateController] CREATE template - Name: ${templateData.templateName}`);
  
  if (!templateData.templateName) {
    return res.status(400).json({ error: "templateName is required" });
  }
  
  try {
    // Generate template ID
    const templateId = templateData.id || `TEMPLATE_${Date.now()}`;
    
    // Prepare template document
    const template = {
      id: templateId,
      templateName: templateData.templateName,
      category: templateData.category || 'CUSTOM',
      description: templateData.description || '',
      conditions: templateData.conditions || [],
      errorMessage: templateData.errorMessage || '',
      successMessage: templateData.successMessage || '',
      warningMessage: templateData.warningMessage || '',
      fallbackText: templateData.fallbackText || '',
      fallbackComponent: templateData.fallbackComponent || '',
      hideSpace: templateData.hideSpace || false,
      isSystem: templateData.isSystem || false,
      version: templateData.version || "1.0",
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: templateData.createdBy || 'system'
    };
    
    const result = await firestoreService.setDoc("system_validation_templates", templateId, template, "mudumbai");
    
    if (!result.success) {
      logger.error(`[validationTemplateController] Failed to create template: ${result.error}`);
      return res.status(500).json({ error: result.error });
    }
    
    logger.info(`[validationTemplateController] Template created: ${templateId}`);
    return res.status(201).json({ id: templateId, ...template });
  } catch (error) {
    logger.error(`[validationTemplateController] Error creating template: ${error.message}`);
    return res.status(500).json({ error: "Failed to create template" });
  }
};

/**
 * Update an existing validation template
 * PUT /api/validation-templates/:templateId
 */
export const updateTemplate = async (req, res) => {
  const { templateId } = req.params;
  const updates = req.body;
  
  logger.info(`[validationTemplateController] UPDATE template - ID: ${templateId}`);
  
  try {
    // Get existing template
    const existingResult = await firestoreService.getDoc("system_validation_templates", templateId, "mudumbai");
    
    if (!existingResult.success) {
      logger.error(`[validationTemplateController] Template not found: ${templateId}`);
      return res.status(404).json({ error: "Template not found" });
    }
    
    const existing = existingResult.data;
    
    // Increment version for tracking
    const currentVersion = parseFloat(existing.version || "1.0");
    const newVersion = (currentVersion + 0.1).toFixed(1);
    
    // Prepare updated template
    const updatedTemplate = {
      ...existing,
      ...updates,
      id: templateId, // Ensure ID doesn't change
      version: newVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: updates.updatedBy || 'user',
      previousVersion: existing.version
    };
    
    const result = await firestoreService.setDoc("system_validation_templates", templateId, updatedTemplate, "mudumbai");
    
    if (!result.success) {
      logger.error(`[validationTemplateController] Failed to update template: ${result.error}`);
      return res.status(500).json({ error: result.error });
    }
    
    logger.info(`[validationTemplateController] Template updated: ${templateId} (v${newVersion})`);
    return res.status(200).json({ 
      id: templateId, 
      ...updatedTemplate,
      message: `Template updated to version ${newVersion}. ${existing.usageCount || 0} components may need syncing.`
    });
  } catch (error) {
    logger.error(`[validationTemplateController] Error updating template: ${error.message}`);
    return res.status(500).json({ error: "Failed to update template" });
  }
};

/**
 * Delete a validation template
 * DELETE /api/validation-templates/:templateId
 */
export const deleteTemplate = async (req, res) => {
  const { templateId } = req.params;
  
  logger.info(`[validationTemplateController] DELETE template - ID: ${templateId}`);
  
  try {
    // Check if template is a system template
    const existingResult = await firestoreService.getDoc("system_validation_templates", templateId, "mudumbai");
    
    if (!existingResult.success) {
      logger.error(`[validationTemplateController] Template not found: ${templateId}`);
      return res.status(404).json({ error: "Template not found" });
    }
    
    if (existingResult.data.isSystem) {
      logger.warn(`[validationTemplateController] Attempt to delete system template: ${templateId}`);
      return res.status(403).json({ error: "Cannot delete system templates" });
    }
    
    const result = await firestoreService.deleteDoc("system_validation_templates", templateId, "mudumbai");
    
    if (!result.success) {
      logger.error(`[validationTemplateController] Failed to delete template: ${result.error}`);
      return res.status(500).json({ error: result.error });
    }
    
    logger.info(`[validationTemplateController] Template deleted: ${templateId}`);
    return res.status(200).json({ message: "Template deleted successfully" });
  } catch (error) {
    logger.error(`[validationTemplateController] Error deleting template: ${error.message}`);
    return res.status(500).json({ error: "Failed to delete template" });
  }
};

/**
 * Increment usage count when template is applied
 * POST /api/validation-templates/:templateId/use
 */
export const incrementUsageCount = async (req, res) => {
  const { templateId } = req.params;
  
  logger.info(`[validationTemplateController] INCREMENT usage - ID: ${templateId}`);
  
  try {
    const existingResult = await firestoreService.getDoc("system_validation_templates", templateId, "mudumbai");
    
    if (!existingResult.success) {
      logger.error(`[validationTemplateController] Template not found: ${templateId}`);
      return res.status(404).json({ error: "Template not found" });
    }
    
    const existing = existingResult.data;
    const updatedCount = (existing.usageCount || 0) + 1;
    
    const result = await firestoreService.setDoc("system_validation_templates", templateId, {
      ...existing,
      usageCount: updatedCount,
      lastUsedAt: new Date().toISOString()
    }, "mudumbai");
    
    if (!result.success) {
      logger.error(`[validationTemplateController] Failed to increment usage: ${result.error}`);
      return res.status(500).json({ error: result.error });
    }
    
    logger.info(`[validationTemplateController] Usage incremented: ${templateId} (count: ${updatedCount})`);
    return res.status(200).json({ usageCount: updatedCount });
  } catch (error) {
    logger.error(`[validationTemplateController] Error incrementing usage: ${error.message}`);
    return res.status(500).json({ error: "Failed to increment usage count" });
  }
};

/**
 * Initialize default system templates (Always, Never, Date Range, Time Range)
 * POST /api/validation-templates/init-defaults
 */
export const initializeDefaultTemplates = async (req, res) => {
  logger.info(`[validationTemplateController] INIT default system templates`);
  
  const defaultTemplates = [
    {
      id: "TEMPLATE_ALWAYS",
      templateName: "Always Show",
      category: "STATIC",
      description: "Component is always visible regardless of conditions",
      conditions: [],
      errorMessage: "",
      successMessage: "",
      warningMessage: "",
      fallbackText: "",
      fallbackComponent: "",
      hideSpace: false,
      isSystem: true,
      version: "1.0",
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system"
    },
    {
      id: "TEMPLATE_NEVER",
      templateName: "Never Show",
      category: "STATIC",
      description: "Component is always hidden",
      conditions: [],
      errorMessage: "",
      successMessage: "",
      warningMessage: "",
      fallbackText: "This feature is not available",
      fallbackComponent: "",
      hideSpace: true,
      isSystem: true,
      version: "1.0",
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system"
    },
    {
      id: "TEMPLATE_DATE_RANGE",
      templateName: "Date Range",
      category: "STATIC",
      description: "Show component only within specified date range",
      conditions: [
        {
          id: 1,
          logicalOperator: "IF",
          collection: "system",
          field: "currentDate",
          operator: "BETWEEN",
          value: ["", ""] // User will fill in dates
        }
      ],
      errorMessage: "Not available during this period",
      successMessage: "",
      warningMessage: "Limited time offer",
      fallbackText: "Available soon",
      fallbackComponent: "",
      hideSpace: false,
      isSystem: true,
      version: "1.0",
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system"
    },
    {
      id: "TEMPLATE_TIME_RANGE",
      templateName: "Time Range",
      category: "STATIC",
      description: "Show component only within specified time range",
      conditions: [
        {
          id: 1,
          logicalOperator: "IF",
          collection: "system",
          field: "currentTime",
          operator: "BETWEEN",
          value: ["", ""] // User will fill in times
        }
      ],
      errorMessage: "Not available at this time",
      successMessage: "",
      warningMessage: "Available during business hours only",
      fallbackText: "Currently unavailable",
      fallbackComponent: "",
      hideSpace: false,
      isSystem: true,
      version: "1.0",
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system"
    }
  ];
  
  try {
    const results = [];
    
    for (const template of defaultTemplates) {
      // Check if template already exists
      const existingResult = await firestoreService.getDoc("system_validation_templates", template.id, "mudumbai");
      
      if (existingResult.success) {
        logger.info(`[validationTemplateController] Template already exists: ${template.id}`);
        results.push({ id: template.id, status: "exists" });
        continue;
      }
      
      // Create template
      const result = await firestoreService.setDoc("system_validation_templates", template.id, template, "mudumbai");
      
      if (result.success) {
        logger.info(`[validationTemplateController] Template created: ${template.id}`);
        results.push({ id: template.id, status: "created" });
      } else {
        logger.error(`[validationTemplateController] Failed to create template: ${template.id}`);
        results.push({ id: template.id, status: "failed", error: result.error });
      }
    }
    
    logger.info(`[validationTemplateController] Default templates initialized`);
    return res.status(200).json({ 
      message: "Default templates initialized",
      results: results
    });
  } catch (error) {
    logger.error(`[validationTemplateController] Error initializing templates: ${error.message}`);
    return res.status(500).json({ error: "Failed to initialize default templates" });
  }
};

export default {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  incrementUsageCount,
  initializeDefaultTemplates
};




