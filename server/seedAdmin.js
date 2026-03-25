const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        // Check if admin exists
        const existing = await Admin.findOne({ username: 'admin' });
        if (existing) {
            console.log('Admin already exists');
            process.exit();
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);
        const newAdmin = new Admin({
            username: 'admin',
            password: hashedPassword
        });

        await newAdmin.save();
        console.log('Admin seeded successfully: admin / admin123');
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
