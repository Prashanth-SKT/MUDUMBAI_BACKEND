# cURL Test Commands - Copy & Paste

Quick reference for testing the Data Management API with curl commands for the **sample** app.

---

## 🔧 Configuration

```bash
# Set these variables in your terminal first
export BASE_URL="http://localhost:5000/api"
export APP_ID="sample"
export APP_PREFIX="sample"
export USER_ID="zCfe1a96aLQON7KF9smnemHiJKu1"
```

---

## 📝 Test Commands

### 1. Health Check
```bash
curl http://localhost:5000/health | jq '.'
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-27T..."
}
```

---

### 2. Create Table Schema (Products)
```bash
curl -X POST $BASE_URL/data-schemas/create \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'$APP_ID'",
    "appPrefix": "'$APP_PREFIX'",
    "displayName": "Products",
    "userId": "'$USER_ID'",
    "fields": [
      {
        "name": "productName",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "name": "price",
        "type": "currency",
        "required": true,
        "options": []
      },
      {
        "name": "category",
        "type": "select",
        "required": true,
        "options": ["Electronics", "Clothing", "Food", "Books"]
      },
      {
        "name": "inStock",
        "type": "boolean",
        "required": true,
        "options": []
      },
      {
        "name": "rating",
        "type": "rating",
        "required": false,
        "options": []
      }
    ]
  }' | jq '.'
```

**Save the `schemaId` from response:**
```bash
export SCHEMA_ID="schema_xxxxx"
```

---

### 3. List All Table Schemas
```bash
curl "$BASE_URL/data-schemas/$APP_ID?appPrefix=$APP_PREFIX" | jq '.'
```

---

### 4. Get Single Table Schema
```bash
curl "$BASE_URL/data-schemas/$APP_ID/$SCHEMA_ID?appPrefix=$APP_PREFIX" | jq '.'
```

---

### 5. Create Single Record
```bash
curl -X POST $BASE_URL/data-records/create \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'$APP_ID'",
    "appPrefix": "'$APP_PREFIX'",
    "schemaId": "'$SCHEMA_ID'",
    "userId": "'$USER_ID'",
    "data": {
      "productName": "Laptop Pro 15",
      "price": 1299.99,
      "category": "Electronics",
      "inStock": true,
      "rating": 5
    }
  }' | jq '.'
```

**Save the `id` from response:**
```bash
export RECORD_ID="rec_xxxxx"
```

---

### 6. List Records (Paginated)
```bash
curl "$BASE_URL/data-records/list?appId=$APP_ID&appPrefix=$APP_PREFIX&schemaId=$SCHEMA_ID&page=1&pageSize=20&sortBy=createdAt&sortOrder=desc" | jq '.'
```

---

### 7. Update Record
```bash
curl -X PUT $BASE_URL/data-records/update/$RECORD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'$APP_ID'",
    "appPrefix": "'$APP_PREFIX'",
    "schemaId": "'$SCHEMA_ID'",
    "userId": "'$USER_ID'",
    "data": {
      "price": 1199.99,
      "inStock": false
    }
  }' | jq '.'
```

---

### 8. Search Records
```bash
curl "$BASE_URL/data-records/list?appId=$APP_ID&appPrefix=$APP_PREFIX&schemaId=$SCHEMA_ID&page=1&pageSize=20&searchQuery=laptop" | jq '.'
```

---

### 9. Validate Record (will show errors)
```bash
curl -X POST $BASE_URL/data-records/validate \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'$APP_ID'",
    "appPrefix": "'$APP_PREFIX'",
    "schemaId": "'$SCHEMA_ID'",
    "data": {
      "productName": "",
      "price": -100,
      "category": "InvalidCategory",
      "rating": 10
    }
  }' | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "valid": false,
  "errors": {
    "productName": "productName is required",
    "price": "Invalid currency format for price",
    "category": "Invalid select format for category",
    "rating": "Invalid rating format for rating"
  }
}
```

---

### 10. Bulk Create Records
```bash
curl -X POST $BASE_URL/data-records/bulk-create \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'$APP_ID'",
    "appPrefix": "'$APP_PREFIX'",
    "schemaId": "'$SCHEMA_ID'",
    "userId": "'$USER_ID'",
    "records": [
      {
        "productName": "Wireless Mouse",
        "price": 29.99,
        "category": "Electronics",
        "inStock": true,
        "rating": 4
      },
      {
        "productName": "Cotton T-Shirt",
        "price": 19.99,
        "category": "Clothing",
        "inStock": true,
        "rating": 4
      },
      {
        "productName": "JavaScript Guide",
        "price": 39.99,
        "category": "Books",
        "inStock": true,
        "rating": 5
      }
    ]
  }' | jq '.'
```

---

### 11. Export to CSV
```bash
# Export all records
curl "$BASE_URL/data-records/export-csv?appId=$APP_ID&appPrefix=$APP_PREFIX&schemaId=$SCHEMA_ID&includeSystemFields=false" \
  -o products.csv

# View the CSV
cat products.csv
```

**With System Fields:**
```bash
curl "$BASE_URL/data-records/export-csv?appId=$APP_ID&appPrefix=$APP_PREFIX&schemaId=$SCHEMA_ID&includeSystemFields=true" \
  -o products_with_system.csv
```

---

