/**
 * CSV Import/Export Controller
 * Handles CSV file upload, parsing, import, and export
 */
import { jayramDb as db } from '../config/firebaseAdmin.js';
import { created, ok, fail } from '../utils/responseHandler.js';
import { createLogger } from '../services/loggerService.js';
import {
  generateInternalTableName,
  getSchemaCollectionName,
  generateSchemaId,
  generateRecordId,
  addSystemFieldsForCreate,
  chunkArray
} from '../utils/dataSchemaUtils.js';
import { detectFieldType, validateRecord } from '../services/fieldValidationService.js';
import { parseCSV, generateCSV, validateCSVFile } from '../services/csvService.js';

const logger = createLogger(import.meta.url);

/**
 * POST /api/data-records/import-csv
 * Import CSV file - create new table or append to existing
 */
export async function importCSV(req, res) {
  try {
    const file = req.file;
    const { appId, appPrefix, userId, createNewTable, displayName, schemaId } = req.body;

    logger.info('importCSV', 'Importing CSV', {
      appId,
      createNewTable,
      displayName,
      schemaId,
      fileSize: file?.size
    });

    // Validate file
    const fileValidation = validateCSVFile(file);
    if (!fileValidation.valid) {
      return fail(res, 400, 'CSV_PARSE_ERROR', {
        details: fileValidation.error
      });
    }

    // Validate required fields
    if (!appId || !appPrefix || !userId) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'appId, appPrefix, and userId are required'
      });
    }

    const isNewTable = createNewTable === 'true' || createNewTable === true;

    if (isNewTable && !displayName) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'displayName is required when createNewTable is true'
      });
    }

    if (!isNewTable && !schemaId) {
      return fail(res, 400, 'INVALID_INPUT', {
        details: 'schemaId is required when createNewTable is false'
      });
    }

    // Parse CSV
    const csvContent = file.buffer.toString('utf-8');
    const parsed = parseCSV(csvContent);

    logger.info('importCSV', 'CSV parsed', {
      headers: parsed.headers,
      rowCount: parsed.rows.length
    });

    if (parsed.rows.length === 0) {
      return fail(res, 400, 'CSV_PARSE_ERROR', {
        details: 'CSV file contains no data rows'
      });
    }

    // Handle new table creation
    if (isNewTable) {
      return await importCSVCreateNewTable(
        res,
        appId,
        appPrefix,
        userId,
        displayName,
        parsed
      );
    }

    // Handle appending to existing table
    return await importCSVAppendToTable(
      res,
      appId,
      appPrefix,
      userId,
      schemaId,
      parsed
    );
  } catch (error) {
    logger.error('importCSV', 'Error importing CSV', error);
    return fail(res, 500, 'INTERNAL_ERROR', {
      details: error.message
    });
  }
}

/**
 * Import CSV and create new table
 */
async function importCSVCreateNewTable(res, appId, appPrefix, userId, displayName, parsed) {
  try {
    logger.info('importCSVCreateNewTable', 'Creating new table from CSV', { displayName });

    // Auto-detect field types
    const fields = parsed.headers.map(header => {
      const columnData = parsed.rows.map(row => row[header]);
      const detected = detectFieldType(columnData);

      if (typeof detected === 'object' && detected.type) {
        return {
          name: header,
          type: detected.type,
          required: false,
          options: detected.options || []
        };
      }

      return {
        name: header,
        type: detected,
        required: false,
        options: []
      };
    });

    logger.info('importCSVCreateNewTable', 'Field types detected', { fields });

    // Generate internal table name
    const timestamp = Date.now();
    const internalName = generateInternalTableName(appPrefix, displayName, timestamp);
    const schemaIdNew = generateSchemaId();

    // Create schema
    const schemaCollectionName = getSchemaCollectionName(appPrefix);
    const schemaData = {
      schemaId: schemaIdNew,
      displayName,
      internalName,
      appId,
      appPrefix,
      fields,
      recordCount: 0,
      ...addSystemFieldsForCreate({}, userId)
    };

    await db.collection(schemaCollectionName).doc(schemaIdNew).set(schemaData);

    // Insert all records with system fields
    const recordsToInsert = parsed.rows.map(row => ({
      id: generateRecordId(),
      ...addSystemFieldsForCreate(row, userId)
    }));

    // Process in batches of 500
    const batches = chunkArray(recordsToInsert, 500);
    let insertedCount = 0;

    for (const batch of batches) {
      const writeBatch = db.batch();

      for (const record of batch) {
        const docRef = db.collection(internalName).doc(record.id);
        writeBatch.set(docRef, record);
        insertedCount++;
      }

      await writeBatch.commit();
    }

    // Update record count
    await db.collection(schemaCollectionName).doc(schemaIdNew).update({
      recordCount: insertedCount
    });

    logger.info('importCSVCreateNewTable', 'Table created and records imported', {
      schemaId: schemaIdNew,
      insertedCount
    });

    return created(res, {
      data: {
        schemaId: schemaIdNew,
        displayName,
        internalName,
        fields,
        insertedRecords: insertedCount,
        totalRowsInCSV: parsed.rows.length,
        skippedRows: 0
      }
    }, 'CSV imported and table created successfully');
  } catch (error) {
    logger.error('importCSVCreateNewTable', 'Error creating table from CSV', error);
    throw error;
  }
}

