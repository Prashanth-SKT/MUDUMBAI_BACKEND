/**
 * openAiController.js
 * -------------------
 * Handles AI request validation, response shaping, and delegates to OpenAiService.
 */
import { ok, fail } from "../utils/responseHandler.js";
import { OpenAiService } from "../services/openAiService.js";

export const generateContent = async (req, res) => {
  try {
    const { appName, description } = req.body;
    if (!appName || !description)
      return fail(res, 400, "appName and description are required");

    const result = await OpenAiService.generateContent(appName, description);
    return ok(res, result, "AI content generated successfully");
  } catch (error) {
    return fail(res, 500, error.message || "Failed to generate AI content");
  }
};

export const generatePageJson = async (req, res) => {
  try {
    const { appName, description, content } = req.body;
    if (!appName || !description || !content)
      return fail(res, 400, "appName, description, and content are required");

    const result = await OpenAiService.generatePageJson(appName, description, content);
    return ok(res, result, "Page JSON generated successfully");
  } catch (error) {
    return fail(res, 500, error.message || "Failed to generate page JSON");
  }
};
