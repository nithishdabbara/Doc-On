const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Need to create this middleware
const Appointment = require('../models/Appointment');
const sendEmail = require('../utils/sendEmail');

const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const User = require('../models/User');

// GET /api/appointments
// Get appointments for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        let appointments = [];
        const role = req.user.role;
        console.log(`[DEBUG] GET /appointments hit. User: ${req.user.id}, Role: ${role}`);

        if (role === 'admin') {
            // Admin View: See ALL appointments
            const rawAppointments = await Appointment.find()
                .sort({ date: -1 })
                .populate('patient', 'name email')
                .lean();

            // Hydrate logic similar to others (simplified for Admin)
            appointments = await Promise.all(rawAppointments.map(async (apt) => {
                const doctorUser = await User.findById(apt.doctor);
                return {
                    ...apt,
                    doctor: doctorUser ? { name: doctorUser.name, email: doctorUser.email } : { name: 'Unknown' },
                    patient: apt.patient || { name: 'Unknown' }
                };
            }));

        } else if (role === 'doctor') {
            // 1. Fetch Appointments
            const rawAppointments = await Appointment.find({ doctor: req.user.id })
                .populate('patient', 'name email') // Populate basic User info
                .lean();

            // 2. Hydrate with Patient Profile (for Age/Gender)
            appointments = await Promise.all(rawAppointments.map(async (apt) => {
                if (!apt.patient) return null; // Skip if patient User deleted

                const patientProfile = await Patient.findOne({ user: apt.patient._id });
                return {
                    ...apt,
                    patient: {
                        ...apt.patient,
                        profile: patientProfile ? patientProfile.profile : {}
                    }
                };
            }));

            // Filter nulls
            appointments = appointments.filter(a => a !== null);

            // 3. Sorting (Priority Algorithm)
            const getPriorityScore = (apt) => {
                let score = 0;
                if (apt.visitType === 'Urgent') score += 50;
                if (apt.patient?.profile?.age >= 60) score += 20;
                return score;
            };

            appointments.sort((a, b) => {
                const scoreA = getPriorityScore(a);
                const scoreB = getPriorityScore(b);
                if (scoreB !== scoreA) return scoreB - scoreA;
                return new Date(a.date) - new Date(b.date);
            });

        } else {
            // Patient View
            console.log('[DEBUG] Patient fetching appointments. ID:', req.user.id);
            const rawAppointments = await Appointment.find({ patient: req.user.id })
                .sort({ date: 1 })
                .lean();
            console.log('[DEBUG] Raw Appointments Found:', rawAppointments.length);

            // Hydrate with Doctor User details AND Profile
            appointments = await Promise.all(rawAppointments.map(async (apt) => {
                // Manual Fetch to guarantee data
                const doctorUser = await User.findById(apt.doctor);
                if (!doctorUser) console.log('[DEBUG] Doctor User NOT FOUND for ID:', apt.doctor);

                const doctorProfile = await Doctor.findOne({ user: apt.doctor });

                if (!doctorUser) return null; // Skip if user deleted

                return {
                    ...apt,
                    doctor: {
                        _id: doctorUser._id,
                        name: doctorUser.name,
                        email: doctorUser.email,
                        specialization: doctorProfile ? doctorProfile.specialization : 'General',
                        hospitalName: doctorProfile ? doctorProfile.hospitalName : ''
                    }
                };
            }));

            appointments = appointments.filter(a => a !== null);
        }

        res.json(appointments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/appointments
// Create a new appointment
router.post('/', auth, async (req, res) => {
    try {
        const { doctorId, date, notes, visitType } = req.body;

        // Basic validation
        if (!doctorId || !date) {
            return res.status(400).json({ msg: 'Please provide doctor and date' });
        }

        // 1. Concurrency Check: Anti-Double Booking Shield
        const existingAppointment = await Appointment.findOne({
            doctor: doctorId,
            date: date,
            status: { $ne: 'cancelled' }
        });

        if (existingAppointment) {
            return res.status(400).json({ msg: 'Slot double-booked! Please choose another time.' });
        }

        const newAppointment = new Appointment({
            doctor: doctorId,
            patient: req.user.id,
            date,
            visitType,
            notes,
            status: 'pending'
        });

        // Calculate Queue Number for this day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const count = await Appointment.countDocuments({
            doctor: doctorId,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        newAppointment.queueNumber = count + 1; // Simple increment

        // 3. Telemedicine Link Logic
        if (visitType === 'Consultation' || visitType === 'Urgent') {
            const roomName = `DocOn-${Date.now()}-${req.user.id.slice(-4)}`;
            newAppointment.videoLink = `https://meet.jit.si/${roomName}`;
        }

        const appointment = await newAppointment.save();

        // 4. Generate Bill (Invoice) - Marked as PAID since it comes from Payment Gateway
        const Bill = require('../models/Bill');
        const Notification = require('../models/Notification'); // Ensure this model exists

        let visitCost = 500;
        if (visitType === 'Consultation') visitCost = 1000;
        if (visitType === 'Urgent') visitCost = 1500;

        const newBill = new Bill({
            patient: req.user.id,
            doctor: doctorId,
            appointment: appointment._id,
            amount: visitCost,
            description: `Consultation Fee - ${visitType}`,
            status: 'paid', // Assuming frontend payment success
            date: new Date()
        });
        await newBill.save();

        // 5. Create System Notifications
        // Notify Patient
        await new Notification({
            user: req.user.id,
            type: 'appointment',
            message: `Appointment confirmed with Dr. (ID: ${doctorId}) for ${new Date(date).toLocaleString()}`,
            data: { appointmentId: appointment._id }
        }).save();

        // Notify Doctor
        await new Notification({
            user: doctorId,
            type: 'appointment',
            message: `New Appointment: Patient ${req.user.name || 'Unknown'} for ${new Date(date).toLocaleString()}`,
            data: { appointmentId: appointment._id }
        }).save();

        // 6. Send Confirmation Email
        // ... (Send Email Logic)
        sendEmail(
            'patient@example.com',
            'Appointment Confirmed!',
            `Your appointment is confirmed. Invoice #${newBill._id} generated.`
        );

        res.json({ appointment, bill: newBill });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/appointments/queue-status/:doctorId
// Get live queue data
router.get('/queue-status/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Get all appointments for today
        const appointments = await Appointment.find({
            doctor: doctorId,
            date: { $gte: today, $lt: tomorrow },
            status: { $ne: 'cancelled' }
        }).sort({ queueNumber: 1 });

        // 2. Find currently serving (first pending or in-progress)
        const currentServing = appointments.find(a => a.status === 'pending' || a.status === 'confirmed');
        const currentToken = currentServing ? currentServing.queueNumber : (appointments.length > 0 ? 'Done' : 0);

        res.json({
            currentToken,
            totalPatients: appointments.length,
            queue: appointments.map(a => ({
                token: a.queueNumber,
                status: a.status,
                patientId: a.patient
            }))
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

// @route   PUT api/appointments/:id/status
// @desc    Update appointment status (Doctor only)
// @access  Private
router.put('/:id/status', auth, async (req, res) => {
    const { status } = req.body;

    try {
        let appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });

        // Verify user is the doctor of this appointment
        if (appointment.doctor.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        appointment.status = status;
        await appointment.save();
        res.json(appointment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
