const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const promoteToAdmin = async () => {
    // Get email from command line argument
    const email = process.argv[2];

    if (!email) {
        console.log('Usage: node promoteToAdmin.js <email>');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log(`SUCCESS: User ${user.name} (${user.email}) is now an ADMIN.`);
        console.log('You can now log in and access the Admin Dashboard.');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

promoteToAdmin();
