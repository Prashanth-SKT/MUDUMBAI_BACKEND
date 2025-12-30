/**
 * Data Management Routes
 * Routes for schema management, records CRUD, bulk operations, and CSV import/export
 */
import express from 'express';
import multer from 'multer';

// Controllers
import {
  createSchema,
  listSchemas,
  getSchema,
  deleteSchema
} from '../../controllers/dataSchemaController.js';

import {
  createRecord,
  listRecords,
  updateRecord,
  deleteRecord,
  validateRecordData
} from '../../controllers/dataRecordsController.js';

import {
  bulkCreateRecords,
  bulkUpdateRecords,
  bulkDeleteRecords
} from '../../controllers/bulkOperationsController.js';

import {
  importCSV,
  exportCSV
} from '../../controllers/csvController.js';

const router = express.Router();

// Configure multer for CSV file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// ============================================
// SCHEMA MANAGEMENT ROUTES
// ============================================

/**
 * POST /api/data-schemas/create
 * Create a new table schema
 */
router.post('/data-schemas/create', createSchema);

/**
 * GET /api/data-schemas/:appId
 * List all table schemas for an app
 */
router.get('/data-schemas/:appId', listSchemas);

/**
 * GET /api/data-schemas/:appId/:schemaId
 * Get a single table schema
 */
router.get('/data-schemas/:appId/:schemaId', getSchema);

/**
 * DELETE /api/data-schemas/:schemaId
 * Delete a table schema and all its data
 */
router.delete('/data-schemas/:schemaId', deleteSchema);

// ============================================
// RECORD CRUD ROUTES
// ============================================

/**
 * POST /api/data-records/create
 * Create a single record
 */
router.post('/data-records/create', createRecord);

/**
 * GET /api/data-records/list
 * List records with pagination
 */
router.get('/data-records/list', listRecords);

/**
 * PUT /api/data-records/update/:recordId
 * Update a single record
 */
router.put('/data-records/update/:recordId', updateRecord);

/**
 * DELETE /api/data-records/delete/:recordId
 * Delete a single record
 */
router.delete('/data-records/delete/:recordId', deleteRecord);

/**
 * POST /api/data-records/validate
 * Validate a record without saving
 */
router.post('/data-records/validate', validateRecordData);

// ============================================
// BULK OPERATIONS ROUTES
// ============================================

/**
 * POST /api/data-records/bulk-create
 * Create multiple records (max 1000)
 */
router.post('/data-records/bulk-create', bulkCreateRecords);

/**
 * POST /api/data-records/bulk-update
 * Update multiple records (max 500)
 */
router.post('/data-records/bulk-update', bulkUpdateRecords);

/**
 * POST /api/data-records/bulk-delete
 * Delete multiple records (max 500)
 */
router.post('/data-records/bulk-delete', bulkDeleteRecords);

// ============================================
// CSV IMPORT/EXPORT ROUTES
// ============================================

/**
 * POST /api/data-records/import-csv
 * Import CSV file (create new table or append to existing)
 */
router.post('/data-records/import-csv', upload.single('file'), importCSV);

/**
 * GET /api/data-records/export-csv
 * Export records to CSV
 */
router.get('/data-records/export-csv', exportCSV);

export default router;





