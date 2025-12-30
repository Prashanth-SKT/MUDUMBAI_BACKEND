# Process API Documentation

## Overview
The Process API allows you to create, read, update, and delete business processes with complex step-based workflows, including validations, actions, and conditional routing.

## Base URL
```
http://localhost:5000/api/processes
```

## Endpoints

### 1. Create Process
**POST** `/api/processes/:dbName/:appName`

Creates a new process with auto-generated ID if not provided.

#### Request Body Structure
```json
{
  "id": null,  // Auto-generated if null or omitted (format: PROCESS_{timestamp})
  "name": "Onboarding",
  "description": "Employee onboarding process",
  "appName": "Rama2",
  "status": "draft",  // draft | active | inactive
  "steps": [
    {
      "id": "step_1767082778281",
      "label": "Capture",
      "description": "Capture the information",
      "order": 1,
      "preValidation": {
        "validationId": null,
        "validationJSON": null,
        "onTrue": "continue",  // continue | exit | jumpToStep | jumpToProcess
        "onTrueTargetStepId": null,
        "onTrueTargetStepLabel": null,
        "onTrueTargetProcessId": null,
        "onFalse": "exit",
        "onFalseTargetStepId": null,
        "onFalseTargetStepLabel": null,
        "onFalseTargetProcessId": null,
        "preActions": []
      },
      "content": {
        "type": "none",  // none | form | page | component
        "contentId": null,
        "contentJSON": null
      },
      "postValidation": {
        "validationId": null,
        "validationJSON": null,
        "routing": {
          "onTrue": {
            "action": "continue",
            "targetStepId": null,
            "targetStepLabel": null,
            "targetProcessId": null
          },
          "onFalse": {
            "action": "exit",
            "targetStepId": null,
            "targetStepLabel": null,
            "targetProcessId": null
          }
        },
        "postActions": []
      }
    }
  ],
  "finalActions": [],
  "version": 1
}
```

#### Key Features

##### ID Auto-generation
- If `id` is `null` or omitted, a unique ID will be generated: `PROCESS_{timestamp}`
- Example: `PROCESS_1767082778281`

##### Step Structure
Each step contains:
- **id**: Unique identifier for the step
- **label**: Display name
- **description**: Step description
- **order**: Numeric order in the process flow
- **preValidation**: Validation to run before step execution
- **content**: The actual content/form/page to display
- **postValidation**: Validation to run after step execution

##### Validation Objects
Validation can reference:
1. **Template Validations** (e.g., weekend check, business hours)
   ```json
   {
     "validationId": "TEMPLATE_1767035858335",
     "validationJSON": {
       "id": "TEMPLATE_1767035858335",
       "ruleCategory": "VALIDATION",
       "validationType": "WEEKEND_ONLY",
       "errorMessage": "Not a weekend",
       "name": "onlyifWeekend"
     }
   }
   ```

2. **Business Rules** (e.g., department/role checks)
   ```json
   {
     "validationId": "RULE_1767036145538",
     "validationJSON": {
       "id": "RULE_1767036145538",
       "ruleCategory": "BUSINESS_RULE",
       "errorMessage": "Not eligible or Authorized",
       "name": "BRule1",
       "conditions": [
         {
           "operator": "CONTAINS",
           "value": "Operations",
           "logicalOperator": "IF",
           "field": "department",
           "collection": "emp"
         }
       ]
     }
   }
   ```

##### Routing Actions
- **continue**: Proceed to next step
- **exit**: End process
- **jumpToStep**: Go to specific step by ID or label
- **jumpToProcess**: Switch to another process

##### Actions
Actions can be attached to preValidation or postValidation:
```json
{
  "preActions": [
    {
      "id": "opencontact_1767035530447",
      "actionType": "openPage",
      "name": "OpenContact",
      "actionConfig": {
        "navigationType": "internal",
        "pageName": "contact"
      },
      "elementConfig": {
        "label": "Contact",
        "bgColor": "#3B82F6",
        "textColor": "#FFFFFF"
      }
    }
  ]
}
```

#### Example Request
```bash
curl -X POST http://localhost:5000/api/processes/jayram/Rama2 \
  -H "Content-Type: application/json" \
  -d '{
    "id": null,
    "name": "Onboarding",
    "description": "Employee onboarding workflow",
    "appName": "Rama2",
    "status": "draft",
    "steps": [
      {
        "id": "step_001",
        "label": "Capture",
        "description": "Capture employee info",
        "order": 1,
        "preValidation": {
          "validationId": null,
          "validationJSON": null,
          "onTrue": "continue",
          "onFalse": "exit",
          "preActions": []
        },
        "content": {
          "type": "form",
          "contentId": "employee_form",
          "contentJSON": null
        },
        "postValidation": {
          "validationId": null,
          "validationJSON": null,
          "routing": {
            "onTrue": {
              "action": "continue",
              "targetStepId": null,
              "targetStepLabel": null,
              "targetProcessId": null
            },
            "onFalse": {
              "action": "exit",
              "targetStepId": null,
              "targetStepLabel": null,
              "targetProcessId": null
            }
          },
          "postActions": []
        }
      }
    ],
    "finalActions": [],
    "version": 1
  }'
```

