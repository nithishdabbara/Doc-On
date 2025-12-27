const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment'); // Added for Security Check
const upload = require('../middleware/upload');

// POST /api/records/upload
// Upload a new medical record
router.post('/upload', [auth, upload.single('file')], async (req, res) => {
    try {
        const { title, type, patientId } = req.body;

        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        let targetPatientId = req.user.id;
        let doctorId = null;

        // If Doctor is uploading
        if (req.user.role === 'doctor') {
            if (!patientId) {
                return res.status(400).json({ msg: 'Patient ID is required for doctor uploads' });
            }
            // Verify Relationship
            const relationship = await Appointment.findOne({
                doctor: req.user.id,
                patient: patientId
            });

            if (!relationship) {
                return res.status(403).json({ msg: 'Access denied. You have not treated this patient.' });
            }

            targetPatientId = patientId;
            doctorId = req.user.id;
        }

        const newRecord = new MedicalRecord({
            patient: targetPatientId,
            doctor: doctorId,
            title,
            type,
            fileUrl: `/uploads/${req.file.filename}`
        });

        const record = await newRecord.save();
        res.json(record);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/records
// Get all records for logged in user (if patient)
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            return res.status(403).json({ msg: 'Access denied. Medical records are private.' });
        }

        let records;
        if (req.user.role === 'patient') {
            records = await MedicalRecord.find({ patient: req.user.id }).sort({ date: -1 });
        } else {
            // For now, doctors don't have a "my records" view, but could view patient's records
            // Fallback for demo: return empty or implement specific doctor logic later
            records = [];
        }
        res.json(records);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE /api/records/:id
// Delete a record
router.delete('/:id', auth, async (req, res) => {
    try {
        const record = await MedicalRecord.findById(req.params.id);
        if (!record) return res.status(404).json({ msg: 'Record not found' });

        // Verify ownership
        if (record.patient.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await MedicalRecord.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Record removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/records/patient/:patientId
// Get specific patient's records (Doctor Only - Appointment Check)
router.get('/patient/:patientId', auth, async (req, res) => {
    try {
        const { patientId } = req.params;

        // 1. Role Check
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ msg: 'Access denied.' });
        }

        // 2. Relationship Check (Privacy)
        // Check if ANY appointment exists between this doctor and patient
        const relationship = await Appointment.findOne({
            doctor: req.user.id,
            patient: patientId
        });

        if (!relationship) {
            return res.status(403).json({ msg: 'Access denied. You have not treated this patient.' });
        }

        // 3. Fetch Records
        // Security Update: Only show records created by THIS doctor OR records with no specific doctor (patient uploads)
        // This prevents doctors from seeing records created by other doctors.
        const records = await MedicalRecord.find({
            patient: patientId,
            $or: [
                { doctor: req.user.id }, // Created by this doctor
                { doctor: null },        // Created by patient (no doctor ID)
                { doctor: { $exists: false } } // Handle legacy records without doctor field
            ]
        }).sort({ date: -1 });
        res.json(records);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
