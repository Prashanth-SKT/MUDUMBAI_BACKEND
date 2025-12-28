# Data Management API - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Server
```bash
cd /home/sukusala/Desktop/MUDUMBAI_Backend
npm run dev
```

Server will start at: `http://localhost:5000`

---

### Step 2: Test with Postman

1. **Import the Collection**
   - Open Postman
   - Click "Import"
   - Select `Data_Management_API.postman_collection.json`

2. **Run the Tests in Order**
   ```
   Schema Management → 1. Create Table Schema
   Record CRUD → 1. Create Single Record
   Record CRUD → 2. List Records
   CSV Import/Export → 1. Import CSV (use sample_users.csv)
   ```

---

### Step 3: Create Your First Table

```bash
curl -X POST http://localhost:5000/api/data-schemas/create \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "myapp",
    "appPrefix": "myapp",
    "displayName": "Users",
    "userId": "user123",
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
        "name": "role",
        "type": "select",
        "required": true,
        "options": ["Admin", "Editor", "Viewer"]
      }
    ]
  }'
```

**Response will include:**
- `schemaId` - Use this for all record operations
- `internalName` - Obfuscated table name (e.g., "myapp_data_8a7f3c2e_users")

---

### Step 4: Create a Record

```bash
# Replace SCHEMA_ID with the schemaId from Step 3
curl -X POST http://localhost:5000/api/data-records/create \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "myapp",
    "appPrefix": "myapp",
    "schemaId": "SCHEMA_ID",
    "userId": "user123",
    "data": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "Admin"
    }
  }'
```

**Response will include:**
- Record with auto-populated system fields
- `id`, `createdBy`, `createdAt`, `updatedBy`, `updatedAt`

---

### Step 5: Import CSV Data

```bash
# Replace SCHEMA_ID with the schemaId from Step 3
curl -X POST http://localhost:5000/api/data-records/import-csv \
  -F "file=@sample_users.csv" \
  -F "appId=myapp" \
  -F "appPrefix=myapp" \
  -F "userId=user123" \
  -F "createNewTable=true" \
  -F "displayName=Users"
```

**This will:**
- Auto-detect field types from CSV
- Create table schema
- Import all records
- Return field types detected

---

## 📚 Available Endpoints

### Schema Management (4 endpoints)
```
POST   /api/data-schemas/create
GET    /api/data-schemas/:appId
GET    /api/data-schemas/:appId/:schemaId
DELETE /api/data-schemas/:schemaId
```

### Record CRUD (5 endpoints)
```
POST   /api/data-records/create
GET    /api/data-records/list
PUT    /api/data-records/update/:recordId
DELETE /api/data-records/delete/:recordId
POST   /api/data-records/validate
```

### Bulk Operations (3 endpoints)
```
POST   /api/data-records/bulk-create
POST   /api/data-records/bulk-update
POST   /api/data-records/bulk-delete
```

### CSV Import/Export (2 endpoints)
```
POST   /api/data-records/import-csv
GET    /api/data-records/export-csv
```

**Total: 14 endpoints**

---

## 🎯 Common Use Cases

### Use Case 1: Create a Product Catalog
```json
{
  "displayName": "Products",
  "fields": [
    {"name": "productName", "type": "text", "required": true},
    {"name": "price", "type": "currency", "required": true},
    {"name": "description", "type": "textarea", "required": false},
    {"name": "category", "type": "select", "options": ["Electronics", "Clothing", "Food"]},
    {"name": "inStock", "type": "boolean", "required": true},
    {"name": "imageUrl", "type": "image", "required": false}
  ]
}
```

### Use Case 2: Import Employee Data
1. Create CSV file:
   ```csv
   fullName,email,department,salary,joinDate
   John Doe,john@company.com,Engineering,75000,2024-01-15
   Jane Smith,jane@company.com,Marketing,65000,2024-02-01
   ```

2. Import with auto-detection:
   ```bash
   curl -X POST http://localhost:5000/api/data-records/import-csv \
     -F "file=@employees.csv" \
     -F "createNewTable=true" \
     -F "displayName=Employees"
   ```

3. System will detect:
   - `fullName` → text
   - `email` → email
   - `department` → select (if limited values)
   - `salary` → number
   - `joinDate` → date

### Use Case 3: Bulk Update Status
```json
{
  "schemaId": "schema_abc123",
  "updates": [
    {"recordId": "rec_001", "data": {"status": "Active"}},
    {"recordId": "rec_002", "data": {"status": "Active"}},
    {"recordId": "rec_003", "data": {"status": "Inactive"}}
  ]
}
```

---

## 🔧 Configuration

### Required Query Parameters
Most endpoints need:
- `appId` - Your application ID
- `appPrefix` - Your app prefix (usually same as appId)
- `userId` - Current user ID

### Optional Query Parameters
- `page` - Page number (default: 1)
- `pageSize` - Records per page (default: 20)
- `sortBy` - Field to sort by (default: "createdAt")
- `sortOrder` - "asc" or "desc" (default: "desc")
- `searchQuery` - Search text (optional)
- `includeSystemFields` - Include system fields in CSV export (default: false)

---

## 🎨 Supported Field Types (18 Types)

```javascript
// Text Types
"text"         // Short text (500 chars)
"textarea"     // Long text (5000 chars)

// Number Types
"number"       // Any number
"currency"     // Money (≥ 0)
"percentage"   // 0-100
"rating"       // 1-5 stars

// Contact Types
"email"        // Email format
"phone"        // 10 digits
"url"          // Valid URL

// Date/Time Types
"date"         // Date only
"datetime"     // Date + time

// Selection Types
"boolean"      // true/false
"select"       // Single choice
"multiselect"  // Multiple choices

// Media Types
"file"         // File URL
"image"        // Image URL
"color"        // Hex color (#RRGGBB)

// Data Type
"json"         // JSON data
```

---

## 📖 Full Documentation

- **Complete API Reference**: See `DATA_MANAGEMENT_API.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Original Specification**: See `apirequirement.md`

---

## 🐛 Troubleshooting

### Error: "SCHEMA_NOT_FOUND"
- Make sure you're using the correct `schemaId`
- Check that `appId` and `appPrefix` match

### Error: "VALIDATION_ERROR"
- Check field types match
- Verify required fields are provided
- For select types, ensure value is in options array

### Error: "CSV_SCHEMA_MISMATCH"
- When appending to existing table, CSV headers must match exactly
- Check field names match schema

### Error: "BULK_LIMIT_EXCEEDED"
- Bulk create: Max 1000 records
- Bulk update: Max 500 records
- Bulk delete: Max 500 records

---

## ✅ Next Steps

1. **Add Authentication**
   - Implement JWT middleware
   - Verify Bearer tokens

2. **Test All Endpoints**
   - Use Postman collection
   - Test edge cases

3. **Integrate with Frontend**
   - Use the API in your app
   - Handle errors gracefully

4. **Add Custom Features**
   - Add your business logic
   - Customize validation rules

---

## 📞 Need Help?

- Check `DATA_MANAGEMENT_API.md` for detailed API reference
- Check `IMPLEMENTATION_SUMMARY.md` for implementation details
- Check Postman collection for working examples

---

**Happy Coding! 🚀**


