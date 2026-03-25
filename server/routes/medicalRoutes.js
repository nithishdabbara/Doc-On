const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const { verifyToken } = require('../middleware/auth');

// Setup Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Upload Record (Doctor or Patient)
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
    try {
        const { title, type, patientId, sharedWith } = req.body;

        // If uploader is doctor, patientId comes from body (we treat 'patientId' as the target user)
        // If uploader is patient, patientId is req.user.id
        let targetPatientId = req.user.type === 'patient' ? req.user.id : patientId;

        if (!targetPatientId) return res.status(400).json({ message: 'Patient ID required' });

        const newRecord = new MedicalRecord({
            patientId: targetPatientId,
            uploadedBy: req.user.type, // 'doctor' or 'patient'
            type: type || 'report',
            title: title || 'Medical Record',
            fileUrl: `/uploads/${req.file.filename}`,
            accessList: []
        });

        // If Doctor uploads, auto-add themselves to access list (implicit)
        // And maybe the patient obviously has access (it's their record).
        if (req.user.type === 'doctor') {
            newRecord.accessList.push(req.user.id);
        }

        // If Patient uploads, they might share it immediately (optional logic, skipping complex share for now)

        await newRecord.save();
        res.status(201).json({ message: 'File Uploaded', record: newRecord });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

const { checkDoctorAccess } = require('../middleware/accessMiddleware');

// Get Records for a Patient
router.get('/patient/:patientId', verifyToken, checkDoctorAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const query = { patientId };

        // If Access Level is "authorized_limited" (Historical view), filter by doctorId
        if (req.accessLevel === 'limited') {
            query.doctorId = req.user.id;
        }
        // If "authorized_full", they see everything (Active appointment)
        // No filter needed on query other than patientId.

        const records = await MedicalRecord.find(query).sort({ date: -1 });
        res.json(records);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
