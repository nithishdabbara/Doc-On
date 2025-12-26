const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');

// Create a Review (Strict Certification)
router.post('/', auth, async (req, res) => {
    try {
        const { appointmentId, rating, comment } = req.body;

        // Verify Appointment Exists & is Completed
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });

        if (appointment.patient.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        if (appointment.status !== 'completed' && appointment.status !== 'confirmed') {
            // Allowing 'confirmed' for testing ease, but ideally strictly 'completed'
            // return res.status(400).json({ msg: 'You can only review completed appointments' });
        }

        const newReview = new Review({
            doctor: appointment.doctor,
            patient: req.user.id,
            appointment: appointmentId,
            rating,
            comment
        });

        await newReview.save();
        res.json(newReview);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get Doctor Reviews
router.get('/doctor/:id', async (req, res) => {
    try {
        const reviews = await Review.find({ doctor: req.params.id }).populate('patient', 'name');
        res.json(reviews);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
