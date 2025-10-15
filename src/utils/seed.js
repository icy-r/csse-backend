require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User.model');
const WasteRequest = require('../models/WasteRequest.model');
const SmartBin = require('../models/SmartBin.model');
const Route = require('../models/Route.model');
const WorkOrder = require('../models/WorkOrder.model');
const Device = require('../models/Device.model');

// Sample data
const users = [
  {
    name: 'John Citizen',
    email: 'john@example.com',
    phone: '+94771234567',
    role: 'citizen',
    address: {
      street: '123 Main St',
      city: 'Colombo',
      postalCode: '10100',
      coordinates: { lat: 6.9271, lng: 79.8612 }
    },
    status: 'active'
  },
  {
    name: 'Sarah Coordinator',
    email: 'sarah@example.com',
    phone: '+94771234568',
    role: 'coordinator',
    address: {
      street: '456 Admin Rd',
      city: 'Colombo',
      postalCode: '10200',
      coordinates: { lat: 6.9341, lng: 79.8500 }
    },
    status: 'active'
  },
  {
    name: 'Mike Technician',
    email: 'mike@example.com',
    phone: '+94771234569',
    role: 'technician',
    address: {
      street: '789 Service Ave',
      city: 'Colombo',
      postalCode: '10300',
      coordinates: { lat: 6.9220, lng: 79.8700 }
    },
    status: 'active'
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '+94771234570',
    role: 'admin',
    address: {
      street: '100 HQ Building',
      city: 'Colombo',
      postalCode: '10400',
      coordinates: { lat: 6.9280, lng: 79.8550 }
    },
    status: 'active'
  },
  {
    name: 'Jane Resident',
    email: 'jane@example.com',
    phone: '+94771234571',
    role: 'citizen',
    address: {
      street: '55 Park Lane',
      city: 'Malabe',
      postalCode: '10115',
      coordinates: { lat: 6.9100, lng: 79.9700 }
    },
    status: 'active'
  }
];

const createSmartBins = (count = 20) => {
  const bins = [];
  const areas = ['Colombo', 'Malabe', 'Kandy', 'Galle', 'Negombo'];
  const types = ['household', 'recyclable', 'organic', 'general'];
  
  for (let i = 1; i <= count; i++) {
    bins.push({
      binId: `BIN-${String(i).padStart(3, '0')}`,
      location: {
        address: `${10 + i} Street ${i}`,
        area: areas[Math.floor(Math.random() * areas.length)],
        coordinates: {
          lat: 6.9 + (Math.random() * 0.1),
          lng: 79.85 + (Math.random() * 0.1)
        }
      },
      fillLevel: Math.floor(Math.random() * 100),
      capacity: 240,
      binType: types[Math.floor(Math.random() * types.length)],
      status: Math.random() > 0.1 ? 'active' : 'offline',
      lastEmptied: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      lastUpdated: new Date(),
      collectionCount: Math.floor(Math.random() * 50)
    });
  }
  
  return bins;
};

