/**
 * Data Schema Controller
 * Handles table schema management (create, list, get, delete)
 */
import { jayramDb as db } from '../config/firebaseAdmin.js';
import { created, ok, fail } from '../utils/responseHandler.js';
import { createLogger } from '../services/loggerService.js';
import {
  generateInternalTableName,
  getSchemaCollectionName,
  generateSchemaId,
  validateDisplayName,
  validateFieldConfig,
  addSystemFieldsForCreate
} from '../utils/dataSchemaUtils.js';
import { isValidFieldType } from '../services/fieldValidationService.js';

const logger = createLogger(import.meta.url);

/**
 * POST /api/data-schemas/create
 * Create a new table schema with obfuscated internal name
 */
export async function createSchema(req, res) {
  try {
    const { appId, appPrefix, displayName, fields, userId } = req.body;

    logger.info('createSchema', 'Creating new schema', { appId, displayName, userId });

    // Validation
    if (!appId || !appPrefix || !displayName || !fields || !userId) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'appId, appPrefix, displayName, fields, and userId are required'
      });
    }

    // Validate display name
    const nameValidation = validateDisplayName(displayName);
    if (!nameValidation.valid) {
      return fail(res, 400, 'VALIDATION_ERROR', {
        details: nameValidation.error
      });
    }

    // Validate fields
    if (!Array.isArray(fields) || fields.length === 0) {
      return fail(res, 400, 'VALIDATION_ERROR', {
        details: 'At least one field is required'
      });
    }

    if (fields.length > 50) {
      return fail(res, 400, 'FIELD_LIMIT_EXCEEDED', {
        details: 'Maximum 50 fields allowed per table'
      });
    }

    // Validate each field
    const fieldNames = new Set();
    for (const field of fields) {
      // Check for duplicates
      if (fieldNames.has(field.name)) {
        return fail(res, 400, 'DUPLICATE_FIELD', {
          details: { field: field.name, reason: 'Field name must be unique' }
        });
      }
      fieldNames.add(field.name);

      // Validate field config
      const fieldValidation = validateFieldConfig(field);
      if (!fieldValidation.valid) {
        return fail(res, 400, 'VALIDATION_ERROR', {
          details: { field: field.name, reason: fieldValidation.errors.join(', ') }
        });
      }

      // Validate field type
      if (!isValidFieldType(field.type)) {
        return fail(res, 400, 'INVALID_FIELD_TYPE', {
          details: { field: field.name, type: field.type }
        });
      }
    }

    // Check for duplicate table name in this app
    const schemaCollectionName = getSchemaCollectionName(appPrefix);
    const existingSchemas = await db
      .collection(schemaCollectionName)
      .where('appId', '==', appId)
      .where('displayName', '==', displayName)
      .get();

    if (!existingSchemas.empty) {
      return fail(res, 409, 'DUPLICATE_TABLE', {
        details: {
          displayName,
          existingSchemaId: existingSchemas.docs[0].id
        }
      });
    }

    // Generate internal table name (obfuscated)
    const timestamp = Date.now();
    const internalName = generateInternalTableName(appPrefix, displayName, timestamp);
    const schemaId = generateSchemaId();

    // Create schema document
    const schemaData = {
      schemaId,
      displayName,
      internalName,
      appId,
      appPrefix,
      fields,
      recordCount: 0,
      ...addSystemFieldsForCreate({}, userId)
    };

    // Save to Firestore
    await db.collection(schemaCollectionName).doc(schemaId).set(schemaData);

    logger.info('createSchema', 'Schema created successfully', {
      schemaId,
      displayName,
      internalName
    });

    return created(res, { data: schemaData }, 'Schema created successfully');
  } catch (error) {
    logger.error('createSchema', 'Error creating schema', error);
    return fail(res, 500, 'INTERNAL_ERROR', {
      details: error.message
    });
  }
}

/**
 * GET /api/data-schemas/:appId
 * List all table schemas for an app with record counts
 */
