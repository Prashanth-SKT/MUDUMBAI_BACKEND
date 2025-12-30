/**
 * templateController.js
 * Controller for template-based page generation
 * Provides endpoints for generating pages without OpenAI
 */

import { ok, created, fail } from "../utils/responseHandler.js";
import { AppError } from "../utils/errorHandler.js";
import TemplateGenerationService from "../services/templateGenerationService.js";
import firestoreService from "../services/firestoreService.js";
import logger from "../services/loggerService.js";

/**
 * GET /api/template/types
 * List all available template types
 */
export const getTemplateTypes = async (req, res, next) => {
  try {
    const types = TemplateGenerationService.getAvailableTypes();
    
    logger.info(`[TemplateController] Retrieved ${types.length} template types`);
    return ok(res, { types }, "Template types retrieved successfully");
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message || "Failed to get template types", 500));
  }
};

/**
 * GET /api/template/preview/:type
 * Get preview of template structure
 */
export const getTemplatePreview = async (req, res, next) => {
  try {
    const { type } = req.params;
    
    if (!type) {
      return fail(res, 400, "Template type is required");
    }

    const preview = TemplateGenerationService.getTemplatePreview(type);
    
    logger.info(`[TemplateController] Retrieved preview for template: ${type}`);
    return ok(res, preview, "Template preview retrieved successfully");
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message || "Failed to get template preview", 500));
  }
};

/**
 * POST /api/template/generate
 * Generate pages from template
 * 
 * Request Body:
 * {
 *   appName: string,
 *   appType: string (e-commerce, booking, portfolio, etc.),
 *   content: object (optional content to fill in)
 * }
 */
export const generateFromTemplate = async (req, res, next) => {
  try {
    const { appName, appType, content } = req.body;
    
    if (!appName || !appType) {
      return fail(res, 400, "appName and appType are required");
    }

    logger.info(`[TemplateController] Generating pages for ${appName} using ${appType} template`);
    
    const result = TemplateGenerationService.generatePageJson(
      appName,
      appType,
      content || {}
    );
    
    logger.info(`[TemplateController] Generated ${result.pages.length} pages for ${appName}`);
    return ok(res, result, "Pages generated successfully from template");
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message || "Failed to generate from template", 500));
  }
};

/**
 * POST /api/template/generate-and-save
 * Generate pages from template and save directly to Firestore
 * 
 * Request Body:
 * {
 *   appName: string,
 *   appType: string,
 *   content: object (optional)
 * }
 */
export const generateAndSave = async (req, res, next) => {
  try {
    const { appName, appType, content } = req.body;
    
    if (!appName || !appType) {
      return fail(res, 400, "appName and appType are required");
    }

    logger.info(`[TemplateController] Generating and saving pages for ${appName} using ${appType} template`);
    
    // Generate pages
    const result = TemplateGenerationService.generatePageJson(
      appName,
      appType,
      content || {}
    );
    
    // Save each page to Firestore
    const savedPages = [];
    const errors = [];
    
    for (const page of result.pages) {
      try {
        const collectionName = `${appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "")}_pages`;
        const docId = page.id.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
        
        const saveResult = await firestoreService.upsertDoc(collectionName, docId, page);
        
        if (saveResult.success) {
          savedPages.push({ pageName: page.name, docId });
          logger.info(`[TemplateController] Saved page: ${page.name} to ${collectionName}/${docId}`);
        } else {
          errors.push({ pageName: page.name, error: saveResult.error });
          logger.error(`[TemplateController] Failed to save page: ${page.name} - ${saveResult.error}`);
        }
      } catch (saveError) {
        errors.push({ pageName: page.name, error: saveError.message });
        logger.error(`[TemplateController] Error saving page: ${page.name} - ${saveError.message}`);
      }
    }
    
    if (errors.length > 0) {
      logger.warn(`[TemplateController] Saved ${savedPages.length} pages with ${errors.length} errors`);
      return ok(res, {
        pagesGenerated: result.pages.length,
        pagesSaved: savedPages.length,
        savedPages,
        errors
      }, "Pages generated with some errors");
    }
    
    logger.info(`[TemplateController] Successfully generated and saved ${savedPages.length} pages for ${appName}`);
    return created(res, {
      pagesGenerated: result.pages.length,
      pagesSaved: savedPages.length,
      appName,
      savedPages
    }, "Pages generated and saved successfully");
    
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message || "Failed to generate and save pages", 500));
  }
};

export default {
  getTemplateTypes,
  getTemplatePreview,
  generateFromTemplate,
  generateAndSave
};






