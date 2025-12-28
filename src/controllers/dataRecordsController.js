/**
 * Data Records Controller
 * Handles record CRUD operations
 */
import { jayramDb as db } from '../config/firebaseAdmin.js';
import { created, ok, fail } from '../utils/responseHandler.js';
import { createLogger } from '../services/loggerService.js';
import {
  getSchemaCollectionName,
  generateRecordId,
  addSystemFieldsForCreate,
  addSystemFieldsForUpdate,
  stripSystemFields
} from '../utils/dataSchemaUtils.js';
import { validateRecord } from '../services/fieldValidationService.js';

const logger = createLogger(import.meta.url);

/**
 * POST /api/data-records/create
 * Create a single record
 */
export async function createRecord(req, res) {
  try {
    const { appId, schemaId, userId, data, appPrefix } = req.body;

    logger.info('createRecord', 'Creating record', { appId, schemaId, userId });

    // Validation
    if (!appId || !schemaId || !userId || !data || !appPrefix) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'appId, schemaId, userId, data, and appPrefix are required'
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

    // Validate data against schema
    const cleanedData = stripSystemFields(data);
    const validation = validateRecord(cleanedData, schema.fields);

    if (!validation.valid) {
      return fail(res, 400, 'VALIDATION_ERROR', {
        details: validation.errors
      });
    }

    // Generate record ID and add system fields
    const recordId = generateRecordId();
    const recordToSave = {
      id: recordId,
      ...addSystemFieldsForCreate(cleanedData, userId)
    };

    // Save to internal collection
    await db.collection(schema.internalName).doc(recordId).set(recordToSave);

    // Update record count
    await db.collection(schemaCollectionName).doc(schemaId).update({
      recordCount: (schema.recordCount || 0) + 1,
      updatedAt: new Date()
    });

    logger.info('createRecord', 'Record created', { recordId, schemaId });

    return created(res, { data: recordToSave }, 'Record created successfully');
  } catch (error) {
    logger.error('createRecord', 'Error creating record', error);
    return fail(res, 500, 'INTERNAL_ERROR', {
      details: error.message
    });
  }
}

/**
 * GET /api/data-records/list
 * List records with pagination
 */
export async function listRecords(req, res) {
  try {
    const {
      appId,
      schemaId,
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      searchQuery,
      appPrefix
    } = req.query;

    logger.info('listRecords', 'Listing records', {
      appId,
      schemaId,
      page,
      pageSize
    });

    // Validation
    if (!appId || !schemaId || !appPrefix) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'appId, schemaId, and appPrefix are required'
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

    // Build query
    let query = db.collection(schema.internalName);

    // Apply sorting
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sortBy, order);

    // Get total count (for pagination)
    const totalSnapshot = await db.collection(schema.internalName).get();
    const totalRecords = totalSnapshot.size;

    // Apply pagination
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    const skip = (pageNum - 1) * pageSizeNum;

    query = query.limit(pageSizeNum).offset(skip);

    // Execute query
    const recordsSnapshot = await query.get();
    let records = recordsSnapshot.docs.map(doc => doc.data());

    // Apply search filter if provided (simple text search across all fields)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      records = records.filter(record => {
        return Object.values(record).some(value => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchLower);
        });
      });
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalRecords / pageSizeNum);
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;

    logger.info('listRecords', 'Records retrieved', {
      schemaId,
      count: records.length,
      totalRecords
    });

    return ok(res, {
      data: {
        records,
        pagination: {
          currentPage: pageNum,
          pageSize: pageSizeNum,
          totalRecords,
          totalPages,
          hasNextPage,
          hasPreviousPage
        }
      }
    });
  } catch (error) {
    logger.error('listRecords', 'Error listing records', error);
    return fail(res, 500, 'INTERNAL_ERROR', {
      details: error.message
    });
  }
}

/**
 * PUT /api/data-records/update/:recordId
 * Update a single record
 */
export async function updateRecord(req, res) {
  try {
    const { recordId } = req.params;
    const { appId, schemaId, userId, data, appPrefix } = req.body;

    logger.info('updateRecord', 'Updating record', { recordId, schemaId, userId });

    // Validation
    if (!appId || !schemaId || !userId || !data || !appPrefix) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'appId, schemaId, userId, data, and appPrefix are required'
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

    // Check if record exists
    const recordDoc = await db.collection(schema.internalName).doc(recordId).get();

    if (!recordDoc.exists) {
      return fail(res, 404, 'RECORD_NOT_FOUND', {
        details: { recordId, schemaId }
      });
    }

    // Validate data against schema
    const cleanedData = stripSystemFields(data);
    const validation = validateRecord(cleanedData, schema.fields);

    if (!validation.valid) {
      return fail(res, 400, 'VALIDATION_ERROR', {
        details: validation.errors
      });
    }

    // Update with system fields
    const updates = addSystemFieldsForUpdate(cleanedData, userId);

    // Update record
    await db.collection(schema.internalName).doc(recordId).update(updates);

    // Get updated record
    const updatedDoc = await db.collection(schema.internalName).doc(recordId).get();
    const updatedRecord = updatedDoc.data();

    logger.info('updateRecord', 'Record updated', { recordId, schemaId });

    return ok(res, { data: updatedRecord }, 'Record updated successfully');
  } catch (error) {
    logger.error('updateRecord', 'Error updating record', error);
    return fail(res, 500, 'INTERNAL_ERROR', {
      details: error.message
    });
  }
}

/**
 * DELETE /api/data-records/delete/:recordId
 * Delete a single record
 */
export async function deleteRecord(req, res) {
  try {
    const { recordId } = req.params;
    const { appId, schemaId, appPrefix } = req.body;

    logger.info('deleteRecord', 'Deleting record', { recordId, schemaId });

    // Validation
    if (!appId || !schemaId || !appPrefix) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'appId, schemaId, and appPrefix are required'
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

    // Check if record exists
    const recordDoc = await db.collection(schema.internalName).doc(recordId).get();

    if (!recordDoc.exists) {
      return fail(res, 404, 'RECORD_NOT_FOUND', {
        details: { recordId, schemaId }
      });
    }

    // Delete record
    await db.collection(schema.internalName).doc(recordId).delete();

    // Update record count
    await db.collection(schemaCollectionName).doc(schemaId).update({
      recordCount: Math.max(0, (schema.recordCount || 1) - 1),
      updatedAt: new Date()
    });

    logger.info('deleteRecord', 'Record deleted', { recordId, schemaId });

    return ok(res, {
      data: { deletedRecordId: recordId },
      message: 'Record deleted successfully'
    });
  } catch (error) {
    logger.error('deleteRecord', 'Error deleting record', error);
    return fail(res, 500, 'INTERNAL_ERROR', {
      details: error.message
    });
  }
}

/**
 * POST /api/data-records/validate
 * Validate a record without saving
 */
export async function validateRecordData(req, res) {
  try {
    const { appId, schemaId, data, appPrefix } = req.body;

    logger.info('validateRecordData', 'Validating record', { appId, schemaId });

    // Validation
    if (!appId || !schemaId || !data || !appPrefix) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'appId, schemaId, data, and appPrefix are required'
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

    // Validate data against schema
    const cleanedData = stripSystemFields(data);
    const validation = validateRecord(cleanedData, schema.fields);

    if (!validation.valid) {
      return ok(res, {
        valid: false,
        errors: validation.errors
      });
    }

    return ok(res, {
      valid: true,
      errors: {}
    });
  } catch (error) {
    logger.error('validateRecordData', 'Error validating record', error);
    return fail(res, 500, 'INTERNAL_ERROR', {
      details: error.message
    });
  }
}

