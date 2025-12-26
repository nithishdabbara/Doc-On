const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config({ path: './server/.env' });

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- DB CONNECTION SUCCESS ---');

        const doctors = await User.find({ role: 'doctor' });
        console.log(`Total Doctors Found: ${doctors.length}`);

        doctors.forEach(doc => {
            console.log(`- Name: ${doc.name}, Verified: ${doc.isVerified}, LicenseProof: ${doc.licenseProof ? 'YES' : 'NO'}`);
        });

        const pending = doctors.filter(d => !d.isVerified);
        console.log(`Pending Verification: ${pending.length}`);

        console.log('--- END REPORT ---');
        process.exit();
    } catch (err) {
        console.error('DB Error:', err);
        process.exit(1);
    }
};

checkDB();
