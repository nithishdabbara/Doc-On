const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/healthcare').then(async () => {
    try {
        const db = mongoose.connection.db;
        
        // Hash the password 'lab123'
        const hash = await bcrypt.hash('lab123', 10);
        
        // update ALL lab centres to use 'lab123'
        const result = await db.collection('labcentres').updateMany({}, { $set: { password: hash } });
        console.log(`Force updated password to 'lab123' for ${result.modifiedCount} labs.`);
        
        // If any labs don't have an email, give them one just in case
        const labs = await db.collection('labcentres').find({ email: { $exists: false } }).toArray();
        for (const lab of labs) {
            const emailBase = lab.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const email = `contact.${emailBase}@gmail.com`;
            await db.collection('labcentres').updateOne({ _id: lab._id }, { $set: { email: email } });
        }
        
        console.log('Database patch complete.');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
});
