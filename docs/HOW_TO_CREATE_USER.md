# How to Create a User

## Quick Reference Guide

---

## 📍 Endpoint

```
POST /api/admin/users
```

**Access**: Admin only  
**Documentation**: Now available in Swagger at `http://localhost:5000/api-docs`

---

## ✅ Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | String | Full name of the user | "John Doe" |
| `email` | String | Email address (must be unique) | "john.doe@example.com" |
| `phone` | String | Contact phone number | "+94771234567" |
| `role` | String | User role: `citizen`, `coordinator`, `technician`, `admin` | "citizen" |

---

## 🔧 Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `status` | String | Account status: `active`, `inactive`, `suspended` | "active" |
| `address` | Object | User address with coordinates | `{}` |
| `address.street` | String | Street address | - |
| `address.city` | String | City | - |
| `address.postalCode` | String | Postal code | - |
| `address.coordinates.lat` | Number | Latitude | - |
| `address.coordinates.lng` | Number | Longitude | - |

---

## 📝 Example Requests

### Minimum Required Fields (Citizen)

```bash
curl -X POST http://localhost:5000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+94771234567",
    "role": "citizen"
  }'
```

### Complete User with Address (Coordinator)

```bash
curl -X POST http://localhost:5000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "+94771234568",
    "role": "coordinator",
    "status": "active",
    "address": {
      "street": "123 Main Street",
      "city": "Colombo",
      "postalCode": "10100",
      "coordinates": {
        "lat": 6.9271,
        "lng": 79.8612
      }
    }
  }'
```

### Create Technician

```bash
curl -X POST http://localhost:5000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Tech",
    "email": "bob.tech@example.com",
    "phone": "+94771234569",
    "role": "technician"
  }'
```

### Create Admin

```bash
curl -X POST http://localhost:5000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "phone": "+94771234560",
    "role": "admin"
  }'
```

---

## ✅ Success Response (201 Created)

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+94771234567",
    "role": "citizen",
    "status": "active",
    "address": {
      "street": "123 Main Street",
      "city": "Colombo",
      "postalCode": "10100",
      "coordinates": {
        "lat": 6.9271,
        "lng": 79.8612
      }
    },
    "createdAt": "2025-10-16T10:30:00.000Z",
    "updatedAt": "2025-10-16T10:30:00.000Z"
  }
}
```

---

## ❌ Error Responses

### Missing Required Fields (400)

```json
{
  "success": false,
  "message": "Missing required fields (name, email, phone, role)"
}
```

### Duplicate Email (500)

```json
{
  "success": false,
  "message": "email already exists"
}
```

### Invalid Role (500)

```json
{
  "success": false,
  "message": "User validation failed: role: `invalid_role` is not a valid enum value for path `role`"
}
```

---

## 🎯 Using Swagger UI

1. **Start your server**:
   ```bash
   npm run dev
   ```

2. **Open Swagger UI**:
   ```
   http://localhost:5000/api-docs
   ```

3. **Navigate to Admin section** and find `POST /api/admin/users`

4. **Click "Try it out"**

5. **Fill in the request body**:
   ```json
   {
     "name": "Test User",
     "email": "test@example.com",
     "phone": "+94771234567",
     "role": "citizen"
   }
   ```

6. **Click "Execute"**

7. **View the response** below

---

## 📋 All Available Roles

| Role | Description | Use Case |
|------|-------------|----------|
| `citizen` | Regular resident | Request waste pickup, track requests |
| `coordinator` | Collection coordinator | Manage routes, approve requests |
| `technician` | Field technician | Handle device maintenance, work orders |
| `admin` | System administrator | Manage users, view reports, system health |

---

## 🔐 Important Notes

### Email Uniqueness
- Email must be unique across all users
- Attempting to create a user with existing email will fail
- Email is automatically converted to lowercase

### Role Permissions
- Only admins can create users via this endpoint
- In production, implement JWT authentication
- Add role-based middleware to protect this endpoint

### Default Status
- If no status provided, defaults to `active`
- Valid statuses: `active`, `inactive`, `suspended`

### Address is Optional
- User can be created without address
- Address can be added later via update endpoint
- Coordinates are useful for geospatial queries

---

## 🧪 Testing with Postman

### Import Collection

Create a Postman request:

**Method**: `POST`  
**URL**: `http://localhost:5000/api/admin/users`  
**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "+94771234567",
  "role": "citizen",
  "address": {
    "street": "123 Test St",
    "city": "Colombo",
    "postalCode": "10100",
    "coordinates": {
      "lat": 6.9271,
      "lng": 79.8612
    }
  }
}
```

---

## 🔄 Related Endpoints

### Get All Users
```
GET /api/admin/users
```

### Get User by ID
```
GET /api/admin/users/:id
```

### Update User Role
```
PUT /api/admin/users/:id/role
```

### Delete User
```
DELETE /api/admin/users/:id
```

---

## 💡 Common Issues

### Issue: "Missing required fields"
**Solution**: Ensure you include `name`, `email`, `phone`, and `role`

### Issue: "email already exists"
**Solution**: Use a different email address or update the existing user

### Issue: Invalid role
**Solution**: Use only: `citizen`, `coordinator`, `technician`, or `admin`

### Issue: 404 Not Found
**Solution**: Check that server is running and URL is correct (`/api/admin/users`)

---

## ✨ Quick Start

**Create your first user** (copy & paste):

```bash
curl -X POST http://localhost:5000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","phone":"+94771234567","role":"citizen"}'
```

Or using **JavaScript fetch**:

```javascript
fetch('http://localhost:5000/api/admin/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+94771234567',
    role: 'citizen'
  })
})
.then(res => res.json())
.then(data => console.log('User created:', data))
.catch(err => console.error('Error:', err));
```

---

## 📚 Next Steps

After creating a user:
1. ✅ Use the `_id` to create waste requests for that user
2. ✅ Update user role if needed
3. ✅ View user in dashboard or get all users endpoint

---

**Documentation Updated**: 2025-10-16  
**Swagger**: http://localhost:5000/api-docs  
**Status**: ✅ Complete and ready to use!

