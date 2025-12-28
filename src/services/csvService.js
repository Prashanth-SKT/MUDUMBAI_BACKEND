/**
 * CSV Service
 * Handles CSV parsing and generation
 */

/**
 * Parse CSV content into headers and rows
 * 
 * @param {string} csvContent - Raw CSV content
 * @returns {object} { headers: string[], rows: object[] }
 */
export function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header line
  const headers = parseCSVLine(lines[0]);
  
  if (headers.length === 0) {
    throw new Error('CSV header is empty');
  }

  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = parseCSVLine(line);
    
    // Create object from headers and values
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Parse a single CSV line handling quoted values
 * 
 * @param {string} line - CSV line
 * @returns {array} Array of values
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last value
  values.push(current.trim());

  return values;
}

/**
 * Convert records to CSV format
 * 
 * @param {array} records - Array of record objects
 * @param {array} fields - Array of field names to include
 * @param {boolean} includeSystemFields - Whether to include system fields
 * @returns {string} CSV content
 */
export function generateCSV(records, fields, includeSystemFields = false) {
  if (!records || records.length === 0) {
    return '';
  }

  // Determine headers
  let headers = fields;
  
  if (includeSystemFields) {
    headers = ['id', ...fields, 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'];
  }

  // Build CSV
  const lines = [];
  
  // Add header row
  lines.push(headers.map(escapeCSVValue).join(','));
  
  // Add data rows
  for (const record of records) {
    const values = headers.map(header => {
      const value = record[header];
      return escapeCSVValue(value);
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * Escape a value for CSV format
 * 
 * @param {any} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeCSVValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value);

  // Handle arrays (for multiselect)
  if (Array.isArray(value)) {
    str = value.join('; ');
  }

  // Handle objects (for json)
  if (typeof value === 'object' && !Array.isArray(value)) {
    str = JSON.stringify(value);
  }

  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }

  return str;
}

/**
 * Validate CSV file
 * 
 * @param {object} file - Multer file object
 * @returns {object} { valid: boolean, error?: string }
 */
export function validateCSVFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // Check file type (be lenient with mime types)
  const allowedMimeTypes = ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'];
  const fileName = file.originalname || file.name || '';
  const isCSVExtension = fileName.toLowerCase().endsWith('.csv');
  
  if (!allowedMimeTypes.includes(file.mimetype) && !isCSVExtension) {
    return { valid: false, error: 'File must be a CSV file' };
  }

  return { valid: true };
}

