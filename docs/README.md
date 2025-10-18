# Smart Waste Management System - Backend API

RESTful API for Smart Waste Management System MVP built with Node.js, Express, MongoDB, and Socket.IO.

## 🚀 Features

- ✅ Complete CRUD operations for all entities
- ✅ OData-like query capabilities (filtering, sorting, pagination)
- ✅ Real-time request/response logging with Socket.IO
- ✅ Interactive Swagger API documentation
- ✅ Real-time logger UI for debugging
- ✅ Route optimization algorithm
- ✅ Geospatial queries for nearby bins
- ✅ Comprehensive error handling
- ✅ 4 user role controllers (Citizen, Coordinator, Technician, Admin)

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB 6+ (local or MongoDB Atlas)
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone/Navigate to the project

```bash
cd waste-management-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Edit the `.env` file with your MongoDB connection string:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/waste-management
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/waste-management

ENABLE_SWAGGER=true
ENABLE_LOGGER_UI=true
ENABLE_CORS=true
CORS_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### 4. Start MongoDB (if local)

```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

### 5. Start the server

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

The server will start on `http://localhost:5000`

## 📍 API Endpoints

### Access Points

- **Root**: `http://localhost:5000/`
- **Health Check**: `http://localhost:5000/health`
- **API Documentation**: `http://localhost:5000/api-docs`
- **Real-time Logger**: `http://localhost:5000/logs`

### API Routes

#### Citizen (Resident) Operations
- `POST /api/citizen/requests` - Create waste pickup request
- `GET /api/citizen/requests` - Get user's requests (with OData filtering)
- `GET /api/citizen/requests/:id` - Track specific request with timeline
- `PUT /api/citizen/requests/:id/payment` - Update payment status
- `PUT /api/citizen/requests/:id/cancel` - Cancel request
- `GET /api/citizen/bins/nearby` - Find nearby smart bins (geospatial)

#### Coordinator Operations
- `GET /api/coordinator/dashboard` - Get dashboard with statistics
- `GET /api/coordinator/bins` - Get bins with fill levels (color-coded)
- `GET /api/coordinator/requests/pending` - Get pending special requests
- `PUT /api/coordinator/requests/:id/approve` - Approve request
- `PUT /api/coordinator/requests/:id/reject` - Reject request
- `POST /api/coordinator/routes/optimize` - Generate optimized route
- `POST /api/coordinator/routes` - Create route
- `GET /api/coordinator/routes` - Get routes (with filtering)
- `PUT /api/coordinator/routes/:id/assign` - Assign route to crew
- `PUT /api/coordinator/routes/:id/status` - Update route status
- `PUT /api/coordinator/routes/:id/stops/:stopIndex` - Update stop status

#### Technician Operations
- `GET /api/technician/work-orders` - Get work orders (with priority filtering)
- `GET /api/technician/work-orders/:id` - Get work order details
- `PUT /api/technician/work-orders/:id/assign` - Assign work order
- `PUT /api/technician/work-orders/:id/start` - Start work order
- `PUT /api/technician/work-orders/:id/resolve` - Resolve work order
- `PUT /api/technician/work-orders/:id/escalate` - Escalate work order
- `POST /api/technician/devices/register` - Register new device
- `GET /api/technician/devices/:id` - Get device details

#### Admin Operations
- `GET /api/admin/users` - Get all users (with filtering)
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id/role` - Update user role/status
- `DELETE /api/admin/users/:id` - Deactivate user
- `GET /api/admin/reports/collections` - Collection statistics
- `GET /api/admin/reports/efficiency` - Route efficiency metrics
- `GET /api/admin/reports/devices` - Device uptime reports
- `GET /api/admin/system/health` - System health status
- `GET /api/admin/dashboard` - Admin dashboard statistics
- `GET /api/admin/export` - Export data

## 🔍 OData Query Examples

The API supports OData-like querying with powerful filtering capabilities:

### Basic Filtering

```bash
# Equal
GET /api/citizen/requests?status=pending

# Not equal
GET /api/coordinator/bins?status[ne]=offline

# Greater than
GET /api/coordinator/bins?fillLevel[gt]=70

# Greater than or equal
GET /api/admin/users?createdAt[gte]=2025-01-01

# Less than
GET /api/coordinator/bins?fillLevel[lt]=50

# Contains (case-insensitive)
GET /api/admin/users?name[contains]=john

# In (multiple values)
GET /api/citizen/requests?status[in]=pending,approved,scheduled

# Not in
GET /api/admin/users?role[nin]=admin,coordinator
```

### Sorting

```bash
# Single field ascending
GET /api/citizen/requests?sort=createdAt:asc

# Single field descending
GET /api/coordinator/bins?sort=fillLevel:desc

# Multiple fields
GET /api/admin/users?sort=role:asc,createdAt:desc
```

### Pagination

```bash
# Page 1, 20 items per page (default)
GET /api/citizen/requests?page=1&limit=20

# Page 2, 50 items per page
GET /api/coordinator/bins?page=2&limit=50
```

### Field Selection

```bash
# Select specific fields
GET /api/admin/users?select=name,email,role

# Alternative syntax
GET /api/admin/users?fields=name,email,status
```

### Complex Queries

```bash
# Combine multiple filters
GET /api/citizen/requests?userId=123&status[in]=pending,scheduled&sort=createdAt:desc&page=1&limit=10

