const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const verify = async () => {
    try {
        console.log('Connecting to DB...', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- DB CONNECTION SUCCESS ---');

        // Clean up previous test runs with specific test emails
        const TEST_DOC_EMAIL = 'verify_doc_new@test.com';
        const TEST_PAT_EMAIL = 'verify_pat_new@test.com';

        // Cleanup based on User email
        const oldDocUser = await User.findOne({ email: TEST_DOC_EMAIL });
        if (oldDocUser) {
            await Doctor.findOneAndDelete({ user: oldDocUser._id });
            await User.findByIdAndDelete(oldDocUser._id);
            console.log('Cleaned up old test doctor.');
        }

        const oldPatUser = await User.findOne({ email: TEST_PAT_EMAIL });
        if (oldPatUser) {
            await Patient.findOneAndDelete({ user: oldPatUser._id });
            await User.findByIdAndDelete(oldPatUser._id);
            console.log('Cleaned up old test patient.');
        }

        // 1. Create Doctor
        console.log('\nCreating Test Doctor...');
        const docUser = new User({
            name: 'Verify Doctor',
            email: TEST_DOC_EMAIL,
            password: 'hashedpassword123',
            role: 'doctor',
            isVerified: false
        });
        await docUser.save();

        const doctor = new Doctor({
            user: docUser._id,
            specialization: 'Neurologist Test',
            isVerified: false
        });
        await doctor.save();
        console.log('Doctor Created.');

        // 2. Create Patient
        console.log('\nCreating Test Patient...');
        const patUser = new User({
            name: 'Verify Patient',
            email: TEST_PAT_EMAIL,
            password: 'hashedpassword123',
            role: 'patient',
            isVerified: true
        });
        await patUser.save();

        const patient = new Patient({
            user: patUser._id,
            profile: { age: 30 }
        });
        await patient.save();
        console.log('Patient Created.');

        // 3. Verify Collections
        console.log('\n--- VERIFICATION REPORT ---');

        const userCount = await User.countDocuments();
        const docCount = await Doctor.countDocuments();
        const patCount = await Patient.countDocuments();

        console.log(`TOTAL USERS (Auth): ${userCount}`);
        console.log(`TOTAL DOCTORS (Collection): ${docCount}`);
        console.log(`TOTAL PATIENTS (Collection): ${patCount}`);

        // Verify Data Integrity
        const foundDoc = await Doctor.findOne({ user: docUser._id }).populate('user');
        console.log(`\nFound New Doctor: ${foundDoc.user.name} - ${foundDoc.specialization}`);

        if (foundDoc.user.email === TEST_DOC_EMAIL && foundDoc.specialization === 'Neurologist Test') {
            console.log('>>> DOCTOR VERIFICATION: PASSED');
        } else {
            console.log('>>> DOCTOR VERIFICATION: FAILED');
        }

        const foundPat = await Patient.findOne({ user: patUser._id }).populate('user');
        console.log(`Found New Patient: ${foundPat.user.name} - Age: ${foundPat.profile.age}`);

        if (foundPat.user.email === TEST_PAT_EMAIL && foundPat.profile.age === 30) {
            console.log('>>> PATIENT VERIFICATION: PASSED');
        } else {
            console.log('>>> PATIENT VERIFICATION: FAILED');
        }

        process.exit();
    } catch (err) {
        console.error('Verify Error:', err);
        process.exit(1);
    }
};

verify();
