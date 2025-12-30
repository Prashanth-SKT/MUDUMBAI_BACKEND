# Process API Update Summary

## Date: December 30, 2025

## Overview
The Process API has been updated to accept a new, more complex JSON structure that supports multi-step workflows with validation, routing, actions, and conditional logic.

---

## Changes Made

### 1. Controller Updates (`src/controllers/processController.js`)

#### Create Process (`createProcess`)
- ✅ **Removed** validation for `type` field (no longer required)
- ✅ **Added** validation for `steps` array (required)
- ✅ **Updated** ID generation: `PROCESS_{timestamp}` format (was `proc_{timestamp}`)
- ✅ **Changed** version from semantic string ("1.0.0") to numeric (1)
- ✅ **Added** support for new fields:
  - `steps[]` - Array of process steps
  - `finalActions[]` - Actions to execute at process end
  - `status` - Process status (draft/active/inactive)
  - `description` - Process description

#### Update Process (`updateProcess`)
- ✅ **Changed** version increment from semantic ("1.0.1") to numeric (2, 3, ...)
- ✅ **Updated** to handle new structure fields
- ✅ **Improved** handling of existing data during updates

#### Other Changes
- ✅ **Removed** `incrementVersion()` helper function (no longer needed)
- ✅ **Maintained** backward compatibility for database operations

---

### 2. New JSON Structure

#### Root Level Fields
```json
{
  "id": null,                    // Auto-generated if null
  "name": "string",              // Required
  "description": "string",       // Optional
  "appName": "string",           // Required
  "status": "draft|active|inactive",
  "steps": [],                   // Required (array)
  "finalActions": [],            // Optional (array)
  "version": 1                   // Numeric
}
```

#### Step Structure
Each step now includes:
- **id**: Unique step identifier
- **label**: Display name
- **description**: Step description
- **order**: Numeric order
- **preValidation**: Validation before step
- **content**: Step content (form, page, component)
- **postValidation**: Validation after step

#### Validation Objects
- **validationId**: Reference to validation rule
- **validationJSON**: Full validation configuration
- **Routing**: Conditional flow control
  - `onTrue`: Action when validation passes
  - `onFalse`: Action when validation fails

#### Routing Actions
- `continue` - Move to next step
- `exit` - End process
- `jumpToStep` - Go to specific step
- `jumpToProcess` - Switch to another process

#### Pre/Post Actions
- Execute actions before or after validations
- Support for openPage, API calls, etc.

---

### 3. Postman Collection Updates

#### File: `Process_API.postman_collection.json`

**Updated Requests:**
1. **Create Process** - Now uses new structure with:
   - Steps array with preValidation/postValidation
   - Routing configurations
   - Actions array
   - Content objects

2. **Update Process** - Updated to match new structure

**Key Examples Added:**
- Weekend validation (TEMPLATE validation)
- Business rule validation (department check)
- Conditional routing (jumpToStep)
- Pre-actions (openPage)

---

### 4. New Documentation

#### File: `PROCESS_API_DOCUMENTATION.md`

Comprehensive documentation including:
- ✅ All endpoint specifications
- ✅ Complete request/response examples
- ✅ Field descriptions and validation rules
- ✅ Routing action explanations
- ✅ Validation types (VALIDATION vs BUSINESS_RULE)
- ✅ Content types (none, form, page, component)
- ✅ Error responses
- ✅ Complete working examples
- ✅ cURL command examples

---

### 5. Test Script

#### File: `test_process_api.sh`

New bash script for testing:
- ✅ Create process with auto-generated ID
- ✅ List all processes
- ✅ Get process by ID
- ✅ Update process
- ✅ Delete process
- ✅ Color-coded output
- ✅ JSON formatting with jq
- ✅ Executable permissions set

---

## API Endpoints (Unchanged)

```
POST   /api/processes/:dbName/:appName
GET    /api/processes/:dbName/:appName
GET    /api/processes/:dbName/:appName/:id
PUT    /api/processes/:dbName/:appName/:id
DELETE /api/processes/:dbName/:appName/:id
```

---

## Key Features

### 1. Auto-generated IDs
- When `id` is `null` or omitted, system generates: `PROCESS_{timestamp}`
- Example: `PROCESS_1767082778281`

### 2. Version Management
- Automatic numeric versioning (1, 2, 3, ...)
- Auto-increments on each update

