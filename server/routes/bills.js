const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Bill = require('../models/Bill');

// Get bills for logged in user
router.get('/', auth, async (req, res) => {
    try {
        const bills = await Bill.find({ patient: req.user.id })
            .populate('doctor', 'name')
            .sort({ date: -1 });
        res.json(bills);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create a bill (For testing/doctors)
router.post('/', auth, async (req, res) => {
    try {
        const { patientId, amount, description, appointmentId } = req.body;
        const newBill = new Bill({
            patient: patientId,
            doctor: req.user.id,
            amount,
            description,
            appointment: appointmentId
        });
        const bill = await newBill.save();
        res.json(bill);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Pay a bill
router.put('/:id/pay', auth, async (req, res) => {
    try {
        let bill = await Bill.findById(req.params.id);
        if (!bill) return res.status(404).json({ msg: 'Bill not found' });

        // Ensure user owns the bill
        if (bill.patient.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        bill.status = 'paid';
        await bill.save();
        res.json(bill);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/bills/analytics/revenue
router.get('/analytics/revenue', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const stats = await Bill.aggregate([
            {
                $group: {
                    _id: { $month: "$date" },
                    revenue: { $sum: "$amount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Transform to friendly format (Jan, Feb...)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Fill gaps with 0
        const currentMonthIndex = new Date().getMonth();
        const last6Months = [];

        for (let i = 5; i >= 0; i--) {
            let mIndex = currentMonthIndex - i;
            if (mIndex < 0) mIndex += 12;
            const monthName = months[mIndex];

            // Find stats for this month (MongoDB months are 1-indexed)
            const stat = stats.find(s => s._id === (mIndex + 1));

            last6Months.push({
                name: monthName,
                revenue: stat ? stat.revenue : 0
            });
        }

        res.json(last6Months);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
