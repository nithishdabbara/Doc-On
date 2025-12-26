const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');

// GET /api/users/stats
// Get dashboard statistics (Admin & Doctor)
router.get('/stats', auth, async (req, res) => {
    try {
        const role = req.user.role;
        let stats = {};

        if (role === 'admin') {
            const totalPatients = await User.countDocuments({ role: 'patient' });
            const totalDoctors = await User.countDocuments({ role: 'doctor' });
            const totalAppointments = await Appointment.countDocuments();

            // Revenue calc
            const bills = await Bill.find();
            const revenue = bills.reduce((acc, curr) => acc + curr.amount, 0);

            stats = {
                totalPatients,
                totalDoctors,
                totalAppointments,
                revenue
            };
        } else if (role === 'doctor') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Appointments UPCOMING (All Future)
            const appointmentsToday = await Appointment.countDocuments({
                doctor: req.user.id,
                date: {
                    $gte: today // All future appointments (including today)
                }
            });

            // Unique patients
            const distinctPatients = await Appointment.distinct('patient', { doctor: req.user.id });
            const totalPatients = distinctPatients.length;

            // Wallet/Earnings
            const doctorBills = await Bill.find({ doctor: req.user.id });
            const wallet = doctorBills.reduce((acc, curr) => acc + curr.amount, 0);

            stats = {
                appointmentsToday,
                totalPatients,
                wallet
            };
        }

        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/users/doctors
// Get all doctors
// Smart Match Algorithm Route
router.get('/doctors', async (req, res) => {
    try {
        const { search, specialty, city } = req.query;
        let query = { role: 'doctor', isVerified: true }; // ONLY approved doctors

        // Basic Filter
        if (specialty) {
            query.specialization = { $regex: specialty, $options: 'i' };
        }

        if (city) {
            query.city = { $regex: city, $options: 'i' };
        }

        // If "chest pain" or similar is passed as search query, we map it to specialization
        if (search) {
            const lowerSearch = search.toLowerCase();
            if (lowerSearch.includes('heart') || lowerSearch.includes('chest')) {
                query.specialization = 'Cardiologist';
            } else if (lowerSearch.includes('skin')) {
                query.specialization = 'Dermatologist';
            } else if (lowerSearch.includes('child') || lowerSearch.includes('baby')) {
                query.specialization = 'Pediatrician';
            } else {
                // Fallback to name search
                query.name = { $regex: search, $options: 'i' };
            }
        }

        let doctors = await User.find(query).select('-password');

        // AI-Lite Scoring (Mock Algorithm)
        // 1. Match Score: 10 if exact specialty match
        // 2. Rating Score: 5 * Rating (Mocked as random for now or 4.5 baseline)
        // 3. Availability Score: Higher if has slots

        const scoredDoctors = doctors.map(doc => {
            let score = 0;
            if (doc.specialization === (specialty || query.specialization)) score += 10;

            // Mock Rating for Sorting Demo
            const mockRating = 4.0 + (Math.random() * 1.0);
            score += mockRating * 5;

            return { ...doc._doc, score, rating: mockRating.toFixed(1) };
        });

        // Sort by Score Descending
        scoredDoctors.sort((a, b) => b.score - a.score);

        res.json(scoredDoctors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/users/doctors/:id
// Get specific doctor by ID
router.get('/doctors/:id', auth, async (req, res) => {
    try {
        const doctor = await User.findById(req.params.id).select('-password');
        if (!doctor || doctor.role !== 'doctor') {
            return res.status(404).json({ msg: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Doctor not found' });
        }
        res.status(500).send('Server Error');
    }
});


// PUT /api/users/availability
// Update availability (Doctors only)
router.put('/availability', auth, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ msg: 'Access denied. Doctors only.' });
        }

        const { availableSlots } = req.body; // Expecting array of Date strings

        // Update user
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { availableSlots: availableSlots } },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT /api/users/profile
// Update user profile (Patient mainly)
router.put('/profile', auth, async (req, res) => {
    try {
        const { age, gender, phone, address } = req.body;

        // Build profile object
        const profileFields = { age, gender, phone, address };

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { profile: profileFields } },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/users/admin/doctors-management
// Get ALL doctors for management (Verified & Pending)
router.get('/admin/doctors-management', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admins only.' });
        }
        // Return all doctors, sorted by Pending first
        const doctors = await User.find({ role: 'doctor' })
            .sort({ isVerified: 1, createdAt: -1 }) // isVerified: 1 (false comes first usually? No, false=0, true=1. We want false first.)
            // user.find sort bool: false < true. So 1 (asc) puts false first.
            .select('-password');
        res.json(doctors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/users/admin/patients
// Get patients (Admin: All, Doctor: Only Treated)
router.get('/admin/patients', auth, async (req, res) => {
    try {
        const role = req.user.role;

        if (role !== 'admin' && role !== 'doctor') {
            return res.status(403).json({ msg: 'Access denied.' });
        }

        let patients = [];

        if (role === 'admin') {
            // Admin sees ALL patients
            patients = await User.find({ role: 'patient' })
                .select('name email profile createdAt')
                .sort({ createdAt: -1 });
        } else if (role === 'doctor') {
            // Doctor sees ONLY treated patients (Privacy Rule)
            // 1. Find all appointments for this doctor
            const myAppointments = await Appointment.find({ doctor: req.user.id }).select('patient');

            // 2. Extract unique patient IDs
            const patientIds = [...new Set(myAppointments.map(appt => appt.patient.toString()))];

            // 3. Fetch details for these patients only
            patients = await User.find({ _id: { $in: patientIds } })
                .select('name email profile createdAt') // Safe fields only
                .sort({ name: 1 });
        }

        res.json(patients);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT /api/users/admin/verify/:id
// Approve a doctor
router.put('/admin/verify/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admins only.' });
        }
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { isVerified: true } },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE /api/users/delete-account
// Delete logged in user
router.delete('/delete-account', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Optional: Admin protection
        if (user.email === process.env.ADMIN_EMAIL) {
            return res.status(403).json({ msg: 'System Admin cannot be deleted.' });
        }

        await User.findByIdAndDelete(req.user.id);

        // FUTURE: Cascade delete appointments/bills if needed
        // await Appointment.deleteMany({ patient: req.user.id });

        res.json({ msg: 'Account deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

// GET /api/users/analytics/growth
router.get('/analytics/growth', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const stats = await User.aggregate([
            { $match: { role: 'patient' } },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    newPatients: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonthIndex = new Date().getMonth();
        const last6Months = [];

        for (let i = 5; i >= 0; i--) {
            let mIndex = currentMonthIndex - i;
            if (mIndex < 0) mIndex += 12;

            const stat = stats.find(s => s._id === (mIndex + 1));
            last6Months.push({
                name: months[mIndex],
                newPatients: stat ? stat.newPatients : 0
            });
        }
        res.json(last6Months);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
