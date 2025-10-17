/**
 * Update bin fill levels for testing route optimization
 * Run with: node update-bin-fill-levels.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const SmartBin = require('./src/models/SmartBin.model');

async function updateBinFillLevels() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/waste-management');
    console.log('✅ Connected to database\n');

    // Get all active bins
    const bins = await SmartBin.find({ status: 'active' });
    console.log(`Found ${bins.length} active bins`);

    if (bins.length === 0) {
      console.log('\n⚠️ No active bins found. Please create bins first.');
      process.exit(1);
    }

    console.log('\nUpdating bin fill levels...');
    
    // Update bins with random fill levels (70-95% for testing)
    let updated = 0;
    for (const bin of bins) {
      // Generate random fill level between 70-95%
      const fillLevel = Math.floor(Math.random() * 26) + 70;
      
      bin.fillLevel = fillLevel;
      bin.lastUpdated = new Date();
      
      // Update status based on fill level
      if (fillLevel >= 90) {
        bin.status = 'full';
      } else {
        bin.status = 'active';
      }
      
      await bin.save();
      console.log(`  ✅ ${bin.binId}: ${fillLevel}% (${bin.status})`);
      updated++;
    }

    console.log(`\n✅ Updated ${updated} bins successfully!`);
    console.log('\nYou can now test route optimization with bins that have high fill levels.');

    // Show summary
    const fullBins = await SmartBin.countDocuments({ fillLevel: { $gte: 90 } });
    const fillingBins = await SmartBin.countDocuments({ fillLevel: { $gte: 70, $lt: 90 } });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Full bins (≥90%): ${fullBins}`);
    console.log(`Filling bins (70-89%): ${fillingBins}`);
    console.log(`Total eligible for collection: ${fullBins + fillingBins}`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the update
updateBinFillLevels();

