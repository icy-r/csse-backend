/**
 * Test script for route optimization
 * Run with: node test-optimize-route.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const SmartBin = require('./src/models/SmartBin.model');
const WasteRequest = require('./src/models/WasteRequest.model');
const { optimizeRoute } = require('./src/services/routeOptimizer.service');

async function testRouteOptimization() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/waste-management');
    console.log('✅ Connected to database\n');

    // Check bins
    console.log('=== CHECKING BINS ===');
    const totalBins = await SmartBin.countDocuments();
    console.log(`Total bins in database: ${totalBins}`);

    const activeBins = await SmartBin.countDocuments({ status: 'active' });
    console.log(`Active bins: ${activeBins}`);

    const highFillBins = await SmartBin.countDocuments({ 
      status: 'active', 
      fillLevel: { $gte: 70 } 
    });
    console.log(`Bins with fill level ≥70%: ${highFillBins}`);

    if (highFillBins === 0) {
      console.log('\n⚠️ WARNING: No bins with fill level ≥70%');
      console.log('Creating test bins...');
      await createTestBins();
    }

    // Check requests
    console.log('\n=== CHECKING REQUESTS ===');
    const totalRequests = await WasteRequest.countDocuments();
    console.log(`Total requests in database: ${totalRequests}`);

    const approvedRequests = await WasteRequest.countDocuments({ status: 'approved' });
    console.log(`Approved requests: ${approvedRequests}`);

    if (approvedRequests === 0) {
      console.log('\n⚠️ WARNING: No approved requests');
    }

    // Test optimization
    console.log('\n=== TESTING ROUTE OPTIMIZATION ===');
    const bins = await SmartBin.find({
      status: 'active',
      fillLevel: { $gte: 70 }
    }).select('binId location fillLevel binType status').limit(20);

    console.log(`Found ${bins.length} bins for optimization`);

    const requests = await WasteRequest.find({
      status: 'approved'
    }).select('trackingId wasteType address').limit(10);

    console.log(`Found ${requests.length} approved requests`);

    if (bins.length === 0 && requests.length === 0) {
      console.log('\n❌ ERROR: No data available for route optimization');
      console.log('Please add bins with fill level ≥70% or approved requests');
      process.exit(1);
    }

    const optimized = optimizeRoute(bins, requests, {
      fillLevelThreshold: 70,
      startLocation: { lat: 6.9271, lng: 79.8612 },
      maxStops: 50
    });

    console.log('\n✅ Route optimization successful!');
    console.log('Result:', JSON.stringify({
      totalStops: optimized.totalStops,
      totalDistance: optimized.totalDistance,
      estimatedDuration: optimized.estimatedDuration,
      stops: optimized.stops.length
    }, null, 2));

    console.log('\nFirst 3 stops:');
    optimized.stops.slice(0, 3).forEach((stop, i) => {
      console.log(`${i + 1}. ${stop.stopType} - ${stop.address}`);
    });

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

async function createTestBins() {
  const testBins = [
    {
      binId: 'BIN-TEST-001',
      location: {
        address: 'Galle Road, Colombo 03',
        area: 'Colombo 03',
        coordinates: { lat: 6.9271, lng: 79.8612 }
      },
      fillLevel: 95,
      capacity: 240,
      binType: 'household',
      status: 'active'
    },
    {
      binId: 'BIN-TEST-002',
      location: {
        address: 'Duplication Road, Colombo 04',
        area: 'Colombo 04',
        coordinates: { lat: 6.8945, lng: 79.8573 }
      },
      fillLevel: 85,
      capacity: 240,
      binType: 'recyclable',
      status: 'active'
    },
    {
      binId: 'BIN-TEST-003',
      location: {
        address: 'Havelock Road, Colombo 05',
        area: 'Colombo 05',
        coordinates: { lat: 6.8855, lng: 79.8740 }
      },
      fillLevel: 75,
      capacity: 240,
      binType: 'general',
      status: 'active'
    }
  ];

  for (const bin of testBins) {
    try {
      await SmartBin.create(bin);
      console.log(`  ✅ Created ${bin.binId}`);
    } catch (err) {
      if (err.code === 11000) {
        console.log(`  ⚠️ ${bin.binId} already exists`);
      } else {
        console.log(`  ❌ Error creating ${bin.binId}:`, err.message);
      }
    }
  }
}

// Run the test
testRouteOptimization();

