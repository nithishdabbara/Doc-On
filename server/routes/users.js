const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');

// GET /api/users/stats
// Get dashboard statistics (Admin & Doctor)
router.get('/stats', auth, async (req, res) => {
    try {
        const role = req.user.role;
        let stats = {};

        if (role === 'admin') {
            const totalPatients = await Patient.countDocuments();
            const totalDoctors = await Doctor.countDocuments();
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
            // Verify if wallet is on Doctor model now
            const doctorProfile = await Doctor.findOne({ user: req.user.id });
            const wallet = doctorProfile ? doctorProfile.walletBalance : 0;

            stats = {
                appointmentsToday,
                totalPatients,
                wallet
            };
        } else if (role === 'patient') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = await Appointment.countDocuments({
                patient: req.user.id,
                date: { $gte: today },
                status: { $ne: 'cancelled' }
            });

            stats = { upcoming };
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
// GET /api/users/doctors
// Get all doctors
// Smart Match Algorithm Route
router.get('/doctors', async (req, res) => {
    try {
        const { search, specialty, city } = req.query;
        let query = { isVerified: true }; // ONLY approved doctors from Doctor collection

        // Scope variable for use in Query AND Scoring
        let symptomSpecialty = null;

        // 1. Filter by Specialization and City (Direct fields in Doctor model)
        if (specialty) {
            query.specialization = { $regex: specialty, $options: 'i' };
        }

        if (city) {
            query.city = { $regex: city, $options: 'i' };
        }

        // 2. Handle Search (Name OR Specialization OR Symptom)
        if (search) {
            const lowerSearch = search.toLowerCase().trim();
            const orConditions = [];

            // A. Raw Specialization Match (e.g. "Cardio" matches "Cardio")
            orConditions.push({ specialization: { $regex: search, $options: 'i' } });

            // B. Advanced Symptom Mapping
            if (['heart', 'chest', 'breath', 'cardio', 'bp', 'attack'].some(k => lowerSearch.includes(k))) {
                symptomSpecialty = 'Cardio'; // Covers Cardiologist, Cardiology, Cardio
            } else if (['skin', 'rash', 'acne', 'hair', 'derma', 'face'].some(k => lowerSearch.includes(k))) {
                symptomSpecialty = 'Derma'; // Covers Dermatologist, Dermatology
            } else if (['child', 'baby', 'infant', 'kid', 'pedi'].some(k => lowerSearch.includes(k))) {
                symptomSpecialty = 'Pedia'; // Pediatrician
            } else if (['tooth', 'teeth', 'gum', 'mouth', 'dental', 'cavity'].some(k => lowerSearch.includes(k))) {
                symptomSpecialty = 'Dent'; // Dentist, Dental
            } else if (['bone', 'joint', 'knee', 'back', 'fracture', 'ortho', 'pain'].some(k => lowerSearch.includes(k))) {
                symptomSpecialty = 'Ortho'; // Orthopedist, Orthopedic
            } else if (['eye', 'vision', 'sight', 'optic', 'blind'].some(k => lowerSearch.includes(k))) {
                symptomSpecialty = 'Ophthalm'; // Ophthalmologist
            } else if (['stomach', 'digest', 'gut', 'gastric', 'acid', 'vomit'].some(k => lowerSearch.includes(k))) {
                symptomSpecialty = 'Gastro'; // Gastroenterologist
            } else if (['fever', 'cold', 'flu', 'cough', 'headache', 'weak', 'viral'].some(k => lowerSearch.includes(k))) {
                symptomSpecialty = 'Physician'; // General Physician
            } else if (['brain', 'nerve', 'head', 'neuro', 'stroke'].some(k => lowerSearch.includes(k))) {
                symptomSpecialty = 'Neuro'; // Neurologist
            }

            if (symptomSpecialty) {
                // Using regex 'i' ensures 'Cardio' matches 'Cardiologist' as well
                orConditions.push({ specialization: { $regex: symptomSpecialty, $options: 'i' } });
            }

            // C. Name Search (via User collection)
            const users = await User.find({
                role: 'doctor',
                name: { $regex: search, $options: 'i' }
            }).select('_id');
            const nameUserIds = users.map(u => u._id);

            if (nameUserIds.length > 0) {
                orConditions.push({ user: { $in: nameUserIds } });
            }

            // Apply $or to the query
            if (orConditions.length > 0) {
                query.$or = orConditions;
            }
        }

        // Execute Query
        const doctors = await Doctor.find(query).populate('user', '-password');

        // 3. User Location Context (for Sorting only if no specific city filter)
        let userCity = null;
        if (!city && req.user && req.user.role === 'patient') {
            try {
                const patient = await Patient.findOne({ user: req.user.id });
                if (patient && patient.profile && patient.profile.address) {
                    userCity = patient.profile.address.toLowerCase();
                }
            } catch (cityErr) {
                // Silent fail for optional enhancement
            }
        }

        // 4. Scoring & Sorting
        const scoredDoctors = doctors.map(doc => {
            if (!doc.user) return null;

            let score = 0;

            // Specialty Match Bonus
            const targetSpec = specialty || (query && query.specialization) || symptomSpecialty;
            if (targetSpec && doc.specialization && doc.specialization === targetSpec) {
                score += 20;
            }

            // Location Relevance Bonus (if no direct city filter used)
            if (userCity && doc.city && typeof doc.city === 'string' && userCity.includes(doc.city.toLowerCase())) {
                score += 50; // HUGE boost for local doctors
            }

            // Mock Rating for Sorting
            const mockRating = 4.0 + (Math.random() * 1.0);
            score += mockRating * 5;

            return {
                _id: doc.user._id,
                doctorId: doc._id,
                name: doc.user.name,
                email: doc.user.email,
                role: doc.user.role,
                ...doc.toObject(),
                user: undefined,
                score,
                rating: mockRating.toFixed(1)
            };
        }).filter(d => d !== null);

        // Sort by Score Descending
        scoredDoctors.sort((a, b) => b.score - a.score);

        res.json(scoredDoctors);
    } catch (err) {
        console.error('[ERROR] Doctor Search Failed:', err);
        res.status(500).send('Server Error');
    }
});

// GET /api/users/doctors/:id
// Get specific doctor by ID (Expecting User ID from param)
router.get('/doctors/:id', auth, async (req, res) => {
    try {
        const userId = req.params.id;

        // Find Doctor Profile linked to this User ID
        const doctorProfile = await Doctor.findOne({ user: userId }).populate('user', '-password');

        if (!doctorProfile) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }

        // Merge for frontend
        const response = {
            _id: doctorProfile.user._id,
            doctorId: doctorProfile._id,
            name: doctorProfile.user.name,
            email: doctorProfile.user.email,
            role: doctorProfile.user.role,
            ...doctorProfile.toObject(),
            user: undefined
        };

        res.json(response);
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

        // Update Doctor model
        const doctor = await Doctor.findOneAndUpdate(
            { user: req.user.id },
            { $set: { availableSlots: availableSlots } },
            { new: true }
        );

        res.json(doctor);
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

        let updatedProfile;
        if (req.user.role === 'patient') {
            updatedProfile = await Patient.findOneAndUpdate(
                { user: req.user.id },
                { $set: { profile: profileFields } },
                { new: true, upsert: true } // Upsert in case missing
            );
        } else if (req.user.role === 'doctor') {
            // Doctors technically have fields on root, but if they had a profile obj style:
            // Our Doctor model has fields on root.
            // But the request sends profile fields.
            // If frontend sends 'clinicAddress' etc here, we capture it.
            // Assuming this endpoint is generic for 'profile':
            // If doctor uses this endpoint for address/phone?
            // Doctor model has 'city', 'clinicAddress'.
            // Let's assume this endpoint is Patient centric for now or map fields.
            // Simplest: Just handle Patient here as Doctor update is usually specific.
            // If User model had profile, we moved it.
        }

        // Return merged User + Profile
        // Actually frontend expects the updated user object or profile
        res.json(updatedProfile);
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

        const doctors = await Doctor.find()
            .populate('user', '-password')
            .sort({ isVerified: 1, createdAt: -1 });

        console.log('[DEBUG] Admin Fetch Doctors - Raw Count:', doctors.length);
        if (doctors.length > 0) {
            console.log('[DEBUG] First Doctor Data:', JSON.stringify(doctors[0], null, 2));
        }

        // Map to flat structure
        const flatDoctors = doctors.map(doc => ({
            _id: doc.user ? doc.user._id : doc._id,
            doctorId: doc._id,
            name: doc.user ? doc.user.name : 'Unknown',
            email: doc.user ? doc.user.email : 'Unknown',
            role: 'doctor', // Hardcoded as we queried doctors
            specialization: doc.specialization,
            isVerified: doc.isVerified,
            createdAt: doc.createdAt,
            licenseProof: doc.licenseProof,
            medicalLicense: doc.medicalLicense,
            registrationYear: doc.registrationYear,
            stateMedicalCouncil: doc.stateMedicalCouncil
        }));

        res.json(flatDoctors);
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
            const patientDocs = await Patient.find()
                .populate('user', 'name email createdAt')
                .sort({ createdAt: -1 });

            patients = patientDocs.map(p => ({
                _id: p.user ? p.user._id : p._id,
                name: p.user ? p.user.name : 'Unknown',
                email: p.user ? p.user.email : 'Unknown',
                profile: p.profile,
                createdAt: p.createdAt
            }));

        } else if (role === 'doctor') {
            // Doctor sees ONLY treated patients
            const myAppointments = await Appointment.find({ doctor: req.user.id }).select('patient');
            const patientUserIds = [...new Set(myAppointments.map(appt => appt.patient.toString()))];

            const patientDocs = await Patient.find({ user: { $in: patientUserIds } })
                .populate('user', 'name email createdAt');

            patients = patientDocs.map(p => ({
                _id: p.user ? p.user._id : p._id,
                name: p.user ? p.user.name : 'Unknown',
                email: p.user ? p.user.email : 'Unknown',
                profile: p.profile,
                createdAt: p.createdAt
            }));
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

        // Params.id is likely User ID passed from the management list (where we sent it as _id)
        // Update Doctor Model
        const doctor = await Doctor.findOneAndUpdate(
            { user: req.params.id },
            { $set: { isVerified: true } },
            { new: true }
        );

        if (!doctor) {
            // Fallback: Maybe they passed the Doctor ID?
            // Unlikely if we control the list, but safe to check?
            // Not for now, stick to User ID assumption.
            return res.status(404).json({ msg: 'Doctor profile not found' });
        }

        // Also update User Model to ensure login/auth works if dependent on it
        await User.findByIdAndUpdate(req.params.id, { isVerified: true });

        res.json(doctor);
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

        if (user.email === process.env.ADMIN_EMAIL) {
            return res.status(403).json({ msg: 'System Admin cannot be deleted.' });
        }

        // Delete User
        await User.findByIdAndDelete(req.user.id);

        // Cascade Delete Profile
        await Doctor.findOneAndDelete({ user: req.user.id });
        await Patient.findOneAndDelete({ user: req.user.id });

        res.json({ msg: 'Account deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/users/analytics/growth
router.get('/analytics/growth', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        // Aggregate on Patient collection
        const stats = await Patient.aggregate([
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

// POST /api/users/analyze-symptoms
// Analyze symptoms and return specialization + doctors
router.post('/analyze-symptoms', auth, async (req, res) => {
    try {
        const { symptoms } = req.body;
        if (!symptoms) return res.status(400).json({ msg: 'Please describe your symptoms' });

        const lowerSearch = symptoms.toLowerCase();
        let symptomSpecialty = null;
        let diagnosis = 'General Health Issue';

        // Reusing the mapping logic
        if (['heart', 'chest', 'breath', 'cardio', 'bp', 'attack'].some(k => lowerSearch.includes(k))) {
            symptomSpecialty = 'Cardio';
            diagnosis = 'Possible Cardiovascular Issue';
        } else if (['skin', 'rash', 'acne', 'hair', 'derma', 'face'].some(k => lowerSearch.includes(k))) {
            symptomSpecialty = 'Derma';
            diagnosis = 'Dermatological Concern';
        } else if (['child', 'baby', 'infant', 'kid', 'pedi'].some(k => lowerSearch.includes(k))) {
            symptomSpecialty = 'Pedia';
            diagnosis = 'Pediatric Concern';
        } else if (['tooth', 'teeth', 'gum', 'mouth', 'dental', 'cavity'].some(k => lowerSearch.includes(k))) {
            symptomSpecialty = 'Dent';
            diagnosis = 'Dental Issue';
        } else if (['bone', 'joint', 'knee', 'back', 'fracture', 'ortho', 'pain'].some(k => lowerSearch.includes(k))) {
            symptomSpecialty = 'Ortho';
            diagnosis = 'Orthopedic Issue';
        } else if (['eye', 'vision', 'sight', 'optic', 'blind'].some(k => lowerSearch.includes(k))) {
            symptomSpecialty = 'Ophthalm';
            diagnosis = 'Vision/Eye Issue';
        } else if (['stomach', 'digest', 'gut', 'gastric', 'acid', 'vomit'].some(k => lowerSearch.includes(k))) {
            symptomSpecialty = 'Gastro';
            diagnosis = 'Digestive/Gastric Issue';
        } else if (['fever', 'cold', 'flu', 'cough', 'headache', 'weak', 'viral'].some(k => lowerSearch.includes(k))) {
            symptomSpecialty = 'Physician';
            diagnosis = 'General Illness / Viral Infection';
        } else if (['brain', 'nerve', 'head', 'neuro', 'stroke'].some(k => lowerSearch.includes(k))) {
            symptomSpecialty = 'Neuro';
            diagnosis = 'Neurological Issue';
        } else {
            symptomSpecialty = 'General';
            diagnosis = 'General Consultation Recommended';
        }

        // Find Top 3 Doctors for this specialty
        let query = { isVerified: true };
        if (symptomSpecialty && symptomSpecialty !== 'General') {
            query.specialization = { $regex: symptomSpecialty, $options: 'i' };
        }

        const doctors = await Doctor.find(query).populate('user', 'name').limit(3);

        res.json({
            diagnosis,
            specialty: symptomSpecialty === 'Cardio' ? 'Cardiologist' :
                symptomSpecialty === 'Derma' ? 'Dermatologist' :
                    symptomSpecialty === 'Pedia' ? 'Pediatrician' :
                        symptomSpecialty === 'Dent' ? 'Dentist' :
                            symptomSpecialty === 'Ortho' ? 'Orthopedist' :
                                symptomSpecialty === 'Ophthalm' ? 'Ophthalmologist' :
                                    symptomSpecialty === 'Gastro' ? 'Gastroenterologist' :
                                        symptomSpecialty === 'Neuro' ? 'Neurologist' :
                                            'General Physician',
            rawSpecialty: symptomSpecialty,
            doctors: doctors.map(d => ({
                id: d.user._id,
                name: d.user.name,
                hospital: d.hospitalName
            }))
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
