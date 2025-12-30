/**
 * Data Schema Utilities
 * Utilities for table name obfuscation and schema management
 */
import crypto from 'crypto';

/**
 * Generate secure internal collection name
 * Pattern: {appPrefix}_data_{8-char-hash}_{sanitized-name}
 * MUST be implemented exactly as shown for consistency
 * 
 * @param {string} appPrefix - App prefix (e.g., "myapp")
 * @param {string} displayName - User-visible table name (e.g., "Users")
 * @param {number} timestamp - Timestamp for uniqueness
 * @returns {string} Internal collection name (e.g., "myapp_data_8a7f3c2e_users")
 */
export function generateInternalTableName(appPrefix, displayName, timestamp) {
  // Create MD5 hash for uniqueness
  const hash = crypto
    .createHash('md5')
    .update(`${appPrefix}_${displayName}_${timestamp}`)
    .digest('hex')
    .substring(0, 8);

  // Sanitize display name for collection naming
  const sanitized = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 50);

  return `${appPrefix}_data_${hash}_${sanitized}`;
}

/**
 * Generate schema collection name for an app
 * Pattern: {appPrefix}_data_schemas
 */
export function getSchemaCollectionName(appPrefix) {
  return `${appPrefix}_data_schemas`;
}

/**
 * Generate unique schema ID
 * Pattern: schema_{random}
 */
export function generateSchemaId() {
  return `schema_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Generate unique record ID
 * Pattern: rec_{random}
 */
export function generateRecordId() {
  return `rec_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Chunk array into smaller arrays
 * Used for batch operations (Firestore has 500 operations per batch limit)
 */
export function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Sanitize field name for safe storage
 */
export function sanitizeFieldName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .substring(0, 100);
}

/**
 * Validate display name format
 */
export function validateDisplayName(displayName) {
  if (!displayName || typeof displayName !== 'string') {
    return { valid: false, error: 'Display name is required' };
  }
  
  if (displayName.length < 1 || displayName.length > 100) {
    return { valid: false, error: 'Display name must be 1-100 characters' };
  }
  
  // Allow alphanumeric and spaces
  if (!/^[a-zA-Z0-9\s]+$/.test(displayName)) {
    return { valid: false, error: 'Display name can only contain letters, numbers, and spaces' };
  }
  
  return { valid: true };
}

/**
 * Validate field configuration
 */
export function validateFieldConfig(field) {
  const errors = [];
  
  if (!field.name || typeof field.name !== 'string') {
    errors.push('Field name is required');
  } else if (!/^[a-zA-Z0-9_]+$/.test(field.name)) {
    errors.push('Field name can only contain letters, numbers, and underscores');
  }
  
  if (!field.type || typeof field.type !== 'string') {
    errors.push('Field type is required');
  }
  
  // Validate select/multiselect fields have options
  if ((field.type === 'select' || field.type === 'multiselect') && 
      (!Array.isArray(field.options) || field.options.length === 0)) {
    errors.push(`${field.type} type requires non-empty options array`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * System fields that should never be provided by users
 */
export const SYSTEM_FIELDS = ['id', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'];

/**
 * Check if a field name is a system field
 */
export function isSystemField(fieldName) {
  return SYSTEM_FIELDS.includes(fieldName);
}

/**
 * Add system fields to a record for creation
 */
export function addSystemFieldsForCreate(data, userId) {
  const timestamp = new Date();
  return {
    ...data,
    createdBy: userId,
    createdAt: timestamp,
    updatedBy: userId,
    updatedAt: timestamp
  };
}

/**
 * Add system fields to a record for update
 */
export function addSystemFieldsForUpdate(data, userId) {
  const timestamp = new Date();
  return {
    ...data,
    updatedBy: userId,
    updatedAt: timestamp
  };
}

/**
 * Remove system fields from user-provided data
 */
export function stripSystemFields(data) {
  const cleaned = { ...data };
  SYSTEM_FIELDS.forEach(field => delete cleaned[field]);
  return cleaned;
}





