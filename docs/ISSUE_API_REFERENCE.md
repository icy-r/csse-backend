# Issue Management API Reference

## Base URL
```
http://localhost:5000/api
```

---

## Endpoints

### 1. Create Issue
Report a new issue.

**Endpoint:** `POST /api/issues`

**Request Body:**
```json
{
  "crewId": "string (required)",
  "routeId": "string (optional)",
  "issueType": "blocked-access | bin-damaged | bin-overflow | safety-hazard | vehicle-issue | other (required)",
  "description": "string (required, max 1000 chars)",
  "location": "string (optional, max 200 chars)",
  "stopIndex": "number (optional)",
  "priority": "low | medium | high | critical (optional, auto-assigned if not provided)"
}
```

**Example:**
```json
{
  "crewId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "routeId": "60f7b3b3b3b3b3b3b3b3b3b4",
  "issueType": "bin-damaged",
  "description": "Bin lid is broken and cannot close properly",
  "location": "123 Main Street",
  "stopIndex": 2
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Issue reported successfully",
  "data": {
    "_id": "...",
    "issueId": "ISS-000001",
    "crewId": { "name": "John Doe", "email": "...", "phone": "..." },
    "routeId": { "routeName": "Route A", "scheduledDate": "..." },
    "issueType": "bin-damaged",
    "description": "Bin lid is broken and cannot close properly",
    "location": "123 Main Street",
    "stopIndex": 2,
    "status": "reported",
    "priority": "medium",
    "reportedAt": "2025-10-18T10:30:00.000Z"
  }
}
```

---

### 2. Get All Issues
Retrieve issues with optional filtering and pagination.

**Endpoint:** `GET /api/issues`

**Query Parameters:**
- `crewId` (string, optional) - Filter by crew member
- `status` (string, optional) - Filter by status
- `issueType` (string, optional) - Filter by type
- `priority` (string, optional) - Filter by priority
- `routeId` (string, optional) - Filter by route
- `page` (number, optional, default: 1) - Page number
- `limit` (number, optional, default: 20) - Items per page
- `sort` (string, optional, default: "reportedAt:desc") - Sort field and order

**Example:**
```
GET /api/issues?status=reported&priority=critical&page=1&limit=10
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Issues retrieved successfully",
  "data": [
    {
      "_id": "...",
      "issueId": "ISS-000001",
      "crewId": { "name": "John Doe", ... },
      "status": "reported",
      "priority": "critical",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null
  }
}
```

---

### 3. Get Issue Statistics
Get aggregated statistics about issues.

