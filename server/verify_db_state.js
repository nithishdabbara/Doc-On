const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- DB CONNECTION SUCCESS ---');

        // Check for ANY doctors
        const doctors = await User.find({ role: 'doctor' });
        console.log(`Total Doctors Found: ${doctors.length}`);

        doctors.forEach(doc => {
            console.log(`DOCTOR: ${doc.name} ___ VERIFIED: ${doc.isVerified ? 'YES-TRUE' : 'NO-FALSE'} ___ ID: ${doc._id}`);
        });

        const pending = doctors.filter(d => !d.isVerified);
        console.log(`Pending Verification Count: ${pending.length}`);

        console.log('--- END REPORT ---');
        process.exit();
    } catch (err) {
        console.error('DB Error:', err);
        process.exit(1);
    }
};

checkDB();
