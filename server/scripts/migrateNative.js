const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const migrateNative = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const collection = mongoose.connection.db.collection('patients');

        const patients = await collection.find({}).toArray();
        console.log(`Processing ${patients.length} patients...`);

        for (const p of patients) {
            const timestamp = p._id.getTimestamp();
            await collection.updateOne(
                { _id: p._id },
                { $set: { createdAt: timestamp, updatedAt: timestamp } }
            );
            console.log(`Updated ${p.name}: ${timestamp}`);
        }

        console.log('Native Migration Complete');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

migrateNative();
