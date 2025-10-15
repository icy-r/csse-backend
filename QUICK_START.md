# 🚀 Quick Start Guide

Get the Smart Waste Management API running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- MongoDB running (local or Atlas)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Database

### Option A: Local MongoDB

Make sure MongoDB is running locally:

```bash
# The .env file is already configured for local MongoDB
# Default: mongodb://localhost:27017/waste-management
```

### Option B: MongoDB Atlas (Cloud)

1. Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/waste-management
```

## Step 3: Seed Database (Optional but Recommended)

Populate the database with test data:

```bash
npm run seed
```

This creates:
- 5 users (citizen, coordinator, technician, admin)
- 20 smart bins with various fill levels
- 20 IoT devices
- 4 waste requests
- 2 collection routes
- 5 work orders

## Step 4: Start Server

```bash
npm run dev
```

You should see:

```
╔════════════════════════════════════════════╗
║  Smart Waste Management API - MVP Backend ║
╚════════════════════════════════════════════╝

🚀 Server running on port 5000
🌍 Environment: development

📍 Endpoints:
   └─ Root:          http://localhost:5000/
   └─ Health:        http://localhost:5000/health
   └─ API Docs:      http://localhost:5000/api-docs
   └─ Logger UI:     http://localhost:5000/logs

✨ Ready to accept requests
```

## Step 5: Test the API

### Option 1: Swagger UI (Recommended)

Open your browser: `http://localhost:5000/api-docs`

- Interactive documentation
- Try endpoints directly
- See request/response examples

### Option 2: Real-time Logger

Open: `http://localhost:5000/logs`

- Monitor all API requests in real-time
- Filter by method
- Search logs
- Color-coded by status

### Option 3: cURL

```bash
# Get health status
curl http://localhost:5000/health

# Get all bins
curl http://localhost:5000/api/coordinator/bins

# Get pending requests
curl http://localhost:5000/api/coordinator/requests/pending
```

## Sample User Credentials

After running `npm run seed`, you have these test users:

| Role        | Email                | User ID (after seed)      |
|-------------|----------------------|---------------------------|
| Citizen     | john@example.com     | Check logs after seed     |
| Coordinator | sarah@example.com    | Check logs after seed     |
| Technician  | mike@example.com     | Check logs after seed     |
| Admin       | admin@example.com    | Check logs after seed     |

## Common API Calls

### Create Waste Request

```bash
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
```

### Get User Requests

```bash
curl "http://localhost:5000/api/citizen/requests?userId=USER_ID&status=pending"
```

### Get Bins by Fill Level

```bash
curl "http://localhost:5000/api/coordinator/bins?fillLevel[gte]=70&sort=fillLevel:desc"
```

### Get Coordinator Dashboard

```bash
curl http://localhost:5000/api/coordinator/dashboard
```

### Optimize Route

```bash
curl -X POST http://localhost:5000/api/coordinator/routes/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "fillLevelThreshold": 70,
    "includeApprovedRequests": true,
    "maxStops": 10
  }'
```

## Next Steps

1. **Explore Swagger UI** - Try all endpoints at `/api-docs`
2. **Monitor Logs** - Watch real-time requests at `/logs`
3. **Test OData Queries** - See README.md for query examples
4. **Connect Frontend** - Use the API with FlutterFlow or React
5. **Deploy** - Follow deployment guide in README.md

## Troubleshooting

### Port Already in Use

```bash
# Change port in .env
PORT=3000
```

### MongoDB Connection Error

```bash
# Check MongoDB is running
mongod --version

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/waste-management
```

### Seed Script Fails

Make sure MongoDB is running and the connection string is correct.

```bash
# Test connection
node -e "require('mongoose').connect('mongodb://localhost:27017/waste-management').then(() => console.log('Connected!'), err => console.error(err))"
```

## Support

- Check `/api-docs` for API documentation
- View `/logs` for request debugging
- See README.md for detailed documentation

---

**Happy Coding! 🎉**