export async function listSchemas(req, res) {
  try {
    const { appId } = req.params;
    const { appPrefix } = req.query;

    logger.info('listSchemas', 'Listing schemas', { appId });

    if (!appId) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'appId is required'
      });
    }

    if (!appPrefix) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'appPrefix is required'
      });
    }

    const schemaCollectionName = getSchemaCollectionName(appPrefix);
    const schemasSnapshot = await db
      .collection(schemaCollectionName)
      .where('appId', '==', appId)
      .get();

    // Sort in memory to avoid Firestore composite index requirement
    const schemas = schemasSnapshot.docs
      .map(doc => doc.data())
      .sort((a, b) => {
        const aTime = a.createdAt?._seconds || 0;
        const bTime = b.createdAt?._seconds || 0;
        return bTime - aTime; // desc order
      });

    logger.info('listSchemas', 'Schemas retrieved', {
      appId,
      count: schemas.length
    });

    return ok(res, {
      data: {
        schemas,
        totalTables: schemas.length
      }
    });
  } catch (error) {
    logger.error('listSchemas', 'Error listing schemas', error);
    return fail(res, 500, 'INTERNAL_ERROR', {
      details: error.message
    });
  }
}

/**
 * GET /api/data-schemas/:appId/:schemaId
 * Get a single table schema
 */
export async function getSchema(req, res) {
  try {
    const { appId, schemaId } = req.params;
    const { appPrefix } = req.query;

    logger.info('getSchema', 'Getting schema', { appId, schemaId });

    if (!appId || !schemaId) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'appId and schemaId are required'
      });
    }

    if (!appPrefix) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'appPrefix is required'
      });
    }

    const schemaCollectionName = getSchemaCollectionName(appPrefix);
    const schemaDoc = await db.collection(schemaCollectionName).doc(schemaId).get();

    if (!schemaDoc.exists) {
      return fail(res, 404, 'SCHEMA_NOT_FOUND', {
        details: { schemaId, appId }
      });
    }

    const schema = schemaDoc.data();

    // Verify it belongs to the requested app
    if (schema.appId !== appId) {
      return fail(res, 404, 'SCHEMA_NOT_FOUND', {
        details: { schemaId, appId }
      });
    }

    logger.info('getSchema', 'Schema retrieved', { schemaId });

    return ok(res, { data: schema });
  } catch (error) {
    logger.error('getSchema', 'Error getting schema', error);
    return fail(res, 500, 'INTERNAL_ERROR', {
      details: error.message
    });
  }
}

/**
 * DELETE /api/data-schemas/:schemaId
 * Delete a table schema and all its data
 * CRITICAL: Only app owner can delete tables
 */
export async function deleteSchema(req, res) {
  try {
    const { schemaId } = req.params;
    const { appId, userId, confirmDelete, appPrefix } = req.body;

    logger.info('deleteSchema', 'Deleting schema', { schemaId, appId, userId });

    // Validation
    if (!appId || !userId || !confirmDelete || !appPrefix) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'appId, userId, confirmDelete, and appPrefix are required'
      });
    }

    if (confirmDelete !== true) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'confirmDelete must be true'
      });
    }

    // Get schema
    const schemaCollectionName = getSchemaCollectionName(appPrefix);
    const schemaDoc = await db.collection(schemaCollectionName).doc(schemaId).get();

    if (!schemaDoc.exists) {
      return fail(res, 404, 'SCHEMA_NOT_FOUND', {
        details: { schemaId, appId }
      });
    }

    const schema = schemaDoc.data();

    // Verify app ownership
    // TODO: This should check the app's createdBy field from apps_meta collection
    // For now, we'll check if the user created the schema
    if (schema.createdBy !== userId) {
      return fail(res, 403, 'FORBIDDEN_NOT_OWNER', {
        details: {
          message: 'Only app owner can delete tables',
          userId,
          schemaCreatedBy: schema.createdBy
        }
      });
    }

    // Count records before deletion
    const internalName = schema.internalName;
    const recordsSnapshot = await db.collection(internalName).get();
    const recordCount = recordsSnapshot.size;

    // Delete all records in the table
    const batch = db.batch();
    recordsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Delete schema
    await db.collection(schemaCollectionName).doc(schemaId).delete();

    logger.info('deleteSchema', 'Schema and records deleted', {
      schemaId,
      displayName: schema.displayName,
      deletedRecords: recordCount
    });

    return ok(res, {
      data: {
        schemaId,
        displayName: schema.displayName,
        deletedRecords: recordCount
      },
      message: `Table '${schema.displayName}' and ${recordCount} records deleted successfully`
    });
  } catch (error) {
    logger.error('deleteSchema', 'Error deleting schema', error);
    return fail(res, 500, 'INTERNAL_ERROR', {
      details: error.message
    });
  }
}

