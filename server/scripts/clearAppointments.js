const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed, or hardcode/assume process.env

// Access Mongo URI
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/docon_db"; // Fallback to local if env missing

const clearAppointments = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const result = await Appointment.deleteMany({});
        console.log(`Deleted ${result.deletedCount} appointments.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

clearAppointments();
