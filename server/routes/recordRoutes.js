// recordRoutes.js - Standardized Medical Record Management System
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MedicalRecord = require('../models/MedicalRecord');
const { verifyToken } = require('../middleware/auth');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// MIDDLEWARE: Block Admin Access (Privacy)
const blockAdmin = (req, res, next) => {
    if (req.user.type === 'admin') {
        return res.status(403).json({ message: 'Admin Restricted: Access to Medical Records Denied' });
    }
    next();
};

// Upload Record
router.post('/upload', verifyToken, blockAdmin, upload.single('file'), async (req, res) => {
    console.log("Creating Record. Body:", req.body);
    console.log("User:", req.user);
    console.log("File:", req.file);

    try {
        if (!req.file) {
            console.error("No file uploaded (Multer failed?)");
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { title, type, description } = req.body;
        // If doctor uploads, add self to access list
        const accessList = req.user.type === 'doctor' ? [req.user.id] : [];

        // Fix: Explicitly check for both id and _id from JWT or body
        const finalPatientId = (req.user.type === 'patient' ? (req.user.id || req.user._id) : (req.body.patientId || req.user.id));

        if (!finalPatientId) {
            console.error("Missing Patient ID");
            return res.status(400).json({ message: 'Patient ID missing' });
        }

        const newRecord = new MedicalRecord({
            patientId: finalPatientId,
            uploadedBy: req.user.type,
            type,
            title,
            description, // Extract text or notes
            fileUrl: req.file.filename,
            accessList
        });

        await newRecord.save();
        console.log("Record Saved:", newRecord);
        res.json({ message: 'Upload Successful', record: newRecord });
    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ message: 'Upload Failed: ' + err.message });
    }
});

// Share Record with Doctor
router.post('/share', verifyToken, blockAdmin, async (req, res) => {
    const { recordId, doctorId } = req.body;
    try {
        const record = await MedicalRecord.findOne({ _id: recordId, patientId: req.user.id });
        if (!record) return res.status(404).json({ message: 'Record not found or unauthorized' });

        if (!record.accessList.includes(doctorId)) {
            record.accessList.push(doctorId);
            await record.save();
        }
        res.json({ message: 'Shared successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error sharing' });
    }
});

// Get Records (Formatted for Security)
router.get('/:patientId', verifyToken, blockAdmin, async (req, res) => {
    try {
        let query = { patientId: req.params.patientId };

        // Privacy Logic
        if (req.user.type === 'doctor') {
            // Doctors only see what is shared with them OR what they uploaded?
            // "or created by them" logic if we stored author ID specifically, 
            // but for now checking accessList (which includes author if doctor) is safe.
            query.accessList = req.user.id;
        } else if (req.user.type === 'patient') {
            if (req.user.id !== req.params.patientId) return res.status(403).json({ message: 'Unauthorized' });
        }

        const records = await MedicalRecord.find(query).sort({ date: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Secure File Serve (Admin Blocked)
router.get('/file/:filename', verifyToken, blockAdmin, async (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);
    res.sendFile(filePath);
});

// Handling Multer Errors
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'Multer Error: ' + err.message });
    } else if (err) {
        return res.status(500).json({ message: 'Internal Server Error: ' + err.message });
    }
    next();
});

module.exports = router;
