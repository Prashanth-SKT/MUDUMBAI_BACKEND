/**
 * AppService (Application layer) – SRP & DIP
 * - encapsulates the orchestration for "create app" use case.
 * - depends on abstractions (firestoreService), injected via constructor.
 */

import logger from "./loggerService.js";

export class AppService {
  /**
   * @param {object} deps
   * @param {import('./firestoreService.js').default} deps.firestore
   */
  constructor({ firestore }) {
    this.firestore = firestore;
  }

  /**
   * Create the app's base collections and an apps_meta entry.
   * This method is called from: AppController.createApp (POST /api/app/create)
   * 
   * Creates 4 collections in JAYRAM database:
   * 1. {appPrefix}_pages - Stores page configurations
   * 2. {appPrefix}_components - Stores reusable components
   * 3. {appPrefix}_layouts - Stores layout templates
   * 4. {appPrefix}_theme - Stores theme/styling configuration
   * 
   * @param {string} appName - Original app name as provided by user
   * @param {string} description - Optional description
   * @param {string} createdBy - Optional user id/email (future-proof)
   * @returns {Promise<{collections: string[], appPrefix: string}>}
   */
  async createApp(appName, description = "", createdBy = "system") {
    // Normalize app name to collection prefix (e.g., "My App" -> "myapp")
    // Remove special characters, convert to lowercase for consistency
    const appPrefix = appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
    
    // Define the 4 required collections for each app
    // IMPORTANT: These names must match what frontend expects
    const collections = [
      `${appPrefix}_pages`,      // Page configurations and layouts
      `${appPrefix}_components`, // Reusable UI components
      `${appPrefix}_layouts`,    // Layout templates
      `${appPrefix}_theme`,      // Theme and styling (singular, not plural)
    ];

    // Firestore is schemaless; collections are created on first document write.
    // We will create a sentinel doc in each collection to ensure existence.
    const sentinelDoc = { _meta: "init", createdAt: new Date().toISOString() };

    for (const col of collections) {
      const result = await this.firestore.upsertDoc(col, "_init", sentinelDoc);
      if (!result.success) {
        logger.error(`[AppService] Failed to create/init collection=${col} error=${result.error}`);
        throw new Error(`Failed to initialize collection: ${col}`);
      }
      logger.info(`[AppService] Initialized collection: ${col}`);
    }

    // Create/update apps_meta record
    const now = new Date().toISOString();
    const appsMetaPayload = {
      appName,
      appPrefix,
      description,
      collections,
      createdBy,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    const metaResult = await this.firestore.upsertDoc("apps_meta", appPrefix, appsMetaPayload);
    if (!metaResult.success) {
      logger.error(`[AppService] Failed to write apps_meta for appPrefix=${appPrefix} error=${metaResult.error}`);
      throw new Error("Failed to write apps_meta");
    }
    logger.info(`[AppService] apps_meta created/updated for appPrefix=${appPrefix}`);

    // ---------------------------------------------------------------
    // NEW BLOCK: Add ownership record in MUDUMBAI.app_users mapping
    // fixed/updated by ChatGPT on 2025-10-18 23:16:58 – Added mapping entry to mudumbai DB to track user↔app ownership
    try {
      const appUserDoc = {
        appPrefix,
        uid: createdBy,
        role: "appAdmin",
        createdAt: now,
        updatedAt: now,
      };

      // Write to mudumbai.app_users collection
      const mappingResult = await this.firestore.upsertDoc("app_users", `${createdBy}_${appPrefix}`, appUserDoc, "mudumbai");
      if (!mappingResult.success) {
        logger.warn(`[AppService] Ownership mapping failed for uid=${createdBy}, app=${appPrefix}: ${mappingResult.error}`);
      } else {
        logger.info(`[AppService] Ownership mapping created in mudumbai.app_users for uid=${createdBy}, app=${appPrefix}`);
      }
    } catch (mapErr) {
      logger.error(`[AppService] Failed to create user↔app mapping in mudumbai for ${createdBy}: ${mapErr.message}`);
    }
    // ---------------------------------------------------------------

    return { collections, appPrefix };
  }
}

export default AppService;