const createDevices = (bins) => {
  const devices = [];
  const types = ['rfid', 'qr-code', 'sensor'];
  
  bins.forEach((bin, index) => {
    devices.push({
      deviceId: `DEV-${bin.binId}-${types[index % 3].toUpperCase()}`,
      deviceType: types[index % 3],
      binId: null, // Will be set after bins are saved
      status: bin.status === 'offline' ? 'offline' : 'active',
      installationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      lastSignal: bin.status === 'offline' 
        ? new Date(Date.now() - 5 * 60 * 60 * 1000)
        : new Date(),
      batteryLevel: Math.floor(Math.random() * 100),
      firmwareVersion: '1.0.0',
      errorLog: [],
      maintenanceHistory: []
    });
  });
  
  return devices;
};

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      WasteRequest.deleteMany({}),
      SmartBin.deleteMany({}),
      Route.deleteMany({}),
      WorkOrder.deleteMany({}),
      Device.deleteMany({})
    ]);
    console.log('✅ Existing data cleared');
    
    // Create users
    console.log('👥 Creating users...');
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);
    
    const citizen = createdUsers.find(u => u.email === 'john@example.com');
    const coordinator = createdUsers.find(u => u.email === 'sarah@example.com');
    const technician = createdUsers.find(u => u.email === 'mike@example.com');
    const citizen2 = createdUsers.find(u => u.email === 'jane@example.com');
    
    // Create smart bins
    console.log('🗑️  Creating smart bins...');
    const binsData = createSmartBins(20);
    const createdBins = await SmartBin.insertMany(binsData);
    console.log(`✅ Created ${createdBins.length} smart bins`);
    
    // Create devices
    console.log('📱 Creating devices...');
    const devicesData = createDevices(binsData);
    const createdDevices = await Device.insertMany(devicesData);
    
    // Link devices to bins
    for (let i = 0; i < createdBins.length; i++) {
      createdBins[i].deviceId = createdDevices[i]._id;
      createdDevices[i].binId = createdBins[i]._id;
      await createdBins[i].save();
      await createdDevices[i].save();
    }
    console.log(`✅ Created and linked ${createdDevices.length} devices`);
    
    // Create waste requests
    console.log('📋 Creating waste requests...');
    const wasteRequests = [
      {
        userId: citizen._id,
        wasteType: 'household',
        quantity: '2 bags',
        address: citizen.address,
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        description: 'Regular household waste',
        status: 'pending',
        estimatedCost: 0,
        paymentStatus: 'not-required'
      },
      {
        userId: citizen2._id,
        wasteType: 'bulky',
        quantity: '1 item',
        address: citizen2.address,
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        description: 'Old furniture',
        status: 'approved',
        estimatedCost: 500,
        paymentStatus: 'pending'
      },
      {
        userId: citizen._id,
        wasteType: 'e-waste',
        quantity: '3 items',
        address: citizen.address,
        preferredDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        description: 'Old electronics',
        status: 'scheduled',
        scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        estimatedCost: 0,
        paymentStatus: 'not-required'
      },
      {
        userId: citizen2._id,
        wasteType: 'recyclable',
        quantity: '5 bags',
        address: citizen2.address,
        preferredDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        description: 'Plastic and paper',
        status: 'completed',
        completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        estimatedCost: 0,
        paymentStatus: 'not-required'
      }
    ];
    
    const createdRequests = await WasteRequest.insertMany(wasteRequests);
    console.log(`✅ Created ${createdRequests.length} waste requests`);
    
    // Create routes
    console.log('🗺️  Creating routes...');
    const fullBins = createdBins.filter(b => b.fillLevel >= 70).slice(0, 10);
    const routes = [
      {
        routeName: 'Morning Route - Zone A',
        coordinatorId: coordinator._id,
        stops: fullBins.slice(0, 5).map((bin, idx) => ({
          stopType: 'bin',
          referenceId: bin._id,
          sequence: idx + 1,
          address: bin.location.address,
          coordinates: bin.location.coordinates,
          status: idx < 2 ? 'completed' : 'pending'
        })),
        status: 'in-progress',
        scheduledDate: new Date(),
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        totalDistance: 12.5,
        estimatedDuration: 90,
        completionPercentage: 40
      },
      {
        routeName: 'Afternoon Route - Zone B',
        coordinatorId: coordinator._id,
        stops: fullBins.slice(5, 10).map((bin, idx) => ({
          stopType: 'bin',
          referenceId: bin._id,
          sequence: idx + 1,
          address: bin.location.address,
          coordinates: bin.location.coordinates,
          status: 'pending'
        })),
        status: 'assigned',
        scheduledDate: new Date(),
        totalDistance: 15.8,
        estimatedDuration: 110,
        completionPercentage: 0
      }
    ];
    
    const createdRoutes = await Route.insertMany(routes);
    console.log(`✅ Created ${createdRoutes.length} routes`);
    
    // Create work orders
    console.log('🔧 Creating work orders...');
    const offlineDevices = createdDevices.filter(d => d.status === 'offline');
    const workOrders = offlineDevices.slice(0, 5).map((device, idx) => {
      const priorities = ['low', 'medium', 'high', 'urgent'];
      return {
        technicianId: idx < 2 ? technician._id : null,
        deviceId: device._id,
        binId: device.binId,
        priority: priorities[idx % 4],
        status: idx < 2 ? 'assigned' : 'pending',
        issueDescription: `Device ${device.deviceId} has been offline for more than 4 hours`,
        issueType: 'offline',
        actionTaken: 'none',
        assignedDate: idx < 2 ? new Date(Date.now() - 1 * 60 * 60 * 1000) : null
      };
    });
    
    const createdWorkOrders = await WorkOrder.insertMany(workOrders);
    console.log(`✅ Created ${createdWorkOrders.length} work orders`);
    
    // Summary
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('✨ Database seeding completed!');
    console.log('═══════════════════════════════════════');
    console.log(`👥 Users: ${createdUsers.length}`);
    console.log(`   └─ Citizens: ${createdUsers.filter(u => u.role === 'citizen').length}`);
    console.log(`   └─ Coordinators: ${createdUsers.filter(u => u.role === 'coordinator').length}`);
    console.log(`   └─ Technicians: ${createdUsers.filter(u => u.role === 'technician').length}`);
    console.log(`   └─ Admins: ${createdUsers.filter(u => u.role === 'admin').length}`);
    console.log(`🗑️  Smart Bins: ${createdBins.length}`);
    console.log(`   └─ Active: ${createdBins.filter(b => b.status === 'active').length}`);
    console.log(`   └─ Full (>90%): ${createdBins.filter(b => b.fillLevel >= 90).length}`);
    console.log(`📱 Devices: ${createdDevices.length}`);
    console.log(`   └─ Active: ${createdDevices.filter(d => d.status === 'active').length}`);
    console.log(`   └─ Offline: ${createdDevices.filter(d => d.status === 'offline').length}`);
    console.log(`📋 Waste Requests: ${createdRequests.length}`);
    console.log(`   └─ Pending: ${createdRequests.filter(r => r.status === 'pending').length}`);
    console.log(`   └─ Approved: ${createdRequests.filter(r => r.status === 'approved').length}`);
    console.log(`   └─ Completed: ${createdRequests.filter(r => r.status === 'completed').length}`);
    console.log(`🗺️  Routes: ${createdRoutes.length}`);
    console.log(`   └─ In Progress: ${createdRoutes.filter(r => r.status === 'in-progress').length}`);
    console.log(`   └─ Assigned: ${createdRoutes.filter(r => r.status === 'assigned').length}`);
    console.log(`🔧 Work Orders: ${createdWorkOrders.length}`);
    console.log(`   └─ Pending: ${createdWorkOrders.filter(w => w.status === 'pending').length}`);
    console.log(`   └─ Assigned: ${createdWorkOrders.filter(w => w.status === 'assigned').length}`);
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('📝 Sample User Credentials:');
    console.log('   Citizen:     john@example.com');
    console.log('   Coordinator: sarah@example.com');
    console.log('   Technician:  mike@example.com');
    console.log('   Admin:       admin@example.com');
    console.log('');
    console.log('🚀 You can now start the server and test the API!');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed
seedDatabase();

