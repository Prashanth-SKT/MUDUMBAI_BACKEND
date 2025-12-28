/**
 * Bulk Operations Controller
 * Handles bulk create, update, and delete operations
 */
import { jayramDb as db } from '../config/firebaseAdmin.js';
import { created, ok, fail } from '../utils/responseHandler.js';
import { createLogger } from '../services/loggerService.js';
import {
  getSchemaCollectionName,
  generateRecordId,
  addSystemFieldsForCreate,
  addSystemFieldsForUpdate,
  stripSystemFields,
  chunkArray
} from '../utils/dataSchemaUtils.js';
import { validateRecord } from '../services/fieldValidationService.js';

const logger = createLogger(import.meta.url);

/**
 * POST /api/data-records/bulk-create
 * Create multiple records (max 1000)
 */
export async function bulkCreateRecords(req, res) {
  try {
    const { appId, schemaId, userId, records, appPrefix } = req.body;

    logger.info('bulkCreateRecords', 'Bulk creating records', {
      appId,
      schemaId,
      count: records?.length
    });

    // Validation
    if (!appId || !schemaId || !userId || !records || !appPrefix) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'appId, schemaId, userId, records, and appPrefix are required'
      });
    }

    if (!Array.isArray(records)) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'records must be an array'
      });
    }

    if (records.length === 0) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'At least one record is required'
      });
    }

    if (records.length > 1000) {
      return fail(res, 400, 'BULK_LIMIT_EXCEEDED', {
        details: 'Maximum 1000 records allowed per bulk create operation'
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

    // Validate all records first
    const validatedRecords = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const cleanedData = stripSystemFields(record);
      const validation = validateRecord(cleanedData, schema.fields);

      if (!validation.valid) {
        errors.push({
          index: i,
          data: record,
          errors: validation.errors
        });
      } else {
        validatedRecords.push(cleanedData);
      }
    }

    if (errors.length > 0) {
      return fail(res, 400, 'VALIDATION_ERROR', {
        details: {
          message: `${errors.length} record(s) failed validation`,
          validRecords: validatedRecords.length,
          invalidRecords: errors.length,
          errors: errors.slice(0, 10) // Return first 10 errors
        }
      });
    }

    // Process in batches of 500 (Firestore limit)
    const batches = chunkArray(validatedRecords, 500);
    let insertedCount = 0;

    for (const batch of batches) {
      const writeBatch = db.batch();

      for (const record of batch) {
        const recordId = generateRecordId();
        const recordToSave = {
          id: recordId,
          ...addSystemFieldsForCreate(record, userId)
        };

        const docRef = db.collection(schema.internalName).doc(recordId);
        writeBatch.set(docRef, recordToSave);
        insertedCount++;
      }

      await writeBatch.commit();
    }

    // Update record count
    await db.collection(schemaCollectionName).doc(schemaId).update({
      recordCount: (schema.recordCount || 0) + insertedCount,
      updatedAt: new Date()
    });

    logger.info('bulkCreateRecords', 'Bulk create completed', {
      schemaId,
      insertedCount
    });

    return created(res, {
      data: {
        insertedCount,
        totalRequested: records.length,
        failed: 0,
        errors: []
      }
    }, 'Bulk create completed successfully');
  } catch (error) {
    logger.error('bulkCreateRecords', 'Error in bulk create', error);
    return fail(res, 500, 'INTERNAL_ERROR', {
      details: error.message
    });
  }
}

/**
 * POST /api/data-records/bulk-update
 * Update multiple records (max 500)
 */
