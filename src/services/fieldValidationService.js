/**
 * Field Validation Service
 * Validates data against field types and rules
 * Supports all 18 field types as per specification
 */

// Supported field types
export const SUPPORTED_FIELD_TYPES = [
  'text', 'textarea', 'number', 'email', 'phone', 'url',
  'date', 'datetime', 'boolean', 'select', 'multiselect',
  'currency', 'percentage', 'rating', 'color', 'file', 'image', 'json'
];

/**
 * Type-specific validators
 */
const validators = {
  text: (value) => {
    if (typeof value !== 'string') return false;
    return value.length <= 500;
  },

  textarea: (value) => {
    if (typeof value !== 'string') return false;
    return value.length <= 5000;
  },

  number: (value) => {
    return !isNaN(parseFloat(value));
  },

  email: (value) => {
    if (typeof value !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },

  phone: (value) => {
    if (typeof value !== 'string') return false;
    return /^\d{10}$/.test(value);
  },

  url: (value) => {
    if (typeof value !== 'string') return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  date: (value) => {
    return !isNaN(Date.parse(value));
  },

  datetime: (value) => {
    return !isNaN(Date.parse(value));
  },

  boolean: (value) => {
    return typeof value === 'boolean';
  },

  select: (value, options) => {
    if (!Array.isArray(options)) return false;
    return options.includes(value);
  },

  multiselect: (values, options) => {
    if (!Array.isArray(values) || !Array.isArray(options)) return false;
    return values.every(v => options.includes(v));
  },

  currency: (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  },

  percentage: (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 100;
  },

  rating: (value) => {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 5;
  },

  color: (value) => {
    if (typeof value !== 'string') return false;
    return /^#[0-9A-F]{6}$/i.test(value);
  },

  file: (value) => {
    return typeof value === 'string' && value.length > 0;
  },

  image: (value) => {
    return typeof value === 'string' && value.length > 0;
  },

  json: (value) => {
    try {
      JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Validate a single field value
 * 
 * @param {any} value - The value to validate
 * @param {object} field - Field definition with type, required, options
 * @returns {object} { valid: boolean, error?: string }
 */
export function validateField(value, field) {
  // Check if required field is missing
  if (field.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: `${field.name} is required` };
  }

  // Skip validation if field is not required and value is empty
  if (!field.required && (value === undefined || value === null || value === '')) {
    return { valid: true };
  }

  // Validate type
  if (!validators[field.type]) {
    return { valid: false, error: `Unknown field type: ${field.type}` };
  }

  const isValid = validators[field.type](value, field.options);
  if (!isValid) {
    return { valid: false, error: `Invalid ${field.type} format for ${field.name}` };
  }

  return { valid: true };
}

/**
 * Validate an entire record against schema fields
 * 
 * @param {object} data - The record data to validate
 * @param {array} fields - Array of field definitions
 * @returns {object} { valid: boolean, errors: object }
 */
export function validateRecord(data, fields) {
  const errors = {};
  let valid = true;

  for (const field of fields) {
    const value = data[field.name];
    const result = validateField(value, field);
    
    if (!result.valid) {
      valid = false;
      errors[field.name] = result.error;
    }
  }

  return { valid, errors };
}

/**
 * Auto-detect field type from column data (for CSV import)
 * 
 * @param {array} columnData - Array of values from a column
 * @returns {string|object} Field type or {type, options} for select
 */
export function detectFieldType(columnData) {
  // Sample first 10 non-empty values
  const samples = columnData
    .filter(v => v !== null && v !== undefined && v !== '')
    .slice(0, 10);

  if (samples.length === 0) return 'text';

  // Convert all samples to strings for testing
  const stringSamples = samples.map(v => String(v));

  // Email detection
  if (stringSamples.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) {
    return 'email';
  }

  // Phone detection (10 digits)
  if (stringSamples.every(v => /^\d{10}$/.test(v))) {
    return 'phone';
  }

  // URL detection
  if (stringSamples.every(v => {
    try { 
      new URL(v); 
      return true; 
    } catch { 
      return false; 
    }
  })) {
    return 'url';
  }

  // Number detection
  if (stringSamples.every(v => !isNaN(v) && v.trim() !== '')) {
    return 'number';
  }

  // Boolean detection
  const boolValues = ['true', 'false', '1', '0', 'yes', 'no'];
  if (stringSamples.every(v => boolValues.includes(v.toLowerCase()))) {
    return 'boolean';
  }

  // Date detection
  if (stringSamples.every(v => !isNaN(Date.parse(v)))) {
    return 'date';
  }

  // Select detection (limited unique values)
  const unique = [...new Set(stringSamples)];
  if (unique.length <= 10 && unique.length < stringSamples.length * 0.5) {
    return { type: 'select', options: unique };
  }

  // Default to text
  return 'text';
}

/**
 * Validate field type is supported
 */
export function isValidFieldType(type) {
  return SUPPORTED_FIELD_TYPES.includes(type);
}

/**
 * Get field type requirements
 */
export function getFieldTypeInfo(type) {
  const info = {
    text: { maxLength: 500, description: 'Short text' },
    textarea: { maxLength: 5000, description: 'Long text' },
    number: { description: 'Numeric value' },
    email: { description: 'Email address', pattern: 'user@example.com' },
    phone: { description: '10-digit phone number', pattern: '9876543210' },
    url: { description: 'Website URL', pattern: 'https://example.com' },
    date: { description: 'Date only', pattern: '2025-12-27' },
    datetime: { description: 'Date and time', pattern: '2025-12-27T10:30:00Z' },
    boolean: { description: 'True/False' },
    select: { description: 'Single choice', requiresOptions: true },
    multiselect: { description: 'Multiple choices', requiresOptions: true },
    currency: { description: 'Money amount (≥0)' },
    percentage: { description: 'Percentage (0-100)' },
    rating: { description: 'Star rating (1-5)' },
    color: { description: 'Hex color', pattern: '#FF5733' },
    file: { description: 'File reference URL' },
    image: { description: 'Image reference URL' },
    json: { description: 'JSON data' }
  };

  return info[type] || { description: 'Unknown type' };
}


