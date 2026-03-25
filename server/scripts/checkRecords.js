const mongoose = require('mongoose');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');

const run = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/healthcare-portal');
        console.log('Connected to DB');

        const user = await Patient.findOne({ name: { $regex: 'nithish', $options: 'i' } });
        if (!user) {
            console.log('User nithish not found in Patients');
            return;
        }
        console.log('Found User:', user.name, user._id, user.type);

        const records = await MedicalRecord.find({ patientId: user._id });
        console.log(`Found ${records.length} records for patient ${user._id}`);
        records.forEach(r => {
            console.log(`- ${r.title} (${r.type}) uploaded by ${r.uploadedBy}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
