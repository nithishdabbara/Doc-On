const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkNative = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const patients = await mongoose.connection.db.collection('patients').find({}).toArray();
        console.log(`Native Found ${patients.length} patients.`);

        patients.forEach(p => {
            console.log(`Patient: ${p.name}`);
            console.log(` - createdAt: ${p.createdAt}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkNative();