/**
 * Import CSV and append to existing table
 */
async function importCSVAppendToTable(res, appId, appPrefix, userId, schemaId, parsed) {
  try {
    logger.info('importCSVAppendToTable', 'Appending CSV to existing table', { schemaId });

    // Get schema
    const schemaCollectionName = getSchemaCollectionName(appPrefix);
    const schemaDoc = await db.collection(schemaCollectionName).doc(schemaId).get();

    if (!schemaDoc.exists) {
      return fail(res, 404, 'SCHEMA_NOT_FOUND', {
        details: { schemaId, appId }
      });
    }

    const schema = schemaDoc.data();

    // Validate CSV headers match schema
    const schemaFieldNames = schema.fields.map(f => f.name);
    const csvHeaders = parsed.headers;

    const missingFields = schemaFieldNames.filter(f => !csvHeaders.includes(f));
    const extraFields = csvHeaders.filter(h => !schemaFieldNames.includes(h));

    if (missingFields.length > 0 || extraFields.length > 0) {
      return fail(res, 400, 'CSV_SCHEMA_MISMATCH', {
        details: {
          message: "CSV headers don't match schema",
          missingFields,
          extraFields
        }
      });
    }

    // Validate and insert records
    const validRecords = [];
    const skippedRows = [];

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const validation = validateRecord(row, schema.fields);

      if (validation.valid) {
        validRecords.push(row);
      } else {
        skippedRows.push({
          index: i + 2, // +2 because row 1 is header, and we start from 0
          errors: validation.errors
        });
      }
    }

    // Insert valid records
    const recordsToInsert = validRecords.map(row => ({
      id: generateRecordId(),
      ...addSystemFieldsForCreate(row, userId)
    }));

    // Process in batches of 500
    const batches = chunkArray(recordsToInsert, 500);
    let insertedCount = 0;

    for (const batch of batches) {
      const writeBatch = db.batch();

      for (const record of batch) {
        const docRef = db.collection(schema.internalName).doc(record.id);
        writeBatch.set(docRef, record);
        insertedCount++;
      }

      await writeBatch.commit();
    }

    // Update record count
    const newRecordCount = (schema.recordCount || 0) + insertedCount;
    await db.collection(schemaCollectionName).doc(schemaId).update({
      recordCount: newRecordCount,
      updatedAt: new Date()
    });

    logger.info('importCSVAppendToTable', 'Records imported', {
      schemaId,
      insertedCount,
      skippedCount: skippedRows.length
    });

    return created(res, {
      data: {
        schemaId,
        displayName: schema.displayName,
        insertedRecords: insertedCount,
        totalRecords: newRecordCount,
        skippedRows: skippedRows.length,
        errors: skippedRows.slice(0, 10) // Return first 10 errors
      }
    }, 'CSV imported successfully');
  } catch (error) {
    logger.error('importCSVAppendToTable', 'Error appending CSV to table', error);
    throw error;
  }
}

/**
 * GET /api/data-records/export-csv
 * Export records to CSV
 */
export async function exportCSV(req, res) {
  try {
    const { appId, schemaId, recordIds, includeSystemFields, appPrefix } = req.query;

    logger.info('exportCSV', 'Exporting records to CSV', {
      appId,
      schemaId,
      recordIds: recordIds?.split(',').length
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

    // Get records
    let records;
    if (recordIds) {
      // Export specific records
      const ids = recordIds.split(',');
      const recordDocs = await Promise.all(
        ids.map(id => db.collection(schema.internalName).doc(id).get())
      );
      records = recordDocs
        .filter(doc => doc.exists)
        .map(doc => doc.data());
    } else {
      // Export all records
      const recordsSnapshot = await db.collection(schema.internalName).get();
      records = recordsSnapshot.docs.map(doc => doc.data());
    }

    if (records.length === 0) {
      return fail(res, 404, 'RECORD_NOT_FOUND', {
        details: 'No records found to export'
      });
    }

    // Generate CSV
    const fieldNames = schema.fields.map(f => f.name);
    const includeSystem = includeSystemFields === 'true';
    const csvContent = generateCSV(records, fieldNames, includeSystem);

    // Set response headers for file download
    const filename = `${schema.displayName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    logger.info('exportCSV', 'CSV exported', {
      schemaId,
      recordCount: records.length
    });

    return res.send(csvContent);
  } catch (error) {
    logger.error('exportCSV', 'Error exporting CSV', error);
    return fail(res, 500, 'INTERNAL_ERROR', {
      details: error.message
    });
  }
}

