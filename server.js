require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

// ========================================
// MIDDLEWARE
// ========================================

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make Socket.IO accessible to routes/controllers
app.set('io', io);

// Request logger
const logger = require('./src/middleware/logger');
app.use(logger);

// ========================================
// ROUTES
// ========================================

// Import routes
const citizenRoutes = require('./src/routes/citizen.routes');
const coordinatorRoutes = require('./src/routes/coordinator.routes');
const technicianRoutes = require('./src/routes/technician.routes');
const adminRoutes = require('./src/routes/admin.routes');
const logsRoutes = require('./src/routes/logs.routes');

// Mount routes
app.use('/api/citizen', citizenRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/technician', technicianRoutes);
app.use('/api/admin', adminRoutes);
app.use('/logs', logsRoutes);

// ========================================
// SWAGGER DOCUMENTATION
// ========================================

if (process.env.ENABLE_SWAGGER === 'true') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerDocument = require('./docs/swagger');
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'Waste Management API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    }
  }));
  
  // Endpoint to download Swagger spec as JSON
  app.get('/api/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="swagger-spec.json"');
    res.json(swaggerDocument);
  });
  
  console.log('📚 Swagger documentation enabled at /api-docs');
  console.log('📥 Swagger JSON download available at /api/swagger.json');
}

// ========================================
// HEALTH CHECK & ROOT
// ========================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Waste Management API',
    version: '1.0.0',
    endpoints: {
      docs: '/api-docs',
      swaggerJson: '/api/swagger.json',
      health: '/health',
      logs: '/logs',
      citizen: '/api/citizen',
      coordinator: '/api/coordinator',
      technician: '/api/technician',
      admin: '/api/admin'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected' // Will be updated after DB connection
  });
});

// ========================================
// ERROR HANDLING
// ========================================

const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// ========================================
// SOCKET.IO CONNECTION HANDLING
// ========================================

const socketLogger = require('./src/services/socketLogger.service');

io.on('connection', (socket) => {
  console.log('📡 Client connected to logger');
  socketLogger.addClient(socket);
  
  socket.on('disconnect', () => {
    console.log('📡 Client disconnected from logger');
  });
});

// ========================================
// DATABASE CONNECTION & SERVER START
// ========================================

const connectDB = require('./src/config/database');

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  
  server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  Smart Waste Management API - MVP Backend ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
    console.log('📍 Endpoints:');
    console.log(`   └─ Root:          http://localhost:${PORT}/`);
    console.log(`   └─ Health:        http://localhost:${PORT}/health`);
    console.log(`   └─ API Docs:      http://localhost:${PORT}/api-docs`);
    console.log(`   └─ Logger UI:     http://localhost:${PORT}/logs`);
    console.log('');
    console.log('📡 API Routes:');
    console.log(`   └─ Citizen:       http://localhost:${PORT}/api/citizen`);
    console.log(`   └─ Coordinator:   http://localhost:${PORT}/api/coordinator`);
    console.log(`   └─ Technician:    http://localhost:${PORT}/api/technician`);
    console.log(`   └─ Admin:         http://localhost:${PORT}/api/admin`);
    console.log('');
    console.log('✨ Ready to accept requests');
    console.log('');
  });
}).catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  // Close server
  server.close(() => {
    console.log('✅ Server closed');
  });
  
  // Close database connection
  const mongoose = require('mongoose');
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  
  server.close(() => {
    console.log('✅ Server closed');
  });
  
  const mongoose = require('mongoose');
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
  
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Don't exit in production, just log
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

module.exports = { app, server, io };

