const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const Bill = require('../models/Bill');

const runTest = async () => {
    try {
        console.log('--- STARTING BOOKING TEST ---');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        // 1. Find a Doctor
        const doctorUser = await User.findOne({ role: 'doctor' });
        if (!doctorUser) throw new Error('No Doctor User found');
        console.log(`Doctor Found: ${doctorUser.name} (${doctorUser._id})`);

        // 2. Find a Patient
        const patientUser = await User.findOne({ role: 'patient' });
        if (!patientUser) throw new Error('No Patient User found');
        console.log(`Patient Found: ${patientUser.name} (${patientUser._id})`);

        // 3. Create Appointment (Mocking route logic)
        console.log('Creating Appointment...');
        const newAppt = new Appointment({
            doctor: doctorUser._id,
            patient: patientUser._id,
            date: new Date(),
            visitType: 'General Checkup',
            status: 'pending',
            queueNumber: 999
        });
        const savedAppt = await newAppt.save();
        console.log(`Appointment Saved: ${savedAppt._id}`);

        // 4. Create Notification (The failing step)
        console.log('Creating Notification (Type: appointment)...');
        // Check allowed values directly from schema if possible, or just try save
        const notif = new Notification({
            user: patientUser._id,
            type: 'appointment', // THIS IS THE KEY TEST
            message: 'Test Appointment Notification'
        });

        try {
            await notif.save();
            console.log('✅ Notification Saved Successfully!');
        } catch (e) {
            console.error('❌ Notification Failed:', e.message);
        }

        // 5. Cleanup
        console.log('Cleaning up test data...');
        await Appointment.findByIdAndDelete(savedAppt._id);
        await Notification.deleteMany({ message: 'Test Appointment Notification' });

        console.log('--- TEST COMPLETE ---');
        process.exit(0);

    } catch (err) {
        console.error('CRITICAL TEST FAILURE:', err);
        process.exit(1);
    }
};

runTest();
