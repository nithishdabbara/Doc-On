const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const LabBooking = require('../models/LabBooking');
const MedicalRecord = require('../models/MedicalRecord');

// Risk Analysis Engine
router.get('/analysis', verifyToken, async (req, res) => {
    try {
        const flags = [];
        let riskScore = 0;

        // 1. Doctor Rapid Booking Detection
        const Appointment = require('../models/Appointment');
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const doctorActivity = await Appointment.aggregate([
            { $match: { createdAt: { $gte: oneDayAgo } } },
            { $group: { _id: "$doctorId", count: { $sum: 1 } } },
            { $match: { count: { $gt: 10 } } } // Flag if > 10 appointments in 24h
        ]);

        doctorActivity.forEach(doc => {
            flags.push({
                id: `risk-doc-${doc._id}`,
                type: 'High Volume Booking',
                severity: doc.count > 20 ? 'High' : 'Medium',
                description: `Doctor ID ${doc._id} has received ${doc.count} bookings in the last 24 hours.`,
                date: new Date(),
                status: 'Investigating'
            });
            riskScore += doc.count > 20 ? 15 : 5;
        });

        // 2. Patient Frequent Lab Booking Detection
        const labActivity = await LabBooking.aggregate([
            { $match: { createdAt: { $gte: oneDayAgo } } },
            { $group: { _id: "$patientId", count: { $sum: 1 }, totalAmount: { $sum: "$totalAmount" } } },
            { $match: { count: { $gt: 3 } } } // Flag if > 3 lab bookings in 24h
        ]);

        labActivity.forEach(pat => {
            flags.push({
                id: `risk-pat-${pat._id}`,
                type: 'Frequent Lab Requests',
                severity: 'Low',
                description: `Patient ID ${pat._id} created ${pat.count} lab bookings recently, totaling ₹${pat.totalAmount}.`,
                date: new Date(),
                status: 'Open'
            });
            riskScore += 2;
        });

        // Calculate a safe 0-100 risk score based on active anomalies
        const normalizedRisk = Math.min(Math.max(riskScore, 0), 100);

        res.json({
            riskScore: normalizedRisk,
            activeFlags: flags
        });

    } catch (err) {
        console.error("Risk Analysis Error:", err);
        res.status(500).json({ message: "Risk analysis failed" });
    }
});

module.exports = router;
