const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const LabBooking = require('../models/LabBooking');

async function clearBookings() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/docon');
        console.log('Connected.');

        console.log('Clearing all LabBookings...');
        const result = await LabBooking.deleteMany({});
        console.log(`Deleted ${result.deletedCount} bookings.`);

        console.log('✅ Done. All bookings cleared.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

clearBookings();
