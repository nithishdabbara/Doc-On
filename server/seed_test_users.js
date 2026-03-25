const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const LabCentre = require('./models/LabCentre');

dotenv.config({ path: './.env' });

async function seedUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        const passwordHash = await bcrypt.hash('password123', 10);

        // 1. Patient
        const patientData = {
            name: 'E2E Patient',
            email: 'patient@test.com',
            password: passwordHash,
            isEmailVerified: true, // Key: Bypass Verification
            isGoogleAuth: false
        };
        console.log("Attempting to create patient...");
        const p = await Patient.findOneAndUpdate({ email: patientData.email }, patientData, { upsert: true, new: true });
        console.log('✅ Verified Patient Created: patient@test.com', p._id);

        // 2. Doctor
        const doctorData = {
            name: 'Dr. E2E Test',
            email: 'doctor@test.com',
            password: passwordHash,
            specialization: 'General Physician',
            experience: 5,
            fees: 500,
            isEmailVerified: true,
            isVerified: true // Admin approval
        };
        await Doctor.findOneAndUpdate({ email: doctorData.email }, doctorData, { upsert: true, new: true });
        console.log('✅ Verified Doctor Created: doctor@test.com');

        // 3. Lab
        const labData = {
            name: 'E2E Diagnostics',
            email: 'lab@test.com',
            password: passwordHash,
            address: '123 Test St',
            contactNumber: '9999999999',
            isVerified: true
        };
        await LabCentre.findOneAndUpdate({ email: labData.email }, labData, { upsert: true, new: true });
        console.log('✅ Verified Lab Created: lab@test.com');

        process.exit();
    } catch (err) {
        console.error('❌ Seeding Failed:', err);
        process.exit(1);
    }
}

seedUsers();
