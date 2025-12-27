const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

const verifyLocal = async () => {
    try {
        // Hardcoded Local URI
        const localUri = 'mongodb://localhost:27017/healthcare';
        console.log('Connecting to LOCAL DB...', localUri);
        await mongoose.connect(localUri);

        const doctor = await Doctor.findOne({ medicalLicense: 'TEST-LIC-999' });

        if (doctor) {
            console.log('>>> FOUND IN LOCAL DB!');
            console.log('ID:', doctor._id);
            console.log('This confirms the server is still using Local DB.');
        } else {
            console.log('>>> NOT FOUND in Local DB either.');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyLocal();
