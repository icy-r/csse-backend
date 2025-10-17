# Smart Bin API Endpoints - Usage Examples

Complete reference guide for smart bin management endpoints.

---

## Base URL

```
http://localhost:5000/api/bins
```

---

## Who Can Create Bins?

**Recommended Access Control:**
- **Admin** - Full CRUD access (Create, Read, Update, Delete)
- **Coordinator** - Read, Update fill levels, Empty bins, Set maintenance
- **Technician** - Read, Update fill levels, Set maintenance
- **Citizen** - Read nearby bins only (different endpoint)

> **Note:** This implementation does not enforce authentication. Access control should be implemented based on your requirements.

---

## Endpoints Overview

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/bins` | Get all bins with filtering | All |
| GET | `/api/bins/:id` | Get bin by ID | All |
| POST | `/api/bins` | Create new bin | Admin |
| PUT | `/api/bins/:id` | Update bin | Admin/Coordinator |
| PUT | `/api/bins/:id/fill-level` | Update fill level | Admin/Coordinator |
| PUT | `/api/bins/:id/empty` | Empty bin | Admin/Coordinator |
| PUT | `/api/bins/:id/maintenance` | Set maintenance status | Admin/Coordinator/Technician |
| DELETE | `/api/bins/:id` | Delete bin | Admin |

---

## 1. GET All Bins

Retrieve all bins with optional filtering and pagination.

### Endpoint
```
GET /api/bins
```

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `status` | string | Filter by status | `active`, `offline`, `maintenance`, `full` |
| `binType` | string | Filter by type | `household`, `recyclable`, `organic`, `general` |
| `fillLevel` | number | Filter by fill level | `70` (use with operators) |
| `location.area` | string | Filter by area | `Colombo 05` |
| `page` | integer | Page number | `1` (default) |
| `limit` | integer | Items per page | `10` (default) |

### Example Request

```bash
curl -X GET "http://localhost:5000/api/bins?status=active&binType=recyclable&page=1&limit=20"
```

### Example Response

```json
{
  "success": true,
  "message": "Bins retrieved successfully",
  "data": [
    {
      "_id": "6543210abc123def456789",
      "binId": "BIN-001",
      "location": {
        "address": "123 Main Street",
        "area": "Colombo 05",
        "coordinates": {
          "lat": 6.9271,
          "lng": 79.8612
        }
      },
      "fillLevel": 75,
      "capacity": 240,
      "binType": "recyclable",
      "status": "active",
      "deviceId": {
        "_id": "device123",
        "deviceId": "DEV-001",
        "status": "online",
        "batteryLevel": 85
      },
      "lastEmptied": "2024-10-15T08:00:00.000Z",
      "lastUpdated": "2024-10-17T10:30:00.000Z",
      "collectionCount": 45,
      "fillStatusColor": "yellow",
      "fillStatusLabel": "Filling",
      "needsCollection": true,
      "isUrgent": false,
      "createdAt": "2024-01-15T00:00:00.000Z",
      "updatedAt": "2024-10-17T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 50,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 2. GET Bin by ID

Retrieve a single bin by its ID.

### Endpoint
```
GET /api/bins/:id
```

### Example Request

```bash
curl -X GET "http://localhost:5000/api/bins/6543210abc123def456789"
```

### Example Response

```json
{
  "success": true,
  "message": "Bin retrieved successfully",
  "data": {
    "_id": "6543210abc123def456789",
    "binId": "BIN-001",
    "location": {
      "address": "123 Main Street",
      "area": "Colombo 05",
      "coordinates": {
        "lat": 6.9271,
        "lng": 79.8612
      }
    },
    "fillLevel": 75,
    "capacity": 240,
    "binType": "recyclable",
    "status": "active",
    "deviceId": {
      "_id": "device123",
      "deviceId": "DEV-001",
      "status": "online",
      "batteryLevel": 85,
      "lastPing": "2024-10-17T10:25:00.000Z"
    },
    "lastEmptied": "2024-10-15T08:00:00.000Z",
    "lastUpdated": "2024-10-17T10:30:00.000Z",
    "collectionCount": 45,
    "fillStatusColor": "yellow",
    "fillStatusLabel": "Filling",
    "needsCollection": true,
    "isUrgent": false
  }
}
```

---

## 3. POST Create Bin

Create a new smart bin (Admin only).

### Endpoint
```
POST /api/bins
```

### Required Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `binId` | string | Unique bin identifier | Required, unique |
| `location.coordinates.lat` | number | Latitude | Required |
| `location.coordinates.lng` | number | Longitude | Required |

### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `location.address` | string | Street address | - |
| `location.area` | string | Area/district | - |
| `capacity` | number | Capacity in liters | `240` |
| `binType` | string | Type of bin | `general` |
| `status` | string | Bin status | `active` |
| `fillLevel` | number | Current fill level (0-100) | `0` |
| `deviceId` | string | Associated device ID | `null` |

### Example Request

```bash
curl -X POST "http://localhost:5000/api/bins" \
  -H "Content-Type: application/json" \
  -d '{
    "binId": "BIN-042",
    "location": {
      "address": "456 Park Avenue",
      "area": "Kandy",
      "coordinates": {
        "lat": 7.2906,
        "lng": 80.6337
      }
    },
    "capacity": 240,
    "binType": "household",
    "status": "active",
    "fillLevel": 0
  }'
```

### Example Response (Success)

```json
{
  "success": true,
  "message": "Bin created successfully",
  "data": {
    "_id": "6543210abc123def456790",
    "binId": "BIN-042",
    "location": {
      "address": "456 Park Avenue",
      "area": "Kandy",
      "coordinates": {
        "lat": 7.2906,
        "lng": 80.6337
      }
    },
    "fillLevel": 0,
    "capacity": 240,
    "binType": "household",
    "status": "active",
    "deviceId": null,
    "collectionCount": 0,
    "lastUpdated": "2024-10-17T11:00:00.000Z",
    "fillStatusColor": "green",
    "fillStatusLabel": "Available",
    "needsCollection": false,
    "isUrgent": false,
    "createdAt": "2024-10-17T11:00:00.000Z",
    "updatedAt": "2024-10-17T11:00:00.000Z"
  }
}
```

### Example Response (Duplicate Bin ID)

```json
{
  "success": false,
  "message": "Bin ID already exists"
}
```

---

## 4. PUT Update Bin

Update bin information.

### Endpoint
```
PUT /api/bins/:id
```

### Updatable Fields

| Field | Type | Description |
|-------|------|-------------|
| `location` | object | Location details |
| `capacity` | number | Capacity in liters |
| `binType` | string | Type of bin |
| `status` | string | Bin status |
| `fillLevel` | number | Fill level (0-100) |
| `deviceId` | string | Associated device ID |

### Protected Fields

- **binId** - Cannot be updated (immutable after creation)

### Example Request

```bash
curl -X PUT "http://localhost:5000/api/bins/6543210abc123def456789" \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "address": "123 Main Street (Updated)",
      "area": "Colombo 05",
      "coordinates": {
        "lat": 6.9271,
        "lng": 79.8612
      }
    },
    "capacity": 300,
    "status": "active"
  }'
```

### Example Response (Success)

```json
{
  "success": true,
  "message": "Bin updated successfully",
  "data": {
    "_id": "6543210abc123def456789",
    "binId": "BIN-001",
    "location": {
      "address": "123 Main Street (Updated)",
      "area": "Colombo 05",
      "coordinates": {
        "lat": 6.9271,
        "lng": 79.8612
      }
    },
    "capacity": 300,
    "status": "active",
    "fillLevel": 75,
    "lastUpdated": "2024-10-17T11:15:00.000Z"
  }
}
```

---

## 5. PUT Update Fill Level

Update the fill level of a bin. The status is automatically updated if fill level reaches 90% or more.

### Endpoint
```
PUT /api/bins/:id/fill-level
```

### Required Body

```json
{
  "fillLevel": 85
}
```

### Example Request

```bash
curl -X PUT "http://localhost:5000/api/bins/6543210abc123def456789/fill-level" \
  -H "Content-Type: application/json" \
  -d '{
    "fillLevel": 85
  }'
```

### Example Response

```json
{
  "success": true,
  "message": "Fill level updated successfully",
  "data": {
    "_id": "6543210abc123def456789",
    "binId": "BIN-001",
    "fillLevel": 85,
    "status": "active",
    "lastUpdated": "2024-10-17T11:20:00.000Z",
    "fillStatusColor": "yellow",
    "fillStatusLabel": "Filling",
    "needsCollection": true,
    "isUrgent": false
  }
}
```

### Automatic Status Updates

- `fillLevel >= 90%` → status changes to `full`
- `fillLevel < 90%` → status returns to `active` (if it was `full`)

---

## 6. PUT Empty Bin

Empty a bin (sets fill level to 0, updates collection count, and records lastEmptied timestamp).

### Endpoint
```
PUT /api/bins/:id/empty
```

### Example Request

```bash
curl -X PUT "http://localhost:5000/api/bins/6543210abc123def456789/empty"
```

### Example Response

```json
{
  "success": true,
  "message": "Bin emptied successfully",
  "data": {
    "_id": "6543210abc123def456789",
    "binId": "BIN-001",
    "fillLevel": 0,
    "status": "active",
    "lastEmptied": "2024-10-17T11:30:00.000Z",
    "lastUpdated": "2024-10-17T11:30:00.000Z",
    "collectionCount": 46,
    "fillStatusColor": "green",
    "fillStatusLabel": "Available",
    "needsCollection": false,
    "isUrgent": false
  }
}
```

---

## 7. PUT Set Maintenance Status

Set a bin to maintenance mode or return it to active status.

### Endpoint
```
PUT /api/bins/:id/maintenance
```

### Required Body

```json
{
  "isMaintenance": true
}
```

### Example Request (Enable Maintenance)

```bash
curl -X PUT "http://localhost:5000/api/bins/6543210abc123def456789/maintenance" \
  -H "Content-Type: application/json" \
  -d '{
    "isMaintenance": true
  }'
```

### Example Response

```json
{
  "success": true,
  "message": "Bin set to maintenance mode",
  "data": {
    "_id": "6543210abc123def456789",
    "binId": "BIN-001",
    "status": "maintenance",
    "fillLevel": 45,
    "lastUpdated": "2024-10-17T11:35:00.000Z"
  }
}
```

### Example Request (Disable Maintenance)

```bash
curl -X PUT "http://localhost:5000/api/bins/6543210abc123def456789/maintenance" \
  -H "Content-Type: application/json" \
  -d '{
    "isMaintenance": false
  }'
```

---

## 8. DELETE Bin

Delete a bin permanently (Admin only).

### Endpoint
```
DELETE /api/bins/:id
```

### Example Request

```bash
curl -X DELETE "http://localhost:5000/api/bins/6543210abc123def456789"
```

### Example Response (Success)

```json
{
  "success": true,
  "message": "Bin deleted successfully",
  "data": {
    "id": "6543210abc123def456789",
    "binId": "BIN-001"
  }
}
```

---

## Error Responses

### 400 Bad Request

Invalid input or missing required fields.

```json
{
  "success": false,
  "message": "Missing required fields: binId, location with coordinates (lat, lng)"
}
```

```json
{
  "success": false,
  "message": "Fill level must be between 0 and 100"
}
```

### 404 Not Found

Bin does not exist.

```json
{
  "success": false,
  "message": "Bin not found"
}
```

### 409 Conflict

Duplicate bin ID.

```json
{
  "success": false,
  "message": "Bin ID already exists"
}
```

### 500 Internal Server Error

Server-side error.

```json
{
  "success": false,
  "message": "Failed to create bin"
}
```

---

## Bin Status Values

| Status | Description | Use Case |
|--------|-------------|----------|
| `active` | Bin is operational | Normal operation |
| `offline` | Bin is not responding | Communication issue |
| `maintenance` | Bin is under maintenance | Repairs or servicing |
| `full` | Bin is full (auto-set at 90%+ fill) | Needs collection |

---

## Bin Types

| Type | Description |
|------|-------------|
| `household` | General household waste |
| `recyclable` | Recyclable materials |
| `organic` | Organic/compostable waste |
| `general` | Mixed/general waste (default) |

---

## Fill Status Indicators

### Color Coding (Virtual Fields)

| Fill Level | Color | Label | Needs Collection | Urgent |
|------------|-------|-------|------------------|--------|
| 0-69% | `green` | `Available` | `false` | `false` |
| 70-89% | `yellow` | `Filling` | `true` | `false` |
| 90-100% | `red` | `Full` | `true` | `true` |

These virtual fields are automatically calculated and included in all responses.

---

## IoT Integration

### Updating Fill Level from IoT Device

IoT devices should POST updates to the fill level endpoint:

```bash
curl -X PUT "http://localhost:5000/api/bins/{binId}/fill-level" \
  -H "Content-Type: application/json" \
  -d '{
    "fillLevel": 75
  }'
```

### Registering Device with Bin

1. First, register the device (via technician endpoint)
2. Then, link device to bin during bin creation or update:

```bash
curl -X PUT "http://localhost:5000/api/bins/{binId}" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-object-id-here"
  }'
```

---

## Geospatial Queries

To find nearby bins (citizen endpoint):

```
GET /api/citizen/bins/nearby?lat=6.9271&lng=79.8612&radius=2000
```

---

## Testing with Postman

Create a Postman collection with these endpoints:

**Collection Name**: Smart Bin Management

**Variables**:
- `baseUrl`: `http://localhost:5000`
- `binId`: Save from create response

**Requests**:
1. GET All Bins
2. POST Create Bin
3. GET Bin by ID
4. PUT Update Bin
5. PUT Update Fill Level
6. PUT Empty Bin
7. PUT Set Maintenance
8. DELETE Bin

---

## Swagger Documentation

Interactive API documentation is available at:

```
http://localhost:5000/api-docs
```

Navigate to the "Bins" section to try out the endpoints directly.

