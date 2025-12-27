const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');
const Notification = require('../models/Notification');

const wipe = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        const deletedAppts = await Appointment.deleteMany({});
        console.log(`Deleted ${deletedAppts.deletedCount} appointments.`);

        const deletedBills = await Bill.deleteMany({});
        console.log(`Deleted ${deletedBills.deletedCount} bills.`);

        // Optional: Clear notifications to reduce noise, but maybe keep for debugging? 
        // Let's clear to be clean.
        const deletedNotifs = await Notification.deleteMany({ type: 'appointment' });
        console.log(`Deleted ${deletedNotifs.deletedCount} appointment notifications.`);

        console.log('--- WIPE COMPLETE ---');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

wipe();