#### Response (201 Created)
```json
{
  "id": "PROCESS_1767082778281",
  "name": "Onboarding",
  "description": "Employee onboarding workflow",
  "appName": "Rama2",
  "status": "draft",
  "steps": [...],
  "finalActions": [],
  "version": 1,
  "createdAt": "2025-12-30T10:32:58.281Z",
  "updatedAt": "2025-12-30T10:32:58.281Z",
  "appPrefix": "rama2"
}
```

---

### 2. Get All Processes
**GET** `/api/processes/:dbName/:appName`

Retrieve all processes for a specific app.

#### Example Request
```bash
curl http://localhost:5000/api/processes/jayram/Rama2
```

#### Response (200 OK)
```json
[
  {
    "id": "PROCESS_1767082778281",
    "name": "Onboarding",
    "appName": "Rama2",
    "status": "draft",
    "steps": [...],
    "version": 1,
    "createdAt": "2025-12-30T10:32:58.281Z",
    "updatedAt": "2025-12-30T10:32:58.281Z"
  }
]
```

---

### 3. Get Process by ID
**GET** `/api/processes/:dbName/:appName/:id`

Retrieve a specific process by ID.

#### Example Request
```bash
curl http://localhost:5000/api/processes/jayram/Rama2/PROCESS_1767082778281
```

#### Response (200 OK)
```json
{
  "id": "PROCESS_1767082778281",
  "name": "Onboarding",
  "description": "Employee onboarding workflow",
  "appName": "Rama2",
  "status": "draft",
  "steps": [...],
  "finalActions": [],
  "version": 1,
  "createdAt": "2025-12-30T10:32:58.281Z",
  "updatedAt": "2025-12-30T10:32:58.281Z"
}
```

---

### 4. Update Process
**PUT** `/api/processes/:dbName/:appName/:id`

Update an existing process. Version is automatically incremented.

#### Request Body
```json
{
  "name": "Onboarding Updated",
  "description": "Updated description",
  "status": "active",
  "steps": [...],
  "finalActions": []
}
```

#### Example Request
```bash
curl -X PUT http://localhost:5000/api/processes/jayram/Rama2/PROCESS_1767082778281 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Onboarding Updated",
    "status": "active",
    "steps": [...]
  }'
```

#### Response (200 OK)
```json
{
  "id": "PROCESS_1767082778281",
  "name": "Onboarding Updated",
  "status": "active",
  "steps": [...],
  "version": 2,
  "updatedAt": "2025-12-30T11:00:00.000Z"
}
```

---

### 5. Delete Process
**DELETE** `/api/processes/:dbName/:appName/:id`

Delete a process permanently.

#### Example Request
```bash
curl -X DELETE http://localhost:5000/api/processes/jayram/Rama2/PROCESS_1767082778281
```

#### Response (200 OK)
```json
{
  "message": "Process deleted successfully",
  "id": "PROCESS_1767082778281"
}
```

---

## Data Storage

### Collection Naming
Processes are stored in Firestore collections named: `{appPrefix}_processes`

Examples:
- App: "Rama2" → Collection: `rama2_processes`
- App: "My App" → Collection: `myapp_processes`

### Database
Default database: `jayram` (can be specified in URL)

---

## Status Values
- **draft**: Process is being designed (default)
- **active**: Process is live and executable
- **inactive**: Process is disabled

---

## Content Types
- **none**: No content (just navigation)
- **form**: Display a form
- **page**: Display a page
- **component**: Display a specific component

---

## Routing Actions
- **continue**: Move to next step in sequence
- **exit**: End process execution
- **jumpToStep**: Go to specific step using ID or label
- **jumpToProcess**: Switch to different process

---