**Endpoint:** `GET /api/issues/stats`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Issue statistics retrieved successfully",
  "data": {
    "total": 150,
    "byStatus": {
      "reported": 25,
      "inProgress": 10,
      "resolved": 115
    },
    "byPriority": {
      "critical": 5,
      "high": 15
    },
    "byType": {
      "bin-damaged": 30,
      "blocked-access": 20,
      "vehicle-issue": 15,
      "bin-overflow": 40,
      "safety-hazard": 10,
      "other": 35
    }
  }
}
```

---

### 4. Get Issue By ID
Retrieve detailed information about a specific issue.

**Endpoint:** `GET /api/issues/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Issue retrieved successfully",
  "data": {
    "_id": "...",
    "issueId": "ISS-000001",
    "crewId": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "routeId": {
      "routeName": "Route A",
      "scheduledDate": "2025-10-18",
      "status": "in-progress",
      "stops": [...]
    },
    "issueType": "bin-damaged",
    "description": "Bin lid is broken and cannot close properly",
    "location": "123 Main Street",
    "stopIndex": 2,
    "status": "reported",
    "priority": "medium",
    "reportedAt": "2025-10-18T10:30:00.000Z",
    "acknowledgedAt": null,
    "resolvedAt": null,
    "resolvedBy": null,
    "resolution": null,
    "comments": [
      {
        "userId": { "name": "Coordinator", "role": "coordinator" },
        "comment": "Scheduling repair",
        "createdAt": "2025-10-18T11:00:00.000Z"
      }
    ]
  }
}
```

---

### 5. Update Issue Status
Update the status of an issue.

**Endpoint:** `PUT /api/issues/:id/status`

**Request Body:**
```json
{
  "status": "reported | acknowledged | in-progress | resolved | closed (required)",
  "resolvedBy": "string (required if status is 'resolved')",
  "resolution": "string (required if status is 'resolved', max 500 chars)"
}
```

**Example (Resolving an issue):**
```json
{
  "status": "resolved",
  "resolvedBy": "60f7b3b3b3b3b3b3b3b3b3b5",
  "resolution": "Bin was replaced with a new unit. Old bin sent for repair."
}
```

**Example (Acknowledging an issue):**
```json
{
  "status": "acknowledged"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Issue status updated successfully",
  "data": {
    "_id": "...",
    "issueId": "ISS-000001",
    "status": "resolved",
    "resolvedAt": "2025-10-18T14:30:00.000Z",
    "resolvedBy": { "name": "Coordinator", "email": "..." },
    "resolution": "Bin was replaced with a new unit. Old bin sent for repair.",
    ...
  }
}
```

---

### 6. Update Issue Priority
Update the priority level of an issue.

**Endpoint:** `PUT /api/issues/:id/priority`

**Request Body:**
```json
{
  "priority": "low | medium | high | critical (required)"
}
```

**Example:**
```json
{
  "priority": "critical"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Issue priority updated successfully",
  "data": {
    "_id": "...",
    "issueId": "ISS-000001",
    "priority": "critical",
    ...
  }
}
```

---

### 7. Add Comment to Issue
Add a comment or note to an issue.

**Endpoint:** `POST /api/issues/:id/comments`

**Request Body:**
```json
{
  "userId": "string (required)",
  "comment": "string (required, max 500 chars)"
}
```

**Example:**
```json
{
  "userId": "60f7b3b3b3b3b3b3b3b3b3b5",
  "comment": "Contacted maintenance team. They will arrive within 2 hours."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "_id": "...",
    "issueId": "ISS-000001",
    "comments": [
      {
        "userId": { "name": "Coordinator", "role": "coordinator" },
        "comment": "Contacted maintenance team. They will arrive within 2 hours.",
        "createdAt": "2025-10-18T12:00:00.000Z"
      }
    ],
    ...
  }
}
```

---

## Issue Types

- `blocked-access` - Access to bin is blocked (construction, vehicles, etc.)
- `bin-damaged` - Bin is damaged and needs repair/replacement
- `bin-overflow` - Bin is overflowing
- `safety-hazard` - Safety concern that needs immediate attention
- `vehicle-issue` - Problem with collection vehicle
- `other` - Other types of issues

---

## Priority Levels

- `low` - Minor issues that can be addressed in routine maintenance
- `medium` - Standard issues requiring attention
- `high` - Important issues requiring prompt attention
- `critical` - Urgent issues requiring immediate action (auto-assigned for safety-hazard type)

---

## Status Flow

```
reported → acknowledged → in-progress → resolved → closed
```

- **reported**: Initial state when issue is created
- **acknowledged**: Coordinator has seen and acknowledged the issue
- **in-progress**: Work is being done to resolve the issue
- **resolved**: Issue has been fixed (requires resolution description)
- **closed**: Issue is archived/closed

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Crew ID, issue type, and description are required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Issue not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Usage Tips

1. **Auto-Priority Assignment**: If you don't specify priority, it will be auto-assigned:
   - `safety-hazard` → `critical`
   - `vehicle-issue` → `high`
   - Others → `medium`

2. **Filtering Multiple Values**: You can combine filters:
   ```
   GET /api/issues?status=reported&priority=high&issueType=bin-damaged
   ```

3. **Sorting**: Use the format `field:order`:
   ```
   GET /api/issues?sort=priority:desc
   GET /api/issues?sort=reportedAt:asc
   ```

4. **Pagination**: Use page and limit parameters:
   ```
   GET /api/issues?page=2&limit=20
   ```

5. **Resolution Required**: When marking an issue as `resolved`, you MUST provide `resolvedBy` and `resolution`.

6. **Comment Length**: Comments are limited to 500 characters. For longer notes, add multiple comments.

---

## Integration Examples

### JavaScript/React Native
```javascript
import { coordinatorApi } from './api';

// Get all critical issues
const response = await coordinatorApi.getIssues({
  priority: 'critical',
  status: 'reported'
});

// Resolve an issue
await coordinatorApi.updateIssueStatus(issueId, {
  status: 'resolved',
  resolvedBy: userId,
  resolution: 'Issue has been fixed'
});
```

### cURL
```bash
# Create issue
curl -X POST http://localhost:5000/api/issues \
  -H "Content-Type: application/json" \
  -d '{
    "crewId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "issueType": "bin-damaged",
    "description": "Bin lid broken"
  }'

# Get issues
curl http://localhost:5000/api/issues?status=reported&priority=critical

# Update status
curl -X PUT http://localhost:5000/api/issues/60f7b3b3b3b3b3b3b3b3b3b6/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "resolvedBy": "60f7b3b3b3b3b3b3b3b3b3b5",
    "resolution": "Fixed"
  }'
```

---

## Swagger Documentation

Full interactive API documentation is available at:
```
http://localhost:5000/api-docs
```

Search for "Issues" tag to see all issue-related endpoints with interactive testing capabilities.

