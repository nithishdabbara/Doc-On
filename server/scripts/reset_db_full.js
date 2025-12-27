const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');
const Invoice = require('../models/Invoice');
const MedicalRecord = require('../models/MedicalRecord');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Prescription = require('../models/Prescription');
const Review = require('../models/Review');
const Transaction = require('../models/Transaction');
const Otp = require('../models/Otp');

const seedAdmin = require('../utils/seedAdmin');

const resetDB = async () => {
    try {
        console.log('Connecting to DB...', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- DB CONNECTION SUCCESS ---');

        console.log('Wiping All Collections...');

        await User.deleteMany({});
        await Doctor.deleteMany({});
        await Patient.deleteMany({});
        await Appointment.deleteMany({});
        await Bill.deleteMany({});
        await Invoice.deleteMany({});
        await MedicalRecord.deleteMany({});
        await Message.deleteMany({});
        await Notification.deleteMany({});
        await Prescription.deleteMany({});
        await Review.deleteMany({});
        await Transaction.deleteMany({});
        await Otp.deleteMany({});

        console.log('>>> ALL DATA DELETED.');

        console.log('Re-Seeding Admin...');
        await seedAdmin();

        console.log('>>> RESET COMPLETE.');
        process.exit();
    } catch (err) {
        console.error('Reset Error:', err);
        process.exit(1);
    }
};

resetDB();
