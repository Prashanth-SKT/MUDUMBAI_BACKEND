# Data Management System - Backend API Specification

**Version:** 1.0
**Date:** December 27, 2025
**Status:** Ready for Implementation
**Project:** No-Code Data Management Platform

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Security Architecture](#security-architecture)
3. [System Fields (Auto-Managed)](#system-fields-auto-managed)
4. [Supported Field Types](#supported-field-types)
5. [API Endpoints Reference](#api-endpoints-reference)
   - [Schema Management](#1-schema-management-apis)
   - [Record CRUD Operations](#2-record-crud-apis)
   - [Bulk Operations](#3-bulk-operations-apis)
   - [CSV Import/Export](#4-csv-importexport-apis)
   - [Validation](#5-validation-api)
6. [Error Handling](#error-handling)
7. [Database Structure](#database-structure)
8. [Authorization & Security](#authorization--security)
9. [Implementation Guide](#implementation-guide)
10. [Performance Requirements](#performance-requirements)

---

## Executive Summary

### Purpose
Build backend APIs for a no-code data management system enabling business users and citizens to create custom data tables, import/export CSV files, and perform CRUD operations without technical knowledge.

### Key Requirements
- ✅ **Security**: User-visible table names MUST be different from database collection names
- ✅ **Auto-Management**: System fields (createdBy, createdAt, updatedBy, updatedAt) auto-populated by backend
- ✅ **CSV Support**: Auto-detect field types, create tables, import/export data
- ✅ **Bulk Operations**: Support up to 1000 records per operation
- ✅ **Access Control**: Only app owners can delete tables
- ✅ **Type Safety**: 18 field types with validation

### Technology Stack
- **Database**: Firestore (or your preferred database)
- **Authentication**: JWT Bearer tokens
- **File Upload**: Multipart/form-data for CSV
- **Response Format**: JSON

---

## Security Architecture

### Table Name Obfuscation

**Critical Requirement**: Users NEVER see actual database collection names.

#### The Problem
#### ❌ BAD: User creates "Users" → Database stores in "myapp_data_users"
Risk: Predictable names, security vulnerability
#### The Solution
✅ GOOD: User creates "Users" → Database stores in "myapp_data_8a7f3c2e_users"
Security: Unpredictable, obfuscated collection names
#### Naming Pattern
{appPrefix}data{8-char-hash}{sanitized-name}
Examples:
Display: "Users" → DB: "myapp_data_8a7f3c2e_users"
Display: "Products" → DB: "myapp_data_9b2e4d1f_products"
Display: "Sales Data" → DB: "myapp_data_3f7a8c5d_sales_data"

#### Implementation Algorithm

const crypto = require('crypto');

/**
 * Generate secure internal collection name
 * MUST be implemented exactly as shown for consistency
 */
function generateInternalTableName(appPrefix, displayName, timestamp) {
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

// Example Usage
const internalName = generateInternalTableName('myapp', 'Users', Date.now());
// Returns: "myapp_data_8a7f3c2e_users"#### Schema Storage Pattern

// Store in {appPrefix}_data_schemas collection
{
  schemaId: "schema_abc123xyz",
  displayName: "Users",                        // User sees this in UI
  internalName: "myapp_data_8a7f3c2e_users",  // Backend uses this for queries
  appId: "myapp",
  fields: [...],
  createdBy: "user-uid-123",
  createdAt: timestamp
}**Important**: Frontend NEVER receives `internalName` - always use `schemaId` in API calls.

---

## System Fields (Auto-Managed)

### Overview
Backend MUST automatically populate these fields. Users NEVER provide them.

| Field | Type | Set When | Purpose | Example Value |
|-------|------|----------|---------|---------------|
| `id` | String | Create | Unique document ID | "rec_xyz789abc" |
| `createdBy` | String | Create | User who created record | "user-uid-123" |
| `createdAt` | Timestamp | Create | Creation time | "2025-12-27T10:35:00Z" |
| `updatedBy` | String | Create & Update | Last modifier | "user-uid-456" |
| `updatedAt` | Timestamp | Create & Update | Last modification time | "2025-12-27T15:42:00Z" |

### Implementation Rules

#### On Record Creation
const recordToSave = {
  // User-provided fields only
  ...userProvidedData,

  // System fields (AUTO-POPULATED BY BACKEND)
  id: firestoreDocId,            // Auto-generated
  createdBy: userId,             // From request body
  createdAt: serverTimestamp(),  // Server time (NOT client time)
  updatedBy: userId,             // Same as createdBy initially
  updatedAt: serverTimestamp()   // Same as createdAt initially
};

await firestore.collection(internalName).add(recordToSave);#### On Record Update
const updates = {
  // Only the fields user wants to change
  ...userProvidedData,

  // System fields (AUTO-UPDATED)
  updatedBy: userId,
  updatedAt: serverTimestamp()
};

// NEVER update these fields:
// - id
// - createdBy
// - createdAt

await firestore.collection(internalName).doc(recordId).update(updates);#### On CSV Import (Bulk Create)
const recordsToInsert = csvRows.map(row => ({
  // CSV data
  ...row,

  // System fields for EACH record
  id: generateId(),
  createdBy: userId,
  createdAt: serverTimestamp(),
  updatedBy: userId,
  updatedAt: serverTimestamp()
}));

// Bulk insert with batch operations
await bulkInsert(internalName, recordsToInsert);---

## Supported Field Types

### Complete Type Reference (18 Types)

| Type | Description | Validation | Example | Frontend Input |
|------|-------------|------------|---------|----------------|
| `text` | Short text (500 chars) | Max 500 chars | "John Doe" | Text input |
| `textarea` | Long text (5000 chars) | Max 5000 chars | "Long description..." | Textarea |
| `number` | Numeric value | Valid number | 42, 3.14 | Number input |
| `email` | Email address | RFC 5322 format | "user@example.com" | Email input |
| `phone` | Phone number | 10 digits | "9876543210" | Tel input |
| `url` | Website URL | Valid URL | "https://example.com" | URL input |
| `date` | Date only | ISO 8601 date | "2025-12-27" | Date picker |
| `datetime` | Date + time | ISO 8601 datetime | "2025-12-27T10:30:00Z" | Datetime picker |
| `boolean` | True/False | true or false | true | Checkbox |
| `select` | Single choice | Must be in options[] | "Admin" | Dropdown |
| `multiselect` | Multiple choices | Array, all in options[] | ["Tag1", "Tag2"] | Multi-select |
| `currency` | Money amount | Valid number | 1999.99 | Currency input |
| `percentage` | Percent (0-100) | 0 ≤ value ≤ 100 | 75 | Percentage input |
| `rating` | Star rating (1-5) | 1 ≤ value ≤ 5 | 4 | Star rating |
| `color` | Hex color | #RRGGBB format | "#FF5733" | Color picker |
| `file` | File reference | URL string | "gs://bucket/file.pdf" | File upload |
| `image` | Image reference | URL string | "gs://bucket/photo.jpg" | Image upload |
| `json` | JSON data | Valid JSON | {"key": "value"} | JSON editor |

### Type-Specific Validation (Required Implementation)

const validators = {
  text: (value) => typeof value === 'string' && value.length <= 500,

  textarea: (value) => typeof value === 'string' && value.length <= 5000,

  number: (value) => !isNaN(parseFloat(value)),

  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),

  phone: (value) => /^\d{10}$/.test(value),

  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  date: (value) => !isNaN(Date.parse(value)),

  datetime: (value) => !isNaN(Date.parse(value)),

  boolean: (value) => typeof value === 'boolean',

  select: (value, options) => options.includes(value),

  multiselect: (values, options) => {
    return Array.isArray(values) && values.every(v => options.includes(v));
  },

  currency: (value) => !isNaN(parseFloat(value)) && parseFloat(value) >= 0,

  percentage: (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 100;
  },

  rating: (value) => {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 5;
  },

  color: (value) => /^#[0-9A-F]{6}$/i.test(value),

  file: (value) => typeof value === 'string' && value.length > 0,

  image: (value) => typeof value === 'string' && value.length > 0,

  json: (value) => {
    try {
      JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
};

// Usage in validation
function validateField(value, field) {
  if (field.required && !value) {
    return { valid: false, error: `${field.name} is required` };
  }

  if (value && validators[field.type]) {
    const isValid = validators[field.type](value, field.options);
    if (!isValid) {
      return { valid: false, error: `Invalid ${field.type} format` };
    }
  }

  return { valid: true };
}### Auto-Type Detection (CSV Import)

**When user uploads CSV without specifying types**, detect automatically:

function detectFieldType(columnData) {
  // Sample first 10 non-empty values
  const samples = columnData
    .filter(v => v !== null && v !== undefined && v !== '')
    .slice(0, 10);

  if (samples.length === 0) return 'text';

  // Email detection
  if (samples.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) {
    return 'email';
  }

  // Phone detection (10 digits)
  if (samples.every(v => /^\d{10}$/.test(v))) {
    return 'phone';
  }

  // URL detection
  if (samples.every(v => {
    try { new URL(v); return true; } catch { return false; }
  })) {
    return 'url';
  }

  // Number detection
  if (samples.every(v => !isNaN(v) && v.trim() !== '')) {
    return 'number';
  }

  // Boolean detection
  const boolValues = ['true', 'false', '1', '0', 'yes', 'no'];
  if (samples.every(v => boolValues.includes(v.toLowerCase()))) {
    return 'boolean';
  }

  // Date detection
  if (samples.every(v => !isNaN(Date.parse(v)))) {
    return 'date';
  }

  // Select detection (limited unique values)
  const unique = [...new Set(samples)];
  if (unique.length <= 10 && unique.length < samples.length * 0.5) {
    return { type: 'select', options: unique };
  }

  // Default to text
  return 'text';
}---

## API Endpoints Reference

### Base URL

### Authentication
All endpoints require:
Authorization: Bearer {jwt-token}---

## 1. Schema Management APIs

### 1.1 Create Table Schema

Creates new table with obfuscated internal name.

POST /api/data-schemas/create**Request Headers:**
Authorization: Bearer {token}
Content-Type: application/json**Request Body:**
{
  "appId": "myapp",
  "appPrefix": "myapp",
  "displayName": "Users",
  "fields": [
    {
      "name": "fullName",
      "type": "text",
      "required": true,
      "options": []
    },
    {
      "name": "email",
      "type": "email",
      "required": true,
      "options": []
    },
    {
      "name": "phone",
      "type": "phone",
      "required": false,
      "options": []
    },
    {
      "name": "role",
      "type": "select",
      "required": true,
      "options": ["Admin", "Editor", "Viewer"]
    },
    {
      "name": "status",
      "type": "select",
      "required": false,
      "options": ["Active", "Inactive"]
    }
  ],
  "userId": "user-uid-123"
}**Validation Rules:**
- `appId`: Required, must exist
- `displayName`: Required, 1-100 chars, alphanumeric + spaces
- `fields`: Required, 1-50 fields
- `field.name`: Required, unique, alphanumeric + underscore
- `field.type`: Required, must be valid type
- `field.options`: Required for select/multiselect types

**Response (201 Created):**
{
  "success": true,
  "data": {
    "schemaId": "schema_abc123xyz",
    "displayName": "Users",
    "internalName": "myapp_data_8a7f3c2e_users",
    "appId": "myapp",
    "fields": [
      {
        "name": "fullName",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "name": "email",
        "type": "email",
        "required": true,
        "options": []
      },
      {
        "name": "phone",
        "type": "phone",
        "required": false,
        "options": []
      },
      {
        "name": "role",
        "type": "select",
        "required": true,
        "options": ["Admin", "Editor", "Viewer"]
      },
      {
        "name": "status",
        "type": "select",
        "required": false,
        "options": ["Active", "Inactive"]
      }
    ],
    "createdBy": "user-uid-123",
    "createdAt": "2025-12-27T10:30:00.000Z",
    "updatedAt": "2025-12-27T10:30:00.000Z"
  }
}**Error Responses:**
// 400 - Validation Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid field configuration",
    "details": {
      "field": "role",
      "reason": "Select type requires options array"
    }
  }
}

// 409 - Duplicate Table
{
  "success": false,
  "error": {
    "code": "DUPLICATE_TABLE",
    "message": "A table with this name already exists",
    "details": {
      "displayName": "Users",
      "existingSchemaId": "schema_old123"
    }
  }
}---

### 1.2 List All Tables

Get all tables for an app with record counts.

GET /api/data-schemas/{appId}**Response (200 OK):**
{
  "success": true,
  "data": {
    "schemas": [
      {
        "schemaId": "schema_abc123xyz",
        "displayName": "Users",
        "internalName": "myapp_data_8a7f3c2e_users",
        "appId": "myapp",
        "fields": [...],
        "recordCount": 145,
        "createdBy": "user-uid-123",
        "createdAt": "2025-12-27T10:30:00.000Z",
        "updatedAt": "2025-12-27T14:20:00.000Z"
      },
      {
        "schemaId": "schema_def456uvw",
        "displayName": "Products",
        "internalName": "myapp_data_9b2e4d1f_products",
        "appId": "myapp",
        "fields": [...],
        "recordCount": 89,
        "createdBy": "user-uid-123",
        "createdAt": "2025-12-26T09:15:00.000Z",
        "updatedAt": "2025-12-27T11:00:00.000Z"
      }
    ],
    "totalTables": 2
  }
}---

### 1.3 Get Single Table Schema

GET /api/data-schemas/{appId}/{schemaId}**Response (200 OK):**
{
  "success": true,
  "data": {
    "schemaId": "schema_abc123xyz",
    "displayName": "Users",
    "internalName": "myapp_data_8a7f3c2e_users",
    "appId": "myapp",
    "fields": [...],
    "recordCount": 145,
    "createdBy": "user-uid-123",
    "createdAt": "2025-12-27T10:30:00.000Z"
  }
}---

### 1.4 Delete Table (Schema + All Data)

**⚠️ CRITICAL: Only app owner can delete tables**

DELETE /api/data-schemas/{schemaId}**Request Body:**
{
  "appId": "myapp",
  "userId": "user-uid-123",
  "confirmDelete": true
}**Authorization Check (MUST IMPLEMENT):**
// Verify user is app creator
const app = await getApp(appId);
if (app.createdBy !== userId) {
  return res.status(403).json({
    error: {
      code: "FORBIDDEN",
      message: "Only app owner can delete tables"
    }
  });
}**Response (200 OK):**
{
  "success": true,
  "message": "Table 'Users' and 145 records deleted successfully",
  "data": {
    "schemaId": "schema_abc123xyz",
    "displayName": "Users",
    "deletedRecords": 145
  }
}---

## 2. Record CRUD APIs

### 2.1 Create Single Record

POST /api/data-records/create**Request Body:**
{
  "appId": "myapp",
  "schemaId": "schema_abc123xyz",
  "userId": "user-uid-123",
  "data": {
    "fullName": "Ramesh Kumar",
    "email": "ramesh@example.com",
    "phone": "9876543210",
    "role": "Admin",
    "status": "Active"
  }
}**Backend Processing (MUST IMPLEMENT):**
// 1. Get schema to retrieve internalName
const schema = await getSchema(schemaId);

// 2. Validate data
const validation = validateRecord(data, schema.fields);
if (!validation.valid) {
  return { error: validation.errors };
}

// 3. Add system fields
const recordToSave = {
  ...data,
  id: generateFirestoreId(),
  createdBy: userId,
  createdAt: serverTimestamp(),
  updatedBy: userId,
  updatedAt: serverTimestamp()
};

// 4. Insert into internal collection
await db.collection(schema.internalName).add(recordToSave);

// 5. Update record count
await incrementRecordCount(schemaId);**Response (201 Created):**
{
  "success": true,
  "data": {
    "id": "rec_xyz789abc",
    "fullName": "Ramesh Kumar",
    "email": "ramesh@example.com",
    "phone": "9876543210",
    "role": "Admin",
    "status": "Active",
    "createdBy": "user-uid-123",
    "createdAt": "2025-12-27T10:35:00.000Z",
    "updatedBy": "user-uid-123",
    "updatedAt": "2025-12-27T10:35:00.000Z"
  }
}---

### 2.2 List Records (Paginated)

GET /api/data-records/list**Query Parameters:**

mportant: Frontend NEVER receives internalName - always use schemaId in API calls.
System Fields (Auto-Managed)
Overview
Backend MUST automatically populate these fields. Users NEVER provide them.
Field	Type	Set When	Purpose	Example Value
id	String	Create	Unique document ID	"rec_xyz789abc"
createdBy	String	Create	User who created record	"user-uid-123"
createdAt	Timestamp	Create	Creation time	"2025-12-27T10:35:00Z"
updatedBy	String	Create & Update	Last modifier	"user-uid-456"
updatedAt	Timestamp	Create & Update	Last modification time	"2025-12-27T15:42:00Z"
Implementation Rules
On Record Creation



**Response (200 OK):**
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "rec_xyz789abc",
        "fullName": "Ramesh Kumar",
        "email": "ramesh@example.com",
        "phone": "9876543210",
        "role": "Admin",
        "status": "Active",
        "createdBy": "user-uid-123",
        "createdAt": "2025-12-27T10:35:00.000Z",
        "updatedBy": "user-uid-123",
        "updatedAt": "2025-12-27T10:35:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalRecords": 145,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}---

### 2.3 Update Single Record

PUT /api/data-records/update/{recordId}**Request Body:**
{
  "appId": "myapp",
  "schemaId": "schema_abc123xyz",
  "userId": "user-uid-456",
  "data": {
    "phone": "9999888877",
    "status": "Inactive"
  }
}**Backend Processing:**
const updates = {
  ...data,
  updatedBy: userId,
  updatedAt: serverTimestamp()
};

// NEVER update: id, createdBy, createdAt
await db.collection(internalName).doc(recordId).update(updates);**Response (200 OK):**
{
  "success": true,
  "data": {
    "id": "rec_xyz789abc",
    "fullName": "Ramesh Kumar",
    "email": "ramesh@example.com",
    "phone": "9999888877",
    "role": "Admin",
    "status": "Inactive",
    "createdBy": "user-uid-123",
    "createdAt": "2025-12-27T10:35:00.000Z",
    "updatedBy": "user-uid-456",
    "updatedAt": "2025-12-27T15:42:00.000Z"
  }
}---

### 2.4 Delete Single Record

DELETE /api/data-records/delete/{recordId}**Request Body:**
{
  "appId": "myapp",
  "schemaId": "schema_abc123xyz"
}**Response (200 OK):**
{
  "success": true,
  "message": "Record deleted successfully",
  "data": {
    "deletedRecordId": "rec_xyz789abc"
  }
}---

## 3. Bulk Operations APIs

### 3.1 Bulk Create Records

**Limit**: Maximum 1000 records per request

POST /api/data-records/bulk-create**Request Body:**
{
  "appId": "myapp",
  "schemaId": "schema_abc123xyz",
  "userId": "user-uid-123",
  "records": [
    {
      "fullName": "Sita Devi",
      "email": "sita@example.com",
      "phone": "9123456789",
      "role": "Editor",
      "status": "Active"
    },
    {
      "fullName": "Arjun Rao",
      "email": "arjun@example.com",
      "phone": "9988776655",
      "role": "Viewer",
      "status": "Inactive"
    }
  ]
}**Backend Processing:**
// Process in batches of 500 (Firestore limit)
const batches = chunkArray(validatedRecords, 500);

for (const batch of batches) {
  const writeBatch = db.batch();

  batch.forEach(record => {
    const docRef = db.collection(internalName).doc();
    writeBatch.set(docRef, {
      ...record,
      id: docRef.id,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedBy: userId,
      updatedAt: serverTimestamp()
    });
  });

  await writeBatch.commit();
}**Response (201 Created):**
{
  "success": true,
  "data": {
    "insertedCount": 2,
    "totalRequested": 2,
    "failed": 0,
    "errors": []
  }
}---

### 3.2 Bulk Update Records

**Limit**: Maximum 500 updates per request

POST /api/data-records/bulk-update**Request Body:**
{
  "appId": "myapp",
  "schemaId": "schema_abc123xyz",
  "userId": "user-uid-123",
  "updates": [
    {
      "recordId": "rec_xyz789abc",
      "data": { "status": "Inactive" }
    },
    {
      "recordId": "rec_aaa111",
      "data": { "role": "Admin", "status": "Active" }
    }
  ]
}**Response (200 OK):**
{
  "success": true,
  "data": {
    "updatedCount": 2,
    "totalRequested": 2,
    "failed": 0
  }
}---

### 3.3 Bulk Delete Records

**Limit**: Maximum 500 deletions per request

POST /api/data-records/bulk-delete**Request Body:**
{
  "appId": "myapp",
  "schemaId": "schema_abc123xyz",
  "recordIds": ["rec_xyz789abc", "rec_aaa111", "rec_bbb222"]
}**Response (200 OK):**
{
  "success": true,
  "data": {
    "deletedCount": 3,
    "totalRequested": 3,
    "deletedIds": ["rec_xyz789abc", "rec_aaa111", "rec_bbb222"]
  }
}---

## 4. CSV Import/Export APIs

### 4.1 Import CSV - Create New Table

Upload CSV, auto-detect types, create table, insert data.

POST /api/data-records/import-csv
Content-Type: multipart/form-data**Form Data:**
On Record Update

**Example CSV File:**
fullName,email,phone,role,status
Ramesh Kumar,ramesh@example.com,9876543210,Admin,Active
Sita Devi,sita@example.com,9123456789,Editor,Active
Arjun Rao,arjun@example.com,9988776655,Viewer,Inactive**Backend Processing Flow:**

// STEP 1: Parse CSV
const parsed = parseCSV(file);
// Result:
// headers: ["fullName", "email", "phone", "role", "status"]
// rows: [{ fullName: "Ramesh Kumar", ... }, ...]

// STEP 2: Auto-detect field types
const fields = parsed.headers.map(header => {
  const columnData = parsed.rows.map(row => row[header]);
  const detected = detectFieldType(columnData);

  return {
    name: header,
    type: detected.type || detected,
    required: false,
    options: detected.options || []
  };
});

// Detected fields example:
// [
//   { name: "fullName", type: "text" },
//   { name: "email", type: "email" },
//   { name: "phone", type: "phone" },
//   { name: "role", type: "select", options: ["Admin", "Editor", "Viewer"] },
//   { name: "status", type: "select", options: ["Active", "Inactive"] }
// ]

// STEP 3: Generate internal table name
const timestamp = Date.now();
const internalName = generateInternalTableName(appPrefix, displayName, timestamp);

// STEP 4: Create schema
const schema = await createSchema({
  appId,
  appPrefix,
  displayName,
  internalName,
  fields,
  userId
});

// STEP 5: Insert all records with system fields
const recordsToInsert = parsed.rows.map(row => ({
  ...row,
  id: generateId(),
  createdBy: userId,
  createdAt: serverTimestamp(),
  updatedBy: userId,
  updatedAt: serverTimestamp()
}));

await bulkInsert(schema.internalName, recordsToInsert);**Response (201 Created):**
{
  "success": true,
  "data": {
    "schemaId": "schema_new123",
    "displayName": "Users",
    "internalName": "myapp_data_8a7f3c2e_users",
    "fields": [
      {
        "name": "fullName",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "name": "email",
        "type": "email",
        "required": false,
        "options": []
      },
      {
        "name": "phone",
        "type": "phone",
        "required": false,
        "options": []
      },
      {
        "name": "role",
        "type": "select",
        "required": false,
        "options": ["Admin", "Editor", "Viewer"]
      },
      {
        "name": "status",
        "type": "select",
        "required": false,
        "options": ["Active", "Inactive"]
      }
    ],
    "insertedRecords": 3,
    "totalRowsInCSV": 3,
    "skippedRows": 0
  }
}---

### 4.2 Import CSV - Append to Existing Table

POST /api/data-records/import-csv
Content-Type: multipart/form-data**Form Data:**

On CSV Import (Bulk Create)


**Backend Processing:**
// 1. Parse CSV
const parsed = parseCSV(file);

// 2. Get schema
const schema = await getSchema(schemaId);

// 3. Validate CSV headers match schema
const schemaFields = schema.fields.map(f => f.name);
const csvHeaders = parsed.headers;

const missingFields = schemaFields.filter(f => !csvHeaders.includes(f));
const extraFields = csvHeaders.filter(h => !schemaFields.includes(h));

if (missingFields.length || extraFields.length) {
  return {
    error: "CSV headers don't match schema",
    missingFields,
    extraFields
  };
}

// 4. Validate and insert
const validRecords = parsed.rows
  .filter(row => validateRecord(row, schema.fields).valid)
  .map(row => ({
    ...row,
    id: generateId(),
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedBy: userId,
    updatedAt: serverTimestamp()
  }));

await bulkInsert(schema.internalName, validRecords);**Response (201 Created):**
{
  "success": true,
  "data": {
    "schemaId": "schema_abc123xyz",
    "displayName": "Users",
    "insertedRecords": 5,
    "totalRecords": 150,
    "skippedRows": 0,
    "errors": []
  }
}---

### 4.3 Export CSV

GET /api/data-records/export-csv**Query Parameters:**

Supported Field Types
Complete Type Reference (18 Types)
Type	Description	Validation	Example	Frontend Input
text	Short text (500 chars)	Max 500 chars	"John Doe"	Text input
textarea	Long text (5000 chars)	Max 5000 chars	"Long description..."	Textarea
number	Numeric value	Valid number	42, 3.14	Number input
email	Email address	RFC 5322 format	"user@example.com"	Email input
phone	Phone number	10 digits	"9876543210"	Tel input
url	Website URL	Valid URL	"https://example.com"	URL input
date	Date only	ISO 8601 date	"2025-12-27"	Date picker
datetime	Date + time	ISO 8601 datetime	"2025-12-27T10:30:00Z"	Datetime picker
boolean	True/False	true or false	true	Checkbox
select	Single choice	Must be in options[]	"Admin"	Dropdown
multiselect	Multiple choices	Array, all in options[]	["Tag1", "Tag2"]	Multi-select
currency	Money amount	Valid number	1999.99	Currency input
percentage	Percent (0-100)	0 ≤ value ≤ 100	75	Percentage input
rating	Star rating (1-5)	1 ≤ value ≤ 5	4	Star rating
color	Hex color	#RRGGBB format	"#FF5733"	Color picker
file	File reference	URL string	"gs://bucket/file.pdf"	File upload
image	Image reference	URL string	"gs://bucket/photo.jpg"	Image upload
json	JSON data	Valid JSON	{"key": "value"}	JSON editor
Type-Specific Validation (Required Implementation)



**Response Headers:**
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="users_2025-12-27.csv"**Response Body (CSV):**
fullName,email,phone,role,status
Ramesh Kumar,ramesh@example.com,9876543210,Admin,Active
Sita Devi,sita@example.com,9123456789,Editor,Active
Arjun Rao,arjun@example.com,9988776655,Viewer,Inactive**With System Fields (`includeSystemFields=true`):**
id,fullName,email,phone,role,status,createdBy,createdAt,updatedBy,updatedAt
rec_xyz789abc,Ramesh Kumar,ramesh@example.com,9876543210,Admin,Active,user-uid-123,2025-12-27T10:35:00Z,user-uid-123,2025-12-27T10:35:00Z---

## 5. Validation API

### 5.1 Validate Record

Pre-validate record before save (frontend can use this).

POST /api/data-records/validate**Request Body:**
{
  "appId": "myapp",
  "schemaId": "schema_abc123xyz",
  "data": {
    "fullName": "Test User",
    "email": "invalid-email",
    "phone": "123",
    "role": "SuperAdmin"
  }
}**Response (200 OK):**
{
  "success": false,
  "valid": false,
  "errors": {
    "email": "Invalid email format",
    "phone": "Phone number must be 10 digits",
    "role": "Invalid option. Must be one of: Admin, Editor, Viewer"
  }
}**Valid Response:**
{
  "success": true,
  "valid": true,
  "errors": {}
}---

## Error Handling

### Standard Error Format

{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {
      "additionalInfo": "value"
    }
  }
}### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 207 | Multi-Status | Partial success in bulk ops |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 500 | Internal Error | Server error |

### Error Codes Reference

// Authentication & Authorization
"UNAUTHORIZED"              // 401 - Invalid token
"FORBIDDEN"                 // 403 - No permission
"FORBIDDEN_NOT_OWNER"       // 403 - Not app owner

// Validation
"VALIDATION_ERROR"          // 400 - Data validation failed
"INVALID_INPUT"             // 400 - Missing/invalid fields
"INVALID_FIELD_TYPE"        // 400 - Unsupported field type

// Resources
"APP_NOT_FOUND"             // 404 - App doesn't exist
"SCHEMA_NOT_FOUND"          // 404 - Table schema not found
"RECORD_NOT_FOUND"          // 404 - Record doesn't exist

// Conflicts
"DUPLICATE_TABLE"           // 409 - Table name exists
"DUPLICATE_FIELD"           // 409 - Field name exists in schema

// Limits
"BULK_LIMIT_EXCEEDED"       // 400 - Too many records
"FIELD_LIMIT_EXCEEDED"      // 400 - Too many fields

// CSV
"CSV_PARSE_ERROR"           // 400 - Invalid CSV format
"CSV_SCHEMA_MISMATCH"       // 400 - Headers don't match

// Server
"INTERNAL_ERROR"            // 500 - Unexpected error### Example Error Responses

**Validation Error:**
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Record validation failed",
    "details": {
      "email": "Invalid email format",
      "role": "Invalid option"
    }
  }
}**Not Found:**
{
  "success": false,
  "error": {
    "code": "SCHEMA_NOT_FOUND",
    "message": "Table schema not found",
    "details": {
      "schemaId": "schema_invalid",
      "appId": "myapp"
    }
  }
}**Forbidden:**
{
  "success": false,
  "error": {
    "code": "FORBIDDEN_NOT_OWNER",
    "message": "Only app owner can delete tables",
    "details": {
      "userId": "user-456",
      "appCreatedBy": "user-123"
    }
  }
}---

## Database Structure

### Collection: `{appPrefix}_data_schemas`

Stores table metadata and field definitions.

**Example Document:**
{
  _id: "schema_abc123xyz",

  // Display & Internal Names
  displayName: "Users",
  internalName: "myapp_data_8a7f3c2e_users",

  // App Association
  appId: "myapp",
  appPrefix: "myapp",

  // Schema
  fields: [
    {
      name: "fullName",
      type: "text",
      required: true,
      options: []
    },
    {
      name: "email",
      type: "email",
      required: true,
      options: []
    },
    {
      name: "role",
      type: "select",
      required: true,
      options: ["Admin", "Editor", "Viewer"]
    }
  ],

  // Metadata
  recordCount: 145,
  createdBy: "user-uid-123",
  createdAt: Timestamp,
  updatedAt: Timestamp
}**Required Indexes:**
{ appId: 1, displayName: 1 }  // Unique per app
{ appId: 1, createdAt: -1 }   // List by date---

### Collection: `{internalName}`

Stores actual data records.

**Example: `myapp_data_8a7f3c2e_users`**
{
  _id: "rec_xyz789abc",

  // System Fields
  id: "rec_xyz789abc",
  createdBy: "user-uid-123",
  createdAt: Timestamp,
  updatedBy: "user-uid-456",
  updatedAt: Timestamp,

  // User Fields
  fullName: "Ramesh Kumar",
  email: "ramesh@example.com",
  phone: "9876543210",
  role: "Admin",
  status: "Active"
}**Required Indexes:**
{ createdAt: -1 }
{ updatedAt: -1 }
{ createdBy: 1 }---

## Authorization & Security

### Access Control Rules

| Operation | Requirement | Check |
|-----------|-------------|-------|
| Create Schema | App Access | User has app access |
| List Schemas | App Access | User has app access |
| **Delete Schema** | **App Owner** | **userId === app.createdBy** |
| CRUD Records | App Access | User has app access |
| Bulk Ops | App Access | User has app access |
| CSV Import/Export | App Access | User has app access |

### Implementation

// Check App Access
async function verifyAppAccess(userId, appId) {
  const app = await db.collection('apps_meta').doc(appId).get();

  if (!app.exists) {
    throw { code: 'APP_NOT_FOUND', status: 404 };
  }

  const hasAccess = app.data().createdBy === userId;
  // OR check app_users collection if you have multi-user apps

  if (!hasAccess) {
    throw { code: 'FORBIDDEN', status: 403 };
  }

  return app;
}

// Check App Ownership (Stricter)
async function verifyAppOwnership(userId, appId) {
  const app = await db.collection('apps_meta').doc(appId).get();

  if (!app.exists) {
    throw { code: 'APP_NOT_FOUND', status: 404 };
  }

  if (app.data().createdBy !== userId) {
    throw { code: 'FORBIDDEN_NOT_OWNER', status: 403 };
  }

  return app;
}### Security Checklist

- [ ] Never expose `internalName` to frontend
- [ ] Always use `serverTimestamp()` for dates
- [ ] Validate all user inputs
- [ ] Check app ownership before table deletion
- [ ] Implement rate limiting
- [ ] Use HTTPS only
- [ ] Sanitize CSV inputs
- [ ] Log all sensitive operations
- [ ] Implement request signing

---

## Implementation Guide

### Phase 1: Core (Week 1)

**Priority 1 - Schema Management:**
- [ ] Implement table name obfuscation
- [ ] Create Schema endpoint
- [ ] List Schemas endpoint
- [ ] Delete Schema endpoint (with ownership check)

**Priority 2 - Basic CRUD:**
- [ ] Create Record endpoint
- [ ] List Records endpoint (pagination)
- [ ] Update Record endpoint
- [ ] Delete Record endpoint
- [ ] System fields auto-population

**Priority 3 - Validation:**
- [ ] Implement all 18 field type validators
- [ ] Validation endpoint

---

### Phase 2: Bulk & CSV (Week 2)

**Bulk Operations:**
- [ ] Bulk Create endpoint (1000 limit)
- [ ] Bulk Update endpoint (500 limit)
- [ ] Bulk Delete endpoint (500 limit)

**CSV Import:**
- [ ] CSV parsing
- [ ] Auto-type detection
- [ ] Create table from CSV
- [ ] Append to existing table

**CSV Export:**
- [ ] Export all records
- [ ] Export selected records
- [ ] Include/exclude system fields

---

### Phase 3: Testing & Production (Week 3)

**Testing:**
- [ ] Unit tests (80% coverage)
- [ ] Integration tests
- [ ] Load testing (1000 concurrent users)
- [ ] CSV edge cases

**Production:**
- [ ] Error handling
- [ ] Logging & monitoring
- [ ] Rate limiting
- [ ] API documentation (Swagger)
- [ ] Deployment

---

## Performance Requirements

### Response Times (95th Percentile)

| Endpoint | Target | Max |
|----------|--------|-----|
| Create Schema | < 500ms | 1s |
| List Schemas | < 200ms | 500ms |
| Create Record | < 300ms | 500ms |
| List Records (20) | < 500ms | 1s |
| Bulk Create (100) | < 2s | 5s |
| CSV Import (1000) | < 10s | 30s |
| CSV Export (1000) | < 5s | 15s |

### Scalability

- **Concurrent Users**: 1000+
- **Records per Table**: 100,000+
- **Tables per App**: 100+
- **Bulk Operation Size**: 1000 records
- **CSV File Size**: 10MB max

### Optimization Tips

// 1. Cache schemas
const schemaCache = new LRU({ max: 500 });

// 2. Batch operations
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// 3. Index frequently queried fields
// 4. Use connection pooling
// 5. Implement request queuing for bulk ops---

## Quick Reference

### Most Important Endpoints

# Table Management
POST   /api/data-schemas/create
GET    /api/data-schemas/{appId}
DELETE /api/data-schemas/{schemaId}

# Record CRUD
POST   /api/data-records/create
GET    /api/data-records/list
PUT    /api/data-records/update/{recordId}
DELETE /api/data-records/delete/{recordId}

# CSV
POST   /api/data-records/import-csv
GET    /api/data-records/export-csv

# Bulk
POST   /api/data-records/bulk-create
POST   /api/data-records/bulk-delete### Critical Implementation Points

1. ✅ **Table Name Obfuscation** - MUST implement exactly as specified
2. ✅ **System Fields** - Auto-populate on backend (never from frontend)
3. ✅ **Ownership Check** - Only owner can delete tables
4. ✅ **Type Detection** - Auto-detect on CSV import
5. ✅ **Batch Processing** - Process in chunks of 500
6. ✅ **Validation** - All 18 field types

---

## Contact & Support

**Project Manager:** [Your Name]
**Email:** [your-email@example.com]
**Slack:** #data-management-api
**Documentation:** [URL]

---

**Document Status:** ✅ Ready for Implementation
**Last Updated:** December 27, 2025
**Version:** 1.0

---

## Appendix A: Complete Request/Response Examples

### Example 1: Complete Flow - CSV Upload to Table Creation

**Step 1: Upload CSV**
POST /api/data-records/import-csv
Content-Type: multipart/form-data
Authorization: Bearer {token}

file: users.csv
appId: myapp
userId: user-123
createNewTable: true
displayName: Users**CSV Content:**
fullName,email,phone,role,status
Ramesh Kumar,ramesh@example.com,9876543210,Admin,Active
Sita Devi,sita@example.com,9123456789,Editor,Active**Step 2: Backend Response**
{
  "success": true,
  "data": {
    "schemaId": "schema_abc123",
    "displayName": "Users",
    "internalName": "myapp_data_8a7f3c2e_users",
    "fields": [
      { "name": "fullName", "type": "text" },
      { "name": "email", "type": "email" },
      { "name": "phone", "type": "phone" },
      { "name": "role", "type": "select", "options": ["Admin", "Editor"] },
      { "name": "status", "type": "select", "options": ["Active"] }
    ],
    "insertedRecords": 2
  }
}**Step 3: Query Records**
GET /api/data-records/list?appId=myapp&schemaId=schema_abc123**Step 4: Backend Returns**
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "rec_001",
        "fullName": "Ramesh Kumar",
        "email": "ramesh@example.com",
        "phone": "9876543210",
        "role": "Admin",
        "status": "Active",
        "createdBy": "user-123",
        "createdAt": "2025-12-27T10:35:00Z",
        "updatedBy": "user-123",
        "updatedAt": "2025-12-27T10:35:00Z"
      },
      {
        "id": "rec_002",
        "fullName": "Sita Devi",
        "email": "sita@example.com",
        "phone": "9123456789",
        "role": "Editor",
        "status": "Active",
        "createdBy": "user-123",
        "createdAt": "2025-12-27T10:35:01Z",
        "updatedBy": "user-123",
        "updatedAt": "2025-12-27T10:35:01Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalRecords": 2
    }
  }
}---

**END OF DOCUMENT**
**
**Auto-Type Detection (CSV Import)
When user uploads CSV without specifying types, detect automatically:
function detectFieldType(columnData) {  // Sample first 10 non-empty values  const samples = columnData    .filter(v => v !== null && v !== undefined && v !== '')    .slice(0, 10);    if (samples.length === 0) return 'text';    // Email detection  if (samples.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) {    return 'email';  }    // Phone detection (10 digits)  if (samples.every(v => /^\d{10}$/.test(v))) {    return 'phone';  }    // URL detection  if (samples.every(v => {    try { new URL(v); return true; } catch { return false; }  })) {    return 'url';  }    // Number detection  if (samples.every(v => !isNaN(v) && v.trim() !== '')) {    return 'number';  }    // Boolean detection  const boolValues = ['true', 'false', '1', '0', 'yes', 'no'];  if (samples.every(v => boolValues.includes(v.toLowerCase()))) {    return 'boolean';  }    // Date detection  if (samples.every(v => !isNaN(Date.parse(v)))) {    return 'date';  }    // Select detection (limited unique values)  const unique = [...new Set(samples)];  if (unique.length <= 10 && unique.length < samples.length * 0.5) {    return { type: 'select', options: unique };  }    // Default to text  return 'text';}




API Endpoints Reference
Base URL
https://your-api-domain.com/api
Authentication
All endpoints require:
Authorization: Bearer {jwt-token}
1. Schema Management APIs
1.1 Create Table Schema
Creates new table with obfuscated internal name.
POST /api/data-schemas/create
Request Headers:
Authorization: Bearer {token}Content-Type: application/json
Request Body:
{  "appId": "myapp",  "appPrefix": "myapp",  "displayName": "Users",  "fields": [    {      "name": "fullName",      "type": "text",      "required": true,      "options": []    },    {      "name": "email",      "type": "email",      "required": true,      "options": []    },    {      "name": "phone",      "type": "phone",      "required": false,      "options": []    },    {      "name": "role",      "type": "select",      "required": true,      "options": ["Admin", "Editor", "Viewer"]    },    {      "name": "status",      "type": "select",      "required": false,      "options": ["Active", "Inactive"]    }  ],  "userId": "user-uid-123"}
Validation Rules:
appId: Required, must exist
displayName: Required, 1-100 chars, alphanumeric + spaces
fields: Required, 1-50 fields
field.name: Required, unique, alphanumeric + underscore
field.type: Required, must be valid type
field.options: Required for select/multiselect types
Response (201 Created):
{  "success": true,  "data": {    "schemaId": "schema_abc123xyz",    "displayName": "Users",    "internalName": "myapp_data_8a7f3c2e_users",    "appId": "myapp",    "fields": [      {        "name": "fullName",        "type": "text",        "required": true,        "options": []      },      {        "name": "email",        "type": "email",        "required": true,        "options": []      },      {        "name": "phone",        "type": "phone",        "required": false,        "options": []      },      {        "name": "role",        "type": "select",        "required": true,        "options": ["Admin", "Editor", "Viewer"]      },      {        "name": "status",        "type": "select",        "required": false,        "options": ["Active", "Inactive"]      }    ],    "createdBy": "user-uid-123",    "createdAt": "2025-12-27T10:30:00.000Z",    "updatedAt": "2025-12-27T10:30:00.000Z"  }}
Error Responses:
// 400 - Validation Error{  "success": false,  "error": {    "code": "VALIDATION_ERROR",    "message": "Invalid field configuration",    "details": {      "field": "role",      "reason": "Select type requires options array"    }  }}// 409 - Duplicate Table{  "success": false,  "error": {    "code": "DUPLICATE_TABLE",    "message": "A table with this name already exists",    "details": {      "displayName": "Users",      "existingSchemaId": "schema_old123"    }  }}
1.2 List All Tables
Get all tables for an app with record counts.
GET /api/data-schemas/{appId}
Response (200 OK):
{  "success": true,  "data": {    "schemas": [      {        "schemaId": "schema_abc123xyz",        "displayName": "Users",        "internalName": "myapp_data_8a7f3c2e_users",        "appId": "myapp",        "fields": [...],        "recordCount": 145,        "createdBy": "user-uid-123",        "createdAt": "2025-12-27T10:30:00.000Z",        "updatedAt": "2025-12-27T14:20:00.000Z"      },      {        "schemaId": "schema_def456uvw",        "displayName": "Products",        "internalName": "myapp_data_9b2e4d1f_products",        "appId": "myapp",        "fields": [...],        "recordCount": 89,        "createdBy": "user-uid-123",        "createdAt": "2025-12-26T09:15:00.000Z",        "updatedAt": "2025-12-27T11:00:00.000Z"      }    ],    "totalTables": 2  }}
1.3 Get Single Table Schema
GET /api/data-schemas/{appId}/{schemaId}
Response (200 OK):
{  "success": true,  "data": {    "schemaId": "schema_abc123xyz",    "displayName": "Users",    "internalName": "myapp_data_8a7f3c2e_users",    "appId": "myapp",    "fields": [...],    "recordCount": 145,    "createdBy": "user-uid-123",    "createdAt": "2025-12-27T10:30:00.000Z"  }}
1.4 Delete Table (Schema + All Data)
⚠️ CRITICAL: Only app owner can delete tables
DELETE /api/data-schemas/{schemaId}
Request Body:
{  "appId": "myapp",  "userId": "user-uid-123",  "confirmDelete": true}
Authorization Check (MUST IMPLEMENT):
// Verify user is app creatorconst app = await getApp(appId);if (app.createdBy !== userId) {  return res.status(403).json({    error: {      code: "FORBIDDEN",      message: "Only app owner can delete tables"    }  });}
Response (200 OK):
{  "success": true,  "message": "Table 'Users' and 145 records deleted successfully",  "data": {    "schemaId": "schema_abc123xyz",    "displayName": "Users",    "deletedRecords": 145  }}
2. Record CRUD APIs
2.1 Create Single Record
POST /api/data-records/create
Request Body:
{  "appId": "myapp",  "schemaId": "schema_abc123xyz",  "userId": "user-uid-123",  "data": {    "fullName": "Ramesh Kumar",    "email": "ramesh@example.com",    "phone": "9876543210",    "role": "Admin",    "status": "Active"  }}
Backend Processing (MUST IMPLEMENT):
// 1. Get schema to retrieve internalNameconst schema = await getSchema(schemaId);// 2. Validate dataconst validation = validateRecord(data, schema.fields);if (!validation.valid) {  return { error: validation.errors };}// 3. Add system fieldsconst recordToSave = {  ...data,  id: generateFirestoreId(),  createdBy: userId,  createdAt: serverTimestamp(),  updatedBy: userId,  updatedAt: serverTimestamp()};// 4. Insert into internal collectionawait db.collection(schema.internalName).add(recordToSave);// 5. Update record countawait incrementRecordCount(schemaId);
Response (201 Created):
{  "success": true,  "data": {    "id": "rec_xyz789abc",    "fullName": "Ramesh Kumar",    "email": "ramesh@example.com",    "phone": "9876543210",    "role": "Admin",    "status": "Active",    "createdBy": "user-uid-123",    "createdAt": "2025-12-27T10:35:00.000Z",    "updatedBy": "user-uid-123",    "updatedAt": "2025-12-27T10:35:00.000Z"  }}
2.2 List Records (Paginated)
GET /api/data-records/list
Query Parameters:
?appId=myapp&schemaId=schema_abc123xyz&page=1&pageSize=20&sortBy=createdAt&sortOrder=desc&searchQuery=ramesh
Response (200 OK):
{  "success": true,  "data": {    "records": [      {        "id": "rec_xyz789abc",        "fullName": "Ramesh Kumar",        "email": "ramesh@example.com",        "phone": "9876543210",        "role": "Admin",        "status": "Active",        "createdBy": "user-uid-123",        "createdAt": "2025-12-27T10:35:00.000Z",        "updatedBy": "user-uid-123",        "updatedAt": "2025-12-27T10:35:00.000Z"      }    ],    "pagination": {      "currentPage": 1,      "pageSize": 20,      "totalRecords": 145,      "totalPages": 8,      "hasNextPage": true,      "hasPreviousPage": false    }  }}
2.3 Update Single Record
PUT /api/data-records/update/{recordId}
Request Body:
{  "appId": "myapp",  "schemaId": "schema_abc123xyz",  "userId": "user-uid-456",  "data": {    "phone": "9999888877",    "status": "Inactive"  }}
Backend Processing:
const updates = {  ...data,  updatedBy: userId,  updatedAt: serverTimestamp()};// NEVER update: id, createdBy, createdAtawait db.collection(internalName).doc(recordId).update(updates);
Response (200 OK):
{  "success": true,  "data": {    "id": "rec_xyz789abc",    "fullName": "Ramesh Kumar",    "email": "ramesh@example.com",    "phone": "9999888877",    "role": "Admin",    "status": "Inactive",    "createdBy": "user-uid-123",    "createdAt": "2025-12-27T10:35:00.000Z",    "updatedBy": "user-uid-456",    "updatedAt": "2025-12-27T15:42:00.000Z"  }}
2.4 Delete Single Record
DELETE /api/data-records/delete/{recordId}
Request Body:
{  "appId": "myapp",  "schemaId": "schema_abc123xyz"}
Response (200 OK):
{  "success": true,  "message": "Record deleted successfully",  "data": {    "deletedRecordId": "rec_xyz789abc"  }}
3. Bulk Operations APIs
3.1 Bulk Create Records
Limit: Maximum 1000 records per request
POST /api/data-records/bulk-create
Request Body:
{  "appId": "myapp",  "schemaId": "schema_abc123xyz",  "userId": "user-uid-123",  "records": [    {      "fullName": "Sita Devi",      "email": "sita@example.com",      "phone": "9123456789",      "role": "Editor",      "status": "Active"    },    {      "fullName": "Arjun Rao",      "email": "arjun@example.com",      "phone": "9988776655",      "role": "Viewer",      "status": "Inactive"    }  ]}
Backend Processing:
// Process in batches of 500 (Firestore limit)const batches = chunkArray(validatedRecords, 500);for (const batch of batches) {  const writeBatch = db.batch();    batch.forEach(record => {    const docRef = db.collection(internalName).doc();    writeBatch.set(docRef, {      ...record,      id: docRef.id,      createdBy: userId,      createdAt: serverTimestamp(),      updatedBy: userId,      updatedAt: serverTimestamp()    });  });    await writeBatch.commit();}
Response (201 Created):
{  "success": true,  "data": {    "insertedCount": 2,    "totalRequested": 2,    "failed": 0,    "errors": []  }}
3.2 Bulk Update Records
Limit: Maximum 500 updates per request
POST /api/data-records/bulk-update
Request Body:
{  "appId": "myapp",  "schemaId": "schema_abc123xyz",  "userId": "user-uid-123",  "updates": [    {      "recordId": "rec_xyz789abc",      "data": { "status": "Inactive" }    },    {      "recordId": "rec_aaa111",      "data": { "role": "Admin", "status": "Active" }    }  ]}
Response (200 OK):
{  "success": true,  "data": {    "updatedCount": 2,    "totalRequested": 2,    "failed": 0  }}
3.3 Bulk Delete Records
Limit: Maximum 500 deletions per request
POST /api/data-records/bulk-delete
Request Body:
{  "appId": "myapp",  "schemaId": "schema_abc123xyz",  "recordIds": ["rec_xyz789abc", "rec_aaa111", "rec_bbb222"]}
Response (200 OK):
{  "success": true,  "data": {    "deletedCount": 3,    "totalRequested": 3,    "deletedIds": ["rec_xyz789abc", "rec_aaa111", "rec_bbb222"]  }}
4. CSV Import/Export APIs
4.1 Import CSV - Create New Table
Upload CSV, auto-detect types, create table, insert data.
POST /api/data-records/import-csvContent-Type: multipart/form-data
Form Data:
file: users.csv (binary)appId: myappuserId: user-uid-123createNewTable: truedisplayName: Users
Example CSV File:


fullName,email,phone,role,statusRamesh Kumar,ramesh@example.com,9876543210,Admin,ActiveSita Devi,sita@example.com,9123456789,Editor,ActiveArjun Rao,arjun@example.com,9988776655,Viewer,Inactive
Backend Processing Flow:
// STEP 1: Parse CSVconst parsed = parseCSV(file);// Result:// headers: ["fullName", "email", "phone", "role", "status"]// rows: [{ fullName: "Ramesh Kumar", ... }, ...]// STEP 2: Auto-detect field typesconst fields = parsed.headers.map(header => {  const columnData = parsed.rows.map(row => row[header]);  const detected = detectFieldType(columnData);    return {    name: header,    type: detected.type || detected,    required: false,    options: detected.options || []  };});// Detected fields example:// [//   { name: "fullName", type: "text" },//   { name: "email", type: "email" },//   { name: "phone", type: "phone" },//   { name: "role", type: "select", options: ["Admin", "Editor", "Viewer"] },//   { name: "status", type: "select", options: ["Active", "Inactive"] }// ]// STEP 3: Generate internal table nameconst timestamp = Date.now();const internalName = generateInternalTableName(appPrefix, displayName, timestamp);// STEP 4: Create schemaconst schema = await createSchema({  appId,  appPrefix,  displayName,  internalName,  fields,  userId});// STEP 5: Insert all records with system fieldsconst recordsToInsert = parsed.rows.map(row => ({  ...row,  id: generateId(),  createdBy: userId,  createdAt: serverTimestamp(),  updatedBy: userId,  updatedAt: serverTimestamp()}));await bulkInsert(schema.internalName, recordsToInsert);
Response (201 Created):
{  "success": true,  "data": {    "schemaId": "schema_new123",    "displayName": "Users",    "internalName": "myapp_data_8a7f3c2e_users",    "fields": [      {        "name": "fullName",        "type": "text",        "required": false,        "options": []      },      {        "name": "email",        "type": "email",        "required": false,        "options": []      },      {        "name": "phone",        "type": "phone",        "required": false,        "options": []      },      {        "name": "role",        "type": "select",        "required": false,        "options": ["Admin", "Editor", "Viewer"]      },      {        "name": "status",        "type": "select",        "required": false,        "options": ["Active", "Inactive"]      }    ],    "insertedRecords": 3,    "totalRowsInCSV": 3,    "skippedRows": 0  }}
4.2 Import CSV - Append to Existing Table
POST /api/data-records/import-csvContent-Type: multipart/form-data
Form Data:
file: more_users.csv (binary)appId: myappuserId: user-uid-123createNewTable: falseschemaId: schema_abc123xyz
Backend Processing:
// 1. Parse CSVconst parsed = parseCSV(file);// 2. Get schemaconst schema = await getSchema(schemaId);// 3. Validate CSV headers match schemaconst schemaFields = schema.fields.map(f => f.name);const csvHeaders = parsed.headers;const missingFields = schemaFields.filter(f => !csvHeaders.includes(f));const extraFields = csvHeaders.filter(h => !schemaFields.includes(h));if (missingFields.length || extraFields.length) {  return {    error: "CSV headers don't match schema",    missingFields,    extraFields  };}// 4. Validate and insertconst validRecords = parsed.rows  .filter(row => validateRecord(row, schema.fields).valid)  .map(row => ({    ...row,    id: generateId(),    createdBy: userId,    createdAt: serverTimestamp(),    updatedBy: userId,    updatedAt: serverTimestamp()  }));await bulkInsert(schema.internalName, validRecords);
Response (201 Created):
{  "success": true,  "data": {    "schemaId": "schema_abc123xyz",    "displayName": "Users",    "insertedRecords": 5,    "totalRecords": 150,    "skippedRows": 0,    "errors": []  }}
4.3 Export CSV
GET /api/data-records/export-csv
Query Parameters:
?appId=myapp&schemaId=schema_abc123xyz&recordIds=rec_xyz789abc,rec_aaa111  (optional)&includeSystemFields=false  (optional, default: false)
Response Headers:
Content-Type: text/csv; charset=utf-8Content-Disposition: attachment; filename="users_2025-12-27.csv"
Response Body (CSV):
fullName,email,phone,role,statusRamesh Kumar,ramesh@example.com,9876543210,Admin,ActiveSita Devi,sita@example.com,9123456789,Editor,ActiveArjun Rao,arjun@example.com,9988776655,Viewer,Inactive
With System Fields (includeSystemFields=true):
id,fullName,email,phone,role,status,createdBy,createdAt,updatedBy,updatedAtrec_xyz789abc,Ramesh Kumar,ramesh@example.com,9876543210,Admin,Active,user-uid-123,2025-12-27T10:35:00Z,user-uid-123,2025-12-27T10:35:00Z
5. Validation API
5.1 Validate Record
Pre-validate record before save (frontend can use this).
POST /api/data-records/validate
Request Body:
{  "appId": "myapp",  "schemaId": "schema_abc123xyz",  "data": {    "fullName": "Test User",    "email": "invalid-email",    "phone": "123",    "role": "SuperAdmin"  }}
Response (200 OK):
{  "success": false,  "valid": false,  "errors": {    "email": "Invalid email format",    "phone": "Phone number must be 10 digits",    "role": "Invalid option. Must be one of: Admin, Editor, Viewer"  }}
Valid Response:
{  "success": true,  "valid": true,  "errors": {}}
Error Handling
Standard Error Format
{  "success": false,  "error": {    "code": "ERROR_CODE",    "message": "Human-readable message",    "details": {      "additionalInfo": "value"    }  }}
HTTP Status Codes
Code	Meaning	Usage
200	OK	Successful GET, PUT, DELETE
201	Created	Successful POST
207	Multi-Status	Partial success in bulk ops
400	Bad Request	Invalid input
401	Unauthorized	Invalid/missing token
403	Forbidden	Insufficient permissions
404	Not Found	Resource doesn't exist
409	Conflict	Duplicate resource
500	Internal Error	Server error
Error Codes Reference
// Authentication & Authorization"UNAUTHORIZED"              // 401 - Invalid token"FORBIDDEN"                 // 403 - No permission"FORBIDDEN_NOT_OWNER"       // 403 - Not app owner// Validation"VALIDATION_ERROR"          // 400 - Data validation failed"INVALID_INPUT"             // 400 - Missing/invalid fields"INVALID_FIELD_TYPE"        // 400 - Unsupported field type// Resources"APP_NOT_FOUND"             // 404 - App doesn't exist"SCHEMA_NOT_FOUND"          // 404 - Table schema not found"RECORD_NOT_FOUND"          // 404 - Record doesn't exist// Conflicts"DUPLICATE_TABLE"           // 409 - Table name exists"DUPLICATE_FIELD"           // 409 - Field name exists in schema// Limits"BULK_LIMIT_EXCEEDED"       // 400 - Too many records"FIELD_LIMIT_EXCEEDED"      // 400 - Too many fields// CSV"CSV_PARSE_ERROR"           // 400 - Invalid CSV format"CSV_SCHEMA_MISMATCH"       // 400 - Headers don't match// Server"INTERNAL_ERROR"            // 500 - Unexpected error
Example Error Responses
Validation Error:
{  "success": false,  "error": {    "code": "VALIDATION_ERROR",    "message": "Record validation failed",    "details": {      "email": "Invalid email format",      "role": "Invalid option"    }  }}
Not Found:
{  "success": false,  "error": {    "code": "SCHEMA_NOT_FOUND",    "message": "Table schema not found",    "details": {      "schemaId": "schema_invalid",      "appId": "myapp"    }  }}
Forbidden:
{  "success": false,  "error": {    "code": "FORBIDDEN_NOT_OWNER",    "message": "Only app owner can delete tables",    "details": {      "userId": "user-456",      "appCreatedBy": "user-123"    }  }}
Database Structure
Collection: {appPrefix}_data_schemas
Stores table metadata and field definitions.
Example Document:
{  _id: "schema_abc123xyz",    // Display & Internal Names  displayName: "Users",  internalName: "myapp_data_8a7f3c2e_users",    // App Association  appId: "myapp",  appPrefix: "myapp",    // Schema  fields: [    {      name: "fullName",      type: "text",      required: true,      options: []    },    {      name: "email",      type: "email",      required: true,      options: []    },    {      name: "role",      type: "select",      required: true,      options: ["Admin", "Editor", "Viewer"]    }  ],    // Metadata  recordCount: 145,  createdBy: "user-uid-123",  createdAt: Timestamp,  updatedAt: Timestamp}
Required Indexes:
{ appId: 1, displayName: 1 }  // Unique per app{ appId: 1, createdAt: -1 }   // List by date
Collection: {internalName}
Stores actual data records.
Example: myapp_data_8a7f3c2e_users
{  _id: "rec_xyz789abc",    // System Fields  id: "rec_xyz789abc",  createdBy: "user-uid-123",  createdAt: Timestamp,  updatedBy: "user-uid-456",  updatedAt: Timestamp,    // User Fields  fullName: "Ramesh Kumar",  email: "ramesh@example.com",  phone: "9876543210",  role: "Admin",  status: "Active"}
Required Indexes:
{ createdAt: -1 }{ updatedAt: -1 }{ createdBy: 1 }
Authorization & Security
Access Control Rules
Operation	Requirement	Check
Create Schema	App Access	User has app access
List Schemas	App Access	User has app access
Delete Schema	App Owner	userId === app.createdBy
CRUD Records	App Access	User has app access
Bulk Ops	App Access	User has app access
CSV Import/Export	App Access	User has app access
Implementation
// Check App Accessasync function verifyAppAccess(userId, appId) {  const app = await db.collection('apps_meta').doc(appId).get();    if (!app.exists) {    throw { code: 'APP_NOT_FOUND', status: 404 };  }    const hasAccess = app.data().createdBy === userId;  // OR check app_users collection if you have multi-user apps    if (!hasAccess) {    throw { code: 'FORBIDDEN', status: 403 };  }    return app;}// Check App Ownership (Stricter)async function verifyAppOwnership(userId, appId) {  const app = await db.collection('apps_meta').doc(appId).get();    if (!app.exists) {    throw { code: 'APP_NOT_FOUND', status: 404 };  }    if (app.data().createdBy !== userId) {    throw { code: 'FORBIDDEN_NOT_OWNER', status: 403 };  }    return app;}
Security Checklist
[ ] Never expose internalName to frontend
[ ] Always use serverTimestamp() for dates
[ ] Validate all user inputs
[ ] Check app ownership before table deletion
[ ] Implement rate limiting
[ ] Use HTTPS only
[ ] Sanitize CSV inputs
[ ] Log all sensitive operations
[ ] Implement request signing
Implementation Guide
Phase 1: Core (Week 1)
Priority 1 - Schema Management:
[ ] Implement table name obfuscation
[ ] Create Schema endpoint
[ ] List Schemas endpoint
[ ] Delete Schema endpoint (with ownership check)
Priority 2 - Basic CRUD:
[ ] Create Record endpoint
[ ] List Records endpoint (pagination)
[ ] Update Record endpoint
[ ] Delete Record endpoint
[ ] System fields auto-population
Priority 3 - Validation:
[ ] Implement all 18 field type validators
[ ] Validation endpoint
Phase 2: Bulk & CSV (Week 2)
Bulk Operations:
[ ] Bulk Create endpoint (1000 limit)
[ ] Bulk Update endpoint (500 limit)
[ ] Bulk Delete endpoint (500 limit)
CSV Import:
[ ] CSV parsing
[ ] Auto-type detection
[ ] Create table from CSV
[ ] Append to existing table
CSV Export:
[ ] Export all records
[ ] Export selected records
[ ] Include/exclude system fields
Phase 3: Testing & Production (Week 3)
Testing:
[ ] Unit tests (80% coverage)
[ ] Integration tests
[ ] Load testing (1000 concurrent users)
[ ] CSV edge cases
Production:
[ ] Error handling
[ ] Logging & monitoring
[ ] Rate limiting
[ ] API documentation (Swagger)
[ ] Deployment
Performance Requirements
Response Times (95th Percentile)
Endpoint	Target	Max
Create Schema	< 500ms	1s
List Schemas	< 200ms	500ms
Create Record	< 300ms	500ms
List Records (20)	< 500ms	1s
Bulk Create (100)	< 2s	5s
CSV Import (1000)	< 10s	30s
CSV Export (1000)	< 5s	15s
Scalability
Concurrent Users: 1000+
Records per Table: 100,000+
Tables per App: 100+
Bulk Operation Size: 1000 records
CSV File Size: 10MB max
Optimization Tips
// 1. Cache schemasconst schemaCache = new LRU({ max: 500 });// 2. Batch operationsfunction chunkArray(array, size) {  const chunks = [];  for (let i = 0; i < array.length; i += size) {    chunks.push(array.slice(i, i + size));  }  return chunks;}// 3. Index frequently queried fields// 4. Use connection pooling// 5. Implement request queuing for bulk ops
Quick Reference
Most Important Endpoints
# Table ManagementPOST
/api/data-schemas/createGET
/api/data-schemas/{appId}DELETE
/api/data-schemas/{schemaId}# Record CRUDPOST
/api/data-records/createGET
/api/data-records/listPUT
/api/data-records/update/{recordId}DELETE
/api/data-records/delete/{recordId}# CSVPOST
/api/data-records/import-csvGET    /api/data-records/export-csv# BulkPOST   /api/data-records/bulk-createPOST   /api/data-records/bulk-delete
ritical Implementation Points
✅ Table Name Obfuscation - MUST implement exactly as specified
✅ System Fields - Auto-populate on backend (never from frontend)
✅ Ownership Check - Only owner can delete tables
✅ Type Detection - Auto-detect on CSV import
✅ Batch Processing - Process in chunks of 500
✅ Validation - All 18 field types
Appendix A: Complete Request/Response Examples
Example 1: Complete Flow - CSV Upload to Table Creation
Step 1: Upload CSV
POST /api/data-records/import-csvContent-Type: multipart/form-dataAuthorization: Bearer {token}file: users.csvappId: myappuserId: user-123createNewTable: truedisplayName: Users
CSV Content:
fullName,email,phone,role,statusRamesh Kumar,ramesh@example.com,9876543210,Admin,ActiveSita Devi,sita@example.com,9123456789,Editor,Active
Step 2: Backend Response
{  "success": true,  "data": {    "schemaId": "schema_abc123",    "displayName": "Users",    "internalName": "myapp_data_8a7f3c2e_users",    "fields": [      { "name": "fullName", "type": "text" },      { "name": "email", "type": "email" },      { "name": "phone", "type": "phone" },      { "name": "role", "type": "select", "options": ["Admin", "Editor"] },      { "name": "status", "type": "select", "options": ["Active"] }    ],    "insertedRecords": 2  }}
Step 3: Query Records
GET /api/data-records/list?appId=myapp&schemaId=schema_abc123
Step 4: Backend Returns
{  "success": true,  "data": {    "records": [      {        "id": "rec_001",        "fullName": "Ramesh Kumar",        "email": "ramesh@example.com",        "phone": "9876543210",        "role": "Admin",        "status": "Active",        "createdBy": "user-123",        "createdAt": "2025-12-27T10:35:00Z",        "updatedBy": "user-123",        "updatedAt": "2025-12-27T10:35:00Z"      },      {        "id": "rec_002",        "fullName": "Sita Devi",        "email": "sita@example.com",        "phone": "9123456789",        "role": "Editor",        "status": "Active",        "createdBy": "user-123",        "createdAt": "2025-12-27T10:35:01Z",        "updatedBy": "user-123",        "updatedAt": "2025-12-27T10:35:01Z"      }    ],    "pagination": {      "currentPage": 1,      "totalRecords": 2    }  }}
END OF DOCUMENT
