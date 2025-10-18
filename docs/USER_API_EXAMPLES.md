# User API Endpoints - Usage Examples

Complete reference guide for user management endpoints.

---

## Base URL

```
http://localhost:5000/api/users
```

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users with filtering |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/:id` | Update user (email protected) |
| DELETE | `/api/users/:id` | Delete user |

---

## 1. GET All Users

Retrieve all users with optional filtering and pagination.

### Endpoint
```
GET /api/users
```

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `role` | string | Filter by role | `citizen`, `coordinator`, `technician`, `admin` |
| `status` | string | Filter by status | `active`, `inactive`, `suspended` |
| `page` | integer | Page number | `1` (default) |
| `limit` | integer | Items per page | `10` (default) |
| `sortBy` | string | Field to sort by | `name`, `createdAt` |
| `sortOrder` | string | Sort order | `asc`, `desc` |

### Example Request

```bash
curl -X GET "http://localhost:5000/api/users?role=citizen&status=active&page=1&limit=10"
```

### Example Response

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "_id": "6543210abc123def456789",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+94712345678",
      "role": "citizen",
      "status": "active",
      "address": {
        "street": "123 Main St",
        "city": "Colombo",
        "postalCode": "10100",
        "coordinates": {
          "lat": 6.9271,
          "lng": 79.8612
        }
      },
      "createdAt": "2024-10-15T10:30:00.000Z",
      "updatedAt": "2024-10-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 2. GET User by ID

Retrieve a single user by their ID.

### Endpoint
```
GET /api/users/:id
```

### Example Request

```bash
curl -X GET "http://localhost:5000/api/users/6543210abc123def456789"
```

### Example Response (Success)

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "_id": "6543210abc123def456789",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+94712345678",
    "role": "citizen",
    "status": "active",
    "address": {
      "street": "123 Main St",
      "city": "Colombo",
      "postalCode": "10100",
      "coordinates": {
        "lat": 6.9271,
        "lng": 79.8612
      }
    },
    "lastLogin": "2024-10-17T08:45:00.000Z",
    "createdAt": "2024-10-15T10:30:00.000Z",
    "updatedAt": "2024-10-17T08:45:00.000Z"
  }
}
```

### Example Response (Not Found)

```json
{
  "success": false,
  "message": "User not found"
}
```

---

## 3. POST Create User

Create a new user account.

### Endpoint
```
POST /api/users
```

### Required Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `name` | string | Full name | Required |
| `email` | string | Email address | Required, unique, valid email |
| `phone` | string | Phone number | Required |
| `password` | string | Password | Required, min 6 characters |

### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `role` | string | User role | `citizen` |
| `status` | string | Account status | `active` |
| `address` | object | Address details | `{}` |

### Example Request

```bash
curl -X POST "http://localhost:5000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+94712345679",
    "password": "secure123",
    "role": "coordinator",
    "address": {
      "street": "456 Oak Avenue",
      "city": "Kandy",
      "postalCode": "20000",
      "coordinates": {
        "lat": 7.2906,
        "lng": 80.6337
      }
    }
  }'
```

### Example Response (Success)

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "6543210abc123def456790",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+94712345679",
    "role": "coordinator",
    "status": "active",
    "address": {
      "street": "456 Oak Avenue",
      "city": "Kandy",
      "postalCode": "20000",
      "coordinates": {
        "lat": 7.2906,
        "lng": 80.6337
      }
    },
    "createdAt": "2024-10-17T09:00:00.000Z",
    "updatedAt": "2024-10-17T09:00:00.000Z"
  }
}
```

### Example Response (Email Already Exists)

```json
{
  "success": false,
  "message": "Email already registered"
}
```

### Example Response (Missing Fields)

```json
{
  "success": false,
  "message": "Missing required fields: name, email, phone, password"
}
```

---

## 4. PUT Update User

Update user information. **Note: Email and password cannot be updated through this endpoint.**

### Endpoint
```
PUT /api/users/:id
```

### Updatable Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Full name |
| `phone` | string | Phone number |
| `role` | string | User role |
| `status` | string | Account status |
| `address` | object | Address details |

### Protected Fields

- **email** - Cannot be updated (returns 403 error)
- **password** - Cannot be updated (returns 403 error)

### Example Request

```bash
curl -X PUT "http://localhost:5000/api/users/6543210abc123def456789" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "phone": "+94712345999",
    "status": "active",
    "address": {
      "street": "789 New Street",
      "city": "Galle",
      "postalCode": "80000",
      "coordinates": {
        "lat": 6.0535,
        "lng": 80.2210
      }
    }
  }'
```

### Example Response (Success)

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "6543210abc123def456789",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+94712345999",
    "role": "citizen",
    "status": "active",
    "address": {
      "street": "789 New Street",
      "city": "Galle",
      "postalCode": "80000",
      "coordinates": {
        "lat": 6.0535,
        "lng": 80.2210
      }
    },
    "createdAt": "2024-10-15T10:30:00.000Z",
    "updatedAt": "2024-10-17T09:15:00.000Z"
  }
}
```

### Example Response (Email Update Blocked)

```bash
curl -X PUT "http://localhost:5000/api/users/6543210abc123def456789" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com"
  }'
```

```json
{
  "success": false,
  "message": "Email cannot be updated. Please contact support if you need to change your email."
}
```

### Example Response (Password Update Blocked)

```bash
curl -X PUT "http://localhost:5000/api/users/6543210abc123def456789" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "newpassword123"
  }'
```

```json
{
  "success": false,
  "message": "Password cannot be updated through this endpoint. Use a dedicated password change endpoint."
}
```

---

## 5. DELETE User

Delete a user account permanently.

### Endpoint
```
DELETE /api/users/:id
```

### Example Request

```bash
curl -X DELETE "http://localhost:5000/api/users/6543210abc123def456789"
```

### Example Response (Success)

```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "id": "6543210abc123def456789"
  }
}
```

### Example Response (Not Found)

```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Error Responses

### 400 Bad Request

Invalid input or missing required fields.

```json
{
  "success": false,
  "message": "Invalid user ID"
}
```

### 403 Forbidden

Attempting to update protected fields.

```json
{
  "success": false,
  "message": "Email cannot be updated. Please contact support if you need to change your email."
}
```

### 404 Not Found

User does not exist.

```json
{
  "success": false,
  "message": "User not found"
}
```

### 409 Conflict

Duplicate email address.

```json
{
  "success": false,
  "message": "Email already registered"
}
```

### 500 Internal Server Error

Server-side error.

```json
{
  "success": false,
  "message": "Failed to retrieve users"
}
```

---

## Important Notes

### Password Security
- Passwords are automatically hashed using bcrypt before storage
- Passwords are never returned in API responses
- Password field is excluded from all GET operations

### Email Protection
- Email addresses cannot be changed after account creation
- This prevents security issues and maintains data integrity
- Users must contact support for email changes

### User Roles

| Role | Description |
|------|-------------|
| `citizen` | Regular user, default role |
| `coordinator` | Collection coordinator |
| `technician` | Field technician |
| `admin` | System administrator |

### Status Values

| Status | Description |
|--------|-------------|
| `active` | User can access the system |
| `inactive` | User account is disabled |
| `suspended` | User account is temporarily suspended |

---

## Testing with Postman

1. Import the endpoints into Postman
2. Set base URL to `http://localhost:5000`
3. Use the examples above as request templates
4. View responses in the Postman interface

---

## Swagger Documentation

Interactive API documentation is available at:

```
http://localhost:5000/api-docs
```

Navigate to the "Users" section to try out the endpoints directly.

