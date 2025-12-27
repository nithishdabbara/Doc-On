const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Doctor = require('../models/Doctor');

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const doctor = await Doctor.findOne().sort({ createdAt: -1 });

        console.log('--- LAST DOCTOR IN DB ---');
        console.log('ID:', doctor._id);
        console.log('Specialization:', doctor.specialization);
        console.log('Medical License:', doctor.medicalLicense);
        console.log('Registration Year:', doctor.registrationYear);
        console.log('State Council:', doctor.stateMedicalCouncil);

        if (doctor.medicalLicense === 'TEST-LIC-999') {
            console.log('>>> SUCCESS: License Saved correctly.');
        } else {
            console.log('>>> FAIL: License mismatch or missing.');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