# Date range
GET /api/admin/users?createdAt[gte]=2025-01-01&createdAt[lte]=2025-12-31

# Multiple conditions
GET /api/coordinator/bins?fillLevel[gte]=70&status=active&binType=general&sort=fillLevel:desc
```

## 🧪 Testing the API

### Using Swagger UI

1. Open `http://localhost:5000/api-docs`
2. Explore available endpoints
3. Try out requests directly in the browser

### Using cURL

```bash
# Create a waste request
curl -X POST http://localhost:5000/api/citizen/requests \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "wasteType": "household",
    "quantity": "2 bags",
    "address": {
      "street": "123 Main St",
      "city": "Colombo",
      "coordinates": { "lat": 6.9271, "lng": 79.8612 }
    },
    "preferredDate": "2025-10-20",
    "description": "Regular pickup"
  }'

# Get user's requests with filtering
curl "http://localhost:5000/api/citizen/requests?userId=USER_ID&status[in]=pending,scheduled&sort=createdAt:desc"

# Get nearby bins
curl "http://localhost:5000/api/citizen/bins/nearby?lat=6.9271&lng=79.8612&radius=2000"
```

### Using Thunder Client / Postman

Import the Swagger specification from `/api-docs` or manually create requests.

## 🌍 Deployment

### MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Update `.env` with connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/waste-management
   ```
5. Whitelist IP address (0.0.0.0/0 for all IPs or specific IPs)

### Digital Ocean Deployment

#### Option 1: Digital Ocean App Platform

1. Push code to GitHub
2. Create new App in Digital Ocean
3. Connect GitHub repository
4. Add environment variables
5. Deploy

#### Option 2: Digital Ocean Droplet

1. Create Ubuntu droplet
2. SSH into droplet
3. Install Node.js and MongoDB
4. Clone repository
5. Install dependencies
6. Configure environment
7. Use PM2 for process management:

```bash
npm install -g pm2
pm2 start server.js --name waste-api
pm2 startup
pm2 save
```

#### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

```bash
docker build -t waste-api .
docker run -p 5000:5000 --env-file .env waste-api
```

### Environment Variables for Production

Update these in your deployment platform:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
ENABLE_SWAGGER=true
ENABLE_LOGGER_UI=true
ENABLE_CORS=true
CORS_ORIGINS=https://your-frontend-domain.com,https://your-mobile-app-domain.com
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

## 📊 Real-time Logger UI

Access the real-time logger at `http://localhost:5000/logs`

**Features:**
- Live request/response monitoring
- Color-coded by HTTP method and status
- Filter by method (GET, POST, PUT, DELETE)
- Search functionality
- Pause/Resume logging
- Clear logs
- Auto-scroll

## 📖 API Documentation

Full interactive API documentation available at `http://localhost:5000/api-docs`

**Features:**
- Try out API endpoints directly
- View request/response schemas
- See example payloads
- Authentication support (for future auth implementation)

## 🗂️ Project Structure

```
waste-management-backend/
├── src/
│   ├── config/
│   │   └── database.js              # MongoDB connection
│   ├── models/
│   │   ├── User.model.js            # User schema
│   │   ├── WasteRequest.model.js    # Waste request schema
│   │   ├── SmartBin.model.js        # Smart bin schema
│   │   ├── Route.model.js           # Collection route schema
│   │   ├── WorkOrder.model.js       # Work order schema
│   │   └── Device.model.js          # IoT device schema
│   ├── controllers/
│   │   ├── citizen.controller.js    # Citizen operations
│   │   ├── coordinator.controller.js # Coordinator operations
│   │   ├── technician.controller.js  # Technician operations
│   │   └── admin.controller.js      # Admin operations
│   ├── routes/
│   │   ├── citizen.routes.js
│   │   ├── coordinator.routes.js
│   │   ├── technician.routes.js
│   │   ├── admin.routes.js
│   │   └── logs.routes.js           # Logger UI route
│   ├── middleware/
│   │   ├── logger.js                # Request logger
│   │   ├── queryBuilder.js          # OData query builder
│   │   └── errorHandler.js          # Error handler
│   ├── services/
│   │   ├── socketLogger.service.js  # Socket.IO logger
│   │   ├── routeOptimizer.service.js # Route optimization
│   │   └── notification.service.js   # Notifications (stub)
│   └── utils/
│       ├── response.js              # Response helpers
│       └── helpers.js               # Utility functions
├── docs/
│   └── swagger.js                   # Swagger configuration
├── uploads/                         # File uploads directory
├── .env                             # Environment variables
├── .env.example                     # Environment template
├── .gitignore
├── package.json
├── server.js                        # Main server file
└── README.md
```

## 🔧 Development

### Scripts

```json
{
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

### Adding New Endpoints

1. Create controller method in `src/controllers/`
2. Add route in `src/routes/`
3. Document with Swagger annotations
4. Test with Swagger UI or cURL

## 🐛 Debugging

### View Logs

Real-time logs available at `http://localhost:5000/logs`

### Console Logs

All requests are logged to console with:
- HTTP method
- Path
- Status code
- Duration

### Swagger UI

Test endpoints and view responses at `/api-docs`

## 🤝 Support

For issues or questions, please contact the development team.

## 📄 License

ISC

---

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Built with:** Node.js, Express, MongoDB, Socket.IO

