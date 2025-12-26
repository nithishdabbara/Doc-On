const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Prescription = require('../models/Prescription');
const User = require('../models/User');

// @route   POST api/prescriptions
// @desc    Create a new prescription (Doctor only)
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { patientId, medications, notes, appointmentId } = req.body;

        if (req.user.role !== 'doctor') {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const newPrescription = new Prescription({
            doctor: req.user.id,
            patient: patientId,
            appointment: appointmentId,
            medications,
            notes
        });

        const prescription = await newPrescription.save();
        res.json(prescription);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/prescriptions/patient/:id
// @desc    Get prescriptions for a patient
// @access  Private
router.get('/patient/:id', auth, async (req, res) => {
    try {
        // Allow patient to see their own, and doctors to see any
        if (req.user.role === 'patient' && req.user.id !== req.params.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const prescriptions = await Prescription.find({ patient: req.params.id })
            .populate('doctor', 'name specialization')
            .sort({ date: -1 });

        res.json(prescriptions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
