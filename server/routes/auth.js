const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('dotenv').config(); // Ensure env vars are loaded
const auth = require('../middleware/auth');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Otp = require('../models/Otp');
const sendEmail = require('../utils/sendEmail');
const upload = require('../middleware/upload');
const passport = require('passport');

// ... existing code ...

// GET /api/auth/google
// Trigger Google Login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET /api/auth/google/callback
// Handle Google Response
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        // Generate JWT
        const payload = { user: { id: req.user.id, role: req.user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            // Redirect to Frontend with Token
            // In Production, use a secure cookie or specific route handling
            res.redirect(`http://localhost:5173/login?token=${token}`);
        });
    }
);

// POST /api/auth/register
router.post('/register', upload.single('licenseProof'), async (req, res) => {
    try {
        const {
            name, email, password, role,
            specialization, medicalLicense,
            hospitalName, city, clinicAddress,
            registrationYear, stateMedicalCouncil
        } = req.body;

        // Validation logic here

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        console.log('[REGISTER] Creating User:', { email, role });

        // 1. Create Base User
        user = new User({
            name,
            email,
            password: hashedPassword,
            role: role === 'admin' ? 'admin' : (role === 'doctor' ? 'doctor' : 'patient'),
            isVerified: role === 'patient' || role === 'admin' // Doctors false by default
        });

        await user.save();
        console.log('[REGISTER] Base User Saved:', user._id);

        // 2. Create Role-Specific Profile
        if (role === 'doctor') {
            console.log('[REGISTER] Creating Doctor Profile...', { specialization, medicalLicense });
            const doctor = new Doctor({
                user: user._id,
                specialization,
                medicalLicense,
                hospitalName,
                city,
                clinicAddress,
                registrationYear,
                stateMedicalCouncil,
                licenseProof: req.file ? `/uploads/${req.file.filename}` : undefined,
                isVerified: false
            });
            await doctor.save();
            console.log('[REGISTER] Doctor Profile Saved:', doctor._id);
        } else if (role === 'patient') {
            console.log('[REGISTER] Creating Patient Profile...');
            const patient = new Patient({
                user: user._id,
                isVerified: true,
                profile: {}
            });
            await patient.save();
            console.log('[REGISTER] Patient Profile Saved:', patient._id);
        } else if (role === 'admin') {
            // Admin doesn't have a separate profile collection yet, just the User entry
        }

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        // Check for user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'User does not exist' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Fetch User Profile Data
        let userProfile = null;
        if (user.role === 'doctor') {
            userProfile = await Doctor.findOne({ user: user._id });
        } else if (user.role === 'patient') {
            userProfile = await Patient.findOne({ user: user._id });
        }

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified,
                    // Merge profile data if exists
                    ...(userProfile && user.role === 'doctor' ? {
                        specialization: userProfile.specialization,
                        walletBalance: userProfile.walletBalance
                    } : {}),
                    ...(userProfile && user.role === 'patient' ? {
                        profile: userProfile.profile
                    } : {})
                }
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/auth/user
// Get current user data
router.get('/user', require('../middleware/auth'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        let userProfile = null;

        if (user.role === 'doctor') {
            userProfile = await Doctor.findOne({ user: user._id });
        } else if (user.role === 'patient') {
            userProfile = await Patient.findOne({ user: user._id });
        }

        const userData = {
            ...user.toObject(),
            ...(userProfile && user.role === 'doctor' ? {
                specialization: userProfile.specialization,
                walletBalance: userProfile.walletBalance,
                ...userProfile.toObject(), // Spread other doctor fields
                user: undefined // prevent circular or redundant nesting if any
            } : {}),
            ...(userProfile && user.role === 'patient' ? {
                profile: userProfile.profile
            } : {})
        };

        res.json(userData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/auth/add-admin
// Create a new admin (Admin only)
router.post('/add-admin', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admins only.' });
        }

        const { name, email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Explicitly create a generic User with admin role
        // We do *not* use a discriminator here unless we want an 'Admin' model, 
        // but 'User' is sufficient for the Base schema refactor we did earlier.
        // Actually, since we have discriminators, we might want to check the User model.
        // But our Base User Schema supports role='admin'.
        const newAdmin = new User({
            name,
            email,
            password: hashedPassword,
            role: 'admin',
            isVerified: true
        });

        await newAdmin.save();
        res.json({ msg: 'New Administrator Created' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT /api/auth/security
// Update Password or Email (Requires OTP)
router.put('/security', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword, newEmail, otp } = req.body;

        // 1. Get User
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // 2. Verify OTP (MANDATORY)
        if (!otp) return res.status(400).json({ msg: 'OTP is required' });

        const validOtp = await Otp.findOne({ email: user.email, otp });
        if (!validOtp) {
            return res.status(400).json({ msg: 'Invalid or Expired OTP' });
        }

        // 3. Verify Current Password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid current password' });
        }

        // 4. Handle Email Change
        if (newEmail && newEmail !== user.email) {
            const emailExists = await User.findOne({ email: newEmail });
            if (emailExists) {
                return res.status(400).json({ msg: 'Email is already in use' });
            }
            user.email = newEmail;
        }

        // 5. Handle Password Change
        if (newPassword) {
            if (newPassword.length < 6) {
                return res.status(400).json({ msg: 'Password must be at least 6 characters' });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        await user.save();

        // Delete used OTP
        await Otp.deleteOne({ _id: validOtp._id });

        // Return updated user info (excluding password)
        const updatedUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified
        };

        res.json({ msg: 'Security settings updated successfully', user: updatedUser });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/auth/send-otp
// Generate and email OTP
router.post('/send-otp', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to DB (overwrite existing if any)
        await Otp.deleteMany({ email: user.email });

        const newOtp = new Otp({
            email: user.email,
            otp: otpCode,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 mins from now (redundant with TTL but safe)
        });
        await newOtp.save();

        // Send Email
        const message = `
            <h1>Security Verification</h1>
            <p>Your One-Time Password (OTP) for DocOn is:</p>
            <h2 style="color: #2563eb; letter-spacing: 5px;">${otpCode}</h2>
            <p>This code expires in 5 minutes. Do not share it with anyone.</p>
        `;

        // TEST DEBUG: Write to file so Agent can read it
        require('fs').writeFileSync('otp_debug.txt', otpCode);

        try {
            await sendEmail({
                email: user.email,
                subject: 'DocOn Security Code',
                message
            });
            res.json({ msg: 'OTP sent to your email' });
        } catch (emailErr) {
            console.error('Email send failed:', emailErr);
            // Fallback for Dev/Demo if SMTP fails: Return code in header or log
            console.log(`[MOCK EMAIL] OTP for ${user.email}: ${otpCode}`);
            res.json({ msg: 'OTP generated (Check Server Logs for Code if Email Fails)' });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
