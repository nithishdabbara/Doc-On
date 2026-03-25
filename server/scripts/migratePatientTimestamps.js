const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Patient = require('../models/Patient');

const migrateTimestamps = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const patients = await Patient.find({ createdAt: { $exists: false } });
        console.log(`Found ${patients.length} patients without timestamps.`);

        for (const p of patients) {
            const timestamp = p._id.getTimestamp();
            await Patient.findByIdAndUpdate(p._id, { $set: { createdAt: timestamp, updatedAt: timestamp } });
            console.log(`Updated ${p.name}: ${timestamp}`);
        }

        console.log('Migration Complete');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

migrateTimestamps();