### 3. Complex Validations
- **Template Validations**: Reusable validation templates
  - Weekend check
  - Business hours
  - Date range, etc.

- **Business Rules**: Custom conditional logic
  - Field comparisons
  - Collection queries
  - Logical operators (IF, AND, OR)

### 4. Conditional Routing
- Dynamic workflow paths based on validation results
- Jump to specific steps or processes
- Exit or continue options

### 5. Actions
- Pre-actions: Execute before step
- Post-actions: Execute after step
- Types: openPage, API calls, data operations

---

## Backward Compatibility

### Breaking Changes
- ⚠️ `type` field is no longer required/validated
- ⚠️ Version format changed from "1.0.0" to numeric 1
- ⚠️ ID format changed from `proc_*` to `PROCESS_*`

### Migration Notes
If you have existing processes:
1. Old processes will still work
2. Version will be converted to numeric on first update
3. Consider updating IDs for consistency

---

## Testing

### Using the Test Script
```bash
./test_process_api.sh
```

### Using Postman
1. Import `Process_API.postman_collection.json`
2. Set variables:
   - `baseUrl`: http://localhost:5000/api
   - `dbName`: jayram
   - `appName`: Rama2
3. Run the "Create Process" request
4. Process ID will be auto-saved for subsequent requests

### Using cURL
See examples in `PROCESS_API_DOCUMENTATION.md`

---

## Example Usage

### Create a Simple Process
```bash
curl -X POST http://localhost:5000/api/processes/jayram/Rama2 \
  -H "Content-Type: application/json" \
  -d '{
    "id": null,
    "name": "Simple Workflow",
    "description": "A simple workflow example",
    "appName": "Rama2",
    "status": "draft",
    "steps": [
      {
        "id": "step_001",
        "label": "Start",
        "description": "Starting step",
        "order": 1,
        "preValidation": {
          "validationId": null,
          "validationJSON": null,
          "onTrue": "continue",
          "onFalse": "exit",
          "preActions": []
        },
        "content": {
          "type": "none",
          "contentId": null,
          "contentJSON": null
        },
        "postValidation": {
          "validationId": null,
          "validationJSON": null,
          "routing": {
            "onTrue": { "action": "continue" },
            "onFalse": { "action": "exit" }
          },
          "postActions": []
        }
      }
    ],
    "finalActions": [],
    "version": 1
  }'
```

---

## Files Modified

1. ✅ `src/controllers/processController.js` - Core logic updated
2. ✅ `Process_API.postman_collection.json` - Examples updated
3. ✅ `PROCESS_API_DOCUMENTATION.md` - New comprehensive docs
4. ✅ `test_process_api.sh` - New test script
5. ✅ `PROCESS_API_UPDATE_SUMMARY.md` - This file

---

## Next Steps

### For Developers
1. Review the new structure in `PROCESS_API_DOCUMENTATION.md`
2. Update any existing code that creates/updates processes
3. Test with the provided test script
4. Update frontend to use new structure

### For Testers
1. Run `./test_process_api.sh` to verify all endpoints
2. Import Postman collection for manual testing
3. Test complex workflows with validations and routing

### For Integration
1. Update API clients to send new JSON structure
2. Ensure `id: null` for auto-generation
3. Handle numeric versions instead of semantic versions
4. Update any type field references (no longer used)

---

## Support

For questions or issues:
1. Check `PROCESS_API_DOCUMENTATION.md` for detailed examples
2. Review Postman collection for request formats
3. Run test script to verify API is working
4. Check controller logs for debugging

---

## Validation Categories

### VALIDATION (Template-based)
- Pre-built validation templates
- Reusable across processes
- Examples: WEEKEND_ONLY, BUSINESS_HOURS

### BUSINESS_RULE
- Custom conditional logic
- Field-based conditions
- Collection queries
- Logical operators

---

## Status Values
- **draft**: Process in development (default)
- **active**: Process is live and executable
- **inactive**: Process is disabled

---

## Content Types
- **none**: No content, navigation only
- **form**: Display a form
- **page**: Display a page
- **component**: Display a component

---

## Summary

The Process API now supports:
- ✅ Complex multi-step workflows
- ✅ Pre and post validations
- ✅ Conditional routing
- ✅ Actions (pre/post)
- ✅ Template validations
- ✅ Business rules
- ✅ Auto-generated IDs
- ✅ Numeric versioning
- ✅ Rich step content

All changes are backward compatible at the storage level, but the API now expects the new structure for new processes.

