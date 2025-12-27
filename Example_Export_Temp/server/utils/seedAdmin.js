const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.log('Skipping Admin Seeding: ADMIN_EMAIL or ADMIN_PASSWORD not set.');
            return;
        }

        const existingUser = await User.findOne({ email: adminEmail });

        if (existingUser) {
            // "Forgot Password" Recovery Mechanism
            // Always ensure the Env Var admin has the Env Var password.
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            existingUser.password = hashedPassword;
            existingUser.role = 'admin'; // Ensure they are admin
            await existingUser.save();

            console.log(`[SEED] Admin ${adminEmail} synchronized with Environment Variables (Password Reset).`);
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            const newAdmin = new User({
                name: 'Super Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                isVerified: true,
                profile: {}
            });

            await newAdmin.save();
            console.log(`[SEED] New Admin created: ${adminEmail}`);
        }
    } catch (err) {
        console.error('[SEED] Admin seeding failed:', err.message);
    }
};

module.exports = seedAdmin;