export async function bulkUpdateRecords(req, res) {
  try {
    const { appId, schemaId, userId, updates, appPrefix } = req.body;

    logger.info('bulkUpdateRecords', 'Bulk updating records', {
      appId,
      schemaId,
      count: updates?.length
    });

    // Validation
    if (!appId || !schemaId || !userId || !updates || !appPrefix) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'appId, schemaId, userId, updates, and appPrefix are required'
      });
    }

    if (!Array.isArray(updates)) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'updates must be an array'
      });
    }

    if (updates.length === 0) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'At least one update is required'
      });
    }

    if (updates.length > 500) {
      return fail(res, 400, 'BULK_LIMIT_EXCEEDED', {
        details: 'Maximum 500 updates allowed per bulk update operation'
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

    // Validate all updates
    const validatedUpdates = [];
    const errors = [];

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];

      if (!update.recordId || !update.data) {
        errors.push({
          index: i,
          recordId: update.recordId,
          error: 'recordId and data are required'
        });
        continue;
      }

      const cleanedData = stripSystemFields(update.data);
      const validation = validateRecord(cleanedData, schema.fields);

      if (!validation.valid) {
        errors.push({
          index: i,
          recordId: update.recordId,
          errors: validation.errors
        });
      } else {
        validatedUpdates.push({
          recordId: update.recordId,
          data: cleanedData
        });
      }
    }

    if (errors.length > 0) {
      return fail(res, 400, 'VALIDATION_ERROR', {
        details: {
          message: `${errors.length} update(s) failed validation`,
          validUpdates: validatedUpdates.length,
          invalidUpdates: errors.length,
          errors: errors.slice(0, 10)
        }
      });
    }

    // Process in batches of 500
    const batches = chunkArray(validatedUpdates, 500);
    let updatedCount = 0;

    for (const batch of batches) {
      const writeBatch = db.batch();

      for (const update of batch) {
        const updateData = addSystemFieldsForUpdate(update.data, userId);
        const docRef = db.collection(schema.internalName).doc(update.recordId);
        writeBatch.update(docRef, updateData);
        updatedCount++;
      }

      await writeBatch.commit();
    }

    logger.info('bulkUpdateRecords', 'Bulk update completed', {
      schemaId,
      updatedCount
    });

    return ok(res, {
      data: {
        updatedCount,
        totalRequested: updates.length,
        failed: 0
      },
      message: 'Bulk update completed successfully'
    });
  } catch (error) {
    logger.error('bulkUpdateRecords', 'Error in bulk update', error);
    return fail(res, 500, 'INTERNAL_ERROR', {
      details: error.message
    });
  }
}

/**
 * POST /api/data-records/bulk-delete
 * Delete multiple records (max 500)
 */
export async function bulkDeleteRecords(req, res) {
  try {
    const { appId, schemaId, recordIds, appPrefix } = req.body;

    logger.info('bulkDeleteRecords', 'Bulk deleting records', {
      appId,
      schemaId,
      count: recordIds?.length
    });

    // Validation
    if (!appId || !schemaId || !recordIds || !appPrefix) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'appId, schemaId, recordIds, and appPrefix are required'
      });
    }

    if (!Array.isArray(recordIds)) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'recordIds must be an array'
      });
    }

    if (recordIds.length === 0) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'At least one recordId is required'
      });
    }

    if (recordIds.length > 500) {
      return fail(res, 400, 'BULK_LIMIT_EXCEEDED', {
        details: 'Maximum 500 deletions allowed per bulk delete operation'
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

    // Process in batches of 500
    const batches = chunkArray(recordIds, 500);
    let deletedCount = 0;

    for (const batch of batches) {
      const writeBatch = db.batch();

      for (const recordId of batch) {
        const docRef = db.collection(schema.internalName).doc(recordId);
        writeBatch.delete(docRef);
        deletedCount++;
      }

      await writeBatch.commit();
    }

    // Update record count
    await db.collection(schemaCollectionName).doc(schemaId).update({
      recordCount: Math.max(0, (schema.recordCount || deletedCount) - deletedCount),
      updatedAt: new Date()
    });

    logger.info('bulkDeleteRecords', 'Bulk delete completed', {
      schemaId,
      deletedCount
    });

    return ok(res, {
      data: {
        deletedCount,
        totalRequested: recordIds.length,
        deletedIds: recordIds
      },
      message: 'Bulk delete completed successfully'
    });
  } catch (error) {
    logger.error('bulkDeleteRecords', 'Error in bulk delete', error);
    return fail(res, 500, 'INTERNAL_ERROR', {
      details: error.message
    });
  }
}

