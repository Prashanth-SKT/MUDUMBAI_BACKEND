/**
 * openAiService.js
 * ----------------
 * Encapsulates all logic for interacting with OpenAI APIs.
 * Two main methods:
 *  - generateContent: creates descriptive marketing text
 *  - generatePageJson: builds structured JSON based on content
 */
import OpenAI from "openai";
import logger from "./loggerService.js";

// Lazy initialization - client will be created when first needed
let client = null;

const getClient = () => {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
};

export const OpenAiService = {
  async generateContent(appName, description) {
    try {
      const prompt = `
You are an AI content writer for a no-code web app platform.
Generate the most engaging marketing content for 5 pages (Home, About, Services, Features, Contact).
For each page, include copy and indicate where it should be placed (hero, card, CTA, image, etc.).

App Name: ${appName}
Description: ${description}

### REQUIRED OUTPUT FORMAT
{
  "pages": [
    {
      "id": "page-home",
      "title": "Home",
      "sections": [
        { "type": "hero", "headline": "catchy headline", "subheading": "engaging subheading", "callToAction": "CTA text" },
        { "type": "features", "items": ["feature 1 sentence", "feature 2 sentence", "feature 3 sentence"] },
        { "type": "card", "title": "card title", "description": "card description" }
      ]
    },
    {
      "id": "page-about",
      "title": "About",
      "sections": [
        { "type": "paragraph", "content": "1-2 paragraph app description" },
        { "type": "image", "alt": "descriptive text", "caption": "caption text" }
      ]
    }
    // Repeat for Services, Features, Contact
  ],
  "tagline": "short catchy tagline for the app",
  "globalCTA": "short call-to-action text"
}

### RULES
- Strict JSON only.
- No explanations or extra text.
- Content must be professional, persuasive, and engaging.
- Ensure each section clearly states its type (hero, card, paragraph, image, CTA).`;

      const response = await getClient().chat.completions.create({
        model: "gpt-4o",
        temperature: 0.8,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const content = JSON.parse(response.choices[0].message.content);
      logger.info(`AI content generated for app: ${appName}`);
      return content;
    } catch (error) {
      logger.error(`OpenAI content generation failed: ${error.message}`);
      throw error;
    }
  },

  async generatePageJson(appName, description, content) {
    try {
      const currentTimestamp = new Date().toISOString();
      const compId = () => `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // System message with schema
      const systemMessage = `You generate JSON for a React platform. CRITICAL RULE: Components must be FULL OBJECTS with commonAttrs and specificAttrs, embedded in pages.components array.

EXACT SCHEMA - DO NOT DEVIATE:
Page: {id, name, appName, layoutId, themeId, savedAt, updatedAt, components:[FULL_COMPONENT_OBJECTS]}
Component: {id, type, name, appName, createdAt, updatedAt, commonAttrs:{width,height,padding[4],margin[4],backgroundColor,borderRadius,boxShadow}, specificAttrs:{...}}

Component types (lowercase only): form, button, text, card, image`;

      // User message with example and content
      const userPrompt = `App: ${appName}

Content to use:
${JSON.stringify(content, null, 2)}

Generate 5 pages. MATCH THIS EXACT STRUCTURE:

{"pages": [{
  "id": "home",
  "name": "Home", 
  "appName": "${appName}",
  "layoutId": "two-column",
  "themeId": "modern",
  "savedAt": "${currentTimestamp}",
  "updatedAt": "${currentTimestamp}",
  "components": [{
    "id": "${compId()}",
    "type": "text",
    "name": "Hero Headline",
    "appName": "${appName}",
    "createdAt": "${currentTimestamp}",
    "updatedAt": "${currentTimestamp}",
    "commonAttrs": {
      "width": "100", "height": "auto",
      "paddingTop": "32", "paddingBottom": "32", "paddingLeft": "16", "paddingRight": "16",
      "marginTop": "0", "marginBottom": "24", "marginLeft": "0", "marginRight": "0",
      "backgroundColor": "transparent", "borderRadius": "0", "boxShadow": "none"
    },
    "specificAttrs": {
      "content": "USE HEADLINE FROM CONTENT",
      "variant": "h1",
      "fontSize": "48px",
      "fontWeight": "bold",
      "textAlign": "center",
      "color": "#000000"
    }
  }, {
    "id": "${compId()}",
    "type": "form",
    "name": "Contact Form",
    "appName": "${appName}",
    "createdAt": "${currentTimestamp}",
    "updatedAt": "${currentTimestamp}",
    "commonAttrs": {
      "width": "100", "height": "auto",
      "paddingTop": "16", "paddingBottom": "16", "paddingLeft": "16", "paddingRight": "16",
      "marginTop": "0", "marginBottom": "16", "marginLeft": "0", "marginRight": "0",
      "backgroundColor": "transparent", "borderRadius": "8", "boxShadow": "none"
    },
    "specificAttrs": {
      "formType": "Contact",
      "title": "USE TITLE FROM CONTENT",
      "description": "USE DESCRIPTION FROM CONTENT",
      "submitLabel": "Send",
      "fields": [
        {"id": "name", "label": "Name", "type": "text", "required": true, "validation": {"minLength": 2, "maxLength": 100, "customMessage": "Enter name"}, "dataSource": {"type": "manual"}, "visibility": true, "defaultValue": ""},
        {"id": "email", "label": "Email", "type": "email", "required": true, "validation": {"pattern": "email", "customMessage": "Valid email required"}, "dataSource": {"type": "manual"}, "visibility": true, "defaultValue": ""},
        {"id": "message", "label": "Message", "type": "textarea", "required": true, "validation": {"minLength": 10, "maxLength": 1000, "customMessage": "Min 10 chars"}, "dataSource": {"type": "manual"}, "visibility": true, "defaultValue": ""}
      ],
      "ui": {"themeTokens": "default", "spacingHints": "responsive"},
      "actions": [{"action": "showMessage", "title": "Thank You!", "message": "Message received", "buttonText": "Close", "autoClose": 0}]
    }
  }]
}]}

Generate 5 pages (Home, About, Services, Features, Contact) following EXACT structure above. Use lowercase types. Fill content from provided CONTENT. Output JSON only.`;

      const response = await getClient().chat.completions.create({
        model: "gpt-4o",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
      });

      const json = JSON.parse(response.choices[0].message.content);
      logger.info(`AI page JSON generated for app: ${appName}`);
      return json;
    } catch (error) {
      logger.error(`OpenAI page JSON generation failed: ${error.message}`);
      throw error;
    }
  },
};

export default OpenAiService;
