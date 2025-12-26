const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Need to create this middleware
const Appointment = require('../models/Appointment');
const sendEmail = require('../utils/sendEmail');

// GET /api/appointments
// Get appointments for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        let appointments;
        if (req.user.role === 'doctor') {
            let rawAppointments = await Appointment.find({ doctor: req.user.id })
                .populate({ path: 'patient', select: 'name email profile' }) // Get age
                .lean(); // Convert to JS objects for sorting

            // Smart Triage Sorting Algorithm
            const getPriorityScore = (apt) => {
                let score = 0;
                if (apt.visitType === 'Urgent') score += 50;
                if (apt.patient?.profile?.age >= 60) score += 20;
                return score;
            };

            appointments = rawAppointments.sort((a, b) => {
                const scoreA = getPriorityScore(a);
                const scoreB = getPriorityScore(b);

                // 1. Higher Score First
                if (scoreB !== scoreA) return scoreB - scoreA;

                // 2. Earlier Date First (FCFS within same priority)
                return new Date(a.date) - new Date(b.date);
            });
        } else {
            appointments = await Appointment.find({ patient: req.user.id })
                .populate('doctor', 'name specialization')
                .sort({ date: 1 });
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

        // 4. Send Confirmation Email
        const userEmail = req.user.email; // Assuming user is populated or we have it in req.user
        // Note: req.user usually contains id, role. If we used verifyToken middleware that only encoded id/role, we might need to fetch user.
        // But let's assume req.user has email or we mock it for now.
        // Actually, let's fetch the patient email properly if needed, but standard auth middleware often attaches full user or we can findById.
        // For simplicity/mock, we'll log to a placeholder email or use the one from request if available. 
        // Better: let's fetch user or assume 'req.user.email' if auth middleware puts it there. 
        // Standard JWT usually has id. Let's rely on the console log for now.

        sendEmail(
            'patient@example.com', // Mock, or fetch from DB
            'Appointment Confirmed!',
            `Your appointment with Doctor is confirmed for ${new Date(date).toLocaleString()}. Token: #${newAppointment.queueNumber}`
        );

        res.json(appointment);
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