### 12. Import CSV (Create New Table)
```bash
# First, create a sample CSV file
cat > sample_users.csv << 'EOF'
fullName,email,phone,role,status
Ramesh Kumar,ramesh@example.com,9876543210,Admin,Active
Sita Devi,sita@example.com,9123456789,Editor,Active
Arjun Rao,arjun@example.com,9988776655,Viewer,Inactive
Priya Sharma,priya@example.com,9111222333,Editor,Active
Vijay Reddy,vijay@example.com,9444555666,Viewer,Active
EOF

# Import it
curl -X POST $BASE_URL/data-records/import-csv \
  -F "file=@sample_users.csv" \
  -F "appId=$APP_ID" \
  -F "appPrefix=$APP_PREFIX" \
  -F "userId=$USER_ID" \
  -F "createNewTable=true" \
  -F "displayName=Users" | jq '.'
```

**Save the new `schemaId`:**
```bash
export USERS_SCHEMA_ID="schema_xxxxx"
```

---

### 13. Import CSV (Append to Existing Table)
```bash
# Create additional records
cat > more_users.csv << 'EOF'
fullName,email,phone,role,status
Lakshmi Iyer,lakshmi@example.com,9777888999,Admin,Active
Rajesh Patel,rajesh@example.com,9222333444,Editor,Active
EOF

# Append to existing table
curl -X POST $BASE_URL/data-records/import-csv \
  -F "file=@more_users.csv" \
  -F "appId=$APP_ID" \
  -F "appPrefix=$APP_PREFIX" \
  -F "userId=$USER_ID" \
  -F "createNewTable=false" \
  -F "schemaId=$USERS_SCHEMA_ID" | jq '.'
```

---

### 14. Bulk Update Records
```bash
curl -X POST $BASE_URL/data-records/bulk-update \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'$APP_ID'",
    "appPrefix": "'$APP_PREFIX'",
    "schemaId": "'$SCHEMA_ID'",
    "userId": "'$USER_ID'",
    "updates": [
      {
        "recordId": "'$RECORD_ID'",
        "data": { "price": 999.99, "inStock": true }
      }
    ]
  }' | jq '.'
```

---

### 15. Bulk Delete Records
```bash
curl -X POST $BASE_URL/data-records/bulk-delete \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'$APP_ID'",
    "appPrefix": "'$APP_PREFIX'",
    "schemaId": "'$SCHEMA_ID'",
    "recordIds": ["'$RECORD_ID'"]
  }' | jq '.'
```

---

### 16. Delete Single Record
```bash
curl -X DELETE $BASE_URL/data-records/delete/$RECORD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'$APP_ID'",
    "appPrefix": "'$APP_PREFIX'",
    "schemaId": "'$SCHEMA_ID'"
  }' | jq '.'
```

---

### 17. Delete Table Schema
```bash
curl -X DELETE $BASE_URL/data-schemas/$SCHEMA_ID \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'$APP_ID'",
    "appPrefix": "'$APP_PREFIX'",
    "userId": "'$USER_ID'",
    "confirmDelete": true
  }' | jq '.'
```

---

## 🎯 Quick Test Sequence

Run these in order for a complete test:

```bash
# 1. Setup
export BASE_URL="http://localhost:5000/api"
export APP_ID="sample"
export APP_PREFIX="sample"
export USER_ID="zCfe1a96aLQON7KF9smnemHiJKu1"

# 2. Create schema (copy SCHEMA_ID from response)
curl -X POST $BASE_URL/data-schemas/create -H "Content-Type: application/json" -d '{"appId":"'$APP_ID'","appPrefix":"'$APP_PREFIX'","displayName":"Products","userId":"'$USER_ID'","fields":[{"name":"productName","type":"text","required":true,"options":[]},{"name":"price","type":"currency","required":true,"options":[]},{"name":"category","type":"select","required":true,"options":["Electronics","Clothing","Food"]},{"name":"inStock","type":"boolean","required":true,"options":[]}]}' | jq '.'

export SCHEMA_ID="PASTE_SCHEMA_ID_HERE"

# 3. Create record (copy RECORD_ID from response)
curl -X POST $BASE_URL/data-records/create -H "Content-Type: application/json" -d '{"appId":"'$APP_ID'","appPrefix":"'$APP_PREFIX'","schemaId":"'$SCHEMA_ID'","userId":"'$USER_ID'","data":{"productName":"Laptop","price":1299.99,"category":"Electronics","inStock":true}}' | jq '.'

export RECORD_ID="PASTE_RECORD_ID_HERE"

# 4. List records
curl "$BASE_URL/data-records/list?appId=$APP_ID&appPrefix=$APP_PREFIX&schemaId=$SCHEMA_ID&page=1&pageSize=20" | jq '.'

# 5. Export CSV
curl "$BASE_URL/data-records/export-csv?appId=$APP_ID&appPrefix=$APP_PREFIX&schemaId=$SCHEMA_ID" -o test_export.csv && cat test_export.csv
```

---

## 🐛 Troubleshooting

### If you get "SCHEMA_NOT_FOUND"
Make sure `$SCHEMA_ID` is set correctly:
```bash
echo $SCHEMA_ID
```

### If you get connection errors
Check if server is running:
```bash
curl http://localhost:5000/health
```

### View server logs
The server logs will show in the terminal where you ran `npm run dev`

---

## 📖 More Information

- Full API docs: `DATA_MANAGEMENT_API.md`
- Postman collection: `Data_Management_API.postman_collection.json`
- Automated test script: `./test_api_with_curl.sh`

---

**Ready to test! 🚀**


