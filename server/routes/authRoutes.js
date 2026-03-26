const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Login Route (Unified)
const { sendOTP } = require('../utils/emailService');

// Login Step 1: Check Password & Send OTP (2FA)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check Super Admin (Bypass 2FA for dev convenience, or add it if needed. Keeping simple)
        const isSuperAdminEmail = email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
        if (isSuperAdminEmail && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign({ id: 'superadmin', type: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return res.json({ token, user: { name: 'Super Admin', type: 'admin' } });
        }

        // 2. Find User
        let user = await Admin.findOne({ username: email });
        let type = 'admin';

        if (!user) {
            user = await Patient.findOne({ email });
            type = 'patient';
        }

        if (!user) {
            user = await Doctor.findOne({ email });
            type = 'doctor';
        }

        if (!user) return res.status(404).json({ message: 'User not found' });

        // 3. Verify Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // 7. Check for Trusted Device Token (Skip OTP if valid)
        if (req.body.trustDeviceToken) {
            try {
                const decoded = jwt.verify(req.body.trustDeviceToken, process.env.JWT_SECRET);
                if (decoded.id === user._id.toString() && decoded.purpose === 'trusted_device') {
                    // Skip OTP, Login Immediately
                    const token = jwt.sign({ id: user._id, type }, process.env.JWT_SECRET, { expiresIn: '1h' });
                    const userObj = user.toObject();
                    delete userObj.password;
                    userObj.type = type;
                    return res.json({ token, user: userObj, trustDeviceToken: req.body.trustDeviceToken });
                }
            } catch (ignore) {
                // Token expired or invalid, proceed to OTP
            }
        }

        // --- EXEMPTION: SKIP OTP for Doctors and Admins (As per User Request) ---
        if (type === 'doctor' || type === 'admin' || type === 'lab') {
            const token = jwt.sign({ id: user._id, type }, process.env.JWT_SECRET, { expiresIn: '1h' });
            const userObj = user.toObject();
            delete userObj.password;
            userObj.type = type;

            // Generate Trust Token automatically for them
            const trustDeviceToken = jwt.sign({ id: user._id.toString(), purpose: 'trusted_device' }, process.env.JWT_SECRET, { expiresIn: '45m' });

            return res.json({ token, user: userObj, trustDeviceToken });
        }

        // OTP REMOVED: Directly Login
        const token = jwt.sign({ id: user._id, type }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const userObj = user.toObject();
        delete userObj.password;
        userObj.type = type;

        // Generate Trust Token automatically
        const trustDeviceToken = jwt.sign({ id: user._id.toString(), purpose: 'trusted_device' }, process.env.JWT_SECRET, { expiresIn: '7d' });

        return res.json({ token, user: userObj, trustDeviceToken });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Login Step 2: Verify OTP
router.post('/verify-login-otp', async (req, res) => {
    const { userId, otp, type } = req.body;

    try {
        let user;
        if (type === 'patient') user = await Patient.findById(userId);
        else if (type === 'doctor') user = await Doctor.findById(userId);
        else if (type === 'admin') user = await Admin.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or Expired OTP' });
        }

        // Clear OTP
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = jwt.sign({ id: user._id, type }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Return full user object minus sensitive data
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.otp;
        delete userObj.otpExpires;
        delete userObj.verificationToken;

        // Generate Trust Token (Valid for 45 mins)
        // Explicitly convert ID to string
        const trustDeviceToken = jwt.sign(
            { id: user._id.toString(), purpose: 'trusted_device' },
            process.env.JWT_SECRET,
            { expiresIn: '45m' }
        );

        res.json({ token, user: { ...userObj, type }, trustDeviceToken });

    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Google OAuth Login
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { name, email, picture } = ticket.getPayload();

        let user = await Patient.findOne({ email });
        let type = 'patient';

        if (!user) {
            // Check if it's a doctor logging in with Google (unlikely but possible)
            user = await Doctor.findOne({ email });
            if (user) type = 'doctor';
        }

        if (!user && type === 'patient') {
            // Create new patient from Google
            user = new Patient({
                name,
                email,
                password: '$2a$10$googleauthplaceholderDummyHashForSecurity',
                isGoogleAuth: true,
                isEmailVerified: true,  // Auto-verify Google users
                otp: undefined,
                otpExpires: undefined
            });
            await user.save();
        }

        // OTP REMOVED: Directly Login
        const jwtToken = jwt.sign({ id: user._id, type }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const userObj = user.toObject();
        delete userObj.password;
        userObj.type = type;

        // Generate Trust Token automatically
        const trustDeviceToken = jwt.sign({ id: user._id.toString(), purpose: 'trusted_device' }, process.env.JWT_SECRET, { expiresIn: '7d' });

        return res.json({ token: jwtToken, user: userObj, trustDeviceToken });

    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(401).json({ message: 'Invalid Google Token' });
    }
});

// Register Admin (One-time use or protected)
router.post('/register-admin', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ username, password: hashedPassword });
    await newAdmin.save();
    res.json({ message: 'Admin created' });
});

module.exports = router;