## Validation Categories
- **VALIDATION**: Template-based validations (weekend check, business hours, etc.)
- **BUSINESS_RULE**: Custom business rules with conditions

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Process name is required"
}
```

### 404 Not Found
```json
{
  "error": "Process not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create process"
}
```

---

## Complete Example

Here's a complete process with multiple steps, validations, and routing:

```json
{
  "id": null,
  "name": "Onboarding",
  "description": "",
  "appName": "Rama2",
  "status": "draft",
  "steps": [
    {
      "id": "step_1767082778281",
      "label": "Capture",
      "description": "Capture the information",
      "order": 1,
      "preValidation": {
        "validationId": null,
        "validationJSON": null,
        "onTrue": "continue",
        "onTrueTargetStepId": null,
        "onTrueTargetStepLabel": null,
        "onTrueTargetProcessId": null,
        "onFalse": "exit",
        "onFalseTargetStepId": null,
        "onFalseTargetStepLabel": null,
        "onFalseTargetProcessId": null,
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
          "onTrue": {
            "action": "continue",
            "targetStepId": null,
            "targetStepLabel": null,
            "targetProcessId": null
          },
          "onFalse": {
            "action": "exit",
            "targetStepId": null,
            "targetStepLabel": null,
            "targetProcessId": null
          }
        },
        "postActions": []
      }
    },
    {
      "id": "step_1767083298943",
      "label": "Review",
      "description": "Review",
      "order": 2,
      "preValidation": {
        "validationId": null,
        "validationJSON": null,
        "onTrue": "continue",
        "onTrueTargetStepId": null,
        "onTrueTargetStepLabel": null,
        "onTrueTargetProcessId": null,
        "onFalse": "exit",
        "onFalseTargetStepId": null,
        "onFalseTargetStepLabel": null,
        "onFalseTargetProcessId": null,
        "preActions": []
      },
      "content": {
        "type": "none",
        "contentId": null,
        "contentJSON": null
      },
      "postValidation": {
        "validationId": "TEMPLATE_1767035858335",
        "validationJSON": {
          "id": "TEMPLATE_1767035858335",
          "ruleCategory": "VALIDATION",
          "appName": "rama2",
          "validationType": "WEEKEND_ONLY",
          "errorMessage": "Not a weekend",
          "description": "Template validation: Weekend Only (Sat-Sun)",
          "type": "template",
          "version": "1.0.0",
          "name": "onlyifWeekend",
          "status": "ACTIVE"
        },
        "routing": {
          "onTrue": {
            "action": "jumpToStep",
            "targetStepId": null,
            "targetStepLabel": "Approve",
            "targetProcessId": null
          },
          "onFalse": {
            "action": "jumpToStep",
            "targetStepId": null,
            "targetStepLabel": "Reject",
            "targetProcessId": null
          }
        },
        "postActions": []
      }
    },
    {
      "id": "step_1767083411002",
      "label": "Approve",
      "description": "Approved",
      "order": 3,
      "preValidation": {
        "validationId": "RULE_1767036145538",
        "validationJSON": {
          "id": "RULE_1767036145538",
          "ruleCategory": "BUSINESS_RULE",
          "appName": "rama2",
          "errorMessage": "Not eligible or Authorized",
          "description": "",
          "type": "business_rule",
          "version": "1.0.0",
          "name": "BRule1",
          "conditions": [
            {
              "operator": "CONTAINS",
              "value": "Operations",
              "logicalOperator": "IF",
              "id": 1,
              "field": "department",
              "collection": "emp"
            }
          ],
          "status": "ACTIVE"
        },
        "onTrue": "continue",
        "onTrueTargetStepId": null,
        "onTrueTargetStepLabel": null,
        "onTrueTargetProcessId": null,
        "onFalse": "exit",
        "onFalseTargetStepId": null,
        "onFalseTargetStepLabel": null,
        "onFalseTargetProcessId": null,
        "preActions": [
          {
            "id": "opencontact_1767035530447",
            "actionType": "openPage",
            "name": "OpenContact",
            "actionConfig": {
              "navigationType": "internal",
              "pageName": "contact"
            },
            "elementConfig": {
              "label": "Contact",
              "bgColor": "#3B82F6",
              "textColor": "#FFFFFF"
            }
          }
        ]
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
          "onTrue": {
            "action": "continue",
            "targetStepId": null,
            "targetStepLabel": null,
            "targetProcessId": null
          },
          "onFalse": {
            "action": "exit",
            "targetStepId": null,
            "targetStepLabel": null,
            "targetProcessId": null
          }
        },
        "postActions": []
      }
    },
    {
      "id": "step_1767083460689",
      "label": "Reject",
      "description": "Rejected",
      "order": 4,
      "preValidation": {
        "validationId": null,
        "validationJSON": null,
        "onTrue": "continue",
        "onTrueTargetStepId": null,
        "onTrueTargetStepLabel": null,
        "onTrueTargetProcessId": null,
        "onFalse": "exit",
        "onFalseTargetStepId": null,
        "onFalseTargetStepLabel": null,
        "onFalseTargetProcessId": null,
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
          "onTrue": {
            "action": "continue",
            "targetStepId": null,
            "targetStepLabel": null,
            "targetProcessId": null
          },
          "onFalse": {
            "action": "exit",
            "targetStepId": null,
            "targetStepLabel": null,
            "targetProcessId": null
          }
        },
        "postActions": []
      }
    }
  ],
  "finalActions": [],
  "version": 1
}
```

---

## Notes

1. **ID Generation**: When creating a process, set `id: null` to auto-generate an ID
2. **Version Management**: Version is automatically incremented on updates
3. **App Name Normalization**: App names are normalized (e.g., "Rama2" → "rama2") for collection names
4. **Timestamps**: `createdAt` and `updatedAt` are automatically managed
5. **Step Ordering**: Use the `order` field to control step sequence
6. **Conditional Routing**: Use validations and routing to create dynamic workflows
7. **Action Integration**: Attach actions to execute before/after validations

---

## Testing with Postman

Import the `Process_API.postman_collection.json` file to test all endpoints with pre-configured examples.

## Testing with cURL

See example cURL commands above or refer to `test_process_api.sh` for batch testing.

